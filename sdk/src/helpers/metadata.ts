import {isArray, isMap, isString} from 'lodash'

import {encodeAddress} from '@wingriders/cab/ledger/address'
import {Address, BigNumber, TxMetadatum} from '@wingriders/cab/types'

export function parseBuffer(datum: TxMetadatum | undefined): Buffer {
  if (!Buffer.isBuffer(datum)) {
    throw new Error(`Metadatum is not a buffer ${datum}`)
  }
  return datum
}

export function parseArray(datum: TxMetadatum | undefined): TxMetadatum[] {
  if (!isArray(datum)) {
    throw new Error(`Metadatum is not an array ${datum}`)
  }
  return datum
}

export function parseAddressBuffer(datum: TxMetadatum | undefined): Address {
  return encodeAddress(parseBuffer(datum))
}

export function parseNumber(datum: TxMetadatum | undefined): number {
  if (typeof datum === 'number') {
    return datum
  } else {
    throw new Error(`Metadatum is not a number ${datum}`)
  }
}

export function parseInteger(datum: TxMetadatum | undefined): number {
  if (typeof datum === 'number' && Number.isInteger(datum)) {
    return datum
  } else {
    throw new Error(`Metadatum is not a integer ${datum}`)
  }
}

export function parseBigNumber(datum: TxMetadatum | undefined): BigNumber {
  if (typeof datum === 'string' || typeof datum === 'number') {
    const num = new BigNumber(datum)
    if (!num.isNaN()) return num
  }
  throw new Error(`Metadatum is not a number ${datum}`)
}

export function parseString(datum: TxMetadatum | undefined): string {
  if (isString(datum)) {
    return datum
  } else if (isArray(datum) && (datum.length === 0 || isString(datum[0]))) {
    return datum.join('')
  } else {
    throw new Error(`Metadatum is not a string ${datum}`)
  }
}

export function parseStringArray(datum: TxMetadatum | undefined): string[] {
  if (!isArray(datum)) {
    throw new Error(`Metadatum is not an array ${datum}`)
  }
  return datum.map(parseString)
}

export function parsePosixTime(datum: TxMetadatum | undefined): Date {
  if (datum == null) {
    throw new Error(`Metadatum is not a posix time ${datum}`)
  }
  const date = new Date(Number(datum))
  if (isNaN(date.valueOf())) {
    throw new Error(`Metadatum is not a posix time ${datum}`)
  }
  return date
}

export const assertMetadatumMap = (datum: TxMetadatum | undefined): Map<TxMetadatum, TxMetadatum> => {
  if (!isMap(datum)) {
    throw new Error(`Metadatum is not a map ${datum}`)
  }
  return datum
}
