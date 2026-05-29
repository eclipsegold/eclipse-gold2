# Eclipse Gold — SEO Shell + Page Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the localized (fr/de/it) routing + SEO shell and render the home, collection, and 10 product pages on top of the existing data layer, with a sober design.

**Architecture:** Next.js 16 App Router. Per-language routes `/{lang}` (fr/de/it). Content pages are statically prerendered with classic ISR (`export const revalidate`); the geo-dependent price is a **client island** (`Price`) that reads a `eg-country` cookie set by middleware and fetches per-country amounts from an internal route handler. SEO via `generateMetadata` (canonical + hreflang) and JSON-LD builders; sitemaps via `generateSitemaps`.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Vitest + React Testing Library + jsdom, CSS Modules. Consumes the existing `data/` layer (`getModelBySlug`, `getAllModels`, `getShopifyProduct`).

**Decision (PPR):** Next 16's PPR mechanism is *Cache Components* (`cacheComponents: true`), which globally replaces `revalidate`/`dynamic` with `use cache`/`cacheLife`. That is a disproportionate repo-wide change for this sub-project, so per the spec's sanctioned fallback we implement the **client price island** with classic ISR. JSON-LD `Offer` currency uses the server-rendered default. Revisit Cache Components in a later sub-project if desired.

**Next 16 gotchas baked into this plan:** `params` is a `Promise` (`const { lang } = await params`); `cookies()`/`headers()` are async (`await cookies()`); `request.geo` was removed (read the `x-vercel-ip-country` header). All page/layout components that read params are `async`.

**Env:** add `NEXT_PUBLIC_SITE_URL=https://eclipsegold.com` to `.env.example` (used for canonical/sitemap absolute URLs).

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/i18n.ts` | `isLang`, `assertLang`, `LANGS` re-export, `COLLECTION_SLUG: Localized<string>`, `collectionSlugFor`/`langForCollectionSlug` |
| `lib/currency.ts` | `Country`, `currencyForCountry`, `currencyFor(lang, country)`, `formatPrice(amount, currency, lang)` |
| `lib/geo.ts` | `countryFromHeader(value)` — pure parse of `x-vercel-ip-country` with default |
| `lib/seo/metadata.ts` | `siteUrl`, `buildMetadata({lang, pathByLang, title, description})` → Next `Metadata` (canonical + hreflang + OG) |
| `lib/seo/jsonld.ts` | `organizationJsonLd`, `websiteJsonLd`, `productJsonLd`, `collectionJsonLd`, `breadcrumbJsonLd` |
| `middleware.ts` | redirect `/` → `/fr`; set `eg-country` cookie from header |
| `app/api/price/route.ts` | `GET ?handle&country` → `{ amount, currencyCode }` via `getShopifyProduct` |
| `components/JsonLd.tsx` | renders a `<script type="application/ld+json">` |
| `components/CurrencyContext.tsx` | client context: current country/currency from cookie + selector |
| `components/Price.tsx` | client island: shows default price, refetches on country change |
| `components/CurrencySelector.tsx`, `LangSwitcher.tsx` | client switchers |
| `components/Header.tsx`, `Footer.tsx` | shell |
| `components/ProductCard.tsx`, `CollectionGrid.tsx`, `ProductGallery.tsx`, `Breadcrumbs.tsx` | rendering units |
| `app/layout.tsx` | root: `<html>`, fonts, Organization+WebSite JSON-LD |
| `app/[lang]/layout.tsx` | validate lang, Header + Footer, `generateStaticParams` |
| `app/[lang]/page.tsx` | home / brand landing |
| `app/[lang]/[collection]/page.tsx` | collection hub |
| `app/[lang]/[collection]/[product]/page.tsx` | product page |
| `app/[lang]/not-found.tsx` | 404 |
| `app/sitemap.ts` | `generateSitemaps` (products / collection / static) |
| `app/robots.ts` | robots |

Tests mirror each module under `tests/`.

---

## Task 1: Split test environments (node logic + jsdom components)

**Files:**
- Modify: `vitest.config.ts`
- Create: `tests/setup-dom.ts`

- [ ] **Step 1: Install component-testing deps**

Run from `eclipse-gold/`:
```bash
npm install -D jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Create the jsdom setup file**

Create `tests/setup-dom.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Rewrite `vitest.config.ts` to use two projects**

Replace `eclipse-gold/vitest.config.ts` with:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/**/*.dom.test.tsx'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['tests/**/*.dom.test.tsx'],
          setupFiles: ['tests/setup-dom.ts'],
        },
      },
    ],
  },
})
```
Convention: logic tests are `*.test.ts` (node); component tests are `*.dom.test.tsx` (jsdom).

- [ ] **Step 4: Verify both projects run**

Run: `npm run test`
Expected: existing 26 tests still pass under the `node` project; `dom` project reports no files yet (acceptable).

- [ ] **Step 5: Commit**
```bash
git add vitest.config.ts tests/setup-dom.ts package.json package-lock.json
git commit -m "test: split vitest into node and jsdom projects"
```

---

## Task 2: i18n helpers + localized collection slug

**Files:**
- Create: `lib/i18n.ts`, `tests/i18n.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/i18n.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { isLang, COLLECTION_SLUG, collectionSlugFor, langForCollectionSlug } from '../lib/i18n'

describe('i18n', () => {
  it('recognises valid langs', () => {
    expect(isLang('fr')).toBe(true)
    expect(isLang('de')).toBe(true)
    expect(isLang('en')).toBe(false)
    expect(isLang(undefined)).toBe(false)
  })

  it('maps lang to its collection slug', () => {
    expect(collectionSlugFor('fr')).toBe(COLLECTION_SLUG.fr)
    expect(COLLECTION_SLUG.fr).toBe('lunettes-de-soleil-rimless-or')
  })

  it('reverse-maps a collection slug to its lang', () => {
    expect(langForCollectionSlug(COLLECTION_SLUG.de)).toBe('de')
    expect(langForCollectionSlug('unknown')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- i18n`
Expected: FAIL — cannot find module `../lib/i18n`.

- [ ] **Step 3: Write the implementation**

Create `lib/i18n.ts`:
```ts
import { LANGS, type Lang, type Localized } from '../data/types'

export { LANGS }
export type { Lang }

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value)
}

export const COLLECTION_SLUG: Localized<string> = {
  fr: 'lunettes-de-soleil-rimless-or',
  de: 'randlose-sonnenbrillen-gold',
  it: 'occhiali-da-sole-senza-montatura-oro',
}

export function collectionSlugFor(lang: Lang): string {
  return COLLECTION_SLUG[lang]
}

export function langForCollectionSlug(slug: string): Lang | undefined {
  return LANGS.find((l) => COLLECTION_SLUG[l] === slug)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- i18n`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**
```bash
git add lib/i18n.ts tests/i18n.test.ts
git commit -m "feat: add i18n helpers and localized collection slug"
```

---

## Task 3: Currency helpers

**Files:**
- Create: `lib/currency.ts`, `tests/currency.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/currency.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { currencyForCountry, currencyFor, formatPrice } from '../lib/currency'

describe('currency', () => {
  it('maps country to currency', () => {
    expect(currencyForCountry('CH')).toBe('CHF')
    expect(currencyForCountry('FR')).toBe('EUR')
    expect(currencyForCountry('BE')).toBe('EUR')
  })

  it('forces CHF for de/it regardless of country, geo-resolves for fr', () => {
    expect(currencyFor('de', 'FR')).toBe('CHF')
    expect(currencyFor('it', 'FR')).toBe('CHF')
    expect(currencyFor('fr', 'CH')).toBe('CHF')
    expect(currencyFor('fr', 'FR')).toBe('EUR')
  })

  it('formats a price with the right symbol and locale', () => {
    expect(formatPrice('49.90', 'CHF', 'fr')).toContain('49')
    expect(formatPrice('49.90', 'CHF', 'fr')).toMatch(/CHF/)
    expect(formatPrice('52.00', 'EUR', 'fr')).toMatch(/€|EUR/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- currency`
Expected: FAIL — cannot find module `../lib/currency`.

- [ ] **Step 3: Write the implementation**

Create `lib/currency.ts`:
```ts
import type { Lang } from '../data/types'

export type Country = 'CH' | 'FR' | (string & {})
export type Currency = 'CHF' | 'EUR'

export function currencyForCountry(country: Country): Currency {
  return country === 'CH' ? 'CHF' : 'EUR'
}

/** de/it target the Swiss audience (CHF); fr resolves by country. */
export function currencyFor(lang: Lang, country: Country): Currency {
  if (lang === 'de' || lang === 'it') return 'CHF'
  return currencyForCountry(country)
}

const INTL_LOCALE: Record<Lang, string> = { fr: 'fr-CH', de: 'de-CH', it: 'it-CH' }

export function formatPrice(amount: string, currency: Currency, lang: Lang): string {
  const value = Number(amount)
  return new Intl.NumberFormat(INTL_LOCALE[lang], {
    style: 'currency',
    currency,
  }).format(value)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- currency`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**
```bash
git add lib/currency.ts tests/currency.test.ts
git commit -m "feat: add currency resolution and formatting helpers"
```

---

## Task 4: Geo parsing helper

**Files:**
- Create: `lib/geo.ts`, `tests/geo.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/geo.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { countryFromHeader } from '../lib/geo'

describe('countryFromHeader', () => {
  it('returns the uppercased country code', () => {
    expect(countryFromHeader('ch')).toBe('CH')
    expect(countryFromHeader('FR')).toBe('FR')
  })

  it('falls back to CH when absent or empty', () => {
    expect(countryFromHeader(null)).toBe('CH')
    expect(countryFromHeader('')).toBe('CH')
    expect(countryFromHeader(undefined)).toBe('CH')
  })
})
```

(Default `CH` matches the base price 49.90 CHF reference.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- geo`
Expected: FAIL — cannot find module `../lib/geo`.

- [ ] **Step 3: Write the implementation**

Create `lib/geo.ts`:
```ts
import type { Country } from './currency'

export const DEFAULT_COUNTRY: Country = 'CH'

export function countryFromHeader(value: string | null | undefined): Country {
  if (!value) return DEFAULT_COUNTRY
  return value.toUpperCase()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- geo`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**
```bash
git add lib/geo.ts tests/geo.test.ts
git commit -m "feat: add geo country parsing helper"
```

---

## Task 5: SEO metadata builder

**Files:**
- Create: `lib/seo/metadata.ts`, `tests/metadata.test.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add the site URL env var**

Append to `eclipse-gold/.env.example`:
```bash
# Absolute base URL for canonical/sitemap (no trailing slash)
NEXT_PUBLIC_SITE_URL=https://eclipsegold.com
```

- [ ] **Step 2: Write the failing test**

Create `tests/metadata.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { buildMetadata } from '../lib/seo/metadata'

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://eclipsegold.com'
})

describe('buildMetadata', () => {
  const pathByLang = { fr: '/fr/x', de: '/de/x', it: '/it/x' }

  it('sets canonical to the current lang absolute URL', () => {
    const m = buildMetadata({ lang: 'fr', pathByLang, title: 'T', description: 'D' })
    expect(m.alternates?.canonical).toBe('https://eclipsegold.com/fr/x')
  })

  it('emits hreflang for all langs plus x-default → fr', () => {
    const m = buildMetadata({ lang: 'de', pathByLang, title: 'T', description: 'D' })
    const langs = m.alternates?.languages as Record<string, string>
    expect(langs['fr']).toBe('https://eclipsegold.com/fr/x')
    expect(langs['de']).toBe('https://eclipsegold.com/de/x')
    expect(langs['it']).toBe('https://eclipsegold.com/it/x')
    expect(langs['x-default']).toBe('https://eclipsegold.com/fr/x')
  })

  it('passes title and description through', () => {
    const m = buildMetadata({ lang: 'fr', pathByLang, title: 'T', description: 'D' })
    expect(m.title).toBe('T')
    expect(m.description).toBe('D')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- metadata`
Expected: FAIL — cannot find module `../lib/seo/metadata`.

- [ ] **Step 4: Write the implementation**

Create `lib/seo/metadata.ts`:
```ts
import type { Metadata } from 'next'
import { LANGS, type Lang, type Localized } from '../../data/types'

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eclipsegold.com'
}

export function abs(path: string): string {
  return `${siteUrl()}${path}`
}

export interface BuildMetadataArgs {
  lang: Lang
  pathByLang: Localized<string>
  title: string
  description: string
}

export function buildMetadata({ lang, pathByLang, title, description }: BuildMetadataArgs): Metadata {
  const languages: Record<string, string> = {}
  for (const l of LANGS) languages[l] = abs(pathByLang[l])
  languages['x-default'] = abs(pathByLang.fr)

  return {
    title,
    description,
    alternates: {
      canonical: abs(pathByLang[lang]),
      languages,
    },
    openGraph: {
      title,
      description,
      url: abs(pathByLang[lang]),
      type: 'website',
      locale: lang,
    },
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- metadata`
Expected: PASS — 3 tests.

- [ ] **Step 6: Commit**
```bash
git add lib/seo/metadata.ts tests/metadata.test.ts .env.example
git commit -m "feat: add SEO metadata builder with canonical and hreflang"
```

---

## Task 6: JSON-LD builders

**Files:**
- Create: `lib/seo/jsonld.ts`, `tests/jsonld.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/jsonld.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { productJsonLd, collectionJsonLd, organizationJsonLd, breadcrumbJsonLd } from '../lib/seo/jsonld'

describe('jsonld builders', () => {
  it('builds a Product with an Offer', () => {
    const ld = productJsonLd({
      name: 'NEBULA', description: 'D', url: 'https://eclipsegold.com/fr/c/nebula-or-femme',
      image: ['https://cdn/nebula.jpg'], price: '49.90', currency: 'CHF', availability: true,
    })
    expect(ld['@type']).toBe('Product')
    expect(ld.offers['@type']).toBe('Offer')
    expect(ld.offers.priceCurrency).toBe('CHF')
    expect(ld.offers.price).toBe('49.90')
    expect(ld.offers.availability).toBe('https://schema.org/InStock')
  })

  it('marks out-of-stock availability', () => {
    const ld = productJsonLd({
      name: 'X', description: 'D', url: 'u', image: [], price: '1', currency: 'EUR', availability: false,
    })
    expect(ld.offers.availability).toBe('https://schema.org/OutOfStock')
  })

  it('builds an ItemList for the collection', () => {
    const ld = collectionJsonLd([
      { name: 'A', url: 'https://x/a' },
      { name: 'B', url: 'https://x/b' },
    ])
    expect(ld['@type']).toBe('ItemList')
    expect(ld.itemListElement).toHaveLength(2)
    expect(ld.itemListElement[0].position).toBe(1)
  })

  it('builds Organization and Breadcrumb', () => {
    expect(organizationJsonLd()['@type']).toBe('Organization')
    const bc = breadcrumbJsonLd([{ name: 'Home', url: 'u1' }, { name: 'Coll', url: 'u2' }])
    expect(bc['@type']).toBe('BreadcrumbList')
    expect(bc.itemListElement[1].position).toBe(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- jsonld`
Expected: FAIL — cannot find module `../lib/seo/jsonld`.

- [ ] **Step 3: Write the implementation**

Create `lib/seo/jsonld.ts`:
```ts
import { siteUrl } from './metadata'

export interface ProductLdArgs {
  name: string
  description: string
  url: string
  image: string[]
  price: string
  currency: string
  availability: boolean
}

export function productJsonLd(a: ProductLdArgs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product' as const,
    name: a.name,
    description: a.description,
    url: a.url,
    image: a.image,
    brand: { '@type': 'Brand', name: 'Eclipse Gold' },
    offers: {
      '@type': 'Offer' as const,
      url: a.url,
      price: a.price,
      priceCurrency: a.currency,
      availability: a.availability
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  }
}

export function collectionJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList' as const,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem' as const,
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  }
}

export function breadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList' as const,
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem' as const,
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization' as const,
    name: 'Eclipse Gold',
    url: siteUrl(),
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite' as const,
    name: 'Eclipse Gold',
    url: siteUrl(),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- jsonld`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**
```bash
git add lib/seo/jsonld.ts tests/jsonld.test.ts
git commit -m "feat: add JSON-LD builders for product, collection, org"
```

---

## Task 7: Middleware (geo cookie + root redirect)

**Files:**
- Create: `middleware.ts`

> Middleware is integration-level; we keep its logic thin and delegate parsing to the already-tested `countryFromHeader`. No unit test (Next middleware isn't unit-testable without a harness); the pure helper it uses is covered in Task 4.

- [ ] **Step 1: Write the implementation**

Create `eclipse-gold/middleware.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server'
import { countryFromHeader } from './lib/geo'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect bare root to the default language.
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/fr'
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()
  if (!request.cookies.has('eg-country')) {
    const country = countryFromHeader(request.headers.get('x-vercel-ip-country'))
    response.cookies.set('eg-country', country, { path: '/', sameSite: 'lax' })
  }
  return response
}

export const config = {
  // Run on pages only, skip static assets and API.
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
```

- [ ] **Step 2: Verify it builds/type-checks**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**
```bash
git add middleware.ts
git commit -m "feat: add middleware for geo cookie and root redirect"
```

---

## Task 8: Price route handler

**Files:**
- Create: `app/api/price/route.ts`, `tests/price-route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/price-route.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/shopify', () => ({
  getShopifyProduct: vi.fn(),
}))
import { getShopifyProduct } from '../data/shopify'
import { GET } from '../app/api/price/route'

function req(url: string) {
  return new Request(url)
}

beforeEach(() => {
  vi.mocked(getShopifyProduct).mockReset()
})

describe('GET /api/price', () => {
  it('returns the price for a handle and country', async () => {
    vi.mocked(getShopifyProduct).mockResolvedValue({
      handle: 'nebula', title: 'NEBULA', availableForSale: true,
      price: { amount: '49.90', currencyCode: 'CHF' }, images: [],
    })
    const res = await GET(req('https://x/api/price?handle=nebula&country=CH'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ amount: '49.90', currencyCode: 'CHF', availableForSale: true })
    expect(getShopifyProduct).toHaveBeenCalledWith('nebula', 'CH')
  })

  it('400s when handle is missing', async () => {
    const res = await GET(req('https://x/api/price?country=CH'))
    expect(res.status).toBe(400)
  })

  it('404s when the product is not found', async () => {
    vi.mocked(getShopifyProduct).mockResolvedValue(null)
    const res = await GET(req('https://x/api/price?handle=ghost&country=FR'))
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- price-route`
Expected: FAIL — cannot find module `../app/api/price/route`.

- [ ] **Step 3: Write the implementation**

Create `app/api/price/route.ts`:
```ts
import { getShopifyProduct } from '../../../data/shopify'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const handle = searchParams.get('handle')
  const country = (searchParams.get('country') ?? 'CH') as 'CH' | 'FR'
  if (!handle) {
    return Response.json({ error: 'missing handle' }, { status: 400 })
  }
  const product = await getShopifyProduct(handle, country)
  if (!product) {
    return Response.json({ error: 'not found' }, { status: 404 })
  }
  return Response.json({
    amount: product.price.amount,
    currencyCode: product.price.currencyCode,
    availableForSale: product.availableForSale,
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- price-route`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**
```bash
git add app/api/price/route.ts tests/price-route.test.ts
git commit -m "feat: add price route handler joining Shopify by handle"
```

---

## Task 9: Currency context + Price island + selector

**Files:**
- Create: `components/CurrencyContext.tsx`, `components/Price.tsx`, `components/CurrencySelector.tsx`
- Test: `tests/Price.dom.test.tsx`

- [ ] **Step 1: Write the failing component test**

Create `tests/Price.dom.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CurrencyProvider } from '../components/CurrencyContext'
import { Price } from '../components/Price'

describe('Price', () => {
  it('renders the server default price immediately', () => {
    render(
      <CurrencyProvider initialCountry="CH">
        <Price handle="nebula" lang="fr" defaultAmount="49.90" defaultCurrency="CHF" />
      </CurrencyProvider>,
    )
    expect(screen.getByText(/49/)).toBeInTheDocument()
    expect(screen.getByText(/CHF/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- Price`
Expected: FAIL — cannot find module `../components/CurrencyContext`.

- [ ] **Step 3: Write `CurrencyContext.tsx`**

Create `components/CurrencyContext.tsx`:
```tsx
'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Country } from '../lib/currency'

interface CurrencyState {
  country: Country
  setCountry: (c: Country) => void
}

const Ctx = createContext<CurrencyState | null>(null)

export function CurrencyProvider({
  initialCountry,
  children,
}: {
  initialCountry: Country
  children: ReactNode
}) {
  const [country, setCountryState] = useState<Country>(initialCountry)
  function setCountry(c: Country) {
    document.cookie = `eg-country=${c}; path=/; max-age=31536000; samesite=lax`
    setCountryState(c)
  }
  return <Ctx.Provider value={{ country, setCountry }}>{children}</Ctx.Provider>
}

export function useCurrency(): CurrencyState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
```

- [ ] **Step 4: Write `Price.tsx`**

Create `components/Price.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import type { Lang } from '../data/types'
import { currencyFor, formatPrice, type Currency } from '../lib/currency'
import { useCurrency } from './CurrencyContext'

export function Price({
  handle,
  lang,
  defaultAmount,
  defaultCurrency,
}: {
  handle: string
  lang: Lang
  defaultAmount: string
  defaultCurrency: Currency
}) {
  const { country } = useCurrency()
  const [amount, setAmount] = useState(defaultAmount)
  const [currency, setCurrency] = useState<Currency>(defaultCurrency)

  useEffect(() => {
    const target = currencyFor(lang, country)
    if (target === defaultCurrency) {
      setAmount(defaultAmount)
      setCurrency(defaultCurrency)
      return
    }
    let active = true
    fetch(`/api/price?handle=${encodeURIComponent(handle)}&country=${country}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data) {
          setAmount(data.amount)
          setCurrency(data.currencyCode as Currency)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [country, lang, handle, defaultAmount, defaultCurrency])

  return <span className="price">{formatPrice(amount, currency, lang)}</span>
}
```

- [ ] **Step 5: Write `CurrencySelector.tsx`**

Create `components/CurrencySelector.tsx`:
```tsx
'use client'
import { useCurrency } from './CurrencyContext'

export function CurrencySelector() {
  const { country, setCountry } = useCurrency()
  return (
    <select
      aria-label="Devise"
      value={country === 'CH' ? 'CH' : 'FR'}
      onChange={(e) => setCountry(e.target.value)}
    >
      <option value="CH">CHF (Suisse)</option>
      <option value="FR">EUR (Europe)</option>
    </select>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- Price`
Expected: PASS — 1 test. Also run `npx tsc --noEmit` → exit 0.

- [ ] **Step 7: Commit**
```bash
git add components/CurrencyContext.tsx components/Price.tsx components/CurrencySelector.tsx tests/Price.dom.test.tsx
git commit -m "feat: add currency context, price island, and selector"
```

---

## Task 10: Presentational components (ProductCard, grid, gallery, breadcrumbs, JsonLd)

**Files:**
- Create: `components/JsonLd.tsx`, `components/ProductCard.tsx`, `components/CollectionGrid.tsx`, `components/ProductGallery.tsx`, `components/Breadcrumbs.tsx`
- Test: `tests/ProductCard.dom.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/ProductCard.dom.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductCard } from '../components/ProductCard'

describe('ProductCard', () => {
  it('renders the model name, tagline, and a link to its slug', () => {
    render(
      <ProductCard
        href="/fr/lunettes-de-soleil-rimless-or/nebula-or-femme"
        modelName="NEBULA"
        tagline="La courbe céleste"
        image={{ url: 'https://cdn/nebula.jpg', alt: 'NEBULA' }}
      />,
    )
    expect(screen.getByText('NEBULA')).toBeInTheDocument()
    expect(screen.getByText('La courbe céleste')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/fr/lunettes-de-soleil-rimless-or/nebula-or-femme',
    )
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'NEBULA')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ProductCard`
Expected: FAIL — cannot find module `../components/ProductCard`.

- [ ] **Step 3: Write `JsonLd.tsx`**

Create `components/JsonLd.tsx`:
```tsx
export function JsonLd({ data }: { data: object }) {
  // Standard Next.js JSON-LD injection. Escape `<` so a stray "</script>" in any
  // string can't break out of the script tag (defense-in-depth; our data is
  // controlled marketing copy, not user input).
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  )
}
```

- [ ] **Step 4: Write `ProductCard.tsx`**

Create `components/ProductCard.tsx`:
```tsx
import Link from 'next/link'

export function ProductCard({
  href,
  modelName,
  tagline,
  image,
}: {
  href: string
  modelName: string
  tagline: string
  image: { url: string; alt: string } | null
}) {
  return (
    <Link href={href} className="product-card">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt={image.alt} loading="lazy" width={400} height={400} />
      )}
      <h3>{modelName}</h3>
      <p>{tagline}</p>
    </Link>
  )
}
```
(Plain `<img>` is intentional for the sober pass; `next/image` optimization is deferred to the design sub-project.)

- [ ] **Step 5: Write `CollectionGrid.tsx`**

Create `components/CollectionGrid.tsx`:
```tsx
import type { ReactNode } from 'react'

export function CollectionGrid({ children }: { children: ReactNode }) {
  return <div className="collection-grid">{children}</div>
}
```

- [ ] **Step 6: Write `ProductGallery.tsx`**

Create `components/ProductGallery.tsx`:
```tsx
export function ProductGallery({ images }: { images: { url: string; alt: string }[] }) {
  if (images.length === 0) return null
  return (
    <div className="product-gallery">
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={img.url} alt={img.alt} width={800} height={800} />
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Write `Breadcrumbs.tsx`**

Create `components/Breadcrumbs.tsx`:
```tsx
import Link from 'next/link'

export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="breadcrumbs">
      {items.map((it, i) => (
        <span key={it.href}>
          {i > 0 && ' / '}
          <Link href={it.href}>{it.name}</Link>
        </span>
      ))}
    </nav>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test -- ProductCard`
Expected: PASS — 1 test. Run `npx tsc --noEmit` → exit 0.

- [ ] **Step 9: Commit**
```bash
git add components/JsonLd.tsx components/ProductCard.tsx components/CollectionGrid.tsx components/ProductGallery.tsx components/Breadcrumbs.tsx tests/ProductCard.dom.test.tsx
git commit -m "feat: add presentational components"
```

---

## Task 11: Shell components (Header, Footer, LangSwitcher)

**Files:**
- Create: `components/Header.tsx`, `components/Footer.tsx`, `components/LangSwitcher.tsx`
- Test: `tests/Header.dom.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/Header.dom.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CurrencyProvider } from '../components/CurrencyContext'
import { Header } from '../components/Header'

describe('Header', () => {
  it('renders brand, a cart stub, and the collection link', () => {
    render(
      <CurrencyProvider initialCountry="CH">
        <Header lang="fr" />
      </CurrencyProvider>,
    )
    expect(screen.getByText('Eclipse Gold')).toBeInTheDocument()
    expect(screen.getByLabelText('Panier')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /collection/i })).toHaveAttribute(
      'href',
      '/fr/lunettes-de-soleil-rimless-or',
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- Header`
Expected: FAIL — cannot find module `../components/Header`.

- [ ] **Step 3: Write `LangSwitcher.tsx`**

Create `components/LangSwitcher.tsx`:
```tsx
import Link from 'next/link'
import { LANGS, type Lang } from '../data/types'

export function LangSwitcher({ current }: { current: Lang }) {
  return (
    <nav aria-label="Langue" className="lang-switcher">
      {LANGS.map((l) => (
        <Link key={l} href={`/${l}`} aria-current={l === current ? 'true' : undefined}>
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 4: Write `Header.tsx`**

Create `components/Header.tsx`:
```tsx
import Link from 'next/link'
import type { Lang } from '../data/types'
import { collectionSlugFor } from '../lib/i18n'
import { LangSwitcher } from './LangSwitcher'
import { CurrencySelector } from './CurrencySelector'

export function Header({ lang }: { lang: Lang }) {
  const collectionHref = `/${lang}/${collectionSlugFor(lang)}`
  return (
    <header className="site-header">
      <Link href={`/${lang}`} className="brand">
        Eclipse Gold
      </Link>
      <nav>
        <Link href={collectionHref}>Collection</Link>
      </nav>
      <div className="header-actions">
        <LangSwitcher current={lang} />
        <CurrencySelector />
        <button type="button" aria-label="Panier" disabled>
          🛒
        </button>
      </div>
    </header>
  )
}
```
(Cart button is a disabled stub — commerce is sub-project D.)

- [ ] **Step 5: Write `Footer.tsx`**

Create `components/Footer.tsx`:
```tsx
import Link from 'next/link'
import type { Lang } from '../data/types'

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="site-footer">
      <p>© Eclipse Gold</p>
      <nav aria-label="Liens légaux">
        {/* Trust pages are sub-project E — stubs for now */}
        <Link href={`/${lang}`}>Mentions légales</Link>
        <Link href={`/${lang}`}>Livraison &amp; retours</Link>
      </nav>
    </footer>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- Header`
Expected: PASS — 1 test. Run `npx tsc --noEmit` → exit 0.

- [ ] **Step 7: Commit**
```bash
git add components/Header.tsx components/Footer.tsx components/LangSwitcher.tsx tests/Header.dom.test.tsx
git commit -m "feat: add header, footer, and language switcher"
```

---

## Task 12: Root layout + [lang] layout + static params

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/[lang]/layout.tsx`, `app/[lang]/not-found.tsx`
- Test: `tests/lang-params.test.ts`

- [ ] **Step 1: Write the failing test for `generateStaticParams`**

Create `tests/lang-params.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { generateStaticParams } from '../app/[lang]/layout'

describe('[lang] generateStaticParams', () => {
  it('returns one entry per language', async () => {
    const params = await generateStaticParams()
    expect(params).toEqual([{ lang: 'fr' }, { lang: 'de' }, { lang: 'it' }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lang-params`
Expected: FAIL — cannot find module (or no export) `../app/[lang]/layout`.

- [ ] **Step 3: Rewrite the root `app/layout.tsx`**

Replace `app/layout.tsx` with:
```tsx
import type { Metadata } from 'next'
import './globals.css'
import { JsonLd } from '../components/JsonLd'
import { organizationJsonLd, websiteJsonLd } from '../lib/seo/jsonld'

export const metadata: Metadata = {
  title: { default: 'Eclipse Gold', template: '%s | Eclipse Gold' },
  description: 'Lunettes de soleil rimless or, inspirées des phénomènes astronomiques.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        {children}
      </body>
    </html>
  )
}
```
(The `<html lang>` is set per-language in the `[lang]` layout via the `lang` attribute below; we drop the boilerplate fonts to keep the sober pass minimal. Leave `globals.css` in place; its contents are restyled in the design sub-project.)

- [ ] **Step 4: Write `app/[lang]/layout.tsx`**

Create `app/[lang]/layout.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { LANGS } from '../../data/types'
import { isLang } from '../../lib/i18n'
import { countryFromHeader } from '../../lib/geo'
import { CurrencyProvider } from '../../components/CurrencyContext'
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

  const cookieStore = await cookies()
  const initialCountry = countryFromHeader(cookieStore.get('eg-country')?.value)

  return (
    <CurrencyProvider initialCountry={initialCountry}>
      <Header lang={lang} />
      <main lang={lang}>{children}</main>
      <Footer lang={lang} />
    </CurrencyProvider>
  )
}
```

- [ ] **Step 5: Write `app/[lang]/not-found.tsx`**

Create `app/[lang]/not-found.tsx`:
```tsx
export default function NotFound() {
  return (
    <section className="not-found">
      <h1>Page introuvable</h1>
      <p>Le modèle ou la page que vous cherchez n’existe pas.</p>
    </section>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- lang-params`
Expected: PASS — 1 test. Run `npx tsc --noEmit` → exit 0.

- [ ] **Step 7: Commit**
```bash
git add app/layout.tsx app/[lang]/layout.tsx app/[lang]/not-found.tsx tests/lang-params.test.ts
git commit -m "feat: add root and per-language layouts with static params"
```

---

## Task 13: Home page

**Files:**
- Create: `app/[lang]/page.tsx`
- Delete: `app/page.tsx`, `app/page.module.css` (replaced by `[lang]` routes)

- [ ] **Step 1: Remove the scaffold home and add the localized home**

Delete the scaffold pages:
```bash
git rm app/page.tsx app/page.module.css
```

Create `app/[lang]/page.tsx`:
```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLang } from '../../lib/i18n'
import { collectionSlugFor } from '../../lib/i18n'
import { collectionHub } from '../../data/collection'
import { buildMetadata } from '../../lib/seo/metadata'
import type { Lang } from '../../data/types'

function homePaths(): Record<Lang, string> {
  return { fr: '/fr', de: '/de', it: '/it' }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return buildMetadata({
    lang,
    pathByLang: homePaths(),
    title: collectionHub.seoTitle[lang],
    description: collectionHub.metaDescription[lang],
  })
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const collectionHref = `/${lang}/${collectionSlugFor(lang)}`
  return (
    <section className="home">
      <h1>Eclipse Gold</h1>
      <p>{collectionHub.intro[lang]}</p>
      <Link href={collectionHref} className="cta">
        Découvrir la collection
      </Link>
    </section>
  )
}
```

- [ ] **Step 2: Verify build/type-check**

Run: `npx tsc --noEmit`
Expected: exit 0. Run `npm run test` → all prior tests still pass.

- [ ] **Step 3: Commit**
```bash
git add app/[lang]/page.tsx
git commit -m "feat: add localized home page and remove scaffold page"
```

---

## Task 14: Collection page

**Files:**
- Create: `app/[lang]/[collection]/page.tsx`
- Test: `tests/collection-params.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/collection-params.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { generateStaticParams } from '../app/[lang]/[collection]/page'

describe('[collection] generateStaticParams', () => {
  it('returns the localized collection slug for each language', async () => {
    const params = await generateStaticParams()
    expect(params).toContainEqual({ lang: 'fr', collection: 'lunettes-de-soleil-rimless-or' })
    expect(params).toContainEqual({ lang: 'de', collection: 'randlose-sonnenbrillen-gold' })
    expect(params).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- collection-params`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

Create `app/[lang]/[collection]/page.tsx`:
```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LANGS, type Lang } from '../../../data/types'
import { isLang, collectionSlugFor, COLLECTION_SLUG } from '../../../lib/i18n'
import { getAllModels } from '../../../data/queries'
import { collectionHub } from '../../../data/collection'
import { buildMetadata, abs } from '../../../lib/seo/metadata'
import { collectionJsonLd, breadcrumbJsonLd } from '../../../lib/seo/jsonld'
import { JsonLd } from '../../../components/JsonLd'
import { CollectionGrid } from '../../../components/CollectionGrid'
import { ProductCard } from '../../../components/ProductCard'

export const revalidate = 3600

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang, collection: COLLECTION_SLUG[lang] }))
}

function collectionPaths(): Record<Lang, string> {
  return {
    fr: `/fr/${COLLECTION_SLUG.fr}`,
    de: `/de/${COLLECTION_SLUG.de}`,
    it: `/it/${COLLECTION_SLUG.it}`,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; collection: string }>
}): Promise<Metadata> {
  const { lang, collection } = await params
  if (!isLang(lang) || collection !== collectionSlugFor(lang)) return {}
  return buildMetadata({
    lang,
    pathByLang: collectionPaths(),
    title: collectionHub.seoTitle[lang],
    description: collectionHub.metaDescription[lang],
  })
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ lang: string; collection: string }>
}) {
  const { lang, collection } = await params
  if (!isLang(lang) || collection !== collectionSlugFor(lang)) notFound()

  const ordered = collectionHub.modelOrder
    .map((h) => getAllModels().find((m) => m.handle === h))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))

  const items = ordered.map((m) => ({
    name: m.modelName,
    url: abs(`/${lang}/${collectionSlugFor(lang)}/${m.slug[lang]}`),
  }))

  return (
    <section className="collection">
      <JsonLd data={collectionJsonLd(items)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Eclipse Gold', url: abs(`/${lang}`) },
          { name: collectionHub.seoTitle[lang], url: abs(`/${lang}/${collectionSlugFor(lang)}`) },
        ])}
      />
      <h1>{collectionHub.seoTitle[lang]}</h1>
      <p>{collectionHub.intro[lang]}</p>
      <CollectionGrid>
        {ordered.map((m) => (
          <ProductCard
            key={m.handle}
            href={`/${lang}/${collectionSlugFor(lang)}/${m.slug[lang]}`}
            modelName={m.modelName}
            tagline={m.tagline[lang]}
            image={null}
          />
        ))}
      </CollectionGrid>
    </section>
  )
}
```
(Cards omit images in the sober pass to avoid a Shopify fetch per card; the design sub-project adds imagery.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- collection-params`
Expected: PASS — 1 test. Run `npx tsc --noEmit` → exit 0.

- [ ] **Step 5: Commit**
```bash
git add app/[lang]/[collection]/page.tsx tests/collection-params.test.ts
git commit -m "feat: add collection page with ItemList JSON-LD"
```

---

## Task 15: Product page

**Files:**
- Create: `app/[lang]/[collection]/[product]/page.tsx`
- Test: `tests/product-params.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/product-params.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { generateStaticParams } from '../app/[lang]/[collection]/[product]/page'

describe('[product] generateStaticParams', () => {
  it('returns 3 langs × 10 products = 30 entries with localized slugs', async () => {
    const params = await generateStaticParams()
    expect(params).toHaveLength(30)
    expect(params).toContainEqual({
      lang: 'fr',
      collection: 'lunettes-de-soleil-rimless-or',
      product: 'nebula-or-femme',
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- product-params`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

Create `app/[lang]/[collection]/[product]/page.tsx`:
```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LANGS, type Lang } from '../../../../data/types'
import { isLang, collectionSlugFor, COLLECTION_SLUG } from '../../../../lib/i18n'
import { getAllModels, getModelBySlug } from '../../../../data/queries'
import { getShopifyProduct } from '../../../../data/shopify'
import { buildMetadata, abs } from '../../../../lib/seo/metadata'
import { productJsonLd, breadcrumbJsonLd } from '../../../../lib/seo/jsonld'
import { currencyFor } from '../../../../lib/currency'
import { DEFAULT_COUNTRY } from '../../../../lib/geo'
import { JsonLd } from '../../../../components/JsonLd'
import { ProductGallery } from '../../../../components/ProductGallery'
import { Breadcrumbs } from '../../../../components/Breadcrumbs'
import { Price } from '../../../../components/Price'

export const revalidate = 3600

export function generateStaticParams() {
  return LANGS.flatMap((lang) =>
    getAllModels().map((m) => ({
      lang,
      collection: COLLECTION_SLUG[lang],
      product: m.slug[lang],
    })),
  )
}

function productPaths(handle: string): Record<Lang, string> {
  const model = getAllModels().find((m) => m.handle === handle)!
  return {
    fr: `/fr/${COLLECTION_SLUG.fr}/${model.slug.fr}`,
    de: `/de/${COLLECTION_SLUG.de}/${model.slug.de}`,
    it: `/it/${COLLECTION_SLUG.it}/${model.slug.it}`,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; collection: string; product: string }>
}): Promise<Metadata> {
  const { lang, collection, product } = await params
  if (!isLang(lang) || collection !== collectionSlugFor(lang)) return {}
  const model = getModelBySlug(product, lang)
  if (!model) return {}
  return buildMetadata({
    lang,
    pathByLang: productPaths(model.handle),
    title: model.seoTitle[lang],
    description: model.metaDescription[lang],
  })
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; collection: string; product: string }>
}) {
  const { lang, collection, product } = await params
  if (!isLang(lang) || collection !== collectionSlugFor(lang)) notFound()
  const model = getModelBySlug(product, lang)
  if (!model) notFound()

  // ISR fetch for images/availability at the default market. May be null if
  // the handle has no matching Shopify product — render content regardless.
  const shopify = await getShopifyProduct(model.handle, DEFAULT_COUNTRY)
  const defaultCurrency = currencyFor(lang, DEFAULT_COUNTRY)
  const defaultAmount = shopify?.price.amount ?? '49.90'
  const images = shopify?.images.map((i) => ({ url: i.url, alt: i.altText ?? model.modelName })) ?? []
  const url = abs(`/${lang}/${collectionSlugFor(lang)}/${model.slug[lang]}`)

  return (
    <article className="product">
      <JsonLd
        data={productJsonLd({
          name: model.modelName,
          description: model.metaDescription[lang],
          url,
          image: images.map((i) => i.url),
          price: defaultAmount,
          currency: defaultCurrency,
          availability: shopify?.availableForSale ?? false,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Eclipse Gold', url: abs(`/${lang}`) },
          { name: 'Collection', url: abs(`/${lang}/${collectionSlugFor(lang)}`) },
          { name: model.modelName, url },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: 'Accueil', href: `/${lang}` },
          { name: 'Collection', href: `/${lang}/${collectionSlugFor(lang)}` },
          { name: model.modelName, href: `/${lang}/${collectionSlugFor(lang)}/${model.slug[lang]}` },
        ]}
      />
      <ProductGallery images={images} />
      <h1>{model.modelName}</h1>
      <p className="tagline">{model.tagline[lang]}</p>
      {shopify ? (
        <Price handle={model.handle} lang={lang} defaultAmount={defaultAmount} defaultCurrency={defaultCurrency} />
      ) : (
        <p className="price-unavailable">Bientôt disponible</p>
      )}
      <p>{model.intro[lang]}</p>
      <ul className="features">
        {model.features[lang].map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
    </article>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- product-params`
Expected: PASS — 1 test. Run `npx tsc --noEmit` → exit 0.

- [ ] **Step 5: Commit**
```bash
git add app/[lang]/[collection]/[product]/page.tsx tests/product-params.test.ts
git commit -m "feat: add product page with Product/Offer JSON-LD and price island"
```

---

## Task 16: Sitemaps + robots

**Files:**
- Create: `app/sitemap.ts`, `app/robots.ts`
- Test: `tests/sitemap.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/sitemap.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import sitemap, { generateSitemaps } from '../app/sitemap'

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://eclipsegold.com'
})

describe('sitemap', () => {
  it('declares product, collection, and static sitemap ids', async () => {
    const ids = await generateSitemaps()
    expect(ids).toEqual([{ id: 'products' }, { id: 'collection' }, { id: 'static' }])
  })

  it('product sitemap has 30 localized URLs (3 langs × 10)', async () => {
    const entries = await sitemap({ id: 'products' })
    expect(entries).toHaveLength(30)
    expect(entries[0].url).toMatch(/^https:\/\/eclipsegold\.com\/(fr|de|it)\//)
  })

  it('static sitemap has the 3 home URLs', async () => {
    const entries = await sitemap({ id: 'static' })
    expect(entries.map((e) => e.url)).toEqual([
      'https://eclipsegold.com/fr',
      'https://eclipsegold.com/de',
      'https://eclipsegold.com/it',
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- sitemap`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write `app/sitemap.ts`**

Create `app/sitemap.ts`:
```ts
import type { MetadataRoute } from 'next'
import { LANGS } from '../data/types'
import { getAllModels } from '../data/queries'
import { COLLECTION_SLUG } from '../lib/i18n'
import { abs } from '../lib/seo/metadata'

export async function generateSitemaps() {
  return [{ id: 'products' }, { id: 'collection' }, { id: 'static' }]
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  if (id === 'static') {
    return LANGS.map((lang) => ({ url: abs(`/${lang}`), changeFrequency: 'monthly', priority: 0.8 }))
  }
  if (id === 'collection') {
    return LANGS.map((lang) => ({
      url: abs(`/${lang}/${COLLECTION_SLUG[lang]}`),
      changeFrequency: 'weekly',
      priority: 0.9,
    }))
  }
  // products
  return LANGS.flatMap((lang) =>
    getAllModels().map((m) => ({
      url: abs(`/${lang}/${COLLECTION_SLUG[lang]}/${m.slug[lang]}`),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  )
}
```

- [ ] **Step 4: Write `app/robots.ts`**

Create `app/robots.ts`:
```ts
import type { MetadataRoute } from 'next'
import { siteUrl } from '../lib/seo/metadata'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- sitemap`
Expected: PASS — 3 tests. Run `npx tsc --noEmit` → exit 0.

- [ ] **Step 6: Commit**
```bash
git add app/sitemap.ts app/robots.ts tests/sitemap.test.ts
git commit -m "feat: add split sitemaps and robots"
```

---

## Task 17: Full build verification

**Files:**
- Modify: `eclipse-gold/README.md`

- [ ] **Step 1: Run the whole test suite**

Run: `npm run test`
Expected: all node + dom tests pass (26 prior + the new suites).

- [ ] **Step 2: Run the production build (validates routing, static params, prebuild gate)**

Run: `npm run build`
Expected: `prebuild` runs `✓ 10 models validated`, then `next build` completes. The build output should list the prerendered routes `/[lang]`, `/[lang]/[collection]`, `/[lang]/[collection]/[product]` (30 product pages), `sitemap`, and `robots`. If the build fails because `SHOPIFY_*` env vars are unset and a page fetch throws at build, confirm the product page tolerates a null/throwing fetch (Task 15 wraps the fetch result and renders "Bientôt disponible" on null; if `getShopifyProduct` *throws* on missing env during prerender, wrap the call site in a try/catch returning null and re-run). Report what happened.

- [ ] **Step 3: Document the routing in the README**

Append to `eclipse-gold/README.md`:
```markdown
## Routing & SEO (shell)

- Per-language routes: `/fr`, `/de`, `/it` (home), `/{lang}/{collectionSlug}` (collection), `/{lang}/{collectionSlug}/{productSlug}` (product).
- Currency: `eg-country` cookie set by `middleware.ts` from `x-vercel-ip-country`; the `Price` client island resolves CHF/EUR and refetches via `/api/price`.
- SEO: per-page canonical + hreflang (`lib/seo/metadata.ts`), JSON-LD (`lib/seo/jsonld.ts`), split sitemaps (`app/sitemap.ts`), robots (`app/robots.ts`).
- Content pages are statically prerendered with ISR (`export const revalidate = 3600`).
```

- [ ] **Step 4: Commit**
```bash
git add README.md
git commit -m "docs: document routing and SEO shell"
```

---

## Self-Review

**Spec coverage:**
- §2 architecture/file structure → Tasks 2–16 cover every file listed ✓
- §3 routing & i18n (generateStaticParams, lang validation, reuse data layer, pass `lang`) → Tasks 2, 12, 14, 15 ✓
- §4 geo/currency/price (middleware cookie, currency resolution, static content + ISR, client price island, selector) → Tasks 3, 4, 7, 8, 9, 15 ✓ (PPR→client-island fallback decision documented in header)
- §5 SEO output (generateMetadata canonical+hreflang, JSON-LD Product/ItemList/Breadcrumb/Org/WebSite, split sitemaps, robots) → Tasks 5, 6, 12, 14, 15, 16 ✓
- §6 data flow (getModelBySlug + getShopifyProduct join) → Task 15 ✓
- §7 sober components (Header w/ cart stub, Footer w/ legal stub, ProductCard, CollectionGrid, ProductGallery, Breadcrumbs, Price) → Tasks 9, 10, 11 ✓
- §8 error handling (notFound on invalid lang/slug, null Shopify → "Bientôt disponible", no 500) → Tasks 12, 14, 15 ✓
- §9 tests (unit i18n/currency/geo/metadata/jsonld; component ProductCard/Price/Header; integration generateStaticParams + metadata) → Tasks 1–16 ✓

**Placeholder scan:** No "TBD/TODO". Every code step shows complete code. The one conditional instruction (Task 17 Step 2 try/catch if build-time fetch throws) is a concrete, bounded contingency with the exact fix, not a placeholder.

**Type consistency:** `Lang`, `Localized`, `Currency`, `Country`, `ShopifyProduct` reused from existing modules. `currencyFor(lang, country)`, `formatPrice(amount, currency, lang)`, `countryFromHeader`, `buildMetadata({lang, pathByLang, title, description})`, `collectionSlugFor`, `COLLECTION_SLUG`, `productJsonLd`/`collectionJsonLd`/`breadcrumbJsonLd`/`organizationJsonLd`/`websiteJsonLd`, `useCurrency`/`CurrencyProvider`, `Price({handle, lang, defaultAmount, defaultCurrency})` — names/signatures match across all call sites (layouts, pages, sitemap, components).

**Known follow-ons (not in this plan):** premium design (C), commerce/variant IDs/cart (D), trust-page content (E), `next/image` optimization, DE/IT slug/keyword finalization.
