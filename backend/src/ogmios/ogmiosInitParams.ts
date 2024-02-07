import {InteractionContext} from '@cardano-ogmios/client'
import {Point} from '@cardano-ogmios/schema'

import {Mode, config} from '../config'
import {getLastDbBlock} from '../db/getLastDbBlock'
import {
  closeChainSyncClient,
  initializeChainSyncClient,
  isChainSyncReady,
  shutDownChainSyncClient,
  startSync,
} from './chainSyncClient'
import {setLatestBlock} from './latestBlock'
import {
  closeStateQueryClient,
  initializeStateQueryClient,
  isStateQueryReady,
  shutDownStateQueryClient,
} from './stateQueryClient'
import {
  closeTxSubmissionClient,
  initializeTxSubmissionClient,
  isTxSubmissionReady,
  shutDownTxSubmissionClient,
} from './txSubmissionClient'

export type OgmiosInitParams = {
  isReadyFn: () => boolean
  closeClientsFn: () => void
  shutdownFn: () => Promise<void>
  initializeClientsFn: (context: InteractionContext) => Promise<void>
}

export const ogmiosInitParams: OgmiosInitParams = {
  [Mode.SERVER]: {
    isReadyFn: () => {
      return isTxSubmissionReady() && isStateQueryReady()
    },
    closeClientsFn: () => {
      closeTxSubmissionClient()
      closeStateQueryClient()
    },
    shutdownFn: async () => {
      await shutDownTxSubmissionClient()
      await shutDownStateQueryClient()
    },
    initializeClientsFn: async (context: InteractionContext) => {
      await initializeTxSubmissionClient(context)
      await initializeStateQueryClient(context)
    },
  },
  [Mode.AGGREGATOR]: {
    isReadyFn: () => {
      return isChainSyncReady() && isStateQueryReady()
    },
    closeClientsFn: () => {
      closeChainSyncClient()
      closeStateQueryClient()
    },
    shutdownFn: async () => {
      await shutDownChainSyncClient()
      await shutDownStateQueryClient()
    },
    initializeClientsFn: async (context: InteractionContext) => {
      await initializeStateQueryClient(context)
      await initializeChainSyncClient(context)
      // There is no point syncing blocks before dApp deployment.
      const originPoint: Point = {
        slot: config.SYNC_EARLIEST_SLOT,
        id: config.SYNC_EARLIEST_HASH,
      }
      // The last block might have been reverted, so we should start sync from few blocks behind.
      // For now using hardcoded constant.
      const lastSyncedBlock = await getLastDbBlock(50)
      if (lastSyncedBlock !== 'origin') {
        setLatestBlock(lastSyncedBlock)
      }
      await startSync(lastSyncedBlock === 'origin' ? originPoint : lastSyncedBlock)
    },
  },
}[config.MODE]
