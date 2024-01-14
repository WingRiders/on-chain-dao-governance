import {FastifyInstance} from 'fastify'
import {getHealthStatus} from './routes/healthcheck'

export function registerRoutes(server: FastifyInstance) {
  server.get('/healthcheck', async (request, reply) => {
    const instanceHealth = await getHealthStatus()
    if (instanceHealth?.healthy) {
      return reply.send(instanceHealth)
    } else {
      return reply.code(503).send(instanceHealth)
    }
  })

  server.get('/healthStatus', getHealthStatus)
}
