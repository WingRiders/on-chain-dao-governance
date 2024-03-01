import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {adaToLovelace} from '@wingriders/cab/helpers'
import {Ada} from '@wingriders/cab/types'

import {buildCreateProposalAction} from '../../src'
import {createAction} from '../fixtures/createAction'
import {POLL_WITH_SNAPSHOT, PROPOSAL} from '../fixtures/data/entities'
import {GOVERNANCE_VOTING_PARAMS} from '../fixtures/data/governanceVotingParams'
import {getSimpleMockedWallet} from '../fixtures/mockWallet'

describe('build create proposal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('successfully builds a transactions for creating a proposal if user has enough collateral tokens', async () => {
    vi.setSystemTime(new Date('2024-08-01T00:00:00Z'))
    const {jsApi} = await getSimpleMockedWallet({
      utxos: [
        {
          coins: adaToLovelace(new Ada(100) as Ada),
          outputIndex: 0,
          txHash: 'b8a6e89adc8801e5739b53eee38cdee6ca8d0c3716a5ee83c1f8609c7269a6d5',
          tokenBundle: [
            {
              ...GOVERNANCE_VOTING_PARAMS.governanceToken.asset,
              quantity: GOVERNANCE_VOTING_PARAMS.proposalCollateralQuantity,
            },
          ],
        },
      ],
    })
    const proposal = PROPOSAL
    const poll = POLL_WITH_SNAPSHOT

    const createProposal = createAction(buildCreateProposalAction, jsApi)
    const {txAux} = await createProposal({proposal, poll})

    expect(txAux.getId()).toEqual('f4f400717716f0aef30a1abc34b7f84d22e9bc696d19f790a9649b9d18029c1d')
  })

  test('fails to builds a transactions for creating a proposal if user does not have enough collateral tokens', async () => {
    vi.setSystemTime(new Date('2024-08-01T00:00:00Z'))
    const {jsApi} = await getSimpleMockedWallet({
      utxos: [
        {
          coins: adaToLovelace(new Ada(100) as Ada),
          outputIndex: 0,
          txHash: 'b8a6e89adc8801e5739b53eee38cdee6ca8d0c3716a5ee83c1f8609c7269a6d5',
          tokenBundle: [
            {
              ...GOVERNANCE_VOTING_PARAMS.governanceToken.asset,
              quantity: GOVERNANCE_VOTING_PARAMS.proposalCollateralQuantity.minus(100),
            },
          ],
        },
      ],
    })
    const proposal = PROPOSAL
    const poll = POLL_WITH_SNAPSHOT

    const createProposal = createAction(buildCreateProposalAction, jsApi)
    expect(createProposal({proposal, poll})).rejects.toThrowError(/Not enough tokens/)
  })
})
