import {BigNumber} from '@wingriders/cab/types'
import {AssetQuantityDisplay} from './AssetQuantityDisplay'
import {ADA_METADATA} from '../features/metadata/constants'
import {AdaAsset} from '@wingriders/cab/constants'

type AdaQuantityDisplayProps = {
  quantity: BigNumber
}

export const AdaQuantityDisplay = ({quantity}: AdaQuantityDisplayProps) => {
  return <AssetQuantityDisplay token={{...AdaAsset, quantity}} assetMetadata={ADA_METADATA} showTicker />
}
