import {config, isAggregatorMode, isServerMode} from './config'
import {initPgListen} from './db/initPgListen'
import {logger} from './logger'
import {registerCleanUp} from './ogmios'
import {ogmiosClientInitializerLoop} from './ogmios/ogmios'
import {startServer} from './server/server'
import {voteValidationLoop} from './validation/voteValidationJob'

const start = async () => {
  logger.info(
    `Starting ${config.NETWORK_NAME} ${Buffer.from(config.GOVERNANCE_TOKEN_ASSET_NAME, 'hex').toString(
      'utf8'
    )} ${config.MODE}`
  )

  if (isServerMode) {
    await initPgListen()
  }
  ogmiosClientInitializerLoop()

  if (isAggregatorMode) {
    voteValidationLoop()
  }
  startServer()
}

registerCleanUp()
start()
