import type { Country, Currency } from '../lib/currency'
import { currencyForCountry } from '../lib/currency'
import { getCatalogProduct } from './catalog'

export interface CartLineInput {
  handle: string
  quantity: number
}

export interface PricedLine {
  handle: string
  variantId: string
  title: string
  quantity: number
  unitPrice: string
}

export interface PricedCart {
  lines: PricedLine[]
  total: number
  currency: Currency
}

export async function priceCart(lines: CartLineInput[], country: Country): Promise<PricedCart> {
  if (!lines || lines.length === 0) {
    throw new Error('Cart is empty')
  }
  const currency = currencyForCountry(country)
  const priced: PricedLine[] = []
  let total = 0
  for (const line of lines) {
    const qty = Math.max(1, Math.floor(line.quantity))
    const product = getCatalogProduct(line.handle, country)
    if (!product || !product.availableForSale || !product.variantId) {
      throw new Error(`Unavailable product: ${line.handle}`)
    }
    const unit = Number(product.price.amount)
    total += unit * qty
    priced.push({
      handle: product.handle,
      variantId: product.variantId,
      title: product.title,
      quantity: qty,
      unitPrice: product.price.amount,
    })
  }
  return { lines: priced, total: Math.round(total * 100) / 100, currency }
}
