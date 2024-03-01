import {Stack, Typography} from '@mui/material'
import {
  useActiveProposalsCountQuery,
  useTheoreticalMaxVotingPowerQuery,
  useUserVotableProposalsCountPowerQuery,
  useUserVotingDistributionQuery,
} from '@wingriders/governance-frontend-react-sdk'
import {useContext} from 'react'
import {WalletContext} from './ConnectWalletContext'
import {formatBigNumber} from './helpers/formatNumber'

export const CurrentData = () => {
  const {ownerStakeKeyHash} = useContext(WalletContext)

  const {data: userVotingDistributionData} = useUserVotingDistributionQuery(
    ownerStakeKeyHash ? [{ownerStakeKeyHash}] : undefined
  )
  const {data: theoreticalMaxVotingPowerData} = useTheoreticalMaxVotingPowerQuery([])

  const {data: activeProposalsCountData} = useActiveProposalsCountQuery([])
  const {data: userVotableProposalsCountData} = useUserVotableProposalsCountPowerQuery(
    ownerStakeKeyHash ? [ownerStakeKeyHash] : undefined
  )

  return (
    <Stack spacing={5}>
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

      <Stack>
        <Typography variant="h4">Active proposals</Typography>
        <Typography variant="body1">All active proposals: {activeProposalsCountData ?? '-'}</Typography>
        <Typography variant="body1">
          Your votable proposals: {userVotableProposalsCountData ?? '-'}
        </Typography>
      </Stack>
    </Stack>
  )
}
