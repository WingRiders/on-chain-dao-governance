import {request} from '@wingriders/cab/helpers'
import {BigNumber} from '@wingriders/cab/types'

import {GovernanceVotingParams, GovernanceVotingParamsResponse} from '../types'
import {QueryContext} from './types'

type RequiredContext = QueryContext

export const fetchVotingParams =
  (context: RequiredContext) => async (): Promise<GovernanceVotingParams> => {
    const response: GovernanceVotingParamsResponse = await request(`${context.governanceUrl}/params`)
    return {
      proposalsAddress: response.proposalsAddress,
      proposalCollateralQuantity: new BigNumber(response.proposalCollateralQuantity),
      governanceToken: response.governanceToken,
    }
  }
