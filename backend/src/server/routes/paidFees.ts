import {PaidFeesFilter, PaidFeesResponse} from '@wingriders/governance-sdk'

import {Prisma, prisma} from '../../db/prismaClient'

type PaidFeesDbRes = [{proposalsFees: bigint; votesFees: bigint}]

export const getPaidFees = async ({
  fromSlot,
  toSlot,
}: PaidFeesFilter = {}): Promise<PaidFeesResponse> => {
  const startSlotCondition = fromSlot != null ? Prisma.sql`T."slot" >= ${fromSlot}` : Prisma.sql`TRUE`
  const endSlotCondition = toSlot != null ? Prisma.sql`T."slot" <= ${toSlot}` : Prisma.sql`TRUE`

  const [{proposalsFees, votesFees}] = await prisma.$queryRaw<PaidFeesDbRes>`
    SELECT
      COALESCE(SUM(
        CASE
          WHEN PS.id IS NOT NULL THEN T."txFee"
          ELSE 0
        END
      ), 0) AS "proposalsFees",
      COALESCE(SUM(
        CASE
          WHEN V.id IS NOT NULL THEN T."txFee"
          ELSE 0
        END
      ), 0) AS "votesFees"
    FROM "Transaction" T
    LEFT JOIN "ProposalState" PS ON PS."txHash" = T."txHash"
    LEFT JOIN "Vote" V ON V."txHash" = T."txHash"
    WHERE (PS.id IS NOT NULL OR V.id IS NOT NULL)
    AND ${startSlotCondition} AND ${endSlotCondition};
  `

  return {
    proposals: proposalsFees.toString(),
    votes: votesFees.toString(),
  }
}
