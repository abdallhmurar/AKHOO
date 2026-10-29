// Check Metro's actual release graph, not filenames that might never reach Android.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')

const output = process.argv[2]
assert(output, 'Pass the Android expo export directory (export with --source-maps).')
const bundleDir = path.join(output, '_expo/static/js/android')
const mapFile = fs.readdirSync(bundleDir).find(name => name.endsWith('.map'))
assert(mapFile, 'Android source map is missing.')
const sources = JSON.parse(fs.readFileSync(path.join(bundleDir, mapFile), 'utf8')).sources.map(source => source.replaceAll('\\', '/'))
const required = [
  'features/home/HomeScreen.android.tsx', 'features/home/PartnerHomeScreen.ios.tsx',
  'features/requester/RequestFlowScreens.android.tsx', 'features/requester/RequestFlowScreens.ios.tsx',
  'features/helper/HelperScreens.android.tsx', 'features/helper/HelperScreens.ios.tsx',
  'features/mission/MissionRoute.android.tsx', 'features/mission/LiveMissionScreen.ios.tsx',
  'features/mission/RequesterWaitingScreen.ios.tsx', 'features/mission/RequesterTrackingScreen.ios.tsx',
  'features/activity/ActivityScreen.android.tsx', 'features/activity/ActivityScreen.ios.tsx',
  'features/auth/WelcomeScreen.android.tsx', 'providers/LaunchScreen.android.tsx',
  'components/TabBar.android.tsx', 'components/v2/AppScreen.android.tsx',
  'components/v2/ListRow.android.tsx', 'components/ui/Button.android.tsx',
  'components/HelperMedal.android.tsx', 'components/NativeSafeArea.tsx',
  'components/motion/ApprovedPanels.android.tsx', 'components/motion/ApprovedPanels.ios.tsx',
  'components/motion/Motion.android.tsx', 'components/motion/media.ios.ts',
  'providers/iosFonts.android.ts', 'app/auth-callback.tsx',
]
for (const file of required) assert(sources.some(source => source.endsWith(file)), `Missing shipped presentation: ${file}`)
for (const file of ['features/requester/RequestFlowScreens.tsx', 'features/helper/HelperScreens.tsx', 'features/activity/ActivityScreen.tsx', 'components/TabBar.tsx']) {
  assert(!sources.some(source => source.endsWith(file)), `Old Android presentation is still bundled: ${file}`)
}
for (const name of ['LivePointsCard', 'HelperCharacter', 'impactTreeScene', 'helperCardMaterials']) {
  assert(!sources.some(source => source.includes(name)), `Unapproved local prototype bundled: ${name}`)
}
for (const weight of ['400Regular', '500Medium', '700Bold', '800ExtraBold']) {
  assert(sources.some(source => source.includes(`Tajawal_${weight}.ttf`)), `Missing Arabic font ${weight}`)
}
console.log(`Android release graph verified: ${required.length} presentation/auth entries, four Arabic fonts; old screens and local prototypes excluded.`)
