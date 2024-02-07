import {Address} from '@wingriders/cab/types'
import {ActionsClient} from '@wingriders/governance-sdk'
import {createContext} from 'react'

export type WalletContextType = {
  actionsClient?: ActionsClient
  ownerAddress?: Address
}

export const WalletContext = createContext<
  WalletContextType & {
    setWalletContext: (context: WalletContextType) => void
  }
>({
  actionsClient: undefined,
  ownerAddress: undefined,
  setWalletContext: () => {},
})
