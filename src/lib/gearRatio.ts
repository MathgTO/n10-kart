import { EXIT_RPM_BAND } from './rubric'

/** Assumptions labeled in UI — LO206 #35 / common rear tire ballpark */
export const GEAR_ASSUMPTIONS = {
  driverTeeth: 17,
  /** Effective rolling diameter (m) — typical LO206 rear; labeled as estimate */
  tireDiameterM: 0.28,
  /** Swift: common sprint starting zone */
  typicalRatioBand: { lo: 3.8, hi: 4.7 },
  /** One rear tooth on 17T ≈ 0.06 ratio */
  toothDelta17: 1 / 17,
} as const

export type GearAdvice = {
  peakSpeedKmh: number
  peakRpm: number
  exitRpm?: number
  estimatedCurrentRatio: number
  idealRatio: number
  idealBand: { lo: number; hi: number }
  suggestedRearTeeth: { lo: number; hi: number; center: number }
  /** Recommended rear-tooth magnitude from peak RPM vs speed math (may be ±2/+3). */
  toothDelta: number
  action: 'plus' | 'minus' | 'hold'
  summary: string
  detail: string
}

function wheelRpmAtSpeed(speedKmh: number, tireDiameterM: number): number {
  const v = speedKmh / 3.6 // m/s
  const circ = Math.PI * tireDiameterM
  const rps = v / circ
  return rps * 60
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

/**
 * Suggest ideal LO206 ratio band from peak RPM + peak speed.
 * Setup-tagged estimate — verify on scales / tooth count before changing.
 * One-change = one category (gear); magnitude from peak RPM vs speed math (no ±1 cap).
 */
export function suggestGearRatio(input: {
  maxRpm?: number
  maxSpeedKmh?: number
  exitRpm?: number
  series?: string
}): GearAdvice | null {
  const peakRpm = input.maxRpm
  const peakSpeedKmh = input.maxSpeedKmh
  if (
    peakRpm == null ||
    peakSpeedKmh == null ||
    !Number.isFinite(peakRpm) ||
    !Number.isFinite(peakSpeedKmh) ||
    peakRpm < 3000 ||
    peakSpeedKmh < 20
  ) {
    return null
  }

  const { driverTeeth, tireDiameterM, typicalRatioBand, toothDelta17 } = GEAR_ASSUMPTIONS
  const wRpm = wheelRpmAtSpeed(peakSpeedKmh, tireDiameterM)
  if (wRpm < 50) return null

  const estimatedCurrentRatio = peakRpm / wRpm
  // Ideal: at this peak speed, sit in power band (prefer upper half toward limiter on the straight)
  const idealLo = EXIT_RPM_BAND.lo / wRpm
  const idealHi = EXIT_RPM_BAND.hi / wRpm
  const idealRatio = ((EXIT_RPM_BAND.lo + EXIT_RPM_BAND.hi) / 2 + 50) / wRpm // ~5975

  const toothDelta = Math.round((idealRatio - estimatedCurrentRatio) / toothDelta17)
  // Positive toothDelta = need higher numerical ratio = + rear teeth (shorter)
  let action: GearAdvice['action'] = 'hold'
  if (toothDelta >= 1 || (input.exitRpm != null && input.exitRpm < EXIT_RPM_BAND.lo - 50)) {
    action = 'plus'
  } else if (
    toothDelta <= -1 ||
    peakRpm >= EXIT_RPM_BAND.hi - 20
  ) {
    action = 'minus'
  }

  // Soft overrides from Swift scenarios
  if (peakRpm >= 6080) action = 'minus'
  if (input.exitRpm != null && input.exitRpm < 5700 && peakRpm < 6000) action = 'plus'

  const centerTeeth = Math.round(idealRatio * driverTeeth)
  const suggestedRearTeeth = {
    lo: clamp(Math.round(idealLo * driverTeeth), 60, 80),
    hi: clamp(Math.round(idealHi * driverTeeth), 60, 80),
    center: clamp(centerTeeth, 60, 80),
  }

  const curTeeth = Math.round(estimatedCurrentRatio * driverTeeth)
  const absTeeth = Math.max(1, Math.abs(toothDelta) || 1)

  const deltaLabel =
    action === 'plus'
      ? `Recommend +${absTeeth} rear tooth (shorter) on a ${driverTeeth}T driver`
      : action === 'minus'
        ? `Recommend −${absTeeth} rear tooth (longer) on a ${driverTeeth}T driver`
        : 'Hold — peak speed/RPM already near the band'

  const summary = `Ideal ratio ~${idealLo.toFixed(2)}–${idealHi.toFixed(2)} (≈ ${suggestedRearTeeth.lo}–${suggestedRearTeeth.hi}T / ${driverTeeth}T). Est. now ~${estimatedCurrentRatio.toFixed(2)} (≈ ${curTeeth}T). ${deltaLabel}.`

  const detail = `At ${peakSpeedKmh.toFixed(0)} km/h peak you saw ~${Math.round(peakRpm)} RPM (exit focus ~${input.exitRpm != null ? Math.round(input.exitRpm) : '—'}). Target ${EXIT_RPM_BAND.lo}–${EXIT_RPM_BAND.hi} on power. Estimate assumes Ø${(tireDiameterM * 1000).toFixed(0)} mm rolling rear + ${driverTeeth}T driver — verify your actual sprockets. Typical LO206 sprint window ${typicalRatioBand.lo}–${typicalRatioBand.hi} (Swift). Junior yellow slide: gear for band peak, not limiter ego. Junior Light / green-module band is owned by Kart Tuning Expert if class differs.`

  return {
    peakSpeedKmh,
    peakRpm,
    exitRpm: input.exitRpm,
    estimatedCurrentRatio,
    idealRatio,
    idealBand: { lo: idealLo, hi: idealHi },
    suggestedRearTeeth,
    toothDelta,
    action,
    summary,
    detail,
  }
}
