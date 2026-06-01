import Link from 'next/link'
import styles from './Breadcrumbs.module.css'

export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className={styles.breadcrumbs}>
      {items.map((it, i) => (
        <span key={it.href}>
          {i > 0 && <span aria-hidden="true"> / </span>}
          <Link href={it.href}>{it.name}</Link>
        </span>
      ))}
    </nav>
  )
}
