import {request} from '@wingriders/cab/helpers'

import {VoteAggregationByProposalResponse, VotesFilter} from '../types'
import {QueryContext} from './types'

type RequiredContext = QueryContext

export const fetchVotes =
  (context: RequiredContext) =>
  (votesFilter: VotesFilter): Promise<VoteAggregationByProposalResponse> =>
    request(`${context.governanceUrl}/votes`, 'POST', JSON.stringify(votesFilter), {
      'Content-Type': 'application/json',
    })
