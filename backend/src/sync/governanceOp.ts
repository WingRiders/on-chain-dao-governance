import {Transaction, TransactionOutput} from '@cardano-ogmios/schema'
import {isString} from 'lodash'

import {spendingHashFromAddress, stakingHashFromAddress} from '@wingriders/cab/ledger/address'
import {TxMetadatum} from '@wingriders/cab/types'
import {
  GovManagementOp,
  GovMetadatumLabel,
  decodeAddProposalOperation,
  decodeCancelProposalOperation,
  decodeConcludeProposalOperation,
  parseString,
} from '@wingriders/governance-sdk'

import {config, governanceToken, proposalsAddress} from '../config'
import {Block, PrismaTxClient, ProposalChoiceType, ProposalStatus} from '../db/prismaClient'
import {bigNumberToBigint} from '../helpers/number'
import {logger} from '../logger'
import {getTokenQuantity} from '../ogmios/getTokenQuantity'
import {assertMetadatumMap, parseMetadatumLabel} from '../ogmios/metadata'
import {upsertTransaction} from './transaction'

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

  const manageData = decodeAddProposalOperation(data)
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
  await upsertTransaction({prismaTx, transaction: txBody, slot})
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
      requestedAmount: manageData.proposal.requestedAmount
        ? bigNumberToBigint(manageData.proposal.requestedAmount)
        : null,
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
  const manageData = decodeConcludeProposalOperation(data)

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

  await upsertTransaction({prismaTx, transaction: txBody, slot: dbBlock.slot})
  await prismaTx.proposalState.create({
    data: {
      transaction: {
        connect: {
          txHash: manageData.proposalTxHash,
        },
      },
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
  const manageData = decodeCancelProposalOperation(data)

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

  await upsertTransaction({prismaTx, transaction: txBody, slot: dbBlock.slot})
  await prismaTx.proposalState.create({
    data: {
      transaction: {
        connect: {
          txHash: manageData.proposalTxHash,
        },
      },
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
