import {Stack, Typography} from '@mui/material'
import {
  useActiveProposalsCountQuery,
  useTheoreticalMaxVotingPowerQuery,
  useUserVotableProposalsCountPowerQuery,
  useUserVotingDistributionQuery,
  useVotingParamsQuery,
} from '@wingriders/governance-frontend-react-sdk'
import {useContext} from 'react'
import {WalletContext} from '../wallet/ConnectWalletContext'
import {AssetQuantityDisplay} from '../../components/AssetQuantityDisplay'
import {BigNumber} from '@wingriders/cab/types'

export const CurrentData = () => {
  const {ownerStakeKeyHash} = useContext(WalletContext)

  const {data: votingParams} = useVotingParamsQuery([])

  const {data: userVotingDistributionData} = useUserVotingDistributionQuery(
    ownerStakeKeyHash ? [{ownerStakeKeyHash}] : undefined
  )
  const {data: theoreticalMaxVotingPowerData} = useTheoreticalMaxVotingPowerQuery([])

  const {data: activeProposalsCountData} = useActiveProposalsCountQuery([])
  const {data: userVotableProposalsCountData} = useUserVotableProposalsCountPowerQuery(
    ownerStakeKeyHash ? [ownerStakeKeyHash] : undefined
  )

  if (!votingParams) return null

  return (
    <Stack spacing={5}>
      <Stack>
        <Typography variant="h4">Current voting power</Typography>
        <Typography variant="body1">
          Theoretical maximum:{' '}
          {theoreticalMaxVotingPowerData ? (
            <AssetQuantityDisplay
              token={{
                ...votingParams.governanceToken.asset,
                quantity: new BigNumber(theoreticalMaxVotingPowerData),
              }}
              assetMetadata={votingParams.governanceToken.metadata}
            />
          ) : (
            '-'
          )}
        </Typography>
        <Typography variant="body1">
          Your current voting power:{' '}
          {userVotingDistributionData ? (
            <AssetQuantityDisplay
              token={{
                ...votingParams.governanceToken.asset,
                quantity: new BigNumber(userVotingDistributionData.walletTokens.votingPower),
              }}
              assetMetadata={votingParams.governanceToken.metadata}
            />
          ) : (
            '-'
          )}
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
