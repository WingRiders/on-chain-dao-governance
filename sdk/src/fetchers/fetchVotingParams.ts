import {GovernanceVotingParamsResponse} from '../api'
import {request} from '@wingriders/cab/helpers'

type RequiredContext = {
  governanceUrl: string
}

export const fetchVotingParams =
  (context: RequiredContext) => (): Promise<GovernanceVotingParamsResponse> =>
    request(`${context.governanceUrl}/params`)
