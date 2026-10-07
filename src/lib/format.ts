/** Format lap time ms → m:ss.mmm (never 4 fractional digits) */
export function formatLapTime(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—'
  const totalMs = Math.round(ms)
  const minutes = Math.floor(totalMs / 60000)
  const rem = totalMs % 60000
  const seconds = Math.floor(rem / 1000)
  const millis = rem % 1000
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

/** Best-lap gap in seconds, 3 decimals — same style as the session lap-strip compare delta. */
export function formatGapSeconds(ms: number): string {
  return `+${(Math.max(0, ms) / 1000).toFixed(3)}`
}

export function formatDeltaMs(ms: number): string {
  const sign = ms > 0 ? '+' : ms < 0 ? '−' : ''
  const abs = Math.abs(Math.round(ms))
  if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(3)}s`
  }
  return `${sign}${abs} ms`
}

export function scoreBand(score: number): 'high' | 'mid' | 'low' {
  if (score >= 4) return 'high'
  if (score >= 2.5) return 'mid'
  return 'low'
}

export function formatRpm(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return `${Math.round(n).toLocaleString('en-US')}`
}

/** MyChron lap number when known; else 1-based array index. */
export function formatLapLabel(lap: { lapNumber?: number; index?: number } | null | undefined, fallbackIndex: number): string {
  const n = lap?.lapNumber ?? (lap?.index != null ? lap.index + 1 : fallbackIndex + 1)
  return `Lap ${n}`
}
