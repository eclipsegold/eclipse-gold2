# Eclipse Gold — Data & SEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the typed, validated data layer that drives Eclipse Gold's programmatic SEO — the 10 sunglass models, the collection hub, the Shopify Storefront join, and a build-time validation gate.

**Architecture:** Headless. Shopify is the source of truth for catalogue (price, stock, images, checkout) consumed via the Storefront API over `fetch`. Marketing/SEO data lives in versioned TypeScript (`data/`), joined to Shopify by product `handle`. A pure validation function gates the build against drift (duplicate slugs/keywords, missing translations, wrong model count).

**Tech Stack:** Next.js (App Router) · TypeScript · Vitest · Shopify Storefront API (2025-01, direct `fetch`). No Hydrogen (Remix-based; we use Next.js + Storefront API directly).

**Scope:** Data-layer foundation only. Page rendering, content authoring (DE/IT copy), sitemaps, and hreflang output are follow-on plans that depend on this one.

**Refinement vs spec:** The spec listed all helpers under `data/shopify.ts`. To keep one responsibility per file, pure in-memory lookups go in `data/queries.ts` and the Storefront API client stays in `data/shopify.ts`.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `vitest.config.ts`, `next.config.ts` | Project scaffold |
| `.env.example` | Documents required Shopify env vars |
| `data/types.ts` | `Lang`, `Localized<T>`, `Locale`, enums, `SunglassModel`, `CollectionHub`, locale helpers |
| `data/models.ts` | The 10 `SunglassModel` entries (Option A: localized fields inline) |
| `data/collection.ts` | The single `CollectionHub` object |
| `data/queries.ts` | Pure lookups: `getAllModels`, `getModelByHandle`, `getModelBySlug` |
| `data/shopify.ts` | Storefront API client: `getShopifyProduct(handle, country)` |
| `scripts/validate-models.ts` | Pure `validateModels()` + CLI runner wired into `prebuild` |
| `tests/` | Vitest unit tests mirroring each `data/` module |

---

## Task 1: Scaffold the Next.js + TypeScript + Vitest project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.env.example`, `.gitignore`

- [ ] **Step 1: Initialise git and the Next.js app scaffold**

Run from the project root (`/Users/farouksalam/Desktop/tinker-theme`):

```bash
git init
npx create-next-app@latest eclipse-gold --typescript --app --eslint --no-tailwind --no-src-dir --import-alias "@/*" --use-npm
```

When prompted for Turbopack, accept the default. This creates an `eclipse-gold/` subfolder so the existing Shopify theme files are not touched.

- [ ] **Step 2: Add Vitest and the Storefront types dev dependency**

Run:

```bash
cd eclipse-gold
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 3: Create `vitest.config.ts`**

Create `eclipse-gold/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Add the test and validate scripts to `package.json`**

In `eclipse-gold/package.json`, add to the `scripts` block:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "validate:models": "tsx scripts/validate-models.ts",
    "prebuild": "npm run validate:models"
  }
}
```

Then install the TS runner used by the script:

```bash
npm install -D tsx
```

- [ ] **Step 5: Create `.env.example`**

Create `eclipse-gold/.env.example`:

```bash
# Shopify Storefront API (headless)
SHOPIFY_STORE_DOMAIN=eclipse-gold.myshopify.com
SHOPIFY_STOREFRONT_API_TOKEN=shpat_xxx_public_storefront_token
SHOPIFY_STOREFRONT_API_VERSION=2025-01
```

- [ ] **Step 6: Verify the scaffold runs**

Run:

```bash
npm run test
```

Expected: Vitest runs and reports "No test files found" (exit 0 or the no-tests notice). This confirms the toolchain is wired.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Vitest project for Eclipse Gold"
```

---

## Task 2: Type foundations and locale helpers

**Files:**
- Create: `eclipse-gold/data/types.ts`
- Test: `eclipse-gold/tests/types.test.ts`

- [ ] **Step 1: Write the failing test**

Create `eclipse-gold/tests/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { LANGS, LOCALES, langFromLocale, currencyFromLocale } from '../data/types'

describe('locale helpers', () => {
  it('declares exactly three content languages', () => {
    expect(LANGS).toEqual(['fr', 'de', 'it'])
  })

  it('declares all five locales', () => {
    expect(LOCALES).toEqual(['fr-CH', 'de-CH', 'it-CH', 'fr-FR', 'fr'])
  })

  it('maps a locale to its content language', () => {
    expect(langFromLocale('de-CH')).toBe('de')
    expect(langFromLocale('it-CH')).toBe('it')
    expect(langFromLocale('fr-FR')).toBe('fr')
    expect(langFromLocale('fr')).toBe('fr')
  })

  it('derives currency from the market (CH=CHF, else EUR)', () => {
    expect(currencyFromLocale('fr-CH')).toBe('CHF')
    expect(currencyFromLocale('de-CH')).toBe('CHF')
    expect(currencyFromLocale('fr-FR')).toBe('EUR')
    expect(currencyFromLocale('fr')).toBe('EUR')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/types.test.ts`
Expected: FAIL — cannot find module `../data/types`.

- [ ] **Step 3: Write the implementation**

Create `eclipse-gold/data/types.ts`:

```ts
export const LANGS = ['fr', 'de', 'it'] as const
export type Lang = (typeof LANGS)[number]

/** Forces all three content languages to be present at compile time. */
export type Localized<T> = Record<Lang, T>

export const LOCALES = ['fr-CH', 'de-CH', 'it-CH', 'fr-FR', 'fr'] as const
export type Locale = (typeof LOCALES)[number]

export type Currency = 'CHF' | 'EUR'

export type Shape =
  | 'oversize' | 'aviator' | 'round' | 'rectangular' | 'square' | 'cat-eye'

export type Phenomenon =
  | 'totality' | 'heliacal' | 'nebula' | 'umbra' | 'zenith'
  | 'syzygy' | 'penumbra' | 'parhelion' | 'equinox' | 'chroma'

export type Audience = 'femme' | 'homme' | 'unisexe'

export interface SunglassModel {
  // Identity & Shopify join (shared, untranslated)
  handle: string
  modelName: string
  phenomenon: Phenomenon
  order: number
  featured: boolean
  // Physical attributes (shared)
  shape: Shape
  audience: Audience
  polarized: boolean
  lensTint: string
  // SEO & content (translated)
  slug: Localized<string>
  primaryKeyword: Localized<string>
  seoTitle: Localized<string>
  metaDescription: Localized<string>
  tagline: Localized<string>
  intro: Localized<string>
  features: Localized<string[]>
}

export interface CollectionHub {
  seoTitle: Localized<string>
  metaDescription: Localized<string>
  intro: Localized<string>
  modelOrder: string[]
}

export function langFromLocale(locale: Locale): Lang {
  if (locale.startsWith('de')) return 'de'
  if (locale.startsWith('it')) return 'it'
  return 'fr'
}

export function currencyFromLocale(locale: Locale): Currency {
  return locale.endsWith('CH') ? 'CHF' : 'EUR'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/types.test.ts`
Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add data/types.ts tests/types.test.ts
git commit -m "feat: add data types and locale/currency helpers"
```

---

## Task 3: Models data + pure lookups (one fully-worked model)

**Files:**
- Create: `eclipse-gold/data/models.ts`, `eclipse-gold/data/queries.ts`
- Test: `eclipse-gold/tests/queries.test.ts`

- [ ] **Step 1: Write the failing test**

Create `eclipse-gold/tests/queries.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getAllModels, getModelByHandle, getModelBySlug } from '../data/queries'

describe('model lookups', () => {
  it('returns the NEBULA model by handle', () => {
    const m = getModelByHandle('nebula')
    expect(m?.modelName).toBe('NEBULA')
    expect(m?.phenomenon).toBe('nebula')
  })

  it('resolves a model by its localized slug', () => {
    expect(getModelBySlug('nebula-or-femme', 'fr')?.handle).toBe('nebula')
    expect(getModelBySlug('nebula-gold-damen', 'de')?.handle).toBe('nebula')
  })

  it('returns undefined for an unknown handle', () => {
    expect(getModelByHandle('does-not-exist')).toBeUndefined()
  })

  it('exposes every model through getAllModels', () => {
    expect(getAllModels().some((m) => m.handle === 'nebula')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/queries.test.ts`
Expected: FAIL — cannot find module `../data/queries`.

- [ ] **Step 3: Create `data/models.ts` with the NEBULA model fully worked**

Create `eclipse-gold/data/models.ts`. NEBULA is the canonical template; the remaining nine are added in Task 6.

```ts
import type { SunglassModel } from './types'

export const models: SunglassModel[] = [
  {
    handle: 'nebula',
    modelName: 'NEBULA',
    phenomenon: 'nebula',
    order: 3,
    featured: true,
    shape: 'cat-eye',
    audience: 'femme',
    polarized: false,
    lensTint: 'gold-mirror',
    slug: {
      fr: 'nebula-or-femme',
      de: 'nebula-gold-damen',
      it: 'nebula-oro-donna',
    },
    primaryKeyword: {
      fr: 'lunettes sans monture femme or',
      de: 'randlose sonnenbrille damen gold',
      it: 'occhiali da sole senza montatura donna oro',
    },
    seoTitle: {
      fr: 'NEBULA — Lunettes solaires sans monture or pour femme | Eclipse Gold',
      de: 'NEBULA — Randlose Sonnenbrille Gold für Damen | Eclipse Gold',
      it: 'NEBULA — Occhiali da sole senza montatura oro da donna | Eclipse Gold',
    },
    metaDescription: {
      fr: 'NEBULA : lunettes de soleil rimless or au galbe cat-eye, pensées pour elle. Verres UV400, monture sans cerclage. Livraison Suisse & France.',
      de: 'NEBULA: randlose Sonnenbrille in Gold mit Cat-Eye-Form. UV400-Gläser, ohne Fassung. Lieferung in die Schweiz & nach Frankreich.',
      it: 'NEBULA: occhiali da sole senza montatura oro con forma cat-eye. Lenti UV400. Spedizione in Svizzera e Francia.',
    },
    tagline: {
      fr: 'La courbe céleste, posée sur le regard.',
      de: 'Die himmlische Kurve für deinen Blick.',
      it: 'La curva celeste sul tuo sguardo.',
    },
    intro: {
      fr: "NEBULA emprunte sa silhouette cat-eye aux nuages interstellaires : une courbe douce, dorée, sans monture pour ne garder que l'essentiel. Conçue pour un port quotidien féminin, elle associe verres UV400 et finition or léger.",
      de: 'NEBULA übernimmt ihre Cat-Eye-Silhouette von interstellaren Wolken: eine sanfte, goldene Kurve, randlos und auf das Wesentliche reduziert. Für den täglichen Gebrauch, mit UV400-Gläsern und leichter Gold-Optik.',
      it: 'NEBULA prende la sua silhouette cat-eye dalle nubi interstellari: una curva morbida e dorata, senza montatura, ridotta all’essenziale. Pensata per l’uso quotidiano, con lenti UV400 e finitura oro leggera.',
    },
    features: {
      fr: ['Monture rimless or', 'Verres UV400', 'Galbe cat-eye féminin', '49.90 CHF'],
      de: ['Randlose Gold-Fassung', 'UV400-Gläser', 'Feminine Cat-Eye-Form', '49.90 CHF'],
      it: ['Montatura rimless oro', 'Lenti UV400', 'Forma cat-eye femminile', '49.90 CHF'],
    },
  },
]
```

- [ ] **Step 4: Create `data/queries.ts`**

Create `eclipse-gold/data/queries.ts`:

```ts
import type { Lang, SunglassModel } from './types'
import { models } from './models'

export function getAllModels(): SunglassModel[] {
  return models
}

export function getModelByHandle(handle: string): SunglassModel | undefined {
  return models.find((m) => m.handle === handle)
}

export function getModelBySlug(slug: string, lang: Lang): SunglassModel | undefined {
  return models.find((m) => m.slug[lang] === slug)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- tests/queries.test.ts`
Expected: PASS — 4 tests green.

- [ ] **Step 6: Commit**

```bash
git add data/models.ts data/queries.ts tests/queries.test.ts
git commit -m "feat: add models data with NEBULA and pure lookup helpers"
```

---

## Task 4: Collection hub

**Files:**
- Create: `eclipse-gold/data/collection.ts`
- Test: `eclipse-gold/tests/collection.test.ts`

- [ ] **Step 1: Write the failing test**

Create `eclipse-gold/tests/collection.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { collectionHub } from '../data/collection'
import { LANGS } from '../data/types'

describe('collection hub', () => {
  it('has a non-empty seoTitle in every language', () => {
    for (const lang of LANGS) {
      expect(collectionHub.seoTitle[lang].length).toBeGreaterThan(0)
    }
  })

  it('orders models by handle', () => {
    expect(collectionHub.modelOrder).toContain('nebula')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/collection.test.ts`
Expected: FAIL — cannot find module `../data/collection`.

- [ ] **Step 3: Write the implementation**

Create `eclipse-gold/data/collection.ts`:

```ts
import type { CollectionHub } from './types'

export const collectionHub: CollectionHub = {
  seoTitle: {
    fr: 'Lunettes de soleil rimless or — Collection Eclipse Gold | Suisse & France',
    de: 'Randlose Sonnenbrillen in Gold — Kollektion Eclipse Gold | Schweiz & Frankreich',
    it: 'Occhiali da sole senza montatura oro — Collezione Eclipse Gold | Svizzera e Francia',
  },
  metaDescription: {
    fr: '10 modèles de lunettes solaires sans monture or, inspirés des phénomènes astronomiques. UV400, 49.90 CHF, livraison Suisse & France.',
    de: '10 randlose Sonnenbrillen-Modelle in Gold, inspiriert von astronomischen Phänomenen. UV400, 49.90 CHF, Lieferung Schweiz & Frankreich.',
    it: '10 modelli di occhiali da sole senza montatura oro, ispirati ai fenomeni astronomici. UV400, 49.90 CHF, spedizione Svizzera e Francia.',
  },
  intro: {
    fr: "Dix éclats, dix phénomènes du ciel. La collection Eclipse Gold décline la monture rimless or en dix silhouettes, chacune nommée d'après un phénomène astronomique.",
    de: 'Zehn Lichtblitze, zehn Phänomene des Himmels. Die Kollektion Eclipse Gold zeigt die randlose Gold-Fassung in zehn Silhouetten, jede nach einem astronomischen Phänomen benannt.',
    it: 'Dieci bagliori, dieci fenomeni del cielo. La collezione Eclipse Gold declina la montatura rimless oro in dieci silhouette, ognuna ispirata a un fenomeno astronomico.',
  },
  // Filled fully in Task 6 once all handles exist; nebula present from Task 3.
  modelOrder: ['nebula'],
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/collection.test.ts`
Expected: PASS — 2 tests green.

- [ ] **Step 5: Commit**

```bash
git add data/collection.ts tests/collection.test.ts
git commit -m "feat: add collection hub data"
```

---

## Task 5: Shopify Storefront product fetch

**Files:**
- Create: `eclipse-gold/data/shopify.ts`
- Test: `eclipse-gold/tests/shopify.test.ts`

- [ ] **Step 1: Write the failing test (mocking global fetch)**

Create `eclipse-gold/tests/shopify.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getShopifyProduct } from '../data/shopify'

beforeEach(() => {
  process.env.SHOPIFY_STORE_DOMAIN = 'eclipse-gold.myshopify.com'
  process.env.SHOPIFY_STOREFRONT_API_TOKEN = 'test-token'
  process.env.SHOPIFY_STOREFRONT_API_VERSION = '2025-01'
})

describe('getShopifyProduct', () => {
  it('maps a Storefront product payload to ShopifyProduct', async () => {
    const payload = {
      data: {
        product: {
          handle: 'nebula',
          title: 'NEBULA',
          availableForSale: true,
          priceRange: { minVariantPrice: { amount: '49.90', currencyCode: 'CHF' } },
          images: { nodes: [{ url: 'https://cdn/nebula.jpg', altText: 'NEBULA' }] },
        },
      },
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    })
    vi.stubGlobal('fetch', fetchMock)

    const product = await getShopifyProduct('nebula', 'CH')

    expect(product).toEqual({
      handle: 'nebula',
      title: 'NEBULA',
      availableForSale: true,
      price: { amount: '49.90', currencyCode: 'CHF' },
      images: [{ url: 'https://cdn/nebula.jpg', altText: 'NEBULA' }],
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('returns null when the product does not exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { product: null } }) }),
    )
    expect(await getShopifyProduct('ghost', 'FR')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/shopify.test.ts`
Expected: FAIL — cannot find module `../data/shopify`.

- [ ] **Step 3: Write the implementation**

Create `eclipse-gold/data/shopify.ts`:

```ts
export interface ShopifyProduct {
  handle: string
  title: string
  availableForSale: boolean
  price: { amount: string; currencyCode: string }
  images: { url: string; altText: string | null }[]
}

const PRODUCT_QUERY = /* GraphQL */ `
  query Product($handle: String!, $country: CountryCode!) @inContext(country: $country) {
    product(handle: $handle) {
      handle
      title
      availableForSale
      priceRange { minVariantPrice { amount currencyCode } }
      images(first: 10) { nodes { url altText } }
    }
  }
`

export async function getShopifyProduct(
  handle: string,
  country: 'CH' | 'FR',
): Promise<ShopifyProduct | null> {
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
    body: JSON.stringify({ query: PRODUCT_QUERY, variables: { handle, country } }),
  })

  if (!res.ok) {
    throw new Error(`Storefront API error: ${res.status}`)
  }

  const json = await res.json()
  const p = json?.data?.product
  if (!p) return null

  return {
    handle: p.handle,
    title: p.title,
    availableForSale: p.availableForSale,
    price: p.priceRange.minVariantPrice,
    images: p.images.nodes,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/shopify.test.ts`
Expected: PASS — 2 tests green.

- [ ] **Step 5: Commit**

```bash
git add data/shopify.ts tests/shopify.test.ts
git commit -m "feat: add Shopify Storefront product fetch"
```

---

## Task 6: Build-time validation + populate the remaining nine models

**Files:**
- Create: `eclipse-gold/scripts/validate-models.ts`
- Test: `eclipse-gold/tests/validate-models.test.ts`
- Modify: `eclipse-gold/data/models.ts`, `eclipse-gold/data/collection.ts`

- [ ] **Step 1: Write the failing test for the pure validator**

Create `eclipse-gold/tests/validate-models.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validateModels } from '../scripts/validate-models'
import type { SunglassModel } from '../data/types'

function makeModel(over: Partial<SunglassModel>): SunglassModel {
  const L = (s: string) => ({ fr: s, de: s, it: s })
  return {
    handle: 'x', modelName: 'X', phenomenon: 'nebula', order: 1, featured: false,
    shape: 'round', audience: 'unisexe', polarized: false, lensTint: 'gold',
    slug: L('x'), primaryKeyword: L('kw-x'), seoTitle: L('t'),
    metaDescription: L('m'), tagline: L('tag'), intro: L('intro'),
    features: { fr: ['a'], de: ['a'], it: ['a'] },
    ...over,
  }
}

describe('validateModels', () => {
  it('flags a duplicate slug within a language', () => {
    const errors = validateModels([
      makeModel({ handle: 'a', slug: { fr: 'same', de: 'a-de', it: 'a-it' } }),
      makeModel({ handle: 'b', slug: { fr: 'same', de: 'b-de', it: 'b-it' } }),
    ])
    expect(errors.some((e) => e.code === 'DUPLICATE_SLUG')).toBe(true)
  })

  it('flags a duplicate primaryKeyword within a language', () => {
    const errors = validateModels([
      makeModel({ handle: 'a', primaryKeyword: { fr: 'dup', de: 'a', it: 'a' }, slug: { fr: 'a', de: 'a', it: 'a' } }),
      makeModel({ handle: 'b', primaryKeyword: { fr: 'dup', de: 'b', it: 'b' }, slug: { fr: 'b', de: 'b', it: 'b' } }),
    ])
    expect(errors.some((e) => e.code === 'DUPLICATE_KEYWORD')).toBe(true)
  })

  it('flags an empty localized field', () => {
    const errors = validateModels([makeModel({ tagline: { fr: '', de: 'x', it: 'x' } })])
    expect(errors.some((e) => e.code === 'EMPTY_TRANSLATION')).toBe(true)
  })

  it('returns no errors for a single valid model', () => {
    expect(validateModels([makeModel({})])).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/validate-models.test.ts`
Expected: FAIL — cannot find module `../scripts/validate-models`.

- [ ] **Step 3: Write the validator and CLI runner**

Create `eclipse-gold/scripts/validate-models.ts`:

```ts
import { LANGS, type Lang, type SunglassModel } from '../data/types'

export interface ValidationError {
  code: string
  message: string
}

const LOCALIZED_STRING_FIELDS = [
  'slug', 'primaryKeyword', 'seoTitle', 'metaDescription', 'tagline', 'intro',
] as const

export function validateModels(models: SunglassModel[]): ValidationError[] {
  const errors: ValidationError[] = []

  for (const lang of LANGS) {
    assertUniquePerLang(models, lang, 'slug', 'DUPLICATE_SLUG', errors)
    assertUniquePerLang(models, lang, 'primaryKeyword', 'DUPLICATE_KEYWORD', errors)
  }

  for (const m of models) {
    for (const field of LOCALIZED_STRING_FIELDS) {
      for (const lang of LANGS) {
        if (!m[field][lang] || m[field][lang].trim() === '') {
          errors.push({
            code: 'EMPTY_TRANSLATION',
            message: `${m.handle}.${field}.${lang} is empty`,
          })
        }
      }
    }
    for (const lang of LANGS) {
      if (m.features[lang].length === 0) {
        errors.push({ code: 'EMPTY_TRANSLATION', message: `${m.handle}.features.${lang} is empty` })
      }
    }
  }

  return errors
}

function assertUniquePerLang(
  models: SunglassModel[],
  lang: Lang,
  field: 'slug' | 'primaryKeyword',
  code: string,
  errors: ValidationError[],
): void {
  const seen = new Map<string, string>()
  for (const m of models) {
    const value = m[field][lang]
    if (seen.has(value)) {
      errors.push({
        code,
        message: `${field}.${lang} "${value}" used by both ${seen.get(value)} and ${m.handle}`,
      })
    } else {
      seen.set(value, m.handle)
    }
  }
}

/** Full-set checks that only make sense once all 10 models exist. */
export function validateFullSet(models: SunglassModel[]): ValidationError[] {
  const errors = validateModels(models)
  if (models.length !== 10) {
    errors.push({ code: 'WRONG_COUNT', message: `expected 10 models, found ${models.length}` })
  }
  const orders = new Set(models.map((m) => m.order))
  if (orders.size !== models.length) {
    errors.push({ code: 'DUPLICATE_ORDER', message: 'model.order values are not unique' })
  }
  const phenomena = new Set(models.map((m) => m.phenomenon))
  if (phenomena.size !== models.length) {
    errors.push({ code: 'DUPLICATE_PHENOMENON', message: 'model.phenomenon values are not unique' })
  }
  return errors
}

// CLI runner — invoked by `npm run validate:models` (prebuild gate).
async function main(): Promise<void> {
  const { models } = await import('../data/models')
  const errors = validateFullSet(models)
  if (errors.length > 0) {
    console.error(`✗ Model validation failed (${errors.length} error(s)):`)
    for (const e of errors) console.error(`  [${e.code}] ${e.message}`)
    process.exit(1)
  }
  console.log(`✓ ${models.length} models validated`)
}

// Run only when executed directly, not when imported by tests.
if (process.argv[1] && process.argv[1].endsWith('validate-models.ts')) {
  void main()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/validate-models.test.ts`
Expected: PASS — 4 tests green.

- [ ] **Step 5: Add the remaining nine models to `data/models.ts`**

Append nine entries to the `models` array using NEBULA as the template. Use this attribute table (shapes are HYPOTHESES — confirm against the real AliExpress products before finalising):

| order | handle | modelName | phenomenon | shape | audience | polarized | primaryKeyword.fr |
|---|---|---|---|---|---|---|---|
| 1 | totalis | TOTALIS | totality | oversize | unisexe | false | lunettes de soleil rimless or oversize |
| 2 | helios | HELIOS | heliacal | aviator | homme | false | lunettes solaires dorées verres miroir |
| 3 | nebula | NEBULA | nebula | cat-eye | femme | false | lunettes sans monture femme or |
| 4 | umbra | UMBRA | umbra | rectangular | unisexe | false | lunettes de soleil rimless noir et or |
| 5 | zenith | ZENITH | zenith | aviator | unisexe | false | lunettes solaires aviateur or sans monture |
| 6 | syzygy | SYZYGY | syzygy | round | unisexe | false | lunettes rimless rondes or |
| 7 | penumbra | PENUMBRA | penumbra | square | femme | false | lunettes solaires verres dégradés or |
| 8 | parhelion | PARHELION | parhelion | rectangular | homme | true | lunettes de soleil or polarisées |
| 9 | equinox | EQUINOX | equinox | square | unisexe | false | lunettes sans monture unisexe or |
| 10 | chroma | CHROMA | chroma | round | femme | false | lunettes solaires or verres colorés |

(NEBULA already exists from Task 3 — update its `order` to `3` if not already.) For each new model, author `slug`, `seoTitle`, `metaDescription`, `tagline`, `intro`, `features` in fr/de/it following the NEBULA shape. Each `intro` MUST be unique (anti-thin-content) and tie the astronomical phenomenon to the product's physical angle.

- [ ] **Step 6: Update `collection.ts` modelOrder to all ten handles**

In `eclipse-gold/data/collection.ts`, replace the `modelOrder` line:

```ts
  modelOrder: [
    'totalis', 'helios', 'nebula', 'umbra', 'zenith',
    'syzygy', 'penumbra', 'parhelion', 'equinox', 'chroma',
  ],
```

- [ ] **Step 7: Run the full validation gate**

Run: `npm run validate:models`
Expected: `✓ 10 models validated`. If it reports `EMPTY_TRANSLATION`, `DUPLICATE_*`, or `WRONG_COUNT`, fix the offending entries in `data/models.ts` and re-run.

- [ ] **Step 8: Run the whole test suite**

Run: `npm run test`
Expected: PASS — all suites green.

- [ ] **Step 9: Commit**

```bash
git add scripts/validate-models.ts tests/validate-models.test.ts data/models.ts data/collection.ts
git commit -m "feat: add model validation gate and complete the 10-model catalogue"
```

---

## Task 7: Wire validation into the build and document the workflow

**Files:**
- Modify: `eclipse-gold/package.json` (already has `prebuild` from Task 1 — verify), `eclipse-gold/README.md`

- [ ] **Step 1: Verify the prebuild gate blocks a broken build**

Temporarily break a model (e.g. set `intro.de` to `''` in `data/models.ts`), then run:

```bash
npm run build
```

Expected: build aborts during `prebuild` with `✗ Model validation failed` and a non-zero exit. Restore the model afterwards.

- [ ] **Step 2: Document the data workflow in the README**

Append to `eclipse-gold/README.md`:

```markdown
## Data layer (Eclipse Gold)

- `data/models.ts` — the 10 sunglass models (SEO/marketing, versioned). Joined to Shopify by `handle`.
- `data/collection.ts` — the collection hub money page.
- `data/queries.ts` — pure in-memory lookups.
- `data/shopify.ts` — Storefront API product fetch (price/stock/images).
- `scripts/validate-models.ts` — build gate (unique slugs/keywords, complete translations, 10 models).

`npm run validate:models` runs automatically before every `npm run build`.
Required env vars are documented in `.env.example`.
```

- [ ] **Step 3: Run the full suite one final time**

Run: `npm run test && npm run validate:models`
Expected: all tests PASS and `✓ 10 models validated`.

- [ ] **Step 4: Commit**

```bash
git add package.json README.md
git commit -m "docs: document data layer and verify build validation gate"
```

---

## Self-Review

**Spec coverage:**
- §3 types → Task 2 ✓ · §4 SunglassModel → Tasks 2,3,6 ✓ · §5 Shopify join → Tasks 3 (lookups), 5 (Storefront fetch) ✓ · §6 CollectionHub + trust pages → Task 4 (hub); trust pages noted as follow-on (out of MVP data scope) ✓ · §7 build validation → Tasks 6,7 ✓ · §8 file organisation → all tasks ✓.
- §9 keyword matrix → encoded in Task 6 table ✓.
- DE/IT final keywords (§10 deferred) → drafted in Task 6, flagged as adjustable.

**Placeholder scan:** No "TBD/TODO" left in code. Task 6 Step 5 is an authored-content step with a complete attribute table and the NEBULA template — content drafting is genuine work, not a placeholder, and is gated by Step 7 validation.

**Type consistency:** `SunglassModel`, `Localized`, `Lang`, `Locale`, `ShopifyProduct`, `ValidationError` names and signatures are consistent across Tasks 2–7. `getModelBySlug(slug, lang)`, `getModelByHandle(handle)`, `getShopifyProduct(handle, country)`, `validateModels(models)`, `validateFullSet(models)` match every call site.

**Follow-on plans (not in this plan):** page rendering & routing (`app/[locale]/...`), JSON-LD output, sitemaps, hreflang tags, trust-page content, DE/IT copy finalisation.
