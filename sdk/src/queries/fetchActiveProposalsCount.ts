import {request} from '@wingriders/cab/helpers'

import {QueryContext} from './types'

type RequiredContext = QueryContext

export const fetchActiveProposalsCount = (context: RequiredContext) => (): Promise<number> =>
  request(`${context.governanceUrl}/activeProposalsCount`)
