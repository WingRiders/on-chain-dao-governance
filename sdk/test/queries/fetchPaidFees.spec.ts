import {HttpResponse, http} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest'

import {PaidFeesResponse, fetchPaidFees} from '../../src'

const paidFees: PaidFeesResponse = {
  proposals: '100',
  votes: '200',
}

const server = setupServer(
  http.post('https://governance.com/paidFees', () => {
    return HttpResponse.json(paidFees)
  })
)

describe('fetch paid fees', () => {
  beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  test('successfully fetches paid transaction fees', async () => {
    const response = await fetchPaidFees({governanceUrl: 'https://governance.com'})()
    expect(response).toEqual(paidFees)
  })
})
