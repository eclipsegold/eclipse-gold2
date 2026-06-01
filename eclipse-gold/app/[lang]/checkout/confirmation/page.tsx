'use client'
import { use, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { isLang, type Lang } from '../../../../lib/i18n'
import { useCart } from '../../../../components/CartContext'

type Status = 'succeeded' | 'processing' | 'failed'

const COPY: Record<Lang, {
  succeeded: { title: string; body: string; email: string }
  processing: { title: string; body: string }
  failed: { title: string; body: string; retry: string }
  ref: string
  home: string
}> = {
  fr: {
    succeeded: {
      title: 'Merci',
      body: 'Votre commande est confirmée.',
      email: 'Un e-mail de confirmation a été envoyé à votre adresse (si vous l’avez renseignée).',
    },
    processing: {
      title: 'Paiement en cours',
      body: 'Votre paiement est en cours de traitement. Vous recevrez une confirmation dès qu’il sera validé.',
    },
    failed: {
      title: 'Paiement non abouti',
      body: 'Votre paiement n’a pas pu être finalisé.',
      retry: 'Réessayer le paiement',
    },
    ref: 'Référence',
    home: 'Retour à l’accueil',
  },
  de: {
    succeeded: {
      title: 'Danke',
      body: 'Ihre Bestellung ist bestätigt.',
      email: 'Eine Bestätigungs-E-Mail wurde an Ihre Adresse gesendet (sofern angegeben).',
    },
    processing: {
      title: 'Zahlung in Bearbeitung',
      body: 'Ihre Zahlung wird verarbeitet. Sie erhalten eine Bestätigung, sobald sie bestätigt ist.',
    },
    failed: {
      title: 'Zahlung fehlgeschlagen',
      body: 'Ihre Zahlung konnte nicht abgeschlossen werden.',
      retry: 'Zahlung erneut versuchen',
    },
    ref: 'Referenz',
    home: 'Zurück zur Startseite',
  },
  it: {
    succeeded: {
      title: 'Grazie',
      body: 'Il tuo ordine è confermato.',
      email: 'Un’e-mail di conferma è stata inviata al tuo indirizzo (se fornito).',
    },
    processing: {
      title: 'Pagamento in corso',
      body: 'Il tuo pagamento è in elaborazione. Riceverai una conferma non appena sarà convalidato.',
    },
    failed: {
      title: 'Pagamento non riuscito',
      body: 'Non è stato possibile completare il pagamento.',
      retry: 'Riprova il pagamento',
    },
    ref: 'Riferimento',
    home: 'Ritorna alla home',
  },
}

export function ConfirmationView({ lang }: { lang: Lang }) {
  const { clear } = useCart()
  const params = useSearchParams()
  const redirectStatus = params.get('redirect_status')
  const paymentIntent = params.get('payment_intent')

  const status: Status =
    redirectStatus === 'succeeded'
      ? 'succeeded'
      : redirectStatus === 'processing'
        ? 'processing'
        : 'failed'

  // Only empty the cart once the payment has actually succeeded. Processing or
  // failed payments keep the cart so the customer can retry.
  useEffect(() => {
    if (status === 'succeeded') clear()
  }, [status, clear])

  const t = COPY[lang]

  const wrap: React.CSSProperties = {
    minHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '2.5rem 1.5rem',
  }
  const titleStyle: React.CSSProperties = {
    fontFamily: 'var(--eg-serif)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--eg-track)',
  }
  const linkStyle: React.CSSProperties = {
    marginTop: '1.5rem',
    border: '1px solid var(--eg-gold)',
    color: 'var(--eg-gold)',
    padding: '12px 28px',
    fontSize: '0.7rem',
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
  }

  return (
    <section style={wrap}>
      <h1 style={titleStyle}>{t[status].title}</h1>
      <p style={{ color: 'var(--eg-muted)', marginTop: '1rem' }}>{t[status].body}</p>

      {status === 'succeeded' && (
        <>
          <p style={{ color: 'var(--eg-muted)', marginTop: '0.5rem' }}>{t.succeeded.email}</p>
          {paymentIntent && (
            <p style={{ color: 'var(--eg-muted)', marginTop: '0.5rem', fontSize: '0.75rem' }}>
              {t.ref} : {paymentIntent}
            </p>
          )}
        </>
      )}

      {status === 'failed' && (
        <Link href={`/${lang}/checkout`} style={linkStyle}>
          {t.failed.retry}
        </Link>
      )}

      <Link href={`/${lang}`} style={linkStyle}>
        {t.home}
      </Link>
    </section>
  )
}

export default function ConfirmationPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params)
  const safeLang: Lang = isLang(lang) ? lang : 'fr'
  return (
    <Suspense fallback={null}>
      <ConfirmationView lang={safeLang} />
    </Suspense>
  )
}
