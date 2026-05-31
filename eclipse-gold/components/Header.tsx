import Link from 'next/link'
import type { Lang } from '../data/types'
import { collectionSlugFor } from '../lib/i18n'
import { LangSwitcher } from './LangSwitcher'
import { CurrencySelector } from './CurrencySelector'
import { CartButton } from './CartButton'
import { CartDrawer } from './CartDrawer'
import styles from './Header.module.css'

export function Header({ lang }: { lang: Lang }) {
  const collectionHref = `/${lang}/${collectionSlugFor(lang)}`
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href={`/${lang}`} className={styles.brand}>
          Eclipse Gold
        </Link>
        <nav className={styles.nav}>
          <Link href={collectionHref}>Collection</Link>
        </nav>
        <div className={styles.actions}>
          <LangSwitcher current={lang} />
          <CurrencySelector />
          <CartButton />
        </div>
      </div>
      <CartDrawer lang={lang} />
    </header>
  )
}
