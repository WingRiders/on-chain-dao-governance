import {useMutation} from 'react-query'

import {ActionsClient} from '@wingriders/governance-sdk'
import {useDaoGovernanceContext} from '../context'

const buildUseAction = <TArgs, TRes>(
  getAction: (c: ActionsClient) => (args: TArgs) => Promise<TRes>
) => {
  return () => {
    const {actionsClient} = useDaoGovernanceContext() ?? {}
    return useMutation((args: TArgs) => {
      if (!actionsClient)
        throw new Error(
          'ActionsClient not initialized. Wrap your app in <DaoGovernanceProvider /> and pass in actionsClient.'
        )
      return getAction(actionsClient)(args)
    })
  }
}

export const useCancelProposalAction = buildUseAction((client) => client.cancelProposal)
export const useCastVoteAction = buildUseAction((client) => client.castVote)
export const useCreateProposalAction = buildUseAction((client) => client.createProposal)
export const useConcludeProposalAction = buildUseAction((client) => client.concludeProposal)
export const useSignTxAction = buildUseAction((client) => client.signTx)
export const useSubmitTxAction = buildUseAction((client) => client.submitTx)
