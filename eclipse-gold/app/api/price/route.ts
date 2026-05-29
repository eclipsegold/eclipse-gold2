import { getShopifyProduct } from '../../../data/shopify'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const handle = searchParams.get('handle')
  const country = (searchParams.get('country') ?? 'CH') as 'CH' | 'FR'
  if (!handle) {
    return Response.json({ error: 'missing handle' }, { status: 400 })
  }
  try {
    const product = await getShopifyProduct(handle, country)
    if (!product) {
      return Response.json({ error: 'not found' }, { status: 404 })
    }
    return Response.json({
      amount: product.price.amount,
      currencyCode: product.price.currencyCode,
      availableForSale: product.availableForSale,
    })
  } catch (error) {
    console.error('price route: Shopify lookup failed', error)
    return Response.json({ error: 'upstream' }, { status: 502 })
  }
}
