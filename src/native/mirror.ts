import { isNative } from './platform'

/** Keys persisted by src/lib/storage.ts that the native shell mirrors. */
export const MIRRORED_KEYS = ['n10-kart-sessions-v3', 'n10-kart-prefs-v3', 'n10-kart-fav-tracks-v2']

/** No-op on the web. On iOS, lazily loads the native mirror and queues the write. */
export function mirror(key: string, value: string) {
  if (!isNative) return
  void import('./nativeMirror').then((m) => m.mirrorWrite(key, value))
}

/** Called once before React renders (native only). */
export async function restoreNativeStorage() {
  if (!isNative) return
  try {
    const m = await import('./nativeMirror')
    const { restored } = await m.restoreFromNative(MIRRORED_KEYS)
    if (restored.length) console.info('[n10] restored from native storage:', restored)
    const { App } = await import('@capacitor/app')
    App.addListener('pause', () => void m.mirrorFlush()).catch(() => {})
  } catch (e) {
    console.warn('[n10] native restore skipped', e)
  }
}
