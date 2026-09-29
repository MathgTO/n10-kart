import type { CapacitorConfig } from '@capacitor/cli'

// NOTE: appId is a PLACEHOLDER until the first App Store Connect upload.
// After the first upload the bundle ID is permanent — confirm before archiving.
const config: CapacitorConfig = {
  appId: 'com.mathieugamache.n10',
  appName: 'N10', // home-screen name; App Store name is set in App Store Connect (see checklist),
  webDir: 'dist-ios',
  backgroundColor: '#0a0a0a',
  ios: {
    contentInset: 'never',
    backgroundColor: '#0a0a0a',
    // Keep the WKWebView from showing link previews / zoom quirks
    allowsLinkPreview: false,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
  },
}

export default config
