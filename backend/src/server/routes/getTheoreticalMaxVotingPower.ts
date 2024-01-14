import {VOTING_WEIGHTS} from '@wingriders/governance-sdk'
import {config} from '../../config'

export const getTheoreticalMaxVotingPower = () =>
  VOTING_WEIGHTS.walletTokens * config.TOTAL_MINTED_GOVERNANCE_TOKENS
