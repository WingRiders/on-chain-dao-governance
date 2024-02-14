import {Stack, Typography} from '@mui/material'

import {useProposalsQuery} from '@wingriders/governance-frontend-react-sdk'

import {Proposal} from './Proposal'

export const Proposals = () => {
  const {data: proposals, isLoading, isError} = useProposalsQuery([])

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Proposals</Typography>

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
