import {request} from '@wingriders/cab/helpers'

import {ProposalsResponse} from '../types'
import {QueryContext} from './types'

type RequiredContext = QueryContext

export const fetchProposals = (context: RequiredContext) => (): Promise<ProposalsResponse> =>
  request(`${context.governanceUrl}/proposals`)
