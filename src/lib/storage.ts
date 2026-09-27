import type { SeriesTag, StoredSession } from './types'

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
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(safe))
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return JSON.parse(raw) as Prefs
  } catch { /* */ }
  return { trackId: 'mosport', series: 'practice', demosLoaded: false }
}

export function savePrefs(p: Prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p))
}

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    if (raw) return JSON.parse(raw) as string[]
  } catch { /* */ }
  return ['mosport']
}

export function saveFavorites(ids: string[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify(ids))
}
