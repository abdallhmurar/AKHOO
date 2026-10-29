# Website font compression

These are lossless WOFF2 conversions of the existing project's Tajawal 400/700/800,
Inter 400/700 and Noto Sans Hebrew 400/700 TTF files. Font designs and glyphs are
unchanged. Source mapping is in `website/build.mjs`; source packages are
`@expo-google-fonts/tajawal`, `@expo-google-fonts/inter`, and
`@expo-google-fonts/noto-sans-hebrew`. Their SIL Open Font License files are
included in the website assets and linked from the credits page.

Generated using `wawoff2@2.0.1` (`require('wawoff2').compress(ttfBuffer)`), a
WebAssembly wrapper for Google's WOFF2 converter. The converter was installed
only in ignored local tooling; ordinary website builds use these committed files
and do not download or execute that package.
