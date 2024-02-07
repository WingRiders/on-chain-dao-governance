import {uniq} from 'lodash'

import {alonzoDateToSlotFactory} from '@wingriders/cab/helpers'
import {BigNumber} from '@wingriders/cab/types'
import {
  DistributionKey,
  TokenDistribution,
  UserVotingDistributionFilter,
  UserVotingDistributionResponse,
  UtxoId,
  VOTING_WEIGHTS,
} from '@wingriders/governance-sdk'

import {config} from '../config'
import {fetchUtxos} from '../validation/fetchUtxos'
import {IVotesDistribution} from './IVotesDistribution'

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
  const walletTokens = await fetchUtxos({slot, ownerStakeKeyHash})
  const tokenDistribution: TokenDistribution<BigNumber> = {
    [DistributionKey.WALLET_TOKENS]: walletTokens,
  }
  const votingDistribution = calculateVotingDistribution(tokenDistribution)
  const utxoIds = uniq<UtxoId>(Object.values(tokenDistribution).flatMap(({utxoIds}) => utxoIds))

  return {
    walletTokens: {
      tokenCount: votingDistribution.walletTokens.tokenCount.toString(),
      votingPower: votingDistribution.walletTokens.votingPower.toString(),
    },
    utxoIds,
    slot,
  }
}

const getTheoreticalMaxVotingPower = () =>
  Promise.resolve(VOTING_WEIGHTS.walletTokens * config.TOTAL_MINTED_GOVERNANCE_TOKENS)

export const WalletVotesDistribution: IVotesDistribution = {
  getUserVotingDistribution,
  getTheoreticalMaxVotingPower,
}
