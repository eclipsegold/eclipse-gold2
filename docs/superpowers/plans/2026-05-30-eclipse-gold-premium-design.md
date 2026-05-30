# Eclipse Gold — Premium Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the "astral jewellery house" art direction (black/gold/cream, Playfair + Inter, eclipse motif) to the entire existing front — hero, collection, product page, shell, breadcrumbs, 404 — keeping the site statically prerendered.

**Architecture:** Design tokens in `app/globals.css` (`:root` CSS variables), fonts self-hosted via `next/font/google` on the root layout, one CSS Module per component, two small new client utilities (`SunglassImage`, `useReveal`/`Reveal`). Existing semantic `className` strings are migrated to `styles.x` module classes. No new pages, no new dependencies.

**Tech Stack:** Next.js 16, TypeScript, CSS Modules, `next/font/google` (Playfair Display + Inter), Vitest + React Testing Library (jsdom).

**Process note (CRITICAL):** Execute tasks STRICTLY SEQUENTIALLY — one implementer at a time, verify after each. Never dispatch parallel implementers on this shared `master` branch (a prior sub-project tangled git that way). Each task makes exactly one commit.

**Next 16 gotchas:** `params`/`cookies()` are async (not touched here). CSS Modules and `next/font` must not introduce runtime data access that would deopt pages from static (they don't). Keep plain `<img>` with `eslint-disable @next/next/no-img-element` (next/image deferred).

---

## File Structure

| File | Responsibility |
|---|---|
| `app/globals.css` | Rewrite: design tokens, reset, mono-dark base, `prefers-reduced-motion` block |
| `app/layout.tsx` | Add Playfair Display + Inter via `next/font`, expose variables on `<html>` |
| `components/SunglassImage.tsx` (+ `.module.css`) | Uniform image treatment; monogram placeholder when no src |
| `components/useReveal.ts` | IntersectionObserver hook → `is-visible` |
| `components/Reveal.tsx` (+ `.module.css`) | Client wrapper applying scroll-reveal to server children |
| `components/Header.module.css` + edits | Sticky translucent nav, wordmark, actions |
| `components/Footer.module.css` + edits | Sober footer + trust strip |
| `components/LangSwitcher.module.css` + edits | Discreet language links |
| `components/CurrencySelector.module.css` + edits | Discreet currency select |
| `components/ProductCard.module.css` + edits | Editorial full-width row, phenomenon label |
| `components/CollectionGrid.module.css` + edits | Single-column editorial stack |
| `components/ProductGallery.module.css` + edits | Immersive image stack via SunglassImage |
| `components/Breadcrumbs.module.css` + edits | Discreet breadcrumb |
| `components/Price.module.css` + edits | Price typography (gold serif) |
| `app/[lang]/home.module.css` + page edits | Eclipse-gallery hero |
| `app/[lang]/[collection]/collection.module.css` + page edits | Collection header + rows |
| `app/[lang]/[collection]/[product]/product.module.css` + page edits | Immersive PDP + sticky CTA bar |
| `app/[lang]/notFound.module.css` + `not-found.tsx` edits | Astral 404 |
| `tests/SunglassImage.dom.test.tsx`, `tests/Reveal.dom.test.tsx` | Unit tests for the two new components |

---

## Task 1: Design tokens + fonts

**Files:**
- Modify: `app/globals.css` (full rewrite), `app/layout.tsx`

- [ ] **Step 1: Rewrite `app/globals.css`**

Replace the ENTIRE file with:
```css
:root {
  --eg-black: #000;
  --eg-gold: #d4af37;
  --eg-cream: #f5f1e8;
  --eg-muted: #9a9a9a;
  --eg-line: #222;
  --eg-bg-radial: radial-gradient(circle at 50% 40%, #1a1407 0%, #000 62%);

  --eg-serif: var(--font-playfair), Georgia, serif;
  --eg-sans: var(--font-inter), system-ui, sans-serif;

  --eg-track: 0.3em;
  --eg-s1: 0.5rem;
  --eg-s2: 1rem;
  --eg-s3: 1.5rem;
  --eg-s4: 2.5rem;
  --eg-s5: 4rem;
  --eg-s6: 6rem;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  height: 100%;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--eg-black);
  color: var(--eg-cream);
  font-family: var(--eg-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

main {
  flex: 1;
}

a {
  color: inherit;
  text-decoration: none;
}

:focus-visible {
  outline: 1px solid var(--eg-gold);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 2: Add fonts to `app/layout.tsx`**

Replace `app/layout.tsx` with:
```tsx
import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { JsonLd } from '../components/JsonLd'
import { organizationJsonLd, websiteJsonLd } from '../lib/seo/jsonld'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Eclipse Gold', template: '%s | Eclipse Gold' },
  description: 'Lunettes de soleil rimless or, inspirées des phénomènes astronomiques.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify build + tests**

Run: `npm run test` → all 59 pass (no test touches these files).
Run: `npx tsc --noEmit` → exit 0.
Run: `rm -rf .next && npm run build` → exit 0. `next/font` downloads Playfair + Inter at build (needs network); if offline, report — do NOT remove the fonts.

- [ ] **Step 4: Commit**
```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: add design tokens and self-hosted Playfair + Inter fonts"
```

---

## Task 2: SunglassImage component (uniform image treatment)

**Files:**
- Create: `components/SunglassImage.tsx`, `components/SunglassImage.module.css`
- Test: `tests/SunglassImage.dom.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/SunglassImage.dom.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SunglassImage } from '../components/SunglassImage'

describe('SunglassImage', () => {
  it('renders an img with the given src and alt when src is provided', () => {
    render(<SunglassImage src="https://cdn/nebula.jpg" alt="NEBULA" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://cdn/nebula.jpg')
    expect(img).toHaveAttribute('alt', 'NEBULA')
  })

  it('renders the EG monogram placeholder (no img) when src is null', () => {
    render(<SunglassImage src={null} alt="NEBULA" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('EG')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- SunglassImage`
Expected: FAIL — cannot find module `../components/SunglassImage`.

- [ ] **Step 3: Write `components/SunglassImage.module.css`**

```css
.frame {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
  background: var(--eg-black);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.frame::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 42%, rgba(212, 175, 55, 0.22), rgba(212, 175, 55, 0) 68%);
  pointer-events: none;
}

.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  font-family: var(--eg-serif);
  font-size: 2rem;
  letter-spacing: 0.15em;
  color: var(--eg-gold);
  background: var(--eg-bg-radial);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 4: Write `components/SunglassImage.tsx`**

```tsx
import styles from './SunglassImage.module.css'

const SIZES = { card: 600, hero: 1000, thumb: 240 } as const

export function SunglassImage({
  src,
  alt,
  size = 'card',
}: {
  src: string | null
  alt: string
  size?: keyof typeof SIZES
}) {
  const px = SIZES[size]
  return (
    <div className={styles.frame}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.img} src={src} alt={alt} loading="lazy" width={px} height={px} />
      ) : (
        <span className={styles.placeholder} aria-label={alt} role="img">
          EG
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- SunglassImage`
Expected: PASS — 2 tests. (The placeholder test: `getByText('EG')` finds the monogram; the `role="img"` span also satisfies an accessible name but `queryByRole('img')` matches it too — so assert via text. Note: the placeholder span has `role="img"`, so `queryByRole('img')` WOULD find it. Change the placeholder to NOT use `role="img"` to keep the test valid:)

Update `components/SunglassImage.tsx` placeholder to:
```tsx
        <span className={styles.placeholder} aria-hidden="true">EG</span>
```
Re-run: `npm run test -- SunglassImage` → PASS (2 tests: img case finds the img; placeholder case has no img role and shows "EG").

- [ ] **Step 6: Run typecheck and commit**

Run: `npx tsc --noEmit` → exit 0.
```bash
git add components/SunglassImage.tsx components/SunglassImage.module.css tests/SunglassImage.dom.test.tsx
git commit -m "feat: add SunglassImage with uniform treatment and EG placeholder"
```

---

## Task 3: useReveal hook + Reveal wrapper

**Files:**
- Create: `components/useReveal.ts`, `components/Reveal.tsx`, `components/Reveal.module.css`
- Test: `tests/Reveal.dom.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/Reveal.dom.test.tsx`:
```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Reveal } from '../components/Reveal'

beforeEach(() => {
  // jsdom lacks IntersectionObserver — provide a stub that fires "visible" immediately.
  class IO {
    cb: IntersectionObserverCallback
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb
    }
    observe(el: Element) {
      this.cb([{ isIntersecting: true, target: el } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
    root = null
    rootMargin = ''
    thresholds = []
  }
  vi.stubGlobal('IntersectionObserver', IO)
})

describe('Reveal', () => {
  it('renders its children', () => {
    render(
      <Reveal>
        <p>hello stars</p>
      </Reveal>,
    )
    expect(screen.getByText('hello stars')).toBeInTheDocument()
  })

  it('marks itself visible once it intersects', () => {
    render(
      <Reveal>
        <p>visible content</p>
      </Reveal>,
    )
    // After the observer fires, the wrapper carries the visible class via data attr.
    const wrapper = screen.getByTestId('reveal')
    expect(wrapper.getAttribute('data-visible')).toBe('true')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- Reveal`
Expected: FAIL — cannot find module `../components/Reveal`.

- [ ] **Step 3: Write `components/useReveal.ts`**

```ts
'use client'
import { useEffect, useRef, useState } from 'react'

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}
```

- [ ] **Step 4: Write `components/Reveal.module.css`**

```css
.reveal {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

.reveal[data-visible='true'] {
  opacity: 1;
  transform: none;
}
```

- [ ] **Step 5: Write `components/Reveal.tsx`**

```tsx
'use client'
import type { ReactNode } from 'react'
import { useReveal } from './useReveal'
import styles from './Reveal.module.css'

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      data-testid="reveal"
      data-visible={visible}
      className={`${styles.reveal} ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- Reveal`
Expected: PASS — 2 tests. Run `npx tsc --noEmit` → exit 0.

- [ ] **Step 7: Commit**
```bash
git add components/useReveal.ts components/Reveal.tsx components/Reveal.module.css tests/Reveal.dom.test.tsx
git commit -m "feat: add useReveal hook and Reveal scroll wrapper"
```

---

## Task 4: Shell styling (Header, Footer, LangSwitcher, CurrencySelector)

**Files:**
- Create: `components/Header.module.css`, `components/Footer.module.css`, `components/LangSwitcher.module.css`, `components/CurrencySelector.module.css`
- Modify: `components/Header.tsx`, `components/Footer.tsx`, `components/LangSwitcher.tsx`, `components/CurrencySelector.tsx`

> No unit test — these render-only components are covered by the existing `Header.dom.test.tsx` / `LangSwitcher.dom.test.tsx`, which assert text/links/aria (not classes), so they keep passing after the className swap. Verify they still pass.

- [ ] **Step 1: Create `components/Header.module.css`**

```css
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--eg-s2) var(--eg-s3);
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--eg-line);
}

.brand {
  font-family: var(--eg-serif);
  font-size: 0.95rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.nav a {
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--eg-muted);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--eg-s2);
}

.cart {
  background: none;
  border: none;
  color: var(--eg-muted);
  cursor: not-allowed;
  font-size: 1rem;
}
```

- [ ] **Step 2: Update `components/Header.tsx`**

```tsx
import Link from 'next/link'
import type { Lang } from '../data/types'
import { collectionSlugFor } from '../lib/i18n'
import { LangSwitcher } from './LangSwitcher'
import { CurrencySelector } from './CurrencySelector'
import styles from './Header.module.css'

export function Header({ lang }: { lang: Lang }) {
  const collectionHref = `/${lang}/${collectionSlugFor(lang)}`
  return (
    <header className={styles.header}>
      <Link href={`/${lang}`} className={styles.brand}>
        Eclipse Gold
      </Link>
      <nav className={styles.nav}>
        <Link href={collectionHref}>Collection</Link>
      </nav>
      <div className={styles.actions}>
        <LangSwitcher current={lang} />
        <CurrencySelector />
        <button type="button" aria-label="Panier" disabled className={styles.cart}>
          🛒
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Create `components/Footer.module.css`**

```css
.footer {
  border-top: 1px solid var(--eg-line);
  padding: var(--eg-s5) var(--eg-s3) var(--eg-s4);
  text-align: center;
}

.brand {
  font-family: var(--eg-serif);
  font-size: 1rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.links {
  margin-top: var(--eg-s3);
  display: flex;
  flex-direction: column;
  gap: var(--eg-s1);
}

.links a {
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--eg-muted);
}

.trust {
  margin-top: var(--eg-s4);
  padding-top: var(--eg-s3);
  border-top: 1px solid var(--eg-line);
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--eg-muted);
  line-height: 2;
}
```

- [ ] **Step 4: Update `components/Footer.tsx`**

```tsx
import Link from 'next/link'
import type { Lang } from '../data/types'
import styles from './Footer.module.css'

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className={styles.footer}>
      <p className={styles.brand}>Eclipse Gold</p>
      <nav aria-label="Liens légaux" className={styles.links}>
        {/* Trust pages are sub-project E — stubs for now */}
        <Link href={`/${lang}`}>Mentions légales</Link>
        <Link href={`/${lang}`}>Livraison &amp; retours</Link>
      </nav>
      <p className={styles.trust}>
        ✦ Livraison Suisse &amp; France &nbsp; ✦ Retours 14 jours &nbsp; ✦ Paiement sécurisé
      </p>
    </footer>
  )
}
```

- [ ] **Step 5: Create `components/LangSwitcher.module.css`**

```css
.switcher {
  display: flex;
  gap: var(--eg-s1);
}

.switcher a {
  font-size: 0.65rem;
  letter-spacing: 0.14em;
  color: var(--eg-muted);
}

.switcher a[aria-current='true'] {
  color: var(--eg-gold);
}
```

- [ ] **Step 6: Update `components/LangSwitcher.tsx`**

```tsx
import Link from 'next/link'
import { LANGS, type Lang } from '../data/types'
import styles from './LangSwitcher.module.css'

export function LangSwitcher({ current }: { current: Lang }) {
  return (
    <nav aria-label="Langue" className={styles.switcher}>
      {LANGS.map((l) => (
        <Link key={l} href={`/${l}`} aria-current={l === current ? 'true' : undefined}>
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 7: Create `components/CurrencySelector.module.css`**

```css
.select {
  background: transparent;
  color: var(--eg-muted);
  border: 1px solid var(--eg-line);
  border-radius: 2px;
  padding: 2px 4px;
  font-size: 0.6rem;
  letter-spacing: 0.08em;
}

.select option {
  background: var(--eg-black);
  color: var(--eg-cream);
}
```

- [ ] **Step 8: Update `components/CurrencySelector.tsx`**

```tsx
'use client'
import { useCurrency } from './CurrencyContext'
import type { Country } from '../lib/currency'
import styles from './CurrencySelector.module.css'

export function CurrencySelector() {
  const { country, setCountry } = useCurrency()
  return (
    <select
      aria-label="Devise"
      className={styles.select}
      value={country === 'CH' ? 'CH' : 'FR'}
      onChange={(e) => setCountry(e.target.value as Country)}
    >
      <option value="CH">CHF (Suisse)</option>
      <option value="FR">EUR (Europe)</option>
    </select>
  )
}
```

- [ ] **Step 9: Verify and commit**

Run: `npm run test -- Header LangSwitcher` → existing tests still pass.
Run: `npx tsc --noEmit` → exit 0.
```bash
git add components/Header.tsx components/Header.module.css components/Footer.tsx components/Footer.module.css components/LangSwitcher.tsx components/LangSwitcher.module.css components/CurrencySelector.tsx components/CurrencySelector.module.css
git commit -m "feat: style site shell (header, footer, switchers)"
```

---

## Task 5: Home hero — eclipse gallery

**Files:**
- Create: `app/[lang]/home.module.css`
- Modify: `app/[lang]/page.tsx`

- [ ] **Step 1: Create `app/[lang]/home.module.css`**

```css
.hero {
  height: 88vh;
  min-height: 540px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--eg-bg-radial);
  position: relative;
  padding: 0 var(--eg-s3);
}

.ring {
  width: 170px;
  height: 170px;
  border-radius: 50%;
  background: var(--eg-black);
  box-shadow: 0 0 2px 2px var(--eg-gold), 0 0 70px 14px rgba(212, 175, 55, 0.45);
  margin-bottom: var(--eg-s4);
  animation: breathe 6s ease-in-out infinite;
}

@keyframes breathe {
  0%,
  100% {
    box-shadow: 0 0 2px 2px var(--eg-gold), 0 0 60px 10px rgba(212, 175, 55, 0.4);
  }
  50% {
    box-shadow: 0 0 2px 2px var(--eg-gold), 0 0 90px 22px rgba(212, 175, 55, 0.6);
  }
}

.title {
  font-family: var(--eg-serif);
  font-weight: 400;
  font-size: clamp(1.8rem, 8vw, 2.6rem);
  line-height: 1.25;
  text-transform: uppercase;
  letter-spacing: var(--eg-track);
}

.subtitle {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--eg-muted);
  margin: var(--eg-s3) 0 var(--eg-s4);
}

.cta {
  display: inline-block;
  border: 1px solid var(--eg-gold);
  color: var(--eg-gold);
  padding: 12px 28px;
  font-size: 0.7rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  border-radius: 2px;
}

.intro {
  max-width: 640px;
  margin: var(--eg-s6) auto;
  padding: 0 var(--eg-s3);
  text-align: center;
  font-family: var(--eg-serif);
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--eg-cream);
}
```

- [ ] **Step 2: Update `app/[lang]/page.tsx`**

Keep the metadata/params logic identical; only change the returned JSX and add the import. Replace the file body from the `import` lines and the `return (...)`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLang, collectionSlugFor } from '../../lib/i18n'
import { collectionHub } from '../../data/collection'
import { buildMetadata } from '../../lib/seo/metadata'
import { Reveal } from '../../components/Reveal'
import type { Lang } from '../../data/types'
import styles from './home.module.css'

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
    <>
      <section className={styles.hero}>
        <div className={styles.ring} aria-hidden="true" />
        <h1 className={styles.title}>Wear the Sun</h1>
        <p className={styles.subtitle}>10 éclats · Lunettes rimless or</p>
        <Link href={collectionHref} className={styles.cta}>
          Découvrir la collection
        </Link>
      </section>
      <Reveal>
        <p className={styles.intro}>{collectionHub.intro[lang]}</p>
      </Reveal>
    </>
  )
}
```

- [ ] **Step 3: Verify and commit**

Run: `npm run test` → 61 pass (still). Run `npx tsc --noEmit` → exit 0.
```bash
git add app/[lang]/page.tsx app/[lang]/home.module.css
git commit -m "feat: eclipse-gallery hero on the home page"
```

---

## Task 6: Collection — editorial full-width rows

**Files:**
- Create: `app/[lang]/[collection]/collection.module.css`, `components/ProductCard.module.css`, `components/CollectionGrid.module.css`
- Modify: `app/[lang]/[collection]/page.tsx`, `components/ProductCard.tsx`, `components/CollectionGrid.tsx`

> The collection page currently renders `ProductCard` with `image={null}`. This task wires real product imagery is OUT of scope (still `image={null}`), but ProductCard now renders the SunglassImage placeholder treatment so empty cards still look premium. It also adds a `phenomenon` label prop.

- [ ] **Step 1: Add a phenomenon label to ProductCard — create `components/ProductCard.module.css`**

```css
.card {
  display: block;
  text-align: center;
  padding: var(--eg-s5) var(--eg-s3);
  border-bottom: 1px solid var(--eg-line);
}

.media {
  max-width: 360px;
  margin: 0 auto;
}

.phenomenon {
  display: block;
  margin-top: var(--eg-s3);
  font-size: 0.65rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--eg-gold);
}

.name {
  font-family: var(--eg-serif);
  font-size: 1.4rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-top: var(--eg-s1);
}

.tagline {
  font-size: 0.8rem;
  color: var(--eg-muted);
  margin-top: var(--eg-s1);
}
```

- [ ] **Step 2: Update `components/ProductCard.tsx`**

Add an optional `phenomenon` prop and use `SunglassImage`. Existing `ProductCard.dom.test.tsx` asserts name, tagline, link href, and `img` alt — when an image url is passed it must still render an `<img>`; `SunglassImage` does that, so the test stays green. When `image` is null it renders the placeholder.

```tsx
import Link from 'next/link'
import { SunglassImage } from './SunglassImage'
import styles from './ProductCard.module.css'

export function ProductCard({
  href,
  modelName,
  tagline,
  image,
  phenomenon,
}: {
  href: string
  modelName: string
  tagline: string
  image: { url: string; alt: string } | null
  phenomenon?: string
}) {
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.media}>
        <SunglassImage src={image?.url ?? null} alt={image?.alt ?? modelName} size="card" />
      </div>
      {phenomenon && <span className={styles.phenomenon}>{phenomenon}</span>}
      <h3 className={styles.name}>{modelName}</h3>
      <p className={styles.tagline}>{tagline}</p>
    </Link>
  )
}
```

- [ ] **Step 3: Verify ProductCard test still passes**

Run: `npm run test -- ProductCard`
Expected: PASS. The existing test passes `image={{url, alt}}`, so `SunglassImage` renders an `<img>` with that src/alt — `getByRole('img')` + alt assertion hold.

- [ ] **Step 4: Create `components/CollectionGrid.module.css`**

```css
.stack {
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 5: Update `components/CollectionGrid.tsx`**

```tsx
import type { ReactNode } from 'react'
import styles from './CollectionGrid.module.css'

export function CollectionGrid({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>
}
```

- [ ] **Step 6: Create `app/[lang]/[collection]/collection.module.css`**

```css
.header {
  text-align: center;
  padding: var(--eg-s5) var(--eg-s3) var(--eg-s3);
}

.kicker {
  font-family: var(--eg-serif);
  font-size: 1.4rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.sub {
  font-size: 0.65rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--eg-muted);
  margin-top: var(--eg-s2);
}

.intro {
  max-width: 620px;
  margin: var(--eg-s3) auto 0;
  font-size: 0.85rem;
  line-height: 1.8;
  color: var(--eg-muted);
}
```

- [ ] **Step 7: Update `app/[lang]/[collection]/page.tsx`**

The page maps `collectionHub.modelOrder` to ordered models and renders `ProductCard`. Pass a phenomenon label and import styles. Locate the existing `return (` JSX and the model mapping; change the header markup and add `phenomenon={m.phenomenon}` to each card. Full new return block (keep all logic above `return` identical — the `ordered`/`items` computation, JsonLd, etc.):

```tsx
  return (
    <section>
      <JsonLd data={collectionJsonLd(items)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Eclipse Gold', url: abs(`/${lang}`) },
          { name: collectionHub.seoTitle[lang], url: abs(`/${lang}/${collectionSlugFor(lang)}`) },
        ])}
      />
      <header className={styles.header}>
        <h1 className={styles.kicker}>La Collection</h1>
        <p className={styles.sub}>Dix éclats</p>
        <p className={styles.intro}>{collectionHub.intro[lang]}</p>
      </header>
      <CollectionGrid>
        {ordered.map((m) => (
          <ProductCard
            key={m.handle}
            href={`/${lang}/${collectionSlugFor(lang)}/${m.slug[lang]}`}
            modelName={m.modelName}
            tagline={m.tagline[lang]}
            phenomenon={m.phenomenon}
            image={null}
          />
        ))}
      </CollectionGrid>
    </section>
  )
```

Add the import at the top of the file (alongside the existing imports):
```tsx
import styles from './collection.module.css'
```

> `m.phenomenon` is a field on `SunglassModel` (a `Phenomenon` enum string like `'nebula'`). It is a machine key, not display copy, but acceptable as an uppercase label for this sober pass — the editorial phenomenon copy is refined later. Confirm `phenomenon` exists on the model type (it does — `data/types.ts`).

- [ ] **Step 8: Verify and commit**

Run: `npm run test` → all pass. Run `npx tsc --noEmit` → exit 0.
```bash
git add app/[lang]/[collection]/page.tsx app/[lang]/[collection]/collection.module.css components/ProductCard.tsx components/ProductCard.module.css components/CollectionGrid.tsx components/CollectionGrid.module.css
git commit -m "feat: editorial full-width collection rows"
```

---

## Task 7: Product page — immersive + sticky CTA

**Files:**
- Create: `app/[lang]/[collection]/[product]/product.module.css`, `components/ProductGallery.module.css`, `components/Price.module.css`
- Modify: `app/[lang]/[collection]/[product]/page.tsx`, `components/ProductGallery.tsx`, `components/Price.tsx`

- [ ] **Step 1: Create `components/ProductGallery.module.css`**

```css
.gallery {
  display: flex;
  flex-direction: column;
  gap: var(--eg-s2);
}

.hero {
  width: 100%;
}
```

- [ ] **Step 2: Update `components/ProductGallery.tsx`**

```tsx
import { SunglassImage } from './SunglassImage'
import styles from './ProductGallery.module.css'

export function ProductGallery({ images }: { images: { url: string; alt: string }[] }) {
  if (images.length === 0) {
    return (
      <div className={styles.gallery}>
        <div className={styles.hero}>
          <SunglassImage src={null} alt="Eclipse Gold" size="hero" />
        </div>
      </div>
    )
  }
  return (
    <div className={styles.gallery}>
      {images.map((img, i) => (
        <div key={i} className={styles.hero}>
          <SunglassImage src={img.url} alt={img.alt} size="hero" />
        </div>
      ))}
    </div>
  )
}
```

> Behaviour change: `ProductGallery` previously returned `null` on empty; now it renders the placeholder. No test asserts the null case (the empty-gallery test in `presentational.dom.test.tsx` asserts `container` is empty) — UPDATE that test in Step 3.

- [ ] **Step 3: Update the empty-gallery test in `tests/presentational.dom.test.tsx`**

Find the test `'renders nothing when there are no images'` and replace it with:
```tsx
  it('renders the EG placeholder when there are no images', () => {
    render(<ProductGallery images={[]} />)
    expect(screen.getByText('EG')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
```
(The "renders one img per image" test still holds: each `SunglassImage` with a url renders an `<img>`, so two images → two imgs.)

- [ ] **Step 4: Create `components/Price.module.css`**

```css
.price {
  font-family: var(--eg-serif);
  font-size: 1.1rem;
  color: var(--eg-gold);
  letter-spacing: 0.04em;
}
```

- [ ] **Step 5: Update `components/Price.tsx`**

Keep ALL the existing logic (effect, fetch, state) identical — only change the import and the returned `<span>` className:
```tsx
import styles from './Price.module.css'
```
and the final return:
```tsx
  return <span className={styles.price}>{formatPrice(amount, currency, lang)}</span>
```

- [ ] **Step 6: Create `app/[lang]/[collection]/[product]/product.module.css`**

```css
.article {
  padding-bottom: 96px; /* room for the sticky bar */
}

.body {
  text-align: center;
  padding: var(--eg-s4) var(--eg-s3) var(--eg-s3);
}

.phenomenon {
  font-size: 0.65rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--eg-gold);
}

.name {
  font-family: var(--eg-serif);
  font-size: 1.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-top: var(--eg-s2);
}

.tagline {
  font-family: var(--eg-serif);
  font-size: 1.1rem;
  line-height: 1.5;
  margin-top: var(--eg-s2);
}

.desc {
  font-size: 0.85rem;
  line-height: 1.9;
  color: var(--eg-muted);
  margin-top: var(--eg-s3);
}

.features {
  list-style: none;
  margin-top: var(--eg-s3);
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  color: var(--eg-cream);
  line-height: 2.4;
}

.sticky {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: var(--eg-s2);
  padding: 12px 16px;
  background: rgba(10, 10, 10, 0.96);
  border-top: 1px solid var(--eg-gold);
  backdrop-filter: blur(8px);
}

.buy {
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
  cursor: not-allowed;
  opacity: 0.92;
}

.unavailable {
  flex: 1;
  text-align: center;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--eg-muted);
}
```

- [ ] **Step 7: Update `app/[lang]/[collection]/[product]/page.tsx`**

Keep ALL logic above `return` identical (params, guards, shopify fetch, JsonLd builders, `images`, `url`, `defaultAmount`, `defaultCurrency`). Add the styles import at the top:
```tsx
import styles from './product.module.css'
```
Replace the returned JSX with:
```tsx
  return (
    <article className={styles.article}>
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
      <div className={styles.body}>
        <p className={styles.phenomenon}>{model.phenomenon}</p>
        <h1 className={styles.name}>{model.modelName}</h1>
        <p className={styles.tagline}>{model.tagline[lang]}</p>
        <p className={styles.desc}>{model.intro[lang]}</p>
        <ul className={styles.features}>
          {model.features[lang].map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </div>
      <div className={styles.sticky}>
        {shopify ? (
          <Price handle={model.handle} lang={lang} defaultAmount={defaultAmount} defaultCurrency={defaultCurrency} />
        ) : (
          <span className={styles.unavailable}>Bientôt disponible</span>
        )}
        <button type="button" className={styles.buy} disabled aria-label="Ajouter au panier">
          Ajouter au panier
        </button>
      </div>
    </article>
  )
```

> Note: the cart button is `disabled` (commerce = sub-project D) but styled as final. The sticky bar holds both the Price island and the buy button so price+CTA stay visible while scrolling.

- [ ] **Step 8: Verify and commit**

Run: `npm run test` → all pass (including the updated empty-gallery test). Run `npx tsc --noEmit` → exit 0.
```bash
git add app/[lang]/[collection]/[product]/page.tsx app/[lang]/[collection]/[product]/product.module.css components/ProductGallery.tsx components/ProductGallery.module.css components/Price.tsx components/Price.module.css tests/presentational.dom.test.tsx
git commit -m "feat: immersive product page with sticky price/CTA bar"
```

---

## Task 8: Breadcrumbs + 404 styling

**Files:**
- Create: `components/Breadcrumbs.module.css`, `app/[lang]/notFound.module.css`
- Modify: `components/Breadcrumbs.tsx`, `app/[lang]/not-found.tsx`

- [ ] **Step 1: Create `components/Breadcrumbs.module.css`**

```css
.breadcrumbs {
  padding: var(--eg-s2) var(--eg-s3);
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--eg-muted);
}

.breadcrumbs a:last-child {
  color: var(--eg-cream);
}
```

- [ ] **Step 2: Update `components/Breadcrumbs.tsx`**

```tsx
import Link from 'next/link'
import styles from './Breadcrumbs.module.css'

export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className={styles.breadcrumbs}>
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

- [ ] **Step 3: Create `app/[lang]/notFound.module.css`**

```css
.wrap {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--eg-bg-radial);
  padding: var(--eg-s4) var(--eg-s3);
}

.ring {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--eg-black);
  box-shadow: 0 0 2px 1px var(--eg-gold), 0 0 40px 8px rgba(212, 175, 55, 0.35);
  margin-bottom: var(--eg-s3);
}

.title {
  font-family: var(--eg-serif);
  font-size: 1.4rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.text {
  font-size: 0.8rem;
  color: var(--eg-muted);
  margin-top: var(--eg-s2);
}
```

- [ ] **Step 4: Update `app/[lang]/not-found.tsx`**

```tsx
import styles from './notFound.module.css'

export default function NotFound() {
  return (
    <section className={styles.wrap}>
      <div className={styles.ring} aria-hidden="true" />
      <h1 className={styles.title}>Page introuvable</h1>
      <p className={styles.text}>Le modèle ou la page que vous cherchez n’existe pas.</p>
    </section>
  )
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm run test` → all pass. Run `npx tsc --noEmit` → exit 0.
```bash
git add components/Breadcrumbs.tsx components/Breadcrumbs.module.css app/[lang]/not-found.tsx app/[lang]/notFound.module.css
git commit -m "feat: style breadcrumbs and astral 404"
```

---

## Task 9: Full build verification + visual smoke check

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm run test`
Expected: all green (was 59; now 63 — added SunglassImage ×2 and Reveal ×2; the empty-gallery test was modified not added). If a "Failed to start forks worker" flake appears, re-run once.

- [ ] **Step 2: Typecheck + production build**

Run: `npx tsc --noEmit` → exit 0.
Run: `rm -rf .next && npm run build` → exit 0. Confirm the route table still shows the 36 prerendered pages as ● SSG (the CSS Modules + `next/font` + the client `Reveal`/`Price` islands must NOT have deopted any content page to ƒ dynamic). If any content route shows ƒ, investigate (likely an accidental `cookies()`/`headers()` call — there should be none).

- [ ] **Step 3: Visual smoke check (manual, optional but recommended)**

Run: `npm run start` (serves the production build) and open `http://localhost:3000/fr`. Eyeball: black background everywhere, gold eclipse ring breathing on the hero, Playfair serif on titles, editorial collection rows, immersive product page with the gold sticky CTA bar pinned to the bottom. Confirm no Arial/white-background flashes (the old boilerplate is gone).

- [ ] **Step 4: Document in README**

Append to `eclipse-gold/README.md`:
```markdown
## Design system (premium)

- Tokens in `app/globals.css` (`:root` variables): black `#000`, gold `#d4af37`, cream `#f5f1e8`; Playfair Display (serif titles) + Inter (body) self-hosted via `next/font`.
- One CSS Module per component. Mono-dark theme (no light/dark).
- `components/SunglassImage.tsx` applies the uniform image treatment (black bg, square crop, gold halo) and an "EG" monogram placeholder when no image.
- `components/Reveal.tsx` + `useReveal.ts` do sober scroll-reveal (respects `prefers-reduced-motion`).
- The product page has a sticky gold price/CTA bar; the "Ajouter au panier" button is a disabled stub until the commerce sub-project.
```

- [ ] **Step 5: Commit**
```bash
git add README.md
git commit -m "docs: document premium design system"
```

---

## Self-Review

**Spec coverage:**
- §2 tokens → Task 1 ✓ · §3 fonts → Task 1 ✓ · §4 CSS Modules per component → Tasks 4–8 ✓ · §5 SunglassImage + placeholder → Task 2 ✓ · §6 useReveal/Reveal + breathing ring + reduced-motion → Tasks 1 (keyframes + global rm block), 3, 5 ✓ · §7 sticky CTA + disabled stub → Task 7 ✓ · §8 a11y/perf (focus-visible, contrast, lazy img, static) → Tasks 1, 9 ✓ · §9 tests (SunglassImage, Reveal, non-regression, build) → Tasks 2, 3, 9 ✓.
- Hero direction A → Task 5 ✓ · collection direction B → Task 6 ✓ · product B+C → Task 7 ✓ · mono-dark (light/dark removed) → Task 1 ✓ · EG placeholder → Task 2 ✓ · Playfair → Task 1 ✓.

**Placeholder scan:** No TBD/TODO. Every step shows complete code. Task 2 Step 5 contains a deliberate self-correction (placeholder `role="img"` → `aria-hidden`) with the exact final code — not a placeholder. Task 6/7 "keep logic above return identical" references concrete, already-existing code shown in earlier sub-projects; the full new return blocks are given verbatim.

**Type consistency:** `SunglassImage({src: string|null, alt, size})`, `Reveal({children, className?})`, `useReveal<T>()→{ref, visible}`, `ProductCard` gains optional `phenomenon?: string`, `Price` signature unchanged. `m.phenomenon` is a real `SunglassModel` field (`data/types.ts`). All `styles.x` class names match their module definitions. CSS var names (`--eg-*`, `--font-playfair`, `--font-inter`) are consistent between globals.css, layout.tsx, and every module.

**Known follow-ons (not in this plan):** real product imagery wiring (cards still `image={null}`), commerce/cart (D), trust-page content (E), refined editorial phenomenon copy, Didot/Bodoni licensed fonts, next/image.
