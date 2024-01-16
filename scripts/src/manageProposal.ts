import {Command} from 'commander'
import {readFileSync} from 'fs'

import {splitMetadatumString} from '@wingriders/cab/ledger/transaction'
import {Address, TxPlanArgs} from '@wingriders/cab/types'
import {GovManagementOp, GovMetadatumLabel, TxMetadatum} from '@wingriders/governance-sdk'

import {initGovernanceWallet, isPotentialProposalUTxO} from './common'
import {waitForHealthyExplorer, waitForHealthyGovernance} from './waitForHealthyService'

/**
 * Cancels a proposal. It does not necessarily cancel the associated Poll with it.
 * Polls are not tied to a specific UTxO. Although when a poll is cancelled, all related
 * proposals should be manually cancelled as well
 */
async function cancelProposal(options: any, _command: Command) {
  const {reason, proposal: proposalTxHash, beneficiary} = options

  const {submit, protocolParameters, account} = await initGovernanceWallet()

  const allUtxos = await account.getUtxos()

  const proposalUtxo = allUtxos.find((utxo) => utxo.txHash === proposalTxHash)
  if (!proposalUtxo) {
    throw new Error('Poll not found/already spent.')
  }

  const txPlanArgs: TxPlanArgs = {
    planId: 'cancel-proposal',
    inputs: [{isScript: false, utxo: proposalUtxo}],
    outputs: [
      {
        address: beneficiary as Address,
        coins: proposalUtxo.coins,
        tokenBundle: proposalUtxo.tokenBundle,
      },
    ],
    metadata: {
      // leave it here unless there a reason, why it should be in a generic dex
      custom: new Map([
        [
          GovMetadatumLabel.COMMUNITY_VOTING_MANAGE,
          new Map<TxMetadatum, TxMetadatum>([
            ['op', GovManagementOp.CANCEL_PROPOSAL],
            ['id', Buffer.from(proposalTxHash, 'hex')],
            ['reason', splitMetadatumString(reason)],
          ]),
        ],
      ]),
    },
    protocolParameters,
  }

  // skip potential Proposal UTxOs - those are proposals and should be spent only when rejecting/evaluating
  const freeUtxos = allUtxos.filter((utxo) => !isPotentialProposalUTxO(utxo))

  await submit({
    txPlanArgs,
    maybeUtxos: freeUtxos.concat([proposalUtxo]),
    reload: false,
  })
}

/**
 * Finalizes a proposal and its results .
 */
async function finalizeProposal(options: any, _command: Command) {
  const {proposal: proposalTxHash, results: resultsFile, beneficiary} = options

  // assume if loaded the file contains correct data
  const results = JSON.parse(readFileSync(resultsFile, 'utf8'))

  const {submit, protocolParameters, account} = await initGovernanceWallet()

  const allUtxos = await account.getUtxos()

  const proposalUtxo = allUtxos.find((utxo) => utxo.txHash === proposalTxHash)
  if (!proposalUtxo) {
    throw new Error('Proposal not found/already spent.')
  }

  const txPlanArgs: TxPlanArgs = {
    planId: 'finalize-proposal',
    inputs: [{isScript: false, utxo: proposalUtxo}],
    outputs: [
      {
        address: beneficiary as Address,
        coins: proposalUtxo.coins,
        tokenBundle: proposalUtxo.tokenBundle,
      },
    ],
    metadata: {
      // NOTE: this structure is not final and could be extended
      custom: new Map([
        [
          GovMetadatumLabel.COMMUNITY_VOTING_MANAGE,
          new Map<TxMetadatum, TxMetadatum>([
            ['op', GovManagementOp.CONCLUDE_PROPOSAL],
            ['id', Buffer.from(proposalTxHash, 'hex')],
            ['result', results.result], // passed or failed
            [
              'choices',
              new Map<TxMetadatum, TxMetadatum>(
                Object.entries(results.choices).map(([choice, voteCount]) => [choice, Number(voteCount)])
              ),
            ],
            ['total', Number(results.total)],
            ['abstained', Number(results.abstained)],
            ['note', splitMetadatumString(results.note)],
          ]),
        ],
      ]),
    },
    protocolParameters,
  }

  // skip potential Proposal UTxOs - those are proposals and should be spent only when rejecting/evaluating
  const freeUtxos = allUtxos.filter((utxo) => !isPotentialProposalUTxO(utxo))

  await submit({
    txPlanArgs,
    maybeUtxos: freeUtxos.concat([proposalUtxo]),
    reload: false,
  })
}

const start = async () => {
  const program = new Command()

  program.name('manage-proposal').description('Manage a governance proposal')

  program
    .command('cancel')
    .description('Cancel a proposal associated with a given transaction')
    .requiredOption('-p, --proposal <txhash>', 'transaction hash where the proposal was created')
    .requiredOption('-r, --reason <string>', 'The reason for the cancellation')
    .requiredOption('-b, --beneficiary <address>', 'The address where the collateral should be sent')
    .action(cancelProposal)

  program
    .command('finalize')
    .description('Finalize a proposal and provide the results')
    .requiredOption('-p, --proposal <txhash>', 'transaction hash where the proposal was created')
    .requiredOption('-r, --results <file>', 'JSON file containing the results.')
    .requiredOption('-b, --beneficiary <address>', 'The address where the collateral should be sent')
    .action(finalizeProposal)

  program.parse()

  console.log('Waiting for healthy explorer & governance')
  await Promise.all([waitForHealthyExplorer, waitForHealthyGovernance])
}

start()
