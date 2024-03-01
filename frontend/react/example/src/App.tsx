import {Container, CssBaseline} from '@mui/material'
import {useCallback, useMemo, useState} from 'react'

import {DaoGovernanceProvider} from '@wingriders/governance-frontend-react-sdk'

import {CreateProposal} from './features/createProposal/CreateProposal'
import {Proposals} from './features/proposals/Proposals'
import {WalletContext, WalletContextType} from './features/wallet/ConnectWalletContext'
import {createQueriesClient} from '@wingriders/governance-sdk'
import {PaidFees} from './features/paidFees/PaidFees'
import {CurrentData} from './features/currentData/CurrentData'
import {Header} from './features/navigation/Header'
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'
import {LocalizationProvider} from '@mui/x-date-pickers'
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFnsV3'

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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <WalletContext.Provider value={memoizedWalletContext}>
        <DaoGovernanceProvider
          queriesClient={queriesClient}
          actionsClient={walletContext?.actionsClient}
        >
          <BrowserRouter>
            <CssBaseline />
            <Header />
            <Container maxWidth="lg" sx={{py: 4}}>
              <Routes>
                <Route path="/" element={<Navigate to="/proposals" />} />
                <Route path="/proposals" element={<Proposals />} />
                <Route path="/proposals/new" element={<CreateProposal />} />
                <Route path="/paid-fees" element={<PaidFees />} />
                <Route path="/current-data" element={<CurrentData />} />
              </Routes>
            </Container>
          </BrowserRouter>
        </DaoGovernanceProvider>
      </WalletContext.Provider>
    </LocalizationProvider>
  )
}
