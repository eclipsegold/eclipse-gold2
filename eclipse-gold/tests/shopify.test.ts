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
          variants: { nodes: [{ id: 'gid://shopify/ProductVariant/111' }] },
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
      variantId: 'gid://shopify/ProductVariant/111',
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

  it('throws when required env vars are missing', async () => {
    delete process.env.SHOPIFY_STORE_DOMAIN
    await expect(getShopifyProduct('nebula', 'CH')).rejects.toThrow(/Missing/)
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }))
    await expect(getShopifyProduct('nebula', 'CH')).rejects.toThrow(/500/)
  })

  it('throws when the response contains GraphQL errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ errors: [{ message: 'Throttled' }] }) }))
    await expect(getShopifyProduct('nebula', 'CH')).rejects.toThrow(/Throttled/)
  })
})
