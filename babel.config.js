module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated v4 delegates its worklets transform to the
    // separate react-native-worklets package - must be listed last.
    plugins: ['react-native-worklets/plugin']
  }
}
