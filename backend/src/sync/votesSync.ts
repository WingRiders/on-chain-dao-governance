import {spendingHashFromAddress, stakingHashFromAddress} from '@wingriders/cab/ledger/address'
import {Address, TxMetadatum} from '@wingriders/cab/types'
import assert from 'assert'
import {compact} from 'lodash'

import {logger} from '../logger'
import {Block, PrismaTxClient} from '../db/prismaClient'
import {assertArray, assertBuffer, parseAddressBuffer, parseInteger, parseNumber} from './metadataHelper'
import {assertMetadataMap, parseOgmios6Metadatum, parseOgmiosMetadatum} from '../ogmios/metadata'
import {Transaction} from '@cardano-ogmios/schema'
import {CborVoteField, GovMetadatumLabel} from '@wingriders/governance-sdk'

type Choice = [Buffer, number]

// (U)TxO identifier string in format: `<txHash>#<outputIndex>`
type UtxoId = string

type PollVotes = {
  owner: Address
  votingPower: number
  /* utxos encoded as cddl [txHash, outputIndex] */
  votingUTxOs: UtxoId[]
  choices: Choice[]
}

const getUtxoId = ({
  txHash,
  outputIndex,
}: {
  txHash: string | Buffer
  outputIndex: number | bigint
}): UtxoId => `${Buffer.isBuffer(txHash) ? txHash.toString('hex') : txHash}#${outputIndex}`

const parseVotingUTxO = (votingUTxOMetadatum: TxMetadatum): UtxoId => {
  const votingUTxO = assertArray(votingUTxOMetadatum)
  if (votingUTxO.length !== 2) {
    throw new Error(`Incorrect votingUTxO format: ${votingUTxO}`)
  }

  const txHash = assertBuffer(votingUTxO[0])
  const outputIndex = parseInteger(votingUTxO[1])
  return getUtxoId({txHash, outputIndex})
}

const parseVotingUTxOs = (votingUTxOsMetadatum: TxMetadatum | undefined): UtxoId[] => {
  const votingUTxOs = assertArray(votingUTxOsMetadatum)
  return votingUTxOs.map((utxo) => parseVotingUTxO(utxo))
}

function parseProposalsChoices(choicesMetadatum: TxMetadatum | undefined): Choice[] {
  const choices = assertMetadataMap(choicesMetadatum)

  return [...choices.entries()].map(([proposalHashMetadatum, choiceIndexMetadatum]) => {
    const choiceIndex = parseInteger(choiceIndexMetadatum)
    assert(choiceIndex >= -1, `Incorrect choiceIndex value: ${choiceIndex}`)
    return [assertBuffer(proposalHashMetadatum), choiceIndex]
  })
}

function parsePollVotes(pollVotesMetadatum: TxMetadatum): PollVotes {
  const pollVotes = assertMetadataMap(pollVotesMetadatum)
  const owner = parseAddressBuffer(pollVotes.get(CborVoteField.VOTER_ADDRESS))
  const votingPower = parseNumber(pollVotes.get(CborVoteField.VOTING_POWER))
  const votingUTxOs = parseVotingUTxOs(pollVotes.get(CborVoteField.VOTING_UTXOS))
  const choices = parseProposalsChoices(pollVotes.get(CborVoteField.CHOICES))

  return {
    owner,
    votingPower,
    votingUTxOs,
    choices,
  }
}

function parseVotes(votesMetadatum: TxMetadatum): [Buffer, PollVotes][] {
  const votes = assertMetadataMap(votesMetadatum)
  return [...votes.entries()].map(([pollHashMetadatum, pollVoteMetadatum]) => {
    return [assertBuffer(pollHashMetadatum), parsePollVotes(pollVoteMetadatum)]
  })
}

// Insert user's votes for voted proposal from the same poll.
// Ignore votes for not valid proposal or choices
async function insertPollVotes(
  prismaTx: PrismaTxClient,
  dbBlock: Block,
  txBody: Transaction,
  pollHash: Buffer,
  pollVotes: PollVotes
) {
  const ownerAddress = pollVotes.owner
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
    where: {txHash: pollHash},
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
    throw new Error(`Poll does not exist: ${pollHash.toString('hex')}`)
  }

  // Process only votes cast during voting period of poll
  const castVotesDate = dbBlock.time
  if (!(dbPollWithProposals.start <= castVotesDate && castVotesDate <= dbPollWithProposals.end)) {
    logger.error(`Votes for poll ${pollHash.toString('hex')} casted outside voting period.`)
    return
  }

  const proposalVotes = compact(
    pollVotes.choices.map((proposalChoice) => {
      // TODO: Suppose there is only a few proposals in one poll. When the number increase optimize.
      const [proposalHash, choiceIndex] = proposalChoice
      const dbProposal = dbPollWithProposals.proposals.find(
        (proposal) => Buffer.compare(proposal.txHash, proposalHash) === 0
      )
      if (!dbProposal) {
        logger.error(
          `Proposal ${proposalHash.toString('hex')} for poll ${pollHash.toString('hex')} does not exist.`
        )
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
        votingPower: pollVotes.votingPower,
        votingUTxOs: pollVotes.votingUTxOs,
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
      poll: pollHash.toString('hex'),
    },
    `Inserted votes`
  )
}

export async function insertGovernanceVotes(
  prismaTx: PrismaTxClient,
  dbBlock: Block,
  txBody: Transaction
) {
  // check if there is the correct metadata
  const metadata = txBody.metadata?.labels?.[GovMetadatumLabel.COMMUNITY_VOTING_VOTE]
  if (!metadata) {
    // only parse metadata with voting operation
    return Promise.resolve()
  }

  try {
    logger.info(metadata)
    const decodedMetadata: TxMetadatum = parseOgmios6Metadatum(metadata)
    if (decodedMetadata === null) {
      logger.error('Metadata with no json nor cbor field')
      return
    }
    logger.info(decodedMetadata, 'Decoded metadata')
    const votes = parseVotes(decodedMetadata)

    return await Promise.all(
      votes.map(([pollHash, pollVotes]) =>
        insertPollVotes(prismaTx, dbBlock, txBody, pollHash, pollVotes).catch((e) =>
          logger.error(e, `Error processing governance pollVotes. txHash: ${txBody.id}`)
        )
      )
    )
  } catch (e) {
    logger.error(e, `Error processing governance votes. txHash: ${txBody.id}`)
    return Promise.resolve()
  }
}
