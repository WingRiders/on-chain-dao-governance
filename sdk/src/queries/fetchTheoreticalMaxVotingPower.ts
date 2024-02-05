import {request} from '@wingriders/cab/helpers'

import {QueryContext} from './types'

type RequiredContext = QueryContext

export const fetchTheoreticalMaxVotingPower = (context: RequiredContext) => (): Promise<number> =>
  request(`${context.governanceUrl}/theoreticalMaxVotingPower`)
