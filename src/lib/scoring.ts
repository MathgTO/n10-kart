import { suggestGearRatio } from './gearRatio'
import { getClassConfig } from './classConfig'
import { cornerExitStats, exitInWindow, scoreCornerExit } from './cornerExit'
import {
  ADVANCE_PRIORITY_AT,
  JUNIOR_EMPHASIS,
  MOSPORT_BIAS,
  MYCHRON_HONEST,
  NEEDS_KART_CAM,
  getDimension,
  getDrill,
  getSetupTemplate,
  linkTitle,
  rubric,
} from './rubric'
import { scoreBand } from './format'
import {
  biggestLossSector,
  computeDelta,
  idealLapMs,
  lapValidity,
  pickBestFlyingLap,
  pickCompareLap,
  resolveCompareLap,
  samplesInRange,
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

export type ChannelFlags = { speed: boolean; rpm: boolean; lapTimes: boolean }

/** Infer which MyChron channels are actually present on lap samples. */
export function detectChannels(laps: LapData[]): ChannelFlags {
  let speed = false
  let rpm = false
  for (const lap of laps) {
    if ((lap.maxSpeed ?? 0) > 0) speed = true
    if ((lap.maxRpm ?? 0) > 0) rpm = true
    if ((lap.exitRpmFocus ?? 0) > 0) rpm = true
    for (const s of lap.samples) {
      if (s.speed > 0) speed = true
      if (s.rpm > 0) rpm = true
      if (speed && rpm) break
    }
    if (speed && rpm) break
  }
  return { speed, rpm, lapTimes: laps.length > 0 }
}

/** True MyChron dims need specific channels; others are heuristic / video. */
function mychronChannelsOk(id: DimensionId, ch: ChannelFlags): boolean {
  if (id === 'D4') return ch.rpm
  if (id === 'D7') return ch.speed
  if (id === 'D10') return ch.speed
  if (id === 'D18') return ch.lapTimes
  return ch.speed || ch.rpm
}

function evidenceKind(
  id: DimensionId,
  hasTelemetry: boolean,
  hasVideo: boolean,
  ch: ChannelFlags
): EvidenceKind {
  if (NEEDS_KART_CAM.has(id)) {
    return hasVideo ? 'kart_cam' : 'needs_kart_cam'
  }
  if (MYCHRON_HONEST.has(id)) {
    return hasTelemetry && mychronChannelsOk(id, ch) ? 'mychron' : 'heuristic'
  }
  return 'heuristic'
}

function isAvailableScore(s: DimensionScore): s is DimensionScore & { score: number } {
  return s.score != null && Number.isFinite(s.score)
}

/**
 * Which driving skill a sector's loss points to, from the data:
 * lower minimum (corner) speed than the best lap → apex / mid-corner (D3);
 * otherwise lower speed at the end of the sector → exit commitment (D4).
 * Without a speed trace there is nothing to attribute, so fall back to consistency (D18).
 */
function sectorDimension(
  i: number,
  sectors: number,
  best?: LapData,
  compare?: LapData
): DimensionId {
  if (!best || !compare) return 'D18'
  const a = i / sectors
  const b = (i + 1) / sectors
  const bs = samplesInRange(best.samples, a, b)
  const cs = samplesInRange(compare.samples, a, b)
  if (bs.length < 3 || cs.length < 3) return 'D18'
  const minOf = (xs: typeof bs) => Math.min(...xs.map((x) => x.speed))
  if (!(minOf(bs) > 0) || !(minOf(cs) > 0)) return 'D18'
  const tail = (xs: typeof bs) => {
    const k = Math.max(1, Math.floor(xs.length * 0.25))
    return average(xs.slice(-k).map((x) => x.speed))
  }
  const dMin = minOf(bs) - minOf(cs)
  const dExit = tail(bs) - tail(cs)
  return dMin >= dExit ? 'D3' : 'D4'
}

export function buildCornerCues(
  losses: number[],
  cornerNames: string[],
  best?: LapData,
  compare?: LapData
): CornerCue[] {
  const biasSet = new Set(MOSPORT_BIAS)
  return losses.map((lossMs, i) => {
    const dimId = sectorDimension(i, losses.length, best, compare)
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

/** One braking zone on a lap: the local speed minimum and the peak deceleration leading into it. */
interface BrakeZone {
  dMin: number
  vMin: number
  /** km/h per second */
  peakDecel: number
}

/** Braking zones from the speed trace: local minima at least 12 km/h below the preceding maximum. */
function brakeZones(samples: LapData['samples']): BrakeZone[] {
  const out: BrakeZone[] = []
  if (samples.length < 10) return out
  let lastMin = 0
  for (let i = 1; i < samples.length - 1; i++) {
    const v = samples[i].speed
    if (!(v > 0) || !(v <= samples[i - 1].speed && v < samples[i + 1].speed)) continue
    let iMax = i
    for (let j = i - 1; j >= lastMin; j--) if (samples[j].speed > samples[iMax].speed) iMax = j
    if (samples[iMax].speed - v < 12) continue
    let peak = 0
    for (let j = iMax + 1; j <= i; j++) {
      const dt = samples[j].t - samples[j - 1].t
      if (dt > 0) peak = Math.max(peak, (samples[j - 1].speed - samples[j].speed) / dt)
    }
    out.push({ dMin: samples[i].dist, vMin: v, peakDecel: peak })
    lastMin = i
  }
  return out
}

/** The compare lap's matching zone (minimum within ±2% of the lap around the best lap's minimum). */
function matchZone(samples: LapData['samples'], z: BrakeZone): { dMin: number; peakDecel: number } | null {
  const win = samples.filter((x) => Math.abs(x.dist - z.dMin) <= 0.02 && x.speed > 0)
  if (win.length < 2) return null
  const m = win.reduce((a, b) => (b.speed < a.speed ? b : a))
  const lead = samples.filter((x) => x.dist >= m.dist - 0.06 && x.dist <= m.dist)
  let peak = 0
  for (let j = 1; j < lead.length; j++) {
    const dt = lead[j].t - lead[j - 1].t
    if (dt > 0) peak = Math.max(peak, (lead[j - 1].speed - lead[j].speed) / dt)
  }
  return { dMin: m.dist, peakDecel: peak }
}

function median(xs: number[]): number {
  const a = [...xs].sort((p, q) => p - q)
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

/**
 * Data-backed ESTIMATES (evidence_kind 'heuristic', low confidence) — only where the MyChron speed trace /
 * lap times give a realistic basis, always against the driver's own best lap:
 *  - D2 turn-in timing: where the minimum-speed point lands vs the best lap (early dart / late turn shift it)
 *  - D5 braking aggressiveness: peak deceleration into each corner vs the best lap
 *  - D19 tire management: lap-time fade at the end of the run vs best (setup/tire context → no letter)
 */
function dataEstimates(laps: LapData[], best: LapData, ref: LapData): Partial<Record<DimensionId, { score: number; markers: string[]; confounded?: boolean }>> {
  const out: Partial<Record<DimensionId, { score: number; markers: string[]; confounded?: boolean }>> = {}
  if (ref !== best && best.samples.length >= 20 && ref.samples.length >= 20) {
    const zones = brakeZones(best.samples)
    const pairs = zones.map((z) => ({ z, c: matchZone(ref.samples, z) })).filter((p): p is { z: BrakeZone; c: { dMin: number; peakDecel: number } } => p.c != null)
    if (pairs.length >= 3) {
      const offS = median(pairs.map((p) => Math.abs(p.c.dMin - p.z.dMin))) * (best.timeMs / 1000)
      const d2 = offS <= 0.3 ? 4.0 : offS <= 0.6 ? 3.5 : offS <= 0.9 ? 3.0 : 2.5
      out.D2 = { score: d2, markers: [`Min-speed point ~${offS.toFixed(1)} s off best lap (median, ${pairs.length} corners)`] }
      const withDecel = pairs.filter((p) => p.z.peakDecel > 0)
      if (withDecel.length >= 3) {
        const ratio = median(withDecel.map((p) => p.c.peakDecel / p.z.peakDecel))
        const bestG = median(withDecel.map((p) => p.z.peakDecel)) / 3.6 / 9.81
        const d5 = ratio >= 0.95 ? 4.0 : ratio >= 0.85 ? 3.5 : ratio >= 0.75 ? 3.0 : 2.5
        out.D5 = { score: d5, markers: [`Peak decel ~${bestG.toFixed(2)} g on best lap · compare lap ~${Math.round(ratio * 100)}% of that`] }
      }
    }
  }
  const v = lapValidity(laps)
  const ok = laps.filter((l, i) => v[i] === 'ok' && l.timeMs > 0)
  if (ok.length >= 5) {
    const bestMs = Math.min(...ok.map((l) => l.timeMs))
    const tail = ok.slice(-2)
    const fade = (tail.reduce((a, l) => a + l.timeMs, 0) / tail.length - bestMs) / bestMs
    const d19 = fade < 0.005 ? 4.0 : fade < 0.01 ? 3.5 : fade < 0.02 ? 3.0 : 2.5
    out.D19 = { score: d19, markers: [`Last laps +${((fade * bestMs) / 1000).toFixed(2)} s vs best (end-of-run fade)`], confounded: true }
  }
  return out
}

function scoreFromTelemetry(
  laps: LapData[],
  refIdx: number,
  series: SeriesTag,
  conditions: 'dry' | 'wet',
  hasVideo: boolean,
  channels?: ChannelFlags,
  opts: ScoreOpts = {}
): DimensionScore[] {
  const cls = getClassConfig(opts.classId)
  const ch = channels ?? detectChannels(laps)
  const hasTelemetry = ch.speed || ch.rpm || ch.lapTimes
  const bestIdx = pickBestFlyingLap(laps)
  const ref = laps[resolveCompareLap(laps, refIdx, bestIdx)] ?? laps[bestIdx]
  const best = laps[bestIdx] ?? ref
  // Positive = compare lap slower than best in that sector
  const losses = sectorLosses(ref.samples, best.samples, 4)
  const maxLoss = Math.max(...losses, 0)
  const ideal = idealLapMs(laps)
  const consistencyGap =
    ideal != null ? best.timeMs - ideal : laps.length > 1 ? 200 : 100

  // D4 corner exits: RPM 0.8 s after slow-corner minima vs the class corner-exit floor (never the peak band).
  const floor = cls.cornerExitLowRpm
  const exits = cornerExitStats(laps, floor)
  const d4: number | null =
    floor != null && exits.medianRpm08 != null && exits.windows.length >= 3 ? scoreCornerExit(exits.medianRpm08, floor) : null
  const gpsOnly = opts.speedSource === 'gps'
  const d4Confounded = d4 == null || gpsOnly || !!opts.exitsConfounded
  const d4Reason = floor == null
    ? 'Class corner-exit floor unknown — no exit grade.'
    : exits.windows.length < 3
      ? 'Not enough slow-corner windows for an exit grade.'
      : opts.exitsConfounded
        ? 'Kart setup is the likely limiter on exits this outing — see the setup card.'
        : gpsOnly
          ? 'GPS speed only — exit grade is medium confidence (context only).'
          : undefined

  // D3 apex from sector-loss evidence only (sector whose loss shows a lower minimum speed than best).
  const cuesForD3 = buildCornerCues(losses, MOSPORT_GP_SECTORS.map((x) => sectorTitle(x)), best, ref !== best ? ref : undefined)
  const d3Loss = Math.max(0, ...cuesForD3.filter((c) => c.dimId === 'D3' && (c.lossMs ?? 0) > 40).map((c) => c.lossMs ?? 0))
  const d3: number | null =
    ref !== best && d3Loss > 40 ? (d3Loss < 80 ? 4.0 : d3Loss < 150 ? 3.5 : d3Loss < 250 ? 3.0 : d3Loss < 400 ? 2.5 : 2.0) : null

  // D7 braking consistency from sector loss variance
  const variance = average(losses.map((l) => Math.abs(l)))
  let d7 = variance < 30 ? 4.0 : variance < 80 ? 3.0 : 2.0

  // D10 throttle smoothness — proxy from speed smoothness near exits
  let d10 = maxLoss > 120 ? 2.5 : maxLoss > 60 ? 3.0 : 4.0

  // D18 consistency
  let d18 = consistencyGap < 150 ? 4.5 : consistencyGap < 350 ? 3.0 : 2.0

  const estimates = dataEstimates(laps, best, ref)

  const seeded: Record<string, number> = {
    D7: d7,
    D10: d10,
    D18: d18,
  }

  return ALL_IDS.map((id) => {
    const dim = getDimension(id)

    // Kart-cam vision / racecraft dims: no invented score without footage
    if (NEEDS_KART_CAM.has(id) && !hasVideo) {
      return {
        dimension_id: id,
        score: null,
        evidence_kind: 'needs_kart_cam' as EvidenceKind,
        evidence_markers: [],
        unavailable_reason: 'needs_cam' as const,
        notes: 'Not scored: needs someone watching on track. N10 only reads logger data.',
      }
    }

    // Honest MyChron dims: N/A when required channels are missing
    if (MYCHRON_HONEST.has(id) && !mychronChannelsOk(id, ch)) {
      const need =
        id === 'D4' ? 'RPM' : id === 'D18' ? 'lap times' : 'speed'
      return {
        dimension_id: id,
        score: null,
        evidence_kind: 'heuristic' as EvidenceKind,
        evidence_markers: [],
        unavailable_reason: 'needs_channels' as const,
        notes: `Needs MyChron ${need} channel.`,
      }
    }

    if (id === 'D4') {
      const markers: string[] = []
      if (exits.medianRpm08 != null) markers.push(`Exit ~${Math.round(exits.medianRpm08)} RPM at 0.8 s · min ~${Math.round(exits.medianMinSpeed ?? 0)} km/h`)
      if (floor != null) markers.push(`floor ~${floor} RPM (${cls.label})`)
      if (d4 == null) {
        return {
          dimension_id: id,
          score: null,
          evidence_kind: 'heuristic' as EvidenceKind,
          evidence_markers: markers,
          unavailable_reason: ch.rpm && ch.speed ? undefined : ('needs_channels' as const),
          setup_confounded: true,
          confidence: 'low' as const,
          notes: d4Reason ?? 'Needs MyChron RPM + speed.',
        }
      }
      return {
        dimension_id: id,
        score: d4,
        evidence_kind: 'mychron' as EvidenceKind,
        evidence_markers: markers,
        setup_confounded: d4Confounded,
        confidence: gpsOnly ? ('medium' as const) : ('high' as const),
        notes: d4Reason ?? dim?.example_feedback[scoreBand(d4)],
      }
    }
    if (id === 'D3' && d3 != null) {
      return {
        dimension_id: id,
        score: d3,
        evidence_kind: 'mychron' as EvidenceKind,
        evidence_markers: [`Sector loss with lower minimum speed ~${Math.round(d3Loss)} ms`],
        confidence: 'medium' as const,
        notes: dim?.example_feedback[scoreBand(d3)],
      }
    }

    // Measured MyChron dims with a seeded score (D7 / D10 / D18).
    if (seeded[id] != null && MYCHRON_HONEST.has(id)) {
      const clamped = clampScore(seeded[id])
      const band = scoreBand(clamped)
      const markers: string[] = []
      if (id === 'D7') markers.push(`S1–S4 spread ~${Math.round(variance)} ms`)
      if (id === 'D18') markers.push(`vs ideal ${Math.round(consistencyGap)} ms`)
      if (id === 'D10') markers.push(`Peak S-split loss ${Math.round(maxLoss)} ms`)
      return {
        dimension_id: id,
        score: clamped,
        evidence_kind: 'mychron' as EvidenceKind,
        evidence_markers: markers,
        notes: dim?.example_feedback[band],
      }
    }

    // Data-backed estimates (D2 / D5 / D19) — real speed-trace / lap-time evidence, never a constant guess.
    const est = estimates[id]
    if (est && hasTelemetry) {
      const clamped = clampScore(est.score)
      return {
        dimension_id: id,
        score: clamped,
        evidence_kind: 'heuristic' as EvidenceKind,
        evidence_markers: est.markers,
        setup_confounded: est.confounded || undefined,
        confidence: 'low' as const,
        notes: est.confounded
          ? 'Estimate from lap times — tires/setup explain fade as much as driving, so context only (see the setup card).'
          : `Estimate from the MyChron speed trace vs your best lap. ${dim?.example_feedback[scoreBand(clamped)] ?? ''}`.trim(),
      }
    }

    // No realistic logger/GPS basis (or video needed): stay N/A — never invent a constant "estimate".
    const kind = evidenceKind(id, hasTelemetry, hasVideo, ch)
    return {
      dimension_id: id,
      score: null,
      evidence_kind: kind,
      evidence_markers: [],
      notes:
        kind === 'needs_kart_cam'
          ? 'Not scored: needs someone watching on track. N10 only reads logger data.'
          : id === 'D20' && conditions !== 'wet'
            ? 'Dry session — wet driving not graded.'
            : 'No realistic basis in MyChron speed/RPM data — not graded.',
    }
  })
}

function computeComposites(scores: DimensionScore[]) {
  const map = new Map(scores.map((s) => [s.dimension_id, s.score]))
  const avgIds = (ids: string[]): number | null => {
    const vals = ids
      .map((id) => map.get(id))
      .filter((n): n is number => n != null && Number.isFinite(n))
    if (!vals.length) return null
    return clampScore(average(vals))
  }
  const q = avgIds(rubric.composites.qualifying_pace_index)
  const r = avgIds(rubric.composites.racecraft_index)
  const raceParts: number[] = []
  for (const part of rubric.composites.race_win_index) {
    if (part === 'qualifying_pace_index') {
      if (q != null) raceParts.push(q)
    } else if (part === 'racecraft_index') {
      if (r != null) raceParts.push(r)
    } else {
      const v = map.get(part)
      if (v != null && Number.isFinite(v)) raceParts.push(v)
    }
  }
  return {
    qualifying_pace_index: q,
    racecraft_index: r,
    race_win_index: raceParts.length ? clampScore(average(raceParts)) : null,
  }
}

/** Measured (MyChron or video) and not setup-confounded — the only scores that can drive priority or get letters. */
export function isMeasured(s: DimensionScore): s is DimensionScore & { score: number } {
  return isAvailableScore(s) && (s.evidence_kind === 'mychron' || s.evidence_kind === 'kart_cam') && !s.setup_confounded
}

function pickTopWeaknesses(scores: DimensionScore[], series: SeriesTag, max = 3): WeaknessFinding[] {
  const ranked = scores
    .filter(isMeasured)
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
      marker: s.evidence_markers[0] ?? '—',
      cue: dim?.bad_cues[0] ?? dim?.example_feedback[scoreBand(s.score)] ?? 'Needs work',
    })
  }
  return out
}

function pickStrengths(scores: DimensionScore[], max = 3): WeaknessFinding[] {
  const ranked = scores.filter(isMeasured).sort((a, b) => b.score - a.score)
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

/**
 * One priority, from measured evidence only (heuristic estimates never drive priority):
 * 1) pinned priority from this driver's previous session while it is still measured and < ADVANCE_PRIORITY_AT;
 * 2) the turn that lost the most time (sector-loss evidence → its skill's drill, craft-only even when the kart is the limiter);
 * 3) the weakest measured skill; 4) consistency.
 */
function resolvePrimaryDrill(
  weaknesses: WeaknessFinding[],
  scores: DimensionScore[],
  focusDim?: DimensionId,
  previousPriority?: DimensionId
): { id: DrillId; name: string; message: string; dimension_id: DimensionId; advanced: boolean } {
  let advanced = false
  let pick: DimensionId | undefined
  if (previousPriority) {
    const now = scores.find((s) => s.dimension_id === previousPriority)
    if (now && isMeasured(now)) {
      if (now.score < ADVANCE_PRIORITY_AT) pick = previousPriority
      else advanced = true
    }
  }
  pick = pick ?? focusDim ?? weaknesses[0]?.dimension_id ?? 'D18'
  const dim = getDimension(pick)
  const drillId = (dim?.primary_drill_id ?? 'later_turn_in') as DrillId
  const drill = getDrill(drillId)
  const message = advanced
    ? `Last priority is now solid (≥${ADVANCE_PRIORITY_AT}). Next focus: ${drill?.name ?? drillId}. ${drill?.instruction ?? ''}`
    : `One priority: ${drill?.name ?? drillId}. ${drill?.instruction ?? ''}`
  return {
    id: drillId,
    name: drill?.name ?? drillId,
    message,
    dimension_id: pick,
    advanced,
  }
}

function buildSetupHypotheses(
  scores: DimensionScore[],
  series: SeriesTag,
  classId?: string,
  maxRpm?: number,
  maxSpeed?: number
): CoachingReport['setup_hypotheses'] {
  // Kept for report/internal consumers. User-facing tire/gear/clutch copy lives in HealthDiagnostic.
  const map = new Map(scores.map((s) => [s.dimension_id, s.score]))
  const picks: SetupHypothesisId[] = []
  const custom: { id: SetupHypothesisId; message: string }[] = []
  const num = (id: string, fallback = 5) => {
    const v = map.get(id)
    return v != null && Number.isFinite(v) ? v : fallback
  }
  const exit = num('D4')
  const tires = num('D19')
  const throttle = num('D10')
  const consistency = num('D18')

  if (tires <= 3.5) picks.push('tire_pressure_session')
  if (tires <= 3 || series === 'race' || series === 'mika' || series === 'bsc_ontario') {
    picks.push('tire_pressure_race_heat')
  }
  if (tires <= 3) {
    custom.push({
      id: 'tire_pressure_session',
      message:
        'Tire pressure (setup): tire management is soft — log cold→hot PSI; reset cold before next run. See Health diagnostic.',
    })
  }

  const gear = suggestGearRatio({
    maxRpm,
    maxSpeedKmh: maxSpeed,
    series,
    classId,
  })
  if (gear) {
    picks.push('gear_ratio_optimize')
    if (gear.action === 'plus') picks.push('gear_plus_one')
    if (gear.action === 'minus') picks.push('gear_minus_one')
    custom.push({
      id: 'gear_ratio_optimize',
      message: `Gear (setup): ${gear.action === 'hold' ? 'Hold' : gear.action === 'plus' ? '+ rear tooth' : '− rear tooth'} — see Health diagnostic for diagnosis + optimize.`,
    })
  }
  if (series === 'bsc_ontario' || series === 'mika' || series === 'qualifying' || series === 'race') {
    picks.push('restricted_slide_gearing')
  }
  if (exit <= 2.5 && throttle >= 3.5) picks.push('chassis_before_engine')
  if (num('D17') <= 2.5) picks.push('clutch_health')
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
      if (p == null || s.score == null) return null
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
  // Compare lap under the microscope: fastest full lap other than best (out/in/partial laps excluded).
  const compareIdx = resolveCompareLap(laps, refIdx, bestIdx)
  const compare = compareIdx !== bestIdx ? laps[compareIdx] : undefined
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
    // Softest slow-corner exit in the focus sector (RPM 0.8 s after the minimum), paired with min speed.
    ...(() => {
      const e = exitInWindow(compare ?? best, sectorIndex / 4, (sectorIndex + 1) / 4)
      return e ? { exitRpm: Math.round(e.rpm08), exitMinSpeed: Math.round(e.minSpeed) } : {}
    })(),
    referenceLapIndex: compareIdx,
    bestLapIndex: bestIdx,
  }
}

export interface ScoreOpts {
  classId?: string
  /** 'gps' = speed from GPS only (no wheel speed) → D4 medium confidence, context only. */
  speedSource?: 'gps' | 'wheel' | 'unknown'
  /** Setup verdict says the kart (gearing/tires/clutch) explains soft exits this outing. */
  exitsConfounded?: boolean
}

export interface BuildReportInput extends ScoreOpts {
  sessionId: string
  track: string
  classAssumption: string
  series: SeriesTag
  conditions: 'dry' | 'wet'
  laps: LapData[]
  referenceLapIndex: number
  cornerNames?: string[]
  hasVideo?: boolean
  channels?: ChannelFlags
  previousSession?: StoredSession | null
}

export function buildCoachingReport(input: BuildReportInput): {
  report: CoachingReport
  corners: CornerCue[]
} {
  const bestIdx = pickBestFlyingLap(input.laps)
  const refIdx = resolveCompareLap(input.laps, input.referenceLapIndex, bestIdx)
  // An attached video is only played back next to the data. N10 does not analyze it,
  // so it must never change scores or cues.
  const hasVideo = false
  const scores = scoreFromTelemetry(
    input.laps,
    refIdx,
    input.series,
    input.conditions,
    hasVideo,
    input.channels,
    { classId: input.classId, speedSource: input.speedSource, exitsConfounded: input.exitsConfounded }
  )
  const composites = computeComposites(scores)
  const top_weaknesses = pickTopWeaknesses(scores, input.series, 3) // M2 hard cap 3
  const strengths = pickStrengths(scores, 3)
  const best = input.laps[bestIdx]
  const names = input.cornerNames ?? DEFAULT_CORNERS
  // Compare lap = referenceLapIndex (the lap under the microscope).
  // Best ★ stays the target. Delta/losses = compare vs best (positive = compare slower).
  const compareIdx = refIdx
  const compare = compareIdx !== bestIdx ? input.laps[compareIdx] : undefined
  const losses =
    best && compare
      ? sectorLosses(compare.samples, best.samples, 4)
      : [0, 0, 0, 0]
  const corners = buildCornerCues(losses, names, best, compare)
  const focusSector = biggestLossSector(losses)
  const focusCue = compare && (losses[focusSector] ?? 0) > 40 ? corners[focusSector] : undefined
  const primary = resolvePrimaryDrill(
    top_weaknesses,
    scores,
    focusCue?.dimId,
    input.previousSession?.activePriorityDimensionId
  )
  const setup_hypotheses = buildSetupHypotheses(scores, input.series, input.classId, best?.maxRpm, best?.maxSpeed)
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
    if (d15 && d15.score != null) {
      racecraft_cue =
        d15.score < 3.5
          ? 'Outside usually donates — present earlier or wait a corner. Own inside before turn-in; protect exit.'
          : 'Keep passes planned one corner ahead. Draft, own inside, exit sticks.'
    } else {
      racecraft_cue = 'Racecraft (drafting, passing, defending) is not scored from logger data. Protect your exit after every pass.'
    }
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
      title: linkTitle(l),
      url: l.url,
    })),
  }
  return { report, corners }
}


/** Rebuild report + corners for a stored session (migrates old localStorage shapes). */
export function refreshStoredSession(
  s: StoredSession,
  previousSession?: StoredSession | null,
  cornerNames?: string[],
  opts?: { exitsConfounded?: boolean }
): StoredSession {
  const names = cornerNames ?? (s.corners.length ? s.corners.map((c) => c.name) : DEFAULT_CORNERS)
  const { report, corners } = buildCoachingReport({
    sessionId: s.id,
    track: s.trackName,
    classAssumption: s.classAssumption,
    series: s.series,
    conditions: s.conditions,
    laps: s.laps,
    referenceLapIndex: s.referenceLapIndex,
    cornerNames: names,
    previousSession: previousSession ?? null,
    classId: s.classId,
    speedSource: s.sourceKind === 'xrk' || s.sourceKind === 'xrz' ? 'gps' : undefined,
    exitsConfounded: opts?.exitsConfounded,
  })
  const bestLapIndex = pickBestFlyingLap(s.laps)
  return {
    ...s,
    bestLapIndex,
    referenceLapIndex: resolveCompareLap(s.laps, s.referenceLapIndex, bestLapIndex),
    videoCueMarkers: undefined,
    corners,
    report,
    activePriorityDimensionId: report.priority_dimension_id,
    activePriorityDrillId: report.primary_drill.id,
  }
}

export { computeDelta, sectorLosses, pickBestFlyingLap, pickCompareLap, resolveCompareLap }
