import {BigNumber} from '@wingriders/cab/types'

export const sumBigNumbers = (bigNumbers: BigNumber[]): BigNumber =>
  bigNumbers.length > 0 ? BigNumber.sum(...bigNumbers) : new BigNumber(0)
