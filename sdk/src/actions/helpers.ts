import {matchAsset} from '@wingriders/cab/ledger/assets'
import {Asset, UTxO} from '@wingriders/cab/types'

export const isPotentialProposalUTxO = (governanceToken: Asset) => (utxo: UTxO) =>
  !!utxo.tokenBundle.find(matchAsset(governanceToken))?.quantity.gt(0)
