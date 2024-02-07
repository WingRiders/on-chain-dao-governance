import {ActionsClient, QueriesClient} from '@wingriders/governance-sdk'

export type DaoGovernanceContextType = {
  queriesClient: QueriesClient
  actionsClient?: ActionsClient
}
