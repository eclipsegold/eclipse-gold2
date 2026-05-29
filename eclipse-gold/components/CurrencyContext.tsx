'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Country } from '../lib/currency'

interface CurrencyState {
  country: Country
  setCountry: (c: Country) => void
}

const Ctx = createContext<CurrencyState | null>(null)

export function CurrencyProvider({
  initialCountry,
  children,
}: {
  initialCountry: Country
  children: ReactNode
}) {
  const [country, setCountryState] = useState<Country>(initialCountry)
  function setCountry(c: Country) {
    document.cookie = `eg-country=${c}; path=/; max-age=31536000; samesite=lax`
    setCountryState(c)
  }
  return <Ctx.Provider value={{ country, setCountry }}>{children}</Ctx.Provider>
}

export function useCurrency(): CurrencyState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
