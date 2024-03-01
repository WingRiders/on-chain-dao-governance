import {HttpResponse, http} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest'

import {VoteAggregationByProposalResponse, fetchVotes} from '../../src'

const votes: VoteAggregationByProposalResponse = {
  aaa: {
    byChoice: [
      {
        index: 2,
        votingCount: {
          INVALID: '1',
          UNVERIFIED: '2',
          VERIFIED: '3',
        },
        votingPower: {
          INVALID: '100',
          UNVERIFIED: '200',
          VERIFIED: '300',
        },
      },
    ],
    votingCount: {
      INVALID: '1000',
      UNVERIFIED: '2000',
      VERIFIED: '3000',
    },
    votingPower: {
      INVALID: '10000',
      UNVERIFIED: '20000',
      VERIFIED: '30000',
    },
  },
}

const server = setupServer(
  http.post('https://governance.com/votes', () => {
    return HttpResponse.json(votes)
  })
)

describe('fetch user votes', () => {
  beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  test('successfully fetches user votes for all proposals', async () => {
    const response = await fetchVotes({governanceUrl: 'https://governance.com'})({})
    expect(response).toEqual(votes)
  })
})
