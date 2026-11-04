// Validate Expo's resolved native configuration without building or uploading.
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const { readFileSync } = require('node:fs')
const expo = require.resolve('expo/bin/cli')
const inspect = enabled => JSON.parse(execFileSync(process.execPath, [expo, 'config', '--type', 'introspect', '--json'], {
  encoding: 'utf8', env: { ...process.env, AKHOO_NEARBY_BACKGROUND_ALERTS: enabled ? '1' : '0' }
}))
const current = inspect(false)
const candidate = inspect(true)
const manifest = config => config._internal.modResults.android.manifest.manifest
const permissions = config => manifest(config)['uses-permission'].map(entry => entry.$)
for (const name of ['ACCESS_BACKGROUND_LOCATION', 'FOREGROUND_SERVICE', 'FOREGROUND_SERVICE_LOCATION']) {
  const permission = `android.permission.${name}`
  assert(permissions(candidate).some(entry => entry['android:name'] === permission && entry['tools:node'] !== 'remove'), `${name} missing from opt-in config`)
  assert(!permissions(current).some(entry => entry['android:name'] === permission && entry['tools:node'] !== 'remove'), `${name} unexpectedly enabled by default`)
}
const services = manifest(candidate).application?.[0]?.service ?? []
assert(!services.some(entry => entry.$['android:name'].endsWith('LocationTaskService') && entry.$['tools:node'] === 'remove'))
const libraryManifest = readFileSync(require.resolve('expo-location/android/src/main/AndroidManifest.xml'), 'utf8')
assert(libraryManifest.includes('.services.LocationTaskService'))
assert(libraryManifest.includes('android:foregroundServiceType="location"'))
assert(candidate._internal.modResults.ios.infoPlist.UIBackgroundModes.includes('location'))
assert(candidate._internal.modResults.ios.infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription.includes('not in use'))
assert.equal(candidate.extra.nearbyBackgroundAlerts, true)
assert.notEqual(current.extra.nearbyBackgroundAlerts, true)
assert(candidate.runtimeVersion.endsWith('-nearby-v1'))
assert.notDeepEqual(candidate.runtimeVersion, current.runtimeVersion)
console.log('PASS: opt-in native permissions, location service, iOS background mode, isolated runtime; shipped defaults unchanged.')
