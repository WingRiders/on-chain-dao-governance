import {pino} from 'pino'

export const logger = pino({
  name: 'governance-backend',
  // TODO: Add support for config from env
  // level: config.LOG_LEVEL || 'debug',
})
