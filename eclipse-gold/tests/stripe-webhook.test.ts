import { describe, it, expect, vi, beforeEach } from 'vitest'

const constructEvent = vi.fn()
const updatePI = vi.fn()
vi.mock('../lib/stripe', () => ({
  getStripe: () => ({ webhooks: { constructEvent }, paymentIntents: { update: updatePI } }),
}))
vi.mock('../lib/notify', () => ({ sendOrderEmail: vi.fn(), sendCustomerConfirmationEmail: vi.fn() }))
import { sendOrderEmail } from '../lib/notify'
import { POST } from '../app/api/webhooks/stripe/route'

function req(body = '{}') {
  return new Request('https://x/api/webhooks/stripe', { method: 'POST', body, headers: { 'stripe-signature': 'sig' } })
}

const pi = (overrides = {}) => ({
  id: 'pi_1', amount: 4990, currency: 'chf', receipt_email: 'a@b.com',
  metadata: { country: 'CH', lines: JSON.stringify([{ v: 'nebula', q: 1 }]) },
  shipping: { name: 'A B', address: { line1: 'Rue 1', city: 'Genève', postal_code: '1200', country: 'CH' } },
  ...overrides,
})

const event = (object = pi(), type = 'payment_intent.succeeded') => ({ type, data: { object } })

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  constructEvent.mockReset()
  updatePI.mockReset()
  updatePI.mockResolvedValue({})
  vi.mocked(sendOrderEmail).mockReset()
})

describe('POST /api/webhooks/stripe', () => {
  it('400s on an invalid signature', async () => {
    constructEvent.mockImplementation(() => { throw new Error('bad sig') })
    const res = await POST(req())
    expect(res.status).toBe(400)
    expect(sendOrderEmail).not.toHaveBeenCalled()
  })

  it('emails the order on payment_intent.succeeded and flags it notified', async () => {
    constructEvent.mockReturnValue(event())
    vi.mocked(sendOrderEmail).mockResolvedValue(undefined)
    const res = await POST(req())
    expect(res.status).toBe(200)
    expect(sendOrderEmail).toHaveBeenCalledOnce()
    expect(vi.mocked(sendOrderEmail).mock.calls[0][0]).toMatchObject({
      paymentIntentId: 'pi_1', email: 'a@b.com', total: 49.9, currency: 'CHF',
      lines: [{ handle: 'nebula', quantity: 1 }],
    })
    expect(updatePI).toHaveBeenCalledWith('pi_1', { metadata: expect.objectContaining({ notified: 'true' }) })
  })

  it('is idempotent — skips if already notified', async () => {
    constructEvent.mockReturnValue(event(pi({ metadata: { notified: 'true', lines: '[]' } })))
    const res = await POST(req())
    expect(res.status).toBe(200)
    expect(sendOrderEmail).not.toHaveBeenCalled()
  })

  it('500s when the email fails (so Stripe retries)', async () => {
    constructEvent.mockReturnValue(event())
    vi.mocked(sendOrderEmail).mockRejectedValue(new Error('resend down'))
    const res = await POST(req())
    expect(res.status).toBe(500)
  })

  it('ignores unrelated event types', async () => {
    constructEvent.mockReturnValue(event(pi(), 'payment_intent.created'))
    const res = await POST(req())
    expect(res.status).toBe(200)
    expect(sendOrderEmail).not.toHaveBeenCalled()
  })
})
