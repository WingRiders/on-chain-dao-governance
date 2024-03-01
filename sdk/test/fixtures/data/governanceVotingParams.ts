import {Address, BigNumber} from '@wingriders/cab/types'

import {GovernanceVotingParams} from '../../../src'

export const GOVERNANCE_VOTING_PARAMS: GovernanceVotingParams = {
  proposalCollateralQuantity: new BigNumber(100_000_000),
  governanceToken: {
    asset: {
      policyId: '659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7',
      assetName: '57696e67526964657273',
    },
  },
  proposalsAddress:
    'addr_test1qz68clqv5g66rzqq8l0ru6jcx9q63yf97dr9w2ac06q6supfvmwlrkk0q3k4yjpn3yt5wy7zz23m2jfhp7vkqejkjfgsg0pq9r' as Address,
}
