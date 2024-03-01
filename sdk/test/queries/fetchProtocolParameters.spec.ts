import {HttpResponse, http} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest'

import {fetchProtocolParameters} from '../../src/queries/fetchProtocolParameters'
import {PREPROD_PROTOCOL_PARAMETERS} from '../fixtures/data/protocolParameters'

const server = setupServer(
  http.get('https://governance.com/protocolParameters', () => {
    return HttpResponse.json(PREPROD_PROTOCOL_PARAMETERS)
  })
)

describe('fetch protocol parameters', () => {
  beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  test('successfully fetches preprod protocol parameters', async () => {
    const response = await fetchProtocolParameters({governanceUrl: 'https://governance.com'})()
    expect(response).toEqual(PREPROD_PROTOCOL_PARAMETERS)
  })
})
