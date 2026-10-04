import type { SeriesTag, StoredSession } from './types'

const SESSIONS_KEY = 'n10-kart-sessions-v3'
const PREFS_KEY = 'n10-kart-prefs-v3'
const FAV_KEY = 'n10-kart-fav-tracks-v2'

/** Class label for imported sessions (N10 has no per-session class picker yet). */
export const DEFAULT_CLASS_LABEL = 'LO206'

function isQuotaError(e: unknown): boolean {
  if (!(e instanceof DOMException)) return false
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    e.code === 1014
  )
}

/** setItem that never throws (a thrown quota error inside a React effect blanks the whole app). */
function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (e) {
    console.warn(isQuotaError(e) ? '[n10] storage full' : '[n10] storage write failed', key, e)
    return false
  }
}

export interface Prefs {
  trackId: string
  series: SeriesTag
  demosLoaded: boolean
  /** Bumps when coach vocabulary (turns vs sectors) changes — refreshes demo copy */
  langVersion?: string
  /** Bumps when scoring schema changes (e.g. null N/A dims) — recomputes stored reports */
  reportVersion?: string
  /** Last gearing the owner entered — default for new imports. */
  lastGearing?: { rearTeeth?: number; frontTeeth?: number }
}

type StoredVideoFields = Pick<StoredSession, 'videoName' | 'videoObjectUrl' | 'videoCueMarkers'>

/** The video clip itself is never stored, so don't keep its name either (it would outlive the clip). */
function withoutVideo<T extends StoredVideoFields>(s: T): Omit<T, keyof StoredVideoFields> {
  const { videoName: _n, videoObjectUrl: _u, videoCueMarkers: _m, ...rest } = s
  return rest
}

export function loadSessions(): StoredSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as StoredSession[]).map((s) => withoutVideo(s) as StoredSession)
  } catch {
    return []
  }
}

/** Returns false (instead of throwing) when storage is full. */
export function saveSessions(sessions: StoredSession[]): boolean {
  const json = JSON.stringify(sessions.map(withoutVideo))
  return safeSet(SESSIONS_KEY, json)
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return JSON.parse(raw) as Prefs
  } catch { /* */ }
  return { trackId: 'mosport', series: 'practice', demosLoaded: false }
}

export function savePrefs(p: Prefs): boolean {
  const json = JSON.stringify(p)
  return safeSet(PREFS_KEY, json)
}

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    if (raw) return JSON.parse(raw) as string[]
  } catch { /* */ }
  return ['mosport']
}

export function saveFavorites(ids: string[]): boolean {
  const json = JSON.stringify(ids)
  return safeSet(FAV_KEY, json)
}
