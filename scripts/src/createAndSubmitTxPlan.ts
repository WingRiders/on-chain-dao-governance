import {Account} from '@wingriders/cab/account'
import {evaluateTxBodyFactory, getEvaluatedTxPlan} from '@wingriders/cab/helpers'
import {TxPlanArgs, UTxO} from '@wingriders/cab/types'
import {Wallet} from '@wingriders/cab/wallet'

import {config} from './config'
import {submitTxPlanWithMultipleAccounts} from './submitTxPlan'
import {waitForConfirmations} from './waitForConfirmations'

const getAccountUtxos = async (account: Account) => {
  await account.reloadUtxos()
  return account.getUtxos()
}

export const createAndSubmitTxPlan = async ({
  wallet,
  accountIndex,
  witnessAccountIndexes,
  txPlanArgs,
  maybeUtxos,
  reload,
  ttlSlot,
  validityIntervalStart,
}: CreateAndSubmitTxPlanArgs) => {
  const account = wallet.getAccount(accountIndex)
  const utxos = maybeUtxos ?? (await getAccountUtxos(account))

  const txPlanResult = await getEvaluatedTxPlan({
    txPlanArgs,
    utxos,
    changeAddress: account.getChangeAddress(),
    ttl: ttlSlot,
    validityIntervalStart,
    evaluateTxBodyFn: evaluateTxBodyFactory(config.GOVERNANCE_SERVER_URL),
  })

  if (!txPlanResult.success) {
    console.error(
      txPlanResult,
      `Could not construct TxPlan ${txPlanArgs.planId} (with ${utxos.length} UTxOs)`
    )
    throw new Error(`Could not construct TxPlan ${txPlanArgs.planId} (with ${utxos.length} UTxOs)`)
  }

  console.info(`Submitting Tx ${txPlanArgs.planId} with ${txPlanArgs.outputs?.length} outputs`)
  try {
    const witnessAccounts =
      witnessAccountIndexes
        ?.filter((index) => index !== accountIndex)
        .map((index) => wallet.getAccount(index)) || []
    const accounts = [account, ...witnessAccounts]
    const {txHash} = await submitTxPlanWithMultipleAccounts({
      wallet,
      accounts,
      txPlan: txPlanResult.txPlan,
      ttlSlot,
      validityIntervalStart,
      reload,
    })
    console.info(`Sent transaction with ${txPlanArgs.outputs?.length} outputs, txHash = ${txHash}`)
    const {success} = await waitForConfirmations(wallet, txHash)
    return {txHash, success, txPlan: txPlanResult.txPlan}
  } catch (e: any) {
    console.info(e.message, 'Error when submitting Tx')
    throw e
  }
}

export type CreateAndSubmitTxPlanArgs = {
  wallet: Wallet
  accountIndex: number
  witnessAccountIndexes?: number[]
  txPlanArgs: TxPlanArgs
  maybeUtxos?: UTxO[]
  reload: boolean
  ttlSlot?: number
  validityIntervalStart?: number
}
