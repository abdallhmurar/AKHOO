const base = require('./app.json')

// GitHub Pages serves this project from a subpath (/sanad/), not the domain
// root, so static asset URLs need that prefix. Only applied when the
// EXPO_WEB_BASE_PATH env var is explicitly set for a one-off web export -
// normal `expo start`/native builds are untouched since app.json itself
// stays the single source of truth otherwise.
module.exports = () => {
  const testflight = process.env.AKHOO_BUILD_TARGET === 'testflight'
  if (testflight && process.env.EAS_BUILD_PLATFORM === 'android') {
    throw new Error('The TestFlight profile is restricted to iOS.')
  }
  const config = testflight ? {
    ...base.expo,
    version: process.env.AKHOO_IOS_VERSION || base.expo.version,
    ios: { ...base.expo.ios, buildNumber: process.env.AKHOO_IOS_BUILD_NUMBER || base.expo.ios.buildNumber },
    // The beta binary is self-contained: no production OTA update can reach it,
    // and preparing this build never changes the production update channel.
    updates: { ...base.expo.updates, enabled: false },
    runtimeVersion: `${process.env.AKHOO_IOS_VERSION || base.expo.version}-testflight`
  } : base.expo
  const baseUrl = process.env.EXPO_WEB_BASE_PATH
  if (!baseUrl) return config

  return {
    ...config,
    experiments: { ...(config.experiments ?? {}), baseUrl }
  }
}
