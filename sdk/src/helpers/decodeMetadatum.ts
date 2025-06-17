import {isMap} from 'lodash'

import {HexString, TxHash, TxInput, UInt} from '@wingriders/cab/dappConnector'
import {BigNumber} from '@wingriders/cab/types'

import {
  CborPollField,
  CborProposalField,
  CborVoteField,
  GovPollOp,
  PollMetadatum,
  ProposalMetadatum,
  TxMetadatum,
  TxMetadatumMap,
  Vote,
} from '../types'
import {
  assertMetadatumMap,
  parseAddressBuffer,
  parseArray,
  parseBigNumber,
  parseBuffer,
  parseInteger,
  parseNumber,
  parsePosixTime,
  parseString,
  parseStringArray,
} from './metadata'

export const decodeProposalMetadatum = (proposalMetadatum: TxMetadatumMap): ProposalMetadatum => {
  const owner = parseAddressBuffer(proposalMetadatum.get(CborProposalField.PROPOSAL_OWNER))
  const name = parseString(proposalMetadatum.get(CborProposalField.PROPOSAL_NAME))
  const description = parseString(proposalMetadatum.get(CborProposalField.PROPOSAL_DESCRIPTION))
  const uri = parseString(proposalMetadatum.get(CborProposalField.PROPOSAL_URI))
  const communityUri = parseString(proposalMetadatum.get(CborProposalField.PROPOSAL_COMMUNITY_URI))
  const acceptChoices = parseStringArray(
    proposalMetadatum.get(CborProposalField.PROPOSAL_ACCEPT_CHOICES)
  )
  const rejectChoices = parseStringArray(
    proposalMetadatum.get(CborProposalField.PROPOSAL_REJECT_CHOICES)
  )

  const requestedAmountField = proposalMetadatum.get(CborProposalField.PROPOSAL_REQUESTED_AMOUNT)
  const requestedAmount = requestedAmountField ? parseBigNumber(requestedAmountField) : undefined

  if (acceptChoices.length === 0 && rejectChoices.length === 0) {
    throw new Error('Proposal needs at least 1 choice')
  }

  return {
    owner,
    name,
    description,
    uri,
    communityUri,
    acceptChoices,
    rejectChoices,
    requestedAmount,
  }
}

export const decodePollMetadatum = (pollMetadatum: TxMetadatumMap): PollMetadatum | HexString => {
  const operation = parseString(pollMetadatum.get(CborPollField.POLL_OP))

  if (operation === GovPollOp.CREATE_NEW) {
    const description = parseString(pollMetadatum.get(CborPollField.POLL_DESCRIPTION))
    const start = parsePosixTime(pollMetadatum.get(CborPollField.POLL_START))
    const end = parsePosixTime(pollMetadatum.get(CborPollField.POLL_END))
    const snapshot = parsePosixTime(pollMetadatum.get(CborPollField.POLL_SNAPSHOT))

    if (start > end) {
      throw new Error(`Poll start must be before end`)
    }

    return {
      description,
      start,
      end,
      snapshot,
    }
  } else if (operation === GovPollOp.ASSIGN_EXISTING) {
    const txHash = parseBuffer(pollMetadatum.get(CborPollField.POLL_ID))
    return txHash.toString('hex') as HexString
  } else {
    throw new Error()
  }
}

export const decodeAddProposalOperation = (
  addProposalMetadatum: TxMetadatumMap
): {proposal: ProposalMetadatum; poll: PollMetadatum | HexString} => {
  const proposalMetadata = addProposalMetadatum.get('proposal')
  const pollMetadata = addProposalMetadatum.get('poll')

  if (!proposalMetadata || !isMap(proposalMetadata)) {
    throw new Error('Proposal is missing in the metadatum or is not a map')
  }
  if (!pollMetadata || !isMap(pollMetadata)) {
    throw new Error('Poll is missing in the metadatum or is not a map')
  }

  const proposal = decodeProposalMetadatum(proposalMetadata)
  const poll = decodePollMetadatum(pollMetadata)

  return {
    proposal,
    poll,
  }
}

export const decodeConcludeProposalOperation = (concludeProposalMetadatum: TxMetadatumMap) => {
  const proposalTxHash = parseBuffer(concludeProposalMetadatum.get('id'))
  const result = parseString(concludeProposalMetadatum.get('result'))

  // the other fields are not relevant and are mostly there as proof
  return {
    proposalTxHash,
    result,
  }
}

export const decodeCancelProposalOperation = (cancelProposalMetadatum: TxMetadatumMap) => {
  const proposalTxHash = parseBuffer(cancelProposalMetadatum.get('id'))
  const reason = parseString(cancelProposalMetadatum.get('reason'))

  // the other fields are not relevant and are mostly there as proof
  return {
    proposalTxHash,
    reason,
  }
}

/** decode votes */

const decodeVotingUTxOMetadatum = (votingUTxOMetadatum: TxMetadatum): TxInput => {
  const votingUTxO = parseArray(votingUTxOMetadatum)
  if (votingUTxO.length !== 2) {
    throw new Error(`Incorrect votingUTxO format: ${votingUTxO}`)
  }

  const txHash = parseBuffer(votingUTxO[0]).toString('hex') as TxHash
  const index = new BigNumber(parseInteger(votingUTxO[1])) as UInt
  return {txHash, index}
}

const decodeVotingUTxOsMetadatum = (votingUTxOsMetadatum: TxMetadatum | undefined): TxInput[] => {
  const votingUTxOs = parseArray(votingUTxOsMetadatum)
  return votingUTxOs.map(decodeVotingUTxOMetadatum)
}

const decodeVoteChoicesMetadatum = (choicesMetadatum: TxMetadatum | undefined): Vote['choices'] => {
  const choices = assertMetadatumMap(choicesMetadatum)

  return Object.fromEntries(
    [...choices.entries()].map(([proposalHashMetadatum, choiceIndexMetadatum]) => {
      const choiceIndex = parseInteger(choiceIndexMetadatum)
      if (choiceIndex < -1) {
        throw new Error(`Incorrect choiceIndex value: ${choiceIndex}`)
      }
      return [parseBuffer(proposalHashMetadatum).toString('hex'), choiceIndex]
    })
  )
}

export const decodeVotesMetadatum = (votesMetadatum: TxMetadatumMap): Vote[] => {
  return [...votesMetadatum.entries()].map(([pollHashMetadatum, pollVoteMetadatum]) => {
    const pollTxHash = parseBuffer(pollHashMetadatum).toString('hex') as TxHash
    const voteMap = assertMetadatumMap(pollVoteMetadatum)
    const voterAddress = parseAddressBuffer(voteMap.get(CborVoteField.VOTER_ADDRESS))
    const votingPower = parseNumber(voteMap.get(CborVoteField.VOTING_POWER))
    const votingUTxOs = decodeVotingUTxOsMetadatum(voteMap.get(CborVoteField.VOTING_UTXOS))
    const choices = decodeVoteChoicesMetadatum(voteMap.get(CborVoteField.CHOICES))

    return {
      pollTxHash,
      voterAddress,
      votingPower,
      votingUTxOs,
      choices,
    }
  })
}
