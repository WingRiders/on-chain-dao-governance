import {TxHash, UInt} from '@wingriders/cab/dappConnector'
import {Address, BigNumber} from '@wingriders/cab/types'

import {PollMetadatum, ProposalMetadatum, ProposalResults, Vote} from '../../../src'

export const POLL_WITH_SNAPSHOT: PollMetadatum = {
  description: 'description',
  start: new Date('2024-08-01T00:00:00Z'),
  end: new Date('2024-08-02T00:00:00Z'),
  snapshot: new Date('2024-08-01T00:00:00Z'),
}

export const POLL_WITHOUT_SNAPSHOT: PollMetadatum = {
  description: 'description',
  start: new Date('2024-08-01T00:00:00Z'),
  end: new Date('2024-08-02T00:00:00Z'),
}

export const PROPOSAL: ProposalMetadatum = {
  name: 'name',
  description: 'description',
  owner:
    'addr_test1qz68clqv5g66rzqq8l0ru6jcx9q63yf97dr9w2ac06q6supfvmwlrkk0q3k4yjpn3yt5wy7zz23m2jfhp7vkqejkjfgsg0pq9r' as Address,
  uri: 'ipfs://QmXyZ',
  communityUri: 'https://example.com',
  acceptChoices: ['accept'],
  rejectChoices: ['reject'],
}

export const VOTE: Vote = {
  choices: {
    e93bd59a72e1a71f50c671328d0e021563b1c7617c722d35c92c70cacb0a686f: 0,
  },
  pollTxHash: 'e93bd59a72e1a71f50c671328d0e021563b1c7617c722d35c92c70cacb0a686f',
  voterAddress:
    'addr_test1qz68clqv5g66rzqq8l0ru6jcx9q63yf97dr9w2ac06q6supfvmwlrkk0q3k4yjpn3yt5wy7zz23m2jfhp7vkqejkjfgsg0pq9r' as Address,
  votingPower: 1,
  votingUTxOs: [
    {
      txHash: 'e93bd59a72e1a71f50c671328d0e021563b1c7617c722d35c92c70cacb0a686f' as TxHash,
      index: new BigNumber(0) as UInt,
    },
  ],
}

export const PROPOSAL_RESULTS: ProposalResults = {
  result: 'PASSED',
  choices: {
    accept: 10,
    reject: 5,
  },
  abstained: 10,
  total: 25,
  note: '',
}
