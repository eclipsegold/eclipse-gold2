import { describe, it, expect } from 'vitest'
import { countryFromHeader } from '../lib/geo'

describe('countryFromHeader', () => {
  it('returns the uppercased country code', () => {
    expect(countryFromHeader('ch')).toBe('CH')
    expect(countryFromHeader('FR')).toBe('FR')
  })

  it('falls back to CH when absent or empty', () => {
    expect(countryFromHeader(null)).toBe('CH')
    expect(countryFromHeader('')).toBe('CH')
    expect(countryFromHeader(undefined)).toBe('CH')
  })
})
