import {capitalize} from 'lodash'

import {request, sleep} from '@wingriders/cab/helpers'

import {config} from './config'

const POLLING_INTERVAL = 15000 // 15 seconds, health gets updated ~every 30 seconds
const POLLING_MAX_RETRIES = 60 // over ~15 minutes

const waitForHealthyService =
  (healthUrl: string, serviceName: string) =>
  async (
    pollingInterval: number = POLLING_INTERVAL,
    maxRetries: number = POLLING_MAX_RETRIES
  ): Promise<void> => {
    if (maxRetries === 0) {
      throw new Error(`${capitalize(serviceName)} not available`)
    }

    try {
      const beHealth = await request(healthUrl)
      if (beHealth?.healthy) {
        return
      }
      console.warn(`${capitalize(serviceName)} healthy = ${beHealth?.healthy}`)
    } catch (err) {
      console.warn(`Error checking if ${serviceName} is healthy`, err)
    }

    await sleep(pollingInterval)
    await waitForHealthyService(healthUrl, serviceName)(pollingInterval, maxRetries - 1)
    return
  }

export const waitForHealthyExplorer = waitForHealthyService(
  `${config.BLOCKCHAIN_EXPLORER_URL}/api/v2/healthStatus`,
  'explorer'
)

export const waitForHealthyGovernance = waitForHealthyService(
  `${config.GOVERNANCE_SERVER_URL}/healthcheck`,
  'governance'
)
