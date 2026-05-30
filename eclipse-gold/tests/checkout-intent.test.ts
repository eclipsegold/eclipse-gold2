import { describe, it, expect, vi, beforeEach } from 'vitest'

const createPI = vi.fn()
vi.mock('../lib/stripe', () => ({ getStripe: () => ({ paymentIntents: { create: createPI } }) }))
vi.mock('../data/pricing', () => ({ priceCart: vi.fn() }))
import { priceCart } from '../data/pricing'
import { POST } from '../app/api/checkout/intent/route'

function req(body: unknown) {
  return new Request('https://x/api/checkout/intent', { method: 'POST', body: JSON.stringify(body) })
}

beforeEach(() => {
  createPI.mockReset()
  vi.mocked(priceCart).mockReset()
})

describe('POST /api/checkout/intent', () => {
  it('creates a PaymentIntent for the server-priced amount', async () => {
    vi.mocked(priceCart).mockResolvedValue({
      lines: [{ handle: 'nebula', variantId: 'v', title: 'NEBULA', quantity: 1, unitPrice: '49.90' }],
      total: 49.9, currency: 'CHF',
    })
    createPI.mockResolvedValue({ client_secret: 'cs_test_123' })
    const res = await POST(req({ lines: [{ handle: 'nebula', quantity: 1 }], country: 'CH' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ clientSecret: 'cs_test_123' })
    expect(createPI).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 4990, currency: 'chf' }),
    )
  })

  it('400s on an empty cart', async () => {
    vi.mocked(priceCart).mockRejectedValue(new Error('Cart is empty'))
    const res = await POST(req({ lines: [], country: 'CH' }))
    expect(res.status).toBe(400)
  })
})
