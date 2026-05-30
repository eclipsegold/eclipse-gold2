import type { ReactNode } from 'react'
import styles from './CollectionGrid.module.css'

export function CollectionGrid({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>
}
