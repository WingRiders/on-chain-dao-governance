import {HttpResponse, http} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest'

import {fetchActiveProposalsCount} from '../../src'

const activeProposalsCount = 3

const server = setupServer(
  http.get('https://governance.com/activeProposalsCount', () => {
    return HttpResponse.json(activeProposalsCount)
  })
)

describe('fetch active proposals count', () => {
  beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  test('successfully fetches the number of active proposals', async () => {
    const response = await fetchActiveProposalsCount({governanceUrl: 'https://governance.com'})()
    expect(response).toEqual(activeProposalsCount)
  })
})
