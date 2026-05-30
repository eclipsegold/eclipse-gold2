# Eclipse Gold — Commerce (Stripe + pont Shopify/DSers) (design)

**Date :** 2026-05-30
**Statut :** Validé (en attente de relecture utilisateur)
**Périmètre :** Sous-projet D — rendre le site transactionnel de bout en bout : panier custom (drawer) → checkout sur ton domaine avec Stripe Payment Element → webhook Stripe qui crée une commande Shopify "payée" via l'Admin API → DSers pousse vers AliExpress.

> **Remplace** la version précédente de ce fichier (qui visait le checkout hébergé Shopify + Storefront Cart API). L'architecture a changé : Stripe est le moteur de paiement, Shopify devient catalogue + système de commande (OMS) que DSers surveille.

---

## 1. Contexte & architecture

Eclipse Gold : boutique headless Next.js 16. Sous-projets livrés : data-layer (10 modèles FR/DE/IT), SEO shell + rendu (routes `/fr /de /it`, 36 pages SSG), design premium. Stripe n'existe pas encore ; le bouton « Ajouter au panier » et l'icône panier sont des stubs `disabled`.

**Décision d'architecture clé :** DSers automatise le fulfilment AliExpress en lisant les **commandes Shopify**. Donc même si le paiement passe par Stripe, il FAUT créer une commande Shopify "payée" pour que DSers fonctionne. Rôles :

- **Shopify Storefront API** (token serveur, déjà en place) : catalogue, prix, `variantId`, stock.
- **Stripe** (Payment Element sur ton domaine) : encaissement.
- **Shopify Admin API** (token serveur, NOUVEAU) : création de la commande payée après paiement Stripe.
- **DSers** : détecte la commande Shopify → commande AliExpress (hors de notre code).

```
Panier (client, drawer)  --{handle, qty}--+
                                          v
   /{lang}/checkout (ton domaine) : formulaire adresse + Stripe Payment Element
                                          |
        POST /api/checkout/intent  (serveur)
          - re-resout prix + variantId via Storefront @inContext(country)
          - recalcule le total SERVEUR (jamais le prix client)
          - cree un Stripe PaymentIntent (montant serveur, devise CHF/EUR, metadata)
          - renvoie clientSecret
                                          |
        Payment Element confirme (3DS gere par Stripe) --> /{lang}/checkout/confirmation
                                          |
        Webhook  POST /api/webhooks/stripe  (payment_intent.succeeded)
          - verifie la signature Stripe
          - idempotence (PaymentIntent id)
          - cree la commande Shopify "payee" via Admin API (lignes variantId + adresse)
                                          |
                                   DSers detecte la commande --> AliExpress
```

### Décisions verrouillées (brainstorming 2026-05-30)

| Sujet | Choix |
|---|---|
| Pont fulfilment | Stripe paie → commande Shopify "payée" via **Admin API** → DSers → AliExpress |
| Paiement | Stripe **Payment Element** (checkout sur TON domaine, pas de redirection hébergée) |
| Panier | **Custom client** (drawer), lignes `{handle, qty}`, prix **re-validés serveur** au paiement |
| Quantités | Steppers +/- |
| Livraison | **Offerte** (port 0, inclus dans le prix) ; **adresse via formulaire custom** |
| Rendu `/checkout` | **Route dynamique dédiée** sous `[lang]` ; le catalogue reste SSG |
| Mutations sensibles | Route handlers serveur ; clés Stripe secrète + token Admin Shopify jamais dans le bundle |
| Périmètre | **Flux d'achat complet de bout en bout** |

---

## 2. Couche données / serveur

| Fichier | Rôle |
|---|---|
| `data/shopify.ts` (étendu) | Ajoute `variantId` à la requête + à `ShopifyProduct` ; helper `getProductVariantId(handle, country)` |
| `data/pricing.ts` (nouveau) | `priceCart(lines, country)` : re-résout chaque `handle` → `{variantId, unitPrice, currency}`, calcule le total. **Source de vérité du montant.** Rejette un handle inconnu/indisponible. |
| `lib/stripe.ts` (nouveau) | Client Stripe serveur (clé secrète) ; helper `getStripe()` |
| `data/shopify-admin.ts` (nouveau) | `createPaidOrder({lines, address, email, currency, paymentIntentId})` via Admin API, marque la commande "paid", tag `eg-stripe` + le PaymentIntent id pour idempotence |
| `app/api/checkout/intent/route.ts` | POST `{lines, country}` → `priceCart` → `getStripe().paymentIntents.create({amount, currency, metadata})` → `{clientSecret}` |
| `app/api/webhooks/stripe/route.ts` | POST : vérif signature → sur `payment_intent.succeeded` → idempotence → `createPaidOrder` |

### `priceCart` (forme)
```ts
interface CartLineInput { handle: string; quantity: number }
interface PricedLine { handle: string; variantId: string; quantity: number; unitPrice: string }
interface PricedCart { lines: PricedLine[]; total: number; currency: 'CHF' | 'EUR' }
priceCart(lines: CartLineInput[], country: Country): Promise<PricedCart>
// throws si lines vide, handle inconnu, ou variant indisponible
```
Montant Stripe = `total` en plus petite unité (centimes) ; devise = `currencyFor(country)` (réutilise `lib/currency`).

---

## 3. Panier client — `components/CartContext.tsx`

`'use client'`, monté dans `app/[lang]/layout.tsx` (sous `CurrencyProvider`). Lignes `{handle, quantity}` persistées en `localStorage` (clé `eg-cart`), hydratées au montage.

```ts
interface CartState {
  lines: { handle: string; quantity: number }[]
  count: number
  isOpen: boolean
  addItem(handle: string): void
  updateQty(handle: string, quantity: number): void   // 0 = retrait
  removeItem(handle: string): void
  clear(): void
  open(): void
  close(): void
}
```

Le panier ne stocke **que** handle + quantité. Le prix d'affichage vient du catalogue/`Price` déjà en place ; **le montant qui engage le paiement est recalculé serveur** par `priceCart`. `useCart()` avec garde « within CartProvider ».

---

## 4. Composants UI (CSS Modules, tokens `--eg-*`, DA cohérente)

- **`CartButton.tsx`** — icône panier + badge `count` dans le header ; `onClick` → `open()`. Remplace le stub `<button disabled>`. `aria-label="Panier (N)"`.
- **`CartDrawer.tsx`** — tiroir latéral droit + overlay ; lignes (`SunglassImage`, nom serif, prix, **stepper +/-** → `updateQty`, retirer), sous-total **indicatif**, bouton « Passer au paiement » → `/{lang}/checkout` (désactivé si vide). État vide + `prefers-reduced-motion`.
- **`AddToCartButton.tsx`** — props `{ handle, available }` ; remplace le stub fiche ; `addItem(handle)` puis ouvre le drawer ; désactivé si `!available` ; styled comme le bouton final actuel. La fiche garde « Bientôt disponible » quand `shopify` est null.
- **`CheckoutForm.tsx`** — client ; formulaire adresse (email, prénom, nom, adresse, ville, CP, pays) + Stripe **Payment Element** ; au submit : POST intent → `stripe.confirmPayment` → redirige confirmation.

Montés : `<CartProvider>` + `<CartDrawer/>` dans `[lang]/layout.tsx` ; `<CartButton/>` dans `Header.tsx` ; `<AddToCartButton/>` dans la barre sticky de la fiche.

---

## 5. Pages checkout

- **`app/[lang]/checkout/page.tsx`** — route **dynamique** (pas SSG). Rend `<CheckoutForm/>` (client) + récap panier + « Livraison offerte ». Wrappée dans le `<Elements>` Stripe (clé publique). `noindex`.
- **`app/[lang]/checkout/confirmation/page.tsx`** — confirmation (lit le PaymentIntent status via param de retour Stripe) ; vide le panier client ; DA cohérente ; `noindex`.

---

## 6. Gestion d'erreurs & idempotence

- **Prix re-validé serveur** : un panier au prix trafiqué est rejeté (le client ne fixe jamais le montant).
- **Webhook idempotent** : avant `createPaidOrder`, vérifier qu'aucune commande Shopify ne porte déjà ce PaymentIntent id (tag/note) ; sinon ignorer (Stripe peut rejouer le webhook).
- **Paiement réussi mais création commande Shopify échoue** : `console.error` + alerte ; renvoyer 500 au webhook pour que **Stripe réessaie** (retry intégré = filet) ; ne jamais perdre une commande payée.
- Panier vide / handle inconnu / total 0 → 400 sur `/api/checkout/intent`.
- Signature webhook invalide → 400, pas de traitement.

---

## 7. Sécurité

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SHOPIFY_ADMIN_API_TOKEN` : **serveur uniquement**, documentés dans `.env.example`. Seule `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` est exposée (par design).
- Webhook : signature Stripe vérifiée obligatoirement avant tout traitement.
- Montant + devise **toujours** calculés serveur via `priceCart`.
- Le client ne voit que le `clientSecret` du PaymentIntent (rôle prévu).

---

## 8. Rendu / SEO

- Catalogue (accueil/collection/produit, 36 pages) reste **SSG + ISR** : `CartButton`, `AddToCartButton`, `CartDrawer` sont des îlots client en feuille.
- **Dynamiques** : `/{lang}/checkout`, `/{lang}/checkout/confirmation`, `/api/checkout/intent`, `/api/webhooks/stripe` (+ `/api/price` existant).
- Pages checkout : `noindex`.
- Aucun impact sur hreflang/canonical/JSON-LD/sitemaps du catalogue.

---

## 9. Stratégie de tests

- **`data/shopify.ts`** (node) : la requête renvoie `variantId` ; `getProductVariantId` → id ou null.
- **`data/pricing.ts`** (node, Storefront mocké) : total correct multi-lignes ; rejette handle inconnu / panier vide ; devise selon country.
- **`data/shopify-admin.ts`** (node, fetch mocké) : `createPaidOrder` mappe lignes (variantId+qty) + adresse + tag PaymentIntent ; throw sur erreur Admin.
- **`app/api/checkout/intent`** (node, stripe + pricing mockés) : PaymentIntent au bon montant/devise ; 400 panier vide ; metadata posée.
- **`app/api/webhooks/stripe`** (node) : signature invalide → 400 ; `payment_intent.succeeded` → `createPaidOrder` ; **idempotence** (2e event → pas de doublon) ; échec Admin → 500 (retry Stripe).
- **`CartContext`** (dom) : add/update/remove, persistence localStorage, count, open au add.
- **Composants** (dom) : CartButton badge ; CartDrawer stepper/retrait/bouton désactivé si vide ; AddToCartButton désactivé si `!available` ; CheckoutForm submit appelle intent (Stripe mocké).
- **Non-régression** : 65 tests existants verts ; `npx tsc --noEmit` exit 0 ; `npm run build` exit 0 (36 pages restent SSG ; checkout + api dynamiques).

---

## 10. Variables d'environnement (`.env.example`)

```
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
# Shopify Admin (creation de commande pour DSers)
SHOPIFY_ADMIN_API_TOKEN=shpat_xxx
SHOPIFY_ADMIN_API_VERSION=2025-01
```
(Les vars Storefront existent déjà.)

---

## 11. Hors périmètre (sous-projets ultérieurs)

- **E** — pages confiance : CGV, mentions légales, livraison, retours (souvent exigées par Stripe à l'activation ; liens footer restent des stubs).
- Dette i18n : ce sous-projet ajoute des chaînes FR en dur (formulaire, « Passer au paiement », « Livraison offerte », confirmation) — à localiser au passage i18n dédié.
- Variantes multiples (mono-variante ici), codes promo, comptes clients, emails transactionnels custom (Shopify/Stripe envoient les leurs).
- Frais de port variables / calcul dynamique (livraison offerte ici).
- `next/image`.
