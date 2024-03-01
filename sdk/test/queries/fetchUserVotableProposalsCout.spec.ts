import {HttpResponse, http} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest'

import {fetchUserVotableProposalsCount} from '../../src'

const userVotableProposalsCount = 1

const server = setupServer(
  http.post('https://governance.com/userVotableProposalsCount', () => {
    return HttpResponse.json(userVotableProposalsCount)
  })
)

describe('fetch user votable proposals count', () => {
  beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  test('successfully fetches the number of user votable proposals', async () => {
    const response = await fetchUserVotableProposalsCount({governanceUrl: 'https://governance.com'})('')
    expect(response).toEqual(userVotableProposalsCount)
  })
})
