import {request} from '@wingriders/cab/helpers'
import {HexString} from '@wingriders/cab/types'

import {QueryContext} from './types'

type RequiredContext = QueryContext

export const fetchUserVotableProposalsCount =
  (context: RequiredContext) =>
  (ownerStakeKeyHash: HexString): Promise<number> =>
    request(
      `${context.governanceUrl}/userVotableProposalsCount`,
      'POST',
      JSON.stringify({ownerStakeKeyHash}),
      {
        'Content-Type': 'application/json',
      }
    )
