import { siteUrl, abs } from './metadata'
import { legalEntity } from '../../data/legal'

export interface ProductLdArgs {
  name: string
  description: string
  url: string
  image: string[]
  price: string
  currency: string
  availability: boolean
}

export function productJsonLd(a: ProductLdArgs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product' as const,
    name: a.name,
    description: a.description,
    url: a.url,
    image: a.image,
    brand: { '@type': 'Brand', name: 'Eclipse Gold' },
    offers: {
      '@type': 'Offer' as const,
      url: a.url,
      price: a.price,
      priceCurrency: a.currency,
      availability: a.availability
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  }
}

export function collectionJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList' as const,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem' as const,
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  }
}

export function breadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList' as const,
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem' as const,
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization' as const,
    name: 'Eclipse Gold',
    url: siteUrl(),
    logo: abs('/opengraph-image'),
    contactPoint: {
      '@type': 'ContactPoint' as const,
      email: legalEntity.email,
      contactType: 'customer service',
      areaServed: ['CH', 'FR'],
      availableLanguage: ['fr', 'de', 'it'],
    },
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite' as const,
    name: 'Eclipse Gold',
    url: siteUrl(),
  }
}
