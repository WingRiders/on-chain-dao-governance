import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {adaToLovelace} from '@wingriders/cab/helpers'
import {Ada, Address} from '@wingriders/cab/types'

import {buildCancelProposalAction} from '../../src'
import {createAction} from '../fixtures/createAction'
import {GOVERNANCE_VOTING_PARAMS} from '../fixtures/data/governanceVotingParams'
import {getSimpleMockedWallet} from '../fixtures/mockWallet'

describe('build cancel proposal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('successfully builds a transactions for cancelling a proposal', async () => {
    vi.setSystemTime(new Date('2024-08-01T00:00:00Z'))
    const proposalTxHash = 'b8a6e89adc8801e5739b53eee38cdee6ca8d0c3716a5ee83c1f8609c7269a6d5'

    const {jsApi} = await getSimpleMockedWallet({
      utxos: [
        // ADA UTxO for tx fees
        {
          coins: adaToLovelace(new Ada(100) as Ada),
          outputIndex: 0,
          txHash: 'c61fadf2e903ece4b7146429614b4a8255d42236f3794dd11137992ce5dab7df',
          tokenBundle: [],
        },
        // proposal UTxO
        {
          coins: adaToLovelace(new Ada(100) as Ada),
          outputIndex: 0,
          txHash: proposalTxHash,
          tokenBundle: [
            {
              ...GOVERNANCE_VOTING_PARAMS.governanceToken.asset,
              quantity: GOVERNANCE_VOTING_PARAMS.proposalCollateralQuantity,
            },
          ],
        },
      ],
    })

    const cancelProposal = createAction(buildCancelProposalAction, jsApi)
    const {txAux} = await cancelProposal({
      beneficiary:
        'addr_test1qz68clqv5g66rzqq8l0ru6jcx9q63yf97dr9w2ac06q6supfvmwlrkk0q3k4yjpn3yt5wy7zz23m2jfhp7vkqejkjfgsg0pq9r' as Address,
      proposalTxRef: {
        txHash: proposalTxHash,
        outputIndex: 0,
      },
      reason: 'invalid data',
    })

    expect(txAux.getId()).toEqual('8e70c7e7ea6f6d993df219650c1cc40c2fcd9bc64f8b00b861deda99c4720003')
  })

  test('fails to build a transaction for cancelling if the proposal UTxO is not found', async () => {
    vi.setSystemTime(new Date('2024-08-01T00:00:00Z'))
    const proposalTxHash = 'b8a6e89adc8801e5739b53eee38cdee6ca8d0c3716a5ee83c1f8609c7269a6d5'

    const {jsApi} = await getSimpleMockedWallet({
      utxos: [
        // ADA UTxO for tx fees
        {
          coins: adaToLovelace(new Ada(100) as Ada),
          outputIndex: 0,
          txHash: 'c61fadf2e903ece4b7146429614b4a8255d42236f3794dd11137992ce5dab7df',
          tokenBundle: [],
        },
        // proposal UTxO is missing
      ],
    })

    const cancelProposal = createAction(buildCancelProposalAction, jsApi)
    expect(
      cancelProposal({
        beneficiary:
          'addr_test1qz68clqv5g66rzqq8l0ru6jcx9q63yf97dr9w2ac06q6supfvmwlrkk0q3k4yjpn3yt5wy7zz23m2jfhp7vkqejkjfgsg0pq9r' as Address,
        proposalTxRef: {
          txHash: proposalTxHash,
          outputIndex: 0,
        },
        reason: 'invalid data',
      })
    ).rejects.toThrowError(/Proposal not found\/already spent/)
  })
})
