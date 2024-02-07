import * as api from '@wingriders/cab/dappConnector'
import {splitMetadatumString} from '@wingriders/cab/ledger/transaction'
import {Address, BigNumber, HexString, TxMetadatum, TxPlanArgs} from '@wingriders/cab/types'
import {normalizeTxInput, reverseAddress, reverseUtxos} from '@wingriders/cab/wallet/connector'

import {LibError, LibErrorCode} from '../errors'
import {buildTx} from '../helpers/actions'
import {getWalletOwner} from '../helpers/walletAddress'
import {GovManagementOp, GovMetadatumLabel} from '../types'
import {isPotentialProposalUTxO} from './helpers'
import {ActionContext, BuildAction, BuildActionParams, BuildActionResult} from './types'

type BuildCancelProposalParams = {
  /** transaction hash where the proposal was created */
  proposalTxHash: HexString
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
    proposalTxHash,
    reason,
    beneficiary,
  }: BuildCancelProposalParams): Promise<BuildActionResult<CancelProposalMetadata>> => {
    const ownerAddress = reverseAddress(await getWalletOwner(jsApi))
    if (ownerAddress !== governanceVotingParams.proposalsAddress) {
      throw new LibError(LibErrorCode.BadRequest, 'Only the governance wallet can cancel proposals')
    }

    const utxos = reverseUtxos(await jsApi.getUtxos()) ?? []
    const proposalUtxo = utxos.find((utxo) => utxo.txHash === proposalTxHash)
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
            new Map<TxMetadatum, TxMetadatum>([
              ['op', GovManagementOp.CANCEL_PROPOSAL],
              ['id', Buffer.from(proposalTxHash, 'hex')],
              ['reason', splitMetadatumString(reason)],
            ]),
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
        .filter(isPotentialProposalUTxO(governanceVotingParams.governanceToken))
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
