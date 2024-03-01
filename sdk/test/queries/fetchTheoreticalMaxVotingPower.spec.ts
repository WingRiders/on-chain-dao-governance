import {HttpResponse, http} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest'

import {fetchTheoreticalMaxVotingPower} from '../../src'

const theoreticalMaxVotingPower = 1_000_000

const server = setupServer(
  http.get('https://governance.com/theoreticalMaxVotingPower', () => {
    return HttpResponse.json(theoreticalMaxVotingPower)
  })
)

describe('fetch theoretical max voting power', () => {
  beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  test('successfully fetches theoretical max voting power', async () => {
    const response = await fetchTheoreticalMaxVotingPower({governanceUrl: 'https://governance.com'})()
    expect(response).toEqual(theoreticalMaxVotingPower)
  })
})
