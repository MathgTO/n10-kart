/**
 * Real MyChron sessions bundled in public/samples (Mosport Karting Centre).
 * Used by "Try a real Mosport session" so anyone without a MyChron can see a real .xrk parsed
 * in the browser. Served from the site (BASE_URL-relative).
 */
export interface BundledSample {
  file: string
  /** Picker label; also the session title (displayName = label + .xrk). */
  label: string
  /** Name given to the imported File (becomes the session title; keep the .xrk extension). */
  displayName: string
  /** Short context shown under the label. */
  note: string
  trackId: string
  /** Real sprockets run that session (owner-confirmed). Front unknown → app default. */
  gearing: { rearTeeth: number; frontTeeth?: number }
}

const sample = (file: string, label: string, note: string, rearTeeth: number): BundledSample => ({
  file,
  label,
  displayName: `${label}.xrk`,
  note,
  trackId: 'mosport',
  gearing: { rearTeeth },
})

/** Newest first. */
export const REAL_SAMPLES: BundledSample[] = [
  sample('2026-10-03_mosport_150240_best-110909.xrk', 'Mosport · Oct 3 2026 · 15:02', 'Best 1:10.909 · 69T rear (was 67T) · GPS speed', 69),
  sample('2026-09-25_mosport_163712_best-108294.xrk', 'Mosport · Sep 25 2026 · 16:37', 'Best 1:08.294 · 67T rear', 67),
  sample('2026-09-25_mosport_143726_best-108241.xrk', 'Mosport · Sep 25 2026 · 14:37', 'Best 1:08.241 · 67T rear', 67),
]

/** Real gearing for a bundled sample, by imported display name or raw file name. */
export function sampleGearing(fileName?: string): BundledSample['gearing'] | undefined {
  if (!fileName) return undefined
  const s = REAL_SAMPLES.find((x) => x.displayName === fileName || x.file === fileName)
  return s ? { ...s.gearing } : undefined
}

export async function fetchSampleFile(s: BundledSample): Promise<File> {
  // BASE_URL is '/n10-kart/' (GitHub Pages staging) or '/' (Netlify).
  const url = `${import.meta.env.BASE_URL}samples/${s.file}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load sample (${res.status})`)
  const buf = await res.arrayBuffer()
  return new File([buf], s.displayName, { type: 'application/octet-stream' })
}
