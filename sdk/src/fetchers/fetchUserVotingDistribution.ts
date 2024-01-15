import {request} from '@wingriders/cab/helpers'

import {UserVotingDistributionFilter, UserVotingDistributionResponse} from '../api'

type RequiredContext = {
  governanceUrl: string
}

export const fetchUserVotingDistribution =
  (context: RequiredContext) =>
  (
    userVotingDistributionFilter: UserVotingDistributionFilter
  ): Promise<UserVotingDistributionResponse> =>
    request(
      `${context.governanceUrl}/userVotingDistribution`,
      'POST',
      JSON.stringify(userVotingDistributionFilter),
      {
        'Content-Type': 'application/json',
      }
    )
