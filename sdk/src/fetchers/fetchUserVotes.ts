import {request} from '@wingriders/cab/helpers'
import {UserVotesFilter, UserVotesResponse} from '../api'

type RequiredContext = {
  governanceUrl: string
}

export const fetchUserVotes =
  (context: RequiredContext) =>
  (userVotesFilter: UserVotesFilter): Promise<UserVotesResponse> =>
    request(`${context.governanceUrl}/votes`, 'POST', JSON.stringify(userVotesFilter), {
      'Content-Type': 'application/json',
    })
