import * as api from '@wingriders/cab/dappConnector'
import {computeMinUTxOLovelaceAmount} from '@wingriders/cab/ledger/transaction'
import {BigNumber, TxOutputType, TxPlanArgs, ZeroLovelace} from '@wingriders/cab/types'

import {buildTx} from '../helpers/actions'
import {encodeAddProposalOperation} from '../helpers/encodeMetadatum'
import {GovMetadatumLabel, GovernanceVotingParams, PollMetadatum, ProposalMetadatum} from '../types'
import {ActionContext, BuildAction, BuildActionParams} from './types'

export type BuildCreateProposalParams = {
  proposal: ProposalMetadatum
  /** Either an existing poll or a new poll */
  poll: PollMetadatum
} & BuildActionParams

export type CreateProposalMetadata = {
  minAda: api.Coin
  transactionFee: api.Coin
  txHash?: api.TxHash
  proposal: ProposalMetadatum
  poll: PollMetadatum
  governanceVotingParams: GovernanceVotingParams
  // collateral UTxO
  utxoRef: api.TxInput
}

type RequiredContext = ActionContext

export const buildCreateProposalAction =
  ({protocolParameters, network, governanceVotingParams}: RequiredContext) =>
  (jsApi: api.JsAPI): BuildAction<BuildCreateProposalParams, CreateProposalMetadata> =>
  async ({proposal, poll}: BuildCreateProposalParams) => {
    const {governanceToken, proposalCollateralQuantity, proposalsAddress} = governanceVotingParams
    const collateralBundle = [{...governanceToken.asset, quantity: proposalCollateralQuantity}]
    const coins = computeMinUTxOLovelaceAmount({
      minUtxoDepositCoefficient: protocolParameters.minUtxoDepositCoefficient,
      output: {
        type: TxOutputType.LEGACY,
        isChange: false,
        address: proposalsAddress,
        coins: ZeroLovelace,
        tokenBundle: collateralBundle,
      },
    })

    const planArgs: TxPlanArgs = {
      planId: 'create-proposal',
      outputs: [
        {
          address: governanceVotingParams.proposalsAddress,
          coins,
          tokenBundle: collateralBundle,
        },
      ],
      metadata: {
        // NOTE for now custom metadatum until it gets standardised and moved to cab
        custom: new Map([
          [GovMetadatumLabel.COMMUNITY_VOTING_MANAGE, encodeAddProposalOperation(proposal, poll)],
        ]),
      },
      protocolParameters,
    }

    const {tx, txAux, txWitnessSet} = await buildTx({jsApi, planArgs, network})

    const transactionFee = new BigNumber(txAux.fee) as api.Coin

    const metadata = {
      minAda: new BigNumber(coins) as api.Coin,
      transactionFee,
      proposal,
      poll,
      governanceVotingParams,
      utxoRef: {
        index: new BigNumber(0) as api.UInt,
        txHash: txAux.getId() as api.TxHash,
      },
    }

    return {
      tx,
      txAux,
      txWitnessSet,
      metadata,
    }
  }
