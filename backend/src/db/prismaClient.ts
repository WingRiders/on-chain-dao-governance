import {PrismaClient} from '../../prisma/dao-governance-client'
import {logger} from '../logger'

export * from '../../prisma/dao-governance-client'

export const prisma = new PrismaClient()

export async function checkPrismaConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error: any) {
    logger.error(error, 'Error checking prisma connection')
    return false
  }
}
