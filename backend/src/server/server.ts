import fastifyCors from '@fastify/cors'
import Fastify from 'fastify'

import {config, isServerMode} from '../config'
import {bigintStringify} from '../helpers/bigint'
import {getCorsOptions} from '../helpers/cors'
import {logger} from '../logger'
import {registerRoutes} from './routes'

const isProd = config.NODE_ENV === 'production'

export const startServer = async () => {
  try {
    const server = Fastify()
    // Source: https://adamcrowder.net/posts/node-express-api-and-aws-alb-502/
    // Allow Keep-Alive connections from the auth-server to be idle up to two
    // minutes before closing the connection. If this is not set, the default
    // idle-time is 5 seconds.  This can cause a lot of unneeded churn in server
    // connections.
    // Ensure all inactive connections are terminated by the ALB,
    // by setting this a few seconds higher than the ALB idle timeout
    const keepAliveTimeout = config.HTTP_SERVER_KEEP_ALIVE_SECONDS * 1000
    server.server.keepAliveTimeout = keepAliveTimeout
    // Ensure the headersTimeout is set higher than the keepAliveTimeout due to this nodejs
    // regression bug: https://github.com/nodejs/node/issues/27363
    // it's been already fixed, jut to be on the safe side
    server.server.headersTimeout = keepAliveTimeout + 1000 // add extra 1 seconds

    server.register(fastifyCors, getCorsOptions(config.CORS_ENABLED_FOR, isProd))

    registerRoutes(server) // LB needs to know health also for aggregator

    server.addHook('preSerialization', (_, __, payload) => Promise.resolve(bigintStringify(payload)))

    // Typescript is giving errors when trying to use enum as index in the mapping object (code from dex)
    const port = isServerMode ? config.SERVER_PORT : config.AGGREGATOR_PORT
    const address = await server.listen({
      port,
      host: '0.0.0.0',
    })
    logger.info(`Server listening on ${address}`)
  } catch (err: any) {
    logger.error(err)
    process.exit(1)
  }
}
