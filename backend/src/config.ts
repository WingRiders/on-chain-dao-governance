import {Asset, NetworkName} from '@wingriders/cab/types'
import z from 'zod'
import pino from 'pino'
import dotenv from 'dotenv'

dotenv.config(process.env.DOTENV_CONFIG_PATH ? {path: process.env.DOTENV_CONFIG_PATH} : {})

export enum Mode {
  AGGREGATOR = 'aggregator',
  SERVER = 'server',
}

const envSchema = z.object({
  NETWORK_NAME: z.nativeEnum(NetworkName),
  MODE: z.nativeEnum(Mode),
  GOVERNANCE_TOKEN_POLICY_ID: z
    .string()
    .regex(/^[a-fA-F0-9]+$/)
    .length(56),
  GOVERNANCE_TOKEN_ASSET_NAME: z.string().regex(/^[a-fA-F0-9]+$/),
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
