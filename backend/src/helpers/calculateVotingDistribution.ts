import {TokenDistribution, VOTING_WEIGHTS} from '@wingriders/governance-sdk'
import {BigNumber} from '@wingriders/cab/types'
import {mapValues} from 'lodash'

export const calculateVotingDistribution = (tokenDistribution: TokenDistribution<BigNumber>) =>
  mapValues(VOTING_WEIGHTS, (weight, key) => {
    const tokenCount = tokenDistribution[key]?.tokenCount ?? new BigNumber(0)
    return {
      tokenCount,
      votingPower: tokenCount.times(weight).integerValue(BigNumber.ROUND_FLOOR),
    }
  })
