import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {LEGAL_CONTACT,LEGAL_LAST_UPDATED,privacyPolicyBlocks,termsOfUseBlocks} from '../src/features/account/legalContent.ts';
import {parseEnv} from 'node:util';
const base=dirname(fileURLToPath(import.meta.url)), root=resolve(base,'..'), out=resolve(base,'dist');
await mkdir(resolve(out,'assets'),{recursive:true});
for(const file of ['index.html','site.css','editorial.css','journey.css','brand-motion.css','partners.css','partner-strip.css','partner-strip.js','partner-feed.js','site.js','icons.js','content.js','journey.js','journey-copy.js','brand-motion.js']) await copyFile(resolve(base,file),resolve(out,file));
// Only public connection settings are emitted. No session or service-role key.
let localEnv={};
try{localEnv=parseEnv(await readFile(resolve(root,'.env.local'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const env={...localEnv,...process.env};
const partnerConfig={url:env.EXPO_PUBLIC_SUPABASE_URL,key:env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY};
if(!partnerConfig.url?.startsWith('https://')||!partnerConfig.key)throw new Error('Public Supabase website configuration missing');
let publicKey=partnerConfig.key.startsWith('sb_publishable_');
if(!publicKey){try{publicKey=JSON.parse(Buffer.from(partnerConfig.key.split('.')[1],'base64url').toString()).role==='anon';}catch{}}
if(!publicKey)throw new Error('Website requires a publishable or anon key');
partnerConfig.url=partnerConfig.url.replace(/\/$/,'');
await writeFile(resolve(out,'partner-config.js'),`export const partnerConfig=${JSON.stringify(partnerConfig)};\n`);
const assets={
 'help-rose.jpg':'assets/help-rose/help-rose-poster.jpg',
 'help-rose.mp4':'assets/help-rose/help-rose-loop.mp4',
 'brand.png':'previews/home-motion/assets/brand.png',
 'road.png':'previews/home-motion/assets/road-header.png',
 'help.png':'previews/home-motion/assets/help-3d-poster.png',
 'help.mp4':'previews/home-motion/assets/help-3d.mp4',
 'helpers.png':'previews/home-motion/assets/helper-3d-poster.png',
 'helpers.mp4':'previews/home-motion/assets/helper-3d.mp4',
 'perks.png':'previews/home-motion/assets/perks/header-people-motion-v3-poster.png',
 'perks.mp4':'previews/home-motion/assets/perks/header-people-motion-v3.mp4',
 'gift.png':'src/components/dock-assets/gift.png',
 'hands.png':'src/components/dock-assets/activity.png',
 'person.png':'src/components/dock-assets/account.png',
 'battery.png':'previews/home-motion/requester/assets/battery.png',
 'battery.mp4':'previews/home-motion/requester/assets/battery.mp4',
 'fuel.png':'previews/home-motion/requester/assets/fuel.png',
 'fuel.mp4':'previews/home-motion/requester/assets/fuel.mp4',
 'tire.png':'previews/home-motion/requester/assets/tire.png',
 'tire.mp4':'previews/home-motion/requester/assets/tire.mp4',
 'other.png':'previews/home-motion/requester/assets/other.png',
 'other.mp4':'previews/home-motion/requester/assets/other.mp4',
 'camera.png':'previews/home-motion/requester/assets/details-camera.png',
 'accepted.png':'previews/home-motion/requester/assets/accepted.png',
 'ar-regular.ttf':'node_modules/@expo-google-fonts/tajawal/400Regular/Tajawal_400Regular.ttf',
 'ar-bold.ttf':'node_modules/@expo-google-fonts/tajawal/700Bold/Tajawal_700Bold.ttf',
 'ar-extra.ttf':'node_modules/@expo-google-fonts/tajawal/800ExtraBold/Tajawal_800ExtraBold.ttf',
 'en-regular.ttf':'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
 'en-bold.ttf':'node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
 'he-regular.ttf':'node_modules/@expo-google-fonts/noto-sans-hebrew/400Regular/NotoSansHebrew_400Regular.ttf',
 'he-bold.ttf':'node_modules/@expo-google-fonts/noto-sans-hebrew/700Bold/NotoSansHebrew_700Bold.ttf',
 'TAJAWAL-LICENSE.txt':'node_modules/@expo-google-fonts/tajawal/LICENSE_FONT',
 'INTER-LICENSE.txt':'node_modules/@expo-google-fonts/inter/LICENSE_FONT',
 'HEBREW-LICENSE.txt':'node_modules/@expo-google-fonts/noto-sans-hebrew/LICENSE_FONT',
 'LUCIDE-LICENSE.txt':'website/vendor/icons/LUCIDE-LICENSE.txt',
 'SIMPLE-ICONS-LICENSE.txt':'website/vendor/icons/SIMPLE-ICONS-LICENSE.txt',
 'ICON-LICENSE.md':'src/components/dock-assets/README.md',
 'THREE-LICENSE.txt':'previews/home-motion/assets/perks/vendor/THREE-LICENSE.txt'
};
await Promise.all(Object.entries(assets).map(([to,from])=>copyFile(resolve(root,from),resolve(out,'assets',to))));
await writeFile(resolve(out,'legal.json'),JSON.stringify({contact:LEGAL_CONTACT,updated:LEGAL_LAST_UPDATED,privacy:privacyPolicyBlocks,terms:termsOfUseBlocks}));
await build({entryPoints:[resolve(root,'src/features/home/rewardsGiftScene.web.ts')],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof',outfile:resolve(out,'gift-scene.js')});
await build({entryPoints:[resolve(base,'experience.js')],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,charset:'utf8',legalComments:'eof',outfile:resolve(out,'experience.js')});
await copyFile(resolve(base,'node_modules/motion/LICENSE.md'),resolve(out,'assets/MOTION-LICENSE.txt'));
const html=await readFile(resolve(base,'index.html'),'utf8');
for(const page of ['privacy','terms','delete-account','licenses']) await writeFile(resolve(out,page+'.html'),html);
console.log('AKHOO website ready: '+out+' — approved app assets and three languages.');
