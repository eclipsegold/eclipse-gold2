export interface OrderAddress {
  firstName: string
  lastName: string
  address1: string
  city: string
  zip: string
  country: string
}

export interface OrderInput {
  paymentIntentId: string
  email: string
  currency: string
  lines: { variantId: string; quantity: number }[]
  address: OrderAddress
}

const PAYMENT_TAG_PREFIX = 'stripe-pi:'

function adminEndpoint(): { url: string; token: string } {
  const domain = process.env.SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN
  const version = process.env.SHOPIFY_ADMIN_API_VERSION ?? '2025-01'
  if (!domain || !token) {
    throw new Error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_API_TOKEN')
  }
  return { url: `https://${domain}/admin/api/${version}/graphql.json`, token }
}

async function adminFetch(query: string, variables: unknown): Promise<Record<string, unknown>> {
  const { url, token } = adminEndpoint()
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`)
  const json = await res.json()
  if (Array.isArray(json?.errors) && json.errors.length > 0) {
    throw new Error(`Admin API errors: ${json.errors.map((e: { message?: string }) => e.message).join('; ')}`)
  }
  return json.data as Record<string, unknown>
}

const ORDER_LOOKUP = /* GraphQL */ `
  query OrdersByTag($query: String!) {
    orders(first: 1, query: $query) { nodes { id } }
  }
`

export async function orderExistsForPayment(paymentIntentId: string): Promise<boolean> {
  const data = (await adminFetch(ORDER_LOOKUP, { query: `tag:${PAYMENT_TAG_PREFIX}${paymentIntentId}` })) as {
    orders?: { nodes?: unknown[] }
  }
  return (data.orders?.nodes?.length ?? 0) > 0
}

const ORDER_CREATE = /* GraphQL */ `
  mutation OrderCreate($order: OrderCreateOrderInput!) {
    orderCreate(order: $order) {
      order { id }
      userErrors { message }
    }
  }
`

export async function createPaidOrder(input: OrderInput): Promise<string> {
  const variables = {
    order: {
      email: input.email,
      currency: input.currency,
      financialStatus: 'PAID',
      tags: [`${PAYMENT_TAG_PREFIX}${input.paymentIntentId}`, 'eg-stripe'],
      lineItems: input.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      shippingAddress: {
        firstName: input.address.firstName,
        lastName: input.address.lastName,
        address1: input.address.address1,
        city: input.address.city,
        zip: input.address.zip,
        countryCode: input.address.country,
      },
    },
  }
  const data = (await adminFetch(ORDER_CREATE, variables)) as {
    orderCreate?: { order?: { id?: string } | null; userErrors?: { message: string }[] }
  }
  const errs = data.orderCreate?.userErrors ?? []
  if (errs.length > 0) throw new Error(`orderCreate failed: ${errs.map((e) => e.message).join('; ')}`)
  const id = data.orderCreate?.order?.id
  if (!id) throw new Error('orderCreate returned no order id')
  return id
}
