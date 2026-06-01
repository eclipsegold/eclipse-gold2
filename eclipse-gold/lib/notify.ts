/**
 * Order notifications — no Shopify. When a Stripe payment succeeds, the order
 * is emailed to the shop owner via Resend (free tier). If Resend isn't
 * configured yet, the order is logged so it is never lost.
 */

export interface OrderNotification {
  paymentIntentId: string
  email: string
  currency: string
  total: number
  lines: { handle: string; quantity: number }[]
  address: {
    firstName: string
    lastName: string
    address1: string
    city: string
    zip: string
    country: string
  }
}

export function formatOrder(o: OrderNotification): string {
  const items = o.lines.map((l) => `  - ${l.handle} × ${l.quantity}`).join('\n')
  const a = o.address
  return [
    `Commande payée : ${o.paymentIntentId}`,
    `Total : ${o.total.toFixed(2)} ${o.currency}`,
    `Client : ${o.email || '(e-mail non fourni)'}`,
    '',
    'Articles :',
    items || '  (aucun)',
    '',
    'Livraison :',
    `  ${a.firstName} ${a.lastName}`.trim(),
    `  ${a.address1}`,
    `  ${a.zip} ${a.city}`.trim(),
    `  ${a.country}`,
  ].join('\n')
}

export async function sendOrderEmail(order: OrderNotification): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.ORDER_NOTIFICATION_EMAIL
  const summary = formatOrder(order)

  if (!apiKey || !to) {
    // Resend not wired yet — keep the order in the function logs so it survives.
    console.log(`[ORDER] email not configured — order details:\n${summary}`)
    return
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: process.env.ORDER_FROM_EMAIL ?? 'Eclipse Gold <onboarding@resend.dev>',
    to,
    subject: `🛍️ Nouvelle commande — ${order.total.toFixed(2)} ${order.currency}`,
    text: summary,
  })
  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`)
  }
}
