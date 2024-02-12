import {afterEach, describe, expect, test, vi} from 'vitest'

import {reverseAddress} from '@wingriders/cab/wallet/connector'

import {getWalletOwner} from '../../src'
import {getSimpleMockedWallet} from '../fixtures/mockWallet'

describe('wallet address', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('getWalletOwner returns the first used address if available', async () => {
    const {jsApi, mockedUsedAddresses} = await getSimpleMockedWallet()

    const walletOwner = reverseAddress(await getWalletOwner(jsApi))
    expect(walletOwner).toBe(mockedUsedAddresses[0])
  })

  test('getWalletOwner returns the first unused address if there are no used addresses', async () => {
    const {jsApi, mockedUnusedAddresses} = await getSimpleMockedWallet({
      usedAddresses: [],
      unusedAddresses: async (baseAddressProvider) => [(await baseAddressProvider(0)).address],
    })

    const walletOwner = reverseAddress(await getWalletOwner(jsApi))
    expect(walletOwner).toBe(mockedUnusedAddresses[0])
  })
})
