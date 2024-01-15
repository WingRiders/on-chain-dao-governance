import {compact} from 'lodash'

import {addressToHex} from '@wingriders/cab/ledger/address'
import {splitMetadatumString} from '@wingriders/cab/ledger/transaction'
import {TxMetadatum} from '@wingriders/cab/types'

import {
  CborPollField,
  CborProposalField,
  CborVoteField,
  GovManagementOp,
  GovPollOp,
  PollMetadatum,
  ProposalMetadatum,
  Vote,
} from '../types'

function encodeProposalProperties(proposal: ProposalMetadatum): TxMetadatum {
  const encodedProposalProperties: TxMetadatum = new Map<TxMetadatum, TxMetadatum>([
    [CborProposalField.PROPOSAL_OWNER, Buffer.from(addressToHex(proposal.owner), 'hex')],
    [CborProposalField.PROPOSAL_NAME, proposal.name],
    [CborProposalField.PROPOSAL_DESCRIPTION, splitMetadatumString(proposal.description)],
    [CborProposalField.PROPOSAL_URI, proposal.uri],
    [CborProposalField.PROPOSAL_COMMUNITY_URI, proposal.communityUri],
    [CborProposalField.PROPOSAL_ACCEPT_CHOICES, proposal.acceptChoices],
    [CborProposalField.PROPOSAL_REJECT_CHOICES, proposal.rejectChoices],
  ])
  return encodedProposalProperties
}

export function encodeProposal(proposal: ProposalMetadatum, poll: PollMetadatum): TxMetadatum {
  const encodedProposalProperties = encodeProposalProperties(proposal)

  const newProposal: TxMetadatum = new Map<TxMetadatum, TxMetadatum>([
    ['op', GovManagementOp.ADD_PROPOSAL],
    ['proposal', encodedProposalProperties],
    ['poll', encodePollProperties(poll)],
  ])

  return newProposal
}

function encodePollProperties(poll: PollMetadatum): TxMetadatum {
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
export function encodeVote(vote: Vote): TxMetadatum {
  return new Map<TxMetadatum, TxMetadatum>([
    [
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
    ],
  ])
}
