import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductCard } from '../components/ProductCard'

describe('ProductCard', () => {
  it('renders the model name, tagline, and a link to its slug', () => {
    render(
      <ProductCard
        href="/fr/lunettes-de-soleil-rimless-or/nebula-or-femme"
        modelName="NEBULA"
        tagline="La courbe céleste"
        image={{ url: 'https://cdn/nebula.jpg', alt: 'NEBULA' }}
      />,
    )
    expect(screen.getByText('NEBULA')).toBeInTheDocument()
    expect(screen.getByText('La courbe céleste')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/fr/lunettes-de-soleil-rimless-or/nebula-or-femme',
    )
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'NEBULA')
  })
})
