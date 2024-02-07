import {JsAPI, NetworkId} from '@wingriders/cab/dappConnector'
import {NetworkName} from '@wingriders/cab/types'

import {LibError, LibErrorCode} from '../errors/libError'

export const getNetworkNameFromWallet = async (jsApi: JsAPI): Promise<NetworkName> => {
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
