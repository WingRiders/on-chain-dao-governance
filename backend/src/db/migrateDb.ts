import {exec} from 'child_process'
import delay from 'delay'

import {logger} from '../logger'

// creates new database if absent and applies all migrations to the existing database.
const migrateDb = async () => {
  // Currently we don't have any direct method to invoke prisma migration programatically.
  // As a workaround, we spawn migration script as a child process and wait for its completion.
  // Please also refer to the following GitHub issue: https://github.com/prisma/prisma/issues/4703
  try {
    const exitCode = await new Promise((resolve, _) => {
      exec(`npx prisma migrate deploy`, (error, stdout, stderr) => {
        logger.info(stdout)
        if (error != null) {
          logger.error(stderr, `prisma migrate deploy exited with error ${error.message}`)
          resolve(error.code ?? 1)
        } else {
          resolve(0)
        }
      })
    })

    if (exitCode !== 0) throw Error(`prisma migrate deploy failed with exit code ${exitCode}`)
  } catch (e) {
    logger.error(e, 'Migration failed')
    throw e
  }
}

/**
 * Assume that in development the DB is migrated and managed by the 'dev' state
 */
let dbMigrated = false || process.env.NODE_ENV !== 'production'

export async function ensureDBMigrated() {
  if (dbMigrated) {
    logger.info('Skipping DB migration loop...')
    return
  }

  const retryTimeout = 30_000
  logger.info('Starting migration loop...')
  while (!dbMigrated) {
    try {
      await migrateDb()
      dbMigrated = true
    } catch (err) {
      logger.error(err, 'Unable to run migrations')
      await delay(retryTimeout)
    }
  }
}

export function isDbMigrated() {
  return dbMigrated
}
