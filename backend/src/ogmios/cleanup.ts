import {logger} from '../logger'
import {ogmiosInitParams} from './ogmiosInitParams'

type ExitOptions = {
  caller?: string
  exit?: boolean
}

const onExit = (options: ExitOptions) => async () => {
  logger.info('Cleaning the APP')
  try {
    await ogmiosInitParams.shutdownFn()
    logger.info(`Stopped sync (${options.caller})`)
    if (options.exit) {
      process.exit()
    }
  } catch (e) {
    logger.error(e)
  }
}

export function registerCleanUp() {
  // do something when app is closing
  process.on('exit', onExit({caller: 'exit'}))

  // catches ctrl+c event
  process.on('SIGINT', onExit({caller: 'SIGINT', exit: true}))

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', onExit({exit: true}))
  process.on('SIGUSR2', onExit({caller: 'SIGUSR2', exit: true}))
}
