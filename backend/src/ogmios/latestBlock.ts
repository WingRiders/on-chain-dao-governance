import {HexString} from '@wingriders/cab/types'

export type LatestBlockInfo = {slot: number; id: HexString}

let latestBlock: LatestBlockInfo | undefined

export function setLatestBlock(blockInfo?: LatestBlockInfo) {
  latestBlock = blockInfo
}

export function getLatestBlock(): LatestBlockInfo {
  if (!latestBlock) {
    // it's more or less safe to throw here, since no endpoints should be called
    // when app is not ready/healthy (at least on prod)
    throw new Error('App not ready yet - latestBlock is undefined')
  }
  return latestBlock
}

export function getLatestBlockSlot(): number {
  return getLatestBlock().slot
}
