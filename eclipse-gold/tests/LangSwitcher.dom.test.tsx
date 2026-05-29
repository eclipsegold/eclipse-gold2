import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LangSwitcher } from '../components/LangSwitcher'

describe('LangSwitcher', () => {
  it('renders a link per language and marks the current one', () => {
    render(<LangSwitcher current="de" />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
    expect(screen.getByText('FR')).toHaveAttribute('href', '/fr')
    expect(screen.getByText('DE')).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('FR')).not.toHaveAttribute('aria-current')
  })
})
