import {debounce, noop} from 'lodash'
import createSubscriber from 'pg-listen'

import {config} from '../config'
import {logger} from '../logger'
import {setLatestBlock} from '../ogmios'
import {setLatestBlockFromDb} from './setLatestBlockFromDb'

const channelName = 'block_update'

// https://www.postgresql.org/docs/current/plpgsql-trigger.html#PLPGSQL-DML-TRIGGER-TG-OP
type TG_OP = 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE'

type Payload = {
  op: TG_OP
  hash: string
  slot: number
}

// To prevent calling setLatestBlockFromDb many times in case many blocks are deleted,
// we debounce it with 1s interval.
// leading: true because we want to call setLatestBlockFromDb right away on the rollback
// trailing: true because in case on multiple blocks are deleted in the 1s interval we want to set it correctly at the end.
const setLatestBlockFromDbDebounced = debounce(setLatestBlockFromDb, 1000, {
  leading: true,
  trailing: true,
})

export const initPgListen = async () => {
  logger.info(`Init listening on block updates in DB`)
  const subscriber = createSubscriber({connectionString: config.DATABASE_URL})
  subscriber.notifications.on(channelName, (payload: Payload) => {
    // Payload as passed to subscriber.notify() (see below)
    logger.info(payload, `Received notification through pg-listen in channel '${channelName}':`)
    const callbackMapping: {[op in TG_OP]: () => void} = {
      INSERT: () => setLatestBlock({slot: payload.slot, id: payload.hash}),
      UPDATE: () => noop,
      DELETE: setLatestBlockFromDbDebounced,
      TRUNCATE: () => setLatestBlock(undefined),
    }
    callbackMapping[payload.op]()
  })
  await subscriber.connect()
  await subscriber.listenTo(channelName)
}
