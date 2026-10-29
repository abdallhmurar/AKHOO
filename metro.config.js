const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Router transforms contain absolute app paths. Worktrees sharing node_modules
// must not reuse another checkout's cached route context.
config.cacheVersion = `akhoo:${__dirname}`

// Some react-native ecosystem packages (e.g. phosphor-react-native@3.0.6)
// publish a package.json "exports" map that points at build output missing
// from the npm tarball, which breaks Metro resolution entirely. Falling
// back to the legacy main/browser/react-native fields sidesteps that.
config.resolver.unstable_enablePackageExports = false

module.exports = config
