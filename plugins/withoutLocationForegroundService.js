const { withAndroidManifest } = require('expo/config-plugins')

// Play infers a FOREGROUND_SERVICE_LOCATION declaration (permission form + demo
// video) from this service's android:foregroundServiceType="location". The app
// no longer starts background location on Android (see src/lib/location.ts),
// so strip the service from the merged manifest instead of declaring a use we
// don't have. iOS is unaffected.
const SERVICE = 'expo.modules.location.services.LocationTaskService'

module.exports = function withoutLocationForegroundService(config) {
  return withAndroidManifest(config, cfg => {
    const manifest = cfg.modResults.manifest
    manifest.$ = manifest.$ || {}
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools'
    const application = manifest.application && manifest.application[0]
    if (application) {
      application.service = application.service || []
      const present = application.service.some(s => s.$ && s.$['android:name'] === SERVICE)
      if (!present) application.service.push({ $: { 'android:name': SERVICE, 'tools:node': 'remove' } })
    }
    return cfg
  })
}
