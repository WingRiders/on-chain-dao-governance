import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {adaToLovelace} from '@wingriders/cab/helpers'
import {Ada, Address} from '@wingriders/cab/types'

import {buildConcludeProposalAction} from '../../src'
import {createAction} from '../fixtures/createAction'
import {PROPOSAL_RESULTS} from '../fixtures/data/entities'
import {GOVERNANCE_VOTING_PARAMS} from '../fixtures/data/governanceVotingParams'
import {getSimpleMockedWallet} from '../fixtures/mockWallet'

describe('build conclude proposal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('successfully builds a transactions for concluding a proposal', async () => {
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

    const results = PROPOSAL_RESULTS
    const concludeProposal = createAction(buildConcludeProposalAction, jsApi)
    const {txAux} = await concludeProposal({
      beneficiary:
        'addr_test1qz68clqv5g66rzqq8l0ru6jcx9q63yf97dr9w2ac06q6supfvmwlrkk0q3k4yjpn3yt5wy7zz23m2jfhp7vkqejkjfgsg0pq9r' as Address,
      proposalTxRef: {
        txHash: proposalTxHash,
        outputIndex: 0,
      },
      results,
    })

    expect(txAux.getId()).toEqual('6ae693abc174775c698ff8e080348eecaeda39b4b3cd27db31f66dcec9b62045')
  })

  test('fails to build a transaction for concluding if the proposal UTxO is not found', async () => {
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

    const results = PROPOSAL_RESULTS
    const concludeProposal = createAction(buildConcludeProposalAction, jsApi)
    expect(
      concludeProposal({
        beneficiary:
          'addr_test1qz68clqv5g66rzqq8l0ru6jcx9q63yf97dr9w2ac06q6supfvmwlrkk0q3k4yjpn3yt5wy7zz23m2jfhp7vkqejkjfgsg0pq9r' as Address,
        proposalTxRef: {
          txHash: proposalTxHash,
          outputIndex: 0,
        },
        results,
      })
    ).rejects.toThrowError(/Proposal not found\/already spent/)
  })
})
