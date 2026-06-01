import { priceCart, type CartLineInput } from '../../../../data/pricing'
import { getStripe } from '../../../../lib/stripe'
import type { Country } from '../../../../lib/currency'

export async function POST(request: Request): Promise<Response> {
  let body: { lines?: CartLineInput[]; country?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400 })
  }
  const country = (body.country ?? 'CH') as Country
  // We only ship to Switzerland and France.
  if (country !== 'CH' && country !== 'FR') {
    return Response.json({ error: 'unsupported_country' }, { status: 400 })
  }
  try {
    const cart = await priceCart(body.lines ?? [], country)
    const pi = await getStripe().paymentIntents.create({
      amount: Math.round(cart.total * 100),
      currency: cart.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        country,
        lines: JSON.stringify(cart.lines.map((l) => ({ v: l.variantId, q: l.quantity }))),
      },
    })
    return Response.json({ clientSecret: pi.client_secret })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'error'
    // Pricing/validation errors are client faults -> 400; anything else -> 502.
    const status = /empty|Unavailable/i.test(message) ? 400 : 502
    if (status === 502) console.error('checkout intent failed', error)
    return Response.json({ error: message }, { status })
  }
}
