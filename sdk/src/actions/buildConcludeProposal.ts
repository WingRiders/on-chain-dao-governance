import * as api from '@wingriders/cab/dappConnector'
import {Address, BigNumber, TxInputRef, TxPlanArgs} from '@wingriders/cab/types'
import {normalizeTxInput, reverseAddress, reverseUtxos} from '@wingriders/cab/wallet/connector'

import {LibError, LibErrorCode} from '../errors'
import {encodeConcludeProposalOperation} from '../helpers'
import {buildTx} from '../helpers/actions'
import {getWalletOwner} from '../helpers/walletAddress'
import {GovMetadatumLabel, ProposalResults} from '../types'
import {isPotentialProposalUTxO} from './helpers'
import {ActionContext, BuildAction, BuildActionParams, BuildActionResult} from './types'

export type BuildConcludeProposalParams = {
  /** UTxO ref where the proposal was created */
  proposalTxRef: TxInputRef
  results: ProposalResults
  /** address where the collateral should be sent */
  beneficiary: Address
} & BuildActionParams

export type ConcludeProposalMetadata = {
  transactionFee: api.Coin
  txHash: api.TxHash
}

type RequiredContext = ActionContext

export const buildConcludeProposalAction =
  ({protocolParameters, network, governanceVotingParams}: RequiredContext) =>
  (jsApi: api.JsAPI): BuildAction<BuildConcludeProposalParams, ConcludeProposalMetadata> =>
  async ({
    proposalTxRef,
    results,
    beneficiary,
  }: BuildConcludeProposalParams): Promise<BuildActionResult<ConcludeProposalMetadata>> => {
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
      planId: 'conclude-proposal',
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
            encodeConcludeProposalOperation(proposalTxRef.txHash, results),
          ],
        ]),
      },
      protocolParameters,
    }

    const {tx, txAux, txWitnessSet} = await buildTx({
      jsApi,
      planArgs,
      network,
      // skip potential other proposal UTxOs - those should be spent only when cancelling/concluding them
      ignoredUTxOs: utxos
        .filter(isPotentialProposalUTxO(governanceVotingParams.governanceToken.asset))
        .map(normalizeTxInput),
    })

    const transactionFee = new BigNumber(txAux.fee) as api.Coin
    const txHash = txAux.getId() as api.TxHash

    const metadata: ConcludeProposalMetadata = {
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
