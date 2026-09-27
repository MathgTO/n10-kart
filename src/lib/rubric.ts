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
