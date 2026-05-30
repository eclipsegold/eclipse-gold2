import Link from 'next/link'
import type { Lang, LegalPage } from '../data/types'
import { legalSlugFor } from '../lib/i18n'
import styles from './Footer.module.css'

const LABELS: Record<LegalPage, Record<Lang, string>> = {
  legal:    { fr: 'Mentions légales',  de: 'Impressum',       it: 'Note legali' },
  terms:    { fr: 'CGV',               de: 'AGB',             it: 'Condizioni' },
  privacy:  { fr: 'Confidentialité',   de: 'Datenschutz',     it: 'Privacy' },
  cookies:  { fr: 'Cookies',           de: 'Cookies',         it: 'Cookie' },
  shipping: { fr: 'Livraison',         de: 'Versand',         it: 'Spedizioni' },
  returns:  { fr: 'Retours',           de: 'Rückgabe',        it: 'Resi' },
}

const LEGAL_GROUP: LegalPage[] = ['legal', 'terms', 'privacy', 'cookies']
const HELP_GROUP: LegalPage[] = ['shipping', 'returns']

const NAV_ARIA: Record<Lang, { legal: string; help: string }> = {
  fr: { legal: 'Liens légaux', help: 'Aide' },
  de: { legal: 'Rechtliche Links', help: 'Hilfe' },
  it: { legal: 'Link legali', help: 'Aiuto' },
}

function linkFor(page: LegalPage, lang: Lang) {
  return (
    <Link key={page} href={`/${lang}/infos/${legalSlugFor(page, lang)}`}>
      {LABELS[page][lang]}
    </Link>
  )
}

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className={styles.footer}>
      <p className={styles.brand}>Eclipse Gold</p>
      <nav aria-label={NAV_ARIA[lang].legal} className={styles.links}>
        {LEGAL_GROUP.map((page) => linkFor(page, lang))}
      </nav>
      <nav aria-label={NAV_ARIA[lang].help} className={styles.links}>
        {HELP_GROUP.map((page) => linkFor(page, lang))}
      </nav>
      <p className={styles.trust}>
        ✦ Livraison Suisse &amp; France &nbsp; ✦ Retours 14 jours &nbsp; ✦ Paiement sécurisé
      </p>
    </footer>
  )
}
