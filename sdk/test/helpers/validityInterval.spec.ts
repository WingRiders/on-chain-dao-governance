import {describe, expect, test} from 'vitest'

import {NetworkName} from '@wingriders/cab/types'

import {calculateValidityInterval} from '../../src/helpers/validityInterval'

describe('validity interval', () => {
  test('correctly calculates validity interval for mainnet network', () => {
    const now = new Date('2024-01-01T00:00:00Z')
    const validityInterval = calculateValidityInterval({name: NetworkName.MAINNET}, {date: now})

    expect(validityInterval).toEqual({
      ttl: new Date('2024-01-01T00:50:00.000Z'),
      validityIntervalStart: new Date('2023-12-31T23:50:00.000Z'),
      validityIntervalStartSlot: 112500309,
    })
  })

  test('correctly calculates validity interval for preprod network', () => {
    const now = new Date('2024-01-01T00:00:00Z')
    const validityInterval = calculateValidityInterval({name: NetworkName.PREPROD}, {date: now})

    expect(validityInterval).toEqual({
      ttl: new Date('2024-01-01T00:50:00.000Z'),
      validityIntervalStart: new Date('2023-12-31T23:50:00.000Z'),
      validityIntervalStartSlot: 48383400,
    })
  })
})
