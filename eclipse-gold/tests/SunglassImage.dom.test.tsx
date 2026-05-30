import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { SunglassImage } from '../components/SunglassImage'

afterEach(() => cleanup())

describe('SunglassImage', () => {
  it('renders an img with the given src and alt when src is provided', () => {
    render(<SunglassImage src="https://cdn/nebula.jpg" alt="NEBULA" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://cdn/nebula.jpg')
    expect(img).toHaveAttribute('alt', 'NEBULA')
  })

  it('renders the EG monogram placeholder (no img) when src is null', () => {
    render(<SunglassImage src={null} alt="NEBULA" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('EG')).toBeInTheDocument()
  })
})
