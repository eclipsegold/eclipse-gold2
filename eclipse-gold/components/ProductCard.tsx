import Link from 'next/link'
import { SunglassImage } from './SunglassImage'
import styles from './ProductCard.module.css'

export function ProductCard({
  href,
  modelName,
  tagline,
  image,
  phenomenon,
}: {
  href: string
  modelName: string
  tagline: string
  image: { url: string; alt: string } | null
  phenomenon?: string
}) {
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.media}>
        <SunglassImage src={image?.url ?? null} alt={image?.alt ?? modelName} size="card" />
      </div>
      {phenomenon && <span className={styles.phenomenon}>{phenomenon}</span>}
      <h3 className={styles.name}>{modelName}</h3>
      <p className={styles.tagline}>{tagline}</p>
    </Link>
  )
}
