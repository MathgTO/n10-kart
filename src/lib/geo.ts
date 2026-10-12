/** Small geodesy helpers (WGS-84). No dependencies. */

export type LatLon = { lat: number; lon: number }

/** ECEF metres → WGS-84 lat/lon (degrees), closed form (Bowring). */
export function ecefToLatLon(x: number, y: number, z: number): LatLon & { alt: number } {
  const a = 6378137.0
  const e2 = 6.69437999014e-3
  const b = a * Math.sqrt(1 - e2)
  const ep2 = (a * a - b * b) / (b * b)
  const p = Math.hypot(x, y)
  const th = Math.atan2(z * a, p * b)
  const lon = Math.atan2(y, x)
  const lat = Math.atan2(z + ep2 * b * Math.sin(th) ** 3, p - e2 * a * Math.cos(th) ** 3)
  const N = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2)
  const alt = p / Math.cos(lat) - N
  return { lat: (lat * 180) / Math.PI, lon: (lon * 180) / Math.PI, alt }
}

/** Great-circle distance in metres. */
export function distanceM(a: LatLon, b: LatLon): number {
  const R = 6371008.8
  const toRad = Math.PI / 180
  const dLat = (b.lat - a.lat) * toRad
  const dLon = (b.lon - a.lon) * toRad
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

/** Signed polygon area (m², local tangent plane). > 0 = counter-clockwise. */
export function signedAreaM2(pts: LatLon[]): number {
  if (pts.length < 3) return 0
  const lat0 = pts[0].lat
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180)
  const ky = 111320
  let A = 0
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    const q = pts[(i + 1) % pts.length]
    const x1 = (p.lon - pts[0].lon) * kx
    const y1 = (p.lat - lat0) * ky
    const x2 = (q.lon - pts[0].lon) * kx
    const y2 = (q.lat - lat0) * ky
    A += x1 * y2 - x2 * y1
  }
  return A / 2
}

export function median(xs: number[]): number {
  if (!xs.length) return NaN
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
