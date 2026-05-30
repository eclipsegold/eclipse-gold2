This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Data layer (Eclipse Gold)

- `data/models.ts` — the 10 sunglass models (SEO/marketing, versioned). Joined to Shopify by `handle`.
- `data/collection.ts` — the collection hub money page.
- `data/queries.ts` — pure in-memory lookups.
- `data/shopify.ts` — Storefront API product fetch (price/stock/images).
- `scripts/validate-models.ts` — build gate (unique slugs/keywords, complete translations, 10 models).

`npm run validate:models` runs automatically before every `npm run build`.
Required env vars are documented in `.env.example`.

## Routing & SEO (shell)

- Per-language routes: `/fr`, `/de`, `/it` (home), `/{lang}/{collectionSlug}` (collection), `/{lang}/{collectionSlug}/{productSlug}` (product). `npm run build` prerenders 36 pages (3 home + 3 collection + 30 product) plus 3 split sitemaps.
- Currency: `eg-country` cookie set by `proxy.ts` from `x-vercel-ip-country`; the `Price` client island resolves CHF/EUR and refetches via `/api/price`. The geo cookie is read client-side (in `CurrencyProvider`) so content pages stay statically prerendered.
- SEO: per-page canonical + hreflang (`lib/seo/metadata.ts`), JSON-LD (`lib/seo/jsonld.ts`), split sitemaps served at `/sitemap/<id>.xml` (`app/sitemap.ts`), robots (`app/robots.ts`).
- Content pages are statically prerendered with ISR (`export const revalidate = 3600`); `/api/price` is the only on-demand route.

> Notes: the middleware is named `proxy.ts` (Next 16 renamed `middleware` → `proxy`). `generateSitemaps` passes its `id` as a `Promise` in Next 16 — `app/sitemap.ts` awaits it. Product images use a plain `<img>` for this sober pass; `next/image` is deferred to the design sub-project. The product page tolerates Shopify being unavailable (renders "Bientôt disponible"), so the build succeeds without `SHOPIFY_*` env vars.

## Design system (premium)

- Tokens in `app/globals.css` (`:root` variables): black `#000`, gold `#d4af37`, cream `#f5f1e8`; Playfair Display (serif titles) + Inter (body) self-hosted via `next/font`.
- One CSS Module per component. Mono-dark theme (no light/dark).
- `components/SunglassImage.tsx` applies the uniform image treatment (black bg, square crop, gold halo) and an "EG" monogram placeholder when no image.
- `components/Reveal.tsx` + `useReveal.ts` do sober scroll-reveal (respects `prefers-reduced-motion`).
- The product page has a fixed gold price/CTA bar pinned to the viewport bottom; the "Ajouter au panier" button is a disabled stub until the commerce sub-project.

## Commerce (Stripe + Shopify/DSers)

- Cart is client-side (`components/CartContext.tsx`, localStorage `eg-cart`) holding `{handle, quantity}` only.
- Checkout (`/{lang}/checkout`) is a dynamic page using the Stripe **Payment Element** on our domain.
- `/api/checkout/intent` recomputes the amount server-side (`data/pricing.ts` → Shopify Storefront) and creates a Stripe PaymentIntent — the client price is never trusted.
- `/api/webhooks/stripe` verifies the signature and, on `payment_intent.succeeded`, creates a **paid Shopify order** via the Admin API (`data/shopify-admin.ts`), idempotent by PaymentIntent id. **DSers** detects that order and fulfils it on AliExpress.
- Shipping is free; the address is collected in the checkout form and attached to the PaymentIntent.
- Secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SHOPIFY_ADMIN_API_TOKEN`) are server-only; see `.env.example`.
- Catalogue pages stay statically prerendered; only checkout + the API routes are dynamic.

> Operational note: monitor failed `payment_intent.succeeded` webhooks in production — a payment captured without a created Shopify order means DSers won't fulfil it. The webhook returns 500 on order-creation failure so Stripe retries automatically.
