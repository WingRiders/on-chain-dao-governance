import {APIErrorCode, JsAPI, NetworkId, Wallet as WalletApi} from '@wingriders/cab/dappConnector'
import {sleep} from '@wingriders/cab/helpers'
import {NetworkName} from '@wingriders/cab/types'
import {ApiError} from '@wingriders/cab/wallet/connector'

import {LibError, LibErrorCode} from '../errors/libError'

/**
 * Wrapper function to manage the connector
 * For now very naively each time we do a call, we rely on the Wallet caching the api
 * and returning us the correct api every time.
 *
 * @param walletApi
 * @param fn the wrapped function
 * @returns
 */
export const withJsAPI: JsApiInjector = (walletApi, fn) => {
  return async (...args) => fn(await getJsAPI(walletApi))(...args)
}

const ENABLE_TIMEOUT = 60_000 // 60 seconds

type JsApiInjector = <T extends unknown[], U extends unknown>(
  walletApi: WalletApi,
  fn: (api: JsAPI) => (...args: T) => Promise<U>
) => (...args: T) => Promise<U>

export const getJsAPI = async (walletApi: WalletApi): Promise<JsAPI> => {
  try {
    const jsApi = await Promise.race([walletApi.enableJs(), sleep(ENABLE_TIMEOUT, undefined)])
    if (!jsApi) {
      throw new ApiError(APIErrorCode.InternalError, 'Timeout requesting api from wallet')
    }
    return jsApi
  } catch (err: any) {
    if (err.code === APIErrorCode.Refused) {
      throw new LibError(LibErrorCode.Unauthorized)
    } else if (
      ['ccvault', 'eternl'].includes(walletApi.name) &&
      err.code === APIErrorCode.InternalError &&
      err.message === 'no account set'
    ) {
      throw new LibError(
        LibErrorCode.Unauthorized,
        'You have no DApp enabled account. You can enable one in Eternl settings.'
      )
    } else {
      throw new LibError(LibErrorCode.Unknown, 'Unexpected error from dApp connector.', err)
    }
  }
}

export const getNetworkNameFromWallet = async (walletApi: WalletApi): Promise<NetworkName> => {
  const jsApi = await getJsAPI(walletApi)
  const networkId = await jsApi.getNetworkId()
  switch (networkId) {
    case NetworkId.Mainnet:
      return NetworkName.MAINNET
    case NetworkId.Testnet:
      // kinda dangerous, all testnets have the same id, but they differ in
      // protocol magic, which is currently not obtainable from wallet api
      // for now this assumption is correct
      return NetworkName.PREPROD
    default:
      throw new LibError(LibErrorCode.UnsupportedNetwork)
  }
}
