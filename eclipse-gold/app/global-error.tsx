'use client'

// Catches errors thrown in the root layout itself. Must render its own
// <html>/<body>. Kept dependency-free and inline-styled on purpose.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: 'radial-gradient(circle at 50% 40%, #1a1407 0%, #000 62%)',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          padding: '2.5rem 1.5rem',
        }}
      >
        <h1
          style={{
            fontFamily: 'Georgia, serif',
            color: '#d4af37',
            fontSize: '1.5rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Une erreur est survenue
        </h1>
        <p style={{ color: '#9a9a9a', fontSize: '0.85rem', marginTop: '0.75rem' }}>
          Something went wrong · Es ist ein Fehler aufgetreten · Si è verificato un errore
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: '1.5rem',
            padding: '0.6rem 1.4rem',
            background: 'transparent',
            color: '#d4af37',
            border: '1px solid #d4af37',
            borderRadius: 999,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            cursor: 'pointer',
          }}
        >
          Réessayer / Retry
        </button>
      </body>
    </html>
  )
}
