import {QueryKey, useQuery} from 'react-query'

import {QueriesClient} from '@wingriders/governance-sdk'

import {useDaoGovernanceContext} from '../context'

const buildUseQuery = <TArgs extends any[], TRes, TQueryKey extends QueryKey>(
  key: TQueryKey,
  getFetcher: (c: QueriesClient) => (...args: TArgs) => Promise<TRes>
) => {
  /**
   * query will be skipped and will return `undefined` if args is `undefined`
   */
  return (args: TArgs | undefined) => {
    const {queriesClient} = useDaoGovernanceContext() ?? {}
    if (!queriesClient)
      throw new Error(
        'QueriesClient not initialized. Wrap your app in <DaoGovernanceProvider /> and pass in queriesClient.'
      )
    return useQuery<TRes | undefined, [TQueryKey, TArgs | undefined]>([key, args], () => {
      if (!args) {
        return undefined
      }
      return getFetcher(queriesClient)(...args)
    })
  }
}

export const useActiveProposalsCountQuery = buildUseQuery(
  'activeProposalsCount',
  (client) => client.fetchActiveProposalsCount
)
export const useProposalsQuery = buildUseQuery('proposals', (client) => client.fetchProposals)
export const useProposalQuery = buildUseQuery('proposal', (client) => client.fetchProposal)
export const useTheoreticalMaxVotingPowerQuery = buildUseQuery(
  'theoreticalMaxVotingPower',
  (client) => client.fetchTheoreticalMaxVotingPower
)
export const useUserVotableProposalsCountPowerQuery = buildUseQuery(
  'userVotableProposalsCount',
  (client) => client.fetchUserVotableProposalsCount
)
export const useUserVotesQuery = buildUseQuery('userVotes', (client) => client.fetchUserVotes)
export const useUserVotingDistributionQuery = buildUseQuery(
  'userVotingDistribution',
  (client) => client.fetchUserVotingDistribution
)
export const useVotesQuery = buildUseQuery('votes', (client) => client.fetchVotes)
export const useVotingParamsQuery = buildUseQuery('votingParams', (client) => client.fetchVotingParams)
export const useProtocolParametersQuery = buildUseQuery(
  'protocolParameters',
  (client) => client.fetchProtocolParameters
)
export const usePaidFeesQuery = buildUseQuery('paidFees', (client) => client.fetchPaidFees)
