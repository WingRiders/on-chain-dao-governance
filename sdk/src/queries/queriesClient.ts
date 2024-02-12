import {fetchActiveProposalsCount} from './fetchActiveProposalsCount'
import {fetchPaidFees} from './fetchPaidFees'
import {fetchProposal} from './fetchProposal'
import {fetchProposals} from './fetchProposals'
import {fetchProtocolParameters} from './fetchProtocolParameters'
import {fetchTheoreticalMaxVotingPower} from './fetchTheoreticalMaxVotingPower'
import {fetchUserVotableProposalsCount} from './fetchUserVotableProposalsCount'
import {fetchUserVotes} from './fetchUserVotes'
import {fetchUserVotingDistribution} from './fetchUserVotingDistribution'
import {fetchVotes} from './fetchVotes'
import {fetchVotingParams} from './fetchVotingParams'
import {QueryContext} from './types'

type CreateQueriesClientArgs = {
  governanceUrl: string
}

export const createQueriesClient = ({governanceUrl}: CreateQueriesClientArgs) => {
  const queryContext: QueryContext = {
    governanceUrl,
  }

  return {
    fetchActiveProposalsCount: fetchActiveProposalsCount(queryContext),
    fetchProposal: fetchProposal(queryContext),
    fetchProposals: fetchProposals(queryContext),
    fetchTheoreticalMaxVotingPower: fetchTheoreticalMaxVotingPower(queryContext),
    fetchUserVotableProposalsCount: fetchUserVotableProposalsCount(queryContext),
    fetchUserVotes: fetchUserVotes(queryContext),
    fetchUserVotingDistribution: fetchUserVotingDistribution(queryContext),
    fetchVotes: fetchVotes(queryContext),
    fetchVotingParams: fetchVotingParams(queryContext),
    fetchProtocolParameters: fetchProtocolParameters(queryContext),
    fetchPaidFees: fetchPaidFees(queryContext),
  }
}
