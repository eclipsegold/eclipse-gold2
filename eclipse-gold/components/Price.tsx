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
      // Load-bearing: explicitly restore defaults so toggling back to the
      // default-currency market shows the server price (no stale refetch value).
      setAmount(defaultAmount)
      setCurrency(defaultCurrency)
      return
    }
    const controller = new AbortController()
    fetch(`/api/price?handle=${encodeURIComponent(handle)}&country=${country}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setAmount(data.amount)
          setCurrency(data.currencyCode as Currency)
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          // swallow network errors; the default price stays shown
        }
      })
    return () => {
      controller.abort()
    }
  }, [country, lang, handle, defaultAmount, defaultCurrency])

  return <span className="price">{formatPrice(amount, currency, lang)}</span>
}
