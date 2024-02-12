import {Transaction} from '@cardano-ogmios/schema'
import {compact} from 'lodash'

import {spendingHashFromAddress, stakingHashFromAddress} from '@wingriders/cab/ledger/address'
import {TxMetadatum} from '@wingriders/cab/types'
import {GovMetadatumLabel, Vote, decodeVotesMetadatum, getUtxoId} from '@wingriders/governance-sdk'

import {Block, PrismaTxClient} from '../db/prismaClient'
import {logger} from '../logger'
import {assertMetadatumMap, parseMetadatumLabel} from '../ogmios/metadata'
import {upsertTransaction} from './transaction'

// Insert user's votes for voted proposal from the same poll.
// Ignore votes for not valid proposal or choices
async function insertPollVote(
  prismaTx: PrismaTxClient,
  dbBlock: Block,
  txBody: Transaction,
  pollVote: Vote
) {
  const ownerAddress = pollVote.voterAddress
  const ownerPubKeyHash = Buffer.from(spendingHashFromAddress(ownerAddress), 'hex')
  const ownerStakeKeyHash = Buffer.from(stakingHashFromAddress(ownerAddress), 'hex')

  // Check, whether the tx is signed by voterStakeKey
  if (
    // In theory a tx could contain votes for multiple users
    !txBody.requiredExtraSignatories?.some(
      (signature) => ownerStakeKeyHash.compare(Buffer.from(signature, 'hex')) === 0
    )
  ) {
    throw new Error(
      `Transaction is not signed by voterStakeKey. requiredExtraSignatures: ${
        txBody.requiredExtraSignatories
      }, voterStakeKey: ${ownerStakeKeyHash.toString('hex')}`
    )
  }
  const dbPollWithProposals = await prismaTx.poll.findUnique({
    where: {txHash: Buffer.from(pollVote.pollTxHash, 'hex')},
    include: {
      proposals: {
        include: {
          proposalChoices: {
            orderBy: {index: 'asc'},
          },
        },
      },
    },
  })
  if (!dbPollWithProposals) {
    throw new Error(`Poll does not exist: ${pollVote.pollTxHash}`)
  }

  // Process only votes cast during voting period of poll
  const castVotesDate = dbBlock.time
  if (!(dbPollWithProposals.start <= castVotesDate && castVotesDate <= dbPollWithProposals.end)) {
    logger.error(`Votes for poll ${pollVote.pollTxHash} casted outside voting period.`)
    return
  }

  await upsertTransaction({prismaTx, transaction: txBody, slot: dbBlock.slot})

  const proposalVotes = compact(
    Object.entries(pollVote.choices).map((proposalChoice) => {
      // TODO: Suppose there is only a few proposals in one poll. When the number increase optimize.
      const [proposalHashString, choiceIndex] = proposalChoice
      const proposalHash = Buffer.from(proposalHashString, 'hex')
      const dbProposal = dbPollWithProposals.proposals.find(
        (proposal) => Buffer.compare(proposal.txHash, proposalHash) === 0
      )
      if (!dbProposal) {
        logger.error(`Proposal ${proposalHashString} for poll ${pollVote.pollTxHash} does not exist.`)
        return null
      }
      // Choice is null when user abstained from vote
      const dbChoiceId = choiceIndex === -1 ? null : dbProposal.proposalChoices[choiceIndex]?.id
      if (dbChoiceId === undefined) {
        logger.error(`Choice ${choiceIndex} for proposal: ${proposalHash.toString('hex')}.`)
        return null
      }

      return {
        ownerAddress,
        ownerPubKeyHash,
        ownerStakeKeyHash,
        proposalId: dbProposal.id,
        choiceId: dbChoiceId,
        pollId: dbPollWithProposals.id,
        votingPower: pollVote.votingPower,
        votingUTxOs: pollVote.votingUTxOs.map((utxo) =>
          getUtxoId({txHash: utxo.txHash, outputIndex: utxo.index.toNumber()})
        ),
        slot: dbBlock.slot,
        txHash: Buffer.from(txBody.id, 'hex'),
      }
    })
  )

  await prismaTx.vote.createMany({data: proposalVotes})

  logger.info(
    {
      txHash: txBody.id,
      insertedVotes: proposalVotes.length,
      poll: pollVote.pollTxHash,
    },
    `Inserted votes`
  )
}

export async function insertGovernanceVotes(
  prismaTx: PrismaTxClient,
  dbBlock: Block,
  txBody: Transaction
) {
  try {
    const parsedMetadatum: TxMetadatum | null = parseMetadatumLabel(
      txBody,
      GovMetadatumLabel.COMMUNITY_VOTING_VOTE
    )
    if (parsedMetadatum === null) {
      return
    }
    logger.info(parsedMetadatum, 'Parsed vote metadata')
    const votes = decodeVotesMetadatum(assertMetadatumMap(parsedMetadatum))

    await Promise.all(
      votes.map((vote) =>
        insertPollVote(prismaTx, dbBlock, txBody, vote).catch((e) =>
          logger.error(e, `Error processing governance pollVotes. txHash: ${txBody.id}`)
        )
      )
    )
    return
  } catch (e) {
    logger.error(e, `Error processing governance votes. txHash: ${txBody.id}`)
    return
  }
}
