import type { MetadataRoute } from 'next'
import { siteUrl } from '../lib/seo/metadata'

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: [
      `${base}/sitemap/products.xml`,
      `${base}/sitemap/collection.xml`,
      `${base}/sitemap/static.xml`,
    ],
  }
}
