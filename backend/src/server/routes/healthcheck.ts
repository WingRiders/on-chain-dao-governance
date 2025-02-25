import {isAggregatorMode} from '../../config'
import {isDbMigrated} from '../../db/migrateDb'
import {checkPrismaConnection} from '../../db/prismaClient'

export const getHealthStatus = async () => {
  const dbConnected = await checkPrismaConnection()

  const commonFields = {
    dbConnected,
    uptime: process.uptime(),
  }

  if (isAggregatorMode) {
    const dbMigrated = isDbMigrated()
    return {
      healthy: dbConnected && dbMigrated,
      dbMigrated,
      ...commonFields,
    }
  }

  return {
    healthy: dbConnected,
    ...commonFields,
  }
}
