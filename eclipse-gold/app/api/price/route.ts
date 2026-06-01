import { getCatalogProduct } from '../../../data/catalog'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const handle = searchParams.get('handle')
  const country = (searchParams.get('country') ?? 'CH') as 'CH' | 'FR'
  if (!handle) {
    return Response.json({ error: 'missing handle' }, { status: 400 })
  }
  const product = getCatalogProduct(handle, country)
  if (!product) {
    return Response.json({ error: 'not found' }, { status: 404 })
  }
  return Response.json({
    amount: product.price.amount,
    currencyCode: product.price.currencyCode,
    availableForSale: product.availableForSale,
  })
}
