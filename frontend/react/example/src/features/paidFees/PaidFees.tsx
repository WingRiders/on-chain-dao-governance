import {Stack, Typography} from '@mui/material'
import {usePaidFeesQuery} from '@wingriders/governance-frontend-react-sdk'
import {BigNumber} from '@wingriders/cab/types'
import {AdaQuantityDisplay} from '../../components/AdaQuantityDisplay'

export const PaidFees = () => {
  const {data, isLoading, isError} = usePaidFeesQuery([])

  return (
    <Stack>
      <Typography variant="h4">Total paid transaction fees</Typography>

      {isLoading ? (
        <span>Loading...</span>
      ) : isError ? (
        <span>Error</span>
      ) : data ? (
        <>
          <Typography variant="body1">
            For proposals: <AdaQuantityDisplay quantity={new BigNumber(data.proposals)} />
          </Typography>
          <Typography variant="body1">
            For votes: <AdaQuantityDisplay quantity={new BigNumber(data.votes)} />
          </Typography>
        </>
      ) : (
        <span>No data</span>
      )}
    </Stack>
  )
}
