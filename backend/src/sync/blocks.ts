import {BlockPraos, PointOrOrigin} from '@cardano-ogmios/schema'

import {logger} from '../logger'
import {Block, Prisma, prisma} from '../db/prismaClient'
import {slotToDateFactory} from '@wingriders/cab/helpers'
import {config} from '../config'

const BLOCK_HASH_LENGTH = 64 // 32 Bytes in hex string

/**
 * Insert block into database and calculate its creation time.
 * Function assumes block contains id, height and slot.
 */
const insertBlock = (block: BlockPraos): Promise<Block> =>
  prisma.block.create({
    data: {
      hash: Buffer.from(block.id, 'hex'),
      height: block.height,
      slot: block.slot,
      time: slotToDateFactory(config.NETWORK_NAME)(block.slot),
    },
  })

/**
 * Inserts a block from ogmios into the DB along with all the transactions.
 * Throws an error if the block already exists.
 */
export const insertPraosBlock = async (block: BlockPraos) => {
  if (block.id.length !== BLOCK_HASH_LENGTH || !block.transactions) {
    logger.warn('Block: id with wrong length or transactions not defined', {block})
    return
  }
  const debugInfo = {hash: block.id, height: block.height}
  logger.info(debugInfo, 'Inserting block')
  await insertBlock(block)
  logger.info(debugInfo, 'Block inserted')
}

export const rollBackToPoint = async (point: PointOrOrigin) => {
  logger.info({point}, 'Rollback')
  let rolledBackCount = 0
  if (point === 'origin') {
    const {count} = await prisma.block.deleteMany({})
    rolledBackCount = count
  } else {
    const {count} = await prisma.block.deleteMany({
      where: {
        slot: {
          gt: point.slot,
        },
      },
    })
    rolledBackCount = count
  }
  logger.info({point, rolledBackCount}, 'Rollback finished')
}

// This method is called on startup when MODE = aggregator
export const getLastStableBlock = async (): Promise<PointOrOrigin> => {
  const block = await prisma.block.findFirst({
    orderBy: {
      id: Prisma.SortOrder.desc,
    },
    // The last block might have been reverted, so we should start sync from few blocks behind.
    // For now using hardcoded constant.
    skip: 50,
  })
  if (!block) {
    return 'origin'
  }
  return {
    id: block.hash.toString('hex'),
    slot: Number(block.slot),
  }
}
