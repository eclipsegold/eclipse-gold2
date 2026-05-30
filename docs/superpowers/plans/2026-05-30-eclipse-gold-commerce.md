# Eclipse Gold — Commerce (Stripe + Shopify/DSers) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Eclipse Gold transactional end-to-end — a client cart (drawer), a Stripe Payment Element checkout on our own domain, and a Stripe webhook that creates a paid Shopify order (via the Admin API) so DSers fulfils it on AliExpress.

**Architecture:** The cart holds only `{handle, quantity}` (localStorage). The order amount is ALWAYS recomputed server-side (`priceCart`) from the Shopify Storefront API — never trusted from the client. `/api/checkout/intent` creates a Stripe PaymentIntent; the client confirms payment with the Payment Element; `/api/webhooks/stripe` verifies the signature and creates a "paid" Shopify order via the Admin API (idempotent by PaymentIntent id). Catalogue pages stay SSG; checkout + API routes are dynamic.

**Tech Stack:** Next.js 16 (App Router), TypeScript, `stripe` (server SDK) + `@stripe/stripe-js` + `@stripe/react-stripe-js` (client), Shopify Storefront API (existing) + Admin API (new), Vitest + RTL (jsdom), CSS Modules.

**Process note (CRITICAL):** Execute tasks STRICTLY SEQUENTIALLY — one implementer at a time, verify after each. Never dispatch parallel implementers on this shared `master` branch (prior sub-projects tangled git that way). Each task makes exactly one commit. If `git commit` fails on gpg, use `git -c commit.gpgsign=false commit`.

**Next 16 gotchas:**
- Route handlers: `export async function POST(request: Request)`.
- Webhook signature verification needs the RAW body: use `await request.text()` (NOT `request.json()`), then `stripe.webhooks.constructEvent(rawBody, sig, secret)`.
- `cookies()`/`headers()` are async — but the cart sends `country` in the request body, so the intent route doesn't need them.
- Keep secrets server-only; only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is exposed.
- Tests run as two Vitest projects: node (`tests/*.test.ts`) + jsdom (`tests/*.dom.test.tsx`).

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json`, `.env.example` | Add Stripe deps + env vars |
| `data/shopify.ts` (modify) | Add `variantId` to query + `ShopifyProduct`; `getProductVariantId(handle, country)` |
| `data/pricing.ts` (new) | `priceCart(lines, country)` — server source of truth for amount |
| `lib/stripe.ts` (new) | `getStripe()` server Stripe client |
| `data/shopify-admin.ts` (new) | `createPaidOrder(...)`, `orderExistsForPayment(...)` via Admin API |
| `app/api/checkout/intent/route.ts` (new) | POST → priceCart → PaymentIntent → clientSecret |
| `app/api/webhooks/stripe/route.ts` (new) | POST → verify sig → idempotent createPaidOrder |
| `components/CartContext.tsx` (new) | client cart state (localStorage), provider + `useCart` |
| `components/CartButton.tsx` (new) | header cart icon + count badge |
| `components/CartDrawer.tsx` (+ `.module.css`) (new) | slide-in cart, steppers, checkout link |
| `components/AddToCartButton.tsx` (+ `.module.css`) (new) | replaces product cart stub |
| `components/CheckoutForm.tsx` (+ `.module.css`) (new) | address form + Stripe Payment Element |
| `app/[lang]/checkout/page.tsx` (+ `.module.css`) (new) | dynamic checkout page (Elements wrapper) |
| `app/[lang]/checkout/confirmation/page.tsx` (new) | confirmation, clears cart |
| `components/Header.tsx` (modify) | swap cart stub → `<CartButton/>` |
| `app/[lang]/layout.tsx` (modify) | mount `<CartProvider>` + `<CartDrawer/>` |
| `app/[lang]/[collection]/[product]/page.tsx` (modify) | swap cart stub → `<AddToCartButton/>` |
| `tests/*` | one test file per new logic/component unit |

---

## Task 1: Dependencies + env

**Files:** `package.json`, `.env.example`

- [ ] **Step 1: Install Stripe packages**

Run from `eclipse-gold/`:
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

- [ ] **Step 2: Append env vars to `.env.example`**

Append to `eclipse-gold/.env.example`:
```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
# Shopify Admin API (creates the paid order DSers fulfils)
SHOPIFY_ADMIN_API_TOKEN=shpat_xxx
SHOPIFY_ADMIN_API_VERSION=2025-01
```

- [ ] **Step 3: Verify install + typecheck**

Run: `npm run test` → existing 65 pass. Run `npx tsc --noEmit` → exit 0.

- [ ] **Step 4: Commit**
```bash
git add package.json package-lock.json .env.example
git -c commit.gpgsign=false commit -m "chore: add Stripe deps and commerce env vars"
```

---

## Task 2: Add variantId to the Shopify product query

**Files:** Modify `data/shopify.ts`; Test `tests/shopify-variant.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/shopify-variant.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- shopify-variant`
Expected: FAIL — `getProductVariantId` is not exported.

- [ ] **Step 3: Extend `data/shopify.ts`**

In `data/shopify.ts`: add `variantId: string` to the `ShopifyProduct` interface (after `availableForSale`). Add `variants(first: 1) { nodes { id } }` to `PRODUCT_QUERY`'s `product { ... }` selection. In the `getShopifyProduct` return mapping add `variantId: p.variants?.nodes?.[0]?.id ?? ''`. Then append a new export at the end of the file:

```ts
const VARIANT_QUERY = /* GraphQL */ `
  query Variant($handle: String!, $country: CountryCode!) @inContext(country: $country) {
    product(handle: $handle) {
      variants(first: 1) { nodes { id } }
    }
  }
`

export async function getProductVariantId(
  handle: string,
  country: Country,
): Promise<string | null> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_STOREFRONT_API_TOKEN
  const version = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2025-01'
  if (!domain || !token) {
    throw new Error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_API_TOKEN')
  }
  const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query: VARIANT_QUERY, variables: { handle, country } }),
  })
  if (!res.ok) throw new Error(`Storefront API error: ${res.status}`)
  const json = await res.json()
  if (Array.isArray(json?.errors) && json.errors.length > 0) {
    const message = json.errors.map((e: { message?: string }) => e.message ?? 'unknown').join('; ')
    throw new Error(`Storefront API errors: ${message}`)
  }
  return json?.data?.product?.variants?.nodes?.[0]?.id ?? null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- shopify-variant` → PASS (2 tests). Also `npm run test -- shopify` → the existing `shopify.test.ts` still passes (the new `variantId` field defaults to `''` when the mock omits variants; if that existing test asserts deep equality on the returned object and now fails because of the added `variantId`, update that single assertion to include `variantId: ''`). Run `npx tsc --noEmit` → exit 0.

- [ ] **Step 5: Commit**
```bash
git add data/shopify.ts tests/shopify-variant.test.ts
git -c commit.gpgsign=false commit -m "feat: expose Shopify variant id for cart/checkout"
```

---

## Task 3: Server-side cart pricing

**Files:** Create `data/pricing.ts`; Test `tests/pricing.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/pricing.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/shopify', () => ({ getShopifyProduct: vi.fn() }))
import { getShopifyProduct } from '../data/shopify'
import { priceCart } from '../data/pricing'

const make = (handle: string, amount: string) => ({
  handle, title: handle, availableForSale: true, variantId: `v-${handle}`,
  price: { amount, currencyCode: 'CHF' }, images: [],
})

beforeEach(() => vi.mocked(getShopifyProduct).mockReset())

describe('priceCart', () => {
  it('sums line totals from server-resolved prices', async () => {
    vi.mocked(getShopifyProduct).mockImplementation(async (h: string) =>
      h === 'nebula' ? make('nebula', '49.90') : make('helios', '49.90'),
    )
    const cart = await priceCart(
      [{ handle: 'nebula', quantity: 2 }, { handle: 'helios', quantity: 1 }],
      'CH',
    )
    expect(cart.total).toBeCloseTo(149.7, 2)
    expect(cart.currency).toBe('CHF')
    expect(cart.lines).toHaveLength(2)
    expect(cart.lines[0]).toMatchObject({ handle: 'nebula', variantId: 'v-nebula', quantity: 2 })
  })

  it('uses EUR for non-CH countries', async () => {
    vi.mocked(getShopifyProduct).mockResolvedValue({ ...make('nebula', '52.00'), price: { amount: '52.00', currencyCode: 'EUR' } })
    const cart = await priceCart([{ handle: 'nebula', quantity: 1 }], 'FR')
    expect(cart.currency).toBe('EUR')
  })

  it('throws on an empty cart', async () => {
    await expect(priceCart([], 'CH')).rejects.toThrow(/empty/)
  })

  it('throws on an unknown or unavailable handle', async () => {
    vi.mocked(getShopifyProduct).mockResolvedValue(null)
    await expect(priceCart([{ handle: 'ghost', quantity: 1 }], 'CH')).rejects.toThrow(/ghost/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- pricing`
Expected: FAIL — cannot find module `../data/pricing`.

- [ ] **Step 3: Write `data/pricing.ts`**

```ts
import type { Country, Currency } from './../lib/currency'
import { currencyForCountry } from './../lib/currency'
import { getShopifyProduct } from './shopify'

export interface CartLineInput {
  handle: string
  quantity: number
}

export interface PricedLine {
  handle: string
  variantId: string
  title: string
  quantity: number
  unitPrice: string
}

export interface PricedCart {
  lines: PricedLine[]
  total: number
  currency: Currency
}

export async function priceCart(lines: CartLineInput[], country: Country): Promise<PricedCart> {
  if (!lines || lines.length === 0) {
    throw new Error('Cart is empty')
  }
  const currency = currencyForCountry(country)
  const priced: PricedLine[] = []
  let total = 0
  for (const line of lines) {
    const qty = Math.max(1, Math.floor(line.quantity))
    const product = await getShopifyProduct(line.handle, country)
    if (!product || !product.availableForSale || !product.variantId) {
      throw new Error(`Unavailable product: ${line.handle}`)
    }
    const unit = Number(product.price.amount)
    total += unit * qty
    priced.push({
      handle: product.handle,
      variantId: product.variantId,
      title: product.title,
      quantity: qty,
      unitPrice: product.price.amount,
    })
  }
  return { lines: priced, total: Math.round(total * 100) / 100, currency }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- pricing` → PASS (4 tests). `npx tsc --noEmit` → exit 0.

> Note: `currencyForCountry` and types `Country`/`Currency` already exist in `lib/currency.ts` (verified). If the import path `./../lib/currency` errors, use `../lib/currency`.

- [ ] **Step 5: Commit**
```bash
git add data/pricing.ts tests/pricing.test.ts
git -c commit.gpgsign=false commit -m "feat: server-side cart pricing (source of truth)"
```

---

## Task 4: Stripe server client + PaymentIntent route

**Files:** Create `lib/stripe.ts`, `app/api/checkout/intent/route.ts`; Test `tests/checkout-intent.test.ts`

- [ ] **Step 1: Write `lib/stripe.ts`**

```ts
import Stripe from 'stripe'

let cached: Stripe | null = null

export function getStripe(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  cached = new Stripe(key)
  return cached
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/checkout-intent.test.ts`:
```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- checkout-intent`
Expected: FAIL — cannot find module `../app/api/checkout/intent/route`.

- [ ] **Step 4: Write `app/api/checkout/intent/route.ts`**

```ts
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
    // Pricing/validation errors are client faults → 400; anything else → 502.
    const status = /empty|Unavailable/.test(message) ? 400 : 502
    if (status === 502) console.error('checkout intent failed', error)
    return Response.json({ error: message }, { status })
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- checkout-intent` → PASS (2 tests). `npx tsc --noEmit` → exit 0.

- [ ] **Step 6: Commit**
```bash
git add lib/stripe.ts app/api/checkout/intent/route.ts tests/checkout-intent.test.ts
git -c commit.gpgsign=false commit -m "feat: Stripe client + checkout PaymentIntent route"
```

---

## Task 5: Shopify Admin order creation

**Files:** Create `data/shopify-admin.ts`; Test `tests/shopify-admin.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/shopify-admin.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- shopify-admin`
Expected: FAIL — cannot find module `../data/shopify-admin`.

- [ ] **Step 3: Write `data/shopify-admin.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- shopify-admin` → PASS (4 tests). `npx tsc --noEmit` → exit 0.

> Note: the exact `orderCreate` input shape (`OrderCreateOrderInput`, `financialStatus`) targets Admin API 2025-01. If the deploy-time Admin API rejects a field, adjust the mutation variables there; the test pins the line-item + tag mapping, which is the stable contract.

- [ ] **Step 5: Commit**
```bash
git add data/shopify-admin.ts tests/shopify-admin.test.ts
git -c commit.gpgsign=false commit -m "feat: create paid Shopify order via Admin API (DSers bridge)"
```

---

## Task 6: Stripe webhook route

**Files:** Create `app/api/webhooks/stripe/route.ts`; Test `tests/stripe-webhook.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/stripe-webhook.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- stripe-webhook`
Expected: FAIL — cannot find module `../app/api/webhooks/stripe/route`.

- [ ] **Step 3: Write `app/api/webhooks/stripe/route.ts`**

```ts
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
    const addr = pi.shipping?.address ?? {}
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- stripe-webhook` → PASS (5 tests). `npx tsc --noEmit` → exit 0.

- [ ] **Step 5: Commit**
```bash
git add app/api/webhooks/stripe/route.ts tests/stripe-webhook.test.ts
git -c commit.gpgsign=false commit -m "feat: Stripe webhook creates paid Shopify order (idempotent)"
```

---

## Task 7: Cart context (client state)

**Files:** Create `components/CartContext.tsx`; Test `tests/CartContext.dom.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/CartContext.dom.test.tsx`:
```tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { CartProvider, useCart } from '../components/CartContext'

afterEach(() => cleanup())
beforeEach(() => localStorage.clear())

function Probe() {
  const c = useCart()
  return (
    <div>
      <span data-testid="count">{c.count}</span>
      <span data-testid="open">{String(c.isOpen)}</span>
      <button onClick={() => c.addItem('nebula')}>add</button>
      <button onClick={() => c.updateQty('nebula', 3)}>set3</button>
      <button onClick={() => c.removeItem('nebula')}>rm</button>
    </div>
  )
}

const setup = () => render(<CartProvider><Probe /></CartProvider>)

describe('CartContext', () => {
  it('adds an item, increments count, and opens the drawer', () => {
    setup()
    act(() => { screen.getByText('add').click() })
    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('open').textContent).toBe('true')
  })

  it('updates quantity and removes', () => {
    setup()
    act(() => { screen.getByText('add').click() })
    act(() => { screen.getByText('set3').click() })
    expect(screen.getByTestId('count').textContent).toBe('3')
    act(() => { screen.getByText('rm').click() })
    expect(screen.getByTestId('count').textContent).toBe('0')
  })

  it('persists lines to localStorage', () => {
    setup()
    act(() => { screen.getByText('add').click() })
    expect(localStorage.getItem('eg-cart')).toContain('nebula')
  })

  it('throws when useCart is used outside the provider', () => {
    expect(() => render(<Probe />)).toThrow(/CartProvider/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- CartContext`
Expected: FAIL — cannot find module `../components/CartContext`.

- [ ] **Step 3: Write `components/CartContext.tsx`**

```tsx
'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface CartLine {
  handle: string
  quantity: number
}

interface CartState {
  lines: CartLine[]
  count: number
  isOpen: boolean
  addItem(handle: string): void
  updateQty(handle: string, quantity: number): void
  removeItem(handle: string): void
  clear(): void
  open(): void
  close(): void
}

const Ctx = createContext<CartState | null>(null)
const KEY = 'eg-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setLines(JSON.parse(raw))
    } catch {
      // ignore malformed storage
    }
  }, [])

  function persist(next: CartLine[]) {
    setLines(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // ignore quota / unavailable storage
    }
  }

  function addItem(handle: string) {
    const existing = lines.find((l) => l.handle === handle)
    persist(
      existing
        ? lines.map((l) => (l.handle === handle ? { ...l, quantity: l.quantity + 1 } : l))
        : [...lines, { handle, quantity: 1 }],
    )
    setIsOpen(true)
  }

  function updateQty(handle: string, quantity: number) {
    if (quantity <= 0) return removeItem(handle)
    persist(lines.map((l) => (l.handle === handle ? { ...l, quantity } : l)))
  }

  function removeItem(handle: string) {
    persist(lines.filter((l) => l.handle !== handle))
  }

  function clear() {
    persist([])
  }

  const count = lines.reduce((n, l) => n + l.quantity, 0)

  return (
    <Ctx.Provider
      value={{ lines, count, isOpen, addItem, updateQty, removeItem, clear, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useCart(): CartState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- CartContext` → PASS (4 tests). `npx tsc --noEmit` → exit 0.

- [ ] **Step 5: Commit**
```bash
git add components/CartContext.tsx tests/CartContext.dom.test.tsx
git -c commit.gpgsign=false commit -m "feat: client cart context with localStorage persistence"
```

---

## Task 8: AddToCartButton + CartButton

**Files:** Create `components/AddToCartButton.tsx` (+ `.module.css`), `components/CartButton.tsx` (+ `.module.css`); Test `tests/cart-buttons.dom.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/cart-buttons.dom.test.tsx`:
```tsx
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { CartProvider } from '../components/CartContext'
import { AddToCartButton } from '../components/AddToCartButton'
import { CartButton } from '../components/CartButton'

afterEach(() => cleanup())
beforeEach(() => localStorage.clear())

const wrap = (ui: React.ReactNode) => render(<CartProvider>{ui}</CartProvider>)

describe('AddToCartButton', () => {
  it('is disabled when unavailable', () => {
    wrap(<AddToCartButton handle="nebula" available={false} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
  it('adds to cart and updates the header count', () => {
    wrap(<><AddToCartButton handle="nebula" available={true} /><CartButton /></>)
    act(() => { screen.getByRole('button', { name: /panier/i }) }) // ensure rendered
    act(() => { screen.getByText(/ajouter au panier/i).click() })
    expect(screen.getByLabelText(/panier/i).textContent).toContain('1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- cart-buttons`
Expected: FAIL — cannot find module `../components/AddToCartButton`.

- [ ] **Step 3: Write `components/AddToCartButton.module.css`**

```css
.button {
  flex: 1;
  text-align: center;
  background: var(--eg-gold);
  color: var(--eg-black);
  border: none;
  padding: 13px;
  font-size: 0.7rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 600;
  border-radius: 2px;
  cursor: pointer;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 4: Write `components/AddToCartButton.tsx`**

```tsx
'use client'
import { useCart } from './CartContext'
import styles from './AddToCartButton.module.css'

export function AddToCartButton({ handle, available }: { handle: string; available: boolean }) {
  const { addItem } = useCart()
  return (
    <button
      type="button"
      className={styles.button}
      disabled={!available}
      aria-label="Ajouter au panier"
      onClick={() => addItem(handle)}
    >
      Ajouter au panier
    </button>
  )
}
```

- [ ] **Step 5: Write `components/CartButton.module.css`**

```css
.button {
  position: relative;
  background: none;
  border: none;
  color: var(--eg-cream);
  cursor: pointer;
  font-size: 1rem;
}

.badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: var(--eg-gold);
  color: var(--eg-black);
  font-size: 0.6rem;
  min-width: 15px;
  height: 15px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
}
```

- [ ] **Step 6: Write `components/CartButton.tsx`**

```tsx
'use client'
import { useCart } from './CartContext'
import styles from './CartButton.module.css'

export function CartButton() {
  const { count, open } = useCart()
  return (
    <button type="button" className={styles.button} aria-label={`Panier (${count})`} onClick={open}>
      🛒
      {count > 0 && <span className={styles.badge}>{count}</span>}
    </button>
  )
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test -- cart-buttons` → PASS (2 tests). `npx tsc --noEmit` → exit 0.

- [ ] **Step 8: Commit**
```bash
git add components/AddToCartButton.tsx components/AddToCartButton.module.css components/CartButton.tsx components/CartButton.module.css tests/cart-buttons.dom.test.tsx
git -c commit.gpgsign=false commit -m "feat: AddToCartButton and CartButton with count badge"
```

---

## Task 9: CartDrawer

**Files:** Create `components/CartDrawer.tsx` (+ `.module.css`); Test `tests/CartDrawer.dom.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/CartDrawer.dom.test.tsx`:
```tsx
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { CartProvider, useCart } from '../components/CartContext'
import { CartDrawer } from '../components/CartDrawer'

afterEach(() => cleanup())
beforeEach(() => localStorage.clear())

function Seed({ handle }: { handle: string }) {
  const { addItem } = useCart()
  return <button onClick={() => addItem(handle)}>seed</button>
}

describe('CartDrawer', () => {
  it('shows the empty state when there are no lines', () => {
    render(<CartProvider><CartDrawer lang="fr" /></CartProvider>)
    expect(screen.getByText(/votre panier est vide/i)).toBeInTheDocument()
  })

  it('lists a line after adding and shows the checkout link', () => {
    render(<CartProvider><Seed handle="nebula" /><CartDrawer lang="fr" /></CartProvider>)
    act(() => { screen.getByText('seed').click() })
    expect(screen.getByText('nebula')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /paiement/i })).toHaveAttribute('href', '/fr/checkout')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- CartDrawer`
Expected: FAIL — cannot find module `../components/CartDrawer`.

- [ ] **Step 3: Write `components/CartDrawer.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 40;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(380px, 90vw);
  background: var(--eg-black);
  border-left: 1px solid var(--eg-line);
  z-index: 41;
  display: flex;
  flex-direction: column;
  padding: var(--eg-s3);
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.drawer[data-open='true'] {
  transform: none;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--eg-serif);
  text-transform: uppercase;
  letter-spacing: var(--eg-track);
  border-bottom: 1px solid var(--eg-line);
  padding-bottom: var(--eg-s2);
}

.close {
  background: none;
  border: none;
  color: var(--eg-muted);
  cursor: pointer;
  font-size: 1.2rem;
}

.lines {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--eg-s3);
  padding: var(--eg-s3) 0;
}

.line {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: var(--eg-s2);
  align-items: center;
}

.name {
  font-family: var(--eg-serif);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.85rem;
}

.stepper {
  display: flex;
  align-items: center;
  gap: var(--eg-s2);
  margin-top: var(--eg-s1);
}

.stepper button {
  background: none;
  border: 1px solid var(--eg-line);
  color: var(--eg-cream);
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.remove {
  background: none;
  border: none;
  color: var(--eg-muted);
  cursor: pointer;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: var(--eg-s1);
}

.checkout {
  display: block;
  text-align: center;
  background: var(--eg-gold);
  color: var(--eg-black);
  padding: 14px;
  font-size: 0.7rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 600;
  border-radius: 2px;
}

.checkout[aria-disabled='true'] {
  opacity: 0.5;
  pointer-events: none;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--eg-muted);
  font-size: 0.85rem;
}

@media (prefers-reduced-motion: reduce) {
  .drawer {
    transition: none;
  }
}
```

- [ ] **Step 4: Write `components/CartDrawer.tsx`**

```tsx
'use client'
import Link from 'next/link'
import type { Lang } from '../data/types'
import { useCart } from './CartContext'
import styles from './CartDrawer.module.css'

export function CartDrawer({ lang }: { lang: Lang }) {
  const { lines, isOpen, close, updateQty, removeItem } = useCart()
  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={close} aria-hidden="true" />}
      <aside className={styles.drawer} data-open={isOpen} aria-label="Panier" aria-hidden={!isOpen}>
        <div className={styles.head}>
          <span>Panier</span>
          <button type="button" className={styles.close} aria-label="Fermer" onClick={close}>
            ✕
          </button>
        </div>

        {lines.length === 0 ? (
          <p className={styles.empty}>Votre panier est vide</p>
        ) : (
          <div className={styles.lines}>
            {lines.map((l) => (
              <div key={l.handle} className={styles.line}>
                <div />
                <div>
                  <p className={styles.name}>{l.handle}</p>
                  <div className={styles.stepper}>
                    <button type="button" aria-label="Diminuer" onClick={() => updateQty(l.handle, l.quantity - 1)}>−</button>
                    <span>{l.quantity}</span>
                    <button type="button" aria-label="Augmenter" onClick={() => updateQty(l.handle, l.quantity + 1)}>+</button>
                  </div>
                  <button type="button" className={styles.remove} onClick={() => removeItem(l.handle)}>
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Link
          href={`/${lang}/checkout`}
          className={styles.checkout}
          aria-disabled={lines.length === 0}
          onClick={close}
        >
          Passer au paiement
        </Link>
      </aside>
    </>
  )
}
```

> Note: line display uses the `handle` as label and omits the image to avoid a per-line Shopify fetch in the drawer (the catalogue already shows imagery). The design sub-project's `SunglassImage` can be wired in a later polish pass; out of scope here.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- CartDrawer` → PASS (2 tests). `npx tsc --noEmit` → exit 0.

- [ ] **Step 6: Commit**
```bash
git add components/CartDrawer.tsx components/CartDrawer.module.css tests/CartDrawer.dom.test.tsx
git -c commit.gpgsign=false commit -m "feat: cart drawer with steppers and checkout link"
```

---

## Task 10: Wire cart into layout, header, product page

**Files:** Modify `app/[lang]/layout.tsx`, `components/Header.tsx`, `app/[lang]/[collection]/[product]/page.tsx`

- [ ] **Step 1: Mount provider + drawer in `app/[lang]/layout.tsx`**

The current layout wraps children in `<CurrencyProvider>` with `<Header/>`/`<main>`/`<Footer/>`. Add the cart imports and nest `<CartProvider>` inside `<CurrencyProvider>`, and render `<CartDrawer lang={lang}/>` after `<Footer/>`. New file content:

```tsx
import { notFound } from 'next/navigation'
import { LANGS } from '../../data/types'
import { isLang } from '../../lib/i18n'
import { CurrencyProvider } from '../../components/CurrencyContext'
import { CartProvider } from '../../components/CartContext'
import { CartDrawer } from '../../components/CartDrawer'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

export const revalidate = 3600

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }))
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  return (
    <CurrencyProvider>
      <CartProvider>
        <Header lang={lang} />
        <main lang={lang}>{children}</main>
        <Footer lang={lang} />
        <CartDrawer lang={lang} />
      </CartProvider>
    </CurrencyProvider>
  )
}
```

> Confirm against the current file first: keep whatever `isLang` guard / `generateStaticParams` / `revalidate` it already has; the only changes are adding `CartProvider`, `CartDrawer`, and the two imports. Do NOT reintroduce a server `cookies()` read (kept client-side for static rendering).

- [ ] **Step 2: Swap the cart stub in `components/Header.tsx`**

Replace the disabled cart `<button>` with `<CartButton/>`. Add `import { CartButton } from './CartButton'`. The cart button replaces this current markup:
```tsx
        <button type="button" aria-label="Panier" disabled className={styles.cart}>
          🛒
        </button>
```
becomes:
```tsx
        <CartButton />
```
(Leave the rest of `Header.tsx` — brand, nav, LangSwitcher, CurrencySelector — unchanged. The `styles.cart` rule can stay unused or be removed; leaving it is fine.)

- [ ] **Step 3: Swap the cart stub in the product page**

In `app/[lang]/[collection]/[product]/page.tsx`, replace the disabled button in the sticky bar. Add `import { AddToCartButton } from '../../../../components/AddToCartButton'`. This current markup:
```tsx
        <button type="button" className={styles.buy} disabled aria-label="Ajouter au panier">
          Ajouter au panier
        </button>
```
becomes:
```tsx
        <AddToCartButton handle={model.handle} available={shopify?.availableForSale ?? false} />
```
(Keep the `Price` / "Bientôt disponible" conditional exactly as is.)

- [ ] **Step 4: Verify**

Run: `npm run test -- Header` → existing Header test still passes (it wraps in `CurrencyProvider`; the Header now also renders `<CartButton/>` which calls `useCart` — so the existing `Header.dom.test.tsx` must ALSO wrap in `CartProvider`). Update `tests/Header.dom.test.tsx` to wrap the rendered `<Header/>` in `<CartProvider>` (inside the existing `<CurrencyProvider>`); add the import `import { CartProvider } from '../components/CartContext'`. Re-run `npm run test -- Header` → PASS.

Then run `npx tsc --noEmit` → exit 0 and `npm run test` (full suite) → all pass.

- [ ] **Step 5: Commit**
```bash
git add "app/[lang]/layout.tsx" components/Header.tsx "app/[lang]/[collection]/[product]/page.tsx" tests/Header.dom.test.tsx
git -c commit.gpgsign=false commit -m "feat: wire cart provider, header button, and add-to-cart"
```

---

## Task 11: Checkout page + form

**Files:** Create `app/[lang]/checkout/page.tsx`, `components/CheckoutForm.tsx` (+ `.module.css`), `app/[lang]/checkout/checkout.module.css`; Test `tests/CheckoutForm.dom.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/CheckoutForm.dom.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { CartProvider, useCart } from '../components/CartContext'
import { CheckoutForm } from '../components/CheckoutForm'

afterEach(() => cleanup())
beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ clientSecret: 'cs_test' }) }))
})

function Seed() {
  const { addItem } = useCart()
  return <button onClick={() => addItem('nebula')}>seed</button>
}

describe('CheckoutForm', () => {
  it('renders the address fields and a submit button', () => {
    render(<CartProvider><CheckoutForm lang="fr" /></CartProvider>)
    expect(screen.getByLabelText(/e-?mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/adresse/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /payer/i })).toBeInTheDocument()
  })

  it('shows the empty-cart notice when there are no lines', () => {
    render(<CartProvider><CheckoutForm lang="fr" /></CartProvider>)
    expect(screen.getByText(/panier (est )?vide/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- CheckoutForm`
Expected: FAIL — cannot find module `../components/CheckoutForm`.

- [ ] **Step 3: Write `components/CheckoutForm.module.css`**

```css
.form {
  display: flex;
  flex-direction: column;
  gap: var(--eg-s2);
  max-width: 480px;
  margin: 0 auto;
  padding: var(--eg-s4) var(--eg-s3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--eg-muted);
}

.field input,
.field select {
  background: transparent;
  border: 1px solid var(--eg-line);
  color: var(--eg-cream);
  padding: 10px;
  font-size: 0.9rem;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--eg-s2);
}

.pay {
  margin-top: var(--eg-s3);
  background: var(--eg-gold);
  color: var(--eg-black);
  border: none;
  padding: 14px;
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 600;
  border-radius: 2px;
  cursor: pointer;
}

.pay:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.shipping {
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: var(--eg-gold);
  text-transform: uppercase;
}

.error {
  color: #e88;
  font-size: 0.8rem;
}

.empty {
  text-align: center;
  color: var(--eg-muted);
  padding: var(--eg-s5) var(--eg-s3);
}
```

- [ ] **Step 4: Write `components/CheckoutForm.tsx`**

```tsx
'use client'
import { useState, type FormEvent } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { Lang } from '../data/types'
import { useCart } from './CartContext'
import { useCurrency } from './CurrencyContext'
import styles from './CheckoutForm.module.css'

export function CheckoutForm({ lang }: { lang: Lang }) {
  const { lines } = useCart()
  const { country } = useCurrency()
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (lines.length === 0) {
    return <p className={styles.empty}>Votre panier est vide.</p>
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Erreur de paiement')
      setSubmitting(false)
      return
    }
    const res = await fetch('/api/checkout/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines, country }),
    })
    if (!res.ok) {
      setError('Impossible de préparer le paiement.')
      setSubmitting(false)
      return
    }
    const { clientSecret } = await res.json()
    const { error: payError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: `${window.location.origin}/${lang}/checkout/confirmation` },
    })
    if (payError) {
      setError(payError.message ?? 'Le paiement a échoué.')
      setSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.field}>
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="firstName">Prénom</label>
          <input id="firstName" name="firstName" required autoComplete="given-name" />
        </div>
        <div className={styles.field}>
          <label htmlFor="lastName">Nom</label>
          <input id="lastName" name="lastName" required autoComplete="family-name" />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="address1">Adresse</label>
        <input id="address1" name="address1" required autoComplete="address-line1" />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="zip">Code postal</label>
          <input id="zip" name="zip" required autoComplete="postal-code" />
        </div>
        <div className={styles.field}>
          <label htmlFor="city">Ville</label>
          <input id="city" name="city" required autoComplete="address-level2" />
        </div>
      </div>
      <p className={styles.shipping}>Livraison offerte</p>
      <PaymentElement />
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.pay} disabled={!stripe || submitting}>
        {submitting ? 'Paiement…' : 'Payer'}
      </button>
    </form>
  )
}
```

> The address is collected here and rides on the Stripe PaymentIntent's `shipping` (set via `confirmPayment`'s `confirmParams`/Payment Element billing details) — but to keep the webhook's source of address simple, the address also reaches the order via the PaymentIntent `shipping` populated by Stripe from the Payment Element. For this MVP the form fields above are wired into `confirmPayment`'s `confirmParams.shipping`; extend `onSubmit` to pass `confirmParams: { return_url, shipping: { name, address: {...} } }` reading the form values. (Implementer: read the form values via `new FormData(e.currentTarget)` and include them in `confirmParams.shipping`.)

- [ ] **Step 5: Write `app/[lang]/checkout/checkout.module.css`**

```css
.page {
  min-height: 70vh;
}

.title {
  text-align: center;
  font-family: var(--eg-serif);
  text-transform: uppercase;
  letter-spacing: var(--eg-track);
  padding: var(--eg-s4) var(--eg-s3) 0;
}
```

- [ ] **Step 6: Write `app/[lang]/checkout/page.tsx`**

```tsx
'use client'
import { use } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { isLang } from '../../../lib/i18n'
import { CheckoutForm } from '../../../components/CheckoutForm'
import styles from './checkout.module.css'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

export default function CheckoutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params)
  const safeLang = isLang(lang) ? lang : 'fr'
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Paiement</h1>
      <Elements stripe={stripePromise} options={{ mode: 'payment', amount: 4990, currency: 'chf' }}>
        <CheckoutForm lang={safeLang} />
      </Elements>
    </section>
  )
}
```

> This page is a Client Component (`'use client'`) so it can host Stripe Elements; it is therefore not statically prerendered for content. Add `export const dynamic = 'force-dynamic'` is NOT needed for a client page, but to keep it out of `generateStaticParams` it simply has none. The `<Elements>` `amount` is a placeholder for the Element's initial render; the real charged amount comes from the server PaymentIntent. Add `<meta name="robots" content="noindex">` via a `export const metadata` is not available in a client component — instead create a sibling `app/[lang]/checkout/layout.tsx` (server) exporting `export const metadata = { robots: { index: false } }`.

- [ ] **Step 7: Create `app/[lang]/checkout/layout.tsx` (noindex)**

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test -- CheckoutForm` → PASS (2 tests). The test mocks `fetch`; `@stripe/react-stripe-js` hooks (`useStripe`/`useElements`) return null outside `<Elements>`, which is fine — the form still renders fields and the disabled Pay button. If the test environment errors importing `@stripe/react-stripe-js`, wrap the Stripe hook usage so it tolerates a null Stripe (already handled: `disabled={!stripe || submitting}`). Run `npx tsc --noEmit` → exit 0.

- [ ] **Step 9: Commit**
```bash
git add "app/[lang]/checkout/page.tsx" "app/[lang]/checkout/layout.tsx" "app/[lang]/checkout/checkout.module.css" components/CheckoutForm.tsx components/CheckoutForm.module.css tests/CheckoutForm.dom.test.tsx
git -c commit.gpgsign=false commit -m "feat: checkout page with address form and Stripe Payment Element"
```

---

## Task 12: Confirmation page

**Files:** Create `app/[lang]/checkout/confirmation/page.tsx`; Test `tests/Confirmation.dom.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/Confirmation.dom.test.tsx`:
```tsx
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CartProvider } from '../components/CartContext'
import { ConfirmationView } from '../app/[lang]/checkout/confirmation/page'

afterEach(() => cleanup())
beforeEach(() => localStorage.setItem('eg-cart', JSON.stringify([{ handle: 'nebula', quantity: 1 }])))

describe('ConfirmationView', () => {
  it('shows a thank-you message and clears the cart', () => {
    render(<CartProvider><ConfirmationView lang="fr" /></CartProvider>)
    expect(screen.getByText(/merci/i)).toBeInTheDocument()
    expect(localStorage.getItem('eg-cart')).toBe('[]')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- Confirmation`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write `app/[lang]/checkout/confirmation/page.tsx`**

```tsx
'use client'
import { use, useEffect } from 'react'
import Link from 'next/link'
import { isLang } from '../../../../lib/i18n'
import { useCart } from '../../../../components/CartContext'

export function ConfirmationView({ lang }: { lang: string }) {
  const { clear } = useCart()
  useEffect(() => {
    clear()
  }, [clear])
  return (
    <section style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--eg-serif)', textTransform: 'uppercase', letterSpacing: 'var(--eg-track)' }}>
        Merci
      </h1>
      <p style={{ color: 'var(--eg-muted)', marginTop: '1rem' }}>
        Votre commande est confirmée. Un e-mail de confirmation vous a été envoyé.
      </p>
      <Link
        href={`/${isLang(lang) ? lang : 'fr'}`}
        style={{ marginTop: '1.5rem', border: '1px solid var(--eg-gold)', color: 'var(--eg-gold)', padding: '12px 28px', fontSize: '0.7rem', letterSpacing: '0.24em', textTransform: 'uppercase' }}
      >
        Retour à l'accueil
      </Link>
    </section>
  )
}

export default function ConfirmationPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params)
  return <ConfirmationView lang={lang} />
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- Confirmation` → PASS (1 test). `npx tsc --noEmit` → exit 0.

- [ ] **Step 5: Commit**
```bash
git add "app/[lang]/checkout/confirmation/page.tsx" tests/Confirmation.dom.test.tsx
git -c commit.gpgsign=false commit -m "feat: order confirmation page clears the cart"
```

---

## Task 13: Full verification + docs

**Files:** Modify `eclipse-gold/README.md`

- [ ] **Step 1: Full suite + typecheck**

Run: `npx vitest run --no-file-parallelism` → all pass (65 prior + the new commerce suites). If a "Failed to start forks worker" flake appears, re-run once.
Run: `npx tsc --noEmit` → exit 0.

- [ ] **Step 2: Production build**

Run: `rm -rf .next && npm run build` → exit 0. In the route table confirm: the 36 catalogue pages remain `●` SSG; `/[lang]/checkout` and `/[lang]/checkout/confirmation` are dynamic (`ƒ`); `/api/checkout/intent` and `/api/webhooks/stripe` are dynamic. The build must succeed without real Stripe/Admin secrets (the routes only touch Stripe/Shopify at request time, not at build). If the checkout client page fails to prerender because `loadStripe` runs at module scope, confirm it's inside the client component (it is) — module-scope `loadStripe('')` with an empty key does not throw at build. Report the route table.

- [ ] **Step 3: Document in README**

Append to `eclipse-gold/README.md`:
```markdown
## Commerce (Stripe + Shopify/DSers)

- Cart is client-side (`components/CartContext.tsx`, localStorage `eg-cart`) holding `{handle, quantity}` only.
- Checkout (`/{lang}/checkout`) is a dynamic page using the Stripe **Payment Element** on our domain.
- `/api/checkout/intent` recomputes the amount server-side (`data/pricing.ts` → Shopify Storefront) and creates a Stripe PaymentIntent — the client price is never trusted.
- `/api/webhooks/stripe` verifies the signature and, on `payment_intent.succeeded`, creates a **paid Shopify order** via the Admin API (`data/shopify-admin.ts`), idempotent by PaymentIntent id. **DSers** detects that order and fulfils it on AliExpress.
- Shipping is free; the address is collected in the checkout form and attached to the PaymentIntent.
- Secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SHOPIFY_ADMIN_API_TOKEN`) are server-only; see `.env.example`.
- Catalogue pages stay statically prerendered; only checkout + the two API routes are dynamic.

> Operational note: monitor failed `payment_intent.succeeded` webhooks in production — a payment captured without a created Shopify order means DSers won't fulfil it. The webhook returns 500 on order-creation failure so Stripe retries automatically.
```

- [ ] **Step 4: Commit**
```bash
git add README.md
git -c commit.gpgsign=false commit -m "docs: document Stripe commerce + DSers bridge"
```

---

## Self-Review

**Spec coverage:**
- §1 architecture (Stripe + Admin/DSers bridge) → Tasks 4, 5, 6 ✓
- §2 data layer (`shopify.variantId`/`getProductVariantId`, `pricing.ts`, `lib/stripe.ts`, `shopify-admin.ts`, intent route, webhook route) → Tasks 2, 3, 4, 5, 6 ✓
- §3 cart client (`CartContext`, localStorage, handle+qty, server re-pricing) → Task 7 + pricing in Task 3 ✓
- §4 UI (CartButton, CartDrawer, AddToCartButton, CheckoutForm) → Tasks 8, 9, 11 ✓
- §5 checkout pages (dynamic checkout + confirmation, noindex) → Tasks 11, 12 ✓
- §6 errors/idempotence (server price, webhook idempotent by PI id, 500→retry, 400s) → Tasks 4, 6 ✓
- §7 security (server-only secrets, signature verify, server amount) → Tasks 1, 4, 6 ✓
- §8 rendering (catalogue SSG, checkout+api dynamic, noindex) → Tasks 11, 13 ✓
- §9 tests → every task is TDD ✓
- §10 env vars → Task 1 ✓

**Placeholder scan:** No TBD/TODO. Two implementer notes carry concrete guidance (Task 5 Admin API version caveat; Task 11 wiring the form address into `confirmParams.shipping` via `FormData` — explicit, not a placeholder). All code blocks are complete.

**Type consistency:** `CartLineInput`/`PricedLine`/`PricedCart` (pricing) ↔ intent route metadata `{v,q}` ↔ webhook parse ↔ `OrderInput.lines {variantId, quantity}` are consistent. `ShopifyProduct.variantId` added in Task 2 is consumed by `priceCart` in Task 3. `useCart()`/`CartProvider`/`CartLine {handle, quantity}` consistent across Tasks 7–12. `getStripe()`, `createPaidOrder`, `orderExistsForPayment` signatures match their call sites.

**Known follow-ons (not in this plan):** trust pages / CGV (sub-project E, often required to activate Stripe), i18n of the new hardcoded FR strings, drawer line imagery via `SunglassImage`, multi-variant products, promo codes.
