/**
 * Real MyChron sessions bundled in public/samples (Mosport Karting Centre, logger 35023763).
 * Used when those files are imported (setup hints / aliases) — not exposed as a Home CTA.
 * Date/time, track, layout and driver now come from the file itself (GPS time + TRK + logger serial);
 * only the owner-confirmed setup (sprockets, tire, cold PSI) is carried here because it is not in the file.
 */
import type { SessionSetup } from './types'

export interface BundledSample {
  file: string
  /** Picker label (GPS-decoded date). */
  label: string
  /** Name given to the imported File. */
  displayName: string
  /** Short context shown under the label. */
  note: string
  /** GPS-decoded start (UTC) — used to migrate copies imported before GPS time existed. */
  gpsStartUtc: string
  /** Owner-confirmed setup run that session (blank = unknown; never invented). */
  setup: SessionSetup
  /** Older file names / labels this sample was published under (already-imported copies dedupe). */
  aliases: string[]
}

/** Newest first. */
export const REAL_SAMPLES: BundledSample[] = [
  {
    // GPS: Sun Oct 4 2026 15:01 EDT. The MyChron clock wrote Oct 3 15:02:40 (one day behind) — fixed from GPS on import.
    file: '2026-10-04_mosport_150240_best-110909.xrk',
    label: 'Sun Oct 4 · Mosport · best 1:10.909',
    displayName: '2026-10-04_mosport_150240_best-110909.xrk',
    note: '69T rear (was 67T) · cold 11 psi · GPS speed',
    gpsStartUtc: '2026-10-04T19:01:08.691Z',
    setup: {
      rearTeeth: 69,
      tireCompound: 'Vega White',
      coldPsi: { fl: 11, fr: 11, rl: 11, rr: 11 },
      intentionalChange: 'gearing',
    },
    aliases: ['2026-10-03_mosport_150240_best-110909.xrk', 'Mosport · Oct 3 2026 · 15:02.xrk', 'Mosport · Oct 3 2026 · 15:02', 'Mosport · Oct 4 2026 · 15:02.xrk', 'Mosport · Oct 4 2026 · 15:02'],
  },
  {
    // GPS: Sat Sep 26 2026 16:37 EDT (logger wrote Sep 25).
    file: '2026-09-25_mosport_163712_best-108294.xrk',
    label: 'Sat Sep 26 · Mosport · best 1:08.294',
    displayName: '2026-09-25_mosport_163712_best-108294.xrk',
    note: '67T rear · GPS speed',
    gpsStartUtc: '2026-09-26T20:37:07.913Z',
    setup: { rearTeeth: 67, tireCompound: 'Vega White' },
    aliases: ['Mosport · Sep 25 2026 · 16:37.xrk', 'Mosport · Sep 25 2026 · 16:37'],
  },
  {
    // GPS: Sat Sep 26 2026 14:37 EDT (logger wrote Sep 25).
    file: '2026-09-25_mosport_143726_best-108241.xrk',
    label: 'Sat Sep 26 · Mosport · best 1:08.241',
    displayName: '2026-09-25_mosport_143726_best-108241.xrk',
    note: '67T rear · GPS speed',
    gpsStartUtc: '2026-09-26T18:37:22.426Z',
    setup: { rearTeeth: 67, tireCompound: 'Vega White' },
    aliases: ['Mosport · Sep 25 2026 · 14:37.xrk', 'Mosport · Sep 25 2026 · 14:37'],
  },
]

/** Bundled sample by imported display name, raw file name, or an older (alias) name/label. */
export function findSample(fileName?: string): BundledSample | undefined {
  if (!fileName) return undefined
  return REAL_SAMPLES.find((x) => x.displayName === fileName || x.file === fileName || x.aliases.includes(fileName))
}

/** Real gearing for a bundled sample (back-compat helper for smoke scripts). */
export function sampleGearing(fileName?: string): { rearTeeth: number } | undefined {
  const s = findSample(fileName)
  return s?.setup.rearTeeth != null ? { rearTeeth: s.setup.rearTeeth } : undefined
}

export function sampleSetup(fileName?: string): SessionSetup | undefined {
  const s = findSample(fileName)
  return s ? JSON.parse(JSON.stringify(s.setup)) : undefined
}

export async function fetchSampleFile(s: BundledSample): Promise<File> {
  // BASE_URL is '/n10-kart/' (GitHub Pages staging) or '/' (Netlify).
  const url = `${import.meta.env.BASE_URL}samples/${s.file}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load sample (${res.status})`)
  const buf = await res.arrayBuffer()
  return new File([buf], s.displayName, { type: 'application/octet-stream' })
}
