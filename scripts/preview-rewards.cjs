/* global __dirname */
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const esbuild = require('esbuild')
const root = path.resolve(__dirname, '..')
const output = path.join(root, 'credentials/live-rewards-preview')
const fonts = {}
for (const [pack, family] of [['noto-sans-arabic', 'NotoSansArabic'], ['noto-sans-hebrew', 'NotoSansHebrew'], ['inter', 'Inter']]) {
  for (const [weight, label] of [[400, 'Regular'], [500, 'Medium'], [600, 'SemiBold'], [700, 'Bold'], [800, 'ExtraBold']]) {
    fonts[`${family}_${weight}${label}.ttf`] = path.join(root, `node_modules/@expo-google-fonts/${pack}/${weight}${label}/${family}_${weight}${label}.ttf`)
  }
}
const fontStyles = Object.keys(fonts).map(file => `@font-face{font-family:'${file.slice(0, -4)}';src:url('/fonts/${file}');font-display:swap}`).join('')
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>أخوو · بطاقة النقاط الحيّة</title><style>${fontStyles}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 20% 15%,#dceff5,transparent 55%),#f1fafc;color:#153448;font-family:NotoSansArabic_400Regular,Arial,sans-serif}main{width:min(100%,490px);margin:0 auto;padding:36px 18px 40px}.preview-header{text-align:center;margin-bottom:24px}.preview-header span{font:600 10px Arial;letter-spacing:3px;color:#4e7f86}.preview-header h1{font-family:NotoSansArabic_700Bold;margin:10px 0 0;font-size:23px}.preview-header p{font-size:11px;margin:5px 0;color:#527780}.preview-controls{margin-top:24px;border:1px dashed #b5d1d8;border-radius:18px;padding:15px;background:#ffffff99}.preview-controls p{font-size:10px;color:#53747e;margin:0 0 12px;text-align:center}.controls-row{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:8px 0}button,select{font:inherit;font-size:11px;min-height:42px;cursor:pointer}aside button,select{border:1px solid #b5d1d8;background:white;color:#164c5b;border-radius:10px;padding:6px 12px}aside button:first-child{background:#0d716f;color:white;border-color:#0d716f}label{font-size:10px;display:flex;align-items:center;gap:5px}button:focus-visible,select:focus-visible{outline:3px solid #30c2cf;outline-offset:3px}
@media(max-width:360px){main{padding:24px 12px}.preview-header h1{font-size:20px}}
body{background:radial-gradient(ellipse at 25% 30%,#d5efff,transparent 70%),#eff9ff}.preview-header{text-align:left;margin-bottom:7px}.preview-header span{font-family:inherit;letter-spacing:0;font-size:10px;color:#8194a2}
aside input:not([type=range]){width:125px;min-width:0;min-height:36px;border:1px solid #b5d1d8;border-radius:8px;padding:4px 7px;font:inherit;color:#164c5b;background:white}
.growth-control{display:flex;gap:12px;margin:16px 0;justify-content:center}.growth-control input{flex:1;min-width:0;accent-color:#109f97;min-height:30px}
.character-ranks{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:18px 0}.character-ranks button{display:flex;flex-direction:column;align-items:center;border:1px solid transparent;border-radius:18px;background:transparent;padding:9px 3px 7px;color:#52717e}.character-ranks button[aria-pressed=true]{background:#ffffffba;border-color:#b9dfe1;box-shadow:0 4px 20px #3a879615}.character-ranks img{width:68px;height:102px;object-fit:contain}.character-ranks span{font-size:10px;line-height:20px}
</style></head><body><div id="root"></div><script type="module" src="/bundle/entry.js"></script></body></html>`
async function start() {
  fs.mkdirSync(output, { recursive: true })
  const context = await esbuild.context({ entryPoints: [path.join(root, 'previews/live-rewards/entry.jsx')], outdir: output, bundle: true, splitting: true, format: 'esm', jsx: 'automatic', loader: { '.png': 'file' }, publicPath: '/bundle/', resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'], define: { 'process.env.EXPO_OS': '"web"', 'process.env': '{}', 'process.env.NODE_ENV': '"development"', __DEV__: 'true' }, alias: { 'react-native': 'react-native-web' }, plugins: [{ name: 'preview-context', setup(build) { build.onResolve({ filter: /^(expo-router)$|\/GuideProvider$/ }, () => ({ path: path.join(root, 'previews/live-rewards/bridge.jsx') })) } }] })
  await context.watch()
  await context.rebuild()
  http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1')
    let file
    if (url.pathname === '/') { response.setHeader('content-type', 'text/html; charset=utf-8'); return response.end(html) }
    if (url.pathname.startsWith('/fonts/')) file = fonts[url.pathname.slice(7)]
    if (/^\/bundle\/[\w-]+\.(js|png)$/.test(url.pathname)) file = path.join(output, path.basename(url.pathname))
    if (!file || !fs.existsSync(file)) { response.statusCode = 404; return response.end('Not found') }
    response.setHeader('cache-control', 'no-store')
    response.setHeader('content-type', file.endsWith('.js') ? 'text/javascript; charset=utf-8' : file.endsWith('.png') ? 'image/png' : 'font/ttf')
    fs.createReadStream(file).pipe(response)
  }).listen(4186, '127.0.0.1', () => process.stdout.write('Live rewards preview: http://127.0.0.1:4186/\n'))
}
start().catch(error => { process.stderr.write(`${error}\n`); process.exit(1) })
