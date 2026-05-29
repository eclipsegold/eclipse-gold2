'use client'
import { useCurrency } from './CurrencyContext'
import type { Country } from '../lib/currency'

export function CurrencySelector() {
  const { country, setCountry } = useCurrency()
  return (
    <select
      aria-label="Devise"
      value={country === 'CH' ? 'CH' : 'FR'}
      onChange={(e) => setCountry(e.target.value as Country)}
    >
      <option value="CH">CHF (Suisse)</option>
      <option value="FR">EUR (Europe)</option>
    </select>
  )
}
