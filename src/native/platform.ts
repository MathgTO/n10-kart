import { Capacitor } from '@capacitor/core'

/**
 * True only inside the Capacitor iOS shell (capacitor://localhost).
 * On the web (GitHub Pages / Netlify) this is always false, so every native
 * branch below is a no-op there and the web behaviour is unchanged.
 */
export const isNative: boolean = Capacitor.isNativePlatform()
