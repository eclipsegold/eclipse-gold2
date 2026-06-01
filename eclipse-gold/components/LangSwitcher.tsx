import Link from 'next/link'
import { LANGS, type Lang } from '../data/types'
import styles from './LangSwitcher.module.css'

const LABEL: Record<Lang, string> = { fr: 'Langue', de: 'Sprache', it: 'Lingua' }

export function LangSwitcher({ current }: { current: Lang }) {
  return (
    <nav aria-label={LABEL[current]} className={styles.switcher}>
      {LANGS.map((l) => (
        <Link key={l} href={`/${l}`} aria-current={l === current ? 'true' : undefined}>
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  )
}
