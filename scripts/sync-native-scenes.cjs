/* global __dirname */
// Package the approved procedural Three.js artwork for offline iOS WebViews.
// Generated output is ignored by Git; EAS runs this before bundling the app.
const fs = require('node:fs');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const { buildSync } = require('esbuild');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'src/components/motion/generated');
const result = buildSync({ entryPoints: [path.join(root, 'src/components/motion/nativeScene.entry.ts')], bundle: true, write: false, format: 'iife', platform: 'browser', target: 'safari16.4', minify: true, legalComments: 'inline' });
const script = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><meta http-equiv="Content-Security-Policy" content="default-src \'none\';script-src \'unsafe-inline\';style-src \'unsafe-inline\';img-src data:;connect-src \'none\'"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}canvas{display:block;width:100%;height:100%;pointer-events:none}</style></head><body><canvas aria-hidden="true"></canvas><script>'+script+'</script></body></html>';
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'sceneHtml.ts'), 'export const sceneHtml = '+JSON.stringify(html)+'\n');
console.log('Bundled offline native 3D scenes ('+Buffer.byteLength(html)+' bytes).');
