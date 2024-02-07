import {
  InteractionContext,
  LedgerStateQuery,
  createLedgerStateQueryClient,
  getServerHealth,
} from '@cardano-ogmios/client'
import {ProtocolParameters, Tip} from '@cardano-ogmios/schema'

import {logger} from '../logger'

let stateQueryClient: LedgerStateQuery.LedgerStateQueryClient | null

export const initializeStateQueryClient = async (context: InteractionContext) => {
  if (!stateQueryClient) {
    logger.debug('initializeStateQueryClient')
    stateQueryClient = await createLedgerStateQueryClient(context)
    logger.info('Ogmios state query client initialized.')
  }
}

export const isStateQueryReady = () => !!stateQueryClient

export const shutDownStateQueryClient = async () => {
  if (stateQueryClient) {
    await stateQueryClient.shutdown()
  }
}

export const closeStateQueryClient = () => {
  stateQueryClient = null
}

type NodeHealth = {
  lastKnownTip: Tip | null
  lastTipUpdate: string | null
  networkSynchronization: number
}

const fallbackState = {
  lastKnownTip: null,
  lastTipUpdate: null,
  networkSynchronization: 0,
}

export const getNodeHealth = async (): Promise<NodeHealth> => {
  if (stateQueryClient && stateQueryClient.context.connection) {
    try {
      return await getServerHealth(stateQueryClient.context)
    } catch (err) {
      logger.error(err)
      return fallbackState
    }
  }
  logger.warn('Ogmios connection not yet established')
  return fallbackState
}

export const getCurrentEpoch = (): Promise<number> => {
  if (!stateQueryClient) {
    throw new Error(`Ogmios State Query Client not initialized.`)
  }
  return stateQueryClient.epoch()
}

export const getCurrentSlot = async (): Promise<number> => {
  if (!stateQueryClient) {
    throw new Error(`Ogmios State Query Client not initialized.`)
  }

  const chainTip = await stateQueryClient.ledgerTip()
  return chainTip === 'origin' ? 0 : chainTip.slot
}

export const getProtocolParameters = (): Promise<ProtocolParameters> => {
  if (!stateQueryClient) {
    throw new Error(`Ogmios State Query Client not initialized.`)
  }

  return stateQueryClient.protocolParameters()
}
