import {Button, Stack} from '@mui/material'
import {useContext, useEffect, useState} from 'react'
import type {StandardWallet as StandardWalletApi} from '@wingriders/cab/dappConnector'
import {
  CborToJsApiWalletConnector,
  WalletApiVendor,
  reverseAddress,
} from '@wingriders/cab/wallet/connector'
import {WalletContext} from './ConnectWalletContext'
import {
  useProtocolParametersQuery,
  useVotingParamsQuery,
} from '@wingriders/governance-frontend-react-sdk'
import {NetworkName} from '@wingriders/cab/types'
import {createActionsClient, getWalletOwner} from '@wingriders/governance-sdk'
import {stakingHashFromAddress} from '@wingriders/cab/ledger/address'

declare global {
  interface Window {
    cardano?: {
      eternl?: StandardWalletApi
      [key: string]: unknown
    }
  }
}

const WALLET_ID = 'eternl'
const INJECT_TIME_DELAY = 1000

type ConnectionState = 'disconnected' | 'connecting' | 'connected'

export const ConnectWalletButton = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [isWalletAvailable, setWalletAvailable] = useState(false)
  const {setWalletContext} = useContext(WalletContext)

  const {data: votingParams} = useVotingParamsQuery([])
  const {data: protocolParameters} = useProtocolParametersQuery([])

  useEffect(() => {
    setTimeout(() => {
      setWalletAvailable(!!window.cardano?.[WALLET_ID])
    }, INJECT_TIME_DELAY)
  }, [])

  const handleClick = async () => {
    if (connectionState === 'connected') {
      setWalletContext({actionsClient: undefined, ownerAddress: undefined})
      setConnectionState('disconnected')
      return
    }
    setConnectionState('connecting')
    const walletApi = window.cardano?.[WALLET_ID]
    if (walletApi && votingParams && protocolParameters) {
      try {
        const walletConnector = new CborToJsApiWalletConnector(walletApi, {
          vendor: WalletApiVendor.ETERNL,
          cacheTtl: 60_000,
        })
        const jsApi = await walletConnector.enableJs()

        const actionsClient = await createActionsClient({
          jsApi,
          governanceVotingParams: votingParams,
          protocolParameters,
          networkName: NetworkName.PREPROD,
        })
        const ownerAddress = reverseAddress(await getWalletOwner(jsApi))
        const ownerStakeKeyHash = stakingHashFromAddress(ownerAddress)
        setWalletContext({actionsClient, ownerAddress, ownerStakeKeyHash, jsApi})
        setConnectionState('connected')
      } catch (error) {
        console.error(error)
        setConnectionState('disconnected')
      }
    } else {
      setConnectionState('disconnected')
    }
  }

  return (
    <Stack spacing={1} direction="row" alignItems="center">
      <Button
        onClick={handleClick}
        disabled={!isWalletAvailable || connectionState === 'connecting'}
        variant="contained"
        color="secondary"
      >
        {
          {
            disconnected: `Connect ${WALLET_ID}`,
            connecting: 'Connecting...',
            connected: 'Disconnect',
          }[connectionState]
        }
      </Button>
    </Stack>
  )
}
