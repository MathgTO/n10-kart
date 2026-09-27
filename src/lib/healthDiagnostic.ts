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
  return scores.find((s) => s.dimension_id === id)?.score ?? fallback
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
    { label: 'D19 tire mgmt', value: d19.toFixed(1) },
    { label: 'D18 consistency', value: d18.toFixed(1) },
  ]
  if (lapCount > 0) metrics.push({ label: 'Laps', value: String(lapCount) })

  if (d19 <= 3) {
    return {
      id: 'tire_pressure',
      title: 'Tire pressure',
      status: 'fix',
      diagnosis:
        `Tire management score soft (D19 ${d19.toFixed(1)}${lateStint ? ', late-stint length' : ''}). Rising slide / heat growth often means cooked pressures — setup, not “push more.”`,
      optimize:
        'Reset cold pressures before next run; treat late slide as cook, not driver. Log cold→hot PSI — no PSI invent from data alone.',
      metrics,
    }
  }

  if (d19 < 4 || (d19 <= 4 && (heatSeries || (d18 <= 3 && lateStint)))) {
    return {
      id: 'tire_pressure',
      title: 'Tire pressure',
      status: 'watch',
      diagnosis: heatSeries
        ? `D19 ${d19.toFixed(1)} with race/heat context — watch rising slide and hot-pressure growth over the stint.`
        : `D19 ${d19.toFixed(1)}${d18 <= 3 ? ` · consistency D18 ${d18.toFixed(1)}` : ''} — mild heat/slide risk; pressures may be climbing.`,
      optimize:
        'Re-check cold set before next heat; watch hot PSI after the run. No pressure change indicated from telemetry numbers alone.',
      metrics,
    }
  }

  return {
    id: 'tire_pressure',
    title: 'Tire pressure',
    status: 'healthy',
    diagnosis: 'Tire management looks stable this session.',
    optimize: 'Log cold→hot PSI next run; no pressure change indicated from data alone.',
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
        'Need peak speed + peak RPM channels to estimate current ratio vs the 5,800–6,100 band.',
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
  const diagnosis = `Peak ${peakSpeedKmh.toFixed(0)} km/h @ ~${Math.round(peakRpm)} RPM; exit focus ${exitLabel} vs ${EXIT_RPM_BAND.lo}–${EXIT_RPM_BAND.hi} band. Est. ratio ~${estimatedCurrentRatio.toFixed(2)} (17T · Ø${(GEAR_ASSUMPTIONS.tireDiameterM * 1000).toFixed(0)} mm assume — verify sprockets).`

  let optimize: string
  if (action === 'plus') {
    optimize = `+${absTeeth} rear tooth (shorter) on 17T — est. now ~${Math.round(estimatedCurrentRatio * GEAR_ASSUMPTIONS.driverTeeth)}T → ideal ~${suggestedRearTeeth.lo}–${suggestedRearTeeth.hi}T. Junior: gear for yellow-slide peak, not limiter ego.`
  } else if (action === 'minus') {
    optimize = `−${absTeeth} rear tooth (longer) on 17T — est. now ~${Math.round(estimatedCurrentRatio * GEAR_ASSUMPTIONS.driverTeeth)}T → ideal ~${suggestedRearTeeth.lo}–${suggestedRearTeeth.hi}T. Protects top end / tires if still in band.`
  } else {
    optimize = `Hold — peak speed/RPM already near the ${EXIT_RPM_BAND.lo}–${EXIT_RPM_BAND.hi} band (ideal rear ~${suggestedRearTeeth.lo}–${suggestedRearTeeth.hi}T / 17T).`
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

function clutchCard(scores: DimensionScore[], laps: LapData[]): HealthCard {
  const d17 = scoreOf(scores, 'D17', 3.5)
  const d10 = scoreOf(scores, 'D10', 3.5)
  const d1 = scoreOf(scores, 'D1', 3)
  const d2 = scoreOf(scores, 'D2', 3)
  const lineOk = d1 >= 3.5 && d2 >= 3
  const throttleOk = d10 >= 3.5

  const hasChannels = laps.some(
    (l) =>
      l.samples.length > 10 &&
      l.samples.some((s) => s.rpm > 1000) &&
      l.samples.some((s) => s.speed > 10)
  )

  const detected = hasChannels
    ? detectClutchPattern(laps)
    : { pattern: 'none' as const, detail: '' }

  const clearPattern =
    detected.pattern === 'slip' || detected.pattern === 'bog'
  const mild =
    detected.pattern === 'scatter' && (lineOk || throttleOk)

  const metrics: { label: string; value: string }[] = [
    { label: 'D17 clutch/race', value: d17.toFixed(1) },
  ]
  if (hasChannels) {
    metrics.push({
      label: 'RPM/speed pattern',
      value:
        detected.pattern === 'none'
          ? 'none'
          : detected.pattern,
    })
  } else {
    metrics.push({ label: 'Channels', value: 'limited' })
  }

  if (d17 <= 2.5 || clearPattern) {
    return {
      id: 'clutch',
      title: 'Clutch',
      status: 'fix',
      diagnosis: clearPattern
        ? `Setup flag: ${detected.detail} Soft D17 (${d17.toFixed(1)}) — engagement/install check before blaming launches.`
        : `D17 soft (${d17.toFixed(1)}) — clutch engagement/install is a setup hypothesis, not technique alone.`,
      optimize:
        'Check clutch engagement/install (locked against crank shoulder — Briggs/Klaus). Confirm before next run; don’t overclaim without video.',
      metrics,
    }
  }

  if (mild || (d17 < 3.5 && hasChannels)) {
    return {
      id: 'clutch',
      title: 'Clutch',
      status: 'watch',
      diagnosis: mild
        ? `Mild inconsistency: ${detected.detail} Line/throttle look OK — watch clutch feel on launches.`
        : `D17 ${d17.toFixed(1)} — no hard slip/bog signature, but engagement worth a feel-check.`,
      optimize:
        'Hold for now — recheck if launches feel soft or RPM flares without speed. Setup-tagged, not driver blame.',
      metrics,
    }
  }

  return {
    id: 'clutch',
    title: 'Clutch',
    status: 'healthy',
    diagnosis: hasChannels
      ? 'No clutch red flags from RPM/speed this session.'
      : 'No clutch red flags from available session scores (limited RPM/speed channels).',
    optimize: 'Hold — recheck if launches feel soft.',
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
