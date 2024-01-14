import {Point} from '@cardano-ogmios/schema'
import {config, Mode} from '../config'
import {getLastStableBlock, insertPraosBlock, rollBackToPoint} from '../sync/blocks'
import {setLatestBlock} from './latestBlock'
import {InsertBlockFunction, RollBackToPointFunction, startSync} from './chainSyncClient'
import {ogmiosClientInitializerLoop} from './ogmios'
import {logger} from '../logger'
import {noop} from 'lodash'

export const startChainSync = () => {
  const postInitCallback = async () => {
    // There is no point syncing blocks before dApp deployment.
    const originPoint: Point = {
      slot: config.SYNC_EARLIEST_SLOT,
      id: config.SYNC_EARLIEST_HASH,
    }
    const lastSyncedBlock = await getLastStableBlock()
    if (lastSyncedBlock !== 'origin') {
      setLatestBlock(lastSyncedBlock)
    }
    await startSync(lastSyncedBlock === 'origin' ? originPoint : lastSyncedBlock)
  }

  const rollbackFn: RollBackToPointFunction = {
    [Mode.AGGREGATOR]: rollBackToPoint,
    [Mode.SERVER]: noop,
  }[config.MODE]

  const insertBlockFn: InsertBlockFunction = {
    [Mode.AGGREGATOR]: insertPraosBlock,
    [Mode.SERVER]: noop,
  }[config.MODE]

  logger.info('Starting ogmios client initializer loop')
  ogmiosClientInitializerLoop({
    postInitCallback,
    rollBackToPoint: rollbackFn,
    insertBlock: insertBlockFn,
    config,
  }).catch((reason) => {
    logger.error(reason, 'Error during ogmios client initialization')
  })
}
