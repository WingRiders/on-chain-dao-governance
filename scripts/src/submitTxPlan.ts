import {Account} from '@wingriders/cab/account'
import {prepareTxAux, signedTransaction} from '@wingriders/cab/ledger/transaction'
import {TxPlan} from '@wingriders/cab/types'
import {Wallet} from '@wingriders/cab/wallet'

import {waitForTx} from './waitForTx'

export class TxSubmissionError extends Error {
  constructor(txHash: string, message: string) {
    super(`Submitting tx ${txHash} failed`)
    try {
      this.message = {txHash, ...JSON.parse(message)}
    } catch {
      this.message = message
    }
    this.stack = undefined
  }
}

export async function submitTxPlan({
  wallet,
  account,
  txPlan,
  ttlSlot,
  validityIntervalStart,
  reload = false,
}: {
  wallet: Wallet
  account: Account
  txPlan: TxPlan
  ttlSlot?: number
  validityIntervalStart?: number
  reload?: boolean
}) {
  // TODO: Better solution for ttl/validityIntervalStart handling, like in dex lib
  const ttl = ttlSlot ?? (await wallet.calculateTtl())
  const txAux = prepareTxAux(txPlan, ttl, validityIntervalStart)

  const signedTx = await account.signTxAux(txAux)
  console.info(
    `Submitting signed tx with size ${Buffer.from(signedTx.txBody, 'hex').length} and hash ${
      signedTx.txHash
    }`
  )

  try {
    await wallet.submitTx(signedTx)
  } catch (e: any) {
    // Cast the submission error to a nicer format
    throw new TxSubmissionError(signedTx.txHash, e.message)
  }

  const txSummary = await waitForTx(wallet, signedTx.txHash, ttl)

  if (reload) {
    await account.reloadUtxos()
  }

  return txSummary
}

export async function submitTxPlanWithMultipleAccounts({
  wallet,
  accounts,
  txPlan,
  ttlSlot,
  validityIntervalStart,
  reload = false,
}: {
  wallet: Wallet
  accounts: Account[]
  txPlan: TxPlan
  ttlSlot?: number
  validityIntervalStart?: number
  reload?: boolean
}) {
  if (accounts.length === 1) {
    return submitTxPlan({wallet, account: accounts[0], txPlan, ttlSlot, validityIntervalStart, reload})
  }
  // TODO: Better solution for ttl/validityIntervalStart handling, like in dex lib
  const ttl = ttlSlot ?? (await wallet.calculateTtl())
  const txAux = prepareTxAux(txPlan, ttl, validityIntervalStart)

  // Witness the transaction by all the necessary accounts
  const txWitnesses = await Promise.all(accounts.map((account) => account.witnessTxAux(txAux)))

  // And then merge all the TxWitnessSets to one and create the signed transaction
  const txWitnessSet = txWitnesses.reduce((acc, curr) => ({
    ...acc,
    // we only care about the vKeyWitnesses
    vKeyWitnesses: [...(acc.vKeyWitnesses || []), ...(curr.vKeyWitnesses || [])],
  }))

  const signedTx = signedTransaction(txAux, txWitnessSet)

  try {
    await wallet.submitTx(signedTx)
  } catch (e: any) {
    // Cast the submission error to a nicer format
    throw new TxSubmissionError(signedTx.txHash, e.message)
  }

  const txSummary = await waitForTx(wallet, signedTx.txHash, ttl)

  if (reload) {
    await Promise.all(accounts.map((account) => account.reloadUtxos()))
  }

  return txSummary
}
