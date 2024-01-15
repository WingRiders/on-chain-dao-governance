import {AddressTypes} from 'cardano-crypto.js'

import {request} from '@wingriders/cab/helpers'
import {addressType} from '@wingriders/cab/ledger/address'
import {getTokenFromBundle} from '@wingriders/cab/ledger/assets'
import {Address, Asset, BigNumber, HexString} from '@wingriders/cab/types'
import {UtxoId} from '@wingriders/governance-sdk'

import {getUtxoId} from '../helpers/getUtxoId'
import {sumBigNumbers} from '../helpers/sumBigNumbers'
import {fetchAllPaginatedData} from './fetchAllPaginatedData'

type RequiredContext = {
  explorerUrl: string
}

type Options = {
  stakingCredentials: HexString[]
  slotNumber: number
  limit: number
  lastSeenTxo?: UtxoId
  asset: Asset
}

type UtxoApiResponse = {
  id: number
  address: Address
  outputIndex: number
  txHash: string
  datum?: string
  datumHash?: string
  coins: string
  tokenBundle: (Asset & {quantity: string})[]
  creationTime?: string
}

type SnapshotResponse = {
  items: UtxoApiResponse[]
  lastSeenTxo?: UtxoId
}

/**
 * This is a slightly less performant way to query utxos
 * from the explorer, but allows taking utxos at a given point
 * in time
 */
const fetchSnapshotUTxOs =
  (context: RequiredContext) =>
  async ({
    stakingCredentials,
    limit,
    lastSeenTxo,
    asset,
    slotNumber,
  }: Options): Promise<{data: UtxoApiResponse[]; lastSeenTxo: UtxoId | undefined}> => {
    const snapshot: SnapshotResponse = await request(
      `${context.explorerUrl}/api/snapshot/utxo`,
      'POST',
      JSON.stringify({
        stakingCredentials,
        limit,
        lastSeenTxo,
        asset,
        slotNumber,
        shouldCache: true,
      }),
      {'Content-Type': 'application/json'}
    )

    if (snapshot.items.length === 0) {
      return {data: [], lastSeenTxo}
    }

    return {
      data: snapshot.items,
      lastSeenTxo: snapshot.lastSeenTxo,
    }
  }

export const fetchWalletsUtxosWithAsset = async (
  context: RequiredContext,
  args: {slot: number; stakingCredentials: HexString[]; asset: Asset; utxoIds: UtxoId[]}
): Promise<{tokenCount: BigNumber; utxoIds: UtxoId[]}> => {
  if (args.stakingCredentials.length === 0) {
    return {tokenCount: new BigNumber(0), utxoIds: []}
  }
  const wantedAsset = args.asset
  const utxos = (
    await fetchAllPaginatedData(
      fetchSnapshotUTxOs(context),
      ({data}) => data
    )({
      slotNumber: args.slot,
      stakingCredentials: args.stakingCredentials,
      asset: wantedAsset,
      limit: 500,
    })
  ).filter(
    (utxo) =>
      // Filter out addresses using script as payment credential.
      AddressTypes.BASE_SCRIPT_KEY !== addressType(utxo.address) &&
      // And by utxoIds if specified
      (!args.utxoIds || args.utxoIds.length === 0 || args.utxoIds.includes(getUtxoId(utxo)))
  )

  const tokenCount = sumBigNumbers(
    utxos.map(
      ({tokenBundle}) => new BigNumber(getTokenFromBundle(tokenBundle, wantedAsset)?.quantity ?? 0)
    )
  )

  return {tokenCount, utxoIds: utxos.map(getUtxoId)}
}
