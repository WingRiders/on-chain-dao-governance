import {ReactNode, createContext, useContext} from 'react'
import {
  QueryClient as ReactQueryClient,
  QueryClientProvider as ReactQueryClientProvider,
  useQueryClient as useReactQueryClient,
} from 'react-query'

import {ActionsClient, QueriesClient} from '@wingriders/governance-sdk'
import {DaoGovernanceContextType} from './types'

const DaoGovernanceContext = createContext<DaoGovernanceContextType | null>(null)

export const useDaoGovernanceContext = () => useContext(DaoGovernanceContext)

export {useReactQueryClient}

const reactQueryClient = new ReactQueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

type DaoGovernanceProviderProps = {
  queriesClient: QueriesClient
  actionsClient?: ActionsClient
  children?: ReactNode
}

export const DaoGovernanceProvider = ({
  queriesClient,
  actionsClient,
  children,
}: DaoGovernanceProviderProps) => {
  return (
    <ReactQueryClientProvider client={reactQueryClient}>
      <DaoGovernanceContext.Provider value={{queriesClient, actionsClient}}>
        {children}
      </DaoGovernanceContext.Provider>
    </ReactQueryClientProvider>
  )
}
