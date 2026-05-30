'use client'
import { use } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { isLang } from '../../../lib/i18n'
import { CheckoutForm } from '../../../components/CheckoutForm'
import styles from './checkout.module.css'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

export default function CheckoutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params)
  const safeLang = isLang(lang) ? lang : 'fr'
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Paiement</h1>
      <Elements stripe={stripePromise} options={{ mode: 'payment', amount: 4990, currency: 'chf' }}>
        <CheckoutForm lang={safeLang} />
      </Elements>
    </section>
  )
}
