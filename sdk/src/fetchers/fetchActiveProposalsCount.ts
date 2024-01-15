import {request} from '@wingriders/cab/helpers'

type RequiredContext = {
  governanceUrl: string
}

export const fetchActiveProposalsCount = (context: RequiredContext) => (): Promise<number> =>
  request(`${context.governanceUrl}/activeProposalsCount`)
