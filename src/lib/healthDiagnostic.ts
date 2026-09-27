import { EXIT_RPM_BAND } from './rubric'
import { suggestGearRatio, GEAR_ASSUMPTIONS, type GearAdvice } from './gearRatio'
import type { DimensionScore, LapData, SeriesTag, StoredSession } from './types'

export type HealthStatus = 'healthy' | 'watch' | 'fix'

export type HealthCard = {
  id: 'tire_pressure' | 'gear_ratio' | 'clutch'
  title: string
  status: HealthStatus
  diagnosis: string
  optimize: string
  metrics?: { label: string; value: string }[]
}

export type HealthDiagnostic = {
  cards: HealthCard[]
  gearAdvice: GearAdvice | null
}

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
  maxSpeed?: number
): HealthCard {
  if (!gearAdvice) {
    return {
      id: 'gear_ratio',
      title: 'Gear ratio',
      status: 'watch',
      diagnosis:
        'Need peak speed + peak RPM to estimate current gear vs the 5,800–6,100 band.',
      optimize: 'Import MyChron/CSV with RPM + speed, then re-check this card.',
      metrics: [
        { label: 'Peak RPM', value: maxRpm != null ? String(Math.round(maxRpm)) : '—' },
        { label: 'Peak km/h', value: maxSpeed != null ? maxSpeed.toFixed(0) : '—' },
        {
          label: 'Exit RPM',
          value: exitRpm != null ? String(Math.round(exitRpm)) : '—',
        },
      ],
    }
  }

  const { action, toothDelta, peakSpeedKmh, peakRpm, estimatedCurrentRatio, idealBand, suggestedRearTeeth } =
    gearAdvice
  const exit = exitRpm ?? gearAdvice.exitRpm
  const absTeeth = Math.max(1, Math.abs(toothDelta) || 1)
  const farOff = Math.abs(toothDelta) >= 2 || (exit != null && (exit < EXIT_RPM_BAND.lo - 150 || peakRpm >= 6080))

  let status: HealthStatus = 'healthy'
  if (action === 'hold') status = 'healthy'
  else if (farOff) status = 'fix'
  else status = 'watch'

  const exitLabel = exit != null ? `~${Math.round(exit)}` : '—'
  const diagnosis = `Peak ${peakSpeedKmh.toFixed(0)} km/h @ ~${Math.round(peakRpm)} RPM; exit ~${exitLabel} vs ${EXIT_RPM_BAND.lo}–${EXIT_RPM_BAND.hi} band. Est. ratio ~${estimatedCurrentRatio.toFixed(2)} (17T front — verify sprockets).`

  let optimize: string
  if (action === 'plus') {
    optimize = `Add ${absTeeth} rear tooth (shorter gear) on 17T front — est. now ~${Math.round(estimatedCurrentRatio * GEAR_ASSUMPTIONS.driverTeeth)}T → try ~${suggestedRearTeeth.lo}–${suggestedRearTeeth.hi}T.`
  } else if (action === 'minus') {
    optimize = `Drop ${absTeeth} rear tooth (longer gear) on 17T front — est. now ~${Math.round(estimatedCurrentRatio * GEAR_ASSUMPTIONS.driverTeeth)}T → try ~${suggestedRearTeeth.lo}–${suggestedRearTeeth.hi}T.`
  } else {
    optimize = `Hold current sprockets — already near the ${EXIT_RPM_BAND.lo}–${EXIT_RPM_BAND.hi} band (ideal rear ~${suggestedRearTeeth.lo}–${suggestedRearTeeth.hi}T / 17T).`
  }

  return {
    id: 'gear_ratio',
    title: 'Gear ratio',
    status,
    diagnosis,
    optimize,
    metrics: [
      { label: 'Est. ratio', value: estimatedCurrentRatio.toFixed(2) },
      { label: 'Ideal band', value: `${idealBand.lo.toFixed(2)}–${idealBand.hi.toFixed(2)}` },
      {
        label: 'Suggested rear (17T)',
        value: `${suggestedRearTeeth.lo}–${suggestedRearTeeth.hi}T`,
      },
    ],
  }
}

/** Heuristic clutch flags from RPM/speed samples — setup-tagged, not driver blame. */
function detectClutchPattern(laps: LapData[]): {
  pattern: 'slip' | 'bog' | 'scatter' | 'none'
  detail: string
} {
  const flying = laps.filter((l) => l.timeMs >= 45000 && l.timeMs <= 180000 && l.samples.length > 20)
  const pool = flying.length ? flying : laps.filter((l) => l.samples.length > 20)
  if (!pool.length) return { pattern: 'none', detail: '' }

  const exitRpms: number[] = []
  let slipHits = 0
  let bogHits = 0
  let sampleWindows = 0

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
      const speedRise = (b.speed - a.speed) / dt
      // Slow corner / exit: speed low, looking for engagement issues
      const slowCorner = b.speed < 55 && a.speed < 60
      if (!slowCorner) continue
      sampleWindows++
      // RPM flare without matching speed = slip
      if (rpmRise > 800 && speedRise < 8 && b.rpm > 5200) slipHits++
      // Low exit RPM while speed builds slowly = boggy engagement
      if (b.rpm < 5200 && c.rpm < 5400 && speedRise > 0 && speedRise < 12 && b.speed > 30) bogHits++
    }
  }

  const slipRate = sampleWindows > 0 ? slipHits / sampleWindows : 0
  const bogRate = sampleWindows > 0 ? bogHits / sampleWindows : 0

  let exitStd = 0
  if (exitRpms.length >= 3) {
    const mean = exitRpms.reduce((s, v) => s + v, 0) / exitRpms.length
    exitStd = Math.sqrt(
      exitRpms.reduce((s, v) => s + (v - mean) * (v - mean), 0) / exitRpms.length
    )
  }

  if (slipRate >= 0.08) {
    return {
      pattern: 'slip',
      detail: `RPM flare without matching speed off slow corners (~${Math.round(slipRate * 100)}% of exit windows).`,
    }
  }
  if (bogRate >= 0.1) {
    return {
      pattern: 'bog',
      detail: `Low exit RPM with slow speed build off slow corners (~${Math.round(bogRate * 100)}% of windows).`,
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

function patternLabel(pattern: 'slip' | 'bog' | 'scatter' | 'none'): string {
  switch (pattern) {
    case 'slip':
      return 'slipping'
    case 'bog':
      return 'early grab'
    case 'scatter':
      return 'inconsistent'
    default:
      return 'ok'
  }
}

function clutchCard(scores: DimensionScore[], laps: LapData[]): HealthCard {
  const d17 = scoreOf(scores, 'D17', 3.5)

  const hasChannels = laps.some(
    (l) =>
      l.samples.length > 10 &&
      l.samples.some((s) => s.rpm > 1000) &&
      l.samples.some((s) => s.speed > 10)
  )

  const detected = hasChannels
    ? detectClutchPattern(laps)
    : { pattern: 'none' as const, detail: '' }

  const metrics: { label: string; value: string }[] = [
    { label: 'Clutch score', value: d17.toFixed(1) },
  ]
  if (hasChannels) {
    metrics.push({
      label: 'Pattern',
      value: patternLabel(detected.pattern),
    })
  } else {
    metrics.push({ label: 'Channels', value: 'limited' })
  }

  // Shop actions ONLY for clear slip / early-grab signatures in session data.
  if (detected.pattern === 'slip') {
    return {
      id: 'clutch',
      title: 'Clutch',
      status: 'fix',
      diagnosis:
        'Clutch is slipping too much — engine revs up without matching kart speed.',
      optimize:
        '1) Pull clutch, clean shoes + drum (no oil/glaze). 2) If still slips under power after clean: replace/reface shoes. 3) If it still slips: try heavier springs (engages harder / higher RPM). Verify install locked on crank shoulder.',
      metrics,
    }
  }

  if (detected.pattern === 'bog') {
    return {
      id: 'clutch',
      title: 'Clutch',
      status: 'fix',
      diagnosis:
        'Clutch is gripping too early — it hooks up before the engine is in the power band.',
      optimize:
        '1) Clean shoes + drum. 2) If still hooks early / feels boggy: fit lighter springs (engages later / higher RPM). Do not blame the driver first.',
      metrics,
    }
  }

  // Scatter / soft D17 / limited channels: under-call — no clean/inspect/springs.
  if (detected.pattern === 'scatter') {
    return {
      id: 'clutch',
      title: 'Clutch',
      status: 'watch',
      diagnosis: 'Inconsistent but not a clear slip or early-grab call.',
      optimize: 'No change.',
      metrics,
    }
  }

  if (d17 < 3.5) {
    return {
      id: 'clutch',
      title: 'Clutch',
      status: 'watch',
      diagnosis: 'No clutch problem in this session data',
      optimize:
        "No change — score soft but data doesn't show slip or early grab.",
      metrics,
    }
  }

  return {
    id: 'clutch',
    title: 'Clutch',
    status: 'healthy',
    diagnosis: 'No clutch problem in this session data',
    optimize: 'No change.',
    metrics,
  }
}

/**
 * Build session Health diagnostic cards: Tire pressure · Gear ratio · Clutch.
 * Setup-tagged; never invents PSI from telemetry.
 */
export function buildHealthDiagnostic(input: {
  scores: DimensionScore[]
  series: SeriesTag
  laps: LapData[]
  exitRpm?: number
  maxRpm?: number
  maxSpeed?: number
}): HealthDiagnostic {
  const gearAdvice = suggestGearRatio({
    maxRpm: input.maxRpm,
    maxSpeedKmh: input.maxSpeed,
    exitRpm: input.exitRpm,
    series: input.series,
  })

  return {
    gearAdvice,
    cards: [
      tireCard(input.scores, input.series, input.laps.length),
      gearCard(gearAdvice, input.exitRpm, input.maxRpm, input.maxSpeed),
      clutchCard(input.scores, input.laps),
    ],
  }
}

/** Convenience: build from a stored session. */
export function buildHealthDiagnosticFromSession(session: StoredSession): HealthDiagnostic {
  const best = session.laps[session.bestLapIndex]
  return buildHealthDiagnostic({
    scores: session.report.scores,
    series: session.series,
    laps: session.laps,
    exitRpm: session.report.focus.exitRpm ?? best?.exitRpmFocus,
    maxRpm: best?.maxRpm,
    maxSpeed: best?.maxSpeed,
  })
}
