import {Value} from '@cardano-ogmios/schema'

import {Asset} from '@wingriders/cab/types'

export const getTokenQuantity = ({policyId, assetName}: Asset, value: Value) =>
  value[policyId]?.[assetName] ?? 0n
