import {
  InteractionContext,
  TransactionSubmission,
  createTransactionSubmissionClient,
} from '@cardano-ogmios/client'

import {logger} from '../logger'

export let txSubmissionClient: TransactionSubmission.TransactionSubmissionClient | null
export const initializeTxSubmissionClient = async (context: InteractionContext) => {
  if (!txSubmissionClient) {
    logger.debug('initializeTxSubmissionClient')
    txSubmissionClient = await createTransactionSubmissionClient(context)
  }
  logger.info('Ogmios tx submission client initialized.')
}

export const isTxSubmissionReady = () => !!txSubmissionClient

export const shutDownTxSubmissionClient = async () => {
  if (txSubmissionClient) {
    await txSubmissionClient.shutdown()
  }
}

export const closeTxSubmissionClient = () => {
  txSubmissionClient = null
}
