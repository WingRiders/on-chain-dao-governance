import {CabInternalError, CabInternalErrorReason} from '@wingriders/cab/errors'
import {request, sleep, slotToDateFactory} from '@wingriders/cab/helpers'
import {HexString, NetworkName} from '@wingriders/cab/types'
import {Wallet} from '@wingriders/cab/wallet'

import {config} from './config'

const POLLING_INTERVAL = 10000 // 10 seconds, blocks are every ~20 seconds
// For mainnet: require at least 3 confirmations before marking the TX as confirmed
// This is to ensure that we don't "suffer" from rollbacks
const REQUIRED_CONFIRMATIONS = {
  [NetworkName.MAINNET]: 3,
  [NetworkName.PREPROD]: 0,
}[config.NETWORK_NAME]
// Buffer on top of the actual TTL of the TX
// 1 minute - because sync might be a bit behind
// plus 20 seconds for each additional confirmation we require (blocks are roughly every 20s)
const TTL_BUFFER = 60_000 + REQUIRED_CONFIRMATIONS * 20_000

export async function waitForConfirmations(
  wallet: Wallet,
  txHash: string
): Promise<{txHash: HexString; success: boolean}> {
  const ttlDate = slotToDateFactory(config.NETWORK_NAME)(await wallet.calculateTtl())
  while (Date.now() <= ttlDate.getTime() + TTL_BUFFER) {
    const txBlockInfo = await wallet.fetchTxBlockInfo(txHash)
    const bestBlockResponse: Partial<{Right: {bestBlock: number}}> = await request(
      `${config.BLOCKCHAIN_EXPLORER_URL}/api/v2/bestBlock`,
      'GET'
    )
    if (txBlockInfo !== null && bestBlockResponse.Right) {
      // If we have both the txBlockInfo and the bestBlockResponse then check
      // if we have the required confirmations we need
      const confirmations = bestBlockResponse.Right.bestBlock - txBlockInfo.blockHeight
      if (confirmations >= REQUIRED_CONFIRMATIONS) {
        return {txHash, success: true}
      }
      console.info(`Confirmations: ${confirmations} / ${REQUIRED_CONFIRMATIONS} for ${txHash}`)
    }
    await sleep(POLLING_INTERVAL)
  }
  throw new CabInternalError(CabInternalErrorReason.TransactionNotFoundInBlockchainAfterSubmission)
}
