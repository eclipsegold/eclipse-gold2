import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/shopify', () => ({ getShopifyProduct: vi.fn() }))
import { getShopifyProduct } from '../data/shopify'
import { priceCart } from '../data/pricing'

const make = (handle: string, amount: string, currencyCode = 'CHF') => ({
  handle, title: handle, availableForSale: true, variantId: `v-${handle}`,
  price: { amount, currencyCode }, images: [],
})

beforeEach(() => vi.mocked(getShopifyProduct).mockReset())

describe('priceCart', () => {
  it('sums line totals from server-resolved prices', async () => {
    vi.mocked(getShopifyProduct).mockImplementation(async (h: string) =>
      h === 'nebula' ? make('nebula', '49.90') : make('helios', '49.90'),
    )
    const cart = await priceCart(
      [{ handle: 'nebula', quantity: 2 }, { handle: 'helios', quantity: 1 }],
      'CH',
    )
    expect(cart.total).toBeCloseTo(149.7, 2)
    expect(cart.currency).toBe('CHF')
    expect(cart.lines).toHaveLength(2)
    expect(cart.lines[0]).toMatchObject({ handle: 'nebula', variantId: 'v-nebula', quantity: 2 })
  })

  it('uses EUR for non-CH countries', async () => {
    vi.mocked(getShopifyProduct).mockResolvedValue(make('nebula', '52.00', 'EUR'))
    const cart = await priceCart([{ handle: 'nebula', quantity: 1 }], 'FR')
    expect(cart.currency).toBe('EUR')
  })

  it('throws on an empty cart', async () => {
    await expect(priceCart([], 'CH')).rejects.toThrow(/empty/i)
  })

  it('throws on an unknown or unavailable handle', async () => {
    vi.mocked(getShopifyProduct).mockResolvedValue(null)
    await expect(priceCart([{ handle: 'ghost', quantity: 1 }], 'CH')).rejects.toThrow(/ghost/)
  })
})
