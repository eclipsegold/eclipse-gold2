'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

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

  function persist(next: CartLine[]) {
    setLines(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // ignore quota / unavailable storage
    }
  }

  function addItem(handle: string) {
    const existing = lines.find((l) => l.handle === handle)
    persist(
      existing
        ? lines.map((l) => (l.handle === handle ? { ...l, quantity: l.quantity + 1 } : l))
        : [...lines, { handle, quantity: 1 }],
    )
    setIsOpen(true)
  }

  function updateQty(handle: string, quantity: number) {
    if (quantity <= 0) return removeItem(handle)
    persist(lines.map((l) => (l.handle === handle ? { ...l, quantity } : l)))
  }

  function removeItem(handle: string) {
    persist(lines.filter((l) => l.handle !== handle))
  }

  function clear() {
    persist([])
  }

  const count = lines.reduce((n, l) => n + l.quantity, 0)

  return (
    <Ctx.Provider
      value={{ lines, count, isOpen, addItem, updateQty, removeItem, clear, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useCart(): CartState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
