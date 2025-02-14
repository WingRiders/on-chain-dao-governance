import {HttpResponse, http} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest'

import {Address} from '@wingriders/cab/types'

import {ProposalResponse, ProposalStatus, fetchProposal} from '../../src'

const proposal: ProposalResponse = {
  name: 'Proposal 1',
  description: 'Description 1',
  uri: 'ipfs://ipfs_hash',
  communityUri: 'https://community_uri',
  owner: 'addr_test1' as Address,
  acceptChoices: ['Yes'],
  rejectChoices: ['No'],
  choices: {
    Yes: 1,
    No: 0,
  },
  abstained: 0,
  total: 1,
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
}

const server = setupServer(
  http.post('https://governance.com/proposal', () => {
    return HttpResponse.json(proposal)
  })
)

describe('fetch proposal', () => {
  beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  test('successfully fetches one proposal', async () => {
    const response = await fetchProposal({governanceUrl: 'https://governance.com'})('')
    expect(response).toEqual(proposal)
  })
})
