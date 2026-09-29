import { RUBRIC } from './assertRubric'
import type { DimensionId, DrillId, SetupHypothesisId } from './types'

export const rubric = RUBRIC

export const MOSPORT_BIAS = (rubric.home_track?.circuit_notes?.coaching_bias_dimension_ids ?? [
  'D2', 'D4', 'D6', 'D8', 'D14', 'D15',
]) as DimensionId[]

export const JUNIOR_EMPHASIS = ['D2', 'D3', 'D4', 'D8', 'D18'] as DimensionId[]

export const ADVANCE_PRIORITY_AT =
  rubric.session_progress?.advance_priority_when_score_ge ?? 4

export const MYCHRON_HONEST = new Set(['D4', 'D7', 'D10', 'D18'])
export const NEEDS_KART_CAM = new Set([
  'D9', 'D12', 'D13', 'D14', 'D15', 'D16', 'D17',
])

export function getDimension(id: DimensionId) {
  return rubric.dimensions.find((d) => d.id === id)
}

export function getDrill(id: DrillId) {
  return rubric.drills.find((d) => d.id === id)
}

export function getSetupTemplate(id: SetupHypothesisId) {
  return rubric.setup_hypothesis_templates.find((t) => t.id === id)
}

export const EXIT_RPM_BAND = { lo: 5800, hi: 6100 } as const

/** Reader-facing titles for the rubric's source link-outs (the baked rubric only carries ids). */
const LINK_TITLES: Record<string, string> = {
  lorandi_overtaking: 'Overtaking in karting (PURPL)',
  lorandi_line: 'The racing line in karting (PURPL)',
  lorandi_trail: 'Trail braking in karting (PURPL)',
  swift_gearing: 'LO206 gear ratio tuning guide (Swift Karting)',
  klaus_16: '16 common karting mistakes (Briggs & Stratton Racing, PDF)',
}

function humanize(id: string): string {
  const t = id.replace(/[_-]+/g, ' ').trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function linkTitle(l: { id?: string; title?: string; label?: string; url: string }): string {
  if (l.title) return l.title
  if (l.label) return l.label
  if (l.id && LINK_TITLES[l.id]) return LINK_TITLES[l.id]
  if (l.id) return humanize(l.id)
  try {
    return new URL(l.url).hostname.replace(/^www\./, '')
  } catch {
    return 'Source'
  }
}

/** Dimension name for display (never show raw ids like "D2" in the UI). */
export function dimLabel(id: string): string {
  return rubric.dimensions.find((d) => d.id === id)?.label ?? 'this skill'
}
