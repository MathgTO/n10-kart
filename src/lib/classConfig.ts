/**
 * Per-class engine config (replaces the old hardcoded EXIT_RPM_BAND and yellow-.570 copy).
 *
 * Source: Kart Tuning Expert, Oct 5 2026. The old 5.8k–6.1k "exit band" was really a main-straight /
 * peak-speed GEARING band, so it is split into two knobs:
 *  - peakSpeedBand / nearLimiter → gearing Health + the straight-line story only.
 *  - cornerExitLowRpm → D4 Corner exits, judged in slow-corner windows (RPM 0.8 s after the minimum
 *    speed, plus 1.5 s), never against the peak band.
 * cornerExitLowRpm is a working threshold from Mosport data (exits ~3500–3600 were too tall/soft,
 * early corners ~3700–3900), not a factory table. Unknown values stay null — never invented.
 */
export type ClassId = 'junior_light' | 'junior' | 'senior' | 'other'

export interface ClassConfig {
  id: ClassId
  label: string
  /** Short engine/slide line for the setup step. */
  detail: string
  slide: string | null
  /** Rev limiter (RPM); null = verify local rules. */
  limiter: number | null
  /** At/above this the kart is "near the limiter" on the straight. */
  nearLimiter: number | null
  /** Peak-speed (main straight) gearing band. */
  peakSpeedBand: { lo: number; hi: number; ideal?: number } | null
  /** D4: RPM 0.8 s after a slow-corner minimum below this = soft exit. null = unknown. */
  cornerExitLowRpm: number | null
  /** Default dry tire (MIKA mandated). */
  defaultTire: string
  /** Default wet tire (MIKA mandated). */
  defaultWetTire: string
  /** Dry size string for MIKA Briggs (null = unknown). */
  tireSizeDry: string | null
  /** How the limiter is spoken in the tuner voice. */
  limiterSpoken: string | null
}

export const CLASS_CONFIGS: Record<ClassId, ClassConfig> = {
  junior_light: {
    id: 'junior_light',
    label: 'Junior Light',
    detail: 'Blue .520 slide #555734 · 6150 RPM limit · green module 555718',
    slide: 'blue .520',
    limiter: 6150,
    nearLimiter: 6050,
    peakSpeedBand: { lo: 5800, hi: 6150, ideal: 6000 },
    cornerExitLowRpm: 3700,
    defaultTire: 'VEGA BLUE',
    defaultWetTire: 'VEGA W6',
    tireSizeDry: '4.6/6.5',
    limiterSpoken: 'sixty-one-fifty',
  },
  junior: {
    id: 'junior',
    label: 'Junior',
    detail: 'Yellow .570 slide · 6100 RPM limit',
    slide: 'yellow .570',
    limiter: 6100,
    nearLimiter: 6000,
    peakSpeedBand: { lo: 5800, hi: 6100 },
    cornerExitLowRpm: 3700,
    defaultTire: 'VEGA BLUE',
    defaultWetTire: 'VEGA W6',
    tireSizeDry: '4.6/6.5',
    limiterSpoken: 'sixty-one hundred',
  },
  senior: {
    id: 'senior',
    label: 'Senior',
    detail: 'Limiter: verify local rules',
    slide: null,
    limiter: null,
    nearLimiter: null,
    peakSpeedBand: null,
    cornerExitLowRpm: null,
    defaultTire: 'VEGA BLUE',
    defaultWetTire: 'VEGA W6',
    tireSizeDry: '4.6/6.5',
    limiterSpoken: null,
  },
  other: {
    id: 'other',
    label: 'Other',
    detail: 'Class unconfirmed — no limiter band',
    slide: null,
    limiter: null,
    nearLimiter: null,
    peakSpeedBand: null,
    cornerExitLowRpm: null,
    defaultTire: 'VEGA BLUE',
    defaultWetTire: 'VEGA W6',
    tireSizeDry: null,
    limiterSpoken: null,
  },
}


/** MIKA-mandated compounds (display names). */
export const TIRE_MANDATED = ['VEGA BLUE', 'VEGA W6'] as const
/** Practice / other compounds — never the class default badge. */
export const TIRE_OPTIONAL = ['Mega White', 'Vega White', 'Vega Yellow', 'MG Yellow', 'Other'] as const
export const CLASS_OPTIONS: ClassId[] = ['junior_light', 'junior', 'senior', 'other']
export const DEFAULT_CLASS: ClassId = 'junior_light'

export function getClassConfig(id?: string | null): ClassConfig {
  if (id && id in CLASS_CONFIGS) return CLASS_CONFIGS[id as ClassId]
  return CLASS_CONFIGS.other
}

export function tireSizeForClass(id?: string | null): string | null {
  return getClassConfig(id).tireSizeDry
}


/** Map legacy free-text class labels ('LO206', 'LO206 Junior') to a class id. */
export function classIdFromLegacy(label?: string | null): ClassId {
  if (!label) return DEFAULT_CLASS
  if (label in CLASS_CONFIGS) return label as ClassId
  const l = label.toLowerCase()
  if (l.includes('light')) return 'junior_light'
  if (l.includes('senior')) return 'senior'
  // Legacy 'LO206' / 'LO206 Junior' labels predate the class setting; Gabriel runs Junior Light.
  return DEFAULT_CLASS
}
