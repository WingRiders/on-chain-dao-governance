import {BlockchainExplorer} from '@wingriders/cab/blockchainExplorer'
import {NETWORKS} from '@wingriders/cab/constants'
import {JsCryptoProvider, mnemonicToWalletSecretDef} from '@wingriders/cab/crypto'
import {setLogger} from '@wingriders/cab/logger'
import {ILogger, NetworkName} from '@wingriders/cab/types'
import {Wallet} from '@wingriders/cab/wallet'

export const initWallet = async ({
  blockchainExplorerUrl,
  mnemonic,
  accountIndex,
  network,
  gapLimit,
}: {
  blockchainExplorerUrl: string
  mnemonic: string
  accountIndex?: number
  network: NetworkName
  gapLimit: number
}): Promise<Wallet> => {
  const cabLogger: ILogger = {
    error: console.error,
    info: console.info,
    log: console.log,
    warn: console.warn,
    debug: console.debug,
  }
  setLogger(cabLogger)

  const wallet = new Wallet({
    blockchainExplorer: new BlockchainExplorer({
      baseUrl: blockchainExplorerUrl,
      logger: cabLogger,
    }),
    cryptoProvider: new JsCryptoProvider({
      walletSecretDef: await mnemonicToWalletSecretDef(mnemonic),
      network: NETWORKS[network],
      config: {
        shouldExportPubKeyBulk: true,
      },
    }),
    config: {
      shouldExportPubKeyBulk: true,
      gapLimit,
    },
  })

  if (accountIndex != null) {
    await wallet.getAccountManager().addAccounts([accountIndex])
  }

  return wallet
}
