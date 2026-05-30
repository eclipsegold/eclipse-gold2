import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProductVariantId } from '../data/shopify'

beforeEach(() => {
  process.env.SHOPIFY_STORE_DOMAIN = 'eclipse-gold.myshopify.com'
  process.env.SHOPIFY_STOREFRONT_API_TOKEN = 'test'
})

describe('getProductVariantId', () => {
  it('returns the first variant id for a handle', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { product: { variants: { nodes: [{ id: 'gid://shopify/ProductVariant/111' }] } } } }),
    }))
    expect(await getProductVariantId('nebula', 'CH')).toBe('gid://shopify/ProductVariant/111')
  })

  it('returns null when the product is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { product: null } }) }))
    expect(await getProductVariantId('ghost', 'FR')).toBeNull()
  })
})
