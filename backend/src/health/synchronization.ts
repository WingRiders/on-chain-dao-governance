import {slotToDateFactory} from '@wingriders/cab/helpers'

import {config} from '../config'
import {Prisma, prisma} from '../db/prismaClient'
import {logger} from '../logger'
import {getNodeHealth} from '../ogmios'

export type SyncHealthStatus = {
  dbBestBlock: number | null
  expectedBestBlock: number | null
  isDbSynced: boolean
  isNodeSynced: boolean
  syncStatus?: number
}

let syncHealthStatus: SyncHealthStatus = {
  dbBestBlock: null,
  expectedBestBlock: null,
  isDbSynced: false,
  isNodeSynced: false,
}

async function fetchDbBestBlock(): Promise<{height: number; slot: number; time: Date}> {
  try {
    const bestBlock = await prisma.block.findFirst({
      orderBy: {
        id: Prisma.SortOrder.desc,
      },
    })
    if (bestBlock) {
      return {slot: Number(bestBlock.slot), time: bestBlock.time, height: Number(bestBlock.height)}
    }
  } catch (err) {
    logger.error(err, 'Unable to fetch db block')
  }
  return {slot: -1, time: new Date(0), height: 0}
}

const SETTINGS = {
  dbDesyncThreshold: 300, // 5 minutes
  nodeDesyncThreshold: 180, // 3 minutes
}

export async function updateSyncHealthStatus() {
  const {lastKnownTip, lastTipUpdate, networkSynchronization} = await getNodeHealth()

  const dbBestBlock = await fetchDbBestBlock()
  const dbBestSlotTime = dbBestBlock.time.valueOf() / 1000 // in seconds
  const currentTime = new Date().valueOf() / 1000

  let expectedBestBlock: number
  let nodeBestSlotTime
  if (lastKnownTip) {
    expectedBestBlock = lastKnownTip.height
    nodeBestSlotTime = slotToDateFactory(config.NETWORK_NAME)(lastKnownTip.slot).valueOf() / 1000
  } else {
    expectedBestBlock = dbBestBlock.height
    nodeBestSlotTime = currentTime
  }

  const isDbSynced = Math.abs(currentTime - dbBestSlotTime) <= SETTINGS.dbDesyncThreshold
  const isNodeSynced =
    !!lastTipUpdate && Math.abs(currentTime - nodeBestSlotTime) <= SETTINGS.nodeDesyncThreshold

  syncHealthStatus = {
    dbBestBlock: dbBestBlock.height,
    expectedBestBlock,
    isDbSynced,
    isNodeSynced,
    syncStatus: networkSynchronization,
  }
}

export async function getSyncHealthStatus() {
  await updateSyncHealthStatus()
  return syncHealthStatus
}
