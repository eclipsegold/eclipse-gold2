import type Stripe from 'stripe'
import { getStripe } from '../../../../lib/stripe'
import { createPaidOrder, orderExistsForPayment } from '../../../../data/shopify-admin'

function parseName(full: string | null | undefined): { firstName: string; lastName: string } {
  const parts = (full ?? '').trim().split(/\s+/)
  if (parts.length === 0 || parts[0] === '') return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET')
    return Response.json({ error: 'config' }, { status: 500 })
  }
  const sig = request.headers.get('stripe-signature') ?? ''
  const raw = await request.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret)
  } catch {
    return Response.json({ error: 'invalid signature' }, { status: 400 })
  }

  if (event.type !== 'payment_intent.succeeded') {
    return Response.json({ received: true })
  }

  const pi = event.data.object as Stripe.PaymentIntent & {
    shipping?: { name?: string; address?: Record<string, string> }
    receipt_email?: string
  }

  try {
    if (await orderExistsForPayment(pi.id)) {
      return Response.json({ received: true, idempotent: true })
    }
    const lines = JSON.parse((pi.metadata?.lines as string) ?? '[]') as { v: string; q: number }[]
    const name = parseName(pi.shipping?.name)
    const addr: Record<string, string> = pi.shipping?.address ?? {}
    await createPaidOrder({
      paymentIntentId: pi.id,
      email: pi.receipt_email ?? '',
      currency: (pi.currency ?? 'chf').toUpperCase(),
      lines: lines.map((l) => ({ variantId: l.v, quantity: l.q })),
      address: {
        firstName: name.firstName,
        lastName: name.lastName,
        address1: addr.line1 ?? '',
        city: addr.city ?? '',
        zip: addr.postal_code ?? '',
        country: addr.country ?? (pi.metadata?.country as string) ?? 'CH',
      },
    })
    return Response.json({ received: true })
  } catch (error) {
    // Payment already captured — return 500 so Stripe retries; never lose the order.
    console.error('webhook: failed to create Shopify order', error)
    return Response.json({ error: 'order creation failed' }, { status: 500 })
  }
}
