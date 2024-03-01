import {useVotingParamsQuery} from '@wingriders/governance-frontend-react-sdk'
import {useContext} from 'react'
import {WalletContext} from '../features/wallet/ConnectWalletContext'

export const useIsAdmin = () => {
  const {data: votingParams} = useVotingParamsQuery([])
  const {ownerAddress} = useContext(WalletContext)

  const isAdmin =
    ownerAddress != null && votingParams != null && ownerAddress == votingParams.proposalsAddress

  return isAdmin
}
