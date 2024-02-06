import {Transaction, TransactionOutput} from '@cardano-ogmios/schema'
import {isString} from 'lodash'

import {spendingHashFromAddress, stakingHashFromAddress} from '@wingriders/cab/ledger/address'
import {HexString, TxMetadatum} from '@wingriders/cab/types'
import {
  CborPollField,
  CborProposalField,
  GovManagementOp,
  GovMetadatumLabel,
  GovPollOp,
  PollMetadatum,
  ProposalMetadatum,
} from '@wingriders/governance-sdk'

import {config, governanceToken, proposalsAddress} from '../config'
import {Block, PrismaTxClient, ProposalChoiceType, ProposalStatus} from '../db/prismaClient'
import {logger} from '../logger'
import {getTokenQuantity} from '../ogmios/getTokenQuantity'
import {assertMetadatumMap, parseMetadatumLabel} from '../ogmios/metadata'
import {
  parseAddressBuffer,
  parseBuffer,
  parsePosixTime,
  parseString,
  parseStringArray,
} from './metadataHelper'

const parseProposal = (proposalMetadatum: TxMetadatum): ProposalMetadatum => {
  const proposalMetadata = assertMetadatumMap(proposalMetadatum)
  const owner = parseAddressBuffer(proposalMetadata.get(CborProposalField.PROPOSAL_OWNER))
  const name = parseString(proposalMetadata.get(CborProposalField.PROPOSAL_NAME))
  const description = parseString(proposalMetadata.get(CborProposalField.PROPOSAL_DESCRIPTION))
  const uri = parseString(proposalMetadata.get(CborProposalField.PROPOSAL_URI))
  const communityUri = parseString(proposalMetadata.get(CborProposalField.PROPOSAL_COMMUNITY_URI))
  const acceptChoices = parseStringArray(proposalMetadata.get(CborProposalField.PROPOSAL_ACCEPT_CHOICES))
  const rejectChoices = parseStringArray(proposalMetadata.get(CborProposalField.PROPOSAL_REJECT_CHOICES))

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
  }
}

const parsePoll = (pollMetadatum: TxMetadatum): PollMetadatum | HexString => {
  const pollMetadata = assertMetadatumMap(pollMetadatum)
  const operation = parseString(pollMetadata.get(CborPollField.POLL_OP))

  if (operation === GovPollOp.CREATE_NEW) {
    const description = parseString(pollMetadata.get(CborPollField.POLL_DESCRIPTION))
    const start = parsePosixTime(pollMetadata.get(CborPollField.POLL_START))
    const end = parsePosixTime(pollMetadata.get(CborPollField.POLL_END))
    const snapshot = parsePosixTime(pollMetadata.get(CborPollField.POLL_SNAPSHOT))

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
    const txHash = parseBuffer(pollMetadata.get(CborPollField.POLL_ID))
    return txHash.toString('hex')
  } else {
    throw new Error()
  }
}

const parseAddProposalMetadatum = (d: Map<TxMetadatum, TxMetadatum>) => {
  const proposalMetadata = d.get('proposal')
  const pollMetadata = d.get('poll')

  if (!proposalMetadata) {
    throw new Error('Proposal is missing from')
  }
  const proposal: ProposalMetadatum = parseProposal(proposalMetadata)
  if (!pollMetadata) {
    throw new Error('Poll is missing from the metadatum')
  }
  const poll: PollMetadatum | HexString = parsePoll(pollMetadata)
  return {
    proposal,
    poll,
  }
}

const parseConcludeProposalMetadatum = (d: Map<TxMetadatum, TxMetadatum>) => {
  const proposalTxHash = parseBuffer(d.get('id'))
  const result = parseString(d.get('result'))

  // the other fields are not relevant and are mostly there as proof
  return {
    proposalTxHash,
    result,
  }
}

const parseCancelProposal = (d: Map<TxMetadatum, TxMetadatum>) => {
  const proposalTxHash = parseBuffer(d.get('id'))
  const reason = parseString(d.get('reason'))

  // the other fields are not relevant and are mostly there as proof
  return {
    proposalTxHash,
    reason,
  }
}

const checkCollateral = (txOut: TransactionOutput) =>
  getTokenQuantity(governanceToken, txOut.value) >= config.PROPOSAL_COLLATERAL_QUANTITY

export const processGovernance = async (
  prismaTx: PrismaTxClient,
  dbBlock: Block,
  txBody: Transaction
) => {
  try {
    const parsedMetadatum: TxMetadatum | null = parseMetadatumLabel(
      txBody,
      GovMetadatumLabel.COMMUNITY_VOTING_MANAGE
    )
    if (parsedMetadatum === null) {
      return
    }
    const data = assertMetadatumMap(parsedMetadatum)
    const op = parseString(data.get('op'))
    switch (op) {
      case GovManagementOp.ADD_PROPOSAL:
        await processAddProposal({prismaTx, data, dbBlock, txBody})
        return
      case GovManagementOp.CONCLUDE_PROPOSAL:
        await processConcludeProposal({prismaTx, data, dbBlock, txBody})
        return
      case GovManagementOp.CANCEL_PROPOSAL:
        await processCancelProposal({prismaTx, data, dbBlock, txBody})
        return
      default:
        throw new Error('Unknown governance operation')
    }
  } catch (e: any) {
    logger.warn(e, 'Unexpected error while processing governance management')
  }
}

async function processAddProposal({
  prismaTx,
  data,
  dbBlock,
  txBody,
}: {
  prismaTx: PrismaTxClient
  data: Map<TxMetadatum, TxMetadatum>
  dbBlock: Block
  txBody: Transaction
}) {
  // find the first output on the governance proposals address
  const outputIndex = txBody.outputs.findIndex((txOut) => txOut.address === proposalsAddress)
  if (outputIndex === -1) {
    // only parse metadata if it's received by the governance address
    return
  }
  const txOut = txBody.outputs[outputIndex]

  if (!checkCollateral(txOut)) {
    logger.warn({txHash: txBody.id}, 'Not enough collateral for proposal')
    return
  }

  const manageData = parseAddProposalMetadatum(data)
  const ownerAddress = manageData.proposal.owner
  const ownerPubKeyHash = Buffer.from(spendingHashFromAddress(ownerAddress), 'hex')
  const ownerStakeKeyHash = Buffer.from(stakingHashFromAddress(ownerAddress), 'hex')
  const slot = dbBlock.slot
  const txHash = Buffer.from(txBody.id, 'hex')

  const choices = manageData.proposal.acceptChoices
    .map((value) => ({
      value,
      type: ProposalChoiceType.ACCEPT as ProposalChoiceType,
    }))
    .concat(
      manageData.proposal.rejectChoices.map((value) => ({
        value,
        type: ProposalChoiceType.REJECT as ProposalChoiceType,
      }))
    )
    .map((obj, index) => ({
      index,
      ...obj,
    }))

  // If txHash is present
  //   - but missing in our DB, the whole query fails
  //   - and matched with a Poll in DB, it will connect regardless of the Poll's status
  const pollCreateSql = isString(manageData.poll)
    ? {connect: {txHash: Buffer.from(manageData.poll, 'hex')}}
    : {
        create: {
          slot,
          txHash,
          start: manageData.poll.start,
          end: manageData.poll.end,
          snapshot: manageData.poll.snapshot ?? manageData.poll.start,
          description: manageData.poll.description,
        },
      }

  /**
   * Insert everything that's necessary into the DB
   */
  const proposal = await prismaTx.proposal.create({
    data: {
      ownerAddress,
      ownerPubKeyHash,
      ownerStakeKeyHash,
      block: {
        connect: {
          slot,
        },
      },
      txHash,
      outputIndex,
      name: manageData.proposal.name,
      description: manageData.proposal.description,
      uri: manageData.proposal.uri,
      communityUri: manageData.proposal.communityUri,
      poll: pollCreateSql,
      proposalChoices: {
        create: choices,
      },
      proposalStates: {
        create: {
          slot,
          txHash,
          status: ProposalStatus.AVAILABLE,
        },
      },
    },
  })
  logger.info({txHash: txHash.toString('hex'), proposalId: proposal.id}, 'Proposal created')
}

async function processConcludeProposal({
  prismaTx,
  data,
  dbBlock,
  txBody,
}: {
  prismaTx: PrismaTxClient
  data: Map<TxMetadatum, TxMetadatum>
  dbBlock: Block
  txBody: Transaction
}) {
  const manageData = parseConcludeProposalMetadatum(data)

  const txHash = manageData.proposalTxHash.toString('hex')
  const proposal = await prismaTx.proposal.findUnique({
    where: {
      txHash: manageData.proposalTxHash,
    },
  })

  if (!proposal) {
    logger.info({txHash}, 'Unable to find proposal')
    return
  }

  if (
    !txBody.inputs.some(
      (txIn) => txIn.transaction.id === txHash && txIn.index === Number(proposal.outputIndex)
    )
  ) {
    logger.warn({txHash}, 'Trying to conclude proposal without spending it')
    return
  }

  await prismaTx.proposalState.create({
    data: {
      txHash: manageData.proposalTxHash,
      block: {
        connect: {
          slot: dbBlock.slot,
        },
      },
      proposal: {
        connect: {
          txHash: manageData.proposalTxHash,
        },
      },
      status:
        manageData.result.toUpperCase() === ProposalStatus.PASSED
          ? ProposalStatus.PASSED
          : ProposalStatus.FAILED,
    },
  })
}

async function processCancelProposal({
  prismaTx,
  data,
  dbBlock,
  txBody,
}: {
  prismaTx: PrismaTxClient
  data: Map<TxMetadatum, TxMetadatum>
  dbBlock: Block
  txBody: Transaction
}) {
  const manageData = parseCancelProposal(data)

  const txHash = manageData.proposalTxHash.toString('hex')
  const proposal = await prismaTx.proposal.findUnique({
    where: {
      txHash: manageData.proposalTxHash,
    },
  })

  if (!proposal) {
    logger.info({txHash}, 'Unable to find proposal')
    return
  }

  if (
    !txBody.inputs.some(
      (txIn) => txIn.transaction.id === txHash && txIn.index === Number(proposal.outputIndex)
    )
  ) {
    logger.warn({txHash}, 'Trying to cancel proposal without spending it')
    return
  }

  await prismaTx.proposalState.create({
    data: {
      txHash: manageData.proposalTxHash,
      block: {
        connect: {
          slot: dbBlock.slot,
        },
      },
      proposal: {
        connect: {
          txHash: manageData.proposalTxHash,
        },
      },
      status: ProposalStatus.CANCELLED,
      cancelReason: manageData.reason,
    },
  })
}
