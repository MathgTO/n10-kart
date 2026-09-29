import type { SeriesTag, StoredSession } from './types'
import { mirror } from '@/native/mirror'

const SESSIONS_KEY = 'n10-kart-sessions-v3'
const PREFS_KEY = 'n10-kart-prefs-v3'
const FAV_KEY = 'n10-kart-fav-tracks-v2'

export interface Prefs {
  trackId: string
  series: SeriesTag
  demosLoaded: boolean
  /** Bumps when coach vocabulary (turns vs sectors) changes — refreshes demo copy */
  langVersion?: string
  /** Bumps when scoring schema changes (e.g. null N/A dims) — recomputes stored reports */
  reportVersion?: string
}

export function loadSessions(): StoredSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as StoredSession[]
  } catch {
    return []
  }
}

export function saveSessions(sessions: StoredSession[]) {
  // Strip video object URLs before persist
  const safe = sessions.map(({ videoObjectUrl, ...rest }) => rest)
  const json = JSON.stringify(safe)
  mirror(SESSIONS_KEY, json) // iOS shell only (no-op on web); queued before setItem so a quota error can't skip it
  localStorage.setItem(SESSIONS_KEY, json)
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return JSON.parse(raw) as Prefs
  } catch { /* */ }
  return { trackId: 'mosport', series: 'practice', demosLoaded: false }
}

export function savePrefs(p: Prefs) {
  const json = JSON.stringify(p)
  mirror(PREFS_KEY, json)
  localStorage.setItem(PREFS_KEY, json)
}

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    if (raw) return JSON.parse(raw) as string[]
  } catch { /* */ }
  return ['mosport']
}

export function saveFavorites(ids: string[]) {
  const json = JSON.stringify(ids)
  mirror(FAV_KEY, json)
  localStorage.setItem(FAV_KEY, json)
}
