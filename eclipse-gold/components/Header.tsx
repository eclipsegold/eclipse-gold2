import Link from 'next/link'
import type { Lang } from '../data/types'
import { collectionSlugFor, legalSlugFor } from '../lib/i18n'
import { LangSwitcher } from './LangSwitcher'
import { CurrencySelector } from './CurrencySelector'
import { CartButton } from './CartButton'
import { CartDrawer } from './CartDrawer'
import { MobileNav } from './MobileNav'
import styles from './Header.module.css'

interface NavCopy {
  collection: string
  story: string
  shipping: string
  legal: string
  open: string
  close: string
  menu: string
}

const NAV: Record<Lang, NavCopy> = {
  fr: {
    collection: 'Collection',
    story: 'Notre Histoire',
    shipping: 'Livraison & Retours',
    legal: 'CGV',
    open: 'Ouvrir le menu',
    close: 'Fermer le menu',
    menu: 'Menu',
  },
  de: {
    collection: 'Kollektion',
    story: 'Unsere Geschichte',
    shipping: 'Versand & Rückgabe',
    legal: 'AGB',
    open: 'Menü öffnen',
    close: 'Menü schließen',
    menu: 'Menü',
  },
  it: {
    collection: 'Collezione',
    story: 'La nostra storia',
    shipping: 'Spedizioni & Resi',
    legal: 'Condizioni',
    open: 'Apri il menu',
    close: 'Chiudi il menu',
    menu: 'Menu',
  },
}

export function Header({ lang }: { lang: Lang }) {
  const t = NAV[lang]
  const collectionHref = `/${lang}/${collectionSlugFor(lang)}`
  const storyHref = `/${lang}#story`
  const shippingHref = `/${lang}/infos/${legalSlugFor('shipping', lang)}`
  const legalHref = `/${lang}/infos/${legalSlugFor('terms', lang)}`

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <MobileNav
            lang={lang}
            links={[
              { href: collectionHref, label: t.collection },
              { href: storyHref, label: t.story },
              { href: shippingHref, label: t.shipping },
            ]}
            legal={{ href: legalHref, label: t.legal }}
            labels={{ open: t.open, close: t.close, menu: t.menu }}
          />
          <Link href={`/${lang}`} className={styles.brand}>
            Eclipse Gold
          </Link>
          <nav className={styles.nav} aria-label={t.menu}>
            <Link href={collectionHref}>{t.collection}</Link>
            <Link href={storyHref}>{t.story}</Link>
          </nav>
        </div>
        <div className={styles.actions}>
          <div className={styles.desktopOnly}>
            <LangSwitcher current={lang} />
          </div>
          <div className={styles.desktopOnly}>
            <CurrencySelector />
          </div>
          <CartButton />
        </div>
      </div>
      <CartDrawer lang={lang} />
    </header>
  )
}
