import {Network, ProtocolParameters} from '@wingriders/cab/types'

import {GovernanceVotingParams} from '../types'
import type {createActionsClient} from './actionsClient'

export type ActionContext = {
  network: Network
  protocolParameters: ProtocolParameters
  governanceVotingParams: GovernanceVotingParams
}

export type ActionsClient = ReturnType<typeof createActionsClient>
