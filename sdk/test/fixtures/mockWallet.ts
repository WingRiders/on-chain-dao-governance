import {SetOptional} from 'type-fest'
import {vi} from 'vitest'

import {NETWORKS} from '@wingriders/cab/constants'
import {JsCryptoProvider, mnemonicToWalletSecretDef} from '@wingriders/cab/crypto'
import {CabBackend} from '@wingriders/cab/dataProvider'
import {shelleyBaseAddressProvider} from '@wingriders/cab/ledger/address'
import {Address, AddressProvider, NetworkName, UTxO} from '@wingriders/cab/types'
import {Wallet} from '@wingriders/cab/wallet'
import {WalletConnector} from '@wingriders/cab/wallet/connector'

type AddressesArg = string[] | ((baseAddressProvider: AddressProvider) => Promise<string[]>)

type GetSimpleMockedWalletArgs = {
  mnemonic?: string
  accountIndex?: number
  network?: NetworkName
  utxos?: SetOptional<UTxO, 'address'>[]
  /** defaults to [firstAddressOfTheAccount] */
  usedAddresses?: AddressesArg
  /** defaults to [] */
  unusedAddresses?: AddressesArg
}

/**
 * @returns a simple mocked wallet with a single account, single address,
 * and the provided utxos.
 */
export const getSimpleMockedWallet = async ({
  mnemonic = 'title endless artefact dilemma social sock false there earth bunker expose where foster topic mad turkey secret hover hurt depart evidence mention salt eager',
  accountIndex = 0,
  network = NetworkName.PREPROD,
  utxos = [],
  usedAddresses,
  unusedAddresses,
}: GetSimpleMockedWalletArgs = {}) => {
  const dataProvider = new CabBackend('mockedUrl', network)

  const cryptoProvider = new JsCryptoProvider({
    walletSecretDef: await mnemonicToWalletSecretDef(mnemonic),
    network: NETWORKS[network],
    config: {
      shouldExportPubKeyBulk: true,
    },
  })
  const baseAddressProvider = shelleyBaseAddressProvider(cryptoProvider, accountIndex, false)
  const firstAddress = (await baseAddressProvider(0)).address
  const mockedUsedAddresses = (await getAddresses(usedAddresses, baseAddressProvider)) ?? [firstAddress]
  const mockedUnusedAddresses = (await getAddresses(unusedAddresses, baseAddressProvider)) ?? []
  vi.spyOn(dataProvider, 'filterUsedAddresses').mockImplementation((addresses) => {
    return Promise.resolve(
      new Set<Address>(addresses.filter((address) => mockedUsedAddresses.includes(address)))
    )
  })
  vi.spyOn(dataProvider, 'getUTxOs').mockImplementation((_addresses) => {
    return Promise.resolve(utxos.map((u) => ({...u, address: mockedUsedAddresses[0]! as Address})))
  })
  vi.spyOn(dataProvider, 'submitTx').mockImplementation((txCbor) => {
    return Promise.resolve()
  })

  const wallet = new Wallet({
    dataProvider,
    cryptoProvider,
    gapLimit: 1,
  })
  await wallet.getOrLoadAccount(0)

  const walletConnector = new WalletConnector(wallet, 'mocked wallet', 'mocked icon')
  const jsApi = await walletConnector.enableJs()

  return {
    jsApi,
    mockedUsedAddresses,
    mockedUnusedAddresses,
  }
}

const getAddresses = async (arg: AddressesArg | undefined, addressProvider: AddressProvider) =>
  typeof arg === 'function' ? await arg(addressProvider) : arg
