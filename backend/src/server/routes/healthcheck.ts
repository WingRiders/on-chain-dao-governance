import {isDbMigrated} from '../../db/migrateDb'
import {checkPrismaConnection} from '../../db/prismaClient'

export const getHealthStatus = async () => {
  const dbConnected = await checkPrismaConnection()
  const dbMigrated = isDbMigrated()

  return {
    healthy: dbConnected && dbMigrated,
    dbConnected,
    dbMigrated,
    uptime: process.uptime(),
  }
}
