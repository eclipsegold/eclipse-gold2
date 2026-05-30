import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { CartProvider } from '../components/CartContext'
import { AddToCartButton } from '../components/AddToCartButton'
import { CartButton } from '../components/CartButton'

afterEach(() => cleanup())
beforeEach(() => localStorage.clear())

const wrap = (ui: React.ReactNode) => render(<CartProvider>{ui}</CartProvider>)

describe('AddToCartButton', () => {
  it('is disabled when unavailable', () => {
    wrap(<AddToCartButton handle="nebula" available={false} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
  it('adds to cart and updates the header count', () => {
    wrap(<><AddToCartButton handle="nebula" available={true} /><CartButton /></>)
    act(() => { screen.getByText(/ajouter au panier/i).click() })
    expect(screen.getByLabelText(/panier/i).textContent).toContain('1')
  })
})
