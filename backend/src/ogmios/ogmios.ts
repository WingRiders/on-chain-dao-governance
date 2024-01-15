import {InteractionContext, createInteractionContext} from '@cardano-ogmios/client'

import {sleep} from '@wingriders/cab/helpers'

import {logger} from '../logger'
import {
  ChainSyncInitParams,
  closeChainSyncClient,
  initializeChainSyncClient,
  isChainSyncReady,
  shutDownChainSyncClient,
} from './chainSyncClient'
import {
  closeStateQueryClient,
  initializeStateQueryClient,
  isStateQueryReady,
  shutDownStateQueryClient,
} from './stateQueryClient'

type OgmiosConfig = {
  OGMIOS_HOST?: string
  REMOTE_OGMIOS_PORT?: number
}
type OgmiosInitParams = Omit<ChainSyncInitParams, 'context'> & {
  postInitCallback: () => void
  config: OgmiosConfig
}

export async function initializeOgmiosClients({
  postInitCallback,
  config,
  rollBackToPoint,
  insertBlock,
}: OgmiosInitParams) {
  try {
    const context: InteractionContext = await createInteractionContext(
      (err) => {
        throw err
      },
      () => {
        closeChainSyncClient()
        closeStateQueryClient()
        logger.error('Ogmios Client connection closed.')
      },
      {
        connection: {
          host: config.OGMIOS_HOST,
          port: config.REMOTE_OGMIOS_PORT || 1337,
          // docker containers must communicate through 1337
          // if connecting another way, you can specify remoteOgmiosPort
        },
      }
    )
    await initializeStateQueryClient(context)
    await initializeChainSyncClient({context, rollBackToPoint, insertBlock})
    postInitCallback()
  } catch (e) {
    logger.error(e, 'Error during initialization of Ogmios clients')
    throw e
  }
}

export async function ogmiosClientInitializerLoop(initParams: OgmiosInitParams) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!isChainSyncReady() || !isStateQueryReady()) {
      try {
        await initializeOgmiosClients(initParams)
      } catch (e) {
        logger.error('Failed to initialize Ogmios, retrying in 20 seconds')
      }
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(20_000)
  }
}

export async function shutdown() {
  await shutDownChainSyncClient()
  await shutDownStateQueryClient()
}
