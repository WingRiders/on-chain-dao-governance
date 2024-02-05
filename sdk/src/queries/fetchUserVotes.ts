import {request} from '@wingriders/cab/helpers'

import {UserVotesFilter, UserVotesResponse} from '../types'
import {QueryContext} from './types'

type RequiredContext = QueryContext

export const fetchUserVotes =
  (context: RequiredContext) =>
  (userVotesFilter: UserVotesFilter): Promise<UserVotesResponse> =>
    request(`${context.governanceUrl}/votes`, 'POST', JSON.stringify(userVotesFilter), {
      'Content-Type': 'application/json',
    })
