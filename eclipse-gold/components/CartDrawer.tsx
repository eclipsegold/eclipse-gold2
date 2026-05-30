'use client'
import Link from 'next/link'
import type { Lang } from '../data/types'
import { useCart } from './CartContext'
import styles from './CartDrawer.module.css'

export function CartDrawer({ lang }: { lang: Lang }) {
  const { lines, isOpen, close, updateQty, removeItem } = useCart()
  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={close} aria-hidden="true" />}
      <aside className={styles.drawer} data-open={isOpen} aria-label="Panier" aria-hidden={!isOpen}>
        <div className={styles.head}>
          <span>Panier</span>
          <button type="button" className={styles.close} aria-label="Fermer" onClick={close}>
            ✕
          </button>
        </div>

        {lines.length === 0 ? (
          <p className={styles.empty}>Votre panier est vide</p>
        ) : (
          <div className={styles.lines}>
            {lines.map((l) => (
              <div key={l.handle} className={styles.line}>
                <p className={styles.name}>{l.handle}</p>
                <div className={styles.stepper}>
                  <button type="button" aria-label="Diminuer" onClick={() => updateQty(l.handle, l.quantity - 1)}>−</button>
                  <span>{l.quantity}</span>
                  <button type="button" aria-label="Augmenter" onClick={() => updateQty(l.handle, l.quantity + 1)}>+</button>
                </div>
                <button type="button" className={styles.remove} onClick={() => removeItem(l.handle)}>
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}

        <Link
          href={`/${lang}/checkout`}
          className={styles.checkout}
          aria-disabled={lines.length === 0}
          onClick={close}
        >
          Passer au paiement
        </Link>
      </aside>
    </>
  )
}
