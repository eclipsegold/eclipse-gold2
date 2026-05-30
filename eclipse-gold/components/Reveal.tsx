'use client'
import type { ReactNode } from 'react'
import { useReveal } from './useReveal'
import styles from './Reveal.module.css'

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      data-testid="reveal"
      data-visible={visible}
      className={`${styles.reveal} ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
