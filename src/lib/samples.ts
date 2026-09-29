/**
 * Real MyChron sessions bundled in public/samples (Mosport Karting Centre, Sep 25 2026).
 * Used by "Try a real Mosport session" so App Review (and anyone without a MyChron) can see
 * a real .xrk parsed on-device. Served from the app bundle on iOS, from the site on the web.
 */
export interface BundledSample {
  file: string
  /** Name given to the imported File (becomes the session title; keep the .xrk extension). */
  displayName: string
  trackId: string
}

export const REAL_SAMPLES: BundledSample[] = [
  {
    file: '2026-09-25_mosport_143726_best-108241.xrk',
    displayName: 'Mosport sample — Sep 25, 14:37.xrk',
    trackId: 'mosport',
  },
  {
    file: '2026-09-25_mosport_163712_best-108294.xrk',
    displayName: 'Mosport sample — Sep 25, 16:37.xrk',
    trackId: 'mosport',
  },
]

export async function fetchSampleFile(s: BundledSample): Promise<File> {
  // BASE_URL is '/n10-kart/' (GitHub Pages), '/' (Netlify) or './' (iOS shell, HashRouter).
  const url = `${import.meta.env.BASE_URL}samples/${s.file}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load sample (${res.status})`)
  const buf = await res.arrayBuffer()
  return new File([buf], s.displayName, { type: 'application/octet-stream' })
}
