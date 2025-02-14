import {decodeAssetName} from '@wingriders/cab/helpers'
import {Token} from '@wingriders/cab/types'
import {formatBigNumber} from '../helpers/formatNumber'
import {RegisteredTokenMetadata} from '@wingriders/cab/tokenMetadata'

type AssetQuantityDisplayProps = {
  token: Token
  assetMetadata?: RegisteredTokenMetadata
  showTicker?: boolean
}

export const AssetQuantityDisplay = ({token, assetMetadata, showTicker}: AssetQuantityDisplayProps) => {
  const tokenName = assetMetadata?.ticker ?? decodeAssetName(token).slice(0, 8)
  const decimals = assetMetadata?.decimals ?? 0
  const quantity = token.quantity.shiftedBy(-decimals)

  return (
    <span>
      {formatBigNumber(quantity, {
        maxDecimals: decimals,
        suffix: showTicker ? ` ${tokenName}` : undefined,
      })}
    </span>
  )
}
