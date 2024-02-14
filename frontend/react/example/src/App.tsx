import {AppBar, Box, Container, CssBaseline, Stack, Toolbar, Typography} from '@mui/material'
import {useCallback, useMemo, useState} from 'react'

import {DaoGovernanceProvider} from '@wingriders/governance-frontend-react-sdk'

import {CreateProposal} from './CreateProposal'
import {Proposals} from './Proposals'
import {WalletContext, WalletContextType} from './ConnectWalletContext'
import {ConnectWalletButton} from './ConnectWalletButton'
import {createQueriesClient} from '@wingriders/governance-sdk'
import {PaidFees} from './PaidFees'
import {UserVotingDistribution} from './UserVotingDistribution'

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
        <Box>
          <CssBaseline />
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                On-Chain DAO governance Example
              </Typography>
              <ConnectWalletButton />
            </Toolbar>
          </AppBar>
          <Container maxWidth="lg">
            <Stack spacing={2} pt={2}>
              <PaidFees />
              <UserVotingDistribution />
              <CreateProposal />
              <Proposals />
            </Stack>
          </Container>
        </Box>
      </DaoGovernanceProvider>
    </WalletContext.Provider>
  )
}
