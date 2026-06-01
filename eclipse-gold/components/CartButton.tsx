'use client'
import type { Lang } from '../data/types'
import { useCart } from './CartContext'
import styles from './CartButton.module.css'

const CART_LABEL: Record<Lang, (count: number) => string> = {
  fr: (c) => `Panier (${c})`,
  de: (c) => `Warenkorb (${c})`,
  it: (c) => `Carrello (${c})`,
}

export function CartButton({ lang = 'fr' }: { lang?: Lang }) {
  const { count, open } = useCart()
  return (
    <button type="button" className={styles.button} aria-label={CART_LABEL[lang](count)} onClick={open}>
      🛒
      {count > 0 && (
        <span className={styles.badge} aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  )
}
