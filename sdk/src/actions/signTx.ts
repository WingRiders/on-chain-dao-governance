import {JsAPI} from '@wingriders/cab/dappConnector'

import {signTx} from '../helpers/actions'
import {BuiltTxInfo, SignedTxInfo} from './types'

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
