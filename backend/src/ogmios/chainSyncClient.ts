import {
  ChainSynchronization,
  InteractionContext,
  createChainSynchronizationClient,
  isBlockPraos,
} from '@cardano-ogmios/client'
import {BlockPraos, PointOrOrigin} from '@cardano-ogmios/schema'

import {logger} from '../logger'
import {insertPraosBlock, rollBackToPoint} from '../sync/blocks'
import {setLatestBlock} from './latestBlock'

export type InsertBlockFunction = (blockData: BlockPraos) => void
export type RollBackToPointFunction = (point: PointOrOrigin) => void

const rollForward =
  (
    insertBlock: InsertBlockFunction
  ): ChainSynchronization.ChainSynchronizationMessageHandlers['rollForward'] =>
  async ({block}, requestNext) => {
    if (!isBlockPraos(block)) {
      requestNext()
      return
    }
    try {
      const blockData = block
      logger.info(`Received block ${blockData.id} Transactions: ${blockData.transactions?.length}`)
      await insertBlock(blockData)
      if (blockData.slot && blockData.id) {
        setLatestBlock({slot: blockData.slot, id: blockData.id})
      }
    } catch (err) {
      logger.error(err, 'Error while processing block')
      // TODO define proper failover logic
      process.exit(1)
    }
    requestNext()
  }

const rollBackward =
  (
    rollBackToPoint: RollBackToPointFunction
  ): ChainSynchronization.ChainSynchronizationMessageHandlers['rollBackward'] =>
  async ({point}, requestNext) => {
    if (point === 'origin') {
      logger.info(`Rolling back to origin`)
      setLatestBlock(undefined)
    } else {
      logger.info(`Rolling back to ${point.id} ${point.slot}`)
      setLatestBlock(point)
    }
    try {
      await rollBackToPoint(point)
    } catch (err) {
      // TODO probably fail here as anything further will cause errors
      logger.error(err, 'Error while rolling back')

      // TODO define proper failover logic
      process.exit(1)
    }
    requestNext()
  }

let chainSyncClient: ChainSynchronization.ChainSynchronizationClient | null

export async function initializeChainSyncClient(context: InteractionContext) {
  if (!chainSyncClient) {
    logger.debug('initializeChainSyncClient')
    chainSyncClient = await createChainSynchronizationClient(context, {
      rollBackward: rollBackward(rollBackToPoint),
      rollForward: rollForward(insertPraosBlock),
    })
    logger.info('Ogmios chainsync client initialized.')
  }
}

export async function startSync(point?: PointOrOrigin) {
  if (chainSyncClient) {
    await chainSyncClient.resume(point ? [point] : undefined)
  } else {
    throw new Error('client not initialized')
  }
}

// ...

export function closeChainSyncClient() {
  chainSyncClient = null
}

export async function shutDownChainSyncClient() {
  if (chainSyncClient) {
    await chainSyncClient.shutdown()
  }
}

export function isChainSyncReady() {
  return !!chainSyncClient
}
