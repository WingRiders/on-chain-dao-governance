import {JsAPI} from '@wingriders/cab/dappConnector'

import {BuiltTxInfo, SignedTxInfo, signTx} from '../helpers/actions'

type SignTxParams = {
  buildTxInfo: BuiltTxInfo
}

type SignTxAction = (params: SignTxParams) => Promise<SignedTxInfo>

export const signTxAction =
  () =>
  (jsApi: JsAPI): SignTxAction =>
  async ({buildTxInfo: {tx, txAux, txWitnessSet}}) => {
    const {signedTx, cborizedTx, txHash} = await signTx({jsApi, tx, txAux, txWitnessSet})

    return {
      signedTx,
      cborizedTx,
      txHash,
    }
  }
