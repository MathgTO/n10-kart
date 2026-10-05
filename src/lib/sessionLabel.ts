/**
 * Canonical session label, used everywhere (list, setup header, report header, voice header, share):
 *   '{Track} · {Layout} · {Sun Oct 4} · {15:01 EDT} · R{n}'
 * R{n} is computed at display time: order of the same driver's sessions at that track on that local day
 * (track zone). The zone tag is always shown (decision: travel-safe and unambiguous).
 * Never uses file names, mtime or upload time.
 */
import { getLayoutInfo, getTrack } from '@/data/tracks'
import { deviceZone, localParts, wallClockToUtc } from './sessionTime'
import type { StoredSession } from './types'

/** Session start (UTC ISO). Legacy sessions with only a local recordedAt are interpreted in their zone. */
export function sessionStartUtc(s: StoredSession): string | undefined {
  if (s.startUtc) return s.startUtc
  if (s.recordedAt) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(s.recordedAt)
    if (m) {
      const tz = sessionZone(s)
      const r = wallClockToUtc({ y: +m[1], m: +m[2], d: +m[3] }, { h: +m[4], mi: +m[5], s: m[6] ? +m[6] : 0 }, tz)
      return new Date(r.utcMs).toISOString()
    }
  }
  // Demo sessions carry a fixed illustrative timestamp.
  if (s.isDemo) return s.createdAt
  return undefined
}

export function sessionZone(s: StoredSession): string {
  return s.timeZone ?? getTrack(s.trackId).tz ?? deviceZone()
}

export function sessionLocal(s: StoredSession) {
  const iso = sessionStartUtc(s)
  return iso ? localParts(iso, sessionZone(s)) : null
}

/** Same driver + same track + same local calendar day → round number by start time (1-based). */
export function roundNumber(s: StoredSession, all: StoredSession[]): number | null {
  const me = sessionLocal(s)
  if (!me) return null
  const peers = all
    .filter((x) => x.trackId === s.trackId && (x.driverId ?? '') === (s.driverId ?? '') && !!x.isDemo === !!s.isDemo)
    .map((x) => ({ x, l: sessionLocal(x), t: sessionStartUtc(x) }))
    .filter((p) => p.l && p.l.ymd === me.ymd && p.t)
    .sort((a, b) => a.t!.localeCompare(b.t!) || a.x.id.localeCompare(b.x.id))
  const i = peers.findIndex((p) => p.x.id === s.id)
  return i >= 0 ? i + 1 : null
}

export interface LabelParts {
  track: string
  layout?: string
  day?: string // 'Sun Oct 4' (+ year when not current)
  time?: string // '15:01 EDT'
  round?: number | null
  unverified?: boolean
}

export function labelParts(s: StoredSession, all: StoredSession[]): LabelParts {
  const track = getTrack(s.trackId)
  const layout = getLayoutInfo(track, s.layoutId)
  const l = sessionLocal(s)
  const yearNow = new Date().getFullYear()
  return {
    track: track.short,
    layout: layout?.name,
    day: l ? `${l.weekdayShort} ${l.monthShort} ${l.day}${l.year !== yearNow ? ` ${l.year}` : ''}` : undefined,
    time: l ? `${l.hhmm} ${l.zone}` : undefined,
    round: roundNumber(s, all),
    unverified: s.dateSource !== 'gps' && !s.isDemo,
  }
}

export function canonicalLabel(s: StoredSession, all: StoredSession[]): string {
  const p = labelParts(s, all)
  return [p.track, p.layout, p.day ?? 'Date unknown', p.time, p.round ? `R${p.round}` : undefined].filter(Boolean).join(' · ')
}

/** 'Sunday Oct 4 · Mosport' */
export function dayHeader(s: StoredSession): string {
  const l = sessionLocal(s)
  const track = getTrack(s.trackId)
  if (!l) return `Date unknown · ${track.short}`
  const yearNow = new Date().getFullYear()
  return `${l.weekdayLong} ${l.monthShort} ${l.day}${l.year !== yearNow ? ` ${l.year}` : ''} · ${track.short}`
}

/** Short date for share copy ('Oct 4'). */
export function shortDate(s: StoredSession): string {
  const l = sessionLocal(s)
  return l ? `${l.monthShort} ${l.day}` : ''
}
