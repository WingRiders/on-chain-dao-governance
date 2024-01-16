import {Metadatum} from '@cardano-ogmios/schema'
import {decode as decodeCbor} from 'cbor'
import {isMap} from 'lodash'

import {TxMetadatum} from '@wingriders/cab/types'

import {logger} from '../logger'

/**
 * A safer 1:1 mapping between ogmios metadatum and the TxMetadatum used in CAB
 * and with the cbor api.
 */
export const parseOgmiosMetadatum = (metadatum: Metadatum): TxMetadatum => {
  if (typeof metadatum === 'bigint') {
    return Number(metadatum)
  } else if (
    typeof metadatum === 'string' ||
    // When data from ogmios contains cborized metadata,
    // decoding cbor yields number and Buffers,
    // which does not match with ogmios types
    typeof metadatum === 'number' ||
    Buffer.isBuffer(metadatum)
  ) {
    return metadatum
  } else if (Array.isArray(metadatum)) {
    return metadatum.map(parseOgmiosMetadatum)
  } else {
    const map = new Map<TxMetadatum, TxMetadatum>()
    // When data from ogmios contains cborized metadata, there are Maps instead of objects
    const entries = metadatum instanceof Map ? Array.from(metadatum) : Object.entries(metadatum)
    for (const [key, value] of entries) {
      map.set(key, parseOgmiosMetadatum(value))
    }
    return map
  }
}

export const parseOgmios6Metadatum = ({cbor, json}: {cbor?: string; json?: Metadatum}) => {
  if (json) {
    return parseOgmiosMetadatum(json)
  }
  if (cbor) {
    const decodedCbor = decodeCbor(Buffer.from(cbor, 'hex'))
    logger.debug(decodedCbor, 'Decoded CBOR')
    return parseOgmiosMetadatum(decodedCbor)
  }
  return null
}

export const assertMetadataMap = (datum: TxMetadatum | undefined): Map<TxMetadatum, TxMetadatum> => {
  if (!isMap(datum)) {
    throw new Error(`Metadatum is not a map ${datum}`)
  }
  return datum
}
