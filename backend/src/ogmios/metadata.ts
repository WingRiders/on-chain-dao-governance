import {MetadatumDetailedSchema, Transaction} from '@cardano-ogmios/schema'
import {isMap} from 'lodash'
import {P, match} from 'ts-pattern'

import {TxMetadatum} from '@wingriders/cab/types'

import {logger} from '../logger'

const parseOgmiosMetadatumDetailedSchema = (metadatum: MetadatumDetailedSchema): TxMetadatum =>
  match(metadatum)
    .with({int: P.select()}, (val) => Number(val))
    .with({string: P.select()}, (val) => val)
    .with({bytes: P.select()}, (val) => Buffer.from(val, 'hex'))
    .with({list: P.select()}, (val) => val.map(parseOgmiosMetadatumDetailedSchema))
    .with({map: P.select()}, (val) => {
      const obj: Map<TxMetadatum, TxMetadatum> = new Map()
      val.forEach(({k, v}) => {
        obj.set(parseOgmiosMetadatumDetailedSchema(k), parseOgmiosMetadatumDetailedSchema(v))
      })
      return obj
    })
    .exhaustive()

export const parseMetadatumLabel = (txBody: Transaction, label: number): TxMetadatum | null => {
  // check if there is the correct metadata
  const metadata = txBody.metadata?.labels?.[label]
  if (!metadata) {
    // only parse metadata with voting operation
    return null
  }
  const metadatumDetailedSchema = metadata.json as MetadatumDetailedSchema | undefined
  if (metadatumDetailedSchema === undefined) {
    logger.error('Metadata with no json field')
    return null
  }
  return parseOgmiosMetadatumDetailedSchema(metadatumDetailedSchema)
}

export const assertMetadatumMap = (datum: TxMetadatum | undefined): Map<TxMetadatum, TxMetadatum> => {
  if (!isMap(datum)) {
    throw new Error(`Metadatum is not a map ${datum}`)
  }
  return datum
}
