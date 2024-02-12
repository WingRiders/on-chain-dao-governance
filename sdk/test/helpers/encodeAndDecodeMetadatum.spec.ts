import {describe, expect, test} from 'vitest'

import {PollMetadatum, ProposalMetadatum} from '../../src'
import {
  decodeAddProposalOperation,
  decodeCancelProposalOperation,
  decodeConcludeProposalOperation,
  decodePollMetadatum,
  decodeProposalMetadatum,
  decodeVotesMetadatum,
} from '../../src/helpers/decodeMetadatum'
import {
  encodeAddProposalOperation,
  encodeCancelProposalOperation,
  encodeConcludeProposalOperation,
  encodePollMetadatum,
  encodeProposalMetadatum,
  encodeVotesMetadatum,
} from '../../src/helpers/encodeMetadatum'
import {
  POLL_WITHOUT_SNAPSHOT,
  POLL_WITH_SNAPSHOT,
  PROPOSAL,
  PROPOSAL_RESULTS,
  VOTE,
} from '../fixtures/data/entities'

describe('encode and decode metadatum', () => {
  describe('encode and decode proposal', () => {
    test('correctly encodes and decodes proposal with 1 accept and 1 reject choice', () => {
      const proposalMetadatum = PROPOSAL
      const encodedProposal = encodeProposalMetadatum(proposalMetadatum)
      const decodedProposal = decodeProposalMetadatum(encodedProposal)
      expect(decodedProposal).toEqual(proposalMetadatum)
    })

    test('correctly encodes and decodes proposal with multiple accept and reject choices', () => {
      const proposalMetadatum: ProposalMetadatum = {
        ...PROPOSAL,
        acceptChoices: ['accept - option 1', 'accept - option 2', 'accept - option 3'],
        rejectChoices: ['reject - option 1', 'reject - option 2', 'reject - option 3'],
      }
      const encodedProposal = encodeProposalMetadatum(proposalMetadatum)
      const decodedProposal = decodeProposalMetadatum(encodedProposal)
      expect(decodedProposal).toEqual(proposalMetadatum)
    })

    test('does not decode proposal with no choices', () => {
      const proposalMetadatum: ProposalMetadatum = {
        ...PROPOSAL,
        acceptChoices: [],
        rejectChoices: [],
      }
      const encodedProposal = encodeProposalMetadatum(proposalMetadatum)

      expect(() => decodeProposalMetadatum(encodedProposal)).toThrowError(
        'Proposal needs at least 1 choice'
      )
    })

    test('correctly encodes and decodes proposal with description longer than 64 bytes', () => {
      const proposalMetadatum: ProposalMetadatum = {
        ...PROPOSAL,
        description: 'description'.repeat(20),
      }
      const encodedProposal = encodeProposalMetadatum(proposalMetadatum)
      const decodedProposal = decodeProposalMetadatum(encodedProposal)
      expect(decodedProposal).toEqual(proposalMetadatum)
    })
  })

  describe('encode and decode poll', () => {
    test('correctly encodes and decodes poll with a snapshot date', () => {
      const pollMetadatum = POLL_WITH_SNAPSHOT
      const encodedPoll = encodePollMetadatum(pollMetadatum)
      const decodedPoll = decodePollMetadatum(encodedPoll)
      expect(decodedPoll).toEqual(pollMetadatum)
    })

    test('correctly encodes and decodes poll without a snapshot date', () => {
      const pollMetadatum = POLL_WITHOUT_SNAPSHOT
      const encodedPoll = encodePollMetadatum(pollMetadatum)
      const decodedPoll = decodePollMetadatum(encodedPoll)

      expect(decodedPoll).toEqual({
        ...pollMetadatum,
        snapshot: pollMetadatum.start,
      })
    })

    test('correctly encodes and decodes existing poll', () => {
      const pollMetadatum: PollMetadatum = {
        ...POLL_WITH_SNAPSHOT,
        txHash: 'e93bd59a72e1a71f50c671328d0e021563b1c7617c722d35c92c70cacb0a686f',
      }
      const encodedPoll = encodePollMetadatum(pollMetadatum)
      const decodedPoll = decodePollMetadatum(encodedPoll)

      expect(decodedPoll).toEqual(pollMetadatum.txHash)
    })
  })

  describe('encode and decode vote', () => {
    test('correctly encodes and decodes 1 vote', () => {
      const vote = VOTE
      const votes = [vote]
      const encodedVotes = encodeVotesMetadatum(votes)
      const decodedVotes = decodeVotesMetadatum(encodedVotes)
      expect(decodedVotes).toEqual(votes)
    })

    test('correctly encodes and decodes multiple votes', () => {
      const vote = VOTE
      const votes = [vote, vote, vote, vote]
      const encodedVotes = encodeVotesMetadatum(votes)
      const decodedVotes = decodeVotesMetadatum(encodedVotes)
      expect(decodedVotes).toEqual(votes)
    })
  })

  describe('encode and decode add-proposal operation', () => {
    test('correctly encodes and decodes add-proposal operation', () => {
      const proposalMetadatum = PROPOSAL
      const pollMetadatum = POLL_WITH_SNAPSHOT
      const encodedOperation = encodeAddProposalOperation(proposalMetadatum, pollMetadatum)
      const decodedOperation = decodeAddProposalOperation(encodedOperation)
      expect(decodedOperation).toEqual({proposal: proposalMetadatum, poll: pollMetadatum})
    })
  })

  describe('encode and decode conclude-proposal operation', () => {
    test('correctly encodes and decodes conclude-proposal operation', () => {
      const proposalTxHash = 'e93bd59a72e1a71f50c671328d0e021563b1c7617c722d35c92c70cacb0a686f'
      const results = PROPOSAL_RESULTS

      const encodedOperation = encodeConcludeProposalOperation(proposalTxHash, results)
      const decodedOperation = decodeConcludeProposalOperation(encodedOperation)
      expect(decodedOperation).toEqual({
        proposalTxHash: Buffer.from(proposalTxHash, 'hex'),
        result: results.result,
      })
    })
  })

  describe('encode and decode cancel-proposal operation', () => {
    test('correctly encodes and decodes add-proposal operation', () => {
      const proposalTxHash = 'e93bd59a72e1a71f50c671328d0e021563b1c7617c722d35c92c70cacb0a686f'
      const reason = 'not feasible'

      const encodedOperation = encodeCancelProposalOperation(proposalTxHash, reason)
      const decodedOperation = decodeCancelProposalOperation(encodedOperation)
      expect(decodedOperation).toEqual({proposalTxHash: Buffer.from(proposalTxHash, 'hex'), reason})
    })
  })
})
