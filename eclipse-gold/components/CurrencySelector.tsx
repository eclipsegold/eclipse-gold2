'use client'
import type { Lang } from '../data/types'
import { useCurrency } from './CurrencyContext'
import type { Country } from '../lib/currency'
import styles from './CurrencySelector.module.css'

const LABEL: Record<Lang, string> = { fr: 'Devise', de: 'Währung', it: 'Valuta' }

export function CurrencySelector({ lang = 'fr' }: { lang?: Lang }) {
  const { country, setCountry } = useCurrency()
  // Only CH/FR are valid options; anything else falls back to the FR default.
  const value = country === 'CH' ? 'CH' : 'FR'
  return (
    <select
      aria-label={LABEL[lang]}
      className={styles.select}
      value={value}
      onChange={(e) => setCountry(e.target.value as Country)}
    >
      <option value="CH">CHF (Suisse)</option>
      <option value="FR">EUR (Europe)</option>
    </select>
  )
}
