import {compact} from 'lodash'

import {addressToHex} from '@wingriders/cab/ledger/address'
import {splitMetadatumString} from '@wingriders/cab/ledger/transaction'
import {HexString, TxMetadatum} from '@wingriders/cab/types'

import {
  CborPollField,
  CborProposalField,
  CborVoteField,
  GovManagementOp,
  GovPollOp,
  PollMetadatum,
  ProposalMetadatum,
  ProposalResults,
  TxMetadatumMap,
  Vote,
} from '../types'

export function encodeProposalMetadatum(proposal: ProposalMetadatum): TxMetadatumMap {
  const encodedProposalProperties: TxMetadatumMap = new Map<TxMetadatum, TxMetadatum>(
    compact([
      [CborProposalField.PROPOSAL_OWNER, Buffer.from(addressToHex(proposal.owner), 'hex')],
      [CborProposalField.PROPOSAL_NAME, proposal.name],
      [CborProposalField.PROPOSAL_DESCRIPTION, splitMetadatumString(proposal.description)],
      [CborProposalField.PROPOSAL_URI, proposal.uri],
      [CborProposalField.PROPOSAL_COMMUNITY_URI, proposal.communityUri],
      [CborProposalField.PROPOSAL_ACCEPT_CHOICES, proposal.acceptChoices],
      [CborProposalField.PROPOSAL_REJECT_CHOICES, proposal.rejectChoices],
      proposal.requestedAmount && [
        CborProposalField.PROPOSAL_REQUESTED_AMOUNT,
        proposal.requestedAmount.toString(),
      ],
    ])
  )
  return encodedProposalProperties
}

export function encodePollMetadatum(poll: PollMetadatum): TxMetadatumMap {
  if (poll.txHash) {
    return new Map<TxMetadatum, TxMetadatum>([
      [CborPollField.POLL_OP, GovPollOp.ASSIGN_EXISTING],
      [CborPollField.POLL_ID, Buffer.from(poll.txHash, 'hex')],
    ])
  } else {
    return new Map(
      compact<[TxMetadatum, TxMetadatum]>([
        [CborPollField.POLL_OP, GovPollOp.CREATE_NEW],
        [CborPollField.POLL_START, poll.start.valueOf()],
        [CborPollField.POLL_SNAPSHOT, (poll.snapshot || poll.start).valueOf()],
        [CborPollField.POLL_END, poll.end.valueOf()],
        [CborPollField.POLL_DESCRIPTION, splitMetadatumString(poll.description)],
      ])
    )
  }
}

/**
 *
 * Consideration: Since casting a vote is most used, we want to minimize the metadata size
 * to reduce the costs for users.
 */
export function encodeVotesMetadatum(votes: Vote[]): TxMetadatumMap {
  return new Map<TxMetadatum, TxMetadatum>(
    votes.map((vote) => [
      Buffer.from(vote.pollTxHash, 'hex'),
      new Map<TxMetadatum, TxMetadatum>([
        [CborVoteField.VOTER_ADDRESS, Buffer.from(addressToHex(vote.voterAddress), 'hex')],
        [CborVoteField.VOTING_POWER, Math.floor(vote.votingPower)],
        /* utxos encoded as cddl [txHash, outputIndex] */
        [
          CborVoteField.VOTING_UTXOS,
          vote.votingUTxOs.map((utxo) => [Buffer.from(utxo.txHash, 'hex'), utxo.index.toNumber()]),
        ],
        [
          CborVoteField.CHOICES,
          new Map<TxMetadatum, TxMetadatum>(
            Object.entries(vote.choices).map(([proposalTxHash, choice]) => [
              Buffer.from(proposalTxHash, 'hex'),
              choice,
            ])
          ),
        ],
      ]),
    ])
  )
}

export function encodeAddProposalOperation(
  proposal: ProposalMetadatum,
  poll: PollMetadatum
): TxMetadatumMap {
  const encodedProposalProperties = encodeProposalMetadatum(proposal)

  const newProposal: TxMetadatumMap = new Map<TxMetadatum, TxMetadatum>([
    ['op', GovManagementOp.ADD_PROPOSAL],
    ['proposal', encodedProposalProperties],
    ['poll', encodePollMetadatum(poll)],
  ])

  return newProposal
}

export function encodeConcludeProposalOperation(proposalTxHash: HexString, results: ProposalResults) {
  return new Map<TxMetadatum, TxMetadatum>([
    ['op', GovManagementOp.CONCLUDE_PROPOSAL],
    ['id', Buffer.from(proposalTxHash, 'hex')],
    ['result', results.result],
    ['choices', new Map<TxMetadatum, TxMetadatum>(Object.entries(results.choices))],
    ['total', results.total],
    ['abstained', results.abstained],
    ['note', splitMetadatumString(results.note)],
  ])
}

export function encodeCancelProposalOperation(proposalTxHash: HexString, reason: string) {
  return new Map<TxMetadatum, TxMetadatum>([
    ['op', GovManagementOp.CANCEL_PROPOSAL],
    ['id', Buffer.from(proposalTxHash, 'hex')],
    ['reason', splitMetadatumString(reason)],
  ])
}
