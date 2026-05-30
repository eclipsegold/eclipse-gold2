import styles from './SunglassImage.module.css'

const SIZES = { card: 600, hero: 1000, thumb: 240 } as const

export function SunglassImage({
  src,
  alt,
  size = 'card',
}: {
  src: string | null
  alt: string
  size?: keyof typeof SIZES
}) {
  const px = SIZES[size]
  return (
    <div className={styles.frame}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.img} src={src} alt={alt} loading="lazy" width={px} height={px} />
      ) : (
        <span className={styles.placeholder} aria-hidden="true">EG</span>
      )}
    </div>
  )
}
