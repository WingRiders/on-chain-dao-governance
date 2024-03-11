import {Stack, IconButton, Typography} from '@mui/material'

import {useProposalsQuery, useReactQueryClient} from '@wingriders/governance-frontend-react-sdk'
import RefreshIcon from '@mui/icons-material/Refresh'

import {Proposal} from './Proposal'
import {useContext} from 'react'
import {WalletContext} from '../wallet/ConnectWalletContext'
import {compact} from 'lodash'

export const Proposals = () => {
  const {data: proposals, isLoading, isError} = useProposalsQuery([])
  const queryClient = useReactQueryClient()
  const {ownerStakeKeyHash} = useContext(WalletContext)

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0]
        return (
          typeof key === 'string' &&
          compact(['proposals', 'votes', ownerStakeKeyHash && 'userVotes'] as string[]).includes(key)
        )
      },
      refetchActive: true,
      refetchInactive: true,
    })
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4">Proposals</Typography>
        <IconButton onClick={handleRefresh} color="primary">
          <RefreshIcon />
        </IconButton>
      </Stack>

      {isLoading ? (
        <span>Loading...</span>
      ) : isError ? (
        <span>Error</span>
      ) : proposals && proposals.length > 0 ? (
        <Stack spacing={1}>
          {proposals.map((proposal) => (
            <Proposal key={proposal.txHash} proposal={proposal} />
          ))}
        </Stack>
      ) : (
        <span>No proposals found</span>
      )}
    </Stack>
  )
}
