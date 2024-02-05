import {request} from '@wingriders/cab/helpers'

import {GovernanceVotingParamsResponse} from '../types'
import {QueryContext} from './types'

type RequiredContext = QueryContext

export const fetchVotingParams =
  (context: RequiredContext) => (): Promise<GovernanceVotingParamsResponse> =>
    request(`${context.governanceUrl}/params`)
