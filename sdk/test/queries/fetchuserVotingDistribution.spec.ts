import {HttpResponse, http} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest'

import {UserVotingDistributionResponse, fetchUserVotingDistribution} from '../../src'

const userVotingDistribution: UserVotingDistributionResponse = {
  utxoIds: ['aaa#0'],
  slot: 100,
  walletTokens: {
    tokenCount: '100',
    votingPower: '200',
  },
}

const server = setupServer(
  http.post('https://governance.com/userVotingDistribution', () => {
    return HttpResponse.json(userVotingDistribution)
  })
)

describe('fetch user voting distribution', () => {
  beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  test('successfully fetches user voting distribution', async () => {
    const response = await fetchUserVotingDistribution({governanceUrl: 'https://governance.com'})({
      ownerStakeKeyHash: '',
    })
    expect(response).toEqual(userVotingDistribution)
  })
})
