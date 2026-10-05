/**
 * GPS track auto-detect (track-autodetect.md §5).
 * Inputs: AiM TRK name + S/F (last non-empty block), GPS moving centroid, extent, flying-lap length, direction.
 * Score: S/F ≤300 m +60 · centroid ≤500 m +50 / ≤1.5 km +30 / ≤3 km +10 · name alias +40 / fuzzy +25 ·
 * name matches but GPS >5 km away −50 (GPS wins). Plausibility: extent ≤600 m and lap ≤2.5 km (rejects car circuits).
 * Confidence: high ≥90 (auto-select + chip) · medium 50–89 (preselect, ask) · low <50 (picker, nearest first) ·
 * none = no candidate within 3 km (offer "New track").
 */
import { allTracks } from '@/data/tracks'
import { distanceM } from './geo'
import type { FileMeta, TrackDetection, TrackInfo } from './types'

function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bcenter\b/g, 'centre')
    .replace(/\bkartways?\b/g, 'kartway')
    .replace(/\b(karting|circuit|raceway|kart|club|park|motorsports?|complex)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function bigrams(s: string): Set<string> {
  const out = new Set<string>()
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2))
  return out
}

/** Dice coefficient on character bigrams (0..1). */
export function fuzzy(a: string, b: string): number {
  const A = bigrams(norm(a))
  const B = bigrams(norm(b))
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  return (2 * inter) / (A.size + B.size)
}

function nameScore(name: string, t: TrackInfo): number {
  const n = norm(name)
  if (!n) return 0
  const exact = [t.name, ...(t.aliases ?? []), ...(t.aimNames ?? [])].some((x) => norm(x) === n)
  if (exact) return 40
  const best = Math.max(...[t.name, ...(t.aliases ?? []), ...(t.aimNames ?? [])].map((x) => fuzzy(x, name)))
  return best >= 0.85 ? 25 : 0
}

export interface DetectInput {
  trkName?: string
  sf?: { lat: number; lon: number }
  centroid?: { lat: number; lon: number }
  extentM?: number
  lapLengthM?: number
  direction?: 'ccw' | 'cw'
}

export function detectInputFromMeta(meta?: FileMeta): DetectInput {
  return {
    trkName: meta?.trkName,
    sf: meta?.sf,
    centroid: meta?.gps?.centroid,
    extentM: meta?.gps?.extentM,
    lapLengthM: meta?.gps?.lapLengthM,
    direction: meta?.gps?.direction,
  }
}

/** Pick the layout by direction, then lap length (±4 %). */
export function pickLayout(t: TrackInfo, lapLengthM?: number, direction?: 'ccw' | 'cw'): string | null {
  const layouts = t.layouts ?? []
  if (!layouts.length) return null
  let pool = direction ? layouts.filter((l) => l.direction === direction) : layouts
  if (!pool.length) pool = layouts
  if (lapLengthM == null) return pool[0].id
  const ranked = pool
    .map((l) => ({ l, err: Math.abs(lapLengthM / l.lengthM - 1) }))
    .sort((a, b) => a.err - b.err)
  return ranked[0].err <= 0.04 ? ranked[0].l.id : null
}

export function detectTrack(input: DetectInput, tracks: TrackInfo[] = allTracks()): TrackDetection {
  const gpsPoint = input.centroid
  const plausibleKart = (input.extentM == null || input.extentM <= 600) && (input.lapLengthM == null || input.lapLengthM <= 2500)
  const scored = tracks
    .filter((t) => t.id !== 'other')
    .map((t) => {
      let score = 0
      const reasons: string[] = []
      const here = t.lat != null && t.lon != null ? { lat: t.lat, lon: t.lon } : null
      if (input.sf && here) {
        const sfNear = [here, ...(t.sf ?? [])].some((p) => distanceM(p, input.sf!) <= 300)
        if (sfNear) {
          score += 60
          reasons.push('S/F')
        }
      }
      let dist: number | null = null
      if (gpsPoint && here) {
        dist = distanceM(gpsPoint, here)
        const r = Math.max(500, t.radiusM ?? 500)
        if (plausibleKart) {
          if (dist <= r) score += 50
          else if (dist <= 1500) score += 30
          else if (dist <= 3000) score += 10
        }
        if (dist <= 3000) reasons.push('GPS')
      }
      const ns = input.trkName ? nameScore(input.trkName, t) : 0
      if (ns) {
        score += ns
        reasons.push('name')
        if (gpsPoint && dist != null && dist > 5000) {
          score -= 50 + ns
          reasons.push('name/GPS disagree')
        }
      }
      return { t, score, dist, reasons }
    })
    .sort((a, b) => b.score - a.score)

  const nearby = scored
    .filter((s) => s.dist != null)
    .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0))
    .slice(0, 5)
    .map((s) => ({ trackId: s.t.id, distanceM: Math.round(s.dist!) }))

  const top = scored[0]
  const base = {
    trkName: input.trkName,
    centroid: gpsPoint,
    lapLengthM: input.lapLengthM,
    direction: input.direction,
    nearby,
  }
  if (!top || top.score <= 0) {
    const anyNear = nearby.some((n) => n.distanceM <= 3000)
    return {
      ...base,
      trackId: null,
      layoutId: null,
      confidence: gpsPoint && !anyNear ? 'none' : 'low',
      score: 0,
      reason: gpsPoint ? 'No known track near the GPS position' : 'No GPS fix or track name',
    }
  }
  let confidence: TrackDetection['confidence'] = top.score >= 90 ? 'high' : top.score >= 50 ? 'medium' : 'low'
  // Two venues within 15 points → ask.
  const second = scored[1]
  if (confidence === 'high' && second && top.score - second.score < 15) confidence = 'medium'
  const layoutId = pickLayout(top.t, input.lapLengthM, input.direction)
  // A known venue with no layout fitting the measured lap → keep venue, ask about the layout.
  // Do NOT invent layouts[0] — unknown layout stays null (UI shows Layout?).
  if (confidence === 'high' && top.t.layouts?.length && layoutId == null) confidence = 'medium'
  return {
    ...base,
    trackId: top.t.id,
    layoutId, // geometry hint only; display names come from layoutRegistry (Layout N)
    confidence,
    score: top.score,
    reason: top.reasons.join(' + ') || 'name',
  }
}
