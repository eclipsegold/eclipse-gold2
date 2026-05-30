import styles from './notFound.module.css'

export default function NotFound() {
  return (
    <section className={styles.wrap}>
      <div className={styles.ring} aria-hidden="true" />
      <h1 className={styles.title}>Page introuvable</h1>
      <p className={styles.text}>Le modèle ou la page que vous cherchez n’existe pas.</p>
    </section>
  )
}
