import type { LegalEntity } from '../data/types'

/**
 * Replaces {token} placeholders with values from the legal entity.
 * Array fields (address, host) are joined with ", ". Unknown tokens are
 * left as-is so a typo is visible rather than silently dropped.
 */
export function interpolateEntity(text: string, entity: LegalEntity): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!Object.hasOwn(entity, key)) return match
    const value = entity[key as keyof LegalEntity]
    return Array.isArray(value) ? value.join(', ') : value
  })
}
