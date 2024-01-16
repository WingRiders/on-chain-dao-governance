import {request, utxoId} from '@wingriders/cab/helpers'
import {BigNumber, HexString} from '@wingriders/cab/types'

import {config, governanceToken} from '../config'
import {sumBigNumbers} from '../helpers/sumBigNumbers'

type Options = {
  ownerStakeKeyHash: HexString
  slot: number
}

type KupoUtxo = {
  transaction_index: number
  transaction_id: string
  output_index: number
  address: string
  value: {
    coins: number
    assets: {[assetId: string]: number}
  }
  datum_hash: string
  script_hash: string
  created_at: {
    slot_no: number
    header_hash: string
  }
}

// Kupo does not support querying "unspent or spent after" (https://github.com/CardanoSolutions/kupo/issues/37)
export const fetchUtxos = async ({ownerStakeKeyHash, slot}: Options) => {
  const kupoCreatedBeforeUrl = `${config.KUPO_URL}/matches/*/${ownerStakeKeyHash}?created_before=${slot}`
  const unspent: KupoUtxo[] = await request(`${kupoCreatedBeforeUrl}&unspent`)
  const spentAfter: KupoUtxo[] = await request(`${kupoCreatedBeforeUrl}&spent_after=${slot + 1}`)
  const all = [...unspent, ...spentAfter]
  const kupoGovernanceTokenAssetId = `${governanceToken.policyId}.${governanceToken.assetName}`
  const tokenCount = sumBigNumbers(
    all.map((utxo) => new BigNumber(utxo.value.assets[kupoGovernanceTokenAssetId] ?? 0))
  )
  const utxoIds = all.map(({output_index, transaction_id}) =>
    utxoId({txHash: transaction_id, outputIndex: output_index})
  )
  return {tokenCount, utxoIds}
}
