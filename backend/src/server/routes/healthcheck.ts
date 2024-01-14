import {checkPrismaConnection} from '../../db/prismaClient'

export const getHealthStatus = async () => {
  const dbConnected = await checkPrismaConnection()
  return {
    healthy: dbConnected,
    dbConnected,
    uptime: process.uptime(),
  }
}
