# N10 iOS / iPadOS app (Capacitor)

Branch `ios-appstore`. The web app (GitHub Pages / Netlify) is unchanged in behaviour; every native
path is gated by `Capacitor.isNativePlatform()` (`src/native/platform.ts`).

## Build
Requires **Node 22+** (Capacitor 8 CLI), Xcode 26+ (Xcode 27 OK: the project uses the UIScene lifecycle).

```bash
npm ci
npm run build:ios        # tsc + vite build --base=./ --outDir dist-ios + npx cap sync ios
npx cap open ios         # opens ios/App/App.xcodeproj (Swift Package Manager, no CocoaPods)
```

If `ios/` is ever regenerated (`rm -rf ios && npx cap add ios --packagemanager SPM`), re-apply N10's settings:
```bash
npm run ios:customize    # scripts/ios_customize.py (Info.plist, pbxproj, PrivacyInfo, SceneDelegate) + icons/splash
```

## What differs in the native shell
| Area | Web | iOS shell |
|---|---|---|
| Router | BrowserRouter (basename from vite base) | HashRouter (assets are relative, `./`) |
| Service worker | registered (`sw.js?v=9`) | not registered |
| Storage | localStorage | localStorage + native mirror (`src/native/nativeMirror.ts`): sessions → Filesystem `Library/n10/*.json`, prefs/favourites → Preferences; restored on boot if WebKit evicted localStorage |
| File open | `<input type=file>` | also "Open in N10" / AirDrop / Files / share sheet for .xrk/.xrz/.csv (`SceneDelegate.swift` stages to `Documents/Imports`, `src/native/NativeFileOpen.tsx` imports) |
| Home-screen tip | shown on iOS Safari | hidden |

Both: "Try a real Mosport session" (loads `public/samples/*.xrk` through the normal import path) and the in-app `/privacy` page.

## Key settings
- Bundle ID `com.mathieugamache.n10` (placeholder until first App Store Connect upload), display name `N10`.
- 1.0.0 (1), iOS 16.0+, `TARGETED_DEVICE_FAMILY = 2` (iPad; runs on Apple Silicon Macs as Designed for iPad).
- Imported UTTypes `com.mathieugamache.n10.xrk` / `.xrz` (conform to `public.data`), CSV as Alternate viewer.
- `ITSAppUsesNonExemptEncryption = NO`, no camera/location/photos purpose strings.
- `PrivacyInfo.xcprivacy`: no tracking, no collected data, UserDefaults CA92.1, FileTimestamp C617.1.
