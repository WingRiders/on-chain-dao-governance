import {PointOrOrigin} from '@cardano-ogmios/schema'

import {Prisma, prisma} from './prismaClient'

// This method is called:
// - once on startup in aggregator mode.
// - every time a block is updated in server mode.
export const getLastDbBlock = async (skip?: number): Promise<PointOrOrigin> => {
  const block = await prisma.block.findFirst({
    orderBy: {id: Prisma.SortOrder.desc},
    skip,
  })
  if (!block) {
    return 'origin'
  }
  return {
    id: block.hash.toString('hex'),
    slot: Number(block.slot),
  }
}
