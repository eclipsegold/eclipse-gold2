import Link from 'next/link'
import type { Lang } from '../data/types'

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="site-footer">
      <p>© Eclipse Gold</p>
      <nav aria-label="Liens légaux">
        {/* Trust pages are sub-project E — stubs for now */}
        <Link href={`/${lang}`}>Mentions légales</Link>
        <Link href={`/${lang}`}>Livraison &amp; retours</Link>
      </nav>
    </footer>
  )
}
