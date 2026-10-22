/* global __dirname */
// Publish the already approved artwork unchanged. No prototype data or handlers
// are shipped: the React screens keep the application's real repositories.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'previews/home-motion');
const target = path.join(root, 'public/motion');
const files = [
  'assets/road-header.png', 'assets/home-art.png', 'assets/brand.png',
  'assets/help-3d.mp4', 'assets/help-3d-poster.png',
  'assets/helper-3d.mp4', 'assets/helper-3d-poster.png',
  'assets/arabic-bold.ttf', 'assets/arabic-extra-bold.ttf', 'assets/FONT-LICENSE.txt',
  'activity/assets/arabic-regular.ttf',
  'assets/perks/header-people-motion-v3.mp4', 'assets/perks/header-people-motion-v3-poster.png',
  'assets/perks/vendor/three.module.js', 'assets/perks/vendor/three.core.js', 'assets/perks/vendor/THREE-LICENSE.txt',
  'requester/assets/header.png', 'requester/assets/details-header.png',
  'requester/assets/details-camera.png', 'requester/assets/location-safety.png',
  ...['battery', 'fuel', 'other', 'tire', 'waiting', 'accepted', 'confirmation', 'success'].flatMap(name => ['png', 'mp4'].map(ext => `requester/assets/${name}.${ext}`)),
  'helper/assets/helper.png', 'helper/assets/helper.mp4', 'helper/assets/rating-star.png', 'helper/assets/ICON-CREDITS.md',
  ...['home', 'person', 'hands', 'gift', 'trophy', 'battery', 'fuel'].map(name => `activity/assets/icons/${name}.png`),
  'activity/assets/icons/ATTRIBUTION.md',
  ...['compass', 'globe', 'moon'].map(name => `account/assets/${name}.png`), 'account/assets/ATTRIBUTION.md'
];
for (const relative of files) {
  const from = path.join(source, relative), to = path.join(target, relative);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}
// Reuse the prototype's geometry, adding only the actual earned metal color.
const sceneSource = fs.readFileSync(path.join(source, 'assets/perks/scene.js'), 'utf8');
const modelSource = sceneSource.slice(0, sceneSource.indexOf('export function createMotion'))
  .replace("'./vendor/three.module.js'", "'./assets/perks/vendor/three.module.js'")
  .replace('function makeMedal()', "export function makeMedal(metalColor = '#ced8e2')")
  .replace("metal=material('#ced8e2'", 'metal=material(metalColor')
  .replace('function studioEnvironment(', 'export function studioEnvironment(');
fs.writeFileSync(path.join(target, 'medal-model.js'), modelSource);
fs.copyFileSync(path.join(root, 'src/components/motion/medal-element.js'), path.join(target, 'medal-element.js'));
console.log(`Copied ${files.length} approved motion assets, unchanged.`);
