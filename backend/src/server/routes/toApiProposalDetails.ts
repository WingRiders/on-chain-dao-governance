import {Address} from '@wingriders/cab/types'
import {
  ProposalDetails as ApiProposalDetails,
  ProposalStatus as ApiProposalStatus,
} from '@wingriders/governance-sdk'

import {
  ProposalStatus as DbProposalStatus,
  Poll,
  Proposal,
  ProposalChoice,
  ProposalChoiceType,
  ProposalState,
} from '../../db/prismaClient'

const dbProposalStatusToApiProposalStatus = (dbProposalStatus: DbProposalStatus): ApiProposalStatus =>
  ({
    [DbProposalStatus.AVAILABLE]: ApiProposalStatus.AVAILABLE,
    [DbProposalStatus.FAILED]: ApiProposalStatus.FAILED,
    [DbProposalStatus.PASSED]: ApiProposalStatus.PASSED,
    [DbProposalStatus.CANCELLED]: ApiProposalStatus.CANCELLED,
  })[dbProposalStatus]

type DbProposalWithDetails = Pick<
  Proposal,
  | 'txHash'
  | 'outputIndex'
  | 'ownerAddress'
  | 'name'
  | 'description'
  | 'uri'
  | 'communityUri'
  | 'slot'
  | 'requestedAmount'
> & {
  poll: Pick<Poll, 'txHash' | 'start' | 'end' | 'snapshot' | 'description'>
  proposalStates: Pick<ProposalState, 'status'>[]
  proposalChoices: Pick<ProposalChoice, 'value' | 'type'>[]
}

export const toApiProposalDetails = (proposal: DbProposalWithDetails): ApiProposalDetails => ({
  txHash: proposal.txHash.toString('hex'),
  outputIndex: proposal.outputIndex,
  owner: proposal.ownerAddress as Address,
  name: proposal.name,
  description: proposal.description,
  uri: proposal.uri,
  communityUri: proposal.communityUri,
  poll: {
    txHash: proposal.poll.txHash.toString('hex'),
    start: proposal.poll.start.valueOf(),
    end: proposal.poll.end.valueOf(),
    snapshot: proposal.poll.snapshot.valueOf(),
    description: proposal.poll.description,
  },
  slot: Number(proposal.slot).valueOf(),
  status: dbProposalStatusToApiProposalStatus(
    proposal.proposalStates[0]?.status || ApiProposalStatus.AVAILABLE
  ),
  acceptChoices: proposal.proposalChoices
    .filter((choice) => choice.type === ProposalChoiceType.ACCEPT)
    .map((choice) => choice.value),
  rejectChoices: proposal.proposalChoices
    .filter((choice) => choice.type === ProposalChoiceType.REJECT)
    .map((choice) => choice.value),
  requestedAmount: proposal.requestedAmount?.toString(),
})
