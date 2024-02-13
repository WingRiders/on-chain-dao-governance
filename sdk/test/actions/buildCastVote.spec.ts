import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {adaToLovelace} from '@wingriders/cab/helpers'
import {Ada} from '@wingriders/cab/types'

import {buildCastVoteAction} from '../../src'
import {createAction} from '../fixtures/createAction'
import {VOTE} from '../fixtures/data/entities'
import {getSimpleMockedWallet} from '../fixtures/mockWallet'

describe('build cast vote', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('successfully builds a transactions for casting a vote', async () => {
    vi.setSystemTime(new Date('2024-08-01T00:00:00Z'))
    const {jsApi} = await getSimpleMockedWallet({
      utxos: [
        {
          coins: adaToLovelace(new Ada(100) as Ada),
          outputIndex: 0,
          txHash: 'b8a6e89adc8801e5739b53eee38cdee6ca8d0c3716a5ee83c1f8609c7269a6d5',
          tokenBundle: [],
        },
      ],
    })
    const vote = VOTE
    const castVote = createAction(buildCastVoteAction, jsApi)
    const {txAux} = await castVote({vote})

    expect(txAux.getId()).toEqual('a1184e1b775ab2e0fa11639a224a970e9a679a489cf58c0dd8a3cddccc47b495')
  })

  test("fails to builds a transactions for casting a vote if the user doesn't have any UTxOs", async () => {
    vi.setSystemTime(new Date('2024-08-01T00:00:00Z'))
    const {jsApi} = await getSimpleMockedWallet({
      utxos: [],
    })
    const vote = VOTE
    const castVote = createAction(buildCastVoteAction, jsApi)
    expect(castVote({vote})).rejects.toThrowError(/No UTxOs found on the wallet/)
  })
})
