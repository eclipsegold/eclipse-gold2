import Link from 'next/link'
import type { Lang } from '../data/types'
import styles from './Footer.module.css'

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className={styles.footer}>
      <p className={styles.brand}>Eclipse Gold</p>
      <nav aria-label="Liens légaux" className={styles.links}>
        {/* Trust pages are sub-project E — stubs for now */}
        <Link href={`/${lang}`}>Mentions légales</Link>
        <Link href={`/${lang}`}>Livraison &amp; retours</Link>
      </nav>
      <p className={styles.trust}>
        ✦ Livraison Suisse &amp; France &nbsp; ✦ Retours 14 jours &nbsp; ✦ Paiement sécurisé
      </p>
    </footer>
  )
}
