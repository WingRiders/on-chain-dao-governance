import * as api from '@wingriders/cab/dappConnector'
import {Address, BigNumber, TxInputRef, TxPlanArgs} from '@wingriders/cab/types'
import {normalizeTxInput, reverseAddress, reverseUtxos} from '@wingriders/cab/wallet/connector'

import {LibError, LibErrorCode} from '../errors'
import {encodeCancelProposalOperation} from '../helpers'
import {buildTx} from '../helpers/actions'
import {getWalletOwner} from '../helpers/walletAddress'
import {GovMetadatumLabel} from '../types'
import {isPotentialProposalUTxO} from './helpers'
import {ActionContext, BuildAction, BuildActionParams, BuildActionResult} from './types'

export type BuildCancelProposalParams = {
  /** UTxO ref where the proposal was created */
  proposalTxRef: TxInputRef
  /** The reason for the cancellation */
  reason: string
  /** The address where the collateral should be sent */
  beneficiary: Address
} & BuildActionParams

export type CancelProposalMetadata = {
  transactionFee: api.Coin
  txHash: api.TxHash
}

type RequiredContext = ActionContext

export const buildCancelProposalAction =
  ({protocolParameters, network, governanceVotingParams}: RequiredContext) =>
  (jsApi: api.JsAPI): BuildAction<BuildCancelProposalParams, CancelProposalMetadata> =>
  async ({
    proposalTxRef,
    reason,
    beneficiary,
  }: BuildCancelProposalParams): Promise<BuildActionResult<CancelProposalMetadata>> => {
    const ownerAddress = reverseAddress(await getWalletOwner(jsApi))
    if (ownerAddress !== governanceVotingParams.proposalsAddress) {
      throw new LibError(LibErrorCode.BadRequest, 'Only the governance wallet can cancel proposals')
    }

    const utxos = reverseUtxos(await jsApi.getUtxos()) ?? []
    const proposalUtxo = utxos.find(
      (utxo) => utxo.txHash === proposalTxRef.txHash && utxo.outputIndex === proposalTxRef.outputIndex
    )
    if (!proposalUtxo) {
      throw new LibError(LibErrorCode.BadRequest, 'Proposal not found/already spent.')
    }

    const planArgs: TxPlanArgs = {
      planId: 'cancel-proposal',
      inputs: [{isScript: false, utxo: proposalUtxo}],
      outputs: [
        {
          address: beneficiary as Address,
          coins: proposalUtxo.coins,
          tokenBundle: proposalUtxo.tokenBundle,
        },
      ],
      metadata: {
        custom: new Map([
          [
            GovMetadatumLabel.COMMUNITY_VOTING_MANAGE,
            encodeCancelProposalOperation(proposalTxRef.txHash, reason),
          ],
        ]),
      },
      protocolParameters,
    }

    const {tx, txAux, txWitnessSet} = await buildTx({
      jsApi,
      planArgs,
      network,
      // skip potential proposal UTxOs - those are proposals and should be spent only when rejecting/evaluating
      ignoredUTxOs: utxos
        .filter(isPotentialProposalUTxO(governanceVotingParams.governanceToken.asset))
        .map(normalizeTxInput),
    })

    const transactionFee = new BigNumber(txAux.fee) as api.Coin
    const txHash = txAux.getId() as api.TxHash

    const metadata: CancelProposalMetadata = {
      transactionFee,
      txHash,
    }

    return {
      tx,
      txAux,
      txWitnessSet,
      metadata,
    }
  }
