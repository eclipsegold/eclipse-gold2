'use client'
import { useCart } from './CartContext'
import styles from './CartButton.module.css'

export function CartButton() {
  const { count, open } = useCart()
  return (
    <button type="button" className={styles.button} aria-label={`Panier (${count})`} onClick={open}>
      🛒
      {count > 0 && <span className={styles.badge}>{count}</span>}
    </button>
  )
}
