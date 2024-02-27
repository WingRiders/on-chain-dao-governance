import {logger} from '../logger'
import {setLatestBlock} from '../ogmios'
import {getLastDbBlock} from './getLastDbBlock'

export const setLatestBlockFromDb = async (): Promise<void> => {
  logger.info('Setting latest block from DB')
  const lastSyncedBlock = await getLastDbBlock()
  setLatestBlock(lastSyncedBlock !== 'origin' ? lastSyncedBlock : undefined)
}
