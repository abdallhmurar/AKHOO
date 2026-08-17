const base = require('./app.json')

// GitHub Pages serves this project from a subpath (/sanad/), not the domain
// root, so static asset URLs need that prefix. Only applied when the
// EXPO_WEB_BASE_PATH env var is explicitly set for a one-off web export -
// normal `expo start`/native builds are untouched since app.json itself
// stays the single source of truth otherwise.
module.exports = () => {
  const baseUrl = process.env.EXPO_WEB_BASE_PATH
  if (!baseUrl) return base.expo

  return {
    ...base.expo,
    experiments: { ...(base.expo.experiments ?? {}), baseUrl }
  }
}
