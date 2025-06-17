import {SetRequired} from 'type-fest'

import type * as api from '@wingriders/cab/dappConnector'
import {RegisteredTokenMetadata} from '@wingriders/cab/tokenMetadata'
import {Address, Asset, BigNumber, HexString} from '@wingriders/cab/types'

export enum GovMetadatumLabel {
  COMMUNITY_VOTING_MANAGE = 5752,
  COMMUNITY_VOTING_VOTE = 5753,
}

export enum GovManagementOp {
  ADD_PROPOSAL = 'addProposal',
  CANCEL_PROPOSAL = 'cancelProposal',
  CONCLUDE_PROPOSAL = 'concludeProposal',
}

export enum GovPollOp {
  ASSIGN_EXISTING = 'assign',
  CREATE_NEW = 'create',
}

export enum CborVoteField {
  VOTER_ADDRESS = 'owner',
  VOTING_POWER = 'power',
  VOTING_UTXOS = 'utxos',
  CHOICES = 'choices',
  // NOTE = 'note'
}

export enum CborProposalField {
  PROPOSAL_OWNER = 'owner',
  PROPOSAL_NAME = 'name',
  PROPOSAL_DESCRIPTION = 'description',
  PROPOSAL_URI = 'uri',
  PROPOSAL_COMMUNITY_URI = 'communityUri',
  PROPOSAL_ACCEPT_CHOICES = 'acceptChoices',
  PROPOSAL_REJECT_CHOICES = 'rejectChoices',
  PROPOSAL_REQUESTED_AMOUNT = 'requestedAmount',
}

export enum CborPollField {
  POLL_ID = 'id',
  POLL_OP = 'op',
  POLL_START = 'start',
  POLL_SNAPSHOT = 'snapshot',
  POLL_END = 'end',
  POLL_DESCRIPTION = 'description',
}

export type GovernanceVotingParams = {
  proposalsAddress: Address
  proposalCollateralQuantity: BigNumber
  governanceToken: {
    asset: Asset
    metadata?: RegisteredTokenMetadata
  }
}

/**
 * BASE governance types
 */

export type ProposalMetadatum = {
  owner: Address
  name: string /* max 64 bytes */
  description: string /* max 192 bytes */
  uri: string /* ipfs link max 64 bytes */
  communityUri: string /* community discussion link max 64 bytes. Use url shortener. Ideally community page link */
  acceptChoices: string[] /* List of choices that would lead to accept the proposal, each max 64 bytes */
  rejectChoices: string[] /* List of choices that would lead to reject the proposal, each max 64 bytes */
  requestedAmount?: BigNumber
}

export type Proposal = ProposalMetadatum & {
  txHash: HexString
  slot: number
  status: ProposalStatus
  poll: Poll
}

export type PollMetadatum = {
  txHash?: HexString /* txHash of the poll. If it's not an existing poll, the id is not available */
  start: Date
  snapshot?: Date /* by default the start date */
  end: Date
  description: string
}

export type Poll = SetRequired<PollMetadatum, 'txHash' | 'snapshot'>

export type Vote = {
  voterAddress: Address
  pollTxHash: HexString /* txHash where it was created */
  votingPower: number
  votingUTxOs: api.TxInput[]
  /* choices are the proposals that are included in the poll
   * with the proposal tx hash as key.
   * The numbers are index of the choice, -1 is abstain from vote,
   * then in order of accept then reject, meaning index in the
   * [...acceptChoices, ...rejectChoices] array
   */
  choices: Record<HexString, number>
  //note: string /* potential future extension */
}

export enum ProposalStatus {
  AVAILABLE = 'AVAILABLE',
  CANCELLED = 'CANCELLED',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

export type TxMetadatum = number | string | Buffer | TxMetadatum[] | Map<TxMetadatum, TxMetadatum>
export type TxMetadatumMap = Map<TxMetadatum, TxMetadatum>

// (U)TxO identifier string in format: `<txHash>#<outputIndex>`
export type UtxoId = string

export type TokenCountWithUtxoIds<T extends string | BigNumber> = {
  tokenCount: T
  utxoIds: UtxoId[]
}

export enum DistributionKey {
  WALLET_TOKENS = 'walletTokens',
}

export const VOTING_WEIGHTS: {[key in DistributionKey]: number} = {
  [DistributionKey.WALLET_TOKENS]: 1,
}

type TokenCountWithPower = {tokenCount: BigNumber; votingPower: BigNumber}

export type VotingDistribution = {[key in keyof typeof VOTING_WEIGHTS]: TokenCountWithPower}

export type TokenDistribution<T extends string | BigNumber> = {
  [DistributionKey.WALLET_TOKENS]: TokenCountWithUtxoIds<T>
}

export type GovernanceVotingParamsResponse = {
  governanceToken: {
    asset: Asset
    metadata?: RegisteredTokenMetadata
  }
  totalMintedGovernanceTokens: number
  proposalCollateralQuantity: number
  proposalsAddress: Address
}

export enum VoteVerificationState {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  INVALID = 'INVALID',
}

export type VotesByState = {[k in VoteVerificationState]: string}

export type ChoiceVoteAggregation = {
  index: number
  votingPower: VotesByState
  votingCount: VotesByState
}

export type VoteAggregationByProposalResponse = {
  [proposalTxHash: HexString]: {
    votingPower: VotesByState
    votingCount: VotesByState
    byChoice: ChoiceVoteAggregation[]
  }
}

export type UserVotesResponse = {
  [proposalTxHash: HexString]: {
    index: number
    votingPower: string
    verificationState: VoteVerificationState
  }
}

export type VotesFilter = {
  proposalTxHashes?: HexString[]
}

export type UserVotesFilter = {
  proposalTxHashes?: HexString[]
  ownerStakeKeyHash: HexString
}

export type UserVotingDistributionFilter = {
  ownerStakeKeyHash: HexString
  slot?: number
}

export type UserVotingDistributionResponse = {
  utxoIds: UtxoId[]
  walletTokens: {
    tokenCount: string
    votingPower: string
  }
  slot: number
}

export type ProposalDetails = {
  txHash: HexString
  outputIndex: number
  owner: Address
  name: string
  description: string
  uri: string
  communityUri: string
  poll: {
    txHash: HexString
    start: number
    end: number
    snapshot: number
    description: string
  }
  slot: number
  status: ProposalStatus
  acceptChoices: string[]
  rejectChoices: string[]
  requestedAmount?: string
}

export type ProposalResponse = ProposalDetails & {
  choices: {[value: string]: number}
  abstained: number
  total: number
}

export type ProposalsResponse = ProposalDetails[]

export type PaidFeesFilter = {
  fromSlot?: number // defaults to the slot of the first transaction
  toSlot?: number // defaults to the slot of the last transaction
}

export type PaidFeesResponse = {
  /** total fees paid for proposals management transactions (create, cancel, conclude) */
  proposals: string
  /** total fees paid for voting transactions */
  votes: string
}

export type ProposalResults = {
  result: 'PASSED' | 'FAILED'
  /** <choice name, voting power> */
  choices: Record<string, number>
  /** total voting power used to vote for this proposal (including abstained) */
  total: number
  /** total voting power used to vote for the abstain choice */
  abstained: number
  note: string
}
