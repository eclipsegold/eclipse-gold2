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
  if (Array.isArray(json?.errors) && json.errors.length > 0) {
    const message = json.errors.map((e: { message?: string }) => e.message ?? 'unknown').join('; ')
    throw new Error(`Storefront API errors: ${message}`)
  }
  const p = json?.data?.product
  if (!p) return null

  return {
    handle: p.handle,
    title: p.title,
    availableForSale: p.availableForSale,
    price: p.priceRange.minVariantPrice,
    images: p.images?.nodes ?? [],
  }
}
