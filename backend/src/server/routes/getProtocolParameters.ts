import {parseOgmiosProtocolParameters} from '@wingriders/cab/helpers'
import {ProtocolParameters} from '@wingriders/cab/types'

import {getProtocolParameters as getProtocolParametersFromOgmios} from '../../ogmios'

export const getProtocolParameters = async (): Promise<ProtocolParameters> => {
  const ogmiosProtocolParameters = await getProtocolParametersFromOgmios()
  return parseOgmiosProtocolParameters(ogmiosProtocolParameters)
}
