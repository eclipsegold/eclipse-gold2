import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPaidOrder, orderExistsForPayment, type OrderInput } from '../data/shopify-admin'

beforeEach(() => {
  process.env.SHOPIFY_STORE_DOMAIN = 'eclipse-gold.myshopify.com'
  process.env.SHOPIFY_ADMIN_API_TOKEN = 'shpat_test'
})

const input: OrderInput = {
  paymentIntentId: 'pi_123',
  email: 'a@b.com',
  currency: 'CHF',
  lines: [{ variantId: 'gid://shopify/ProductVariant/111', quantity: 2 }],
  address: { firstName: 'A', lastName: 'B', address1: 'Rue 1', city: 'Genève', zip: '1200', country: 'CH' },
}

describe('orderExistsForPayment', () => {
  it('returns true when an order already carries the payment tag', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ data: { orders: { nodes: [{ id: 'gid://shopify/Order/9' }] } } }),
    }))
    expect(await orderExistsForPayment('pi_123')).toBe(true)
  })
  it('returns false when none match', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ data: { orders: { nodes: [] } } }),
    }))
    expect(await orderExistsForPayment('pi_404')).toBe(false)
  })
})

describe('createPaidOrder', () => {
  it('sends line items, address, and the payment tag', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { orderCreate: { order: { id: 'gid://shopify/Order/1' }, userErrors: [] } } }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const id = await createPaidOrder(input)
    expect(id).toBe('gid://shopify/Order/1')
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent.variables.order.lineItems[0]).toMatchObject({ variantId: input.lines[0].variantId, quantity: 2 })
    expect(JSON.stringify(sent.variables)).toContain('pi_123')
  })

  it('throws on userErrors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { orderCreate: { order: null, userErrors: [{ message: 'bad' }] } } }),
    }))
    await expect(createPaidOrder(input)).rejects.toThrow(/bad/)
  })
})
