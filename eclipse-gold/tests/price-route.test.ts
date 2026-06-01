import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/catalog', () => ({ getCatalogProduct: vi.fn() }))
import { getCatalogProduct } from '../data/catalog'
import { GET } from '../app/api/price/route'

function req(url: string) {
  return new Request(url)
}

const product = {
  handle: 'nebula', title: 'NEBULA', availableForSale: true, variantId: 'nebula',
  price: { amount: '49.90', currencyCode: 'CHF' }, images: [],
}

beforeEach(() => {
  vi.mocked(getCatalogProduct).mockReset()
})

describe('GET /api/price', () => {
  it('returns the price for a handle and country', async () => {
    vi.mocked(getCatalogProduct).mockReturnValue(product)
    const res = await GET(req('https://x/api/price?handle=nebula&country=CH'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ amount: '49.90', currencyCode: 'CHF', availableForSale: true })
    expect(getCatalogProduct).toHaveBeenCalledWith('nebula', 'CH')
  })

  it('400s when handle is missing', async () => {
    const res = await GET(req('https://x/api/price?country=CH'))
    expect(res.status).toBe(400)
  })

  it('404s when the product is not found', async () => {
    vi.mocked(getCatalogProduct).mockReturnValue(null)
    const res = await GET(req('https://x/api/price?handle=ghost&country=FR'))
    expect(res.status).toBe(404)
  })

  it('defaults country to CH when omitted', async () => {
    vi.mocked(getCatalogProduct).mockReturnValue(product)
    await GET(req('https://x/api/price?handle=nebula'))
    expect(getCatalogProduct).toHaveBeenCalledWith('nebula', 'CH')
  })
})
