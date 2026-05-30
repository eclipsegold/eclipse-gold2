import { SunglassImage } from './SunglassImage'
import styles from './ProductGallery.module.css'

export function ProductGallery({ images }: { images: { url: string; alt: string }[] }) {
  if (images.length === 0) {
    return (
      <div className={styles.gallery}>
        <div className={styles.hero}>
          <SunglassImage src={null} alt="Eclipse Gold" size="hero" />
        </div>
      </div>
    )
  }
  return (
    <div className={styles.gallery}>
      {images.map((img, i) => (
        <div key={i} className={styles.hero}>
          <SunglassImage src={img.url} alt={img.alt} size="hero" />
        </div>
      ))}
    </div>
  )
}
