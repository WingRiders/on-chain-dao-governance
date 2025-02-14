import {HttpResponse, http} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest'

import {Address} from '@wingriders/cab/types'

import {ProposalStatus, ProposalsResponse, fetchProposals} from '../../src'

const proposals: ProposalsResponse = [
  {
    name: 'Proposal 1',
    description: 'Description 1',
    uri: 'ipfs://ipfs_hash',
    communityUri: 'https://community_uri',
    owner: 'addr_test1' as Address,
    acceptChoices: ['Yes'],
    rejectChoices: ['No'],
    slot: 1,
    txHash: 'tx_hash',
    outputIndex: 0,
    status: ProposalStatus.AVAILABLE,
    poll: {
      description: 'description',
      start: new Date('2024-08-01T00:00:00Z').valueOf(),
      end: new Date('2024-08-02T00:00:00Z').valueOf(),
      snapshot: new Date('2024-08-01T00:00:00Z').valueOf(),
      txHash: 'tx_hash',
    },
  },
]

const server = setupServer(
  http.get('https://governance.com/proposals', () => {
    return HttpResponse.json(proposals)
  })
)

describe('fetch proposals', () => {
  beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  test('successfully fetches list of all proposals', async () => {
    const response = await fetchProposals({governanceUrl: 'https://governance.com'})()
    expect(response).toEqual(proposals)
  })
})
