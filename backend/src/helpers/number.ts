import {BigNumber} from '@wingriders/cab/types'

export const bigNumberToBigint = (value: BigNumber) => BigInt(value.toString())
