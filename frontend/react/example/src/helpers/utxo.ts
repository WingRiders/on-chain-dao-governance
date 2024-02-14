import {TxHash, TxInput, UInt} from '@wingriders/cab/dappConnector'
import {BigNumber} from '@wingriders/cab/types'
import {UtxoId} from '@wingriders/governance-sdk'

export const utxoIdToApiTxInput = (utxoId: UtxoId): TxInput => {
  const [txHash, outputIndex] = utxoId.split('#')
  if (outputIndex === undefined) {
    throw new Error(`Invalid format of utxoId "${utxoId}"`)
  }
  return {txHash: txHash as TxHash, index: new BigNumber(outputIndex) as UInt}
}
