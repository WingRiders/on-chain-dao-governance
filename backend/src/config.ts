import {packBaseAddress} from 'cardano-crypto.js'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import pino from 'pino'
import z from 'zod'

import {networkNameToNetworkId} from '@wingriders/cab/helpers'
import {encodeAddress} from '@wingriders/cab/ledger/address'
import {Address, Asset, NetworkName} from '@wingriders/cab/types'

export const env = dotenv.config(
  process.env.DOTENV_CONFIG_PATH ? {path: process.env.DOTENV_CONFIG_PATH} : {}
)
dotenvExpand.expand(env)

export enum Mode {
  AGGREGATOR = 'aggregator',
  SERVER = 'server',
}

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  NETWORK_NAME: z.nativeEnum(NetworkName),
  MODE: z.nativeEnum(Mode),
  SERVER_PORT: z.coerce.number(),
  AGGREGATOR_PORT: z.coerce.number(),
  LOG_LEVEL: z
    .union([
      z.literal('fatal'),
      z.literal('error'),
      z.literal('warn'),
      z.literal('info'),
      z.literal('debug'),
      z.literal('trace'),
    ])
    .default('info'),
  HTTP_SERVER_KEEP_ALIVE_SECONDS: z.coerce.number().gte(0).default(182),
  CORS_ENABLED_FOR: z.string(),
  DATABASE_URL: z.string().url(),
  KUPO_URL: z.string().url(),
  OGMIOS_HOST: z.string().optional(),
  OGMIOS_PORT: z.coerce.number().gte(0).optional(),
  SYNC_EARLIEST_SLOT: z.coerce.number().gte(0),
  SYNC_EARLIEST_HASH: z
    .string()
    .regex(/^[a-fA-F0-9]+$/)
    .length(64),
  GOVERNANCE_TOKEN_POLICY_ID: z
    .string()
    .regex(/^[a-fA-F0-9]+$/)
    .length(56),
  GOVERNANCE_TOKEN_ASSET_NAME: z.string().regex(/^[a-fA-F0-9]+$/),
  TOTAL_MINTED_GOVERNANCE_TOKENS: z.coerce.number().gte(0),
  PROPOSALS_WALLET_PUBKEYHASH: z
    .string()
    .regex(/^[a-fA-F0-9]+$/)
    .length(56),
  PROPOSALS_WALLET_STAKEKEYHASH: z
    .string()
    .regex(/^[a-fA-F0-9]+$/)
    .length(56),
  PROPOSAL_COLLATERAL_QUANTITY: z.coerce.number().gte(0),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  // If parsing the env variables fails, log the error and exit with code 1
  // Here it's not possible to use the logger from ./logger.ts because that
  // requires a valid config
  pino({name: 'governance'}).error(
    {issues: result.error.issues},
    `Error while parsing the following env variables: ${result.error.issues
      .map((issue) => issue.path.join('.'))
      .join(', ')}`
  )
  process.exit(1)
}

export const config = result.data

export const governanceToken: Asset = {
  policyId: config.GOVERNANCE_TOKEN_POLICY_ID,
  assetName: config.GOVERNANCE_TOKEN_ASSET_NAME,
}

export const proposalsAddress: Address = encodeAddress(
  packBaseAddress(
    Buffer.from(config.PROPOSALS_WALLET_PUBKEYHASH, 'hex'),
    Buffer.from(config.PROPOSALS_WALLET_STAKEKEYHASH, 'hex'),
    networkNameToNetworkId[config.NETWORK_NAME]
  )
)

export const isServerMode = config.MODE === Mode.SERVER

export const isAggregatorMode = config.MODE === Mode.AGGREGATOR
