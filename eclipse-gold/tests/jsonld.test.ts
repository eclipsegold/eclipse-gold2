import { describe, it, expect } from 'vitest'
import { productJsonLd, collectionJsonLd, organizationJsonLd, breadcrumbJsonLd } from '../lib/seo/jsonld'

describe('jsonld builders', () => {
  it('builds a Product with an Offer', () => {
    const ld = productJsonLd({
      name: 'NEBULA', description: 'D', url: 'https://eclipsegold.com/fr/c/nebula-or-femme',
      image: ['https://cdn/nebula.jpg'], price: '49.90', currency: 'CHF', availability: true,
    })
    expect(ld['@type']).toBe('Product')
    expect(ld.offers['@type']).toBe('Offer')
    expect(ld.offers.priceCurrency).toBe('CHF')
    expect(ld.offers.price).toBe('49.90')
    expect(ld.offers.availability).toBe('https://schema.org/InStock')
  })

  it('marks out-of-stock availability', () => {
    const ld = productJsonLd({
      name: 'X', description: 'D', url: 'u', image: [], price: '1', currency: 'EUR', availability: false,
    })
    expect(ld.offers.availability).toBe('https://schema.org/OutOfStock')
  })

  it('builds an ItemList for the collection', () => {
    const ld = collectionJsonLd([
      { name: 'A', url: 'https://x/a' },
      { name: 'B', url: 'https://x/b' },
    ])
    expect(ld['@type']).toBe('ItemList')
    expect(ld.itemListElement).toHaveLength(2)
    expect(ld.itemListElement[0].position).toBe(1)
  })

  it('builds Organization and Breadcrumb', () => {
    expect(organizationJsonLd()['@type']).toBe('Organization')
    const bc = breadcrumbJsonLd([{ name: 'Home', url: 'u1' }, { name: 'Coll', url: 'u2' }])
    expect(bc['@type']).toBe('BreadcrumbList')
    expect(bc.itemListElement[1].position).toBe(2)
  })
})
