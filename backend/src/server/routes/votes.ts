import {chain, mapValues} from 'lodash'

import {HexString} from '@wingriders/cab/types'
import {
  ChoiceVoteAggregation,
  UserVotesFilter,
  UserVotesResponse,
  VoteAggregationByProposalResponse,
  VoteVerificationState,
  VotesByState,
  VotesFilter,
} from '@wingriders/governance-sdk'

import {VerificationState as DbVoteVerificationState, Prisma, prisma} from '../../db/prismaClient'

type VoteAggregation = {
  proposalTxHash: HexString
  proposalId: number
  index: number
  votingPower: bigint
  votingCount: bigint
  verificationState: DbVoteVerificationState
}

type UserVote = {
  proposalTxHash: HexString
  index: number
  votingPower: bigint
  verificationState: DbVoteVerificationState
}

const EMPTY_CHOICE_VOTE: VotesByState = {
  ...mapValues(DbVoteVerificationState, (_) => '0'),
}

const voteVerificationStateMap: Record<DbVoteVerificationState, VoteVerificationState> = {
  [DbVoteVerificationState.VERIFIED]: VoteVerificationState.VERIFIED,
  [DbVoteVerificationState.INVALID]: VoteVerificationState.INVALID,
  [DbVoteVerificationState.UNVERIFIED]: VoteVerificationState.UNVERIFIED,
}

const decodeHashSqlFragment = (hash: string) => Prisma.sql`DECODE(${hash}, 'hex')`

/**
 * Merge array of state votes into VotesByState and fill missing states
 * Assume each state is there at most once.
 */
const mergeChoiceVotes = (choiceVotes: VoteAggregation[]): ChoiceVoteAggregation => {
  const votingPower = {
    ...EMPTY_CHOICE_VOTE,
    ...Object.fromEntries(
      choiceVotes.map(({verificationState, votingPower}) => [
        verificationState,
        BigInt(votingPower).toString(),
      ])
    ),
  }
  const votingCount = {
    ...EMPTY_CHOICE_VOTE,
    ...Object.fromEntries(
      choiceVotes.map(({verificationState, votingCount}) => [
        verificationState,
        BigInt(votingCount).toString(),
      ])
    ),
  }
  return {index: choiceVotes[0].index, votingPower, votingCount}
}

const mergeVotesByState = (votes: VotesByState[]): VotesByState => {
  const byState = mapValues(DbVoteVerificationState, (state) =>
    votes.reduce((acc, vote) => acc + BigInt(vote[state]), 0n).toString()
  )
  return {
    ...byState,
  }
}

const getProposalTxHashesFilter = (proposalTxHashes?: HexString[]) => {
  return proposalTxHashes?.length
    ? Prisma.sql`"Proposal"."txHash" IN (${Prisma.join(
        proposalTxHashes.map(decodeHashSqlFragment),
        ','
      )})`
    : Prisma.sql`TRUE`
}

export const getVotes = async ({
  proposalTxHashes,
}: VotesFilter): Promise<VoteAggregationByProposalResponse> => {
  const proposalTxHashesFilter = getProposalTxHashesFilter(proposalTxHashes)

  const votes = await prisma.$queryRaw<VoteAggregation[]>`
      WITH Proposals AS (SELECT id as "proposalId",
                                "txHash"
                         FROM "Proposal"
                         WHERE ${proposalTxHashesFilter}),
           UsersLatestVotes AS (
               -- User can vote multiple times for one proposal.
               -- We take the last user vote per proposal
               SELECT DISTINCT ON ("ownerStakeKeyHash", "proposalId") *
               FROM "Vote"
                        INNER JOIN Proposals USING ("proposalId")
               ORDER BY "Vote"."ownerStakeKeyHash", "proposalId", "Vote".id DESC),
           AggregatedVotes AS (SELECT "proposalId",
                                      "choiceId"         AS id,
                                      "verificationState",
                                      COUNT(*)           AS "votingCount",
                                      SUM("votingPower") AS "votingPower"
                               FROM UsersLatestVotes
                               GROUP BY "proposalId", "choiceId", "verificationState")
      SELECT "proposalId",
             ENCODE(Proposals."txHash", 'hex')           AS "proposalTxHash",
             COALESCE("ProposalChoice"."index", -1)      AS "index",
             -- Following values can be null if there is no vote for a choice, therefore are set to 0
             COALESCE("verificationState", 'UNVERIFIED') AS "verificationState",
             COALESCE("votingCount", 0)::bigint          AS "votingCount",
             COALESCE("votingPower", 0)::bigint          AS "votingPower"
      FROM AggregatedVotes
               FULL OUTER JOIN "ProposalChoice" USING ("proposalId", id)
               INNER JOIN Proposals USING ("proposalId")
      ORDER BY "proposalId", "index", "verificationState"
  `
  return chain(votes)
    .groupBy((vote): HexString => vote.proposalTxHash)
    .mapValues((proposalVotes) => {
      const proposalChoices = chain(proposalVotes)
        .groupBy((proposalVote) => proposalVote.index)
        .mapValues((choiceVotes) => mergeChoiceVotes(choiceVotes))
        .values()
        .value()
      if (!proposalChoices.some((choice) => choice.index === -1))
        proposalChoices.push({index: -1, votingPower: EMPTY_CHOICE_VOTE, votingCount: EMPTY_CHOICE_VOTE})

      return {
        votingPower: mergeVotesByState(proposalChoices.map(({votingPower}) => votingPower)),
        votingCount: mergeVotesByState(proposalChoices.map(({votingCount}) => votingCount)),
        byChoice: proposalChoices,
      }
    })
    .value()
}

export const getUserVotes = async ({
  proposalTxHashes,
  ownerStakeKeyHash,
}: UserVotesFilter): Promise<UserVotesResponse> => {
  const proposalTxHashesFilter = getProposalTxHashesFilter(proposalTxHashes)

  const votes: UserVote[] = await prisma.$queryRaw<UserVote[]>`
      SELECT DISTINCT ON ("Vote"."proposalId") "Vote"."proposalId",
                                               ENCODE("Proposal"."txHash", 'hex')     AS "proposalTxHash",
                                               -- Abstain from vote is represent as null in db
                                               COALESCE("ProposalChoice"."index", -1) AS "index",
                                               "verificationState",
                                               "votingPower"
      FROM "Vote"
               LEFT JOIN "ProposalChoice" ON "ProposalChoice".id = "Vote"."choiceId"
               INNER JOIN "Proposal" ON "Proposal".id = "Vote"."proposalId"
      WHERE ${proposalTxHashesFilter}
        AND "Vote"."ownerStakeKeyHash" = DECODE(${ownerStakeKeyHash}, 'hex')
      ORDER BY "proposalId", "Vote".id DESC
  `
  return Object.fromEntries(
    votes.map(({proposalTxHash, index, votingPower, verificationState}) => [
      proposalTxHash,
      {
        index,
        votingPower: votingPower.toString(),
        verificationState: voteVerificationStateMap[verificationState],
      },
    ])
  )
}
