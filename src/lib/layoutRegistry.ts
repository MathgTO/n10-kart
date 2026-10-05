/**
 * Local GPS-layout registry (MyChron identity → sequential / renamed labels).
 *
 * On first sight of a layoutKey: assign Layout N and persist.
 * On later uploads of the same layoutKey: reuse displayName (Layout N or driver rename).
 * Stock Mosport names (GP/National/…) are never the user-facing label.
 */
import { getTrack } from '@/data/tracks'
import type { StoredSession, TrackDetection, TrackLayoutInfo } from './types'

const STORAGE_KEY = 'n10-kart-layouts-v1'

export type LayoutRecord = {
  /** Stable id used on StoredSession.layoutId (e.g. L1). */
  id: string
  /** Stable MyChron/GPS layout identity within a track. */
  layoutKey: string
  seq: number
  /** UI / PDF / TrackMap label — defaults to `Layout ${seq}`; rename persists forever for this key. */
  displayName: string
  firstSeenAt: string
  lengthM?: number
  direction?: 'ccw' | 'cw'
  /** Map-drawing hint only (stock geometry id) — never shown as the label. */
  geometryId?: string
}

/** Per-track bucket: layouts + monotonic counter (numbers never reused after rename). */
type TrackBucket = { layouts: LayoutRecord[]; nextSeq: number }
type Store = Record<string, TrackBucket | LayoutRecord[]> // LayoutRecord[] = legacy shape

function normalizeBucket(raw: TrackBucket | LayoutRecord[] | undefined): TrackBucket {
  if (!raw) return { layouts: [], nextSeq: 1 }
  if (Array.isArray(raw)) {
    const layouts = raw.map(migrateRec)
    const maxSeq = layouts.reduce((m, r) => Math.max(m, r.seq), 0)
    return { layouts, nextSeq: maxSeq + 1 }
  }
  const layouts = (raw.layouts ?? []).map(migrateRec)
  const maxSeq = layouts.reduce((m, r) => Math.max(m, r.seq), 0)
  const nextSeq = Math.max(raw.nextSeq ?? 1, maxSeq + 1)
  return { layouts, nextSeq }
}

function migrateRec(r: LayoutRecord & { signature?: string }): LayoutRecord {
  const any = r as LayoutRecord & { signature?: string }
  let out: LayoutRecord = any
  if (!any.layoutKey && any.signature) {
    const { signature: _s, ...rest } = any
    out = { ...rest, layoutKey: any.signature, firstSeenAt: any.firstSeenAt ?? new Date().toISOString() }
  }
  if (!out.firstSeenAt) out = { ...out, firstSeenAt: new Date().toISOString() }
  return out
}

function loadStore(): Record<string, TrackBucket> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Store
    const out: Record<string, TrackBucket> = {}
    for (const tid of Object.keys(parsed)) out[tid] = normalizeBucket(parsed[tid])
    return out
  } catch {
    return {}
  }
}

function saveStore(store: Record<string, TrackBucket>): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* quota / private mode */
  }
}

function listFor(trackId: string): LayoutRecord[] {
  return loadStore()[trackId]?.layouts ?? []
}

function writeFor(trackId: string, list: LayoutRecord[], nextSeq?: number): void {
  const store = loadStore()
  const prev = store[trackId] ?? { layouts: [], nextSeq: 1 }
  const maxSeq = list.reduce((m, r) => Math.max(m, r.seq), 0)
  store[trackId] = {
    layouts: list,
    // Monotonic: never go backwards — rename/delete must not free a number
    nextSeq: Math.max(nextSeq ?? prev.nextSeq, maxSeq + 1, prev.nextSeq),
  }
  saveStore(store)
}

/**
 * Build a stable layoutKey from MyChron GPS identity.
 * Prefer measured lap length + direction (the physical layout signature in the file).
 * When detect already snapped to a stock geometry length band, pin to that length/dir for stability.
 */
export function layoutKeyFromGps(opts: {
  lengthM?: number | null
  direction?: 'ccw' | 'cw' | null
  geometryId?: string | null
  trackId?: string
}): string | null {
  const dir = opts.direction === 'cw' || opts.direction === 'ccw' ? opts.direction : null
  if (opts.geometryId && opts.trackId) {
    const t = getTrack(opts.trackId)
    const g = t.layouts?.find((l) => l.id === opts.geometryId)
    if (g) return `${opts.trackId}|len:${Math.round(g.lengthM)}|dir:${g.direction}`
  }
  if (opts.lengthM == null || !Number.isFinite(opts.lengthM) || opts.lengthM <= 0) return null
  if (!opts.trackId) return null
  const bucket = Math.round(opts.lengthM / 5) * 5
  return `${opts.trackId}|len:${bucket}|dir:${dir ?? 'unk'}`
}

/** @deprecated alias — prefer layoutKeyFromGps */
export const layoutSignature = layoutKeyFromGps

/** Allocate next unused Layout N — numbers are never recycled. */
function allocateSeq(trackId: string): number {
  const store = loadStore()
  const bucket = store[trackId] ?? { layouts: [], nextSeq: 1 }
  const maxSeq = bucket.layouts.reduce((m, r) => Math.max(m, r.seq), 0)
  return Math.max(bucket.nextSeq, maxSeq + 1, 1)
}

function ensureByKey(trackId: string, layoutKey: string, seed?: Partial<LayoutRecord>): LayoutRecord {
  const list = listFor(trackId)
  const hit = list.find((r) => r.layoutKey === layoutKey)
  if (hit) return hit
  const seq = allocateSeq(trackId)
  const rec: LayoutRecord = {
    id: `L${seq}`,
    layoutKey,
    seq,
    displayName: seed?.displayName ?? `Layout ${seq}`,
    firstSeenAt: seed?.firstSeenAt ?? new Date().toISOString(),
    lengthM: seed?.lengthM,
    direction: seed?.direction,
    geometryId: seed?.geometryId,
  }
  // Persist and bump counter past this seq so rename never frees it
  writeFor(trackId, [...list, rec], seq + 1)
  return rec
}

/** Resolve or create Layout N from GPS detection. Null → Layout? / Config unconfirmed. */
export function resolveFromDetection(
  trackId: string,
  detection?: { layoutId?: string | null; lapLengthM?: number; direction?: 'ccw' | 'cw'; confidence?: string } | null,
): LayoutRecord | null {
  if (!trackId || trackId === 'other') return null
  const geometryId = detection?.layoutId ?? null
  const key = layoutKeyFromGps({
    trackId,
    geometryId,
    lengthM: detection?.lapLengthM,
    direction: detection?.direction,
  })
  if (!key) return null
  // No usable GPS layout identity on a weak detect → leave unconfirmed
  if (!geometryId && detection?.lapLengthM == null) return null
  if (!geometryId && (detection?.confidence === 'low' || detection?.confidence === 'none') && detection?.lapLengthM == null) {
    return null
  }
  const track = getTrack(trackId)
  const geo = geometryId ? track.layouts?.find((l) => l.id === geometryId) : undefined
  return ensureByKey(trackId, key, {
    lengthM: geo?.lengthM ?? detection?.lapLengthM ?? undefined,
    direction: geo?.direction ?? detection?.direction ?? undefined,
    geometryId: geometryId ?? undefined,
  })
}

export function lastUsedLayout(trackId: string, sessions: StoredSession[]): LayoutRecord | null {
  const ordered = [...sessions]
    .filter((s) => s.trackId === trackId && s.layoutId)
    .sort((a, b) => (b.startUtc ?? b.createdAt).localeCompare(a.startUtc ?? a.createdAt))
  for (const s of ordered) {
    const r = getById(trackId, s.layoutId)
    if (r) return r
  }
  return null
}

export function getById(trackId: string, layoutId?: string | null): LayoutRecord | null {
  if (!layoutId) return null
  const list = listFor(trackId)
  const hit = list.find((r) => r.id === layoutId || r.layoutKey === layoutId)
  if (hit) return hit
  return promoteLegacy(trackId, layoutId)
}

function promoteLegacy(trackId: string, layoutId: string): LayoutRecord | null {
  const track = getTrack(trackId)
  const stock = track.layouts?.find((l) => l.id === layoutId)
  if (!stock) return null
  const key = layoutKeyFromGps({
    trackId,
    geometryId: stock.id,
    lengthM: stock.lengthM,
    direction: stock.direction,
  })
  if (!key) return null
  return ensureByKey(trackId, key, {
    lengthM: stock.lengthM,
    direction: stock.direction,
    geometryId: stock.id,
  })
}

export function listLayouts(trackId: string): LayoutRecord[] {
  return [...listFor(trackId)].sort((a, b) => a.seq - b.seq)
}

/** Permanently rename this GPS layout identity's displayName. */
export function renameLayout(trackId: string, layoutId: string, name: string): LayoutRecord | null {
  const trimmed = name.trim()
  if (!trimmed) return null
  let list = listFor(trackId)
  let i = list.findIndex((r) => r.id === layoutId || r.layoutKey === layoutId)
  if (i < 0) {
    const promoted = promoteLegacy(trackId, layoutId)
    if (!promoted) return null
    list = listFor(trackId)
    i = list.findIndex((r) => r.id === promoted.id)
    if (i < 0) return null
  }
  const next = { ...list[i], displayName: trimmed }
  const out = [...list]
  out[i] = next
  writeFor(trackId, out)
  return next
}

/** Free-typed new layout (no GPS key yet) — next seq, renamed immediately. */
export function createNamedLayout(trackId: string, name: string, seed?: Partial<LayoutRecord>): LayoutRecord {
  const trimmed = name.trim()
  const list = listFor(trackId)
  if (trimmed) {
    const existing = list.find((r) => r.displayName.toLowerCase() === trimmed.toLowerCase())
    if (existing) return existing
  }
  const seq = allocateSeq(trackId)
  const displayName = trimmed || `Layout ${seq}`
  const layoutKey = seed?.layoutKey ?? `${trackId}|custom:${Date.now().toString(36)}`
  const rec: LayoutRecord = {
    id: `L${seq}`,
    layoutKey,
    seq,
    displayName,
    firstSeenAt: new Date().toISOString(),
    lengthM: seed?.lengthM,
    direction: seed?.direction,
    geometryId: seed?.geometryId,
  }
  writeFor(trackId, [...list, rec], seq + 1)
  return rec
}

export function layoutDisplayName(
  trackId: string | undefined | null,
  layoutId?: string | null,
  opts?: { includeDirection?: boolean },
): string {
  if (!trackId) return 'Layout?'
  const rec = getById(trackId, layoutId)
  if (!rec) return 'Layout?'
  let label = rec.displayName
  if (opts?.includeDirection !== false && rec.direction === 'cw') {
    const already = /\bcw\b/i.test(label) || /reverse/i.test(label)
    if (!already) label = `${label} · CW`
  }
  return label
}

export function geometryIdFor(trackId: string, layoutId?: string | null): string | undefined {
  const rec = getById(trackId, layoutId)
  if (rec?.geometryId) return rec.geometryId
  const track = getTrack(trackId)
  if (track.layouts?.some((l) => l.id === layoutId)) return layoutId ?? undefined
  if (!rec?.lengthM) return track.layouts?.[0]?.id
  const layouts = track.layouts ?? []
  if (!layouts.length) return undefined
  let pool = rec.direction ? layouts.filter((l) => l.direction === rec.direction) : layouts
  if (!pool.length) pool = layouts
  const ranked = pool
    .map((l) => ({ l, err: Math.abs(rec.lengthM! / l.lengthM - 1) }))
    .sort((a, b) => a.err - b.err)
  return ranked[0]?.l.id
}

export function layoutLengthHint(trackId: string, layoutId?: string | null): string | undefined {
  const rec = getById(trackId, layoutId)
  if (rec?.lengthM && rec.lengthM > 0) return `~${Math.round(rec.lengthM)} m`
  return undefined
}

export function stockLayouts(trackId: string): TrackLayoutInfo[] {
  return getTrack(trackId).layouts ?? []
}
