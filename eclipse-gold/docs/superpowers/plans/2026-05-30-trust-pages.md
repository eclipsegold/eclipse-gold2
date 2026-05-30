# Trust Pages (Sub-Project E) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six statically-prerendered trust pages (CGV, mentions légales, livraison, retours, confidentialité, cookies) in three languages under `/{lang}/infos/{slug}`, with content in a single typed `data/legal.ts`, build-time validation, footer links, and sitemap/hreflang coverage.

**Architecture:** One dynamic route `app/[lang]/infos/[slug]/page.tsx` resolves a localized slug to one of six page keys and renders a presentational `LegalDocument` component. All content lives in `data/legal.ts` (one `LegalEntity` written once, six `LegalPageContent` objects, all `Localized<>`). The legal entity is referenced through `{token}` interpolation so it is never duplicated. Pure helpers in `lib/i18n.ts` mirror the existing `collectionSlugFor` pattern.

**Tech Stack:** Next.js 16 (App Router, static prerender + ISR), React 19, TypeScript, CSS Modules, Vitest (node + jsdom projects), `tsx` for the build-gate script.

---

## Conventions (read before starting)

- **This is Next.js 16.** Before editing any route, skim the relevant guide under `node_modules/next/dist/docs/` (per `AGENTS.md`). `params` is a `Promise` and must be `await`ed.
- **i18n:** `LANGS = ['fr','de','it']`, `Localized<T> = Record<Lang, T>` (from `data/types.ts`). Every translated field must have all three languages or the build/tests fail.
- **Tests:** node tests are `tests/*.test.ts` (jsdom excluded); DOM tests are `tests/*.dom.test.tsx` with `import '@testing-library/jest-dom/vitest'` via `tests/setup-dom.ts`. DOM tests must `afterEach(() => cleanup())`.
- **Run a single test file:** `npx vitest run tests/<file> --no-file-parallelism`
- **Run everything:** `npm test` (which is `vitest run`).
- **CSS:** one `.module.css` per component; tokens are `--eg-gold #d4af37`, `--eg-cream #f5f1e8`, `--eg-muted`, `--eg-serif` (Playfair), `--eg-track` (letter-spacing). Mono-dark theme.
- **Commits:** end every commit message with the Co-Authored-By trailer used in this repo:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **Spec:** `docs/superpowers/specs/2026-05-30-trust-pages-design.md`.

## File structure

| File | Responsibility |
|---|---|
| `data/types.ts` (modify) | Add `LEGAL_PAGES`, `LegalPage`, `LegalEntity`, `LegalSection`, `LegalPageContent` types |
| `lib/i18n.ts` (modify) | Add `LEGAL_SLUGS`, `legalSlugFor`, `legalPageForSlug` |
| `data/legal.ts` (create) | `legalEntity` + `legalPages` content (six pages × 3 langs) |
| `lib/legal.ts` (create) | `interpolateEntity()` token-replacement helper (pure, unit-testable) |
| `components/LegalDocument.tsx` + `.module.css` (create) | Presentational renderer |
| `app/[lang]/infos/[slug]/page.tsx` (create) | Dynamic route, 18 static pages, metadata |
| `components/Footer.tsx` (modify) | Real localized links (replace stubs) |
| `app/sitemap.ts` (modify) | Add 18 legal URLs to the `static` split |
| `scripts/validate-models.ts` (modify) | Add `validateLegal()` + a self-executing main runner |
| `tests/legal-i18n.test.ts` (create) | Slug round-trip helpers |
| `tests/legal-interpolate.test.ts` (create) | Token interpolation |
| `tests/validate-legal.test.ts` (create) | Build-gate coverage for legal content |
| `tests/LegalDocument.dom.test.tsx` (create) | Renderer behavior |
| `tests/Footer.dom.test.tsx` (create) | Footer exposes localized links |

---

## Task 1: Legal types

**Files:**
- Modify: `data/types.ts` (append at end of file)

- [ ] **Step 1: Add the types**

Append to `data/types.ts`:

```ts
// --- Trust pages (sub-project E) ---

export const LEGAL_PAGES = [
  'terms', 'legal', 'shipping', 'returns', 'privacy', 'cookies',
] as const
export type LegalPage = (typeof LEGAL_PAGES)[number]

/** Written once, referenced in page content via {token} interpolation. */
export interface LegalEntity {
  companyName: string
  legalForm: string
  address: string[]
  country: string
  vatId: string
  registrationId: string
  email: string
  privacyEmail: string
  publisher: string
  host: string[]
}

export interface LegalSection {
  heading: Localized<string>
  body: Localized<string[]>
  bullets?: Localized<string[]>
}

export interface LegalPageContent {
  slug: Localized<string>
  seoTitle: Localized<string>
  metaDescription: Localized<string>
  title: Localized<string>
  intro: Localized<string>
  sections: LegalSection[]
  updatedAt: string
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no errors; types are not yet used anywhere).

- [ ] **Step 3: Commit**

```bash
git add data/types.ts
git commit -m "feat: add legal page types for trust pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Slug helpers in lib/i18n.ts

**Files:**
- Modify: `lib/i18n.ts`
- Test: `tests/legal-i18n.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/legal-i18n.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { legalSlugFor, legalPageForSlug, LANGS } from '../lib/i18n'
import { LEGAL_PAGES } from '../data/types'

describe('legal slug round-trip', () => {
  it('maps each (page, lang) to a slug and back', () => {
    for (const page of LEGAL_PAGES) {
      for (const lang of LANGS) {
        expect(legalPageForSlug(legalSlugFor(page, lang), lang)).toBe(page)
      }
    }
  })

  it('returns undefined for an unknown slug', () => {
    expect(legalPageForSlug('nope', 'fr')).toBeUndefined()
  })

  it('resolves a slug only within its own language', () => {
    // 'impressum' is the DE slug for 'legal'; it must not resolve under fr
    expect(legalPageForSlug('impressum', 'de')).toBe('legal')
    expect(legalPageForSlug('impressum', 'fr')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/legal-i18n.test.ts --no-file-parallelism`
Expected: FAIL — `legalSlugFor` / `legalPageForSlug` are not exported.

- [ ] **Step 3: Implement the helpers**

Append to `lib/i18n.ts`:

```ts
import { LEGAL_PAGES, type LegalPage } from '../data/types'

export const LEGAL_SLUGS: Record<LegalPage, Localized<string>> = {
  terms:    { fr: 'cgv',              de: 'agb',              it: 'condizioni-vendita' },
  legal:    { fr: 'mentions-legales', de: 'impressum',       it: 'note-legali' },
  shipping: { fr: 'livraison',        de: 'versand',         it: 'spedizioni' },
  returns:  { fr: 'retours',          de: 'ruckgabe',        it: 'resi' },
  privacy:  { fr: 'confidentialite',  de: 'datenschutz',     it: 'privacy' },
  cookies:  { fr: 'cookies',          de: 'cookies',         it: 'cookie' },
}

export function legalSlugFor(page: LegalPage, lang: Lang): string {
  return LEGAL_SLUGS[page][lang]
}

export function legalPageForSlug(slug: string, lang: Lang): LegalPage | undefined {
  return LEGAL_PAGES.find((page) => LEGAL_SLUGS[page][lang] === slug)
}
```

Note: `lib/i18n.ts` already imports `type Localized` and `type Lang` from `../data/types`; add `LEGAL_PAGES, type LegalPage` to that existing import line rather than duplicating it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/legal-i18n.test.ts --no-file-parallelism`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/i18n.ts tests/legal-i18n.test.ts
git commit -m "feat: add localized legal slug helpers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Entity token interpolation helper

**Files:**
- Create: `lib/legal.ts`
- Test: `tests/legal-interpolate.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/legal-interpolate.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { interpolateEntity } from '../lib/legal'
import type { LegalEntity } from '../data/types'

const entity: LegalEntity = {
  companyName: 'Eclipse Gold',
  legalForm: 'SàRL',
  address: ['Genève', 'Suisse'],
  country: 'Suisse',
  vatId: 'Non assujetti',
  registrationId: 'CHE-XXX',
  email: 'eclipsegold@outlook.fr',
  privacyEmail: 'eclipsegold@outlook.fr',
  publisher: 'Jane Doe',
  host: ['Vercel Inc.'],
}

describe('interpolateEntity', () => {
  it('replaces a single token', () => {
    expect(interpolateEntity('Société {companyName}.', entity)).toBe('Société Eclipse Gold.')
  })

  it('replaces multiple distinct tokens', () => {
    expect(interpolateEntity('{companyName} — {email}', entity))
      .toBe('Eclipse Gold — eclipsegold@outlook.fr')
  })

  it('joins array fields with a comma', () => {
    expect(interpolateEntity('Adresse : {address}', entity)).toBe('Adresse : Genève, Suisse')
  })

  it('leaves unknown tokens untouched', () => {
    expect(interpolateEntity('Hello {unknown}', entity)).toBe('Hello {unknown}')
  })

  it('returns the input unchanged when there are no tokens', () => {
    expect(interpolateEntity('plain text', entity)).toBe('plain text')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/legal-interpolate.test.ts --no-file-parallelism`
Expected: FAIL — module `../lib/legal` not found.

- [ ] **Step 3: Implement the helper**

Create `lib/legal.ts`:

```ts
import type { LegalEntity } from '../data/types'

/**
 * Replaces {token} placeholders with values from the legal entity.
 * Array fields (address, host) are joined with ", ". Unknown tokens are
 * left as-is so a typo is visible rather than silently dropped.
 */
export function interpolateEntity(text: string, entity: LegalEntity): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in entity)) return match
    const value = entity[key as keyof LegalEntity]
    return Array.isArray(value) ? value.join(', ') : value
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/legal-interpolate.test.ts --no-file-parallelism`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/legal.ts tests/legal-interpolate.test.ts
git commit -m "feat: add legal entity token interpolation helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Legal content data — entity + scaffold + first page (terms)

This task creates `data/legal.ts` with the entity and the **CGV (`terms`)** page fully drafted in all three languages. Tasks 5–9 add the remaining five pages. Splitting by page keeps each commit reviewable (legal text gets human review per page).

> **Drafting note for the implementer:** the FR text below is the source of truth. The DE/IT text provided is a faithful translation; if you are not confident in legal phrasing, keep the structure and tokens identical and flag the page for human review in the commit body. Never invent entity facts — only the `{token}` placeholders and the values in `legalEntity` carry facts.

**Files:**
- Create: `data/legal.ts`

- [ ] **Step 1: Create the entity and the file skeleton**

Create `data/legal.ts`:

```ts
import type { LegalEntity, LegalPage, LegalPageContent } from './types'

export const legalEntity: LegalEntity = {
  companyName: '[À COMPLÉTER]',
  legalForm: '[À COMPLÉTER]',
  address: ['Genève', 'Suisse'],
  country: 'Suisse',
  vatId: 'Non assujetti à la TVA',
  registrationId: '[À COMPLÉTER]',
  email: 'eclipsegold@outlook.fr',
  privacyEmail: 'eclipsegold@outlook.fr',
  publisher: '[À COMPLÉTER]',
  host: ['Vercel Inc.', '340 S Lemon Ave #4133', 'Walnut, CA 91789, USA'],
}

const terms: LegalPageContent = {
  slug: { fr: 'cgv', de: 'agb', it: 'condizioni-vendita' },
  seoTitle: {
    fr: 'Conditions générales de vente — Eclipse Gold',
    de: 'Allgemeine Geschäftsbedingungen — Eclipse Gold',
    it: 'Condizioni generali di vendita — Eclipse Gold',
  },
  metaDescription: {
    fr: 'Conditions générales de vente d’Eclipse Gold : commande, prix, paiement, livraison et rétractation.',
    de: 'Allgemeine Geschäftsbedingungen von Eclipse Gold: Bestellung, Preise, Zahlung, Lieferung und Widerruf.',
    it: 'Condizioni generali di vendita di Eclipse Gold: ordine, prezzi, pagamento, spedizione e recesso.',
  },
  title: {
    fr: 'Conditions générales de vente',
    de: 'Allgemeine Geschäftsbedingungen',
    it: 'Condizioni generali di vendita',
  },
  intro: {
    fr: 'Les présentes conditions régissent toute commande passée sur le site Eclipse Gold, édité par {companyName}.',
    de: 'Diese Bedingungen gelten für jede Bestellung über die Website Eclipse Gold, betrieben von {companyName}.',
    it: 'Le presenti condizioni disciplinano ogni ordine effettuato sul sito Eclipse Gold, gestito da {companyName}.',
  },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Objet', de: 'Gegenstand', it: 'Oggetto' },
      body: {
        fr: ['Les présentes conditions générales de vente s’appliquent à toutes les ventes de lunettes de soleil conclues sur le site Eclipse Gold. Toute commande implique l’acceptation sans réserve des présentes conditions.'],
        de: ['Diese Allgemeinen Geschäftsbedingungen gelten für alle über die Website Eclipse Gold abgeschlossenen Verkäufe von Sonnenbrillen. Jede Bestellung gilt als vorbehaltlose Annahme dieser Bedingungen.'],
        it: ['Le presenti condizioni generali di vendita si applicano a tutte le vendite di occhiali da sole concluse sul sito Eclipse Gold. Ogni ordine implica l’accettazione senza riserve delle presenti condizioni.'],
      },
    },
    {
      heading: { fr: 'Prix et paiement', de: 'Preise und Zahlung', it: 'Prezzi e pagamento' },
      body: {
        fr: ['Les prix sont indiqués en CHF ou en EUR selon le pays de livraison, toutes taxes comprises le cas échéant. Le paiement s’effectue en ligne au moment de la commande.'],
        de: ['Die Preise werden je nach Lieferland in CHF oder EUR angegeben, gegebenenfalls inklusive Steuern. Die Zahlung erfolgt online zum Zeitpunkt der Bestellung.'],
        it: ['I prezzi sono indicati in CHF o in EUR a seconda del paese di consegna, tasse incluse ove applicabile. Il pagamento avviene online al momento dell’ordine.'],
      },
      bullets: {
        fr: ['Carte bancaire', 'Apple Pay', 'Google Pay'],
        de: ['Kreditkarte', 'Apple Pay', 'Google Pay'],
        it: ['Carta di credito', 'Apple Pay', 'Google Pay'],
      },
    },
    {
      heading: { fr: 'Livraison', de: 'Lieferung', it: 'Spedizione' },
      body: {
        fr: ['La livraison est offerte. Les délais sont de 7 à 21 jours ouvrés selon la destination. Le détail figure sur la page Livraison.'],
        de: ['Die Lieferung ist kostenlos. Die Lieferzeit beträgt je nach Zielort 7 bis 21 Werktage. Einzelheiten finden Sie auf der Seite Versand.'],
        it: ['La spedizione è gratuita. I tempi sono di 7-21 giorni lavorativi a seconda della destinazione. I dettagli sono indicati nella pagina Spedizioni.'],
      },
    },
    {
      heading: { fr: 'Droit de rétractation', de: 'Widerrufsrecht', it: 'Diritto di recesso' },
      body: {
        fr: ['Conformément à la réglementation applicable, vous disposez d’un délai de 14 jours à compter de la réception pour retourner un article. Les frais de retour sont à la charge du client. Les modalités figurent sur la page Retours.'],
        de: ['Gemäß den geltenden Vorschriften haben Sie ab Erhalt 14 Tage Zeit, einen Artikel zurückzusenden. Die Rücksendekosten trägt der Kunde. Einzelheiten finden Sie auf der Seite Rückgabe.'],
        it: ['Ai sensi della normativa applicabile, disponi di 14 giorni dalla ricezione per restituire un articolo. Le spese di reso sono a carico del cliente. Le modalità sono indicate nella pagina Resi.'],
      },
    },
    {
      heading: { fr: 'Contact', de: 'Kontakt', it: 'Contatto' },
      body: {
        fr: ['Pour toute question relative à une commande, contactez-nous à l’adresse {email}.'],
        de: ['Bei Fragen zu einer Bestellung kontaktieren Sie uns unter {email}.'],
        it: ['Per qualsiasi domanda relativa a un ordine, contattaci all’indirizzo {email}.'],
      },
    },
  ],
}

export const legalPages: Record<LegalPage, LegalPageContent> = {
  terms,
  // legal, shipping, returns, privacy, cookies added in Tasks 5–9
} as Record<LegalPage, LegalPageContent>
```

Note: the `as Record<...>` cast is temporary so the file typechecks while only `terms` exists. Tasks 5–9 each add one page and Task 9 removes the cast.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add data/legal.ts
git commit -m "feat: add legal entity and CGV/terms content

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Content — mentions légales (`legal`)

**Files:**
- Modify: `data/legal.ts`

- [ ] **Step 1: Add the `legal` page object**

Insert this `const legal` above the `legalPages` export in `data/legal.ts`:

```ts
const legal: LegalPageContent = {
  slug: { fr: 'mentions-legales', de: 'impressum', it: 'note-legali' },
  seoTitle: {
    fr: 'Mentions légales — Eclipse Gold',
    de: 'Impressum — Eclipse Gold',
    it: 'Note legali — Eclipse Gold',
  },
  metaDescription: {
    fr: 'Mentions légales d’Eclipse Gold : éditeur, contact et hébergeur du site.',
    de: 'Impressum von Eclipse Gold: Betreiber, Kontakt und Hosting der Website.',
    it: 'Note legali di Eclipse Gold: editore, contatto e hosting del sito.',
  },
  title: { fr: 'Mentions légales', de: 'Impressum', it: 'Note legali' },
  intro: { fr: '', de: '', it: '' },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Éditeur du site', de: 'Betreiber der Website', it: 'Editore del sito' },
      body: {
        fr: ['{companyName}, {legalForm}.', 'Adresse : {address}.', 'Contact : {email}.', 'Directeur de la publication : {publisher}.', 'Identifiant : {registrationId}.', 'TVA : {vatId}.'],
        de: ['{companyName}, {legalForm}.', 'Adresse: {address}.', 'Kontakt: {email}.', 'Verantwortlich für den Inhalt: {publisher}.', 'Registernummer: {registrationId}.', 'MwSt: {vatId}.'],
        it: ['{companyName}, {legalForm}.', 'Indirizzo: {address}.', 'Contatto: {email}.', 'Direttore della pubblicazione: {publisher}.', 'Identificativo: {registrationId}.', 'IVA: {vatId}.'],
      },
    },
    {
      heading: { fr: 'Hébergement', de: 'Hosting', it: 'Hosting' },
      body: {
        fr: ['Le site est hébergé par {host}.'],
        de: ['Die Website wird gehostet von {host}.'],
        it: ['Il sito è ospitato da {host}.'],
      },
    },
    {
      heading: { fr: 'Propriété intellectuelle', de: 'Geistiges Eigentum', it: 'Proprietà intellettuale' },
      body: {
        fr: ['L’ensemble des contenus du site (textes, images, marque Eclipse Gold) est protégé. Toute reproduction sans autorisation est interdite.'],
        de: ['Sämtliche Inhalte der Website (Texte, Bilder, Marke Eclipse Gold) sind geschützt. Jede Vervielfältigung ohne Genehmigung ist untersagt.'],
        it: ['Tutti i contenuti del sito (testi, immagini, marchio Eclipse Gold) sono protetti. Qualsiasi riproduzione senza autorizzazione è vietata.'],
      },
    },
  ],
}
```

Then add `legal,` to the `legalPages` object.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add data/legal.ts
git commit -m "feat: add mentions légales content (needs human legal review)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Content — livraison (`shipping`)

**Files:**
- Modify: `data/legal.ts`

- [ ] **Step 1: Add the `shipping` page object**

Insert above `legalPages`:

```ts
const shipping: LegalPageContent = {
  slug: { fr: 'livraison', de: 'versand', it: 'spedizioni' },
  seoTitle: {
    fr: 'Livraison — Eclipse Gold',
    de: 'Versand — Eclipse Gold',
    it: 'Spedizioni — Eclipse Gold',
  },
  metaDescription: {
    fr: 'Livraison offerte, délais de 7 à 21 jours ouvrés selon la destination.',
    de: 'Kostenloser Versand, Lieferzeit 7 bis 21 Werktage je nach Zielort.',
    it: 'Spedizione gratuita, tempi di 7-21 giorni lavorativi a seconda della destinazione.',
  },
  title: { fr: 'Livraison', de: 'Versand', it: 'Spedizioni' },
  intro: {
    fr: 'La livraison est offerte sur toutes les commandes.',
    de: 'Der Versand ist bei allen Bestellungen kostenlos.',
    it: 'La spedizione è gratuita su tutti gli ordini.',
  },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Délais et frais', de: 'Fristen und Kosten', it: 'Tempi e costi' },
      body: {
        fr: ['Les commandes sont préparées puis expédiées selon la destination.'],
        de: ['Die Bestellungen werden je nach Zielort vorbereitet und versandt.'],
        it: ['Gli ordini vengono preparati e spediti a seconda della destinazione.'],
      },
      bullets: {
        fr: ['Livraison offerte partout', 'Délais : 7 à 21 jours ouvrés selon la destination', 'Transporteur : selon la destination'],
        de: ['Kostenloser Versand überallhin', 'Lieferzeit: 7 bis 21 Werktage je nach Zielort', 'Versanddienstleister: je nach Zielort'],
        it: ['Spedizione gratuita ovunque', 'Tempi: 7-21 giorni lavorativi a seconda della destinazione', 'Corriere: a seconda della destinazione'],
      },
    },
    {
      heading: { fr: 'Suivi de commande', de: 'Sendungsverfolgung', it: 'Tracciamento dell’ordine' },
      body: {
        fr: ['Pour toute question sur l’acheminement de votre commande, écrivez-nous à {email}.'],
        de: ['Bei Fragen zur Zustellung Ihrer Bestellung schreiben Sie uns an {email}.'],
        it: ['Per qualsiasi domanda sulla consegna del tuo ordine, scrivici a {email}.'],
      },
    },
  ],
}
```

Then add `shipping,` to `legalPages`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add data/legal.ts
git commit -m "feat: add livraison content

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Content — retours (`returns`)

**Files:**
- Modify: `data/legal.ts`

- [ ] **Step 1: Add the `returns` page object**

Insert above `legalPages`:

```ts
const returns: LegalPageContent = {
  slug: { fr: 'retours', de: 'ruckgabe', it: 'resi' },
  seoTitle: {
    fr: 'Retours — Eclipse Gold',
    de: 'Rückgabe — Eclipse Gold',
    it: 'Resi — Eclipse Gold',
  },
  metaDescription: {
    fr: 'Retours sous 14 jours. Frais de retour à la charge du client.',
    de: 'Rückgabe innerhalb von 14 Tagen. Rücksendekosten trägt der Kunde.',
    it: 'Resi entro 14 giorni. Spese di reso a carico del cliente.',
  },
  title: { fr: 'Retours', de: 'Rückgabe', it: 'Resi' },
  intro: {
    fr: 'Vous disposez de 14 jours pour changer d’avis.',
    de: 'Sie haben 14 Tage Zeit, um es sich anders zu überlegen.',
    it: 'Hai 14 giorni per cambiare idea.',
  },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Conditions', de: 'Bedingungen', it: 'Condizioni' },
      body: {
        fr: ['Le délai de rétractation est de 14 jours à compter de la réception de votre commande.'],
        de: ['Die Widerrufsfrist beträgt 14 Tage ab Erhalt Ihrer Bestellung.'],
        it: ['Il termine di recesso è di 14 giorni dalla ricezione del tuo ordine.'],
      },
      bullets: {
        fr: ['Délai : 14 jours après réception', 'Article non porté, dans son état d’origine', 'Frais de retour à la charge du client'],
        de: ['Frist: 14 Tage nach Erhalt', 'Artikel ungetragen, im Originalzustand', 'Rücksendekosten trägt der Kunde'],
        it: ['Termine: 14 giorni dalla ricezione', 'Articolo non indossato, nello stato originale', 'Spese di reso a carico del cliente'],
      },
    },
    {
      heading: { fr: 'Procédure', de: 'Ablauf', it: 'Procedura' },
      body: {
        fr: ['Pour initier un retour, contactez-nous à {email} en précisant votre numéro de commande. Le remboursement intervient après réception et contrôle de l’article.'],
        de: ['Um eine Rückgabe einzuleiten, kontaktieren Sie uns unter {email} und geben Sie Ihre Bestellnummer an. Die Rückerstattung erfolgt nach Erhalt und Prüfung des Artikels.'],
        it: ['Per avviare un reso, contattaci a {email} indicando il numero d’ordine. Il rimborso avviene dopo la ricezione e il controllo dell’articolo.'],
      },
    },
  ],
}
```

Then add `returns,` to `legalPages`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add data/legal.ts
git commit -m "feat: add retours content

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Content — confidentialité (`privacy`)

**Files:**
- Modify: `data/legal.ts`

- [ ] **Step 1: Add the `privacy` page object**

Insert above `legalPages`:

```ts
const privacy: LegalPageContent = {
  slug: { fr: 'confidentialite', de: 'datenschutz', it: 'privacy' },
  seoTitle: {
    fr: 'Politique de confidentialité — Eclipse Gold',
    de: 'Datenschutzerklärung — Eclipse Gold',
    it: 'Informativa sulla privacy — Eclipse Gold',
  },
  metaDescription: {
    fr: 'Comment Eclipse Gold collecte et protège vos données personnelles.',
    de: 'Wie Eclipse Gold Ihre personenbezogenen Daten erhebt und schützt.',
    it: 'Come Eclipse Gold raccoglie e protegge i tuoi dati personali.',
  },
  title: { fr: 'Politique de confidentialité', de: 'Datenschutzerklärung', it: 'Informativa sulla privacy' },
  intro: {
    fr: 'Nous traitons vos données personnelles avec soin et uniquement pour traiter vos commandes.',
    de: 'Wir behandeln Ihre personenbezogenen Daten sorgfältig und ausschließlich zur Abwicklung Ihrer Bestellungen.',
    it: 'Trattiamo i tuoi dati personali con cura ed esclusivamente per gestire i tuoi ordini.',
  },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Données collectées', de: 'Erhobene Daten', it: 'Dati raccolti' },
      body: {
        fr: ['Nous collectons les données nécessaires au traitement de votre commande :'],
        de: ['Wir erheben die zur Abwicklung Ihrer Bestellung erforderlichen Daten:'],
        it: ['Raccogliamo i dati necessari alla gestione del tuo ordine:'],
      },
      bullets: {
        fr: ['Nom et adresse de livraison', 'Adresse e-mail', 'Données de paiement (traitées par notre prestataire)'],
        de: ['Name und Lieferadresse', 'E-Mail-Adresse', 'Zahlungsdaten (von unserem Dienstleister verarbeitet)'],
        it: ['Nome e indirizzo di consegna', 'Indirizzo e-mail', 'Dati di pagamento (trattati dal nostro fornitore)'],
      },
    },
    {
      heading: { fr: 'Paiement', de: 'Zahlung', it: 'Pagamento' },
      body: {
        fr: ['Les paiements sont traités par Stripe. Vos données de carte ne transitent jamais par nos serveurs.'],
        de: ['Zahlungen werden von Stripe verarbeitet. Ihre Kartendaten werden niemals über unsere Server geleitet.'],
        it: ['I pagamenti sono gestiti da Stripe. I dati della tua carta non transitano mai dai nostri server.'],
      },
    },
    {
      heading: { fr: 'Vos droits', de: 'Ihre Rechte', it: 'I tuoi diritti' },
      body: {
        fr: ['Vous pouvez demander l’accès, la rectification ou la suppression de vos données en écrivant à {privacyEmail}.'],
        de: ['Sie können Zugang, Berichtigung oder Löschung Ihrer Daten verlangen, indem Sie an {privacyEmail} schreiben.'],
        it: ['Puoi richiedere l’accesso, la rettifica o la cancellazione dei tuoi dati scrivendo a {privacyEmail}.'],
      },
    },
  ],
}
```

Then add `privacy,` to `legalPages`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add data/legal.ts
git commit -m "feat: add confidentialité content (needs human legal review)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Content — cookies (`cookies`) + remove temporary cast

**Files:**
- Modify: `data/legal.ts`

- [ ] **Step 1: Add the `cookies` page object**

Insert above `legalPages`:

```ts
const cookies: LegalPageContent = {
  slug: { fr: 'cookies', de: 'cookies', it: 'cookie' },
  seoTitle: {
    fr: 'Cookies — Eclipse Gold',
    de: 'Cookies — Eclipse Gold',
    it: 'Cookie — Eclipse Gold',
  },
  metaDescription: {
    fr: 'Eclipse Gold n’utilise que des cookies strictement nécessaires au fonctionnement du site.',
    de: 'Eclipse Gold verwendet nur technisch notwendige Cookies.',
    it: 'Eclipse Gold utilizza solo cookie strettamente necessari al funzionamento del sito.',
  },
  title: { fr: 'Cookies', de: 'Cookies', it: 'Cookie' },
  intro: {
    fr: 'Nous n’utilisons que des cookies nécessaires au fonctionnement du site.',
    de: 'Wir verwenden nur Cookies, die für den Betrieb der Website erforderlich sind.',
    it: 'Utilizziamo solo cookie necessari al funzionamento del sito.',
  },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Cookies utilisés', de: 'Verwendete Cookies', it: 'Cookie utilizzati' },
      body: {
        fr: ['Le site n’utilise pas de cookies publicitaires ni de mesure d’audience. Seuls des cookies fonctionnels sont employés :'],
        de: ['Die Website verwendet keine Werbe- oder Analyse-Cookies. Es werden ausschließlich funktionale Cookies eingesetzt:'],
        it: ['Il sito non utilizza cookie pubblicitari né di misurazione del pubblico. Sono impiegati solo cookie funzionali:'],
      },
      bullets: {
        fr: ['Préférence de pays/devise (affichage du prix)', 'Sécurité du paiement (Stripe)'],
        de: ['Land-/Währungseinstellung (Preisanzeige)', 'Zahlungssicherheit (Stripe)'],
        it: ['Preferenza paese/valuta (visualizzazione del prezzo)', 'Sicurezza del pagamento (Stripe)'],
      },
    },
    {
      heading: { fr: 'Gestion', de: 'Verwaltung', it: 'Gestione' },
      body: {
        fr: ['Ces cookies étant strictement nécessaires, aucun consentement n’est requis. Vous pouvez les supprimer via les réglages de votre navigateur.'],
        de: ['Da diese Cookies unbedingt erforderlich sind, ist keine Einwilligung notwendig. Sie können sie über die Einstellungen Ihres Browsers löschen.'],
        it: ['Essendo strettamente necessari, questi cookie non richiedono consenso. Puoi eliminarli tramite le impostazioni del browser.'],
      },
    },
  ],
}
```

- [ ] **Step 2: Complete the `legalPages` map and remove the cast**

Replace the `legalPages` export with the final version (all six keys, no cast):

```ts
export const legalPages: Record<LegalPage, LegalPageContent> = {
  terms,
  legal,
  shipping,
  returns,
  privacy,
  cookies,
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS — the `Record<LegalPage, LegalPageContent>` is now exhaustive without the cast.

- [ ] **Step 4: Commit**

```bash
git add data/legal.ts
git commit -m "feat: add cookies content and finalize legal pages map

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Build-gate validation for legal content

**Files:**
- Modify: `scripts/validate-models.ts`
- Test: `tests/validate-legal.test.ts`

> **Codebase convention (read first):** `scripts/validate-models.ts` validators
> **return `ValidationError[]`** (`{ code, message }`), they do **not** throw.
> The file **already has** a `main()` CLI runner guarded by
> `if (process.argv[1] && process.argv[1].endsWith('validate-models.ts'))`.
> We extend that existing `main()` — do NOT add a second self-executing block.

- [ ] **Step 1: Write the failing test**

Create `tests/validate-legal.test.ts` (matches the existing array-returning style in `tests/validate-models.test.ts`):

```ts
import { describe, it, expect } from 'vitest'
import { validateLegal } from '../scripts/validate-models'
import { legalPages } from '../data/legal'
import type { LegalPage, LegalPageContent } from '../data/types'

type Pages = Record<LegalPage, LegalPageContent>

describe('validateLegal', () => {
  it('returns no errors for the real legal content', () => {
    expect(validateLegal(legalPages)).toEqual([])
  })

  it('flags a missing page', () => {
    const broken = structuredClone(legalPages) as Partial<Pages>
    delete broken.cookies
    const errors = validateLegal(broken as Pages)
    expect(errors.some((e) => e.code === 'MISSING_LEGAL_PAGE' && e.message.includes('cookies'))).toBe(true)
  })

  it('flags a duplicate slug within a language', () => {
    const broken = structuredClone(legalPages)
    broken.cookies.slug.fr = broken.terms.slug.fr // collide on fr
    const errors = validateLegal(broken)
    expect(errors.some((e) => e.code === 'DUPLICATE_LEGAL_SLUG')).toBe(true)
  })

  it('flags an empty translation', () => {
    const broken = structuredClone(legalPages)
    broken.terms.title.de = ''
    const errors = validateLegal(broken)
    expect(errors.some((e) => e.code === 'EMPTY_TRANSLATION' && e.message.includes('de'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/validate-legal.test.ts --no-file-parallelism`
Expected: FAIL — `validateLegal` is not exported.

- [ ] **Step 3: Implement `validateLegal` + `legalEntityWarnings`**

In `scripts/validate-models.ts`, extend the **existing** top import line. It is
currently:

```ts
import { LANGS, type Lang, type SunglassModel } from '../data/types'
```

Change it to (add the legal symbols; keep `Lang`/`SunglassModel`):

```ts
import { LANGS, type Lang, type SunglassModel, LEGAL_PAGES } from '../data/types'
import type { LegalPage, LegalPageContent, LegalEntity, Localized } from '../data/types'
```

Add these functions (anywhere among the other exported validators, e.g. after `validateCollectionOrder`):

```ts
function assertComplete(
  field: Localized<string>,
  where: string,
  errors: ValidationError[],
): void {
  for (const lang of LANGS) {
    if (!field[lang] || field[lang].trim() === '') {
      errors.push({ code: 'EMPTY_TRANSLATION', message: `${where}.${lang} is empty` })
    }
  }
}

/** Validates the six trust pages: completeness + per-language slug uniqueness. */
export function validateLegal(pages: Record<LegalPage, LegalPageContent>): ValidationError[] {
  const errors: ValidationError[] = []
  const slugsByLang: Record<Lang, Map<string, LegalPage>> = {
    fr: new Map(), de: new Map(), it: new Map(),
  }

  for (const page of LEGAL_PAGES) {
    const content = pages[page]
    if (!content) {
      errors.push({ code: 'MISSING_LEGAL_PAGE', message: `missing legal page: ${page}` })
      continue
    }

    assertComplete(content.title, `${page}.title`, errors)
    assertComplete(content.seoTitle, `${page}.seoTitle`, errors)
    assertComplete(content.metaDescription, `${page}.metaDescription`, errors)
    assertComplete(content.slug, `${page}.slug`, errors)

    for (const lang of LANGS) {
      const slug = content.slug[lang]
      if (!slug) continue
      const prev = slugsByLang[lang].get(slug)
      if (prev) {
        errors.push({
          code: 'DUPLICATE_LEGAL_SLUG',
          message: `slug.${lang} "${slug}" used by both ${prev} and ${page}`,
        })
      } else {
        slugsByLang[lang].set(slug, page)
      }
    }

    content.sections.forEach((section, i) => {
      assertComplete(section.heading, `${page}.sections[${i}].heading`, errors)
      for (const lang of LANGS) {
        if (!Array.isArray(section.body[lang]) || section.body[lang].length === 0) {
          errors.push({ code: 'EMPTY_TRANSLATION', message: `${page}.sections[${i}].body.${lang} is empty` })
        }
        if (section.bullets && (!Array.isArray(section.bullets[lang]) || section.bullets[lang].length === 0)) {
          errors.push({ code: 'EMPTY_TRANSLATION', message: `${page}.sections[${i}].bullets.${lang} is empty` })
        }
      }
    })
  }

  return errors
}

/** Non-blocking: surfaces [À COMPLÉTER] entity placeholders before go-live. */
export function legalEntityWarnings(entity: LegalEntity): string[] {
  const warnings: string[] = []
  for (const [key, value] of Object.entries(entity)) {
    const flat = Array.isArray(value) ? value.join(' ') : value
    if (flat.includes('[À COMPLÉTER]')) {
      warnings.push(`legalEntity.${key} still contains a placeholder — complete before go-live.`)
    }
  }
  return warnings
}
```

- [ ] **Step 4: Wire into the existing `main()` runner**

The file already ends with a `main()` that loads models/collection and exits on
errors. Update **only** that function to also load and validate the legal data.
Replace the existing `main` body with:

```ts
async function main(): Promise<void> {
  const { models } = await import('../data/models')
  const { collectionHub } = await import('../data/collection')
  const { legalPages, legalEntity } = await import('../data/legal')
  const errors = [
    ...validateFullSet(models),
    ...validateCollectionOrder(models, collectionHub.modelOrder),
    ...validateLegal(legalPages),
  ]
  if (errors.length > 0) {
    console.error(`✗ Validation failed (${errors.length} error(s)):`)
    for (const e of errors) console.error(`  [${e.code}] ${e.message}`)
    process.exit(1)
  }
  for (const w of legalEntityWarnings(legalEntity)) console.warn(`⚠️  ${w}`)
  console.log(`✓ ${models.length} models and ${LEGAL_PAGES.length} legal pages validated`)
}
```

The existing self-execution guard at the bottom of the file
(`if (process.argv[1] && process.argv[1].endsWith('validate-models.ts')) void main()`)
stays unchanged — do not add another one.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/validate-legal.test.ts --no-file-parallelism`
Expected: PASS (4 tests).

- [ ] **Step 6: Verify the gate runs end-to-end**

Run: `npm run validate:models`
Expected: prints `✓ 10 models and 6 legal pages validated` plus one `⚠️` line per
`[À COMPLÉTER]` entity field; exit code 0.

- [ ] **Step 7: Commit**

```bash
git add scripts/validate-models.ts tests/validate-legal.test.ts
git commit -m "feat: validate legal content at build time

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: LegalDocument component

**Files:**
- Create: `components/LegalDocument.tsx`
- Create: `components/LegalDocument.module.css`
- Test: `tests/LegalDocument.dom.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/LegalDocument.dom.test.tsx`:

```tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { LegalDocument } from '../components/LegalDocument'
import type { LegalEntity, LegalPageContent } from '../data/types'

afterEach(() => cleanup())

const entity: LegalEntity = {
  companyName: 'Eclipse Gold SàRL',
  legalForm: 'SàRL',
  address: ['Genève', 'Suisse'],
  country: 'Suisse',
  vatId: 'Non assujetti',
  registrationId: 'CHE-1',
  email: 'hello@eg.test',
  privacyEmail: 'privacy@eg.test',
  publisher: 'Jane Doe',
  host: ['Vercel Inc.'],
}

const content: LegalPageContent = {
  slug: { fr: 'cgv', de: 'agb', it: 'condizioni-vendita' },
  seoTitle: { fr: 's', de: 's', it: 's' },
  metaDescription: { fr: 'd', de: 'd', it: 'd' },
  title: { fr: 'Conditions générales', de: 'AGB', it: 'Condizioni' },
  intro: { fr: 'Édité par {companyName}.', de: '', it: '' },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Paiement', de: 'Zahlung', it: 'Pagamento' },
      body: { fr: ['Contact : {email}.'], de: ['x'], it: ['x'] },
      bullets: { fr: ['Carte', 'Apple Pay'], de: ['x'], it: ['x'] },
    },
  ],
}

describe('LegalDocument', () => {
  it('renders the localized title and section heading', () => {
    render(<LegalDocument content={content} lang="fr" entity={entity} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Conditions générales' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Paiement' })).toBeInTheDocument()
  })

  it('interpolates entity tokens in intro and body', () => {
    render(<LegalDocument content={content} lang="fr" entity={entity} />)
    expect(screen.getByText('Édité par Eclipse Gold SàRL.')).toBeInTheDocument()
    expect(screen.getByText('Contact : hello@eg.test.')).toBeInTheDocument()
  })

  it('renders bullets as list items', () => {
    render(<LegalDocument content={content} lang="fr" entity={entity} />)
    expect(screen.getByText('Apple Pay')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('omits the intro when it is empty for the language', () => {
    render(<LegalDocument content={content} lang="de" entity={entity} />)
    expect(screen.queryByText(/Édité par/)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/LegalDocument.dom.test.tsx --no-file-parallelism`
Expected: FAIL — module `../components/LegalDocument` not found.

- [ ] **Step 3: Implement the component**

Create `components/LegalDocument.tsx`:

```tsx
import type { Lang, LegalEntity, LegalPageContent } from '../data/types'
import { interpolateEntity } from '../lib/legal'
import styles from './LegalDocument.module.css'

const DATE_LOCALE: Record<Lang, string> = { fr: 'fr-FR', de: 'de-DE', it: 'it-IT' }

export function LegalDocument({
  content,
  lang,
  entity,
}: {
  content: LegalPageContent
  lang: Lang
  entity: LegalEntity
}) {
  const intro = interpolateEntity(content.intro[lang], entity)
  const updated = new Date(content.updatedAt).toLocaleDateString(DATE_LOCALE[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article className={styles.doc}>
      <h1 className={styles.title}>{content.title[lang]}</h1>
      {intro && <p className={styles.intro}>{intro}</p>}

      {content.sections.map((section, i) => (
        <section key={i} className={styles.section}>
          <h2 className={styles.heading}>{section.heading[lang]}</h2>
          {section.body[lang].map((para, j) => (
            <p key={j} className={styles.body}>{interpolateEntity(para, entity)}</p>
          ))}
          {section.bullets && (
            <ul className={styles.bullets}>
              {section.bullets[lang].map((item, k) => (
                <li key={k}>{interpolateEntity(item, entity)}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <p className={styles.updated}>
        {lang === 'de' ? 'Zuletzt aktualisiert' : lang === 'it' ? 'Ultimo aggiornamento' : 'Dernière mise à jour'} : {updated}
      </p>
    </article>
  )
}
```

Create `components/LegalDocument.module.css`:

```css
.doc {
  max-width: 720px;
  margin: 0 auto;
  padding: 6rem 1.5rem 4rem;
  color: var(--eg-cream);
}

.title {
  font-family: var(--eg-serif);
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  text-transform: uppercase;
  letter-spacing: var(--eg-track);
  color: var(--eg-cream);
}

.intro {
  margin-top: 1.25rem;
  color: var(--eg-muted);
}

.section {
  margin-top: 2.5rem;
}

.heading {
  font-family: var(--eg-serif);
  font-size: 1.2rem;
  letter-spacing: 0.1em;
  color: var(--eg-gold);
}

.body {
  margin-top: 0.85rem;
  line-height: 1.7;
  color: color-mix(in srgb, var(--eg-cream) 85%, transparent);
}

.bullets {
  margin-top: 0.85rem;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  line-height: 1.6;
  color: color-mix(in srgb, var(--eg-cream) 85%, transparent);
}

.bullets li {
  list-style: disc;
}

.updated {
  margin-top: 3rem;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--eg-cream) 50%, transparent);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/LegalDocument.dom.test.tsx --no-file-parallelism`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/LegalDocument.tsx components/LegalDocument.module.css tests/LegalDocument.dom.test.tsx
git commit -m "feat: add LegalDocument renderer

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: The dynamic route

**Files:**
- Create: `app/[lang]/infos/[slug]/page.tsx`

This task has no unit test (it is a thin wiring layer; the build's static prerender is the verification). Verification is via `npm run build`.

- [ ] **Step 1: Implement the route**

Create `app/[lang]/infos/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LANGS, LEGAL_PAGES, type Lang } from '../../../../data/types'
import { isLang, legalSlugFor, legalPageForSlug } from '../../../../lib/i18n'
import { buildMetadata } from '../../../../lib/seo/metadata'
import { legalPages, legalEntity } from '../../../../data/legal'
import { LegalDocument } from '../../../../components/LegalDocument'
import type { LegalPage } from '../../../../data/types'

export const revalidate = 3600

export function generateStaticParams() {
  return LANGS.flatMap((lang) =>
    LEGAL_PAGES.map((page) => ({ lang, slug: legalSlugFor(page, lang) })),
  )
}

function legalPathsFor(page: LegalPage): Record<Lang, string> {
  return {
    fr: `/fr/infos/${legalSlugFor(page, 'fr')}`,
    de: `/de/infos/${legalSlugFor(page, 'de')}`,
    it: `/it/infos/${legalSlugFor(page, 'it')}`,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang, slug } = await params
  if (!isLang(lang)) return {}
  const page = legalPageForSlug(slug, lang)
  if (!page) return {}
  const content = legalPages[page]
  return buildMetadata({
    lang,
    pathByLang: legalPathsFor(page),
    title: content.seoTitle[lang],
    description: content.metaDescription[lang],
  })
}

export default async function InfosPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  if (!isLang(lang)) notFound()
  const page = legalPageForSlug(slug, lang)
  if (!page) notFound()
  return <LegalDocument content={legalPages[page]} lang={lang} entity={legalEntity} />
}
```

- [ ] **Step 2: Build to verify static prerender**

Run: `npm run build`
Expected: PASS. The route table lists `/[lang]/infos/[slug]` as SSG with 18 generated paths (6 slugs × fr/de/it), e.g. `/fr/infos/cgv`, `/de/infos/impressum`, `/it/infos/spedizioni`.

- [ ] **Step 3: Commit**

```bash
git add "app/[lang]/infos/[slug]/page.tsx"
git commit -m "feat: add /{lang}/infos/{slug} trust pages route

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Footer links

**Files:**
- Modify: `components/Footer.tsx`
- Modify: `components/Footer.module.css`
- Test: `tests/Footer.dom.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/Footer.dom.test.tsx`:

```tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Footer } from '../components/Footer'

afterEach(() => cleanup())

describe('Footer', () => {
  it('links to all six trust pages with localized hrefs (fr)', () => {
    render(<Footer lang="fr" />)
    const expected = [
      '/fr/infos/mentions-legales',
      '/fr/infos/cgv',
      '/fr/infos/confidentialite',
      '/fr/infos/cookies',
      '/fr/infos/livraison',
      '/fr/infos/retours',
    ]
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    for (const href of expected) expect(hrefs).toContain(href)
  })

  it('uses the German slugs when lang is de', () => {
    render(<Footer lang="de" />)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/de/infos/impressum')
    expect(hrefs).toContain('/de/infos/datenschutz')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/Footer.dom.test.tsx --no-file-parallelism`
Expected: FAIL — current footer only renders two stub links to `/${lang}`.

- [ ] **Step 3: Implement the footer**

Replace `components/Footer.tsx` with:

```tsx
import Link from 'next/link'
import type { Lang, LegalPage } from '../data/types'
import { legalSlugFor } from '../lib/i18n'
import styles from './Footer.module.css'

const LABELS: Record<LegalPage, Record<Lang, string>> = {
  legal:    { fr: 'Mentions légales',  de: 'Impressum',       it: 'Note legali' },
  terms:    { fr: 'CGV',               de: 'AGB',             it: 'Condizioni' },
  privacy:  { fr: 'Confidentialité',   de: 'Datenschutz',     it: 'Privacy' },
  cookies:  { fr: 'Cookies',           de: 'Cookies',         it: 'Cookie' },
  shipping: { fr: 'Livraison',         de: 'Versand',         it: 'Spedizioni' },
  returns:  { fr: 'Retours',           de: 'Rückgabe',        it: 'Resi' },
}

const LEGAL_GROUP: LegalPage[] = ['legal', 'terms', 'privacy', 'cookies']
const HELP_GROUP: LegalPage[] = ['shipping', 'returns']

const NAV_ARIA: Record<Lang, { legal: string; help: string }> = {
  fr: { legal: 'Liens légaux', help: 'Aide' },
  de: { legal: 'Rechtliche Links', help: 'Hilfe' },
  it: { legal: 'Link legali', help: 'Aiuto' },
}

function linkFor(page: LegalPage, lang: Lang) {
  return (
    <Link key={page} href={`/${lang}/infos/${legalSlugFor(page, lang)}`}>
      {LABELS[page][lang]}
    </Link>
  )
}

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className={styles.footer}>
      <p className={styles.brand}>Eclipse Gold</p>
      <nav aria-label={NAV_ARIA[lang].legal} className={styles.links}>
        {LEGAL_GROUP.map((page) => linkFor(page, lang))}
      </nav>
      <nav aria-label={NAV_ARIA[lang].help} className={styles.links}>
        {HELP_GROUP.map((page) => linkFor(page, lang))}
      </nav>
      <p className={styles.trust}>
        ✦ Livraison Suisse &amp; France &nbsp; ✦ Retours 14 jours &nbsp; ✦ Paiement sécurisé
      </p>
    </footer>
  )
}
```

No `Footer.module.css` change is required — the existing `.links` rule already styles both nav groups. (If the two nav rows need spacing, the existing `gap` on `.footer` handles it.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/Footer.dom.test.tsx --no-file-parallelism`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/Footer.tsx tests/Footer.dom.test.tsx
git commit -m "feat: wire footer to real trust pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Sitemap entries

**Files:**
- Modify: `app/sitemap.ts`
- Test: `tests/legal-sitemap.test.ts`

> **Codebase convention (read first):** `app/sitemap.ts` is a single default
> `async sitemap(props: { id: Promise<string> })` that **awaits `props.id`** and
> branches on the split id (`'static'` / `'collection'` / products fallback).
> There is no `staticUrls()` helper. The legal URLs go into the `'static'`
> branch (which currently returns the 3 home URLs at priority 0.8). The function
> is async and returns a Promise — the test must `await` it with a Promise id.

- [ ] **Step 1: Write the failing test**

Create `tests/legal-sitemap.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import sitemap from '../app/sitemap'
import { abs } from '../lib/seo/metadata'

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://eclipsegold.com'
})

describe('static sitemap split includes legal pages', () => {
  it('contains the fr CGV, de Impressum and it Spedizioni URLs', async () => {
    const entries = await sitemap({ id: Promise.resolve('static') })
    const urls = entries.map((e) => e.url)
    expect(urls).toContain(abs('/fr/infos/cgv'))
    expect(urls).toContain(abs('/de/infos/impressum'))
    expect(urls).toContain(abs('/it/infos/spedizioni'))
  })

  it('adds 18 legal URLs (6 pages × 3 langs) on top of the 3 home URLs', async () => {
    const entries = await sitemap({ id: Promise.resolve('static') })
    expect(entries).toHaveLength(3 + 18)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/legal-sitemap.test.ts --no-file-parallelism`
Expected: FAIL — the `'static'` split returns only the 3 home URLs (length 3).

- [ ] **Step 3: Implement the sitemap addition**

In `app/sitemap.ts`, extend the **existing** imports. They currently are:

```ts
import { LANGS } from '../data/types'
import { COLLECTION_SLUG } from '../lib/i18n'
```

Change them to add the legal symbols:

```ts
import { LANGS, LEGAL_PAGES } from '../data/types'
import { COLLECTION_SLUG, legalSlugFor } from '../lib/i18n'
```

Then replace the `'static'` branch inside the default `sitemap` function. It is
currently:

```ts
  if (id === 'static') {
    return LANGS.map((lang) => ({ url: abs(`/${lang}`), changeFrequency: 'monthly' as const, priority: 0.8 }))
  }
```

Replace it with (home pages unchanged, plus the 18 legal URLs):

```ts
  if (id === 'static') {
    const home = LANGS.map((lang) => ({
      url: abs(`/${lang}`),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))
    const legal = LANGS.flatMap((lang) =>
      LEGAL_PAGES.map((page) => ({
        url: abs(`/${lang}/infos/${legalSlugFor(page, lang)}`),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
      })),
    )
    return [...home, ...legal]
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/legal-sitemap.test.ts --no-file-parallelism`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add app/sitemap.ts tests/legal-sitemap.test.ts
git commit -m "feat: add legal pages to the static sitemap

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Full verification & docs

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run --no-file-parallelism`
Expected: PASS — all prior tests plus the new ones (legal-i18n, legal-interpolate, validate-legal, LegalDocument, Footer, legal-sitemap). Note: in single-worker mode the suite is memory-heavy; if it OOMs, fall back to `npm test` (default parallel mode), which must be fully green.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: PASS. `prebuild` prints `✓ validate-models: models and legal content OK` plus `[À COMPLÉTER]` warnings; the route table shows `/[lang]/infos/[slug]` SSG with 18 paths and the sitemap split unchanged in count.

- [ ] **Step 3: Document the sub-project**

Append a section to `README.md`:

```markdown
## Trust pages (sub-project E)

- Six pages (CGV, mentions légales, livraison, retours, confidentialité, cookies) × 3 langs under `/{lang}/infos/{slug}` (localized slugs), statically prerendered (18 pages, ISR `revalidate = 3600`).
- Content lives in `data/legal.ts`: one `legalEntity` (referenced via `{token}` interpolation, see `lib/legal.ts`) and six `legalPageContent` objects, all `Localized<>`. Slugs resolve through `legalSlugFor` / `legalPageForSlug` in `lib/i18n.ts`.
- Rendered by `components/LegalDocument.tsx`. Footer links are localized via the same helpers.
- `scripts/validate-models.ts` now also runs `validateLegal()` (complete translations, unique slugs) and warns on `[À COMPLÉTER]` entity placeholders; it runs in `prebuild`.
- No cookie-consent banner: only strictly-necessary cookies (`eg-country`, Stripe) are used. A consent banner becomes necessary only when tracking is added.

> Before go-live: complete `legalEntity` placeholders (`companyName`, `legalForm`, `registrationId`, `publisher`) and have the drafted legal text reviewed by a professional.
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: document trust pages sub-project

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review notes

- **Spec coverage:** routing (T12), `/infos/` segment (T12), 6 pages × 3 langs (T4–T9), `data/legal.ts` typed + entity (T1, T4), tokens (T3, T11), bullets for shipping/returns/cookies (T6, T7, T9), slug helpers (T2), `LegalDocument` + CSS (T11), footer (T13), sitemap in `static` split (T14), build validation (T10), hreflang via `legalPathsFor` (T12), placeholder warnings (T10), tests (T2, T3, T10, T11, T13, T14), README (T15). All spec sections map to a task.
- **Type consistency:** `LegalPage`, `LegalEntity`, `LegalSection`, `LegalPageContent` defined in T1 and used identically everywhere; `legalSlugFor`/`legalPageForSlug` signatures consistent T2→T12/T13/T14; `interpolateEntity` signature consistent T3→T11; `validateLegal` signature consistent T10 test↔impl.
- **Placeholder scan:** the only `[À COMPLÉTER]` strings are intentional legal-entity data values (T4), explicitly surfaced by the build warning (T10) — not plan placeholders.
- **Known caveat:** legal text drafts (T4–T9) require human/professional review before go-live; flagged in commit messages and README.
