# Eclipse Gold — Modèle de données (design)

**Date :** 2026-05-29
**Statut :** Validé (en attente de relecture utilisateur)
**Périmètre :** Modèle de données pilotant la génération SEO programmatique du MVP.

---

## 1. Contexte

Eclipse Gold est une boutique e-commerce de lunettes solaires rimless or, 10 modèles
nommés d'après des phénomènes astronomiques (TOTALIS, HELIOS, NEBULA, UMBRA, ZENITH,
SYZYGY, PENUMBRA, PARHELION, EQUINOX, CHROMA). Prix indicatif 49.90 CHF / ~52 EUR.

**Architecture : headless.**
- **Shopify** = source de vérité catalogue (prix, devise, stock, variantes, images, checkout).
- **Next.js / Hydrogen** = front, consomme la Storefront API et génère les pages.
- Le thème Shopify Liquid (`tinker-theme`) reste en admin uniquement, non utilisé pour le front.

Ce document conçoit **uniquement le modèle de données** qui alimente la génération
programmatique des pages SEO. L'implémentation du front et la rédaction du contenu
font l'objet de cycles ultérieurs.

### Décisions verrouillées (brainstorming 2026-05-29)

| Décision | Choix |
|---|---|
| Plateforme | Headless : Shopify (catalogue/checkout) + Next.js/Hydrogen (front) |
| Données marketing/SEO | Fichier code versionné (`data/models.ts`), jointure Shopify via `handle` |
| Périmètre MVP | 10 fiches produit + 1 hub collection + pages confiance |
| Langues | FR + DE + IT (Suisse complète) |
| Devises / marchés | CHF (CH), EUR (France + Europe francophone) via Shopify Markets |
| Structure i18n | Champs localisés imbriqués `Localized<T>` (Option A) |
| seoTitle / metaDescription | Explicites par langue (contrôle total, pas de template) |

**Hors périmètre MVP (phase 2) :** pages cas d'usage, guides d'achat, journal astronomique.
Le modèle reste extensible mais ces entités ne sont pas conçues ici (YAGNI).

---

## 2. Principe SEO directeur

Les noms de modèles sont inventés → **0 volume de recherche** au lancement. Chaque fiche
produit cible donc une **requête descriptive réelle distincte** (le nom = branding, le
mot-clé descriptif = trafic). Cela évite la **cannibalisation** entre 10 pages quasi
identiques. La matrice mot-clé par modèle est portée par le champ `primaryKeyword`
(unique par langue, vérifié au build).

---

## 3. Fondations de types

```ts
// 3 langues forcées à la compilation — impossible d'oublier une traduction
type Lang = 'fr' | 'de' | 'it'
type Localized<T> = Record<Lang, T>

// Locales (langue + marché) pour routing & hreflang
type Locale = 'fr-CH' | 'de-CH' | 'it-CH' | 'fr-FR' | 'fr' // fr = x-default
// Devise dérivée du marché, NON stockée dans le data file : CH → CHF, sinon EUR (Shopify Markets)

// Énumérations partagées (attributs physiques, non traduits)
type Shape = 'oversize' | 'aviator' | 'round' | 'rectangular' | 'square' | 'cat-eye'
type Phenomenon =
  | 'totality' | 'heliacal' | 'nebula' | 'umbra' | 'zenith'
  | 'syzygy' | 'penumbra' | 'parhelion' | 'equinox' | 'chroma'
type Audience = 'femme' | 'homme' | 'unisexe'
```

**Note :** le type `Localized<T> = Record<Lang, T>` garantit à la compilation que les
3 langues sont présentes pour chaque champ traduit.

---

## 4. Schéma d'un modèle

```ts
interface SunglassModel {
  // ── Identité & jointure (partagé, non traduit) ──
  handle: string            // CLÉ de jointure Shopify (= product handle). ex: "nebula"
  modelName: string         // "NEBULA" — branding, identique dans les 3 langues
  phenomenon: Phenomenon    // lien storytelling + futur /journal (phase 2)
  order: number             // ordre d'affichage dans la collection
  featured: boolean         // mise en avant home / hero

  // ── Attributs physiques (partagé, alimente facettes & schema) ──
  shape: Shape
  audience: Audience
  polarized: boolean
  lensTint: string          // clé teinte, ex: "gold-mirror"

  // ── SEO & contenu (traduit — Localized) ──
  slug: Localized<string>           // URL par langue (nebula-or-femme / nebula-gold-damen / nebula-oro-donna)
  primaryKeyword: Localized<string> // mot-clé cible — UNIQUE par langue (anti-cannibalisation)
  seoTitle: Localized<string>       // balise <title> explicite, contrôle total
  metaDescription: Localized<string>// meta description explicite, contrôle total
  tagline: Localized<string>        // accroche hero courte
  intro: Localized<string>          // paragraphe d'intro UNIQUE par modèle (anti-thin-content)
  features: Localized<string[]>     // puces bénéfices
}
```

**Ce qui N'est PAS dans le data file** (source de vérité Shopify, via Storefront API) :
prix, devise, stock, variantes, images produit.

---

## 5. Jointure Shopify ↔ data file (flux de données)

```
Page produit  /{locale}/lunettes-de-soleil-rimless-or/{slug}/
   │
   ├─ 1. slug  → résout le SunglassModel (data/models.ts)   → SEO, copy, attributs
   └─ 2. handle → Storefront API query Shopify              → prix, images, stock, checkout
            │
            └─ merge → rendu page + JSON-LD Product/Offer (devise selon Market)
```

**Helpers (`data/shopify.ts`) :**
- `getAllModels(): SunglassModel[]`
- `getModelBySlug(slug: string, lang: Lang): SunglassModel | undefined`
- `getModelByHandle(handle: string): SunglassModel | undefined`
- fonctions de fetch Storefront API par `handle` (prix/images/stock), à détailler à l'implémentation.

---

## 6. Hub collection & pages confiance

```ts
interface CollectionHub {            // 1 seul objet — la money page principale
  seoTitle: Localized<string>
  metaDescription: Localized<string>
  intro: Localized<string>           // texte de collection unique
  modelOrder: string[]               // handles ordonnés
}
```

Cible mots-clés tête : `lunettes de soleil rimless or`, `lunettes sans monture dorée`,
`lunettes solaires or` (+ équivalents DE/IT).

**Pages confiance** (CGV, mentions légales, livraison, retours) : contenu statique
localisé (MDX ou composants Next.js, 3 langues). Hors modèle produit, non programmatique,
donc non typé ici — listées pour mémoire. Exigences légales CH/UE à respecter :
droit de rétractation 14 j, délais de livraison réels, mentions légales/imprint, pas de
faux avis ni fausse provenance (conformité UE Omnibus + signaux E-E-A-T).

---

## 7. Validation au build (garde-fou anti-drift)

Script `scripts/validate-models.ts`, exécuté au build, vérifie :

1. **Jointure** — chaque `handle` de `models.ts` résout à un produit Shopify existant.
2. **Unicité des slugs** — aucune collision d'URL au sein d'une même langue.
3. **Unicité des `primaryKeyword`** — par langue (zéro cannibalisation SEO).
4. **Complétude `Localized`** — champs traduits non vides dans les 3 langues
   (le type force la présence des clés ; le script vérifie le contenu).
5. **Couverture** — exactement 10 modèles, `order` sans doublon, `phenomenon` unique par modèle.

Le build échoue si une vérification échoue (fail-fast).

---

## 8. Organisation des fichiers

```
data/
├── models.ts          ← les 10 SunglassModel (Option A, tout-en-un)
├── collection.ts      ← CollectionHub
├── types.ts           ← Lang, Localized, Shape, Phenomenon, Locale, Audience
└── shopify.ts         ← helpers Storefront API + jointure par handle
scripts/
└── validate-models.ts ← garde-fou build
```

---

## 9. Matrice mot-clé par modèle (référence pour le contenu)

| Modèle | phenomenon | shape | audience | Mot-clé primaire FR (référence) |
|---|---|---|---|---|
| TOTALIS | totality | oversize | unisexe | lunettes de soleil rimless or oversize |
| HELIOS | heliacal | aviator | homme | lunettes solaires dorées verres miroir |
| NEBULA | nebula | cat-eye | femme | lunettes sans monture femme or |
| UMBRA | umbra | rectangular | unisexe | lunettes de soleil rimless noir et or |
| ZENITH | zenith | aviator | unisexe | lunettes solaires aviateur or sans monture |
| SYZYGY | syzygy | round | unisexe | lunettes rimless rondes or |
| PENUMBRA | penumbra | square | femme | lunettes solaires verres dégradés or |
| PARHELION | parhelion | rectangular | homme | lunettes de soleil or polarisées |
| EQUINOX | equinox | square | unisexe | lunettes sans monture unisexe or |
| CHROMA | chroma | round | femme | lunettes solaires or verres colorés |

> Les mots-clés DE/IT seront dérivés lors de la rédaction du contenu (phase suivante).
> Cette table est indicative et sera reflétée dans `data/models.ts`.

---

## 10. Décisions différées (phase 2)

- Entités `UseCase` et `JournalEntry` (cas d'usage + journal astronomique) — même
  pattern `Localized`, relations vers `handle` produits.
- Mots-clés DE/IT finalisés.
- Stratégie d'images (optimisation, alt text localisé).
