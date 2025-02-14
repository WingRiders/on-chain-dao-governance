import * as api from '@wingriders/cab/dappConnector'
import {TxSignErrorCode} from '@wingriders/cab/dappConnector'
import {UnexpectedErrorSubCode} from '@wingriders/cab/errors'
import {
  evaluateTxBodyFactory,
  getEvaluatedTxPlan,
  validityIntervalToSlots,
} from '@wingriders/cab/helpers'
import {hasSpendingScript} from '@wingriders/cab/ledger/address'
import {
  TxSigned,
  getTxPlan,
  prepareTxAux,
  prepareTxWitnessSet,
  signedTransaction,
} from '@wingriders/cab/ledger/transaction'
import {Network, TxPlanArgs, TxWitnessSet, UTxO} from '@wingriders/cab/types'
import {
  normalizeTx,
  reverseAddress,
  reverseUtxos,
  reverseVKeyWitnesses,
} from '@wingriders/cab/wallet/connector'

import {BuiltTxInfo, SignedTxInfo} from '../actions/types'
import {LibError, LibErrorCode} from '../errors'
import {calculateValidityInterval} from './validityInterval'
import {getWalletOwner} from './walletAddress'

interface BuildTxProps {
  jsApi: api.JsAPI
  planArgs: TxPlanArgs
  network: Network
  backendServerUrl?: string
  // UTxOs that will not be used to build the tx
  ignoredUTxOs?: api.TxInput[]
}

export const buildTx = async ({
  jsApi,
  planArgs,
  network,
  backendServerUrl,
  ignoredUTxOs,
}: BuildTxProps): Promise<BuiltTxInfo> => {
  const changeAddress = reverseAddress(await getWalletOwner(jsApi))

  const canBeUsed = (utxo: Pick<UTxO, 'txHash' | 'outputIndex'>) =>
    !ignoredUTxOs ||
    ignoredUTxOs.findIndex(
      ({txHash, index}) => txHash === utxo.txHash && index.toNumber() === utxo.outputIndex
    ) === -1

  const utxos = reverseUtxos(await jsApi.getUtxos({withoutLocked: true})).filter(canBeUsed)
  const walletCollaterals = !planArgs.potentialCollaterals
    ? reverseUtxos(await jsApi.getCollateral())
    : undefined

  const txPlanResult = backendServerUrl
    ? await getEvaluatedTxPlan({
        txPlanArgs: {potentialCollaterals: walletCollaterals, ...planArgs},
        utxos,
        changeAddress,
        evaluateTxBodyFn: evaluateTxBodyFactory(backendServerUrl),
        ...(planArgs.validityInterval
          ? validityIntervalToSlots(network, planArgs.validityInterval)
          : {}),
      })
    : getTxPlan({potentialCollaterals: walletCollaterals, ...planArgs}, utxos, changeAddress)

  if (txPlanResult.success === false) {
    const origErrorMessage = txPlanResult.error?.message
    const errorMessage = [
      'Unable to create tx',
      `Reason: ${txPlanResult.error?.reason || 'internal'}`,
      ...(origErrorMessage ? [`Message: ${origErrorMessage}`] : []),
    ].join('. ')
    if (txPlanResult.error?.subCode === UnexpectedErrorSubCode.InsufficientAda) {
      throw new LibError(LibErrorCode.InsufficientAdaForTx, errorMessage)
    }
    throw new LibError(LibErrorCode.InternalError, errorMessage)
  }

  const validityInterval = planArgs.validityInterval || calculateValidityInterval(network)
  const {validityIntervalStart, ttl} = validityIntervalToSlots(network, validityInterval)

  const txAux = prepareTxAux(txPlanResult.txPlan, ttl, validityIntervalStart)

  const txWitnessSet = prepareTxWitnessSet(txPlanResult.txPlan)
  const tx = normalizeTx(txAux, txWitnessSet)

  return {tx, txAux, txWitnessSet}
}

type SignTxProps = {
  jsApi: api.JsAPI
} & BuiltTxInfo

export const signTx = async ({jsApi, tx, txAux, txWitnessSet}: SignTxProps): Promise<SignedTxInfo> => {
  const txHash = txAux.getId() as api.TxHash

  const hasScriptInputs = txAux.inputs.some((utxo) => hasSpendingScript(utxo.address))
  let signatures: api.TxWitnessSet
  try {
    signatures = await jsApi.signTx(tx, txHash, {partialSign: hasScriptInputs})
  } catch (error: any) {
    if (error.code === TxSignErrorCode.UserDeclined) {
      throw new LibError(LibErrorCode.UserDeclinedTx, error.info)
    } else if (error.code === TxSignErrorCode.ProofGeneration) {
      throw new LibError(LibErrorCode.ProofGenerationTx, error.info)
    } else {
      throw error
    }
  }
  // only use the signatures from the returned witness set
  const txWitnessSetWithSignatures: TxWitnessSet = {
    ...txWitnessSet,
    vKeyWitnesses: reverseVKeyWitnesses(signatures.vKeyWitnesses || []),
  }

  const signedTx = normalizeTx(txAux, txWitnessSetWithSignatures)
  const cborizedTx = signedTransaction(txAux, txWitnessSetWithSignatures)

  return {
    signedTx,
    cborizedTx,
    txHash: cborizedTx.txHash as api.TxHash,
  }
}

interface SubmitTxProps {
  jsApi: api.JsAPI
  cborizedTx: TxSigned
}

export const submitTx = async ({jsApi, cborizedTx}: SubmitTxProps): Promise<api.TxHash> => {
  try {
    return await jsApi.submitRawTx(cborizedTx.txBody as api.HexString, cborizedTx.txHash as api.TxHash)
  } catch (error: any) {
    throw new LibError(LibErrorCode.TxSubmitFailed, error.info, error, cborizedTx.txBody)
  }
}
