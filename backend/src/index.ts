import {logger} from './logger'
import {config, isAggregatorMode} from './config'
import {startServer} from './server/server'
import {startChainSync} from './ogmios'
import {initPgListen} from './db/initPgListen'

const start = async () => {
  logger.info(
    `Starting ${config.NETWORK_NAME} ${Buffer.from(config.GOVERNANCE_TOKEN_ASSET_NAME, 'hex').toString(
      'utf8'
    )} ${config.MODE}`
  )

  if (isAggregatorMode) {
    startChainSync()
  } else {
    await initPgListen()
  }
  startServer()
}

start()
