const base = require('./app.json')

// GitHub Pages serves this project from a subpath (/sanad/), not the domain
// root, so static asset URLs need that prefix. Only applied when the
// EXPO_WEB_BASE_PATH env var is explicitly set for a one-off web export -
// normal `expo start`/native builds are untouched since app.json itself
// stays the single source of truth otherwise.
module.exports = () => {
  const testflight = process.env.AKHOO_BUILD_TARGET === 'testflight'
  const androidRelease = process.env.AKHOO_BUILD_TARGET === 'android-release'
  if (testflight && process.env.EAS_BUILD_PLATFORM === 'android') {
    throw new Error('The TestFlight profile is restricted to iOS.')
  }
  if (androidRelease && process.env.EAS_BUILD_PLATFORM === 'ios') {
    throw new Error('The Android release profile is restricted to Android.')
  }
  if (androidRelease && (!/^\d+\.\d+\.\d+$/.test(process.env.AKHOO_ANDROID_VERSION || '') || !/^[1-9]\d*$/.test(process.env.AKHOO_ANDROID_VERSION_CODE || ''))) {
    throw new Error('Android releases require an explicit version and positive versionCode.')
  }
  const config = androidRelease ? {
    ...base.expo,
    version: process.env.AKHOO_ANDROID_VERSION,
    android: { ...base.expo.android, versionCode: Number(process.env.AKHOO_ANDROID_VERSION_CODE) },
    // Isolate this binary from the earlier 2.0.4 Android OTA.
    runtimeVersion: process.env.AKHOO_ANDROID_VERSION,
  } : testflight ? {
    ...base.expo,
    version: process.env.AKHOO_IOS_VERSION || base.expo.version,
    ios: { ...base.expo.ios, buildNumber: process.env.AKHOO_IOS_BUILD_NUMBER || base.expo.ios.buildNumber },
    // The beta binary is self-contained: no production OTA update can reach it,
    // and preparing this build never changes the production update channel.
    updates: { ...base.expo.updates, enabled: false },
    extra: { ...base.expo.extra, partnerHomeBeta: process.env.AKHOO_PARTNER_HOME_BETA === '1' },
    runtimeVersion: `${process.env.AKHOO_IOS_VERSION || base.expo.version}-testflight`
  } : base.expo
  const baseUrl = process.env.EXPO_WEB_BASE_PATH
  if (!baseUrl) return config

  return {
    ...config,
    experiments: { ...(config.experiments ?? {}), baseUrl }
  }
}
