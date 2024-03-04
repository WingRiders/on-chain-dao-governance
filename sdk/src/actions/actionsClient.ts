import {NETWORKS} from '@wingriders/cab/constants'
import {JsAPI} from '@wingriders/cab/dappConnector'
import {NetworkName, ProtocolParameters} from '@wingriders/cab/types'

import {LibError, LibErrorCode} from '../errors'
import {getNetworkNameFromWallet} from '../helpers/walletApi'
import {GovernanceVotingParams} from '../types'
import {buildCancelProposalAction} from './buildCancelProposal'
import {buildCastVoteAction} from './buildCastVote'
import {buildConcludeProposalAction} from './buildConcludeProposal'
import {buildCreateProposalAction} from './buildCreateProposal'
import {signTxAction} from './signTx'
import {submitTxAction} from './submitTx'
import {ActionContext} from './types'

type CreateActionsClientArgs = {
  networkName: NetworkName
  jsApi: JsAPI
  protocolParameters: ProtocolParameters
  governanceVotingParams: GovernanceVotingParams
}

export const createActionsClient = async ({
  networkName: configNetworkName,
  jsApi,
  protocolParameters,
  governanceVotingParams,
}: CreateActionsClientArgs) => {
  const walletNetworkName = await getNetworkNameFromWallet(jsApi)
  if (walletNetworkName !== configNetworkName) {
    throw new LibError(
      LibErrorCode.NetworkMismatch,
      `Actions client expected ${configNetworkName} but wallet is on ${walletNetworkName}.`
    )
  }

  const network = NETWORKS[configNetworkName]

  const actionContext: ActionContext = {
    network,
    protocolParameters,
    governanceVotingParams,
  }

  return {
    cancelProposal: buildCancelProposalAction(actionContext)(jsApi),
    castVote: buildCastVoteAction(actionContext)(jsApi),
    createProposal: buildCreateProposalAction(actionContext)(jsApi),
    concludeProposal: buildConcludeProposalAction(actionContext)(jsApi),
    signTx: signTxAction()(jsApi),
    submitTx: submitTxAction()(jsApi),
  }
}
