# Eclipse Gold — SEO Shell + Page Rendering (design)

**Date :** 2026-05-29
**Statut :** Validé (en attente de relecture utilisateur)
**Périmètre :** Premier sous-projet de la phase rendu — shell de routing/SEO i18n + rendu des pages (accueil, collection, 10 fiches produit) avec un design sobre. Dépend de la data-layer foundation (déjà implémentée).

---

## 1. Contexte

Eclipse Gold est une boutique headless : **Shopify** (catalogue/checkout via Storefront API) + **Next.js 16 App Router** (front) dans `eclipse-gold/`. La data-layer foundation est en place : `data/{types,models,collection,queries,shopify}.ts`, 10 modèles complets FR/DE/IT, validation au build. Ce sous-projet construit le rendu des pages au-dessus de cette fondation.

Marque premium, dropshipping non révélé mais sans fausse provenance ni faux avis (E-E-A-T + conformité UE Omnibus). Langues : FR, DE, IT. Marchés : Suisse (CHF), France + Europe francophone (EUR).

### Décomposition de la phase rendu (ce sous-projet = A+B)

| # | Sous-système | Statut |
|---|---|---|
| A | Shell routing + SEO i18n | **CE SPEC** |
| B | Rendu pages (collection + fiches) | **CE SPEC** |
| C | Design premium | sous-projet suivant |
| D | Commerce (panier/checkout, variant IDs) | sous-projet suivant |
| E | Pages confiance (CGV, mentions légales, livraison, retours) | sous-projet suivant |

### Décisions verrouillées (brainstorming 2026-05-29)

| Décision | Choix |
|---|---|
| Structure URL | Par langue : `/fr`, `/de`, `/it` (3 routes de contenu) |
| Devise | Géo-détection (CH→CHF, sinon EUR ; de/it→CHF) + sélecteur d'override |
| Stratégie de rendu | Statique + ISR ; prix résolu dynamiquement |
| Architecture prix/devise | Approche 1 (PPR, slot prix serveur) avec **repli automatique** sur l'îlot client (Approche 2) si PPR n'est pas stable dans la version Next 16 utilisée |
| Périmètre | Shell complet sobre : layout (header/nav/sélecteurs/footer) + accueil + collection + 10 fiches |
| Design | Sobre : HTML sémantique + CSS minimal (CSS Modules), composants légers réutilisables. Aucune fioriture premium. |

---

## 2. Architecture & structure de fichiers

```
app/
├── layout.tsx                          # racine : <html lang>, fonts, JSON-LD Organization/WebSite
├── [lang]/
│   ├── layout.tsx                      # valide lang ∈ fr|de|it ; Header + Footer
│   ├── page.tsx                        # accueil / landing marque
│   ├── [collection]/
│   │   ├── page.tsx                    # hub collection — valide le slug collection localisé
│   │   └── [product]/page.tsx          # fiche produit — valide le slug produit localisé
│   └── not-found.tsx
├── sitemap.ts                          # generateSitemaps : products / collection / static
├── robots.ts
middleware.ts                            # géo → cookie pays/devise ; redirige / → /fr
lib/
├── i18n.ts                             # validation lang, params statiques (réutilise data/types)
├── currency.ts                         # pays→devise, format CHF/EUR par langue
├── geo.ts                              # lecture pays via header/cookie
└── seo/
    ├── metadata.ts                     # buildMetadata par page
    └── jsonld.ts                       # builders Product/ItemList/Breadcrumb/Organization
components/
├── Header.tsx, Footer.tsx
├── LangSwitcher.tsx, CurrencySelector.tsx
├── ProductCard.tsx, CollectionGrid.tsx, ProductGallery.tsx, Breadcrumbs.tsx
└── Price.tsx                           # slot dynamique (PPR) / îlot client (repli)
```

### Segment collection localisé

`[collection]` est un segment **dynamique validé** contre le slug collection de la langue :
- `fr` → `lunettes-de-soleil-rimless-or`
- `de` → `randlose-sonnenbrillen-gold`
- `it` → `occhiali-senza-montatura-oro`

`generateStaticParams` produit le bon segment par langue. Si le segment ne correspond pas au slug collection attendu pour la langue → `notFound()`. Les futures pages confiance (`/fr/cgv`, etc., sous-projet E) seront des segments **statiques explicites** qui priment sur le segment dynamique dans le routage Next.js — pas de collision.

> Le slug collection localisé n'existe pas encore dans `data/`. Ce sous-projet ajoute une constante `COLLECTION_SLUG: Localized<string>` dans `lib/i18n.ts` (préoccupation de routing, pas de donnée produit) ; les valeurs DE/IT seront affinées à la rédaction de contenu.

---

## 3. Routing & i18n

- `generateStaticParams` à chaque niveau : langue (`fr|de|it`), puis collection (slug localisé), puis produit (10 slugs localisés par langue). Pré-génère 3 langues × 10 produits.
- `app/[lang]/layout.tsx` valide la langue via `lib/i18n.ts` (`notFound()` si invalide).
- Réutilisation de la data-layer : `LANGS`, `getAllModels()`, `getModelBySlug(slug, lang)`, `langFromLocale`.
- **Note d'intégration (reviewer)** : toujours passer `lang` (pas un `Locale` brut) à `getModelBySlug`.

---

## 4. Géo / devise / slot prix

- **`middleware.ts`** lit le pays (`x-vercel-ip-country` en prod ; défaut configurable en local), pose le cookie `eg-country`. Redirige `/` → `/fr`.
- **Résolution devise** (`lib/currency.ts`) : `currency = lang === 'fr' ? (country === 'CH' ? 'CHF' : 'EUR') : 'CHF'` (de/it = audience suisse). Fonction de formatage par langue.
- **Contenu statique (ISR)** : texte/SEO depuis `data/` (aucun appel Shopify) ; fetch produit Shopify (images, titre, disponibilité) sous ISR avec un marché par défaut (country-indépendant pour images/dispo).
- **Prix = slot dynamique** : sous PPR, composant serveur lisant le cookie géo → devise + montant `@inContext(country)`. **Repli** : `Price` en Client Component lisant la devise depuis un contexte alimenté par le cookie ; JSON-LD `Offer` rendu alors avec une devise par défaut (EUR) pour les crawlers.
- **`CurrencySelector`** réécrit le cookie `eg-country`/devise et déclenche un rafraîchissement.

> La requête Storefront actuelle renvoie `priceRange.minVariantPrice`. Pour un montant par pays, le slot prix appelle `getShopifyProduct(handle, country)` avec le pays résolu. Les variant IDs (panier) restent hors périmètre (sous-projet D).

---

## 5. Sortie SEO

- **`generateMetadata`** par page (`lib/seo/metadata.ts`) : `title`/`description` depuis `data/`, `alternates.canonical` (`https://{domain}/{lang}/…`), `alternates.languages` = hreflang `fr`/`de`/`it` + `x-default` → `fr`, OpenGraph.
- **JSON-LD** (`lib/seo/jsonld.ts`), injecté en `<script type="application/ld+json">` :
  - Fiche produit : `Product` + `Offer` (devise selon §4).
  - Collection : `ItemList` + `BreadcrumbList`.
  - Racine : `Organization` + `WebSite`.
- **Sitemaps** scindés via `generateSitemaps` (produits / collection / pages statiques) + `robots.ts`.

---

## 6. Flux de données (page produit)

```
/{lang}/{collection}/{slug}
  │
  ├─ slug + lang → getModelBySlug(slug, lang)   → SEO, copy, attributs
  └─ model.handle + country → getShopifyProduct(handle, country)  → prix, images, dispo
        │
        └─ merge → rendu page + JSON-LD Product/Offer (devise §4)
```

---

## 7. Composants (design sobre)

HTML sémantique + CSS minimal (CSS Modules). Composants légers réutilisables :
- **Header** : logo, nav, `LangSwitcher`, `CurrencySelector`, icône panier **stub** (non fonctionnel — commerce = sous-projet D).
- **Footer** : liens, mentions légales **stub** (contenu = sous-projet E).
- **ProductCard**, **CollectionGrid**, **ProductGallery**, **Breadcrumbs**, **Price**.

Aucune fioriture premium (sous-projet C).

---

## 8. Gestion d'erreurs

- `lang` invalide ou slug (collection/produit) inconnu → `notFound()` (404).
- **Produit Shopify `null`** (handle sans correspondance Shopify) → rendu du contenu avec prix « bientôt disponible » + log ; **jamais de 500** (le build ne garantit pas la résolution Shopify des handles — note du reviewer).
- Fetch Shopify en échec (throw) → error boundary locale, prix « — ».

---

## 9. Stratégie de tests

- **Unitaires** : validation i18n (`lib/i18n`), résolution + formatage devise (`lib/currency`), résolution géo (`lib/geo`), builder metadata (hreflang/canonical corrects), builders JSON-LD (formes valides).
- **Composants** : `ProductCard`, `Price` (affichage devise) via React Testing Library. Ajout de `jsdom` comme environnement de test pour ces fichiers (le `@vitejs/plugin-react` déjà installé devient utile) ; les tests de logique restent en environnement `node`.
- **Intégration** : `generateStaticParams` renvoie les bons segments localisés (3 langues × 10 produits) ; la metadata d'une fiche contient canonical + hreflang + JSON-LD attendus.
- **E2E (Playwright)** : différé.

---

## 10. Décisions différées (sous-projets suivants)

- **C** — design premium (esthétique distinctive, le cœur du positionnement).
- **D** — commerce : extension de la requête Storefront avec les variant IDs, panier, redirection checkout Shopify.
- **E** — pages confiance : contenu localisé CGV, mentions légales, livraison (délais réels), retours 14 j.
- Affinage des slugs collection DE/IT et des slugs produit (déjà dans `data/models.ts`, à confirmer vs vrais produits AliExpress — les `shape` restent des hypothèses).
- Stratégie d'images (optimisation `next/image`, alt text localisé).
