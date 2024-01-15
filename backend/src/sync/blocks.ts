import {BlockPraos, PointOrOrigin} from '@cardano-ogmios/schema'

import {slotToDateFactory} from '@wingriders/cab/helpers'

import {config} from '../config'
import {Block, PrismaTxClient, prisma} from '../db/prismaClient'
import {logger} from '../logger'
import {processGovernance} from './governanceOp'
import {insertGovernanceVotes} from './votesSync'

const BLOCK_HASH_LENGTH = 64 // 32 Bytes in hex string

/**
 * Insert block into database and calculate its creation time.
 * Function assumes block contains id, height and slot.
 */
const insertBlock = (prismaTx: PrismaTxClient, block: BlockPraos): Promise<Block> =>
  prismaTx.block.create({
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
  await prisma.$transaction(async (prismaTx) => {
    const dbBlock = await insertBlock(prismaTx, block)
    if (block.transactions) {
      for (const tx of block.transactions) {
        if (tx.spends !== 'inputs') {
          logger.warn(`Found failed tx ${tx.id}`)
          continue
        }
        const dbInsertPromises = []
        dbInsertPromises.push(insertGovernanceVotes(prismaTx, dbBlock, tx))
        dbInsertPromises.push(processGovernance(prismaTx, dbBlock, tx))
        const settledPromises = await Promise.allSettled(dbInsertPromises)
        settledPromises.forEach((promise) => {
          if (promise.status === 'rejected' && promise.reason !== undefined) {
            logger.error(promise.reason)
          }
        })
      }
    }
  })
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
