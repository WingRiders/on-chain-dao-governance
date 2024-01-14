import {UserVotingDistributionFilter, UserVotingDistributionResponse} from '@wingriders/governance-sdk'

export interface VotesDistribution {
  getTheoreticalMaxVotingPower: () => Promise<number>
  getUserVotingDistribution: (f: UserVotingDistributionFilter) => Promise<UserVotingDistributionResponse>
}
