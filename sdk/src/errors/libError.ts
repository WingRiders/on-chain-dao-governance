import type {HexString} from '@wingriders/cab/types'

export enum LibErrorCode {
  InternalError = -1,
  UnsupportedNetwork = -2,
  Unauthorized = -3,
  Network = -4,
  BadRequest = -5,
  UnsupportedDatum = -6,
  NetworkMismatch = -7,
  Unknown = -8,
  InsufficientAdaForTx = -9,
  UserDeclinedTx = -10,
  ProofGenerationTx = -11,
  TxSubmitFailed = -12,
}

const LIB_ERROR_CODES = Object.values(LibErrorCode).filter(
  (value): value is Exclude<typeof value, string> => typeof value !== 'string'
)

const LIB_ERROR_BRAND = '__GOVERNANCE_SDK_ERROR'

export interface LibErrorObject {
  [LIB_ERROR_BRAND]: true
  code: LibErrorCode
  message: string
  cause?: object
  tx?: HexString
  stack?: string
  name?: string
}

export class LibError extends Error implements LibErrorObject {
  readonly [LIB_ERROR_BRAND] = true
  readonly name = 'LibError'

  constructor(
    public code: LibErrorCode,
    message?: string,
    public cause?: object,
    public tx?: HexString
  ) {
    super(message)
  }
}

// can't use ts-pattern because of import cycles
export const isLibError = (err: any): err is LibErrorObject =>
  typeof err === 'object' &&
  err != null &&
  err[LIB_ERROR_BRAND] === true &&
  LIB_ERROR_CODES.includes(err.code) &&
  typeof err.message === 'string' &&
  (err.cause === undefined || (typeof err.cause === 'object' && err.cause != null)) &&
  (err.tx === undefined || typeof err.tx === 'string') &&
  (err.stack === undefined || typeof err.stack === 'string') &&
  (err.name === undefined || typeof err.name === 'string')
