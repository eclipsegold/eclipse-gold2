'use client'
import { useState, type FormEvent } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { Lang } from '../data/types'
import { useCart } from './CartContext'
import { useCurrency } from './CurrencyContext'
import styles from './CheckoutForm.module.css'

export function CheckoutForm({ lang }: { lang: Lang }) {
  const { lines } = useCart()
  const { country } = useCurrency()
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (lines.length === 0) {
    return <p className={styles.empty}>Votre panier est vide.</p>
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!stripe || !elements) return
    const data = new FormData(e.currentTarget)
    setSubmitting(true)
    setError(null)
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Erreur de paiement')
      setSubmitting(false)
      return
    }
    const res = await fetch('/api/checkout/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines, country }),
    })
    if (!res.ok) {
      setError('Impossible de préparer le paiement.')
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
      setError(payError.message ?? 'Le paiement a échoué.')
      setSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.field}>
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="firstName">Prénom</label>
          <input id="firstName" name="firstName" required autoComplete="given-name" />
        </div>
        <div className={styles.field}>
          <label htmlFor="lastName">Nom</label>
          <input id="lastName" name="lastName" required autoComplete="family-name" />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="address1">Adresse</label>
        <input id="address1" name="address1" required autoComplete="address-line1" />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="zip">Code postal</label>
          <input id="zip" name="zip" required autoComplete="postal-code" />
        </div>
        <div className={styles.field}>
          <label htmlFor="city">Ville</label>
          <input id="city" name="city" required autoComplete="address-level2" />
        </div>
      </div>
      <p className={styles.shipping}>Livraison offerte</p>
      <PaymentElement />
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.pay} disabled={!stripe || submitting}>
        {submitting ? 'Paiement…' : 'Payer'}
      </button>
    </form>
  )
}
