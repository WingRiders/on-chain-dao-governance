import {request} from '@wingriders/cab/helpers'
import {ProtocolParameters} from '@wingriders/cab/types'

import {QueryContext} from './types'

type RequiredContext = QueryContext

export const fetchProtocolParameters = (context: RequiredContext) => (): Promise<ProtocolParameters> =>
  request(`${context.governanceUrl}/protocolParameters`)
