import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import './setup-dom'
import { Reveal } from '../components/Reveal'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  // jsdom lacks IntersectionObserver — provide a stub that fires "visible" immediately.
  class IO {
    cb: IntersectionObserverCallback
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb
    }
    observe(el: Element) {
      this.cb([{ isIntersecting: true, target: el } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
    root = null
    rootMargin = ''
    thresholds = []
  }
  vi.stubGlobal('IntersectionObserver', IO)
})

describe('Reveal', () => {
  it('renders its children', () => {
    render(
      <Reveal>
        <p>hello stars</p>
      </Reveal>,
    )
    expect(screen.getByText('hello stars')).toBeInTheDocument()
  })

  it('marks itself visible once it intersects', () => {
    render(
      <Reveal>
        <p>visible content</p>
      </Reveal>,
    )
    const wrapper = screen.getByTestId('reveal')
    expect(wrapper.getAttribute('data-visible')).toBe('true')
  })
})
