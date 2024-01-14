import {Asset, NetworkName} from '@wingriders/cab/types'
import dotenv from 'dotenv'

const env = dotenv.config(process.env.DOTENV_CONFIG_PATH ? {path: process.env.DOTENV_CONFIG_PATH} : {})

const parseString = (data: unknown): string => {
  if (typeof data !== 'string') {
    throw new Error('Not a string')
  }
  return data
}

export const parseNonEmptyString = (data: unknown): string => {
  const str = parseString(data)
  if (str.length === 0) {
    throw new Error('Empty string')
  }
  return str
}

const parseNetworkString = (data: unknown): NetworkName => {
  const network = parseNonEmptyString(data) as NetworkName
  if (!Object.values(NetworkName).includes(network)) {
    throw new Error('Not a valid network parameter')
  }
  return network
}

export const parsePositiveIntString = (data: unknown): number => {
  const str = parseString(data)
  const num = parseInt(str, 10)
  if (!Number.isSafeInteger(num) || num < 0) {
    throw new Error('Not a positive integer')
  }
  return num
}

export function parseEnv<T>(key: string, parser?: (data: unknown) => T): T {
  if (parser) {
    try {
      return parser(process.env[key])
    } catch (err) {
      console.error(`Invalid environment variable ${key}`, process.env[key])
      throw err
    }
  } else {
    return process.env[key] as unknown as T
  }
}

export const config = {
  NETWORK_NAME: parseEnv('NETWORK', parseNetworkString) as NetworkName,
  BLOCKCHAIN_EXPLORER_URL: parseEnv('BLOCKCHAIN_EXPLORER_URL', parseNonEmptyString),
  AGGREGATOR_URL: parseEnv('AGGREGATOR_URL', parseNonEmptyString),
  API_SERVER_URL: parseEnv('API_SERVER_URL', parseNonEmptyString),
  GOVERNANCE_VOTING_PROPOSALS_WALLET: parseEnv(
    'GOVERNANCE_VOTING_PROPOSALS_WALLET',
    parseNonEmptyString
  ),
  GOVERNANCE_VOTING_PROPOSALS_ACCOUNT_INDEX: parseEnv(
    'GOVERNANCE_VOTING_PROPOSALS_ACCOUNT_INDEX',
    parsePositiveIntString
  ),
  GOVERNANCE_TOKEN_POLICY_ID: parseEnv('GOVERNANCE_TOKEN_POLICY_ID', parseNonEmptyString),
  GOVERNANCE_TOKEN_ASSET_NAME: parseEnv('GOVERNANCE_TOKEN_ASSET_NAME', parseNonEmptyString),
}

export const governanceToken: Asset = {
  policyId: config.GOVERNANCE_TOKEN_POLICY_ID,
  assetName: config.GOVERNANCE_TOKEN_ASSET_NAME,
}
