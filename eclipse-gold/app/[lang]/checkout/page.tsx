'use client'
import { use } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { isLang, type Lang } from '../../../lib/i18n'
import { CheckoutForm } from '../../../components/CheckoutForm'
import styles from './checkout.module.css'

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

// Stripe is considered "configured" only with a real publishable key.
const STRIPE_CONFIGURED =
  PUBLISHABLE_KEY.length > 0 && !PUBLISHABLE_KEY.includes('xxx') && PUBLISHABLE_KEY.startsWith('pk_')

const stripePromise = STRIPE_CONFIGURED ? loadStripe(PUBLISHABLE_KEY) : null

const TITLE: Record<Lang, string> = { fr: 'Paiement', de: 'Zahlung', it: 'Pagamento' }

const NOT_CONFIGURED: Record<Lang, string> = {
  fr: 'Le paiement sera bientôt disponible.',
  de: 'Die Zahlung ist bald verfügbar.',
  it: 'Il pagamento sarà presto disponibile.',
}

export default function CheckoutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params)
  const safeLang: Lang = isLang(lang) ? lang : 'fr'
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{TITLE[safeLang]}</h1>
      {STRIPE_CONFIGURED && stripePromise ? (
        <Elements stripe={stripePromise} options={{ mode: 'payment', amount: 4990, currency: 'chf' }}>
          <CheckoutForm lang={safeLang} />
        </Elements>
      ) : (
        <p
          style={{
            textAlign: 'center',
            color: 'var(--eg-muted)',
            padding: '2.5rem 1.5rem',
          }}
        >
          {NOT_CONFIGURED[safeLang]}
        </p>
      )}
    </section>
  )
}
