import {NullableProtocolParameters} from '@wingriders/cab/types'

import {parseOgmiosProtocolParameters} from '../../helpers/parseOgmiosProtocolParameters'
import {getProtocolParameters as getProtocolParametersFromOgmios} from '../../ogmios'

export const getProtocolParameters = async (): Promise<NullableProtocolParameters> => {
  const ogmiosProtocolParameters = await getProtocolParametersFromOgmios()
  return parseOgmiosProtocolParameters(ogmiosProtocolParameters)
}
