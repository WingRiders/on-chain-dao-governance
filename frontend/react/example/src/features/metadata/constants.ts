import {ADA_DECIMALS} from '@wingriders/cab/constants'
import {RegisteredTokenMetadata, TokenRegistrySubject} from '@wingriders/cab/tokenMetadata'

export const ADA_METADATA: RegisteredTokenMetadata = {
  description: 'Cardano ADA',
  ticker: 'ADA',
  name: 'ADA',
  decimals: ADA_DECIMALS,
  subject: '' as TokenRegistrySubject,
}
