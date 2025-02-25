export const bigintStringify = (obj: any) => {
  if (typeof obj === 'string' || typeof obj === 'number' || obj === undefined || obj === null) {
    return obj
  }

  if (typeof obj === 'bigint') {
    return obj.toString()
  }

  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'bigint') {
      obj[key] = value.toString()
    } else if (typeof value === 'object') {
      bigintStringify(obj[key])
    }
  })

  return obj
}
