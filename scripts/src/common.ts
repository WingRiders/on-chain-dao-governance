import {getTokenFromBundle} from '@wingriders/cab/ledger/assets'
import {UTxO} from '@wingriders/cab/types'

import {config, governanceToken} from './config'
import {CreateAndSubmitTxPlanArgs, createAndSubmitTxPlan} from './createAndSubmitTxPlan'
import {initWallet} from './initWallet'

export async function initGovernanceWallet() {
  const wallet = await initWallet({
    blockchainExplorerUrl: config.BLOCKCHAIN_EXPLORER_URL,
    mnemonic: config.GOVERNANCE_VOTING_PROPOSALS_WALLET,
    accountIndex: config.GOVERNANCE_VOTING_PROPOSALS_ACCOUNT_INDEX,
    network: config.NETWORK_NAME,
    gapLimit: 20,
  })
  const protocolParameters = await wallet.getProtocolParameters()

  const account = wallet.getAccount(config.GOVERNANCE_VOTING_PROPOSALS_ACCOUNT_INDEX)

  const submit = (args: Omit<CreateAndSubmitTxPlanArgs, 'wallet' | 'accountIndex'>) =>
    createAndSubmitTxPlan({
      wallet,
      accountIndex: config.GOVERNANCE_VOTING_PROPOSALS_ACCOUNT_INDEX,
      ...args,
    })

  return {account, protocolParameters, submit}
}

export const isPotentialProposalUTxO = (utxo: UTxO) => {
  if (getTokenFromBundle(utxo.tokenBundle, governanceToken)?.quantity) {
    return true
  }
  // potentially more checks
  return false
}
