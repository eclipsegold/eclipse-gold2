import type { Lang, SunglassModel } from './types'
import { models } from './models'

export function getAllModels(): SunglassModel[] {
  return [...models]
}

export function getModelByHandle(handle: string): SunglassModel | undefined {
  return models.find((m) => m.handle === handle)
}

export function getModelBySlug(slug: string, lang: Lang): SunglassModel | undefined {
  return models.find((m) => m.slug[lang] === slug)
}
