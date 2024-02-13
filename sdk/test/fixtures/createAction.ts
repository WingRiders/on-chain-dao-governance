import {NETWORKS} from '@wingriders/cab/constants'
import {JsAPI} from '@wingriders/cab/dappConnector'
import {NetworkName} from '@wingriders/cab/types'

import {ActionContext} from '../../src'
import {GOVERNANCE_VOTING_PARAMS} from './data/governanceVotingParams'
import {PREPROD_PROTOCOL_PARAMETERS} from './data/protocolParameters'

/**
 * creates a new action function with injected context and jsApi
 */
export const createAction = <TArgs extends any[], TRes>(
  action: (context: ActionContext) => (jsAPi: JsAPI) => (...args: TArgs) => Promise<TRes>,
  jsApi: JsAPI,
  network: NetworkName = NetworkName.PREPROD
) => {
  const actionContext: ActionContext = {
    network: NETWORKS[network],
    protocolParameters: PREPROD_PROTOCOL_PARAMETERS,
    governanceVotingParams: GOVERNANCE_VOTING_PARAMS,
  }

  return action(actionContext)(jsApi)
}
