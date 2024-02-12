import {request} from '@wingriders/cab/helpers'

import {PaidFeesFilter, PaidFeesResponse} from '../types'
import {QueryContext} from './types'

type RequiredContext = QueryContext

export const fetchPaidFees =
  (context: RequiredContext) =>
  (filter?: PaidFeesFilter): Promise<PaidFeesResponse> =>
    request(
      `${context.governanceUrl}/paidFees`,
      'POST',
      JSON.stringify(filter),
      filter ? {'Content-Type': 'application/json'} : undefined
    )
