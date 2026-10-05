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
  /** Real local date/time the session ran (logger date + dateOffsetDays), e.g. '2026-10-04T15:02:40'. */
  recordedAt: string
  /** Date the MyChron logger wrote (its clock may be wrong). */
  loggerDate: string
  /** Days added to the logger date to get the real date (owner-confirmed clock error). */
  dateOffsetDays: number
  /** Older file names / labels this sample was published under (already-imported copies). */
  aliases: string[]
}

/** 'YYYY-MM-DD' + n days → 'YYYY-MM-DD' (calendar math in UTC, no timezone drift). */
export function shiftDate(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const sample = (
  file: string,
  label: string,
  note: string,
  rearTeeth: number,
  opts: { loggerDate: string; time: string; dateOffsetDays?: number; aliases?: string[] }
): BundledSample => {
  const dateOffsetDays = opts.dateOffsetDays ?? 0
  return {
    file,
    label,
    displayName: `${label}.xrk`,
    note,
    trackId: 'mosport',
    gearing: { rearTeeth },
    loggerDate: opts.loggerDate,
    dateOffsetDays,
    recordedAt: `${shiftDate(opts.loggerDate, dateOffsetDays)}T${opts.time}`,
    aliases: opts.aliases ?? [],
  }
}

/** Newest first. */
export const REAL_SAMPLES: BundledSample[] = [
  // Ran Sun Oct 4 2026 15:02 ET. The MyChron clock is one day behind (owner-confirmed), so the logger
  // wrote Oct 3; first published as 2026-10-03_… / 'Mosport · Oct 3 2026 · 15:02' (kept as aliases).
  sample('2026-10-04_mosport_150240_best-110909.xrk', 'Mosport · Oct 4 2026 · 15:02', 'Best 1:10.909 · 69T rear (was 67T) · GPS speed', 69, {
    loggerDate: '2026-10-03',
    time: '15:02:40',
    dateOffsetDays: 1,
    aliases: ['2026-10-03_mosport_150240_best-110909.xrk', 'Mosport · Oct 3 2026 · 15:02.xrk', 'Mosport · Oct 3 2026 · 15:02'],
  }),
  sample('2026-09-25_mosport_163712_best-108294.xrk', 'Mosport · Sep 25 2026 · 16:37', 'Best 1:08.294 · 67T rear', 67, { loggerDate: '2026-09-25', time: '16:37:12' }),
  sample('2026-09-25_mosport_143726_best-108241.xrk', 'Mosport · Sep 25 2026 · 14:37', 'Best 1:08.241 · 67T rear', 67, { loggerDate: '2026-09-25', time: '14:37:26' }),
]

/** Bundled sample by imported display name, raw file name, or an older (alias) name/label. */
export function findSample(fileName?: string): BundledSample | undefined {
  if (!fileName) return undefined
  return REAL_SAMPLES.find((x) => x.displayName === fileName || x.file === fileName || x.aliases.includes(fileName))
}

/** Real gearing for a bundled sample, by imported display name, raw file name or old alias. */
export function sampleGearing(fileName?: string): BundledSample['gearing'] | undefined {
  const s = findSample(fileName)
  return s ? { ...s.gearing } : undefined
}

/**
 * Fields an imported/stored copy of a bundled sample should carry: the clock-corrected real date and,
 * for copies under an old name, the current title + file name (so the list shows Oct 4 and re-import dedupes).
 */
export function sampleIdentity(
  fileName?: string
): { recordedAt: string; title?: string; sourceFileName?: string } | undefined {
  const s = findSample(fileName)
  if (!s) return undefined
  // Only old (alias) names are renamed; a copy imported as the current file keeps its own title.
  return s.aliases.includes(fileName!)
    ? { recordedAt: s.recordedAt, title: s.label, sourceFileName: s.displayName }
    : { recordedAt: s.recordedAt }
}

export async function fetchSampleFile(s: BundledSample): Promise<File> {
  // BASE_URL is '/n10-kart/' (GitHub Pages staging) or '/' (Netlify).
  const url = `${import.meta.env.BASE_URL}samples/${s.file}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load sample (${res.status})`)
  const buf = await res.arrayBuffer()
  return new File([buf], s.displayName, { type: 'application/octet-stream' })
}
