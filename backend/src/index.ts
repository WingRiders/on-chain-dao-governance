import {program} from 'commander'
import {logger} from './logger'

const startAggregator = () => {
  logger.info('Starting aggregator')
}

const startServer = () => {
  logger.info('Starting server')
}

program.name('backend').description('On-Chain DAO Governance Backend').version('0.1.0')

program
  .command('aggregator')
  .description('Starts the aggregation part of the backend service')
  .action((_) => startAggregator())

program
  .command('server')
  .description('Starts the REST API server part of the service')
  .action((_) => startServer())

program.parse()
