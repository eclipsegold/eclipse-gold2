'use client'
import { useCart } from './CartContext'
import styles from './AddToCartButton.module.css'

export function AddToCartButton({ handle, available }: { handle: string; available: boolean }) {
  const { addItem } = useCart()
  return (
    <button
      type="button"
      className={styles.button}
      disabled={!available}
      aria-label="Ajouter au panier"
      onClick={() => addItem(handle)}
    >
      Ajouter au panier
    </button>
  )
}
