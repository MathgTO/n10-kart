import type { LapData, TelemetrySample } from './types'

/** Synthetic but realistic LO206 Junior Mosport-ish lap (~62s) */
export function synthLap(
  timeMs: number,
  seed: number,
  opts?: { exitRpmBias?: number; earlyBrake?: number }
): LapData {
  const samples: TelemetrySample[] = []
  const n = 180
  const exitBias = opts?.exitRpmBias ?? 0
  const earlyBrake = opts?.earlyBrake ?? 0
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const t = (timeMs / 1000) * u
    // Speed profile: straights ~95, hairpins ~35
    const cornerWave = Math.sin(u * Math.PI * 8 + seed * 0.3)
    const base = 72 + 22 * Math.sin(u * Math.PI * 2) - 18 * Math.max(0, cornerWave)
    const brakeDip = earlyBrake > 0 && u > 0.22 && u < 0.32 ? earlyBrake * 8 : 0
    const speed = Math.max(28, base - brakeDip + (seed % 5) * 0.3)
    // RPM tracks speed with LO206 band; exit corners recover toward 5800-6100
    const inExit = cornerWave < -0.2
    const rpmBase = 4200 + speed * 22
    const rpm = Math.min(
      6100,
      Math.max(3800, rpmBase + (inExit ? 400 + exitBias : 0) + Math.sin(u * 40) * 40)
    )
    samples.push({ t, dist: u, speed, rpm })
  }
  const rpms = samples.map((s) => s.rpm)
  const speeds = samples.map((s) => s.speed)
  // Focus exit RPM ~ mid-lap hairpin exit region
  const exitIdx = Math.floor(n * 0.35)
  return {
    index: 0,
    timeMs,
    samples,
    minSpeed: Math.min(...speeds),
    maxSpeed: Math.max(...speeds),
    maxRpm: Math.max(...rpms),
    exitRpmFocus: samples[exitIdx]?.rpm,
  }
}

/**
 * Replace the dist axis with real distance travelled (integrated speed), normalized 0–1.
 * Loggers without a distance channel give samples evenly spaced in time; sectors then have to be
 * cut by distance or every sector would get the same share of the lap time.
 * Leaves samples unchanged when there is no usable speed trace.
 */
export function withDistanceFromSpeed(samples: TelemetrySample[]): TelemetrySample[] {
  if (samples.length < 3) return samples
  let total = 0
  const cum = [0]
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t
    const v = (Math.max(0, samples[i].speed) + Math.max(0, samples[i - 1].speed)) / 2
    total += dt > 0 ? v * dt : 0
    cum.push(total)
  }
  if (!(total > 0)) return samples
  return samples.map((s, i) => ({ ...s, dist: cum[i] / total }))
}

/** Lap time at a normalized distance d (0–1), linear interpolation on the dist axis. */
export function timeAtDist(samples: TelemetrySample[], d: number): number {
  const n = samples.length
  if (!n) return 0
  if (d <= samples[0].dist) return samples[0].t
  if (d >= samples[n - 1].dist) return samples[n - 1].t
  let lo = 0
  let hi = n - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (samples[mid].dist <= d) lo = mid
    else hi = mid
  }
  const a = samples[lo]
  const b = samples[hi]
  const span = b.dist - a.dist
  if (span <= 0) return a.t
  return a.t + ((d - a.dist) / span) * (b.t - a.t)
}

/**
 * Running time delta of `lap` vs `ref` along the lap distance (positive = lap slower so far).
 * Matches points by distance, not by sample index, so laps of different lengths line up.
 */
export function computeDelta(
  lap: TelemetrySample[],
  ref: TelemetrySample[]
): { dist: number; deltaMs: number }[] {
  const out: { dist: number; deltaMs: number }[] = []
  if (lap.length < 2 || ref.length < 2) return out
  for (let i = 1; i < lap.length; i++) {
    const d = lap[i].dist
    out.push({ dist: d, deltaMs: (lap[i].t - timeAtDist(ref, d)) * 1000 })
  }
  return out
}

/** Time lost (ms) by `lap` vs `ref` in each of `sectors` equal-distance splits. */
export function sectorLosses(
  lap: TelemetrySample[],
  ref: TelemetrySample[],
  sectors = 4
): number[] {
  const losses: number[] = []
  for (let s = 0; s < sectors; s++) {
    const a = s / sectors
    const b = (s + 1) / sectors
    const lapT = timeAtDist(lap, b) - timeAtDist(lap, a)
    const refT = timeAtDist(ref, b) - timeAtDist(ref, a)
    losses.push((lapT - refT) * 1000)
  }
  return losses
}

/** Samples inside the distance window [a, b]. */
export function samplesInRange(samples: TelemetrySample[], a: number, b: number): TelemetrySample[] {
  return samples.filter((s) => s.dist >= a && s.dist <= b)
}

export function biggestLossSector(losses: number[]): number {
  let maxI = 0
  let maxV = -Infinity
  losses.forEach((v, i) => {
    if (v > maxV) {
      maxV = v
      maxI = i
    }
  })
  return maxI
}

/**
 * Full laps usable for best / compare / sector comparisons.
 * Out-laps, in-laps and partial laps (timing-beacon fragments) are excluded:
 * a lap counts only if it is within LAP_VALID_MIN–LAP_VALID_MAX of the session's median lap time.
 */
export const LAP_VALID_MIN = 0.8
export const LAP_VALID_MAX = 1.2

export type LapValidity = 'ok' | 'partial' | 'slow'

function medianMs(laps: LapData[]): number | null {
  const ts = laps.map((l) => l.timeMs).filter((t) => t > 0).sort((a, b) => a - b)
  if (!ts.length) return null
  const m = Math.floor(ts.length / 2)
  return ts.length % 2 ? ts[m] : (ts[m - 1] + ts[m]) / 2
}

export function lapValidity(laps: LapData[]): LapValidity[] {
  const med = medianMs(laps)
  return laps.map((l) => {
    if (!(l.timeMs > 0)) return 'partial'
    if (med == null || laps.length < 3) return 'ok'
    if (l.timeMs < med * LAP_VALID_MIN) return 'partial'
    if (l.timeMs > med * LAP_VALID_MAX) return 'slow'
    return 'ok'
  })
}

export function isValidLap(laps: LapData[], i: number): boolean {
  return lapValidity(laps)[i] === 'ok'
}

export function pickBestFlyingLap(laps: LapData[]): number {
  if (!laps.length) return 0
  const v = lapValidity(laps)
  const pool = laps.map((l, i) => ({ i, t: l.timeMs })).filter((x) => v[x.i] === 'ok')
  const fallback = laps.map((l, i) => ({ i, t: l.timeMs })).filter((x) => x.t > 0)
  const use = pool.length ? pool : fallback
  if (!use.length) return 0
  return use.reduce((best, cur) => (cur.t < best.t ? cur : best)).i
}

/** Compare lap = fastest valid lap that is not the best lap. Returns bestIdx when there is none. */
export function pickCompareLap(laps: LapData[], bestIdx = pickBestFlyingLap(laps)): number {
  const v = lapValidity(laps)
  const pool = laps
    .map((l, i) => ({ i, t: l.timeMs }))
    .filter((x) => x.i !== bestIdx && v[x.i] === 'ok')
  if (!pool.length) return bestIdx
  return pool.reduce((best, cur) => (cur.t < best.t ? cur : best)).i
}

/** Use the requested compare lap if it is a valid, non-best lap; otherwise the default compare lap. */
export function resolveCompareLap(laps: LapData[], requested: number, bestIdx = pickBestFlyingLap(laps)): number {
  if (requested !== bestIdx && laps[requested] && isValidLap(laps, requested)) return requested
  return pickCompareLap(laps, bestIdx)
}

/** Ideal lap = sum of the fastest real sector times across full laps (equal-distance splits). */
export function idealLapMs(laps: LapData[], sectors = 4): number | null {
  const v = lapValidity(laps)
  const full = laps.filter((l, i) => v[i] === 'ok' && l.samples.length >= 2)
  if (full.length < 2) return null
  const bestPer: number[] = Array(sectors).fill(Infinity)
  for (const lap of full) {
    for (let s = 0; s < sectors; s++) {
      const t = (timeAtDist(lap.samples, (s + 1) / sectors) - timeAtDist(lap.samples, s / sectors)) * 1000
      if (t > 0) bestPer[s] = Math.min(bestPer[s], t)
    }
  }
  if (bestPer.some((x) => !Number.isFinite(x))) return null
  return bestPer.reduce((a, b) => a + b, 0)
}
