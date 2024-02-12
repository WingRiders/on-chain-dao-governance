import {UtxoId} from '../types'

export const getUtxoId = ({
  txHash,
  outputIndex,
}: {
  txHash: string | Buffer
  outputIndex: number | bigint
}): UtxoId => `${Buffer.isBuffer(txHash) ? txHash.toString('hex') : txHash}#${outputIndex}`
