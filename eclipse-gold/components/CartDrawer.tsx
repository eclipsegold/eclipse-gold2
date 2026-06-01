'use client'
import Link from 'next/link'
import type { Lang } from '../data/types'
import { models } from '../data/models'
import { getCatalogProduct } from '../data/catalog'
import { formatPrice, type Currency } from '../lib/currency'
import { useCart } from './CartContext'
import { useCurrency } from './CurrencyContext'
import styles from './CartDrawer.module.css'

interface DrawerCopy {
  cart: string
  close: string
  empty: string
  remove: string
  checkout: string
  alsoLike: string
  add: string
  decrease: (name: string) => string
  increase: (name: string) => string
}

const COPY: Record<Lang, DrawerCopy> = {
  fr: {
    cart: 'Panier',
    close: 'Fermer',
    empty: 'Votre panier est vide',
    remove: 'Retirer',
    checkout: 'Passer au paiement',
    alsoLike: 'Vous aimerez aussi',
    add: 'Ajouter',
    decrease: (n) => `Diminuer ${n}`,
    increase: (n) => `Augmenter ${n}`,
  },
  de: {
    cart: 'Warenkorb',
    close: 'Schließen',
    empty: 'Ihr Warenkorb ist leer',
    remove: 'Entfernen',
    checkout: 'Zur Kasse',
    alsoLike: 'Das könnte Ihnen auch gefallen',
    add: 'Hinzufügen',
    decrease: (n) => `${n} verringern`,
    increase: (n) => `${n} erhöhen`,
  },
  it: {
    cart: 'Carrello',
    close: 'Chiudi',
    empty: 'Il tuo carrello è vuoto',
    remove: 'Rimuovi',
    checkout: 'Vai al pagamento',
    alsoLike: 'Ti potrebbe piacere anche',
    add: 'Aggiungi',
    decrease: (n) => `Diminuisci ${n}`,
    increase: (n) => `Aumenta ${n}`,
  },
}

export function CartDrawer({ lang }: { lang: Lang }) {
  const { lines, isOpen, close, addItem, updateQty, removeItem } = useCart()
  const { country } = useCurrency()
  const t = COPY[lang]

  // Suggest another pair not already in the cart (featured first).
  const inCart = new Set(lines.map((l) => l.handle))
  const candidates = models.filter((m) => !inCart.has(m.handle))
  const suggestion = candidates.find((m) => m.featured) ?? candidates[0]
  const suggestionProduct = suggestion ? getCatalogProduct(suggestion.handle, country) : null

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={close} aria-hidden="true" />}
      <aside className={styles.drawer} data-open={isOpen} aria-label={t.cart} aria-hidden={!isOpen}>
        <div className={styles.head}>
          <span>{t.cart}</span>
          <button type="button" className={styles.close} aria-label={t.close} onClick={close}>
            ✕
          </button>
        </div>

        {lines.length === 0 ? (
          <p className={styles.empty}>{t.empty}</p>
        ) : (
          <div className={styles.lines}>
            {lines.map((l) => (
              <div key={l.handle} className={styles.line}>
                <p className={styles.name}>{l.handle}</p>
                <div className={styles.stepper}>
                  <button type="button" aria-label={t.decrease(l.handle)} onClick={() => updateQty(l.handle, l.quantity - 1)}>−</button>
                  <span>{l.quantity}</span>
                  <button type="button" aria-label={t.increase(l.handle)} onClick={() => updateQty(l.handle, l.quantity + 1)}>+</button>
                </div>
                <button type="button" className={styles.remove} onClick={() => removeItem(l.handle)}>
                  {t.remove}
                </button>
              </div>
            ))}
          </div>
        )}

        {lines.length > 0 && suggestion && suggestionProduct && (
          <div className={styles.suggest}>
            <p className={styles.suggestTitle}>{t.alsoLike}</p>
            <div className={styles.suggestCard}>
              {suggestion.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.suggestImg} src={suggestion.image} alt={suggestion.modelName} width={56} height={56} />
              )}
              <div className={styles.suggestInfo}>
                <span className={styles.suggestName}>{suggestion.modelName}</span>
                <span className={styles.suggestPrice}>
                  {formatPrice(suggestionProduct.price.amount, suggestionProduct.price.currencyCode as Currency, lang)}
                </span>
              </div>
              <button
                type="button"
                className={styles.suggestAdd}
                aria-label={`${t.add} ${suggestion.modelName}`}
                onClick={() => addItem(suggestion.handle)}
              >
                {t.add}
              </button>
            </div>
          </div>
        )}

        {lines.length > 0 ? (
          <Link href={`/${lang}/checkout`} className={styles.checkout} onClick={close}>
            {t.checkout}
          </Link>
        ) : (
          <button type="button" className={styles.checkout} disabled>
            {t.checkout}
          </button>
        )}
      </aside>
    </>
  )
}
