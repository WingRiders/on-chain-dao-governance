import {pino} from 'pino'

import {config} from './config'

export const logger = pino({
  name: 'governance-backend',
  level: config.LOG_LEVEL,
  ...(config.NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      }
    : {}),
})
