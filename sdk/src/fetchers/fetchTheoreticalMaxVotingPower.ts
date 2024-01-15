import {request} from '@wingriders/cab/helpers'

type RequiredContext = {
  governanceUrl: string
}

export const fetchTheoreticalMaxVotingPower = (context: RequiredContext) => (): Promise<number> =>
  request(`${context.governanceUrl}/theoreticalMaxVotingPower`)
