import {request} from '@wingriders/cab/helpers'

import {UserVotingDistributionFilter, UserVotingDistributionResponse} from '../types'
import {QueryContext} from './types'

type RequiredContext = QueryContext

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
