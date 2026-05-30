# Eclipse Gold — Habillage premium (design)

**Date :** 2026-05-30
**Statut :** Validé (en attente de relecture utilisateur)
**Périmètre :** Sous-projet C — appliquer la direction artistique « maison de joaillerie astrale » à tout le front existant (hero, collection, fiche produit, shell, breadcrumbs, 404). Aucune nouvelle page.

---

## 1. Contexte

Eclipse Gold : boutique headless Next.js 16 + Shopify (dropshipping AliExpress non révélé). Les sous-projets précédents ont livré la data-layer et le rendu SEO « sobre » : routes par langue `/fr /de /it`, pages accueil/collection/produit, composants en classes sémantiques (`.product-card`, `.site-header`, `.cta`…), 59 tests verts, build OK. `app/globals.css` est encore le boilerplate create-next-app (Arial, thème light/dark).

Ce sous-projet **habille** cet existant. But business : que le site paraisse 100 % premium, qu'aucun visiteur ne devine le dropshipping. Trafic majoritaire = pub TikTok/Instagram sur mobile → **mobile-first**.

### Direction artistique (donnée par l'utilisateur)

- Couleurs : noir profond `#000`, or `#d4af37`, texte crème `#f5f1e8`.
- Typo : serif élégante en titres (capitales espacées, très luxe) ; Inter pour prix et texte courant.
- Esthétique : maison de joaillerie / astronomie, sobre, beaucoup d'espace, pas chargé.
- Références d'ambiance : Jacques Marie Mage, Gentle Monster — version astrale.
- Fil conducteur : « wear the sun », les phénomènes astronomiques comme motif visuel.

### Décisions verrouillées (brainstorming 2026-05-30, via compagnon visuel)

| Sujet | Choix |
|---|---|
| Hero accueil | **A — Galerie éclipse** : wordmark + anneau d'éclipse lumineux, aucun produit au-dessus de la ligne de flottaison, le produit se révèle au scroll |
| Page collection | **B — Éditoriale pleine largeur** : 1 modèle par ligne, grand format, chaque modèle avec son phénomène astronomique |
| Fiche produit | **B+C — Immersive + barre CTA collante** : hero image immersif + storytelling astral, barre prix/CTA `sticky bottom` qui ne disparaît jamais |
| Imagerie produit | **Traitement CSS uniforme** : photos fournisseur enveloppées (fond noir forcé, cadrage carré, halo doré, éclairage homogène) — fonctionne avec les vraies photos AliExpress |
| Animations | **Révélations sobres au scroll** (IntersectionObserver) + anneau d'éclipse qui « respire » ; tout désactivé sous `prefers-reduced-motion` |
| Implémentation CSS | **CSS Modules + design tokens** (`:root` variables), un module par composant, zéro nouvelle dépendance |
| Polices | **Playfair Display + Inter via `next/font/google`** (self-host, pas de requête externe runtime) |
| Périmètre | **Habiller tout l'existant**, pas de nouvelle page |
| Bouton « Ajouter au panier » | **Stub désactivé stylé comme final** (commerce réel = sous-projet D) |

---

## 2. Design tokens (`app/globals.css`)

Remplace intégralement le boilerplate actuel. Variables sur `:root` :

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

  --eg-track: 0.3em;     /* letter-spacing capitales */
  --eg-s1: 0.5rem; --eg-s2: 1rem; --eg-s3: 1.5rem;
  --eg-s4: 2.5rem; --eg-s5: 4rem; --eg-s6: 6rem;
}
```

- Reset minimal (box-sizing, margins, `a{color:inherit;text-decoration:none}`).
- `body` : fond `--eg-black`, couleur `--eg-cream`, `font-family: var(--eg-sans)`, antialiasing.
- **Supprimer** le bloc `prefers-color-scheme` light/dark (site mono-thème noir).
- Bloc global `@media (prefers-reduced-motion: reduce)` neutralisant animations/transitions.

> `--font-playfair` / `--font-inter` sont injectées par `next/font` (section 3).

---

## 3. Polices (`app/layout.tsx`)

```ts
import { Playfair_Display, Inter } from 'next/font/google'
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','600'], variable: '--font-playfair', display: 'swap' })
const inter = Inter({ subsets: ['latin'], weight: ['400','500'], variable: '--font-inter', display: 'swap' })
```

Appliquer `className={`${playfair.variable} ${inter.variable}`}` sur `<html>`. Self-host automatique (zéro appel Google Fonts au runtime → RGPD-friendly), zéro layout shift. Le `lang` reste posé sur `<main>` par le `[lang]` layout (inchangé).

---

## 4. Architecture CSS — un CSS Module par composant

Aucun composant structurel nouveau hormis `SunglassImage` (§5) et `useReveal` (§6). On branche les modules sur les classes/éléments déjà rendus.

| Cible | Module | Rôle visuel |
|---|---|---|
| `app/[lang]/page.tsx` | `home.module.css` | Hero galerie éclipse : anneau lumineux « respirant », wordmark serif capitales, sous-titre, CTA bordé or, 1er modèle teasé sous la ligne de flottaison |
| `components/CollectionGrid.tsx` + `components/ProductCard.tsx` | `collection.module.css` | Éditorial pleine largeur, 1/ligne, label phénomène en or, nom serif, prix or, image traitée |
| `app/[lang]/[collection]/[product]/page.tsx` | `product.module.css` | Hero image immersif, citation/storytelling serif, liste features, bandeau confiance, conteneur de la barre sticky |
| `components/Header.tsx`, `Footer.tsx`, `LangSwitcher.tsx`, `CurrencySelector.tsx` | `shell.module.css` | Header sticky translucide (`backdrop-filter`), wordmark, sélecteurs discrets, icône panier stub ; footer sobre + liens + bandeau confiance |
| `components/Breadcrumbs.tsx`, `app/[lang]/not-found.tsx` | `misc.module.css` | Fil d'Ariane discret ; 404 astrale (anneau + message) |

**Convention :** chaque composant importe son module et applique les classes via `styles.x`. Les classes sémantiques actuelles (`className="product-card"`…) deviennent `className={styles.card}` etc. Les modules vivent à côté du composant (`components/ProductCard.module.css`) ; pour les pages, dans un dossier `app/[lang]/.../*.module.css` co-localisé.

---

## 5. Traitement image uniforme — `components/SunglassImage.tsx`

Le principal bouclier anti-dropshipping. Petit composant serveur enveloppant l'`<img>` :

```tsx
// props: { src: string; alt: string; size?: 'card' | 'hero' | 'thumb' }
```

- Conteneur carré (`aspect-ratio:1`), `background: var(--eg-black)`, `overflow:hidden`.
- `<img>` en `object-fit:cover`, `loading="lazy"`, largeur/hauteur fixées (anti-CLS).
- Halo doré en pseudo-élément `::after` (radial gold→transparent) pour unifier l'éclairage.
- Plain `<img>` conservé (next/image reste différé) ; conserver les `eslint-disable @next/next/no-img-element`.

`ProductCard` et `ProductGallery` remplacent leurs `<img>` bruts par `SunglassImage`. Résultat : N photos fournisseur hétérogènes → N vignettes visuellement identiques et premium.

Si `src` absent (Shopify null), afficher un placeholder traité (fond noir + halo + monogramme « EG » serif) plutôt qu'une image cassée.

---

## 6. Animations — `components/useReveal.ts` (+ Reveal wrapper)

- Hook client `useReveal()` basé sur `IntersectionObserver` : ajoute une classe `is-visible` quand l'élément entre dans le viewport (une fois).
- Petit composant client `Reveal` (`'use client'`) enveloppant des sections serveur : applique l'état initial (opacité 0 + translateY léger) → transition vers visible. Le contenu enfant reste rendu côté serveur (RSC passé en children).
- Anneau d'éclipse du hero : keyframes CSS `breathe` (glow qui pulse doucement, 6s).
- **`prefers-reduced-motion: reduce`** : le hook révèle immédiatement (pas d'observer), les keyframes sont neutralisées par le bloc global du §2.

YAGNI : pas de parallaxe, pas de transitions de page, pas de librairie d'animation.

---

## 7. Barre prix/CTA collante (fiche produit)

- La zone prix + bouton de la fiche produit devient `position: sticky; bottom: 0` sur mobile, fond translucide foncé + filet or en haut.
- Intégrée au composant client existant `Price` (déjà `'use client'`) et à son conteneur dans la page produit, pour rester visible pendant le scroll.
- Le bouton « Ajouter au panier » est un **stub désactivé** (`disabled`) stylé comme le bouton final (or plein, texte noir). Le commerce réel (panier, checkout) = sous-projet D.
- Le prix affiché reste piloté par l'îlot `Price` (devise géo client-side), inchangé fonctionnellement.

---

## 8. Accessibilité & performance

- Contraste : crème `#f5f1e8` sur noir `#000` = ~17:1 ; or `#d4af37` sur noir ≈ 8:1 — OK AA/AAA pour le texte ; l'or n'est jamais utilisé seul pour du texte fin critique.
- Tout focus visible (outline or). Les sélecteurs (langue/devise) gardent leurs `aria-label` existants.
- `prefers-reduced-motion` respecté globalement.
- Polices `display:swap` + self-host ; plain `<img>` lazy avec dimensions (anti-CLS). Pas de JS d'animation lourd.
- Le rendu reste majoritairement statique (SSG+ISR) ; seuls les îlots client existants (`Price`, `CurrencySelector`, `Reveal`) sont interactifs.

---

## 9. Stratégie de tests

Le design est surtout du CSS (non testé unitairement), mais la logique nouvelle l'est :

- **`SunglassImage`** (dom test) : rend une `<img>` avec `src`/`alt` quand `src` fourni ; rend le placeholder monogramme quand `src` absent.
- **`useReveal` / `Reveal`** (dom test) : applique l'état visible (mock d'IntersectionObserver) ; révèle immédiatement sous `prefers-reduced-motion` simulé.
- **Non-régression** : la suite existante (59 tests) doit rester verte ; `npx tsc --noEmit` exit 0 ; `npm run build` exit 0 (les pages doivent continuer à prérendre — vérifier qu'aucun import CSS Module ni `next/font` ne casse le build ni ne force le dynamique).
- Pas de test visuel/snapshot pixel (hors périmètre, fragile).

---

## 10. Hors périmètre (sous-projets ultérieurs)

- **D** — commerce : panier, checkout Shopify, variant IDs (le CTA reste stub ici).
- **E** — pages confiance : contenu réel CGV/mentions légales/livraison/retours (les liens footer restent des stubs vers `/{lang}`).
- Journal/éditorial astronomique, lookbook (phase 2 éditoriale).
- `next/image` optimisé (différé ; plain `<img>` traité ici).
- Polices Didot/Bodoni réelles (licence payante) — Playfair Display utilisé comme serif luxe libre en attendant.
