import {HexString} from '@wingriders/cab/types'

import {Prisma, prisma} from '../../db/prismaClient'

const activeAvailableProposalsFragment = Prisma.sql`
    SELECT COUNT(DISTINCT "Proposal"."id") as "count"
    FROM "Proposal"
             INNER JOIN "Poll" ON "Proposal"."pollId" = "Poll"."id"
             INNER JOIN "ProposalState" ON "Proposal"."id" = "ProposalState"."proposalId"
    WHERE "Poll".start <= NOW()
      AND "Poll".end > NOW()
      AND "ProposalState"."status" = 'AVAILABLE'
      AND "ProposalState"."slot" = (SELECT MAX("slot") FROM "ProposalState" WHERE "proposalId" = "Proposal"."id")
`

export const getActiveProposalsCount = async (): Promise<number> => {
  const result = await prisma.$queryRaw<{count: bigint}[]>`${activeAvailableProposalsFragment}`
  return Number(result[0].count)
}

export const getUserVotableProposalsCount = async ({
  ownerStakeKeyHash,
}: {
  ownerStakeKeyHash: HexString
}): Promise<number> => {
  const result = await prisma.$queryRaw<{count: bigint}[]>`
    ${activeAvailableProposalsFragment}
    AND NOT EXISTS (
      SELECT 1 FROM "Vote"
      WHERE "Vote"."proposalId" = "Proposal"."id"
        AND "Vote"."ownerStakeKeyHash" = DECODE(${ownerStakeKeyHash}, 'hex')
    )
  `
  return Number(result[0].count)
}
