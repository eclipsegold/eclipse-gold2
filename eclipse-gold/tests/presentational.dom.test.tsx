import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ProductGallery } from '../components/ProductGallery'

afterEach(cleanup)

describe('ProductGallery', () => {
  it('renders the EG placeholder when there are no images', () => {
    render(<ProductGallery images={[]} />)
    expect(screen.getByText('EG')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders one img per image', () => {
    render(
      <ProductGallery
        images={[
          { url: 'https://cdn.example.com/a.jpg', alt: 'A' },
          { url: 'https://cdn.example.com/b.jpg', alt: 'B' },
        ]}
      />,
    )
    expect(screen.getAllByRole('img')).toHaveLength(2)
  })
})
