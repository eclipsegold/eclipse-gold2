import type Stripe from 'stripe'
import { getStripe } from '../../../../lib/stripe'
import { sendOrderEmail, sendCustomerConfirmationEmail, type OrderNotification } from '../../../../lib/notify'

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

  // Idempotency: Stripe delivers at least once. We flag the PaymentIntent once
  // notified so retries don't send a duplicate email.
  if (pi.metadata?.notified === 'true') {
    return Response.json({ received: true, idempotent: true })
  }

  try {
    const lines = JSON.parse((pi.metadata?.lines as string) ?? '[]') as { v: string; q: number }[]
    const name = parseName(pi.shipping?.name)
    const addr: Record<string, string> = pi.shipping?.address ?? {}
    const order: OrderNotification = {
      paymentIntentId: pi.id,
      email: pi.receipt_email ?? '',
      currency: (pi.currency ?? 'chf').toUpperCase(),
      total: (pi.amount ?? 0) / 100,
      lines: lines.map((l) => ({ handle: l.v, quantity: l.q })),
      address: {
        firstName: name.firstName,
        lastName: name.lastName,
        address1: addr.line1 ?? '',
        city: addr.city ?? '',
        zip: addr.postal_code ?? '',
        country: addr.country ?? (pi.metadata?.country as string) ?? 'CH',
      },
    }
    // Owner notification first — a hard failure here throws and yields 500 so
    // Stripe retries. The customer receipt is best-effort (never throws) and a
    // missing customer email is a non-fatal skip.
    await sendOrderEmail(order)
    await sendCustomerConfirmationEmail(order)
    await getStripe().paymentIntents.update(pi.id, {
      metadata: { ...pi.metadata, notified: 'true' },
    })
    return Response.json({ received: true })
  } catch (error) {
    // Payment already captured — return 500 so Stripe retries; never lose the order.
    console.error('webhook: failed to notify order', error)
    return Response.json({ error: 'order notification failed' }, { status: 500 })
  }
}
