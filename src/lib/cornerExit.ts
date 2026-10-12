/**
 * D4 Corner exits: slow-corner windows. For each slow-corner minimum speed on full laps, read RPM
 * 0.8 s and 1.5 s after the minimum (Kart Tuning Expert, Oct 5 2026). Scored against the class
 * corner-exit floor (classConfig.cornerExitLowRpm), never against the peak-speed gearing band.
 * Always paired with the minimum speed.
 */
import { lapValidity } from './telemetry'
import type { LapData, TelemetrySample } from './types'

export interface CornerExitWindow {
  lapIndex: number
  /** Seconds from lap start at the minimum. */
  tMin: number
  /** Normalized lap distance (0–1) at the minimum. */
  dist: number
  minSpeed: number
  rpm08?: number
  rpm15?: number
}

export interface CornerExitStats {
  windows: CornerExitWindow[]
  /** Median RPM 0.8 s after the minimum. */
  medianRpm08?: number
  medianRpm15?: number
  medianMinSpeed?: number
  /** Share of windows with RPM@0.8 s below the floor. */
  softShare?: number
}

function valueAt(samples: TelemetrySample[], t: number, key: 'rpm' | 'speed'): number | undefined {
  if (!samples.length || t < samples[0].t || t > samples[samples.length - 1].t) return undefined
  let lo = 0
  let hi = samples.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (samples[mid].t <= t) lo = mid
    else hi = mid
  }
  const a = samples[lo]
  const b = samples[hi]
  const u = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t)
  return a[key] + (b[key] - a[key]) * u
}

function median(xs: number[]): number | undefined {
  if (!xs.length) return undefined
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Slow-corner minima: local speed minimum ≤ 70 km/h with ≥ 8 km/h drop before and recovery after. */
export function findSlowCorners(samples: TelemetrySample[]): number[] {
  const out: number[] = []
  if (samples.length < 10) return out
  const win = 1.5 // s
  for (let i = 1; i < samples.length - 1; i++) {
    const s = samples[i]
    if (!(s.speed > 5) || s.speed > 70) continue
    let isMin = true
    let preMax = s.speed
    let postMax = s.speed
    for (let j = i - 1; j >= 0 && s.t - samples[j].t <= win * 2; j--) {
      if (samples[j].speed < s.speed && s.t - samples[j].t <= win) isMin = false
      preMax = Math.max(preMax, samples[j].speed)
    }
    for (let j = i + 1; j < samples.length && samples[j].t - s.t <= win * 2; j++) {
      if (samples[j].speed < s.speed && samples[j].t - s.t <= win) isMin = false
      postMax = Math.max(postMax, samples[j].speed)
    }
    if (isMin && preMax - s.speed >= 8 && postMax - s.speed >= 8) {
      if (!out.length || s.t - samples[out[out.length - 1]].t > win) out.push(i)
    }
  }
  return out
}

export function cornerExitStats(laps: LapData[], floor: number | null): CornerExitStats {
  const v = lapValidity(laps)
  const windows: CornerExitWindow[] = []
  laps.forEach((lap, li) => {
    if (v[li] !== 'ok') return
    const s = lap.samples
    if (!s.some((x) => x.rpm > 1000) || !s.some((x) => x.speed > 10)) return
    for (const i of findSlowCorners(s)) {
      const tMin = s[i].t
      windows.push({
        lapIndex: li,
        tMin,
        dist: s[i].dist,
        minSpeed: s[i].speed,
        rpm08: valueAt(s, tMin + 0.8, 'rpm'),
        rpm15: valueAt(s, tMin + 1.5, 'rpm'),
      })
    }
  })
  const r08 = windows.map((w) => w.rpm08).filter((x): x is number => x != null && x > 1000)
  const r15 = windows.map((w) => w.rpm15).filter((x): x is number => x != null && x > 1000)
  return {
    windows,
    medianRpm08: median(r08),
    medianRpm15: median(r15),
    medianMinSpeed: median(windows.map((w) => w.minSpeed)),
    softShare: floor != null && r08.length ? r08.filter((x) => x < floor).length / r08.length : undefined,
  }
}

/** 0–5 score from RPM 0.8 s after the minimum vs the class floor. */
export function scoreCornerExit(medianRpm08: number, floor: number): number {
  const d = medianRpm08 - floor
  if (d >= 400) return 4.5
  if (d >= 200) return 4.0
  if (d >= 50) return 3.5
  if (d >= -100) return 3.0
  if (d >= -250) return 2.5
  return 2.0
}

/** Softest exit (lowest RPM 0.8 s after the minimum) inside a normalized distance window of one lap. */
export function exitInWindow(lap: LapData | undefined, a: number, b: number): { rpm08: number; minSpeed: number } | undefined {
  if (!lap) return undefined
  const st = cornerExitStats([lap], null)
  const w = st.windows.filter((x) => x.dist >= a && x.dist <= b && x.rpm08 != null && x.rpm08 > 1000)
  if (!w.length) return undefined
  const soft = w.reduce((m, x) => ((x.rpm08 ?? 0) < (m.rpm08 ?? 0) ? x : m))
  return { rpm08: soft.rpm08!, minSpeed: soft.minSpeed }
}
