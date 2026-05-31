'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Lang } from '../data/types'
import { LangSwitcher } from './LangSwitcher'
import { CurrencySelector } from './CurrencySelector'
import styles from './MobileNav.module.css'

export interface NavLink {
  href: string
  label: string
}

export function MobileNav({
  lang,
  links,
  legal,
  labels,
}: {
  lang: Lang
  links: NavLink[]
  legal: NavLink
  labels: { open: string; close: string; menu: string }
}) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.toggle}
        aria-label={open ? labels.close : labels.open}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className={styles.scrim} onClick={close} aria-hidden="true" />
          <div id="mobile-menu" className={styles.panel}>
            <nav className={styles.links} aria-label={labels.menu}>
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={styles.link} onClick={close}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className={styles.menuFooter}>
              <LangSwitcher current={lang} />
              <CurrencySelector />
            </div>
            <Link href={legal.href} className={styles.legal} onClick={close}>
              {legal.label}
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
