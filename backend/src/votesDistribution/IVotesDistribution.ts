import {UserVotingDistributionFilter, UserVotingDistributionResponse} from '@wingriders/governance-sdk'

export interface IVotesDistribution {
  getTheoreticalMaxVotingPower: () => Promise<number>
  getUserVotingDistribution: (f: UserVotingDistributionFilter) => Promise<UserVotingDistributionResponse>
}
