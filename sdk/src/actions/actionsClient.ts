import {NETWORKS} from '@wingriders/cab/constants'
import {Wallet as WalletApi} from '@wingriders/cab/dappConnector'
import {NetworkName, ProtocolParameters} from '@wingriders/cab/types'

import {LibError, LibErrorCode} from '../errors'
import {getNetworkNameFromWallet, withJsAPI} from '../helpers/walletApi'
import {GovernanceVotingParams} from '../types'
import {buildCancelProposalAction} from './buildCancelProposal'
import {buildCastVoteAction} from './buildCastVote'
import {buildCreateProposalAction} from './buildCreateProposal'
import {buildFinalizeProposalAction} from './buildFinalizeProposal'
import {ActionContext} from './types'

type CreateActionsClientArgs = {
  networkName: NetworkName
  walletApi: WalletApi
  protocolParameters: ProtocolParameters
  governanceVotingParams: GovernanceVotingParams
}

export const createActionsClient = async ({
  networkName: configNetworkName,
  walletApi,
  protocolParameters,
  governanceVotingParams,
}: CreateActionsClientArgs) => {
  const walletNetworkName = await getNetworkNameFromWallet(walletApi)
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
    cancelProposal: withJsAPI(walletApi, buildCancelProposalAction(actionContext)),
    castVote: withJsAPI(walletApi, buildCastVoteAction(actionContext)),
    createProposal: withJsAPI(walletApi, buildCreateProposalAction(actionContext)),
    finalizeProposal: withJsAPI(walletApi, buildFinalizeProposalAction(actionContext)),
  }
}
