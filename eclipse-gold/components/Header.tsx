import Link from 'next/link'
import type { Lang } from '../data/types'
import { collectionSlugFor } from '../lib/i18n'
import { LangSwitcher } from './LangSwitcher'
import { CurrencySelector } from './CurrencySelector'

export function Header({ lang }: { lang: Lang }) {
  const collectionHref = `/${lang}/${collectionSlugFor(lang)}`
  return (
    <header className="site-header">
      <Link href={`/${lang}`} className="brand">
        Eclipse Gold
      </Link>
      <nav>
        <Link href={collectionHref}>Collection</Link>
      </nav>
      <div className="header-actions">
        <LangSwitcher current={lang} />
        <CurrencySelector />
        <button type="button" aria-label="Panier" disabled>
          🛒
        </button>
      </div>
    </header>
  )
}
