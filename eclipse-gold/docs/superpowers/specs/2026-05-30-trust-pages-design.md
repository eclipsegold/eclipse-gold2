# Sous-projet E — Pages de confiance (légal & aide)

**Date :** 2026-05-30
**Statut :** conçu, en attente de validation finale du spec
**Portée :** 6 pages de confiance, 3 langues, prérendues statiquement

## 1. Objectif & périmètre

Ajouter les pages de confiance légalement/commercialement nécessaires à la
boutique Eclipse Gold, dans le même pattern que le reste du site (contenu typé
dans `data/*.ts`, `Localized<T>`, rendu statique avec ISR, SEO canonical +
hreflang).

**6 pages** × **3 langues** (`fr`/`de`/`it`) = **18 pages statiques** :

| Clé page | Rôle | FR | DE | IT |
|---|---|---|---|---|
| `terms` | CGV | `cgv` | `agb` | `condizioni-vendita` |
| `legal` | Mentions légales | `mentions-legales` | `impressum` | `note-legali` |
| `shipping` | Livraison | `livraison` | `versand` | `spedizioni` |
| `returns` | Retours | `retours` | `ruckgabe` | `resi` |
| `privacy` | Confidentialité (RGPD) | `confidentialite` | `datenschutz` | `privacy` |
| `cookies` | Cookies | `cookies` | `cookies` | `cookie` |

URLs sous un segment parent isolé : `/{lang}/infos/{slug}`
(ex. `/fr/infos/cgv`, `/de/infos/impressum`, `/it/infos/spedizioni`).

**Hors périmètre (YAGNI) :**
- Bannière de consentement cookies (aucun script de tracking installé à ce jour —
  seulement le cookie fonctionnel `eg-country` + Stripe). La page Cookies décrit
  la politique ; le consentement sera un sous-projet à part le jour où un
  Meta Pixel / GA sera ajouté.
- Page hub `/aide` dédiée. Les liens vivent dans le footer enrichi.
- JSON-LD sur ces pages (pas de type schema.org pertinent ; non forcé).

## 2. Décisions de conception (validées)

1. **Routage :** route dynamique unique sous segment parent `/infos/` →
   `app/[lang]/infos/[slug]/page.tsx`. Le segment parent évite tout conflit de
   résolution avec le `[collection]` existant au même niveau.
2. **Contenu :** source unique typée `data/legal.ts` — entité légale écrite une
   fois, contenu des 6 pages en sections `Localized<>`.
3. **Slugs :** localisés par langue (cohérent avec `COLLECTION_SLUG`).
4. **Corps de texte :** paragraphes en texte brut (`body: string[]`) + **listes
   à puces optionnelles** (`bullets?`) utilisées par livraison/retours/cookies.
5. **Entité DRY :** mécanisme de **tokens** (`{companyName}`, `{email}`,
   `{vatId}`…) interpolés à l'affichage, jamais dupliqués dans le contenu.
6. **Validation build :** étendue dans `scripts/validate-models.ts`.
7. **Sitemap :** ajoutées au split `static` existant (pas de nouveau split).

## 3. Architecture

### 3.1 Route — `app/[lang]/infos/[slug]/page.tsx`

Server Component statique, même squelette que `[collection]/page.tsx` :

```tsx
export const revalidate = 3600

export function generateStaticParams() {
  // 18 couples : LEGAL_PAGES × LANGS, slug = legalSlugFor(page, lang)
}

export async function generateMetadata({ params }) {
  const { lang, slug } = await params
  if (!isLang(lang)) return {}
  const page = legalPageForSlug(slug, lang)
  if (!page) return {}
  const content = legalPages[page]
  return buildMetadata({
    lang,
    pathByLang: legalPathsFor(page),   // chaque langue → /{l}/infos/{legalSlugFor(page, l)}
    title: content.seoTitle[lang],
    description: content.metaDescription[lang],
  })
}

export default async function LegalPage({ params }) {
  const { lang, slug } = await params
  if (!isLang(lang)) notFound()
  const page = legalPageForSlug(slug, lang)
  if (!page) notFound()
  return <LegalDocument content={legalPages[page]} lang={lang} entity={legalEntity} />
}
```

**Subtilité hreflang :** `pathByLang` (alias `legalPathsFor(page)`) doit pointer
vers `/{l}/infos/{legalSlugFor(page, l)}` pour **chaque** langue `l`, pas vers le
slug courant — sinon les alternates cassent entre langues.

### 3.2 Composant — `components/LegalDocument.tsx` (+ `.module.css`)

Présentationnel pur, thème mono-dark / gold cohérent avec le design system.

- `<article>` : `<h1>` (title) + chapô `intro` si non vide.
- Une `<section>` par `LegalSection` : `<h2>` (heading) → `<p>` pour chaque
  paragraphe de `body` → `<ul>` des `bullets` si présentes.
- Pied de document : « Dernière mise à jour : {updatedAt} », formaté selon `lang`.
- **Interpolation de tokens d'entité** : remplace `{companyName}`, `{email}`,
  `{vatId}`, etc. dans les textes au rendu. Un seul point de vérité (l'entité).

### 3.3 Footer — `components/Footer.tsx`

Remplace les 2 stubs actuels (qui pointent vers `/${lang}`) par les vrais liens,
en 2 groupes :
- **Légal :** Mentions légales · CGV · Confidentialité · Cookies
- **Aide :** Livraison · Retours

`href` construits via `legalSlugFor(page, lang)` (jamais codés en dur). Libellés
localisés. `aria-label` conservés.

## 4. Modèle de données

### 4.1 Types — ajouts dans `data/types.ts`

```ts
export const LEGAL_PAGES = [
  'terms', 'legal', 'shipping', 'returns', 'privacy', 'cookies',
] as const
export type LegalPage = (typeof LEGAL_PAGES)[number]

export interface LegalEntity {
  companyName: string          // raison sociale
  legalForm: string            // forme juridique + capital si applicable
  address: string[]            // lignes d'adresse
  country: string
  vatId: string                // TVA / mention non assujetti
  registrationId: string       // IDE (CHE…)
  email: string                // contact client
  privacyEmail: string         // contact RGPD / confidentialité
  publisher: string            // directeur de publication
  host: string[]               // hébergeur
}

export interface LegalSection {
  heading: Localized<string>
  body: Localized<string[]>    // paragraphes texte brut (rendus en <p>)
  bullets?: Localized<string[]> // puces optionnelles (rendues en <ul> après body)
}

export interface LegalPageContent {
  slug: Localized<string>      // slug d'URL localisé
  seoTitle: Localized<string>
  metaDescription: Localized<string>
  title: Localized<string>     // <h1>
  intro: Localized<string>     // chapô (string vide acceptée)
  sections: LegalSection[]
  updatedAt: string            // date ISO en dur (pas Date.now())
}
```

### 4.2 Contenu — `data/legal.ts` (nouveau)

```ts
export const legalEntity: LegalEntity = { … }
export const legalPages: Record<LegalPage, LegalPageContent> = {
  terms, legal, shipping, returns, privacy, cookies,
}
```

**Valeurs d'entité fournies (2026-05-30) :**

| Champ | Valeur |
|---|---|
| `companyName` | `[À COMPLÉTER]` |
| `legalForm` | `[À COMPLÉTER]` |
| `address` | Genève, Suisse |
| `country` | Suisse |
| `vatId` | Non assujetti à la TVA (à compléter si applicable) |
| `registrationId` | IDE : `[À COMPLÉTER]` |
| `email` | eclipsegold@outlook.fr |
| `privacyEmail` | eclipsegold@outlook.fr |
| `publisher` | `[À COMPLÉTER — nom du propriétaire]` |
| `host` | Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA |

Les `[À COMPLÉTER]` sont des placeholders **explicites et visibles**, jamais
inventés. À renseigner avant mise en production réelle.

**Paramètres opérationnels (alimentent CGV / livraison / retours) :**
- Établissement : Genève (Suisse). Régime applicable : droit suisse (CO/LCD),
  et RGPD pour les clients de l'UE.
- Livraison : **offerte partout**. Délais **7–21 jours ouvrés** selon destination.
  Transporteur « selon destination ». Modèle dropshipping.
- Retours : **14 jours** (droit de rétractation), **frais de retour à la charge
  du client**.
- Paiement : **CB, Apple Pay, Google Pay** via Stripe (Payment Element).

### 4.3 Helpers — `lib/i18n.ts`

Symétriques de `collectionSlugFor` / `langForCollectionSlug` :

```ts
export function legalSlugFor(page: LegalPage, lang: Lang): string
export function legalPageForSlug(slug: string, lang: Lang): LegalPage | undefined
```

Alimentent `generateStaticParams`, la résolution slug→contenu, et le footer.

## 5. SEO, sitemap, robots

- **Métadonnées** : `seoTitle` / `metaDescription` localisés → `buildMetadata`.
  Canonical + hreflang via `legalPathsFor(page)` (chaque langue → son slug).
- **Sitemap** : ajouter les 18 URLs au split **`static`** existant
  (`app/sitemap.ts`), chacune avec ses `alternates.languages`.
- **robots** : déjà permissif — rien à modifier.
- **JSON-LD** : aucun (hors périmètre).

## 6. Cas limites & robustesse

- Slug inconnu / lang invalide → `notFound()` (rend le `not-found.tsx` existant).
- Collision de slug : isolation via `/infos/` + unicité interne garantie par la
  validation build.
- Champs d'entité non fournis : placeholders `[À COMPLÉTER]` visibles ; la
  validation build peut émettre un **warning non bloquant** si un champ vaut
  encore le placeholder (éviter une mise en ligne accidentelle de mentions
  vides, sans casser le build pendant le dev).
- Build sans secrets : pages 100 % statiques, aucune dépendance Shopify/Stripe.
- `updatedAt` : date en dur (pas `Date.now()`), formatée par langue à l'affichage.

## 7. Validation au build — `scripts/validate-models.ts`

Étendre le build gate existant pour les pages légales :
- les 6 `LEGAL_PAGES` sont présentes dans `legalPages` ;
- traductions complètes (`title`, `seoTitle`, `metaDescription`, et pour chaque
  section `heading`/`body`, plus `bullets` si défini) dans les 3 langues ;
- slugs uniques par langue et sans collision avec le slug de collection ;
- warning (non bloquant) si un champ d'entité vaut encore `[À COMPLÉTER]`.

## 8. Tests (Vitest)

- `lib/i18n` (node) : `legalSlugFor` / `legalPageForSlug` — round-trip 3 langues,
  slug inconnu → `undefined`.
- validation (node) : 6 pages présentes, traductions complètes, slugs uniques,
  pas de collision avec la collection.
- `LegalDocument.dom.test.tsx` : rend titre + sections + puces, interpole un
  token d'entité, affiche la date.
- (optionnel) footer : expose les 6 liens avec les bons `href` localisés.

## 9. Fichiers touchés / créés

| Fichier | Action |
|---|---|
| `data/types.ts` | + types légaux |
| `data/legal.ts` | **nouveau** — entité + 6 pages |
| `lib/i18n.ts` | + `legalSlugFor`, `legalPageForSlug` |
| `app/[lang]/infos/[slug]/page.tsx` | **nouveau** — route (18 pages) |
| `components/LegalDocument.tsx` + `.module.css` | **nouveau** — renderer |
| `components/Footer.tsx` | liens réels (remplace les stubs) |
| `app/sitemap.ts` | + 18 URLs (split `static`) |
| `scripts/validate-models.ts` | + validation pages légales |
| `tests/…` | i18n, validation, LegalDocument, footer |

## 10. Critères de succès

- `/{lang}/infos/{slug}` rend les 6 pages dans les 3 langues, prérendues
  statiquement (18 pages au build).
- Canonical + hreflang corrects entre langues.
- Footer pointe vers les vraies pages (plus de stubs `/${lang}`).
- `npm run build` réussit (validation incluse) ; `npm test` vert.
- Aucune donnée légale inventée : placeholders explicites là où l'info manque.
