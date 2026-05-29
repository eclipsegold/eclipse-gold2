import Link from 'next/link'

export function ProductCard({
  href,
  modelName,
  tagline,
  image,
}: {
  href: string
  modelName: string
  tagline: string
  image: { url: string; alt: string } | null
}) {
  return (
    <Link href={href} className="product-card">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt={image.alt} loading="lazy" width={400} height={400} />
      )}
      <h3>{modelName}</h3>
      <p>{tagline}</p>
    </Link>
  )
}
