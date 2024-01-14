import {logger} from './logger'
import {config} from './config'

logger.info(
  `Starting ${config.NETWORK_NAME} ${Buffer.from(config.GOVERNANCE_TOKEN_ASSET_NAME, 'hex').toString(
    'utf8'
  )} ${config.MODE}`
)
