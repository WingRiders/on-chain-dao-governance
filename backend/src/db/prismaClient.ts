import {PrismaClient} from '../../prisma/dao-governance-client'
import {logger} from '../logger'

export * from '../../prisma/dao-governance-client'

// See not-exported denylist in https://github.com/prisma/prisma/blob/075d31287c90b757fd9bd8d9b36032e6349fa671/packages/client/src/runtime/core/types/exported/itxClientDenyList.ts#L1
export type PrismaTxClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]

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
