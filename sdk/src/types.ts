import {BigNumber} from '@wingriders/cab/types'

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
}

export enum CborPollField {
  POLL_ID = 'id',
  POLL_OP = 'op',
  POLL_START = 'start',
  POLL_SNAPSHOT = 'snapshot',
  POLL_END = 'end',
  POLL_DESCRIPTION = 'description',
}

export type TxMetadatum = number | string | Buffer | TxMetadatum[] | Map<TxMetadatum, TxMetadatum>

// (U)TxO identifier string in format: `<txHash>#<outputIndex>`
export type UtxoId = string

export type TokenCountWithUtxoIds<T extends string | BigNumber> = {
  tokenCount: T
  utxoIds: UtxoId[]
}

export enum DistributionKey {
  WALLET_TOKENS = 'walletTokens',
}

export const VOTING_WEIGHTS = {
  [DistributionKey.WALLET_TOKENS]: 1,
}

type TokenCountWithPower = {tokenCount: BigNumber; votingPower: BigNumber}

export type VotingDistribution = {[key in keyof typeof VOTING_WEIGHTS]: TokenCountWithPower}

export type TokenDistribution<T extends string | BigNumber> = {
  [DistributionKey.WALLET_TOKENS]: TokenCountWithUtxoIds<T>
}
