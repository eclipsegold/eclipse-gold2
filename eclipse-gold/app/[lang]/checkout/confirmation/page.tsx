'use client'
import { use, useEffect } from 'react'
import Link from 'next/link'
import { isLang } from '../../../../lib/i18n'
import { useCart } from '../../../../components/CartContext'

export function ConfirmationView({ lang }: { lang: string }) {
  const { clear } = useCart()
  useEffect(() => {
    clear()
  }, [clear])
  return (
    <section style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--eg-serif)', textTransform: 'uppercase', letterSpacing: 'var(--eg-track)' }}>
        Merci
      </h1>
      <p style={{ color: 'var(--eg-muted)', marginTop: '1rem' }}>
        Votre commande est confirmée. Un e-mail de confirmation vous a été envoyé.
      </p>
      <Link
        href={`/${isLang(lang) ? lang : 'fr'}`}
        style={{ marginTop: '1.5rem', border: '1px solid var(--eg-gold)', color: 'var(--eg-gold)', padding: '12px 28px', fontSize: '0.7rem', letterSpacing: '0.24em', textTransform: 'uppercase' }}
      >
        Retour à l&apos;accueil
      </Link>
    </section>
  )
}

export default function ConfirmationPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params)
  return <ConfirmationView lang={lang} />
}
