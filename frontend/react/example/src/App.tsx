import {Container, CssBaseline} from '@mui/material'
import {useCallback, useMemo, useState} from 'react'

import {DaoGovernanceProvider} from '@wingriders/governance-frontend-react-sdk'

import {CreateProposal} from './CreateProposal'
import {Proposals} from './Proposals'
import {WalletContext, WalletContextType} from './ConnectWalletContext'
import {createQueriesClient} from '@wingriders/governance-sdk'
import {PaidFees} from './PaidFees'
import {UserVotingDistribution} from './CurrentVotingDistribution'
import {Header} from './Header'
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'

const queriesClient = createQueriesClient({
  governanceUrl: 'http://127.0.0.1:3240',
})
export const App = () => {
  const [walletContext, setWalletContext] = useState<WalletContextType | null>(null)
  const handleSetWalletContext = useCallback(
    (newContext: WalletContextType | null) => {
      setWalletContext(newContext)
    },
    [setWalletContext]
  )

  const memoizedWalletContext = useMemo(
    () => ({...walletContext, setWalletContext: handleSetWalletContext}),
    [walletContext, handleSetWalletContext]
  )

  return (
    <WalletContext.Provider value={memoizedWalletContext}>
      <DaoGovernanceProvider queriesClient={queriesClient} actionsClient={walletContext?.actionsClient}>
        <BrowserRouter>
          <CssBaseline />
          <Header />
          <Container maxWidth="lg" sx={{pt: 4}}>
            <Routes>
              <Route path="/" element={<Navigate to="/proposals" />} />
              <Route path="/proposals" element={<Proposals />} />
              <Route path="/proposals/new" element={<CreateProposal />} />
              <Route path="/paid-fees" element={<PaidFees />} />
              <Route path="/voting-distribution" element={<UserVotingDistribution />} />
            </Routes>
          </Container>
        </BrowserRouter>
      </DaoGovernanceProvider>
    </WalletContext.Provider>
  )
}
