/**
 * Session date/time + worldwide time zone (track-autodetect.md §6). No hardcoded zone:
 * zone = track table → tz-lookup (offline, coordinates) → device → manual override.
 * GPS week/iTOW is the truth; the logger wall clock (TMD/TMT) is only a cross-check.
 * File mtime / upload time are never used as the session time.
 */
import type { FileMeta, TrackInfo } from './types'

export type TzSource = 'track' | 'tz-lookup' | 'device' | 'manual'
export type DateSource = 'gps' | 'logger' | 'manual'

export function deviceZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function isValidZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Offline coordinate → IANA lookup (lazy-loaded; ~29 KB gzip). */
export async function lookupZone(lat: number, lon: number): Promise<string | null> {
  try {
    const mod = await import('@photostructure/tz-lookup')
    const fn = (mod as unknown as { default: (a: number, b: number) => string }).default ?? (mod as unknown as (a: number, b: number) => string)
    const z = fn(lat, lon)
    return z && isValidZone(z) ? z : null
  } catch {
    return null
  }
}

export async function resolveZone(
  track: TrackInfo | null,
  coords?: { lat: number; lon: number }
): Promise<{ tz: string; tzSource: TzSource }> {
  if (track?.tz && isValidZone(track.tz)) return { tz: track.tz, tzSource: 'track' }
  const c = coords ?? (track?.lat != null && track?.lon != null ? { lat: track.lat, lon: track.lon } : undefined)
  if (c) {
    const z = await lookupZone(c.lat, c.lon)
    if (z) return { tz: z, tzSource: 'tz-lookup' }
  }
  return { tz: deviceZone(), tzSource: 'device' }
}

/** Zone offset (minutes east of UTC) at an instant. */
export function zoneOffsetMin(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const p: Record<string, number> = {}
  for (const part of dtf.formatToParts(new Date(utcMs))) if (part.type !== 'literal') p[part.type] = Number(part.value)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second)
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000)
}

export interface Ymd {
  y: number
  m: number
  d: number
}

/**
 * Logger date, order-agnostic: a field > 12 decides; else Reg=usa → MM/DD; else (no hint) MM/DD and flag.
 * Accepts '10/03/2026', '2026/10/03', '2026-10-03'.
 */
export function parseLoggerDate(raw: string | undefined, hwReg?: string): { ymd: Ymd; ambiguous: boolean } | null {
  if (!raw) return null
  const s = raw.trim()
  let m = /^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/.exec(s)
  if (m) return { ymd: { y: +m[1], m: +m[2], d: +m[3] }, ambiguous: false }
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s)
  if (!m) return null
  const a = +m[1]
  const b = +m[2]
  const y = +m[3]
  if (a > 12 && b <= 12) return { ymd: { y, m: b, d: a }, ambiguous: false }
  if (b > 12 && a <= 12) return { ymd: { y, m: a, d: b }, ambiguous: false }
  if (hwReg && hwReg !== 'usa') return { ymd: { y, m: b, d: a }, ambiguous: true }
  return { ymd: { y, m: a, d: b }, ambiguous: hwReg !== 'usa' }
}

export function parseHms(raw: string | undefined): { h: number; mi: number; s: number } | null {
  if (!raw) return null
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(raw.trim())
  if (!m) return null
  return { h: +m[1], mi: +m[2], s: m[3] ? +m[3] : 0 }
}

/**
 * Local wall clock in a zone → UTC instant (2-pass). DST overlap → earlier instant (ambiguous);
 * spring-forward gap → shifted forward by the gap (gap).
 */
export function wallClockToUtc(
  ymd: Ymd,
  hms: { h: number; mi: number; s: number },
  tz: string
): { utcMs: number; ambiguous: boolean; gap: boolean } {
  const wall = Date.UTC(ymd.y, ymd.m - 1, ymd.d, hms.h, hms.mi, hms.s)
  const offBefore = zoneOffsetMin(wall - 14 * 3600000, tz)
  const offAfter = zoneOffsetMin(wall + 14 * 3600000, tz)
  const cands = [...new Set([offBefore, offAfter])]
    .map((off) => wall - off * 60000)
    .filter((c) => zoneOffsetMin(c, tz) * 60000 + c === wall)
    .sort((x, y) => x - y)
  if (cands.length >= 2) return { utcMs: cands[0], ambiguous: true, gap: false }
  if (cands.length === 1) return { utcMs: cands[0], ambiguous: false, gap: false }
  // Spring-forward gap: interpret with the pre-transition offset → lands after the gap.
  return { utcMs: wall - offBefore * 60000, ambiguous: false, gap: true }
}

export interface SessionTimeResult {
  startUtc?: string
  dateSource?: DateSource
  /** Logger date error in whole days (logger − GPS; −1 = logger one day behind). */
  dayOffset: number
  /** Logger zone/DST off by whole hours (GPS wins). */
  hourMismatch?: number
  /** Logger wall clock interpreted in the track zone (for Undo). */
  loggerUtc?: string
  ambiguous?: boolean
  gap?: boolean
}

/** GPS start vs logger stamp (track-autodetect.md §6.2). */
export function resolveSessionTime(meta: FileMeta | undefined, tz: string): SessionTimeResult {
  const parsedDate = parseLoggerDate(meta?.loggerDate, meta?.hwReg)
  const hms = parseHms(meta?.loggerTime)
  let loggerUtcMs: number | undefined
  let ambiguous = false
  let gap = false
  if (parsedDate && hms) {
    const w = wallClockToUtc(parsedDate.ymd, hms, tz)
    loggerUtcMs = w.utcMs
    ambiguous = w.ambiguous
    gap = w.gap
  }
  const loggerUtc = loggerUtcMs != null ? new Date(loggerUtcMs).toISOString() : undefined
  const gpsMs = meta?.gpsStartUtcMs
  if (gpsMs != null && Number.isFinite(gpsMs)) {
    const out: SessionTimeResult = { startUtc: new Date(gpsMs).toISOString(), dateSource: 'gps', dayOffset: 0, loggerUtc }
    if (loggerUtcMs != null) {
      const delta = loggerUtcMs - gpsMs
      const H = 3600000
      const D = 24 * H
      const tol = 15 * 60000
      const days = Math.round(delta / D)
      if (Math.abs(delta) <= tol) {
        /* logger OK */
      } else if (days !== 0 && Math.abs(delta - days * D) <= tol) {
        out.dayOffset = days
      } else {
        const hours = Math.round(delta / H)
        if (hours !== 0 && Math.abs(delta - hours * H) <= tol) {
          // Days + hours combined (e.g. −1 day and −1 h): report days and hours separately.
          const d2 = Math.trunc(hours / 24)
          out.dayOffset = d2
          out.hourMismatch = hours - d2 * 24 || undefined
        }
      }
    }
    return out
  }
  if (loggerUtcMs != null) return { startUtc: loggerUtc, dateSource: 'logger', dayOffset: 0, loggerUtc, ambiguous, gap }
  return { dayOffset: 0 }
}

// ---------- display ----------

export interface LocalParts {
  ymd: string // 'YYYY-MM-DD' in the track zone
  weekdayShort: string // 'Sun'
  weekdayLong: string // 'Sunday'
  monthShort: string // 'Oct'
  monthLong: string // 'October'
  day: number
  year: number
  hhmm: string // '15:01'
  zone: string // 'EDT'
}

export function localParts(utcIso: string, tz: string): LocalParts {
  const d = new Date(utcIso)
  const zoneOk = isValidZone(tz) ? tz : 'UTC'
  const fmt = (o: Intl.DateTimeFormatOptions, loc = 'en-US') => new Intl.DateTimeFormat(loc, { timeZone: zoneOk, ...o })
  const parts: Record<string, string> = {}
  for (const p of fmt({
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d))
    parts[p.type] = p.value
  let zone = fmt({ timeZoneName: 'short' }).formatToParts(d).find((p) => p.type === 'timeZoneName')?.value ?? ''
  if (/^GMT/.test(zone) && /^Europe\//.test(zoneOk)) {
    zone = fmt({ timeZoneName: 'short' }, 'en-GB').formatToParts(d).find((p) => p.type === 'timeZoneName')?.value ?? zone
  }
  return {
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
    weekdayShort: fmt({ weekday: 'short' }).format(d),
    weekdayLong: fmt({ weekday: 'long' }).format(d),
    monthShort: fmt({ month: 'short' }).format(d),
    monthLong: fmt({ month: 'long' }).format(d),
    day: Number(parts.day),
    year: Number(parts.year),
    hhmm: `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`,
    zone,
  }
}

/** 'Oct 3' from a logger date (for "logger said Oct 3"). */
export function loggerDateLabel(raw: string | undefined, hwReg?: string): string | null {
  const p = parseLoggerDate(raw, hwReg)
  if (!p) return null
  const d = new Date(Date.UTC(p.ymd.y, p.ymd.m - 1, p.ymd.d, 12))
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(d)
}

/** Datetime-local input value ('YYYY-MM-DDTHH:mm') in a zone ↔ UTC ISO. */
export function toLocalInput(utcIso: string, tz: string): string {
  const p = localParts(utcIso, tz)
  return `${p.ymd}T${p.hhmm}`
}

export function fromLocalInput(v: string, tz: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v)
  if (!m) return null
  const r = wallClockToUtc({ y: +m[1], m: +m[2], d: +m[3] }, { h: +m[4], mi: +m[5], s: 0 }, tz)
  return new Date(r.utcMs).toISOString()
}
