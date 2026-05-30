import type { Lang, LegalEntity, LegalPageContent } from '../data/types'
import { interpolateEntity } from '../lib/legal'
import styles from './LegalDocument.module.css'

const DATE_LOCALE: Record<Lang, string> = { fr: 'fr-FR', de: 'de-DE', it: 'it-IT' }
const UPDATED_LABEL: Record<Lang, string> = {
  fr: 'Dernière mise à jour',
  de: 'Zuletzt aktualisiert',
  it: 'Ultimo aggiornamento',
}

export function LegalDocument({
  content,
  lang,
  entity,
}: {
  content: LegalPageContent
  lang: Lang
  entity: LegalEntity
}) {
  const intro = interpolateEntity(content.intro[lang], entity)
  const updated = new Date(content.updatedAt).toLocaleDateString(DATE_LOCALE[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article className={styles.doc}>
      <h1 className={styles.title}>{content.title[lang]}</h1>
      {intro && <p className={styles.intro}>{intro}</p>}

      {content.sections.map((section, i) => (
        <section key={i} className={styles.section}>
          <h2 className={styles.heading}>{section.heading[lang]}</h2>
          {section.body[lang].map((para, j) => (
            <p key={j} className={styles.body}>{interpolateEntity(para, entity)}</p>
          ))}
          {section.bullets && (
            <ul className={styles.bullets}>
              {section.bullets[lang].map((item, k) => (
                <li key={k}>{interpolateEntity(item, entity)}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <p className={styles.updated}>
        {UPDATED_LABEL[lang]} : {updated}
      </p>
    </article>
  )
}
