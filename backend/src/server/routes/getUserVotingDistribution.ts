import {
  DistributionKey,
  TokenDistribution,
  UserVotingDistributionFilter,
  UserVotingDistributionResponse,
  UtxoId,
} from '@wingriders/governance-sdk'
import {alonzoDateToSlotFactory} from '@wingriders/cab/helpers'
import {fetchWalletsUtxosWithAsset} from '../../validation/fetchUTxOs'
import {config, governanceToken} from '../../config'
import {BigNumber} from '@wingriders/cab/types'
import {calculateVotingDistribution} from '../../helpers/calculateVotingDistribution'
import {uniq} from 'lodash'

export const getUserVotingDistribution = async ({
  ownerStakeKeyHash,
  slot: optionalSlot,
}: UserVotingDistributionFilter): Promise<UserVotingDistributionResponse> => {
  const slot = optionalSlot ?? alonzoDateToSlotFactory(config.NETWORK_NAME)(new Date())
  const walletTokens = await fetchWalletsUtxosWithAsset(
    {explorerUrl: config.BLOCKCHAIN_EXPLORER_URL},
    {slot, stakingCredentials: [ownerStakeKeyHash], asset: governanceToken, utxoIds: []}
  )
  const tokenDistribution: TokenDistribution<BigNumber> = {
    [DistributionKey.WALLET_TOKENS]: walletTokens,
  }
  const votingDistribution = calculateVotingDistribution(tokenDistribution)
  const utxoIds = uniq<UtxoId>(Object.values(tokenDistribution).flatMap(({utxoIds}) => utxoIds))
  return {
    ...votingDistribution,
    utxoIds,
    slot,
  }
}
