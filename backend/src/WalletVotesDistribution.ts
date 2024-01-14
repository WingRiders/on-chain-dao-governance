import {
  DistributionKey,
  TokenDistribution,
  UserVotingDistributionFilter,
  UserVotingDistributionResponse,
  UtxoId,
  VOTING_WEIGHTS,
} from '@wingriders/governance-sdk'
import {alonzoDateToSlotFactory} from '@wingriders/cab/helpers'
import {fetchWalletsUtxosWithAsset} from './validation/fetchUTxOs'
import {config, governanceToken} from './config'
import {BigNumber} from '@wingriders/cab/types'
import {uniq} from 'lodash'
import {VotesDistribution} from './VotesDistribution'

const calculateVotingDistribution = (tokenDistribution: TokenDistribution<BigNumber>) => {
  const calculateTokenCountAndVotingPower = (key: DistributionKey) => {
    const tokenCount = tokenDistribution[key]?.tokenCount ?? new BigNumber(0)
    const weight = VOTING_WEIGHTS[key]
    return {
      tokenCount,
      votingPower: tokenCount.times(weight).integerValue(BigNumber.ROUND_FLOOR),
    }
  }

  return {
    walletTokens: calculateTokenCountAndVotingPower(DistributionKey.WALLET_TOKENS),
  }
}

const getUserVotingDistribution = async ({
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

const getTheoreticalMaxVotingPower = async () =>
  VOTING_WEIGHTS.walletTokens * config.TOTAL_MINTED_GOVERNANCE_TOKENS

export const WalletVotesDistribution: VotesDistribution = {
  getUserVotingDistribution,
  getTheoreticalMaxVotingPower,
}
