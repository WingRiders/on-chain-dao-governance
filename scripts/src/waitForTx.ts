/**
 * Create a promise that will pool the blockchain until
 * the transaction is not accepted. If we reach the ttl, we assume
 * that the transaction failed
 */

import {CabInternalError, CabInternalErrorReason} from '@wingriders/cab/errors'
import {sleep, slotToDateFactory} from '@wingriders/cab/helpers'
import {HexString} from '@wingriders/cab/types'
import {Wallet} from '@wingriders/cab/wallet'
import {config} from './config'

const TTL_BUFFER = 60000 // 1 minute, we add this buffer on top of TTL because sync might be a bit behind
const POLLING_INTERVAL = 10000 // 10 seconds, blocks are every ~20 seconds

export async function waitForTx(wallet: Wallet, txHash: HexString, ttl: number) {
  const ttlDate = slotToDateFactory(config.NETWORK_NAME)(ttl)

  while (Date.now() <= ttlDate.getTime() + TTL_BUFFER) {
    const txBlockInfo = await wallet.fetchTxBlockInfo(txHash)
    if (txBlockInfo !== null) {
      return {
        success: true,
        txHash,
        blockHeight: txBlockInfo.blockHeight,
      }
    } else {
      await sleep(POLLING_INTERVAL)
    }
  }

  throw new CabInternalError(CabInternalErrorReason.TransactionNotFoundInBlockchainAfterSubmission)
}
