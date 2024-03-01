import {useContext} from 'react'
import {WalletContext} from '../features/wallet/ConnectWalletContext'
import {usePromise} from './promise'
import {reverseValue} from '@wingriders/cab/wallet/connector'

export const useUserBalance = () => {
  const {jsApi} = useContext(WalletContext)

  const {currentData, isLoading} = usePromise(async () => jsApi?.getBalance(), [jsApi])

  return {userBalance: currentData ? reverseValue(currentData) : undefined, isLoading}
}
