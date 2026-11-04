// Opt-in build transformation. Defaults remain compatible with shipped Android
// binaries; a new store binary and Play's permission declaration are required.
module.exports = function withNearbyBackgroundAlerts(config) {
  const locationPermissions = new Set(['android.permission.ACCESS_BACKGROUND_LOCATION', 'android.permission.FOREGROUND_SERVICE', 'android.permission.FOREGROUND_SERVICE_LOCATION'])
  return {
    ...config,
    runtimeVersion: `${typeof config.runtimeVersion === 'string' ? config.runtimeVersion : config.version}-nearby-v1`,
    extra: { ...config.extra, nearbyBackgroundAlerts: true },
    android: {
      ...config.android,
      blockedPermissions: (config.android?.blockedPermissions ?? []).filter(permission => !locationPermissions.has(permission)),
    },
    plugins: (config.plugins ?? []).filter(plugin => (Array.isArray(plugin) ? plugin[0] : plugin) !== './plugins/withoutLocationForegroundService').map(plugin =>
      Array.isArray(plugin) && plugin[0] === 'expo-location'
        ? [plugin[0], {
          ...plugin[1],
          locationAlwaysAndWhenInUsePermission: 'أخوو يستخدم موقعك لتنبيهك لطلبات المساعدة القريبة حتى لما التطبيق بالخلفية أو مش عم تستخدمه، إذا فعّلت الميزة. / If you enable nearby alerts, AKHOO uses your location to notify you of nearby help requests even when the app is in the background or not in use. / אם הפעלת התראות קרובות, AKHOO משתמשת במיקום שלך כדי להתריע על בקשות עזרה קרובות גם כשהאפליקציה ברקע או אינה בשימוש.',
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
          isIosBackgroundLocationEnabled: true
        }]
        : plugin
    )
  }
}
