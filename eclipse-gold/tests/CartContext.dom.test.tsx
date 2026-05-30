import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { CartProvider, useCart } from '../components/CartContext'

afterEach(() => cleanup())
beforeEach(() => localStorage.clear())

function Probe() {
  const c = useCart()
  return (
    <div>
      <span data-testid="count">{c.count}</span>
      <span data-testid="open">{String(c.isOpen)}</span>
      <button onClick={() => c.addItem('nebula')}>add</button>
      <button onClick={() => c.updateQty('nebula', 3)}>set3</button>
      <button onClick={() => c.removeItem('nebula')}>rm</button>
    </div>
  )
}

const setup = () => render(<CartProvider><Probe /></CartProvider>)

describe('CartContext', () => {
  it('adds an item, increments count, and opens the drawer', () => {
    setup()
    act(() => { screen.getByText('add').click() })
    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('open').textContent).toBe('true')
  })

  it('updates quantity and removes', () => {
    setup()
    act(() => { screen.getByText('add').click() })
    act(() => { screen.getByText('set3').click() })
    expect(screen.getByTestId('count').textContent).toBe('3')
    act(() => { screen.getByText('rm').click() })
    expect(screen.getByTestId('count').textContent).toBe('0')
  })

  it('persists lines to localStorage', () => {
    setup()
    act(() => { screen.getByText('add').click() })
    expect(localStorage.getItem('eg-cart')).toContain('nebula')
  })

  it('throws when useCart is used outside the provider', () => {
    expect(() => render(<Probe />)).toThrow(/CartProvider/)
  })
})
