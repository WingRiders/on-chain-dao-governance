import {logger} from '../../logger'
import {txSubmissionClient} from '../../ogmios/txSubmissionClient'

export async function evaluateTxFromCbor(cborizedTx: string): Promise<string> {
  logger.debug({cborizedTx}, 'evaluating tx')
  if (!txSubmissionClient) {
    throw new Error('Ogmios client is not initialized')
  }
  try {
    const ogmiosReply = await txSubmissionClient.evaluateTransaction(cborizedTx)
    return JSON.stringify(ogmiosReply)
  } catch (e) {
    logger.error(e, cborizedTx)
    throw e
  }
}
