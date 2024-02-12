import {describe, expect, test} from 'vitest'

import {getUtxoId} from '../../src/helpers/utxo'

describe('utxo id', () => {
  test('correctly calculates utxo id from string tx hash', () => {
    const txHash = 'e93bd59a72e1a71f50c671328d0e021563b1c7617c722d35c92c70cacb0a686f'
    const outputIndex = 0
    const id = getUtxoId({
      txHash,
      outputIndex,
    })
    expect(id).toEqual(`${txHash}#${outputIndex}`)
  })

  test('correctly calculates utxo id from Buffer tx hash', () => {
    const txHash = 'e93bd59a72e1a71f50c671328d0e021563b1c7617c722d35c92c70cacb0a686f'
    const outputIndex = 0
    const id = getUtxoId({
      txHash: Buffer.from(txHash, 'hex'),
      outputIndex,
    })
    expect(id).toEqual(`${txHash}#${outputIndex}`)
  })
})
