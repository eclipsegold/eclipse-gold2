'use client'

import { useParams } from 'next/navigation'

type Copy = { title: string; text: string; retry: string }

const COPY: Record<string, Copy> = {
  fr: {
    title: 'Une erreur est survenue',
    text: 'Quelque chose s’est mal passé. Veuillez réessayer.',
    retry: 'Réessayer',
  },
  de: {
    title: 'Ein Fehler ist aufgetreten',
    text: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
    retry: 'Erneut versuchen',
  },
  it: {
    title: 'Si è verificato un errore',
    text: 'Qualcosa è andato storto. Riprova.',
    retry: 'Riprova',
  },
}

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const params = useParams()
  const lang = typeof params?.lang === 'string' ? params.lang : 'fr'
  const c = COPY[lang] ?? COPY.fr

  return (
    <section
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'var(--eg-bg-radial)',
        padding: 'var(--eg-s4) var(--eg-s3)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: 'var(--eg-black)',
          boxShadow:
            '0 0 2px 1px var(--eg-gold), 0 0 40px 8px rgba(212, 175, 55, 0.35)',
          marginBottom: 'var(--eg-s3)',
        }}
      />
      <h1
        style={{
          fontFamily: 'var(--eg-serif)',
          fontSize: '1.4rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        {c.title}
      </h1>
      <p style={{ fontSize: '0.8rem', color: 'var(--eg-muted)', marginTop: 'var(--eg-s2)' }}>
        {c.text}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          marginTop: 'var(--eg-s3)',
          padding: '0.6rem 1.4rem',
          background: 'transparent',
          color: 'var(--eg-gold)',
          border: '1px solid var(--eg-gold)',
          borderRadius: 999,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          cursor: 'pointer',
        }}
      >
        {c.retry}
      </button>
    </section>
  )
}
