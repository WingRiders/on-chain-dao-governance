import * as api from '@wingriders/cab/dappConnector'
import {TxSigned} from '@wingriders/cab/ledger/transaction'

import {submitTx} from '../helpers/actions'

type SubmitTxParams = {
  cborizedTx: TxSigned
}

type SubmitTxAction = (params: SubmitTxParams) => Promise<api.TxHash>

export const submitTxAction =
  () =>
  (jsApi: api.JsAPI): SubmitTxAction =>
  async ({cborizedTx}: SubmitTxParams) => {
    return await submitTx({jsApi, cborizedTx})
  }
