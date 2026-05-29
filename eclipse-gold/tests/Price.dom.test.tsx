import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CurrencyProvider } from '../components/CurrencyContext'
import { Price } from '../components/Price'

describe('Price', () => {
  it('renders the server default price immediately', () => {
    render(
      <CurrencyProvider initialCountry="CH">
        <Price handle="nebula" lang="fr" defaultAmount="49.90" defaultCurrency="CHF" />
      </CurrencyProvider>,
    )
    expect(screen.getByText(/49/)).toBeInTheDocument()
    expect(screen.getByText(/CHF/)).toBeInTheDocument()
  })
})
