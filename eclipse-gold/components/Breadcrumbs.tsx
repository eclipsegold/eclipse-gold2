import Link from 'next/link'

export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="breadcrumbs">
      {items.map((it, i) => (
        <span key={it.href}>
          {i > 0 && ' / '}
          <Link href={it.href}>{it.name}</Link>
        </span>
      ))}
    </nav>
  )
}
