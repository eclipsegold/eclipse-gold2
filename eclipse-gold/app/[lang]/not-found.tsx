import Link from 'next/link'
import styles from './notFound.module.css'

// not-found.tsx does not reliably receive route params, so we show a short
// trilingual block and link home to the default locale.
export default function NotFound() {
  return (
    <section className={styles.wrap}>
      <div className={styles.ring} aria-hidden="true" />
      <h1 className={styles.title}>
        Page introuvable · Seite nicht gefunden · Pagina non trovata
      </h1>
      <p className={styles.text}>
        Le modèle ou la page que vous cherchez n’existe pas.
      </p>
      <p className={styles.text}>
        <Link href="/fr">Retour à l’accueil · Zur Startseite · Torna alla home</Link>
      </p>
    </section>
  )
}
