'use client'
import { useCart } from './CartContext'
import styles from './AddToCartButton.module.css'

export function AddToCartButton({
  handle,
  available,
  label = 'Ajouter au panier',
  size = 'default',
}: {
  handle: string
  available: boolean
  label?: string
  size?: 'default' | 'lg'
}) {
  const { addItem } = useCart()
  return (
    <button
      type="button"
      className={size === 'lg' ? `${styles.button} ${styles.lg}` : styles.button}
      disabled={!available}
      aria-label={label}
      onClick={() => addItem(handle)}
    >
      {label}
    </button>
  )
}
