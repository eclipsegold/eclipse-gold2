# Eclipse Gold — Commerce (panier + checkout) (design)

**Date :** 2026-05-30
**Statut :** Validé (en attente de relecture utilisateur)
**Périmètre :** Sous-projet D — rendre le site transactionnel : panier fonctionnel (drawer) via Shopify Storefront Cart API + redirection vers le checkout hébergé Shopify. Remplace les stubs « Ajouter au panier » et l'icône panier désactivée.

---

## 1. Contexte

Eclipse Gold : boutique headless Next.js 16 + Shopify (dropshipping AliExpress non révélé). Sous-projets précédents livrés : data-layer (10 modèles FR/DE/IT), SEO shell + rendu (routes `/fr /de /it`, pages accueil/collection/produit, sitemaps), design premium (DA astrale). État commerce actuel :

- `data/shopify.ts` ne récupère que des données d'**affichage** (handle, titre, prix min, images, `availableForSale`) — **pas de variant ID**, aucune mutation panier.
- Le bouton « Ajouter au panier » est un **stub `disabled`** dans la barre sticky de la fiche produit.
- L'icône panier 🛒 du header est un **stub `disabled`**.
- `CurrencyContext` gère pays/devise côté client (cookie `eg-country`) ; `/api/price` est un route handler serveur (token Storefront jamais exposé).
- Produits **mono-variante** (49.90 CHF, pas de tailles).

Ce sous-projet rend l'achat fonctionnel.

### Décisions verrouillées (brainstorming 2026-05-30)

| Sujet | Choix |
|---|---|
| Modèle panier/checkout | Panier via **Storefront Cart API** + **checkout hébergé Shopify** (`checkoutUrl`) |
| UI panier | **Tiroir latéral (drawer)** glissant depuis la droite ; pas de page panier dédiée |
| Mutations panier | **Route handlers serveur** (`/api/cart`) — token Storefront côté serveur, hors bundle client (cohérent avec `/api/price`) |
| Persistance panier | ID panier Shopify dans un cookie **`eg-cart` httpOnly**, posé/lu par les route handlers |
| Marché/devise au checkout | Panier créé/requêté **`@inContext(country)`** d'après le cookie `eg-country` → checkout en CHF/EUR correct |
| Quantités | **Steppers +/-** par ligne (modifier la quantité) |
| Périmètre | **Panier complet fonctionnel** ; la dette i18n du chrome (libellés FR en dur) reste un passage séparé |

---

## 2. Architecture & flux de données

```
Fiche produit (server)                  Header (server)
  └─ <AddToCartButton handle available/> └─ <CartButton/>  (client, badge compteur)
        (client)        │                        │
                        └──── CartContext (client) ────┘
                               addItem / updateQty / removeItem / open / close
                                        │
                                        ▼
                          /api/cart route handlers (server)
                            GET · POST · PATCH · DELETE
                            lit/écrit cookie eg-cart (httpOnly) ; lit eg-country
                                        │
                                        ▼
                          data/cart.ts (Storefront Cart API, token serveur)
                            createCart · getCart · addLine · updateLine · removeLine
                                        │
                                        ▼
                          Shopify → checkoutUrl (page de paiement hébergée)
```

Principe : le client ne manipule que des **handles** (comme partout ailleurs) ; le serveur résout handle → variant ID. Le token Storefront reste serveur.

---

## 3. Couche données

### 3.1 `data/shopify.ts` (étendu)
- Ajouter le **variant ID** à la requête produit : `variants(first: 1) { nodes { id } }`.
- Ajouter `variantId: string` à l'interface `ShopifyProduct` (le `merchandiseId` pour les lignes de panier).
- Nouveau helper `getProductVariantId(handle, country): Promise<string | null>` (requête légère handle→variant id) utilisé par le route handler POST.
- Les fonctions existantes (`getShopifyProduct`) restent rétro-compatibles ; `variantId` s'ajoute au mapping retourné.

### 3.2 `data/cart.ts` (nouveau)
Mutations Storefront Cart API, toutes **serveur**, renvoyant une forme normalisée :

```ts
interface CartLine {
  id: string            // cart line id
  merchandiseId: string // variant id
  handle: string        // product handle (pour relier au catalogue)
  title: string
  quantity: number
  price: { amount: string; currencyCode: string }
  image: { url: string; altText: string | null } | null
}

interface Cart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  subtotal: { amount: string; currencyCode: string }
  lines: CartLine[]
}

createCart(country): Promise<Cart>
getCart(id, country): Promise<Cart | null>          // null si l'ID n'existe plus côté Shopify
addLine(id, variantId, quantity, country): Promise<Cart>
updateLine(id, lineId, quantity, country): Promise<Cart>   // quantity 0 = retrait
removeLine(id, lineId, country): Promise<Cart>
```

Toutes les opérations utilisent `@inContext(country: CountryCode!)`. Le `handle` de chaque ligne provient de `merchandise { ... on ProductVariant { product { handle } } }`. Mêmes garde-fous d'erreur que `getShopifyProduct` (throw sur non-ok / `errors` GraphQL).

---

## 4. Route handlers — `app/api/cart/route.ts`

Un seul fichier, méthodes REST. Lit `country` depuis le cookie `eg-country` (défaut `CH` via `DEFAULT_COUNTRY`), et l'ID panier depuis le cookie `eg-cart`.

| Méthode | Corps | Comportement |
|---|---|---|
| `GET` | — | Lit `eg-cart` ; renvoie `getCart(id, country)` ou un panier vide normalisé si pas de cookie / cart introuvable. |
| `POST` | `{ handle, quantity? }` | Résout `getProductVariantId(handle, country)` (400 si handle inconnu) ; si pas de panier → `createCart` et pose `eg-cart` httpOnly ; `addLine` ; renvoie le panier. |
| `PATCH` | `{ lineId, quantity }` | `updateLine` (quantity 0 = retrait). 400 si pas de panier / champs manquants. |
| `DELETE` | `{ lineId }` | `removeLine`. 400 si pas de panier / lineId manquant. |

- Cookie `eg-cart` : `httpOnly`, `path=/`, `sameSite=lax`, `secure` en prod, `max-age` 30 jours.
- Si l'`eg-cart` pointe vers un panier expiré côté Shopify (`getCart` → null), le traiter comme « pas de panier » (recréer au prochain POST).
- Erreurs : entrée invalide → 400 `{error}` ; échec Shopify (throw) → 502 `{error}` + `console.error` ; jamais de 500 opaque.

---

## 5. État client — `components/CartContext.tsx`

`'use client'`, monté dans `app/[lang]/layout.tsx` **à l'intérieur** de `CurrencyProvider` (le marché peut influencer un futur affichage, et les deux îlots cohabitent). Expose :

```ts
interface CartState {
  cart: Cart | null
  count: number              // cart?.totalQuantity ?? 0
  isOpen: boolean
  status: 'idle' | 'loading' | 'error'
  addItem(handle: string): Promise<void>
  updateQty(lineId: string, quantity: number): Promise<void>
  removeItem(lineId: string): Promise<void>
  open(): void
  close(): void
}
```

- Au montage : `GET /api/cart` pour hydrater (panier existant via cookie).
- Chaque mutation appelle le route handler correspondant et **remplace** `cart` par la réponse (source de vérité = serveur/Shopify).
- `status` passe `loading` pendant l'appel, `error` en cas d'échec (non bloquant, le panier précédent reste affiché).
- `addItem` ouvre le drawer après succès.
- `useCart()` hook avec garde « within CartProvider ».

---

## 6. Composants UI (CSS Modules, tokens `--eg-*`, DA cohérente)

- **`CartButton.tsx`** (`'use client'`) — icône panier dans le header + badge compteur (`count`), `onClick` → `open()`. Remplace le `<button disabled>🛒</button>` actuel de `Header.tsx`. `aria-label="Panier (N)"`.
- **`CartDrawer.tsx`** (`'use client'`) — panneau glissant depuis la droite + overlay sombre ; monté une fois (dans le layout, à côté du provider). Contenu :
  - En-tête « Panier » + bouton fermer.
  - Lignes : `SunglassImage` (réutilisé, traitement uniforme), nom serif, prix, **stepper +/-** (appelle `updateQty`), bouton retirer (`removeItem`).
  - Sous-total (devise du panier).
  - Bouton **« Passer au paiement »** → `window.location = cart.checkoutUrl` (désactivé si panier vide ou `checkoutUrl` absent).
  - État vide : « Votre panier est vide » + lien collection.
  - État `error` : message inline + bouton réessayer.
  - Respecte `prefers-reduced-motion` (transition de glissement neutralisée).
- **`AddToCartButton.tsx`** (`'use client'`) — remplace le `<button disabled>` de la barre sticky de la fiche produit. Props `{ handle: string; available: boolean }`. États *idle / loading / added* ; `onClick` → `addItem(handle)` puis ouvre le drawer. Désactivé si `!available`. Styled comme le bouton final actuel (or plein, texte noir).

**Header.tsx** : `<CartButton/>` à la place du stub. **Product page** : `<AddToCartButton handle={model.handle} available={shopify?.availableForSale ?? false} />` à la place du stub (et conserver « Bientôt disponible » quand `shopify` est null). **`[lang]/layout.tsx`** : ajouter `<CartProvider>` (sous `CurrencyProvider`) et monter `<CartDrawer/>`.

---

## 7. Gestion d'erreurs

- Mutation/échec réseau → `status: 'error'` dans le contexte ; le drawer montre un message + réessayer ; `AddToCartButton` revient à *idle*. Aucune page ne crashe.
- `eg-cart` périmé → recréation transparente au prochain ajout.
- `checkoutUrl` absent → bouton paiement désactivé.
- Route handlers : 400 (entrée), 502 (Shopify), jamais 500 opaque.

---

## 8. Rendu / SEO

- Les pages produit/collection/accueil restent **SSG + ISR** : `CartButton`, `AddToCartButton`, `CartDrawer` sont des **îlots client en feuille** (comme `Price`/`CurrencySelector`). Aucun `cookies()`/`headers()` ajouté dans les layouts/pages.
- `/api/cart` est **dynamique** (`ƒ`), comme `/api/price`.
- Aucun impact sur hreflang, canonical, JSON-LD, sitemaps.

---

## 9. Stratégie de tests

- **`data/cart.ts`** (node, fetch mocké) : `createCart`/`addLine`/`getCart` mappent correctement la réponse Storefront vers `Cart`/`CartLine` (id, checkoutUrl, totalQuantity, subtotal, lignes avec handle/quantity/price) ; `getCart` → null sur cart inexistant ; throw sur `errors` GraphQL.
- **`data/shopify.ts`** (node) : la requête produit renvoie désormais `variantId` ; `getProductVariantId` renvoie l'id ou null.
- **`app/api/cart/route.ts`** (node, module cart mocké) : GET vide sans cookie ; POST crée+ajoute et pose `eg-cart` ; PATCH/DELETE ; 400 sur entrée invalide ; 502 sur throw.
- **`CartContext`** (dom, fetch mocké) : hydrate au montage ; `addItem` met à jour `count` et ouvre le drawer ; `status` error sur échec.
- **`CartDrawer` / `CartButton` / `AddToCartButton`** (dom) : badge = count ; bouton paiement désactivé si vide ; stepper appelle updateQty ; AddToCart désactivé si `!available` ; état loading.
- **Non-régression** : les 65 tests existants restent verts ; `npx tsc --noEmit` exit 0 ; `npm run build` exit 0 (les 36 pages restent SSG, `/api/cart` dynamique).

---

## 10. Hors périmètre (sous-projets ultérieurs)

- **E** — pages confiance : CGV, mentions légales, livraison, retours (les liens footer restent des stubs).
- Dette i18n : libellés d'interface en dur en français sur `/de` et `/it` (« Ajouter au panier », « Passer au paiement », « Panier », « Votre panier est vide »…). Ce sous-projet introduit de nouvelles chaînes FR en dur, à localiser lors du passage i18n dédié.
- Variantes multiples (tailles/coloris) — les produits sont mono-variante.
- Codes promo affichés sur le site, cross-sell, page panier dédiée.
- Optimisation `next/image`.
