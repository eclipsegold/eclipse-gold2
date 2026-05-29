import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/shopify', () => ({
  getShopifyProduct: vi.fn(),
}))
import { getShopifyProduct } from '../data/shopify'
import { GET } from '../app/api/price/route'

function req(url: string) {
  return new Request(url)
}

beforeEach(() => {
  vi.mocked(getShopifyProduct).mockReset()
})

describe('GET /api/price', () => {
  it('returns the price for a handle and country', async () => {
    vi.mocked(getShopifyProduct).mockResolvedValue({
      handle: 'nebula', title: 'NEBULA', availableForSale: true,
      price: { amount: '49.90', currencyCode: 'CHF' }, images: [],
    })
    const res = await GET(req('https://x/api/price?handle=nebula&country=CH'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ amount: '49.90', currencyCode: 'CHF', availableForSale: true })
    expect(getShopifyProduct).toHaveBeenCalledWith('nebula', 'CH')
  })

  it('400s when handle is missing', async () => {
    const res = await GET(req('https://x/api/price?country=CH'))
    expect(res.status).toBe(400)
  })

  it('404s when the product is not found', async () => {
    vi.mocked(getShopifyProduct).mockResolvedValue(null)
    const res = await GET(req('https://x/api/price?handle=ghost&country=FR'))
    expect(res.status).toBe(404)
  })
})
