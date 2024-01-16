import {InteractionContext, createInteractionContext} from '@cardano-ogmios/client'

import {sleep} from '@wingriders/cab/helpers'

import {config} from '../config'
import {logger} from '../logger'
import {ogmiosInitParams} from './ogmiosInitParams'

const initInteractionContext = (closeClientsFn: () => void): Promise<InteractionContext> =>
  createInteractionContext(
    (err) => {
      throw err
    },
    () => {
      closeClientsFn()
      logger.error('Ogmios Client connection closed.')
    },
    {
      connection: {
        host: config.OGMIOS_HOST,
        port: config.REMOTE_OGMIOS_PORT || 1337,
      },
    }
  )

export const ogmiosClientInitializerLoop = async () => {
  logger.info('Starting ogmios client initializer loop')
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!ogmiosInitParams.isReadyFn()) {
      try {
        const context = await initInteractionContext(ogmiosInitParams.closeClientsFn)
        await ogmiosInitParams.initializeClientsFn(context)
      } catch (e) {
        logger.error(e, 'Failed to initialize Ogmios clients, retrying in 20 seconds')
      }
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(20_000)
  }
}
