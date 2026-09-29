/**
 * Native persistence mirror (iOS shell only — dynamically imported, never loaded on the web).
 *
 * localStorage stays the source of truth. Every write is mirrored to native storage so that
 * WKWebView storage eviction cannot wipe the session library:
 *  - large values (sessions) → Filesystem, Directory.Library/n10/<key>.json
 *    (app-private, not user-visible in Files, included in the device backup)
 *  - small values (prefs, favourites) → Preferences (UserDefaults)
 * On boot, any key missing from localStorage is restored from the native copy.
 */
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'

const DIR = Directory.Library
const FOLDER = 'n10'
const FILE_KEYS = new Set(['n10-kart-sessions-v3'])

const pathFor = (key: string) => `${FOLDER}/${key}.json`

const pending = new Map<string, string>()
let timer: ReturnType<typeof setTimeout> | null = null

async function flush() {
  timer = null
  const batch = [...pending.entries()]
  pending.clear()
  for (const [key, value] of batch) {
    try {
      if (FILE_KEYS.has(key)) {
        await Filesystem.writeFile({
          path: pathFor(key),
          data: value,
          directory: DIR,
          encoding: Encoding.UTF8,
          recursive: true,
        })
      } else {
        await Preferences.set({ key, value })
      }
    } catch (e) {
      console.warn('[n10] native mirror write failed', key, e)
    }
  }
}

/** Queue a mirrored write (debounced so rapid state changes don't thrash the disk). */
export function mirrorWrite(key: string, value: string) {
  pending.set(key, value)
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => void flush(), 400)
}

/** Flush immediately (used when the app goes to background). */
export async function mirrorFlush() {
  if (timer) clearTimeout(timer)
  await flush()
}

async function readNative(key: string): Promise<string | null> {
  try {
    if (FILE_KEYS.has(key)) {
      const r = await Filesystem.readFile({ path: pathFor(key), directory: DIR, encoding: Encoding.UTF8 })
      return typeof r.data === 'string' ? r.data : await r.data.text()
    }
    const r = await Preferences.get({ key })
    return r.value
  } catch {
    return null // not written yet
  }
}

/**
 * Restore any key that localStorage lost (e.g. WebKit eviction) from the native copy.
 * If localStorage has the key but the native copy doesn't exist yet (first launch of a
 * build with the mirror), seed the native copy from localStorage.
 */
export async function restoreFromNative(keys: string[]): Promise<{ restored: string[] }> {
  const restored: string[] = []
  for (const key of keys) {
    const local = localStorage.getItem(key)
    const native = await readNative(key)
    if (local == null && native != null) {
      try {
        localStorage.setItem(key, native)
        restored.push(key)
      } catch (e) {
        console.warn('[n10] restore to localStorage failed', key, e)
      }
    } else if (local != null && native == null) {
      mirrorWrite(key, local)
    }
  }
  return { restored }
}
