import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getShopifyProduct } from '../data/shopify'

beforeEach(() => {
  process.env.SHOPIFY_STORE_DOMAIN = 'eclipse-gold.myshopify.com'
  process.env.SHOPIFY_STOREFRONT_API_TOKEN = 'test-token'
  process.env.SHOPIFY_STOREFRONT_API_VERSION = '2025-01'
})

describe('getShopifyProduct', () => {
  it('maps a Storefront product payload to ShopifyProduct', async () => {
    const payload = {
      data: {
        product: {
          handle: 'nebula',
          title: 'NEBULA',
          availableForSale: true,
          priceRange: { minVariantPrice: { amount: '49.90', currencyCode: 'CHF' } },
          images: { nodes: [{ url: 'https://cdn/nebula.jpg', altText: 'NEBULA' }] },
        },
      },
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    })
    vi.stubGlobal('fetch', fetchMock)

    const product = await getShopifyProduct('nebula', 'CH')

    expect(product).toEqual({
      handle: 'nebula',
      title: 'NEBULA',
      availableForSale: true,
      price: { amount: '49.90', currencyCode: 'CHF' },
      images: [{ url: 'https://cdn/nebula.jpg', altText: 'NEBULA' }],
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('returns null when the product does not exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { product: null } }) }),
    )
    expect(await getShopifyProduct('ghost', 'FR')).toBeNull()
  })
})
