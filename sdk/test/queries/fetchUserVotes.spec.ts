import {HttpResponse, http} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest'

import {UserVotesResponse, VoteVerificationState, fetchUserVotes} from '../../src'

const userVotes: UserVotesResponse = {
  aaa: {
    index: 2,
    verificationState: VoteVerificationState.VERIFIED,
    votingPower: '100',
  },
}

const server = setupServer(
  http.post('https://governance.com/userVotes', () => {
    return HttpResponse.json(userVotes)
  })
)

describe('fetch user votes', () => {
  beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  test('successfully fetches user votes for all proposals', async () => {
    const response = await fetchUserVotes({governanceUrl: 'https://governance.com'})({
      ownerStakeKeyHash: '',
    })
    expect(response).toEqual(userVotes)
  })
})
