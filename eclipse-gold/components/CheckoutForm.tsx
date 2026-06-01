'use client'
import { useState, useMemo, type FormEvent } from 'react'
import Link from 'next/link'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { Lang } from '../data/types'
import { legalSlugFor } from '../lib/i18n'
import { currencyForCountry, formatPrice } from '../lib/currency'
import { getCatalogProduct } from '../data/catalog'
import { useCart } from './CartContext'
import { useCurrency } from './CurrencyContext'
import styles from './CheckoutForm.module.css'

interface Strings {
  email: string
  firstName: string
  lastName: string
  address: string
  zip: string
  city: string
  shippingFree: string
  subtotal: string
  shipping: string
  total: string
  withdrawal: string
  terms: string
  termsRequired: string
  pay: string
  paying: string
  emptyCart: string
  backToShop: string
  errorGeneric: string
  errorPrepare: string
  errorPayFailed: string
}

const COPY: Record<Lang, Strings> = {
  fr: {
    email: 'E-mail',
    firstName: 'Prénom',
    lastName: 'Nom',
    address: 'Adresse',
    zip: 'Code postal',
    city: 'Ville',
    shippingFree: 'Livraison offerte',
    subtotal: 'Sous-total',
    shipping: 'Livraison',
    total: 'Total',
    withdrawal: 'Vous disposez de 14 jours pour vous rétracter.',
    terms: "J'accepte les conditions générales de vente",
    termsRequired: 'Veuillez accepter les conditions générales de vente.',
    pay: 'Payer',
    paying: 'Paiement…',
    emptyCart: 'Votre panier est vide.',
    backToShop: 'Retour à la boutique',
    errorGeneric: 'Erreur de paiement',
    errorPrepare: 'Impossible de préparer le paiement.',
    errorPayFailed: 'Le paiement a échoué.',
  },
  de: {
    email: 'E-Mail',
    firstName: 'Vorname',
    lastName: 'Name',
    address: 'Adresse',
    zip: 'Postleitzahl',
    city: 'Stadt',
    shippingFree: 'Versand kostenlos',
    subtotal: 'Zwischensumme',
    shipping: 'Versand',
    total: 'Gesamt',
    withdrawal: 'Sie haben ein 14-tägiges Widerrufsrecht.',
    terms: 'Ich akzeptiere die allgemeinen Geschäftsbedingungen',
    termsRequired: 'Bitte akzeptieren Sie die allgemeinen Geschäftsbedingungen.',
    pay: 'Bezahlen',
    paying: 'Zahlung…',
    emptyCart: 'Ihr Warenkorb ist leer.',
    backToShop: 'Zurück zum Shop',
    errorGeneric: 'Zahlungsfehler',
    errorPrepare: 'Zahlung konnte nicht vorbereitet werden.',
    errorPayFailed: 'Die Zahlung ist fehlgeschlagen.',
  },
  it: {
    email: 'E-mail',
    firstName: 'Nome',
    lastName: 'Cognome',
    address: 'Indirizzo',
    zip: 'Codice postale',
    city: 'Città',
    shippingFree: 'Spedizione gratuita',
    subtotal: 'Subtotale',
    shipping: 'Spedizione',
    total: 'Totale',
    withdrawal: 'Hai 14 giorni di diritto di recesso.',
    terms: 'Accetto le condizioni generali di vendita',
    termsRequired: 'Si prega di accettare le condizioni generali di vendita.',
    pay: 'Paga',
    paying: 'Pagamento…',
    emptyCart: 'Il tuo carrello è vuoto.',
    backToShop: 'Torna al negozio',
    errorGeneric: 'Errore di pagamento',
    errorPrepare: 'Impossibile preparare il pagamento.',
    errorPayFailed: 'Il pagamento è fallito.',
  },
}

export function CheckoutForm({ lang }: { lang: Lang }) {
  const { lines } = useCart()
  const { country } = useCurrency()
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = COPY[lang]

  const currency = currencyForCountry(country)

  // Itemised summary computed from the local catalogue (flat price, no Shopify).
  const summary = useMemo(() => {
    let subtotal = 0
    const items = lines.map((l) => {
      const product = getCatalogProduct(l.handle, country)
      const unit = product ? Number(product.price.amount) : 0
      const lineTotal = unit * l.quantity
      subtotal += lineTotal
      return {
        handle: l.handle,
        title: product?.title ?? l.handle,
        quantity: l.quantity,
        lineTotal: lineTotal.toFixed(2),
      }
    })
    return { items, subtotal: subtotal.toFixed(2) }
  }, [lines, country])

  if (lines.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{t.emptyCart}</p>
        <Link href={`/${lang}`} className={styles.backLink}>
          {t.backToShop}
        </Link>
      </div>
    )
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Set submitting synchronously, before any async work, to block double submit.
    if (submitting) return
    if (!accepted) {
      setError(t.termsRequired)
      return
    }
    if (!stripe || !elements) return
    const data = new FormData(e.currentTarget)
    setSubmitting(true)
    setError(null)
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? t.errorGeneric)
      setSubmitting(false)
      return
    }
    const res = await fetch('/api/checkout/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines, country }),
    })
    if (!res.ok) {
      setError(t.errorPrepare)
      setSubmitting(false)
      return
    }
    const { clientSecret } = await res.json()
    const { error: payError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/${lang}/checkout/confirmation`,
        receipt_email: String(data.get('email') ?? ''),
        shipping: {
          name: `${data.get('firstName') ?? ''} ${data.get('lastName') ?? ''}`.trim(),
          address: {
            line1: String(data.get('address1') ?? ''),
            city: String(data.get('city') ?? ''),
            postal_code: String(data.get('zip') ?? ''),
            country,
          },
        },
      },
    })
    if (payError) {
      setError(payError.message ?? t.errorPayFailed)
      setSubmitting(false)
    }
  }

  const termsHref = `/${lang}/infos/${legalSlugFor('terms', lang)}`

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.field}>
        <label htmlFor="email">{t.email}</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="firstName">{t.firstName}</label>
          <input id="firstName" name="firstName" required autoComplete="given-name" />
        </div>
        <div className={styles.field}>
          <label htmlFor="lastName">{t.lastName}</label>
          <input id="lastName" name="lastName" required autoComplete="family-name" />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="address1">{t.address}</label>
        <input id="address1" name="address1" required autoComplete="address-line1" />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="zip">{t.zip}</label>
          <input id="zip" name="zip" required autoComplete="postal-code" />
        </div>
        <div className={styles.field}>
          <label htmlFor="city">{t.city}</label>
          <input id="city" name="city" required autoComplete="address-level2" />
        </div>
      </div>

      <div className={styles.summary}>
        {summary.items.map((item) => (
          <div key={item.handle} className={styles.summaryRow}>
            <span>
              {item.title} × {item.quantity}
            </span>
            <span>{formatPrice(item.lineTotal, currency, lang)}</span>
          </div>
        ))}
        <div className={styles.summaryRow}>
          <span>{t.subtotal}</span>
          <span>{formatPrice(summary.subtotal, currency, lang)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>{t.shipping}</span>
          <span>{formatPrice('0.00', currency, lang)}</span>
        </div>
        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
          <span>{t.total}</span>
          <span>{formatPrice(summary.subtotal, currency, lang)}</span>
        </div>
        <p className={styles.shipping}>{t.shippingFree}</p>
        <p className={styles.withdrawal}>{t.withdrawal}</p>
      </div>

      <PaymentElement />

      <label className={styles.terms}>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <span>
          {t.terms}{' '}
          <Link href={termsHref} target="_blank" rel="noopener noreferrer">
            ({legalSlugFor('terms', lang).toUpperCase()})
          </Link>
        </span>
      </label>

      {error && <p className={styles.error}>{error}</p>}
      <button
        type="submit"
        className={styles.pay}
        disabled={!stripe || submitting || !accepted}
      >
        {submitting ? t.paying : t.pay}
      </button>
    </form>
  )
}
