import { LANGS, type Lang, type SunglassModel, LEGAL_PAGES } from '../data/types'
import type { LegalPage, LegalPageContent, LegalEntity, Localized } from '../data/types'
import { LEGAL_SLUGS } from '../lib/i18n'

export interface ValidationError {
  code: string
  message: string
}

const LOCALIZED_STRING_FIELDS = [
  'slug', 'primaryKeyword', 'seoTitle', 'metaDescription', 'tagline', 'intro',
] as const

export function validateModels(models: SunglassModel[]): ValidationError[] {
  const errors: ValidationError[] = []

  for (const lang of LANGS) {
    assertUniquePerLang(models, lang, 'slug', 'DUPLICATE_SLUG', errors)
    assertUniquePerLang(models, lang, 'primaryKeyword', 'DUPLICATE_KEYWORD', errors)
  }

  for (const m of models) {
    for (const field of LOCALIZED_STRING_FIELDS) {
      for (const lang of LANGS) {
        if (!m[field][lang] || m[field][lang].trim() === '') {
          errors.push({
            code: 'EMPTY_TRANSLATION',
            message: `${m.handle}.${field}.${lang} is empty`,
          })
        }
      }
    }
    for (const lang of LANGS) {
      if (m.features[lang].length === 0) {
        errors.push({ code: 'EMPTY_TRANSLATION', message: `${m.handle}.features.${lang} is empty` })
      }
    }
  }

  return errors
}

function assertUniquePerLang(
  models: SunglassModel[],
  lang: Lang,
  field: 'slug' | 'primaryKeyword',
  code: string,
  errors: ValidationError[],
): void {
  const seen = new Map<string, string>()
  for (const m of models) {
    const value = m[field][lang]
    if (seen.has(value)) {
      errors.push({
        code,
        message: `${field}.${lang} "${value}" used by both ${seen.get(value)} and ${m.handle}`,
      })
    } else {
      seen.set(value, m.handle)
    }
  }
}

/** Full-set checks that only make sense once all 10 models exist. */
export function validateFullSet(models: SunglassModel[]): ValidationError[] {
  const errors = validateModels(models)
  if (models.length !== 10) {
    errors.push({ code: 'WRONG_COUNT', message: `expected 10 models, found ${models.length}` })
  }
  const orders = new Set(models.map((m) => m.order))
  if (orders.size !== models.length) {
    errors.push({ code: 'DUPLICATE_ORDER', message: 'model.order values are not unique' })
  }
  const phenomena = new Set(models.map((m) => m.phenomenon))
  if (phenomena.size !== models.length) {
    errors.push({ code: 'DUPLICATE_PHENOMENON', message: 'model.phenomenon values are not unique' })
  }
  return errors
}

/** Cross-checks the collection's modelOrder against the actual model handles. */
export function validateCollectionOrder(
  models: SunglassModel[],
  modelOrder: string[],
): ValidationError[] {
  const errors: ValidationError[] = []
  const handles = new Set(models.map((m) => m.handle))
  for (const h of modelOrder) {
    if (!handles.has(h)) {
      errors.push({
        code: 'ORPHAN_ORDER_HANDLE',
        message: `collection modelOrder references "${h}" but no model has that handle`,
      })
    }
  }
  const ordered = new Set(modelOrder)
  for (const m of models) {
    if (!ordered.has(m.handle)) {
      errors.push({
        code: 'MISSING_FROM_ORDER',
        message: `model "${m.handle}" is missing from collection modelOrder`,
      })
    }
  }
  return errors
}

function assertComplete(
  field: Localized<string>,
  where: string,
  errors: ValidationError[],
): void {
  for (const lang of LANGS) {
    if (!field[lang] || field[lang].trim() === '') {
      errors.push({ code: 'EMPTY_TRANSLATION', message: `${where}.${lang} is empty` })
    }
  }
}

/**
 * Validates the six trust pages: completeness, per-language slug uniqueness,
 * and that each page's `slug` matches the canonical routing map (LEGAL_SLUGS)
 * — the route/footer/sitemap read LEGAL_SLUGS, so a divergence would silently
 * break slug→content resolution.
 */
export function validateLegal(
  pages: Record<LegalPage, LegalPageContent>,
  canonicalSlugs: Record<LegalPage, Localized<string>> = LEGAL_SLUGS,
): ValidationError[] {
  const errors: ValidationError[] = []
  const slugsByLang: Record<Lang, Map<string, LegalPage>> = {
    fr: new Map(), de: new Map(), it: new Map(),
  }

  for (const page of LEGAL_PAGES) {
    const content = pages[page]
    if (!content) {
      errors.push({ code: 'MISSING_LEGAL_PAGE', message: `missing legal page: ${page}` })
      continue
    }

    assertComplete(content.title, `${page}.title`, errors)
    assertComplete(content.seoTitle, `${page}.seoTitle`, errors)
    assertComplete(content.metaDescription, `${page}.metaDescription`, errors)
    assertComplete(content.slug, `${page}.slug`, errors)

    for (const lang of LANGS) {
      const slug = content.slug[lang]
      if (!slug) continue
      const canonical = canonicalSlugs[page][lang]
      if (slug !== canonical) {
        errors.push({
          code: 'SLUG_MISMATCH',
          message: `slug.${lang} "${slug}" for ${page} != LEGAL_SLUGS "${canonical}"`,
        })
      }
      const prev = slugsByLang[lang].get(slug)
      if (prev) {
        errors.push({
          code: 'DUPLICATE_LEGAL_SLUG',
          message: `slug.${lang} "${slug}" used by both ${prev} and ${page}`,
        })
      } else {
        slugsByLang[lang].set(slug, page)
      }
    }

    content.sections.forEach((section, i) => {
      assertComplete(section.heading, `${page}.sections[${i}].heading`, errors)
      for (const lang of LANGS) {
        if (!Array.isArray(section.body[lang]) || section.body[lang].length === 0) {
          errors.push({ code: 'EMPTY_TRANSLATION', message: `${page}.sections[${i}].body.${lang} is empty` })
        }
        if (section.bullets && (!Array.isArray(section.bullets[lang]) || section.bullets[lang].length === 0)) {
          errors.push({ code: 'EMPTY_TRANSLATION', message: `${page}.sections[${i}].bullets.${lang} is empty` })
        }
      }
    })
  }

  return errors
}

/** Non-blocking: surfaces [À COMPLÉTER] entity placeholders before go-live. */
export function legalEntityWarnings(entity: LegalEntity): string[] {
  const warnings: string[] = []
  for (const [key, value] of Object.entries(entity)) {
    const flat = Array.isArray(value) ? value.join(' ') : value
    if (flat.includes('[À COMPLÉTER]')) {
      warnings.push(`legalEntity.${key} still contains a placeholder — complete before go-live.`)
    }
  }
  return warnings
}

// CLI runner — invoked by `npm run validate:models` (prebuild gate).
async function main(): Promise<void> {
  const { models } = await import('../data/models')
  const { collectionHub } = await import('../data/collection')
  const { legalPages, legalEntity } = await import('../data/legal')
  const errors = [
    ...validateFullSet(models),
    ...validateCollectionOrder(models, collectionHub.modelOrder),
    ...validateLegal(legalPages),
  ]
  if (errors.length > 0) {
    console.error(`✗ Validation failed (${errors.length} error(s)):`)
    for (const e of errors) console.error(`  [${e.code}] ${e.message}`)
    process.exit(1)
  }
  for (const w of legalEntityWarnings(legalEntity)) console.warn(`⚠️  ${w}`)
  console.log(`✓ ${models.length} models and ${LEGAL_PAGES.length} legal pages validated`)
}

// Run only when executed directly, not when imported by tests.
if (process.argv[1] && process.argv[1].endsWith('validate-models.ts')) {
  void main()
}
