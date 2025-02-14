import {chunk} from 'lodash'

import {alonzoDateToSlotFactory, cacheResults, sleep} from '@wingriders/cab/helpers'
import {BigNumber} from '@wingriders/cab/types'

import {config} from '../config'
import {Poll, VerificationState, Vote, prisma} from '../db/prismaClient'
import {getSyncHealthStatus} from '../health/synchronization'
import {logger} from '../logger'
import {fetchUtxos} from './fetchUtxos'

const userWalletsUtxosCache = {}

const getUserWalletsUtxos = cacheResults(
  {maxAge: 1000 * 60 * 60 * 24 * 5}, // cache for 5 days
  userWalletsUtxosCache
)(fetchUtxos)

// to prevent aggregator overloading
const VOTE_VERIFICATION_CHUNK_SIZE = 5

const verifyVotesInPoll = async (poll: Poll & {votes: Vote[]}) => {
  logger.info(
    {job: 'voteValidation', pollId: poll.id, votes: poll.votes.length},
    'Verifying votes for poll'
  )

  const snapshotSlot = alonzoDateToSlotFactory(config.NETWORK_NAME)(poll.snapshot)

  const votesChunks = chunk(poll.votes, VOTE_VERIFICATION_CHUNK_SIZE)
  for (const votes of votesChunks) {
    await Promise.all(
      votes.map(async (vote) => {
        const ownerStakeKeyHash = vote.ownerStakeKeyHash.toString('hex')

        const expectedVotingPower =
          vote.votingUTxOs.length === 0
            ? {tokenCount: new BigNumber(0), utxoIds: []}
            : await getUserWalletsUtxos({
                slot: snapshotSlot,
                ownerStakeKeyHash,
              })
        logger.debug({voteId: vote.id, expectedVotingPower, actualVotingPower: vote.votingPower})

        // If the expectedVotingPower is bigger or equal to the reported voting
        // power we consider the vote to be valid and thus VERIFIED,
        // otherwise we mark it as INVALID
        if (expectedVotingPower.tokenCount.gte(new BigNumber(`${vote.votingPower}`))) {
          await prisma.vote.update({
            where: {id: vote.id},
            data: {verificationState: VerificationState.VERIFIED},
          })
        } else {
          logger.info({job: 'voteValidation', pollId: poll.id, voteId: vote.id}, 'Found INVALID vote')
          await prisma.vote.update({
            where: {id: vote.id},
            data: {verificationState: VerificationState.INVALID},
          })
        }
      })
    )
  }
}

const validationJob = async (dbBestBlock: number) => {
  logger.info({job: 'voteValidation'}, 'Checking for unverified votes')

  const pollsWithUnverifiedVotes = await prisma.poll.findMany({
    where: {
      votes: {
        // where votes are unverified and at least 5 blocks old to prevent checking votes that
        // could be potentially rolled back which could cause Prisma errors down the line
        some: {verificationState: VerificationState.UNVERIFIED, block: {height: {lt: dbBestBlock - 5}}},
      },
    },
    include: {
      votes: {
        where: {verificationState: VerificationState.UNVERIFIED, block: {height: {lt: dbBestBlock - 5}}},
      },
    },
  })

  if (pollsWithUnverifiedVotes.length === 0) {
    logger.info({job: 'voteValidation'}, 'No polls with unverified votes')
  }

  // Do the verification poll by poll to not accidentally overload Kupo or DB
  for (const pollWithUnverifiedVotes of pollsWithUnverifiedVotes) {
    await verifyVotesInPoll(pollWithUnverifiedVotes)
  }

  logger.info({job: 'voteValidation'}, 'Finished checking unverified votes')
}

export const voteValidationLoop = async () => {
  await sleep(10_000) // Wait 10 seconds to start

  // Max every minute run the validationJob
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const {dbBestBlock, isDbSynced} = await getSyncHealthStatus()

    if (!isDbSynced || !dbBestBlock) {
      logger.info({job: 'voteValidation'}, 'Waiting for DB to be in sync')
    } else {
      try {
        await validationJob(dbBestBlock)
      } catch (error) {
        // Kupo or DB can be unavailable
        logger.error(error, `Error in vote validation job.`)
      }
    }

    await sleep(60 * 1000)
  }
}
