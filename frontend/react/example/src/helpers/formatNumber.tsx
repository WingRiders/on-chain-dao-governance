import {BigNumber} from '@wingriders/cab/types'

export type FormatNumberOptions = {
  prefix?: string
  suffix?: string
  minDecimals?: number
  maxDecimals?: number
} & (
  | {
      fixedDecimals?: undefined
    }
  | {
      maxDecimals: number // maximum number of decimals places in the formatted number
      fixedDecimals: boolean // if true, the formatted number will always have maxDecimals decimal places
    }
)

export const formatBigNumber = (_number: BigNumber.Value, options: FormatNumberOptions = {}) => {
  const number = new BigNumber(_number)
  let formattedNumber: string
  if (!number.isFinite()) {
    // this should be probably translated
    formattedNumber = number.toString()
  } else {
    const {maxDecimals, minDecimals, fixedDecimals} = options
    let formatDecimals: number | undefined
    if (maxDecimals != null || minDecimals != null)
      formatDecimals = fixedDecimals
        ? maxDecimals
        : Math.max(minDecimals ?? 0, Math.min(number.dp() ?? 0, maxDecimals ?? 0))

    formattedNumber = number.toFormat(formatDecimals)
  }

  return `${options.prefix ?? ''}${formattedNumber}${options.suffix ?? ''}`
}
