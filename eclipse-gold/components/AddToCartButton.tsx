'use client'
import { useEffect, useRef, useState } from 'react'
import type { Lang } from '../data/types'
import { useCart } from './CartContext'
import styles from './AddToCartButton.module.css'

const ADDED: Record<Lang, string> = {
  fr: 'Ajouté ✓',
  de: 'Hinzugefügt ✓',
  it: 'Aggiunto ✓',
}

export function AddToCartButton({
  handle,
  available,
  label = 'Ajouter au panier',
  size = 'default',
  lang = 'fr',
}: {
  handle: string
  available: boolean
  label?: string
  size?: 'default' | 'lg'
  lang?: Lang
}) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const handleClick = () => {
    addItem(handle)
    setAdded(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      type="button"
      className={size === 'lg' ? `${styles.button} ${styles.lg}` : styles.button}
      disabled={!available}
      aria-label={added ? ADDED[lang] : label}
      onClick={handleClick}
    >
      <span aria-live="polite">{added ? ADDED[lang] : label}</span>
    </button>
  )
}
