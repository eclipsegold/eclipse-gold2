'use client'
import { useEffect, useState } from 'react'
import type { Lang } from '../data/types'
import { currencyFor, formatPrice, type Currency } from '../lib/currency'
import { useCurrency } from './CurrencyContext'

export function Price({
  handle,
  lang,
  defaultAmount,
  defaultCurrency,
}: {
  handle: string
  lang: Lang
  defaultAmount: string
  defaultCurrency: Currency
}) {
  const { country } = useCurrency()
  const [amount, setAmount] = useState(defaultAmount)
  const [currency, setCurrency] = useState<Currency>(defaultCurrency)

  useEffect(() => {
    const target = currencyFor(lang, country)
    if (target === defaultCurrency) {
      setAmount(defaultAmount)
      setCurrency(defaultCurrency)
      return
    }
    let active = true
    fetch(`/api/price?handle=${encodeURIComponent(handle)}&country=${country}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data) {
          setAmount(data.amount)
          setCurrency(data.currencyCode as Currency)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [country, lang, handle, defaultAmount, defaultCurrency])

  return <span className="price">{formatPrice(amount, currency, lang)}</span>
}
