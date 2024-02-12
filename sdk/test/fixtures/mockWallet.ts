import {SetOptional} from 'type-fest'
import {vi} from 'vitest'

import {BlockchainExplorer} from '@wingriders/cab/blockchainExplorer'
import {NETWORKS} from '@wingriders/cab/constants'
import {JsCryptoProvider, mnemonicToWalletSecretDef} from '@wingriders/cab/crypto'
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
  const blockchainExplorer = new BlockchainExplorer({
    baseUrl: 'mockedUrl',
  })

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
  vi.spyOn(blockchainExplorer, 'isSomeAddressUsed').mockImplementation((addresses) => {
    return Promise.resolve(addresses.some((address) => mockedUsedAddresses.includes(address)))
  })
  vi.spyOn(blockchainExplorer, 'filterUsedAddresses').mockImplementation((addresses) => {
    return Promise.resolve(
      new Set<string>(addresses.filter((address) => mockedUsedAddresses.includes(address)))
    )
  })
  vi.spyOn(blockchainExplorer, 'fetchUnspentTxOutputs').mockImplementation((_addresses) => {
    return Promise.resolve(utxos.map((u) => ({...u, address: mockedUsedAddresses[0]! as Address})))
  })

  const wallet = new Wallet({
    blockchainExplorer,
    cryptoProvider,
    config: {
      shouldExportPubKeyBulk: true,
      gapLimit: 1,
    },
  })
  await wallet.getAccountManager().addAccounts([0])

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
