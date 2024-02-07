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

type ProposalResults = {
  result: 'PASSED' | 'FAILED'
  /** <choice name, voting power> */
  choices: Record<string, number>
  /** total voting power used to vote for this proposal (including abstained) */
  total: number
  /** total voting power used to vote for the abstain choice */
  abstained: number
  note: string
}

type BuildFinalizeProposalParams = {
  /** transaction hash where the proposal was created */
  proposalTxHash: HexString
  results: ProposalResults
  /** address where the collateral should be sent */
  beneficiary: Address
} & BuildActionParams

export type FinalizeProposalMetadata = {
  transactionFee: api.Coin
  txHash: api.TxHash
}

type RequiredContext = ActionContext

export const buildFinalizeProposalAction =
  ({protocolParameters, network, governanceVotingParams}: RequiredContext) =>
  (jsApi: api.JsAPI): BuildAction<BuildFinalizeProposalParams, FinalizeProposalMetadata> =>
  async ({
    proposalTxHash,
    results,
    beneficiary,
  }: BuildFinalizeProposalParams): Promise<BuildActionResult<FinalizeProposalMetadata>> => {
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
      planId: 'finalize-proposal',
      inputs: [{isScript: false, utxo: proposalUtxo}],
      outputs: [
        {
          address: beneficiary as Address,
          coins: proposalUtxo.coins,
          tokenBundle: proposalUtxo.tokenBundle,
        },
      ],
      metadata: {
        // NOTE: this structure is not final and could be extended
        custom: new Map([
          [
            GovMetadatumLabel.COMMUNITY_VOTING_MANAGE,
            new Map<TxMetadatum, TxMetadatum>([
              ['op', GovManagementOp.CONCLUDE_PROPOSAL],
              ['id', Buffer.from(proposalTxHash, 'hex')],
              ['result', results.result],
              ['choices', new Map<TxMetadatum, TxMetadatum>(Object.entries(results.choices))],
              ['total', results.total],
              ['abstained', results.abstained],
              ['note', splitMetadatumString(results.note)],
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
      // skip potential other proposal UTxOs - those should be spent only when cancelling/finalizing them
      ignoredUTxOs: utxos
        .filter(isPotentialProposalUTxO(governanceVotingParams.governanceToken))
        .map(normalizeTxInput),
    })

    const transactionFee = new BigNumber(txAux.fee) as api.Coin
    const txHash = txAux.getId() as api.TxHash

    const metadata: FinalizeProposalMetadata = {
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
