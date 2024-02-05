import type {createQueriesClient} from './queriesClient'

export type QueryContext = {
  governanceUrl: string
}

export type QueriesClient = ReturnType<typeof createQueriesClient>
