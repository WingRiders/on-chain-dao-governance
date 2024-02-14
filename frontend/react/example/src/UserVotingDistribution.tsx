import {Stack, Typography} from '@mui/material'
import {
  useTheoreticalMaxVotingPowerQuery,
  useUserVotingDistributionQuery,
} from '@wingriders/governance-frontend-react-sdk'
import {useContext} from 'react'
import {WalletContext} from './ConnectWalletContext'
import {formatBigNumber} from './helpers/formatNumber'

export const UserVotingDistribution = () => {
  const {ownerStakeKeyHash} = useContext(WalletContext)

  const {data: userVotingDistributionData} = useUserVotingDistributionQuery(
    ownerStakeKeyHash ? [{ownerStakeKeyHash}] : undefined
  )
  const {data: theoreticalMaxVotingPowerData} = useTheoreticalMaxVotingPowerQuery([])

  return (
    <Stack>
      <Typography variant="h4">Current voting power</Typography>

      <Typography variant="body1">
        Theoretical maximum:{' '}
        {theoreticalMaxVotingPowerData ? formatBigNumber(theoreticalMaxVotingPowerData) : '-'}
      </Typography>
      <Typography variant="body1">
        Your current voting power:{' '}
        {userVotingDistributionData
          ? formatBigNumber(userVotingDistributionData.walletTokens.votingPower)
          : '-'}
      </Typography>
    </Stack>
  )
}
