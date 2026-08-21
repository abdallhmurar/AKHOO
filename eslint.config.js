const expoConfig = require('eslint-config-expo/flat')
const { defineConfig } = require('eslint/config')

module.exports = defineConfig([
  {
    ignores: [
      'dist/**',
      '.baseline-dist/**',
      '.gh-pages-worktree/**',
      'node_modules/**',
      'supabase/functions/**',
      'supabase/.temp/**',
      // Vendored third-party maplibre-gl worker chunks (see SanadMap.web.tsx)
      // - minified, not our code, not meant to be linted.
      'public/**',
      // Separate web-only admin project with its own toolchain/eslint
      // config - not part of the Expo app, not meant to be picked up here.
      'admin/**'
    ]
  },
  expoConfig,
  {
    // eslint-config-expo's bundled eslint-plugin-import@2.32.0 crashes the
    // entire lint run on every TS file with "typescript with invalid
    // interface loaded as resolver" - a real version-skew bug between that
    // plugin and the eslint-import-resolver-typescript@3.10.1 it pulls in
    // (confirmed: pointing the resolver setting at `node` alone doesn't
    // avoid it either, the crash is in the rules' own resolution path).
    // Module resolution is already covered by `tsc --noEmit` (npm run
    // typecheck) - disable just the resolution-dependent import/* rules
    // rather than losing the whole lint run over an upstream bug.
    rules: {
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/export': 'off',
      // False positive on i18next's documented `import i18next from
      // 'i18next'; i18next.use(...).init(...)` pattern (src/lib/i18n.ts) -
      // that's the library's own official usage, not a mistake.
      'import/no-named-as-default-member': 'off',

      // eslint-plugin-react-hooks v6's "recommended" set is the new React
      // Compiler rule suite, enabled at error severity. Those rules assume
      // code written for the Compiler's stricter purity model and flag
      // long-standing, correct, idiomatic React Native patterns used
      // throughout this codebase (useRef(new Animated.Value(1)).current,
      // useState(Date.now()) as lazy initial state, setState calls inside a
      // data-fetching effect) as errors - hundreds of them, none of which
      // are actual bugs. Keep the two classic hook rules that do catch real
      // bugs (rules-of-hooks, exhaustive-deps); turn the Compiler-era ones
      // off rather than rewrite the app to satisfy a linter for a compiler
      // this project isn't opting into.
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'react-hooks/config': 'off',
      'react-hooks/gating': 'off'
    }
  }
])
