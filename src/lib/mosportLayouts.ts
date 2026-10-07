/** App-side Mosport Karting Centre layouts (geometry lives here — not in the rubric). */

export type Seg =
  | { kind: 'straight'; len: number }
  | { kind: 'arc'; radius: number; deg: number }

export type Pt = { x: number; y: number }

export type LayoutCorner = {
  id: string
  name: string
  dist: number
  type: 'kink' | 'medium' | 'hairpin' | 'sweeper' | 'chicane'
}

export type TrackLayout = {
  id: string
  name: string
  shortName: string
  blurb: string
  path: Pt[]
  cum: number[]
  length: number
  corners: LayoutCorner[]
  sectors: number[]
}

function pathLength(pts: Pt[]): number {
  let t = 0
  for (let i = 1; i < pts.length; i++) {
    t += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  }
  return t
}

function cumDist(pts: Pt[]): number[] {
  const t = [0]
  for (let i = 1; i < pts.length; i++) {
    t.push(t[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
  }
  return t
}

function buildRaw(segs: Seg[]): Pt[] {
  let x = 0
  let y = 0
  let heading = 0
  const pts: Pt[] = [{ x, y }]
  for (const seg of segs) {
    if (seg.kind === 'straight') {
      const steps = Math.max(6, Math.round(seg.len / 3))
      const step = seg.len / steps
      for (let i = 0; i < steps; i++) {
        x += step * Math.cos(heading)
        y += step * Math.sin(heading)
        pts.push({ x, y })
      }
    } else {
      const sign = Math.sign(seg.deg) || 1
      const sweep = (Math.abs(seg.deg) * Math.PI) / 180
      const arcLen = seg.radius * sweep
      const steps = Math.max(10, Math.round(arcLen / 2.4))
      const dH = (sign * sweep) / steps
      const step = arcLen / steps
      for (let i = 0; i < steps; i++) {
        heading += dH
        x += step * Math.cos(heading)
        y += step * Math.sin(heading)
        pts.push({ x, y })
      }
    }
  }
  const a = pts[0]
  const b = pts[pts.length - 1]
  const gap = Math.hypot(a.x - b.x, a.y - b.y)
  if (gap > 1) {
    const steps = Math.max(4, Math.round(gap / 3))
    for (let i = 1; i <= steps; i++) {
      const u = i / steps
      pts.push({ x: b.x + (a.x - b.x) * u, y: b.y + (a.y - b.y) * u })
    }
  }
  return pts
}

function scaleTo(pts: Pt[], targetLen: number): Pt[] {
  const n = targetLen / pathLength(pts)
  return pts.map((p) => ({ x: p.x * n, y: p.y * n }))
}

function rotateStartForward(pts: Pt[]): Pt[] {
  const a = pts[0]
  const b = pts[Math.min(40, pts.length - 1)]
  const ang = Math.atan2(b.y - a.y, b.x - a.x)
  const c = Math.cos(-ang)
  const s = Math.sin(-ang)
  return pts.map((p) => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c }))
}

function fromSegs(segs: Seg[], targetLen: number): { path: Pt[]; cum: number[]; length: number } {
  const path = rotateStartForward(scaleTo(buildRaw(segs), targetLen))
  const cum = cumDist(path)
  return { path, cum, length: cum[cum.length - 1] ?? targetLen }
}

function makeLayout(
  id: string,
  name: string,
  shortName: string,
  blurb: string,
  segs: Seg[],
  targetLen: number,
  corners: LayoutCorner[],
  sectorFracs: number[],
): TrackLayout {
  const geo = fromSegs(segs, targetLen)
  return {
    id,
    name,
    shortName,
    blurb,
    ...geo,
    corners,
    sectors: sectorFracs.map((f) => f * geo.length),
  }
}

function reverseLayout(layout: TrackLayout): TrackLayout {
  const path = layout.path.slice().reverse()
  const cum = cumDist(path)
  const length = cum[cum.length - 1] ?? layout.length
  const corners = layout.corners
    .map((c) => ({ ...c, dist: Math.max(0, length - c.dist) }))
    .sort((a, b) => a.dist - b.dist)
  const sectors = layout.sectors.map((s) => length - s).sort((a, b) => a - b)
  return {
    ...layout,
    id: 'reverse',
    name: 'Grand Prix reverse',
    shortName: 'GP reverse',
    blurb: 'Full GP, opposite direction.',
    path,
    cum,
    length,
    corners,
    sectors,
  }
}

const GP: Seg[] = [
  { kind: 'straight', len: 198 },
  { kind: 'arc', radius: 26, deg: -36 },
  { kind: 'straight', len: 42 },
  { kind: 'arc', radius: 17, deg: -78 },
  { kind: 'straight', len: 38 },
  { kind: 'arc', radius: 20, deg: 48 },
  { kind: 'straight', len: 58 },
  { kind: 'arc', radius: 8.4, deg: -198 },
  { kind: 'straight', len: 20 },
  { kind: 'arc', radius: 9.2, deg: 204 },
  { kind: 'straight', len: 36 },
  { kind: 'arc', radius: 13.5, deg: -92 },
  { kind: 'straight', len: 26 },
  { kind: 'arc', radius: 15, deg: -82 },
  { kind: 'straight', len: 28 },
  { kind: 'arc', radius: 19, deg: 62 },
  { kind: 'straight', len: 16 },
  { kind: 'arc', radius: 30, deg: 108 },
  { kind: 'straight', len: 44 },
  { kind: 'arc', radius: 16, deg: -76 },
  { kind: 'straight', len: 22 },
  { kind: 'arc', radius: 10, deg: 96 },
  { kind: 'straight', len: 14 },
  { kind: 'arc', radius: 9.4, deg: -118 },
  { kind: 'straight', len: 48 },
]

const SHORT: Seg[] = [
  { kind: 'straight', len: 160 },
  { kind: 'arc', radius: 22, deg: -42 },
  { kind: 'straight', len: 36 },
  { kind: 'arc', radius: 16, deg: -88 },
  { kind: 'straight', len: 48 },
  { kind: 'arc', radius: 8.2, deg: -205 },
  { kind: 'straight', len: 18 },
  { kind: 'arc', radius: 9, deg: 198 },
  { kind: 'straight', len: 40 },
  { kind: 'arc', radius: 14, deg: -96 },
  { kind: 'straight', len: 52 },
  { kind: 'arc', radius: 11, deg: -110 },
  { kind: 'straight', len: 70 },
]

const NATIONAL: Seg[] = [
  { kind: 'straight', len: 172 },
  { kind: 'arc', radius: 24, deg: -32 },
  { kind: 'straight', len: 38 },
  { kind: 'arc', radius: 16, deg: -84 },
  { kind: 'straight', len: 34 },
  { kind: 'arc', radius: 18, deg: 40 },
  { kind: 'straight', len: 50 },
  { kind: 'arc', radius: 9, deg: -188 },
  { kind: 'straight', len: 18 },
  { kind: 'arc', radius: 10, deg: 176 },
  { kind: 'straight', len: 44 },
  { kind: 'arc', radius: 22, deg: 96 },
  { kind: 'straight', len: 36 },
  { kind: 'arc', radius: 14, deg: -82 },
  { kind: 'straight', len: 20 },
  { kind: 'arc', radius: 9.6, deg: 92 },
  { kind: 'straight', len: 16 },
  { kind: 'arc', radius: 10, deg: -124 },
  { kind: 'straight', len: 54 },
]

const CLUB: Seg[] = [
  { kind: 'straight', len: 186 },
  { kind: 'arc', radius: 25, deg: -40 },
  { kind: 'straight', len: 48 },
  { kind: 'arc', radius: 18, deg: -96 },
  { kind: 'straight', len: 62 },
  { kind: 'arc', radius: 14, deg: -102 },
  { kind: 'straight', len: 30 },
  { kind: 'arc', radius: 16, deg: 88 },
  { kind: 'straight', len: 40 },
  { kind: 'arc', radius: 28, deg: 118 },
  { kind: 'straight', len: 36 },
  { kind: 'arc', radius: 12, deg: -108 },
  { kind: 'straight', len: 58 },
]

/**
 * GP length recalibrated from real GPS laps (Sep 26 / Oct 4 2026 MyChron files: 1308–1323 m, median ≈1312 m).
 * The original synthetic geometry was drawn at 1384 m; corner distances are scaled by the same factor.
 * The geometry itself is still not georeferenced (shape is illustrative).
 */
export const GP_MEASURED_M = 1312
const GP_SCALE = GP_MEASURED_M / 1384
const g = (d: number) => Math.round(d * GP_SCALE)

const gp = makeLayout(
  'gp',
  'Grand Prix (full)',
  'GP full',
  'MIKA long circuit · ~1.31 km (GPS-measured) · 12 corners',
  GP,
  GP_MEASURED_M,
  [
    { id: 't1', name: 'T1 Kink', dist: g(210), type: 'kink' },
    { id: 't2', name: 'T2 Crest', dist: g(290), type: 'medium' },
    { id: 't3', name: 'T3 Downhill', dist: g(370), type: 'medium' },
    { id: 't4', name: 'T4 Hairpin', dist: g(470), type: 'hairpin' },
    { id: 't5', name: 'T5 Uphill Hairpin', dist: g(530), type: 'hairpin' },
    { id: 't6', name: 'T6', dist: g(610), type: 'medium' },
    { id: 't7', name: 'T7', dist: g(680), type: 'medium' },
    { id: 't8', name: 'T8', dist: g(740), type: 'medium' },
    { id: 't9', name: 'T9 Sweep', dist: g(860), type: 'sweeper' },
    { id: 't10', name: 'T10', dist: g(980), type: 'medium' },
    { id: 't11', name: 'T11 Esses', dist: g(1060), type: 'chicane' },
    { id: 't12', name: 'T12 Last', dist: g(1140), type: 'hairpin' },
  ],
  [0, 0.245, 0.426, 0.679, 1],
)

export const MOSPORT_LAYOUTS: TrackLayout[] = [
  gp,
  makeLayout(
    'short',
    'Short',
    'Short',
    'Cuts the back sweeper · ~0.92 km',
    SHORT,
    920,
    [
      { id: 't1', name: 'T1 Kink', dist: 175, type: 'kink' },
      { id: 't2', name: 'T2 Crest', dist: 250, type: 'medium' },
      { id: 't3', name: 'T3 Hairpin', dist: 360, type: 'hairpin' },
      { id: 't4', name: 'T4 Uphill', dist: 430, type: 'hairpin' },
      { id: 't5', name: 'T5', dist: 540, type: 'medium' },
      { id: 't6', name: 'T6 Last', dist: 740, type: 'hairpin' },
    ],
    [0, 0.3, 0.52, 0.76, 1],
  ),
  makeLayout(
    'national',
    'National',
    'National',
    'No double hairpin · ~1.21 km',
    NATIONAL,
    1210,
    [
      { id: 't1', name: 'T1 Kink', dist: 185, type: 'kink' },
      { id: 't2', name: 'T2 Crest', dist: 260, type: 'medium' },
      { id: 't3', name: 'T3 Downhill', dist: 340, type: 'medium' },
      { id: 't4', name: 'T4 Hairpin', dist: 450, type: 'hairpin' },
      { id: 't5', name: 'T5', dist: 560, type: 'medium' },
      { id: 't6', name: 'T6 Sweep', dist: 720, type: 'sweeper' },
      { id: 't7', name: 'T7 Esses', dist: 900, type: 'chicane' },
      { id: 't8', name: 'T8 Last', dist: 1000, type: 'hairpin' },
    ],
    [0, 0.28, 0.5, 0.74, 1],
  ),
  makeLayout(
    'club',
    'Club',
    'Club',
    'Arrive & drive / club days · ~1.05 km',
    CLUB,
    1050,
    [
      { id: 't1', name: 'T1', dist: 200, type: 'kink' },
      { id: 't2', name: 'T2', dist: 300, type: 'medium' },
      { id: 't3', name: 'T3 Hairpin', dist: 430, type: 'hairpin' },
      { id: 't4', name: 'T4', dist: 560, type: 'medium' },
      { id: 't5', name: 'T5 Sweep', dist: 720, type: 'sweeper' },
      { id: 't6', name: 'T6 Last', dist: 880, type: 'hairpin' },
    ],
    [0, 0.29, 0.53, 0.77, 1],
  ),
  reverseLayout(gp),
]

export function getLayout(id: string): TrackLayout {
  return MOSPORT_LAYOUTS.find((l) => l.id === id) ?? gp
}

/** Point on path at distance along the lap. */
export function pointAt(layout: TrackLayout, dist: number): Pt {
  const { path, cum, length } = layout
  if (path.length === 0) return { x: 0, y: 0 }
  const d = ((dist % length) + length) % length
  let lo = 0
  let hi = cum.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] <= d) lo = mid
    else hi = mid
  }
  const span = cum[hi] - cum[lo]
  const u = span === 0 ? 0 : (d - cum[lo]) / span
  return {
    x: path[lo].x + (path[hi].x - path[lo].x) * u,
    y: path[lo].y + (path[hi].y - path[lo].y) * u,
  }
}

/** SVG path fragment for the lap between two distances (meters along layout). */
export function pathSlice(layout: TrackLayout, d0: number, d1: number): string {
  const { path, cum, length } = layout
  if (path.length < 2 || length <= 0) return ''
  const a = Math.max(0, Math.min(length, d0))
  const b = Math.max(0, Math.min(length, d1))
  if (b <= a) return ''
  const pts: Pt[] = [pointAt(layout, a)]
  for (let i = 0; i < cum.length; i++) {
    if (cum[i] > a && cum[i] < b) pts.push(path[i])
  }
  pts.push(pointAt(layout, b))
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
}

/** Which layout corners fall inside a sector by distance. */
export function cornersInSectorRange(layout: TrackLayout, d0: number, d1: number): LayoutCorner[] {
  return layout.corners.filter((c) => c.dist >= d0 && c.dist < d1 - 1e-6)
}
