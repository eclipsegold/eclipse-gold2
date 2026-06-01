import type { Country } from '../lib/currency'
import { currencyForCountry } from '../lib/currency'
import { models } from './models'

/**
 * Local product catalogue — no Shopify, no subscription.
 * Prices live here; product content lives in `models.ts`.
 */
export interface CatalogProduct {
  handle: string
  title: string
  availableForSale: boolean
  /** Stable line identifier carried into Stripe metadata. */
  variantId: string
  price: { amount: string; currencyCode: string }
  images: { url: string; altText: string | null }[]
}

/**
 * Flat catalogue price. Every current model sells at the same price.
 * Change the numbers here to reprice — that is the single source of truth.
 */
export const PRICE: Record<'CHF' | 'EUR', string> = {
  CHF: '49.90',
  EUR: '49.90',
}

export function getCatalogProduct(handle: string, country: Country): CatalogProduct | null {
  const model = models.find((m) => m.handle === handle)
  if (!model) return null
  const currencyCode = currencyForCountry(country)
  return {
    handle: model.handle,
    title: model.modelName,
    availableForSale: true,
    variantId: model.handle,
    price: { amount: PRICE[currencyCode], currencyCode },
    images: model.image ? [{ url: model.image, altText: model.modelName }] : [],
  }
}
