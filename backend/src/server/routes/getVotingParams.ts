import {GovernanceVotingParamsResponse} from '@wingriders/governance-sdk'

import {config, governanceToken, proposalsAddress} from '../../config'
import {fetchGovernanceTokenMetadata} from '../../helpers/fetchGovernanceTokenMetadata'

export const getVotingParams = async (): Promise<GovernanceVotingParamsResponse> => ({
  governanceToken: {asset: governanceToken, metadata: await fetchGovernanceTokenMetadata()},
  totalMintedGovernanceTokens: config.TOTAL_MINTED_GOVERNANCE_TOKENS,
  proposalCollateralQuantity: config.PROPOSAL_COLLATERAL_QUANTITY,
  proposalsAddress,
})
