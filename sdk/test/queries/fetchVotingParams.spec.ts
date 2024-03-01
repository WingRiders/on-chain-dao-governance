import {HttpResponse, http} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest'

import {fetchVotingParams} from '../../src'
import {GOVERNANCE_VOTING_PARAMS} from '../fixtures/data/governanceVotingParams'

const server = setupServer(
  http.get('https://governance.com/params', () => {
    return HttpResponse.json(GOVERNANCE_VOTING_PARAMS)
  })
)

describe('fetch governance voting params', () => {
  beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  test('successfully fetches governance voting params', async () => {
    const response = await fetchVotingParams({governanceUrl: 'https://governance.com'})()
    expect(response).toEqual(GOVERNANCE_VOTING_PARAMS)
  })
})
