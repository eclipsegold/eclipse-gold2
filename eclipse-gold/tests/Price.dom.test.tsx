import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, renderHook } from '@testing-library/react'
import { CurrencyProvider, useCurrency } from '../components/CurrencyContext'
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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('refetches and shows the resolved currency when it differs from the default', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ amount: '52.00', currencyCode: 'EUR', availableForSale: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    // lang fr + country FR resolves to EUR, which differs from the CHF default → refetch.
    render(
      <CurrencyProvider initialCountry="FR">
        <Price handle="nebula" lang="fr" defaultAmount="49.90" defaultCurrency="CHF" />
      </CurrencyProvider>,
    )

    await waitFor(() => expect(screen.getByText(/52/)).toBeInTheDocument())
    expect(screen.getByText(/€|EUR/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/price?handle=nebula&country=FR'),
      expect.objectContaining({ signal: expect.anything() }),
    )
  })

  it('useCurrency throws when used outside a provider', () => {
    expect(() => renderHook(() => useCurrency())).toThrow(/CurrencyProvider/)
  })
})
