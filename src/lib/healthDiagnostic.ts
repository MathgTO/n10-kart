import { EXIT_RPM_BAND } from './rubric'
import { suggestGearRatio, GEAR_DEFAULTS, type GearAdvice, type Gearing } from './gearRatio'
import type { DimensionScore, LapData, SeriesTag, StoredSession } from './types'

export type HealthStatus = 'healthy' | 'watch' | 'fix'

export type HealthCard = {
  id: 'tire_pressure' | 'gear_ratio' | 'clutch'
  title: string
  status: HealthStatus
  /** Short verdict line (gear card). */
  headline?: string
  diagnosis: string
  optimize: string
  metrics?: { label: string; value: string }[]
}

export type OneChangeRecommendation = {
  tag: 'setup'
  signal_ids: string[]
  hypothesis: string
  one_change_action: string
  evidence_channels: string[]
  confidence: 'high' | 'medium' | 'low'
  source_card: HealthCard['id']
}

export type HealthDiagnostic = {
  cards: HealthCard[]
  gearAdvice: GearAdvice | null
  /** Kart Tuner primary: one setup CATEGORY this outing (gear OR clutch OR tires). */
  oneChange: OneChangeRecommendation | null
}

/** Briggs Hilliard Inferno Flame — clutch calls require RPM + speed together. */
export const CLUTCH_HEALTH = {
  id: 'hilliard_inferno_flame_clutch_health',
  require_rpm_and_speed: true as const,
  tag: 'setup' as const,
  never_mix_with: 'driver_blame' as const,
}

/** Plain shop checklist (Hilliard Inferno Flame) — always setup-tagged. */
export const CLUTCH_SHOP_CHECKLIST: readonly string[] = [
  'RPM flares, speed lags → slipping late/too much: cool → clean shoes/drum → then weaker springs or add balanced weights (leading shoes for firmer lock).',
  'RPM drops hard / boggy early grab → gripping too early: stronger springs; remove balanced weights; confirm idle below engagement.',
  'Heavier/stronger springs = later engagement; lighter/weaker = earlier.',
  'Always match opposite shoes (spring color, weights, leading/trailing). Never reuse weight snap rings.',
  'Needle bearing ≠ bronze bushing: grease only the needle kit lightly; bronze gets one drop light oil — never grease. Keep lube off friction faces.',
  'Stop-now: drives at idle, cracked drum, broken spring, blue/purple smoked drum, seized bearing.',
]

function scoreOf(scores: DimensionScore[], id: string, fallback = 5): number {
  const v = scores.find((s) => s.dimension_id === id)?.score
  return v != null && Number.isFinite(v) ? v : fallback
}

function tireCard(
  scores: DimensionScore[],
  series: SeriesTag,
  lapCount: number
): HealthCard {
  const d19 = scoreOf(scores, 'D19')
  const d18 = scoreOf(scores, 'D18')
  const heatSeries = series === 'race' || series === 'mika' || series === 'bsc_ontario'
  const lateStint = lapCount >= 6

  const metrics: { label: string; value: string }[] = [
    { label: 'Tire score', value: d19.toFixed(1) },
    { label: 'Consistency', value: d18.toFixed(1) },
  ]
  if (lapCount > 0) metrics.push({ label: 'Laps', value: String(lapCount) })

  if (d19 <= 3) {
    return {
      id: 'tire_pressure',
      title: 'Tire pressure',
      status: 'fix',
      diagnosis: lateStint
        ? 'Tires look overheated late in the stint — pressures may be too high when hot.'
        : 'Tire grip is dropping — pressures may be cooking up.',
      optimize:
        '1) Reset cold pressures before next run. 2) Log cold→hot PSI after the run. 3) If hot PSI climbs a lot, start a touch lower cold next time.',
      metrics,
    }
  }

  if (d19 < 4 || (d19 <= 4 && (heatSeries || (d18 <= 3 && lateStint)))) {
    return {
      id: 'tire_pressure',
      title: 'Tire pressure',
      status: 'watch',
      diagnosis: heatSeries
        ? 'Mild heat/slide risk in a race or heat — watch pressures over the stint.'
        : 'Mild tire heat risk — pressures may be climbing.',
      optimize:
        'Re-check cold set before next heat; note hot PSI after the run. Change only if hot numbers climb high.',
      metrics,
    }
  }

  return {
    id: 'tire_pressure',
    title: 'Tire pressure',
    status: 'healthy',
    diagnosis: 'Tire management looks stable this session.',
    optimize: 'Log cold→hot PSI next run; no pressure change needed from this data.',
    metrics,
  }
}

function gearCard(
  gearAdvice: GearAdvice | null,
  exitRpm?: number,
  maxRpm?: number,
  maxSpeed?: number,
  gearing?: Gearing
): HealthCard {
  if (!gearAdvice) {
    const rear = gearing?.rearTeeth
    return {
      id: 'gear_ratio',
      title: 'Gear ratio',
      status: 'watch',
      diagnosis: `Need peak speed + peak RPM to check gearing vs the ${EXIT_RPM_BAND.lo}–${EXIT_RPM_BAND.hi} band.`,
      optimize: 'Import MyChron/CSV with RPM + speed, then re-check this card.',
      metrics: [
        { label: 'Gearing', value: rear ? `${rear}T / ${gearing?.frontTeeth ?? GEAR_DEFAULTS.frontTeeth}T` : 'rear not set' },
        { label: 'Peak RPM', value: maxRpm != null ? String(Math.round(maxRpm)) : '—' },
        { label: 'Peak km/h', value: maxSpeed != null ? maxSpeed.toFixed(0) : '—' },
        { label: 'Exit RPM', value: exitRpm != null ? String(Math.round(exitRpm)) : '—' },
      ],
    }
  }

  const a = gearAdvice
  let status: HealthStatus
  if (a.action === 'hold') status = a.verdict === 'ok' && a.dataCheck !== 'mismatch' ? 'healthy' : 'watch'
  else status = Math.abs(a.toothDelta) >= 2 || Math.abs(a.ratioChangePct) >= 0.025 ? 'fix' : 'watch'

  const optimize = a.summary
  const metrics: { label: string; value: string }[] = [
    {
      label: 'Gearing',
      value: a.rearTeeth != null ? `${a.rearTeeth}T / ${a.frontTeeth}T${a.frontAssumed ? '*' : ''}` : 'rear not set',
    },
    { label: a.ratioIsEstimate ? 'Est. ratio' : 'Ratio', value: a.ratio.toFixed(2) },
    { label: 'Exit RPM', value: a.exitRpm != null ? String(Math.round(a.exitRpm)) : '—' },
    { label: 'Peak RPM', value: String(Math.round(a.peakRpm)) },
  ]
  if (a.action !== 'hold') {
    metrics.push(
      a.suggestedRearTeeth != null
        ? { label: 'Try', value: `${a.suggestedRearTeeth}T (${a.toothDelta > 0 ? '+' : '−'}${Math.abs(a.toothDelta)})` }
        : { label: 'Ratio change', value: `${a.ratioChangePct > 0 ? '+' : '−'}${Math.abs(a.ratioChangePct * 100).toFixed(1)}%` }
    )
  }
  if (a.dataCheck) metrics.push({ label: 'Data check', value: a.dataCheck === 'match' ? 'RPM/speed ✓' : 'recount sprockets' })

  return {
    id: 'gear_ratio',
    title: 'Gear ratio',
    status,
    headline: a.headline,
    diagnosis: `${a.detail}${a.frontAssumed && a.rearTeeth != null ? ' *Front assumed — edit it above if different.' : ''}`,
    optimize,
    metrics,
  }
}

export type ClutchPattern =
  | 'late_slip_flare'
  | 'early_bite_bog'
  | 'incomplete_lock'
  | 'power_or_drag_not_clutch'
  | 'scatter'
  | 'none'

/**
 * Heuristic clutch flags from RPM + speed samples (Briggs / Hilliard Inferno Flame).
 * Setup-tagged only — never driver blame. Requires both channels.
 */
function detectClutchPattern(laps: LapData[]): {
  pattern: ClutchPattern
  detail: string
} {
  if (!CLUTCH_HEALTH.require_rpm_and_speed) {
    return { pattern: 'none', detail: '' }
  }

  const flying = laps.filter((l) => l.timeMs >= 45000 && l.timeMs <= 180000 && l.samples.length > 20)
  const pool = flying.length ? flying : laps.filter((l) => l.samples.length > 20)
  if (!pool.length) return { pattern: 'none', detail: '' }

  const exitRpms: number[] = []
  let slipHits = 0
  let earlyBiteHits = 0
  let incompleteLockHits = 0
  let powerDragHits = 0
  let sampleWindows = 0
  let midSpeedWindows = 0

  for (const lap of pool) {
    if (lap.exitRpmFocus != null && Number.isFinite(lap.exitRpmFocus)) {
      exitRpms.push(lap.exitRpmFocus)
    }
    const samples = lap.samples
    for (let i = 2; i < samples.length - 2; i++) {
      const a = samples[i - 1]
      const b = samples[i]
      const c = samples[i + 1]
      const dt = Math.max(0.01, b.t - a.t)
      const rpmRise = (b.rpm - a.rpm) / dt
      const rpmDrop = (a.rpm - b.rpm) / dt
      const speedRise = (b.speed - a.speed) / dt

      // Slow corner / launch / hairpin exit: look for engagement issues
      const slowCorner = b.speed < 55 && a.speed < 60
      if (slowCorner) {
        sampleWindows++
        // Late slip flare: RPM climbs hard while speed lags
        if (rpmRise > 800 && speedRise < 8 && b.rpm > 5200) slipHits++
        // Early bite bog: RPM drops sharply as clutch grabs while speed still low
        if (
          rpmDrop > 600 &&
          b.speed < 45 &&
          a.speed < 50 &&
          a.rpm > 3800 &&
          b.rpm < a.rpm - 200 &&
          speedRise < 15
        ) {
          earlyBiteHits++
        }
        // Low RPM + sluggish (no flare) → power/drag/gear first, not clutch
        if (
          b.rpm < 4800 &&
          c.rpm < 5000 &&
          rpmRise < 400 &&
          speedRise > 0 &&
          speedRise < 10 &&
          b.speed > 25 &&
          b.speed < 50
        ) {
          powerDragHits++
        }
      }

      // Incomplete lock: speed has caught up (mid/higher speed) but RPM still high / flaring under load
      const speedCaughtUp = b.speed >= 60 && a.speed >= 55
      if (speedCaughtUp) {
        midSpeedWindows++
        if (b.rpm > 5800 && rpmRise > 400 && speedRise < 6) incompleteLockHits++
      }
    }
  }

  const slipRate = sampleWindows > 0 ? slipHits / sampleWindows : 0
  const earlyBiteRate = sampleWindows > 0 ? earlyBiteHits / sampleWindows : 0
  const powerDragRate = sampleWindows > 0 ? powerDragHits / sampleWindows : 0
  const incompleteRate = midSpeedWindows > 0 ? incompleteLockHits / midSpeedWindows : 0

  let exitStd = 0
  if (exitRpms.length >= 3) {
    const mean = exitRpms.reduce((s, v) => s + v, 0) / exitRpms.length
    exitStd = Math.sqrt(
      exitRpms.reduce((s, v) => s + (v - mean) * (v - mean), 0) / exitRpms.length
    )
  }

  // Priority: incomplete lock (stop) > late slip > early bite > power/drag > scatter
  if (incompleteRate >= 0.06) {
    return {
      pattern: 'incomplete_lock',
      detail: `Speed caught up but RPM still high under load (~${Math.round(incompleteRate * 100)}% of mid-speed windows).`,
    }
  }
  if (slipRate >= 0.08) {
    return {
      pattern: 'late_slip_flare',
      detail: `RPM flare while speed lags off slow corners (~${Math.round(slipRate * 100)}% of exit windows).`,
    }
  }
  if (earlyBiteRate >= 0.08) {
    return {
      pattern: 'early_bite_bog',
      detail: `Sharp RPM drop as clutch grabs at low speed (~${Math.round(earlyBiteRate * 100)}% of windows).`,
    }
  }
  // Prefer power/drag over boggy-looking low-RPM without flare
  if (powerDragRate >= 0.1 && slipRate < 0.04) {
    return {
      pattern: 'power_or_drag_not_clutch',
      detail: `Low RPM + sluggish speed with no flare (~${Math.round(powerDragRate * 100)}% of windows).`,
    }
  }
  if (exitStd > 220) {
    return {
      pattern: 'scatter',
      detail: `Large lap-to-lap exit RPM scatter (σ ~${Math.round(exitStd)} RPM).`,
    }
  }
  return { pattern: 'none', detail: '' }
}

function patternLabel(pattern: ClutchPattern): string {
  switch (pattern) {
    case 'late_slip_flare':
      return 'late slip'
    case 'early_bite_bog':
      return 'early bite'
    case 'incomplete_lock':
      return 'incomplete lock'
    case 'power_or_drag_not_clutch':
      return 'power/drag'
    case 'scatter':
      return 'scatter'
    default:
      return 'ok'
  }
}

function hasRpmAndSpeedChannels(laps: LapData[]): boolean {
  return laps.some(
    (l) =>
      l.samples.length > 10 &&
      l.samples.some((s) => s.rpm > 1000) &&
      l.samples.some((s) => s.speed > 10)
  )
}

function clutchCard(scores: DimensionScore[], laps: LapData[]): HealthCard {
  const d17 = scoreOf(scores, 'D17', 3.5)

  const hasChannels = hasRpmAndSpeedChannels(laps)

  // Assert: clutch_health.require_rpm_and_speed — never invent slip/bog without both.
  if (!hasChannels) {
    return {
      id: 'clutch',
      title: 'Clutch',
      status: 'watch',
      diagnosis:
        'RPM and speed channels both required for clutch calls — cannot diagnose engagement from limited data.',
      optimize: 'Import MyChron with RPM + speed',
      metrics: [
        { label: 'Clutch score', value: d17.toFixed(1) },
        { label: 'Channels', value: 'need RPM+speed' },
      ],
    }
  }

  const detected = detectClutchPattern(laps)

  const metrics: { label: string; value: string }[] = [
    { label: 'Clutch score', value: d17.toFixed(1) },
    { label: 'Pattern', value: patternLabel(detected.pattern) },
  ]

  // Late slip: cooler/cleaner then WEAKER springs or add balanced weights (Briggs direction).
  if (detected.pattern === 'late_slip_flare') {
    return {
      id: 'clutch',
      title: 'Clutch',
      status: 'fix',
      diagnosis:
        'Late slip: RPM up, speed lagging — clutch converting power to heat. Cool → clean → then softer springs or more weight (balanced).',
      optimize:
        '1) Stop and cool; inspect oil/chain-lube, glaze, blocked shoe grooves, heat damage. 2) Confirm shoes slide freely; springs not wrongly installed or too strong. 3) Check chain alignment/slack, brake drag, gearing. 4) If hardware healthy: weaker OEM springs OR add Hilliard weights symmetrically; prefer leading shoes for firmer bite.',
      metrics,
    }
  }

  // Early bite: STRONGER springs / remove weights (Briggs direction).
  if (detected.pattern === 'early_bite_bog') {
    return {
      id: 'clutch',
      title: 'Clutch',
      status: 'fix',
      diagnosis:
        'Early bite: RPM falls hard as it grabs — raise engagement (stronger springs / remove weights) after ruling out drag.',
      optimize:
        '1) Verify idle below engagement and throttle returns fully. 2) Drum freewheels with engine off; no rub on cover/spacers/guard. 3) Inspect seized/dry bearing, wrong stack-up, grease drag, broken springs, shoes hanging on lugs. 4) If mechanically sound: stronger OEM springs; remove optional weights in balanced pairs.',
      metrics,
    }
  }

  // Incomplete lock: STOP language.
  if (detected.pattern === 'incomplete_lock') {
    return {
      id: 'clutch',
      title: 'Clutch',
      status: 'fix',
      diagnosis:
        'Incomplete lock: speed caught up but RPM still high — stop, inspect friction surfaces.',
      optimize:
        'STOP before heat destroys surfaces. Inspect contamination, glaze, worn shoes/drum, weak torque capacity (springs/weights/orientation). Do not continue the session.',
      metrics,
    }
  }

  // Low RPM + sluggish (no flare) → engine/drag/gear FIRST — not a clutch shop call.
  if (detected.pattern === 'power_or_drag_not_clutch') {
    return {
      id: 'clutch',
      title: 'Clutch',
      status: 'watch',
      diagnosis:
        'Low RPM + sluggish speed = power/drag/gear first — not a slip-flare clutch call.',
      optimize:
        'Investigate engine/throttle opening, brake drag, gearing, excess load BEFORE changing clutch springs or weights. No clutch shop change from this signature.',
      metrics,
    }
  }

  // Soft D17 / scatter without clear signature: under-call — "No change".
  if (detected.pattern === 'scatter') {
    return {
      id: 'clutch',
      title: 'Clutch',
      status: 'watch',
      diagnosis: 'Inconsistent but not a clear late-slip, early-bite, or incomplete-lock call.',
      optimize: 'No change',
      metrics,
    }
  }

  if (d17 < 3.5) {
    return {
      id: 'clutch',
      title: 'Clutch',
      status: 'watch',
      diagnosis: 'No clear clutch signature in this session data.',
      optimize: "No change — score soft but data doesn't show late slip, early bite, or incomplete lock.",
      metrics,
    }
  }

  return {
    id: 'clutch',
    title: 'Clutch',
    status: 'healthy',
    diagnosis: 'No clutch problem in this session data.',
    optimize: 'No change',
    metrics,
  }
}

function clutchPatternFromCard(card: HealthCard): string {
  return card.metrics?.find((m) => m.label === 'Pattern')?.value ?? 'ok'
}

function clutchSignalIds(card: HealthCard): string[] {
  const pattern = clutchPatternFromCard(card)
  switch (pattern) {
    case 'incomplete lock':
      return ['S8', 'clutch_incomplete_lock']
    case 'late slip':
      return ['S6', 'clutch_late_slip']
    case 'early bite':
      return ['S7', 'clutch_early_bite']
    default:
      return ['clutch_health']
  }
}

function cardHadSetupChange(card: HealthCard, gearAdvice: GearAdvice | null): boolean {
  if (card.id === 'clutch') return card.status === 'fix'
  if (card.id === 'tire_pressure') return card.status === 'fix'
  if (card.id === 'gear_ratio') {
    return gearAdvice != null && (gearAdvice.action === 'plus' || gearAdvice.action === 'minus')
  }
  return false
}

/**
 * Kart Tuner priority: clutch fix > gear action > tire fix > null.
 * One CATEGORY per outing — never stack gear+clutch / pressure+width.
 * Gear magnitude unrestricted within the gear category (full toothDelta).
 */
export function pickPrimaryOneChange(
  cards: HealthCard[],
  gearAdvice: GearAdvice | null
): OneChangeRecommendation | null {
  const clutch = cards.find((c) => c.id === 'clutch')
  const gear = cards.find((c) => c.id === 'gear_ratio')
  const tire = cards.find((c) => c.id === 'tire_pressure')

  if (clutch && clutch.status === 'fix') {
    const pattern = clutchPatternFromCard(clutch)
    return {
      tag: 'setup',
      signal_ids: clutchSignalIds(clutch),
      hypothesis: clutch.diagnosis,
      one_change_action: clutch.optimize,
      evidence_channels: ['rpm', 'speed'],
      confidence: pattern === 'incomplete lock' ? 'high' : 'high',
      source_card: 'clutch',
    }
  }

  if (
    gearAdvice &&
    (gearAdvice.action === 'plus' || gearAdvice.action === 'minus') &&
    gear
  ) {
    return {
      tag: 'setup',
      signal_ids: [gearAdvice.action === 'plus' ? 'gear_plus_rear' : 'gear_minus_rear'],
      hypothesis:
        gearAdvice.action === 'plus'
          ? `Gearing too tall — ${gearAdvice.exitRpm != null ? `exit ~${Math.round(gearAdvice.exitRpm)}` : `peak ~${Math.round(gearAdvice.peakRpm)}`} below the ${EXIT_RPM_BAND.lo}–${EXIT_RPM_BAND.hi} band`
          : `Gearing too short — ${gearAdvice.exitRpm != null ? `exit ~${Math.round(gearAdvice.exitRpm)}` : `peak ~${Math.round(gearAdvice.peakRpm)}`} above the ${EXIT_RPM_BAND.lo}–${EXIT_RPM_BAND.hi} band`,
      one_change_action: gear.optimize,
      evidence_channels: ['rpm', 'speed'],
      confidence: 'medium',
      source_card: 'gear_ratio',
    }
  }

  if (tire && tire.status === 'fix') {
    return {
      tag: 'setup',
      signal_ids: ['tire_pressure_session'],
      hypothesis: tire.diagnosis,
      one_change_action: tire.optimize,
      evidence_channels: ['session_scores'],
      confidence: 'medium',
      source_card: 'tire_pressure',
    }
  }

  return null
}

/** Non-primary cards that had a shop/gear change → hold this outing, point at the one change. */
export function applyOneChangeHoldLanguage(
  cards: HealthCard[],
  oneChange: OneChangeRecommendation | null,
  gearAdvice: GearAdvice | null
): HealthCard[] {
  if (!oneChange) return cards
  const hold = `Hold this outing — one setup category already queued: ${oneChange.one_change_action}`
  return cards.map((card) => {
    if (card.id === oneChange.source_card) return card
    if (!cardHadSetupChange(card, gearAdvice)) return card
    return { ...card, optimize: hold }
  })
}

/**
 * Build session Health diagnostic cards: Tire pressure · Gear ratio · Clutch.
 * Setup-tagged; never invents PSI from telemetry.
 * Synced with Kart Tuning Expert: one category per outing; gear magnitude unrestricted within gear.
 */
export function buildHealthDiagnostic(input: {
  scores: DimensionScore[]
  series: SeriesTag
  laps: LapData[]
  exitRpm?: number
  maxRpm?: number
  maxSpeed?: number
  gearing?: Gearing
  rpmPerKmh?: number
}): HealthDiagnostic {
  const gearAdvice = suggestGearRatio({
    maxRpm: input.maxRpm,
    maxSpeedKmh: input.maxSpeed,
    exitRpm: input.exitRpm,
    series: input.series,
    rearTeeth: input.gearing?.rearTeeth,
    frontTeeth: input.gearing?.frontTeeth,
    rpmPerKmh: input.rpmPerKmh,
  })

  const rawCards: HealthCard[] = [
    tireCard(input.scores, input.series, input.laps.length),
    gearCard(gearAdvice, input.exitRpm, input.maxRpm, input.maxSpeed, input.gearing),
    clutchCard(input.scores, input.laps),
  ]
  const oneChange = pickPrimaryOneChange(rawCards, gearAdvice)
  const cards = applyOneChangeHoldLanguage(rawCards, oneChange, gearAdvice)

  return {
    gearAdvice,
    oneChange,
    cards,
  }
}

/**
 * Peak GPS/wheel speed across the session, paired with RPM at that sample.
 * Prefer this over beacon-"best" lap peaks: GPS-only MyChron logs can corrupt
 * lap stamps, so the starred lap is not authoritative for gear math.
 */
export function rpmAtPeakSpeed(laps: LapData[]): { maxSpeed?: number; rpmAtPeak?: number; rpmPerKmh?: number } {
  // RPM pickup dropouts (e.g. 88 km/h @ ~3000 RPM for a few samples) must not drive gear math:
  // skip samples whose RPM/speed is far off the session's median at speed (clutch locked).
  const ratios: number[] = []
  for (const lap of laps) {
    for (const s of lap.samples) {
      if (Number.isFinite(s.speed) && Number.isFinite(s.rpm) && s.speed >= 60 && s.rpm >= 3000) ratios.push(s.rpm / s.speed)
    }
  }
  ratios.sort((a, b) => a - b)
  const medianRatio = ratios.length >= 20 ? ratios[Math.floor(ratios.length / 2)] : undefined
  const plausible = (rpm: number, speed: number) =>
    medianRatio == null || Math.abs(rpm / speed / medianRatio - 1) <= 0.12
  let maxSpeed = -1
  let rpmAtPeak: number | undefined
  for (const lap of laps) {
    for (const s of lap.samples) {
      if (
        Number.isFinite(s.speed) &&
        Number.isFinite(s.rpm) &&
        s.speed > maxSpeed &&
        s.speed >= 20 &&
        s.rpm >= 3000 &&
        plausible(s.rpm, s.speed)
      ) {
        maxSpeed = s.speed
        rpmAtPeak = s.rpm
      }
    }
  }
  if (maxSpeed < 0 || rpmAtPeak == null) return { rpmPerKmh: medianRatio }
  return { maxSpeed, rpmAtPeak, rpmPerKmh: medianRatio }
}

/** Convenience: build from a stored session. */
export function buildHealthDiagnosticFromSession(session: StoredSession): HealthDiagnostic {
  const best = session.laps[session.bestLapIndex]
  const peak = rpmAtPeakSpeed(session.laps)
  return buildHealthDiagnostic({
    scores: session.report.scores,
    series: session.series,
    laps: session.laps,
    exitRpm: session.report.focus.exitRpm ?? best?.exitRpmFocus,
    maxRpm: peak.rpmAtPeak ?? best?.maxRpm,
    maxSpeed: peak.maxSpeed ?? best?.maxSpeed,
    gearing: session.gearing,
    rpmPerKmh: peak.rpmPerKmh,
  })
}
