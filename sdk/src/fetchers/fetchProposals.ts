import {request} from '@wingriders/cab/helpers'

import {ProposalsResponse} from '../api'

type RequiredContext = {
  governanceUrl: string
}

export const fetchProposals = (context: RequiredContext) => (): Promise<ProposalsResponse> =>
  request(`${context.governanceUrl}/proposals`)
