import { getClassConfig, type ClassConfig } from './classConfig'

/**
 * Per-session gearing (teeth). Rear is what the driver actually changes; front = clutch driver.
 * Advice in teeth only needs the REAR count: at the same road speed engine RPM scales 1:1 with
 * rear teeth, so "+N teeth" is independent of the front sprocket and tire size.
 */
export type Gearing = { rearTeeth?: number; frontTeeth?: number }

/** km/h → m/s → rev/min factor: engineRPM per km/h = ratio × KMH_TO_RPM_PER_M / rolling diameter (m). */
const KMH_TO_RPM_PER_M = 60 / (3.6 * Math.PI) // 5.3052

/**
 * Calibration from the owner's real Mosport logs (median clutch-locked RPM per km/h, ≥60 km/h):
 *   Sep 25 2026 (67T): 66.3 RPM per km/h · Oct 4 2026 (69T): 68.3 RPM per km/h (+3.1%, 69/67 = +2.99%).
 * Solving ratio × 5.305 / D = RPM per km/h:
 *   19T front → D ≈ 0.282 m (11.1 in, radius 0.141 m) — matches an 11×7.10-5 LO206 rear with a little growth.
 *   17T front → D ≈ 0.316 m (12.4 in) — ~13% over an 11 in rear tire: not physical.
 * So the data points to a 19T driver (#219 chain, the usual pairing for 65–74T rears on an LO206 Junior).
 */
export const GEAR_CALIBRATION = {
  frontTeeth: 19,
  rollingDiameterM: 0.282,
  samples: [
    { date: '2026-09-25', rearTeeth: 67, rpmPerKmh: 66.3 },
    { date: '2026-10-04', rearTeeth: 69, rpmPerKmh: 68.3 },
  ],
} as const

export const GEAR_DEFAULTS = {
  /** Assumed clutch driver until the owner edits it (see GEAR_CALIBRATION). */
  frontTeeth: GEAR_CALIBRATION.frontTeeth,
  minTeeth: { front: 10, rear: 40 },
  maxTeeth: { front: 30, rear: 99 },
} as const

/** Back-compat for older imports — the old 17T / Ø0.28 m assumption is gone. */
export const GEAR_ASSUMPTIONS = {
  driverTeeth: GEAR_DEFAULTS.frontTeeth,
  tireDiameterM: GEAR_CALIBRATION.rollingDiameterM,
  typicalRatioBand: { lo: 3.4, hi: 4.3 },
} as const

/** Gearing targets from the class peak-speed band (straight-line story only; never corner exits). */
function targets(cls: ClassConfig) {
  const band = cls.peakSpeedBand!
  return {
    /** Peak within this many RPM of the band edge still counts as "at the edge" (one-sample noise). */
    edgeTolRpm: 50,
    /** Aim for the ideal (or band middle) when shortening/lengthening. */
    ideal: band.ideal ?? Math.round((band.lo + band.hi) / 2),
    /** Never add teeth past this peak (headroom under the limiter). */
    peakCeiling: (cls.nearLimiter ?? band.hi) - 50,
  }
}

export type GearVerdict = 'ok' | 'ok_edge' | 'too_tall' | 'too_short' | 'conflict'

export type GearAdvice = {
  peakSpeedKmh: number
  peakRpm: number
  exitRpm?: number
  /** Actual gearing when entered. */
  rearTeeth?: number
  frontTeeth: number
  rearKnown: boolean
  frontAssumed: boolean
  /** rear / front when rear known; otherwise calibrated estimate (ratio only, never teeth). */
  ratio: number
  ratioIsEstimate: boolean
  rpmPerKmh?: number
  /** RPM/km/h predicted by the entered gearing + calibrated rolling diameter. */
  expectedRpmPerKmh?: number
  dataCheck?: 'match' | 'mismatch'
  /** Required final-drive change (fraction, + = shorter/more rear teeth). 0 when holding. */
  ratioChangePct: number
  /** Rear teeth change from the current rear (0 when holding or rear unknown). */
  toothDelta: number
  suggestedRearTeeth?: number
  verdict: GearVerdict
  action: 'plus' | 'minus' | 'hold'
  headline: string
  summary: string
  detail: string
}

export function isValidTeeth(n: unknown, kind: 'front' | 'rear'): n is number {
  return (
    typeof n === 'number' &&
    Number.isInteger(n) &&
    n >= GEAR_DEFAULTS.minTeeth[kind] &&
    n <= GEAR_DEFAULTS.maxTeeth[kind]
  )
}

function fmtPct(p: number): string {
  return `${p > 0 ? '+' : p < 0 ? '−' : ''}${Math.abs(p * 100).toFixed(1)}%`
}

function rpm(n: number) {
  return Math.round(n).toLocaleString('en-US')
}

/**
 * Gear advice from where exit and peak RPM sit vs the 5,800–6,100 band.
 * - Exit in band (±50) → "Gearing OK" (hold). Never "too tall" with exit in band.
 * - Exit below band → + rear teeth (shorter), capped so peak stays ≤ 6,000.
 * - Exit above band → − rear teeth (longer).
 * - No exit sample → judge on peak RPM.
 * Rear known → "+N / −N teeth from your current XT". Rear unknown → ratio change only.
 */
export function suggestGearRatio(input: {
  maxRpm?: number
  maxSpeedKmh?: number
  exitRpm?: number
  series?: string
  rearTeeth?: number
  frontTeeth?: number
  /** Median clutch-locked RPM per km/h for the session (robust ratio fingerprint). */
  rpmPerKmh?: number
  /** Class id → peak-speed band + limiter. No band (class unconfirmed) → no gear verdict. */
  classId?: string
}): GearAdvice | null {
  const cls = getClassConfig(input.classId ?? 'junior_light')
  if (!cls.peakSpeedBand) return null
  const TARGET = targets(cls)
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

  const rearKnown = isValidTeeth(input.rearTeeth, 'rear')
  const rearTeeth = rearKnown ? (input.rearTeeth as number) : undefined
  // Front unknown is allowed: never assume a tooth count for display; the calibrated 19T basis is only used
  // internally for the ratio estimate, and tooth-level advice needs both sprockets (KTE Tier A).
  const frontAssumed = !isValidTeeth(input.frontTeeth, 'front')
  const frontTeeth = frontAssumed ? GEAR_DEFAULTS.frontTeeth : (input.frontTeeth as number)
  const D = GEAR_CALIBRATION.rollingDiameterM
  const rpmPerKmh =
    input.rpmPerKmh != null && Number.isFinite(input.rpmPerKmh) && input.rpmPerKmh > 10
      ? input.rpmPerKmh
      : undefined
  const measuredRpmPerKmh = rpmPerKmh ?? peakRpm / peakSpeedKmh

  let ratio: number
  let expectedRpmPerKmh: number | undefined
  let dataCheck: GearAdvice['dataCheck']
  if (rearTeeth != null && !frontAssumed) {
    ratio = rearTeeth / frontTeeth
    expectedRpmPerKmh = (ratio * KMH_TO_RPM_PER_M) / D
    if (rpmPerKmh != null) {
      dataCheck = Math.abs(rpmPerKmh / expectedRpmPerKmh - 1) <= 0.025 ? 'match' : 'mismatch'
    }
  } else {
    // Calibrated on the owner's 67T/69T logs (Ø0.282 m) — a ratio estimate, never a tooth guess.
    ratio = (measuredRpmPerKmh * D) / KMH_TO_RPM_PER_M
  }

  const { lo, hi } = cls.peakSpeedBand
  const tol = TARGET.edgeTolRpm
  const lim = cls.limiter

  // Judged on peak RPM at peak speed vs the class peak-speed band (main straight), never on corner exits.
  let verdict: GearVerdict = 'ok'
  let pct = 0
  if (peakRpm >= lo && peakRpm <= hi) verdict = cls.nearLimiter != null && peakRpm >= cls.nearLimiter ? 'ok_edge' : 'ok'
  else if (peakRpm >= lo - tol && peakRpm <= hi + tol) verdict = 'ok_edge'
  else if (peakRpm < lo - tol) {
    verdict = 'too_tall'
    pct = Math.min(TARGET.ideal, TARGET.peakCeiling) / peakRpm - 1
  } else {
    verdict = 'too_short'
    pct = TARGET.ideal / peakRpm - 1
  }

  const teethKnown = rearTeeth != null && !frontAssumed
  let toothDelta = 0
  if (teethKnown && pct !== 0) {
    const raw = rearTeeth! * pct
    toothDelta = pct > 0 ? Math.max(1, Math.round(raw)) : Math.min(-1, Math.round(raw))
  }
  const action: GearAdvice['action'] =
    verdict === 'too_tall' ? 'plus' : verdict === 'too_short' ? 'minus' : 'hold'
  if (action === 'hold') pct = 0
  const suggestedRearTeeth = teethKnown ? rearTeeth! + toothDelta : undefined

  const gearLabel =
    rearTeeth != null
      ? `${rearTeeth}T rear · ${frontAssumed ? 'front sprocket unknown' : `${frontTeeth}T front`}`
      : 'rear sprocket not entered'
  const bandTxt = `${rpm(lo)}–${rpm(hi)}`
  const limTxt = lim != null ? `${cls.label} limiter ${rpm(lim)}` : `${cls.label}`

  let headline: string
  switch (verdict) {
    case 'ok':
      headline = rearTeeth != null ? `Gearing OK — keep ${rearTeeth}T` : 'Gearing OK'
      break
    case 'ok_edge':
      headline = rearTeeth != null ? `Gearing OK — keep ${rearTeeth}T (peak near the limiter)` : 'Gearing OK (peak near the limiter)'
      break
    case 'too_tall':
      headline = teethKnown
        ? `Gearing too tall — +${toothDelta} teeth from your current ${rearTeeth}T`
        : `Gearing too tall — more rear teeth (shorter gear) ${fmtPct(pct)}`
      break
    case 'too_short':
      headline = teethKnown
        ? `Gearing too short — −${Math.abs(toothDelta)} teeth from your current ${rearTeeth}T`
        : `Gearing too short — fewer rear teeth (taller gear) ${fmtPct(pct)}`
      break
    default:
      headline = 'Gearing'
  }

  let summary: string
  if (action === 'hold') {
    summary = `Peak ~${rpm(peakRpm)} RPM at ${peakSpeedKmh.toFixed(0)} km/h sits ${verdict === 'ok' ? 'in' : 'at the edge of'} the ${bandTxt} peak-speed band (${limTxt}) — no gear change.`
  } else if (teethKnown) {
    summary = `${action === 'plus' ? '+' : '−'}${Math.abs(toothDelta)} teeth from your current ${rearTeeth}T → ${suggestedRearTeeth}T (${fmtPct(toothDelta / rearTeeth!)} RPM at the same speed).`
  } else {
    summary = `${action === 'plus' ? 'Shorten' : 'Lengthen'} the final drive by ~${Math.abs(pct * 100).toFixed(1)}% (${fmtPct(pct)} RPM at the same speed). ${
      rearTeeth == null ? 'Rear sprocket unknown — gear directional only.' : 'Front sprocket unknown — no tooth count.'
    }`
  }

  const checkTxt =
    rpmPerKmh != null && expectedRpmPerKmh != null
      ? dataCheck === 'match'
        ? ` Data check: ${rpmPerKmh.toFixed(1)} RPM per km/h matches ${rearTeeth}/${frontTeeth}.`
        : ` Data check: ${rpmPerKmh.toFixed(1)} RPM per km/h is ${fmtPct(rpmPerKmh / expectedRpmPerKmh - 1)} off what ${rearTeeth}/${frontTeeth} predicts — recount the sprockets.`
      : ''
  const detail = `Peak ${peakSpeedKmh.toFixed(0)} km/h @ ~${rpm(peakRpm)} RPM vs the ${bandTxt} peak-speed band (${limTxt}). Gearing: ${gearLabel}${
    teethKnown ? ` = ${ratio.toFixed(2)}` : ''
  }.${checkTxt} One rear tooth ≈ ${rearTeeth != null ? fmtPct(1 / rearTeeth) : '±1.5%'} RPM at a given speed.`

  const exit = input.exitRpm != null && Number.isFinite(input.exitRpm) && input.exitRpm > 1000 ? input.exitRpm : undefined
  return {
    peakSpeedKmh,
    peakRpm,
    exitRpm: exit,
    rearTeeth,
    frontTeeth,
    rearKnown,
    frontAssumed,
    ratio,
    ratioIsEstimate: rearTeeth == null,
    rpmPerKmh,
    expectedRpmPerKmh,
    dataCheck,
    ratioChangePct: pct,
    toothDelta,
    suggestedRearTeeth,
    verdict,
    action,
    headline,
    summary,
    detail,
  }
}
