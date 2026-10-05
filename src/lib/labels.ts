import type { SeriesTag } from './types'

const SERIES_LABELS: Record<string, string> = {
  practice: 'Practice',
  mika: 'MIKA',
  bsc_ontario: 'BSC Ontario',
  qualifying: 'Qualifying',
  race: 'Race',
  other: 'Other',
}

/** Reader-facing series name (never show raw tags like "bsc_ontario"). */
export function seriesLabel(s: SeriesTag | string): string {
  return SERIES_LABELS[s] ?? s
}

export const SERIES_OPTIONS = Object.keys(SERIES_LABELS) as SeriesTag[]

/** Shown in the footer and on every session page. */
export const SAFETY_LINE = 'Review your data between sessions. Never use N10 while driving.'

export const SUPPORT_EMAIL = 'mathieugamache@icloud.com'

/** PWA shell cache id — keep in sync with public/sw.js CACHE. Shown in page footer. */
export const SHELL_VERSION = 'n10-shell-v38'
