import {request} from '@wingriders/cab/helpers'

import {GovernanceVotingParamsResponse} from '../api'

type RequiredContext = {
  governanceUrl: string
}

export const fetchVotingParams =
  (context: RequiredContext) => (): Promise<GovernanceVotingParamsResponse> =>
    request(`${context.governanceUrl}/params`)
