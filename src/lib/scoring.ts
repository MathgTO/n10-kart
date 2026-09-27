import { suggestGearRatio } from './gearRatio'
import {
  ADVANCE_PRIORITY_AT,
  EXIT_RPM_BAND,
  JUNIOR_EMPHASIS,
  MOSPORT_BIAS,
  MYCHRON_HONEST,
  NEEDS_KART_CAM,
  getDimension,
  getDrill,
  getSetupTemplate,
  rubric,
} from './rubric'
import { scoreBand } from './format'
import {
  biggestLossSector,
  computeDelta,
  idealLapMs,
  pickBestFlyingLap,
  sectorLosses,
} from './telemetry'
import { MOSPORT_GP_SECTORS, sectorTitle } from '@/data/mosportSectors'
import type {
  CoachingReport,
  CornerCue,
  DimensionId,
  DimensionScore,
  DrillId,
  EvidenceKind,
  LapData,
  NextRunFocus,
  ProgressDelta,
  SeriesTag,
  SetupHypothesisId,
  StoredSession,
  WeaknessFinding,
} from './types'

const ALL_IDS = rubric.dimensions.map((d) => d.id) as DimensionId[]

function clampScore(n: number): number {
  return Math.min(5, Math.max(0, Math.round(n * 2) / 2))
}

function average(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function weightForDim(id: DimensionId, series: SeriesTag): number {
  let w = 1
  if (MOSPORT_BIAS.includes(id)) w += 0.35
  if (JUNIOR_EMPHASIS.includes(id)) w += 0.35
  const racecraft = ['D14', 'D15', 'D16', 'D17']
  if (series === 'bsc_ontario' && racecraft.includes(id)) w += 0.5
  if (series === 'practice' && racecraft.includes(id)) w -= 0.15
  return Math.max(0.4, w)
}

function evidenceKind(id: DimensionId, hasTelemetry: boolean): EvidenceKind {
  if (NEEDS_KART_CAM.has(id)) return 'needs_kart_cam'
  if (MYCHRON_HONEST.has(id) && hasTelemetry) return 'mychron'
  if (MYCHRON_HONEST.has(id)) return 'heuristic'
  return 'heuristic'
}

export function buildCornerCues(
  losses: number[],
  cornerNames: string[]
): CornerCue[] {
  const biasSet = new Set(MOSPORT_BIAS)
  const dimCycle: DimensionId[] = ['D2', 'D4', 'D6', 'D8', 'D1', 'D3']
  return losses.map((lossMs, i) => {
    const dimId = dimCycle[i % dimCycle.length]
    const dim = getDimension(dimId)
    const sector = MOSPORT_GP_SECTORS[i]
    const name = sector ? sectorTitle(sector) : cornerNames[i] ?? `S${i + 1}`
    const bad = lossMs > 40
    return {
      id: `c${i}`,
      name,
      sectorCode: sector?.code,
      turns: sector?.turns,
      primaryTurnName: sector?.primaryTurnName,
      sectorIndex: i,
      dimId,
      good: dim?.good_cues[0] ?? 'Solid',
      bad: dim?.bad_cues[0] ?? 'Loss vs reference',
      cue: bad
        ? dim?.example_feedback.mid ?? 'One cue: later apex, earlier throttle.'
        : dim?.example_feedback.high ?? 'Keep stacking this.',
      bias: biasSet.has(dimId),
      lossMs,
    }
  })
}

function scoreFromTelemetry(
  laps: LapData[],
  refIdx: number,
  series: SeriesTag,
  conditions: 'dry' | 'wet',
  hasVideo: boolean
): DimensionScore[] {
  const bestIdx = pickBestFlyingLap(laps)
  const ref = laps[refIdx] ?? laps[bestIdx]
  const best = laps[bestIdx] ?? ref
  const losses = sectorLosses(best.samples, ref.samples, 4)
  const maxLoss = Math.max(...losses, 0)
  const exitRpm = best.exitRpmFocus ?? 5500
  const ideal = idealLapMs(laps)
  const consistencyGap =
    ideal != null ? best.timeMs - ideal : laps.length > 1 ? 200 : 100

  // D4 exit commitment from exit RPM band
  let d4 = 3.5
  if (exitRpm >= EXIT_RPM_BAND.lo && exitRpm <= EXIT_RPM_BAND.hi) d4 = 4.5
  else if (exitRpm < EXIT_RPM_BAND.lo - 300) d4 = 2.0
  else if (exitRpm < EXIT_RPM_BAND.lo) d4 = 2.5
  else if (exitRpm > EXIT_RPM_BAND.hi) d4 = 3.0 // living on limiter — gearing talk

  // D7 braking consistency from sector loss variance
  const variance = average(losses.map((l) => Math.abs(l)))
  let d7 = variance < 30 ? 4.0 : variance < 80 ? 3.0 : 2.0

  // D10 throttle smoothness — proxy from speed smoothness near exits
  let d10 = maxLoss > 120 ? 2.5 : maxLoss > 60 ? 3.0 : 4.0

  // D18 consistency
  let d18 = consistencyGap < 150 ? 4.5 : consistencyGap < 350 ? 3.0 : 2.0

  const seeded: Record<string, number> = {
    D4: d4,
    D7: d7,
    D10: d10,
    D18: d18,
  }

  return ALL_IDS.map((id) => {
    let score: number
    if (seeded[id] != null) {
      score = seeded[id]
    } else {
      score = 3.2
      if (JUNIOR_EMPHASIS.includes(id) || MOSPORT_BIAS.includes(id)) score = 2.9
      if (['D14', 'D15', 'D16', 'D17'].includes(id)) {
        score = series === 'practice' ? 3.8 : series === 'bsc_ontario' ? 2.7 : 3.0
      }
      if (id === 'D20') score = conditions === 'wet' ? 3.0 : 4.0
      const jitter = ((id.charCodeAt(1) % 5) - 2) * 0.25
      score += jitter
    }
    // Soften with max loss for lap-craft dims
    if (['D1', 'D2', 'D3', 'D5', 'D6', 'D8'].includes(id) && maxLoss > 80) {
      score -= 0.5
    }
    const kind = evidenceKind(id, true)
    const dim = getDimension(id)
    const band = scoreBand(score)
    const markers: string[] = []
    if (MYCHRON_HONEST.has(id)) {
      if (id === 'D4') markers.push(`Exit RPM ~${Math.round(exitRpm)}`)
      if (id === 'D7') markers.push(`S1–S4 spread ~${Math.round(variance)} ms`)
      if (id === 'D18') markers.push(`vs ideal ${Math.round(consistencyGap)} ms`)
      if (id === 'D10') markers.push(`Peak S-split loss ${Math.round(maxLoss)} ms`)
    }
    if (kind === 'needs_kart_cam' && !hasVideo) {
      // Do not fake video evidence — leave markers empty / note
    }
    return {
      dimension_id: id,
      score: clampScore(score),
      evidence_kind: hasVideo && NEEDS_KART_CAM.has(id) ? 'kart_cam' : kind,
      evidence_markers: markers,
      notes: dim?.example_feedback[band],
    }
  })
}

function computeComposites(scores: DimensionScore[]) {
  const map = new Map(scores.map((s) => [s.dimension_id, s.score]))
  const avgIds = (ids: string[]) => average(ids.map((id) => map.get(id) ?? 0))
  const q = avgIds(rubric.composites.qualifying_pace_index)
  const r = avgIds(rubric.composites.racecraft_index)
  const raceParts: number[] = []
  for (const part of rubric.composites.race_win_index) {
    if (part === 'qualifying_pace_index') raceParts.push(q)
    else if (part === 'racecraft_index') raceParts.push(r)
    else raceParts.push(map.get(part) ?? 0)
  }
  return {
    qualifying_pace_index: clampScore(q),
    racecraft_index: clampScore(r),
    race_win_index: clampScore(average(raceParts)),
  }
}

function pickTopWeaknesses(scores: DimensionScore[], series: SeriesTag, max = 3): WeaknessFinding[] {
  const ranked = [...scores]
    .map((s) => ({ ...s, weighted: s.score / weightForDim(s.dimension_id, series) }))
    .sort((a, b) => a.weighted - b.weighted)
  const out: WeaknessFinding[] = []
  for (const s of ranked) {
    if (out.length >= max) break
    if (s.score >= 4.5) continue
    const dim = getDimension(s.dimension_id)
    out.push({
      dimension_id: s.dimension_id,
      score: s.score,
      marker: s.evidence_markers[0] ?? (s.evidence_kind === 'needs_kart_cam' ? 'needs kart-cam' : '—'),
      cue: dim?.bad_cues[0] ?? dim?.example_feedback[scoreBand(s.score)] ?? 'Needs work',
    })
  }
  return out
}

function pickStrengths(scores: DimensionScore[], max = 3): WeaknessFinding[] {
  const ranked = [...scores].sort((a, b) => b.score - a.score)
  const out: WeaknessFinding[] = []
  for (const s of ranked) {
    if (out.length >= max) break
    if (s.score < 3.5) continue
    const dim = getDimension(s.dimension_id)
    out.push({
      dimension_id: s.dimension_id,
      score: s.score,
      marker: s.evidence_markers[0] ?? '—',
      cue: dim?.good_cues[0] ?? dim?.example_feedback.high ?? 'Solid',
    })
  }
  return out
}

function resolvePrimaryDrill(
  weaknesses: WeaknessFinding[],
  previousPriority?: DimensionId,
  previousScores?: DimensionScore[]
): { id: DrillId; name: string; message: string; dimension_id: DimensionId; advanced: boolean } {
  let advanced = false
  let focusDim = weaknesses[0]?.dimension_id
  if (previousPriority && previousScores) {
    const prev = previousScores.find((s) => s.dimension_id === previousPriority)
    if (prev && prev.score < ADVANCE_PRIORITY_AT) {
      focusDim = previousPriority
    } else if (prev && prev.score >= ADVANCE_PRIORITY_AT) {
      advanced = true
      focusDim =
        weaknesses.find((w) => w.dimension_id !== previousPriority)?.dimension_id ??
        weaknesses[0]?.dimension_id
    }
  }
  focusDim = focusDim ?? 'D2'
  const dim = getDimension(focusDim)
  const drillId = (dim?.primary_drill_id ?? 'later_turn_in') as DrillId
  const drill = getDrill(drillId)
  const message = advanced
    ? `Priority advanced (≥${ADVANCE_PRIORITY_AT}). New focus: ${dim?.label ?? focusDim}. ${drill?.instruction ?? ''}`
    : `One priority: ${drill?.name ?? drillId}. ${drill?.instruction ?? ''}`
  return {
    id: drillId,
    name: drill?.name ?? drillId,
    message,
    dimension_id: focusDim,
    advanced,
  }
}

function buildSetupHypotheses(
  scores: DimensionScore[],
  series: SeriesTag,
  exitRpm?: number,
  maxRpm?: number,
  maxSpeed?: number
): CoachingReport['setup_hypotheses'] {
  // Kept for report/internal consumers. User-facing tire/gear/clutch copy lives in HealthDiagnostic.
  const map = new Map(scores.map((s) => [s.dimension_id, s.score]))
  const picks: SetupHypothesisId[] = []
  const custom: { id: SetupHypothesisId; message: string }[] = []
  const exit = map.get('D4') ?? 5
  const tires = map.get('D19') ?? 5
  const throttle = map.get('D10') ?? 5
  const consistency = map.get('D18') ?? 5

  if (tires <= 3.5) picks.push('tire_pressure_session')
  if (tires <= 3 || series === 'race' || series === 'mika' || series === 'bsc_ontario') {
    picks.push('tire_pressure_race_heat')
  }
  if (tires <= 3) {
    custom.push({
      id: 'tire_pressure_session',
      message:
        'Tire pressure (setup): D19 soft — log cold→hot PSI; reset cold before next run. See Health diagnostic.',
    })
  }

  const gear = suggestGearRatio({
    maxRpm,
    maxSpeedKmh: maxSpeed,
    exitRpm,
    series,
  })
  if (gear) {
    picks.push('gear_ratio_optimize')
    if (gear.action === 'plus') picks.push('gear_plus_one')
    if (gear.action === 'minus') picks.push('gear_minus_one')
    custom.push({
      id: 'gear_ratio_optimize',
      message: `Gear (setup): ${gear.action === 'hold' ? 'Hold' : gear.action === 'plus' ? '+ rear tooth' : '− rear tooth'} — see Health diagnostic for diagnosis + optimize.`,
    })
  } else if (exitRpm != null && exitRpm < EXIT_RPM_BAND.lo) {
    picks.push('gear_plus_one')
    picks.push('restricted_slide_gearing')
  }
  if (series === 'bsc_ontario' || series === 'mika' || series === 'qualifying' || series === 'race') {
    picks.push('restricted_slide_gearing')
  }
  if (exit <= 2.5 && throttle >= 3.5) picks.push('chassis_before_engine')
  if ((map.get('D17') ?? 5) <= 2.5) picks.push('clutch_health')
  if (consistency <= 2.5 && tires <= 3.5) picks.push('tire_pressure_race_heat')

  const preferred = (rubric.preferred_setup_hypothesis_ids ?? []) as string[]
  const ordered = [
    ...preferred.filter((id) => picks.includes(id as SetupHypothesisId)),
    ...picks.filter((id) => !preferred.includes(id)),
  ]
  const unique = [...new Set(ordered)].slice(0, 5)
  const customMap = new Map(custom.map((c) => [c.id, c.message]))
  return unique.map((id) => {
    const t = getSetupTemplate(id)
    return {
      id,
      tag: 'setup' as const,
      message: customMap.get(id) ?? t?.message ?? `Setup: ${id}`,
    }
  })
}

function vsLast(current: DimensionScore[], previous?: DimensionScore[] | null): ProgressDelta[] {
  if (!previous?.length) return []
  const prevMap = new Map(previous.map((s) => [s.dimension_id, s.score]))
  return current
    .map((s) => {
      const p = prevMap.get(s.dimension_id)
      if (p == null) return null
      return { dimension_id: s.dimension_id, previous: p, current: s.score, delta: s.score - p }
    })
    .filter((x): x is ProgressDelta => x != null)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

const DEFAULT_CORNERS = MOSPORT_GP_SECTORS.map((s) => sectorTitle(s))

export function buildFocus(
  laps: LapData[],
  refIdx: number,
  bestIdx: number,
  cornerNames: string[],
  drillName: string,
  drillInstruction: string
): NextRunFocus {
  const best = laps[bestIdx]
  // Compare lap under the microscope (slower). Fall back to 2nd-best when ref==best.
  let compareIdx = refIdx
  if (compareIdx === bestIdx && laps.length > 1) {
    const ordered = laps
      .map((l, i) => ({ i, t: l.timeMs }))
      .sort((a, b) => a.t - b.t)
    compareIdx = ordered[1]?.i ?? bestIdx
  }
  const compare = laps[compareIdx]
  const useLosses =
    best && compare ? sectorLosses(compare.samples, best.samples, 4) : [0, 0, 0, 0]
  const sectorIndex = biggestLossSector(useLosses)
  const lossMs = useLosses[sectorIndex] ?? 0
  const sector = MOSPORT_GP_SECTORS[sectorIndex]
  return {
    sectorIndex,
    cornerName: sector?.primaryTurnName ?? cornerNames[sectorIndex] ?? `T?`,
    sectorLabel: sector ? sectorTitle(sector) : cornerNames[sectorIndex] ?? `S${sectorIndex + 1}`,
    lossMs,
    brake: 'Firm stop on the straight — no coast shelf into turn-in.',
    apex: 'Later apex that supports exit — not kerb worship.',
    exit: 'Earlier progressive throttle; full track-out. Protect exit RPM.',
    drillName,
    drillInstruction,
    exitRpm: compare?.exitRpmFocus ?? best?.exitRpmFocus,
    referenceLapIndex: refIdx,
    bestLapIndex: bestIdx,
  }
}

export interface BuildReportInput {
  sessionId: string
  track: string
  classAssumption: string
  series: SeriesTag
  conditions: 'dry' | 'wet'
  laps: LapData[]
  referenceLapIndex: number
  cornerNames?: string[]
  hasVideo?: boolean
  previousSession?: StoredSession | null
}

export function buildCoachingReport(input: BuildReportInput): {
  report: CoachingReport
  corners: CornerCue[]
} {
  const bestIdx = pickBestFlyingLap(input.laps)
  const refIdx = input.referenceLapIndex
  const scores = scoreFromTelemetry(
    input.laps,
    refIdx,
    input.series,
    input.conditions,
    !!input.hasVideo
  )
  const composites = computeComposites(scores)
  const top_weaknesses = pickTopWeaknesses(scores, input.series, 3) // M2 hard cap 3
  const strengths = pickStrengths(scores, 3)
  const primary = resolvePrimaryDrill(
    top_weaknesses,
    input.previousSession?.activePriorityDimensionId,
    input.previousSession?.report.scores
  )
  const best = input.laps[bestIdx]
  const setup_hypotheses = buildSetupHypotheses(scores, input.series, best?.exitRpmFocus, best?.maxRpm, best?.maxSpeed)
  const names = input.cornerNames ?? DEFAULT_CORNERS
  // Compare lap = referenceLapIndex (the lap under the microscope).
  // Best ★ stays the target. Delta/losses = compare vs best (positive = compare slower).
  let compareIdx = refIdx
  if (compareIdx === bestIdx && input.laps.length > 1) {
    const ordered = input.laps
      .map((l, i) => ({ i, t: l.timeMs }))
      .sort((a, b) => a.t - b.t)
    compareIdx = ordered[1]?.i ?? bestIdx
  }
  const compare = input.laps[compareIdx]
  const losses =
    best && compare
      ? sectorLosses(compare.samples, best.samples, 4)
      : [0, 0, 0, 0]
  const corners = buildCornerCues(losses, names)
  const focus = buildFocus(
    input.laps,
    refIdx,
    bestIdx,
    names,
    primary.name,
    getDrill(primary.id)?.instruction ?? primary.message
  )

  let racecraft_cue: string | null = null
  if (input.series === 'bsc_ontario' || input.series === 'race' || input.series === 'mika') {
    const d15 = scores.find((s) => s.dimension_id === 'D15')
    racecraft_cue =
      d15 && d15.score < 3.5
        ? 'Outside usually donates — present earlier or wait a corner. Own inside before turn-in; protect exit.'
        : 'Keep passes planned one corner ahead. Draft, own inside, exit sticks.'
  }

  const report: CoachingReport = {
    session_id: input.sessionId,
    track: input.track,
    class_assumption: input.classAssumption,
    scores,
    composites,
    top_weaknesses,
    strengths,
    primary_drill: { id: primary.id, name: primary.name, message: primary.message },
    priority_dimension_id: primary.dimension_id,
    priority_advanced: primary.advanced,
    setup_hypotheses,
    racecraft_cue,
    vs_last: vsLast(scores, input.previousSession?.report.scores),
    focus,
    source_linkouts: (rubric.source_linkouts ?? []).map((l: { id?: string; title?: string; label?: string; url: string }) => ({
      title: l.title ?? l.label ?? l.id ?? 'Source',
      url: l.url,
    })),
  }
  return { report, corners }
}

export { computeDelta, sectorLosses, pickBestFlyingLap }
