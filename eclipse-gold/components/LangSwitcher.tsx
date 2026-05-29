import Link from 'next/link'
import { LANGS, type Lang } from '../data/types'

export function LangSwitcher({ current }: { current: Lang }) {
  return (
    <nav aria-label="Langue" className="lang-switcher">
      {LANGS.map((l) => (
        <Link key={l} href={`/${l}`} aria-current={l === current ? 'true' : undefined}>
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  )
}
