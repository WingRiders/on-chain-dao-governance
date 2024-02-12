import {decodeAssetName} from '@wingriders/cab/helpers'
import {RegisteredTokenMetadata, Token} from '@wingriders/cab/types'
import {formatBigNumber} from '../helpers/formatNumber'

type AssetQuantityDisplayProps = {
  token: Token
  assetMetadata?: RegisteredTokenMetadata
}

export const AssetQuantityDisplay = ({token, assetMetadata}: AssetQuantityDisplayProps) => {
  const tokenName = assetMetadata?.ticker ?? decodeAssetName(token).slice(0, 8)
  const decimals = assetMetadata?.decimals ?? 0
  const quantity = token.quantity.shiftedBy(-decimals)

  return <span>{formatBigNumber(quantity, {maxDecimals: decimals, suffix: ` ${tokenName}`})}</span>
}
