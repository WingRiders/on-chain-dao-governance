import {afterEach, describe, expect, test, vi} from 'vitest'

import {NetworkName} from '@wingriders/cab/types'

import {getNetworkNameFromWallet} from '../../src/helpers/walletApi'
import {getSimpleMockedWallet} from '../fixtures/mockWallet'

describe('wallet api', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('getNetworkNameFromWallet returns preprod for a preprod wallet', async () => {
    const expectedNetworkName = NetworkName.PREPROD
    const {jsApi} = await getSimpleMockedWallet({
      network: expectedNetworkName,
    })

    const networkName = await getNetworkNameFromWallet(jsApi)
    expect(networkName).toBe(expectedNetworkName)
  })

  test('getNetworkNameFromWallet returns mainnet for a mainnet wallet', async () => {
    const expectedNetworkName = NetworkName.MAINNET
    const {jsApi} = await getSimpleMockedWallet({
      network: expectedNetworkName,
    })

    const networkName = await getNetworkNameFromWallet(jsApi)
    expect(networkName).toBe(expectedNetworkName)
  })
})
