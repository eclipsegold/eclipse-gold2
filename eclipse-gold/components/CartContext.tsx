'use client'
import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'

export interface CartLine {
  handle: string
  quantity: number
}

interface CartState {
  lines: CartLine[]
  count: number
  isOpen: boolean
  addItem(handle: string): void
  updateQty(handle: string, quantity: number): void
  removeItem(handle: string): void
  clear(): void
  open(): void
  close(): void
}

const Ctx = createContext<CartState | null>(null)
const KEY = 'eg-cart'
const MAX_QTY = 10

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setLines(JSON.parse(raw))
    } catch {
      // ignore malformed storage
    }
  }, [])

  // Functional update keeps this callback's identity stable across renders, so
  // consumers' effects that depend on cart callbacks don't re-fire every render.
  const persist = useCallback((update: (prev: CartLine[]) => CartLine[]) => {
    setLines((prev) => {
      const next = update(prev)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        // ignore quota / unavailable storage
      }
      return next
    })
  }, [])

  const addItem = useCallback(
    (handle: string) => {
      persist((prev) => {
        const existing = prev.find((l) => l.handle === handle)
        return existing
          ? prev.map((l) =>
              l.handle === handle ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + 1) } : l,
            )
          : [...prev, { handle, quantity: 1 }]
      })
      setIsOpen(true)
    },
    [persist],
  )

  const removeItem = useCallback(
    (handle: string) => {
      persist((prev) => prev.filter((l) => l.handle !== handle))
    },
    [persist],
  )

  const updateQty = useCallback(
    (handle: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(handle)
        return
      }
      const capped = Math.min(MAX_QTY, quantity)
      persist((prev) => prev.map((l) => (l.handle === handle ? { ...l, quantity: capped } : l)))
    },
    [persist, removeItem],
  )

  const clear = useCallback(() => {
    persist(() => [])
  }, [persist])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const count = lines.reduce((n, l) => n + l.quantity, 0)

  const value = useMemo<CartState>(
    () => ({ lines, count, isOpen, addItem, updateQty, removeItem, clear, open, close }),
    [lines, count, isOpen, addItem, updateQty, removeItem, clear, open, close],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart(): CartState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
