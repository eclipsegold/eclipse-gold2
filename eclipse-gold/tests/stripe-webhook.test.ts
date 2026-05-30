import { describe, it, expect, vi, beforeEach } from 'vitest'

const constructEvent = vi.fn()
vi.mock('../lib/stripe', () => ({ getStripe: () => ({ webhooks: { constructEvent } }) }))
vi.mock('../data/shopify-admin', () => ({ createPaidOrder: vi.fn(), orderExistsForPayment: vi.fn() }))
import { createPaidOrder, orderExistsForPayment } from '../data/shopify-admin'
import { POST } from '../app/api/webhooks/stripe/route'

function req(body = '{}') {
  return new Request('https://x/api/webhooks/stripe', { method: 'POST', body, headers: { 'stripe-signature': 'sig' } })
}

const event = (overrides = {}) => ({
  type: 'payment_intent.succeeded',
  data: { object: {
    id: 'pi_1', amount: 4990, currency: 'chf',
    receipt_email: 'a@b.com',
    metadata: { country: 'CH', lines: JSON.stringify([{ v: 'gid://v/1', q: 1 }]) },
    shipping: { name: 'A B', address: { line1: 'Rue 1', city: 'Genève', postal_code: '1200', country: 'CH' } },
  } },
  ...overrides,
})

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  constructEvent.mockReset()
  vi.mocked(createPaidOrder).mockReset()
  vi.mocked(orderExistsForPayment).mockReset()
})

describe('POST /api/webhooks/stripe', () => {
  it('400s on an invalid signature', async () => {
    constructEvent.mockImplementation(() => { throw new Error('bad sig') })
    const res = await POST(req())
    expect(res.status).toBe(400)
    expect(createPaidOrder).not.toHaveBeenCalled()
  })

  it('creates a paid order on payment_intent.succeeded', async () => {
    constructEvent.mockReturnValue(event())
    vi.mocked(orderExistsForPayment).mockResolvedValue(false)
    vi.mocked(createPaidOrder).mockResolvedValue('gid://shopify/Order/1')
    const res = await POST(req())
    expect(res.status).toBe(200)
    expect(createPaidOrder).toHaveBeenCalledOnce()
    expect(vi.mocked(createPaidOrder).mock.calls[0][0]).toMatchObject({ paymentIntentId: 'pi_1', email: 'a@b.com' })
  })

  it('is idempotent — skips if an order already exists', async () => {
    constructEvent.mockReturnValue(event())
    vi.mocked(orderExistsForPayment).mockResolvedValue(true)
    const res = await POST(req())
    expect(res.status).toBe(200)
    expect(createPaidOrder).not.toHaveBeenCalled()
  })

  it('500s when order creation fails (so Stripe retries)', async () => {
    constructEvent.mockReturnValue(event())
    vi.mocked(orderExistsForPayment).mockResolvedValue(false)
    vi.mocked(createPaidOrder).mockRejectedValue(new Error('admin down'))
    const res = await POST(req())
    expect(res.status).toBe(500)
  })

  it('ignores unrelated event types', async () => {
    constructEvent.mockReturnValue(event({ type: 'payment_intent.created' }))
    const res = await POST(req())
    expect(res.status).toBe(200)
    expect(createPaidOrder).not.toHaveBeenCalled()
  })
})
