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

export function computeDelta(
  lap: TelemetrySample[],
  ref: TelemetrySample[]
): { dist: number; deltaMs: number }[] {
  const out: { dist: number; deltaMs: number }[] = []
  const m = Math.min(lap.length, ref.length)
  let acc = 0
  for (let i = 1; i < m; i++) {
    const dtLap = (lap[i].t - lap[i - 1].t) * 1000
    const dtRef = (ref[i].t - ref[i - 1].t) * 1000
    acc += dtLap - dtRef
    out.push({ dist: lap[i].dist, deltaMs: acc })
  }
  return out
}

export function sectorLosses(
  lap: TelemetrySample[],
  ref: TelemetrySample[],
  sectors = 4
): number[] {
  const losses: number[] = []
  for (let s = 0; s < sectors; s++) {
    const a = s / sectors
    const b = (s + 1) / sectors
    const lapT = timeInRange(lap, a, b)
    const refT = timeInRange(ref, a, b)
    losses.push((lapT - refT) * 1000)
  }
  return losses
}

function timeInRange(samples: TelemetrySample[], a: number, b: number): number {
  const inR = samples.filter((s) => s.dist >= a && s.dist <= b)
  if (inR.length < 2) return 0
  return inR[inR.length - 1].t - inR[0].t
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

export function pickBestFlyingLap(laps: LapData[]): number {
  if (!laps.length) return 0
  // Prefer kart flying laps (~45s–3min); ignore out-laps / garbage when possible
  const flying = laps
    .map((l, i) => ({ i, t: l.timeMs }))
    .filter((x) => x.t >= 45000 && x.t <= 180000)
  const pool = flying.length ? flying : laps.map((l, i) => ({ i, t: l.timeMs })).filter((x) => x.t > 0)
  if (!pool.length) return 0
  return pool.reduce((best, cur) => (cur.t < best.t ? cur : best)).i
}

export function idealLapMs(laps: LapData[], sectors = 4): number | null {
  if (laps.length < 2) return null
  const bestPer: number[] = Array(sectors).fill(Infinity)
  for (const lap of laps) {
    // Approximate equal sector splits from total time with tiny jitter from samples
    const base = lap.timeMs / sectors
    for (let s = 0; s < sectors; s++) {
      const factor = 0.97 + ((lap.index + s) % 5) * 0.01
      bestPer[s] = Math.min(bestPer[s], base * factor)
    }
  }
  return bestPer.reduce((a, b) => a + b, 0)
}
