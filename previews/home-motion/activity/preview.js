/* Isolated, fixed-date sample activity. No account/API/storage access. */
const DEMO_NOW = new Date('2026-10-16T18:00:00+03:00').getTime();
const DAY = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 6;
const rangeLabels = {'7':'آخر 7 أيام','30':'آخر 30 يوم','90':'آخر 90 يوم',all:'كل الفترات'};
const typeLabels = {given:'قدّمت مساعدة',received:'طلبت مساعدة',points:'نقاط مكتسبة'};
const iconNames = {given:'hands',received:'battery',points:'trophy'};
const tabs = [...document.querySelectorAll('[role="tab"]')];
const feed = document.querySelector('#activity-feed');
const rangeDialog = document.querySelector('#duration-dialog');
const entryDialog = document.querySelector('#entry-dialog');
const infoDialog = document.querySelector('#info-dialog');
const loadMore = document.querySelector('#load-more');
const timeFormat = new Intl.DateTimeFormat('ar-PS-u-nu-latn',{hour:'numeric',minute:'2-digit',timeZone:'Asia/Jerusalem'});
const dateFormat = new Intl.DateTimeFormat('ar-PS-u-nu-latn',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jerusalem'});
const entries = [
  {id:'DEMO-101',type:'points',service:'شحن بطارية',status:'completed',points:10,at:'2026-10-16T16:10:00+03:00'},
  {id:'DEMO-102',type:'given',service:'شحن بطارية',status:'completed',at:'2026-10-16T16:08:00+03:00'},
  {id:'DEMO-103',type:'given',service:'تزويد وقود',status:'completed',at:'2026-10-15T12:25:00+03:00'},
  {id:'DEMO-104',type:'points',service:'تبديل إطار',status:'completed',points:10,at:'2026-10-12T10:50:00+03:00'},
  {id:'DEMO-105',type:'given',service:'تبديل إطار',status:'completed',at:'2026-10-12T10:48:00+03:00'},
  {id:'DEMO-106',type:'received',service:'شحن بطارية',status:'cancelled',at:'2026-10-04T12:23:00+03:00'},
  {id:'DEMO-107',type:'points',service:'شحن بطارية',status:'completed',points:10,at:'2026-10-02T15:42:00+03:00'},
  {id:'DEMO-108',type:'given',service:'شحن بطارية',status:'completed',at:'2026-10-02T15:40:00+03:00'},
  {id:'DEMO-109',type:'received',service:'تزويد وقود',status:'completed',at:'2026-09-29T09:15:00+03:00'},
  {id:'DEMO-110',type:'given',service:'تزويد وقود',status:'completed',at:'2026-09-01T11:10:00+03:00'},
  {id:'DEMO-111',type:'received',service:'شحن بطارية',status:'completed',at:'2026-08-01T17:30:00+03:00'},
  {id:'DEMO-112',type:'given',service:'مشكلة أخرى',status:'completed',at:'2026-06-12T14:00:00+03:00'}
];
let filter = 'all';
let range = '30';
let limit = PAGE_SIZE;
const openers = new WeakMap();

function el(tag,className,text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function icon(name,className) {
  if (['hands','battery','fuel','trophy'].includes(name)) {
    const image = el('img',className);
    image.src = 'assets/icons/'+name+'.png';
    image.alt = '';
    image.width = 32;
    image.height = 32;
    image.draggable = false;
    return image;
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg','use');
  svg.setAttribute('aria-hidden','true');
  if (className) svg.setAttribute('class',className);
  use.setAttribute('href','#'+name);
  svg.append(use);
  return svg;
}
function statusLabel(entry) { return entry.status === 'cancelled' ? 'ملغي' : 'مكتملة'; }
function entryIcon(entry) { return entry.type === 'received' && entry.service === 'تزويد وقود' ? 'fuel' : iconNames[entry.type]; }
function filteredEntries() {
  const cutoff = range === 'all' ? -Infinity : DEMO_NOW - Number(range) * DAY;
  return entries.filter(entry => (filter === 'all' || entry.type === filter) && new Date(entry.at).getTime() >= cutoff);
}
function openDialog(dialog,opener) {
  openers.set(dialog,opener || document.activeElement);
  dialog.showModal();
}
function showEntry(entry,opener) {
  const detailIcon = document.querySelector('#entry-icon');
  detailIcon.className = 'entry-detail-icon tone-'+entry.type;
  detailIcon.replaceChildren(icon(entryIcon(entry)));
  document.querySelector('#entry-title').textContent = typeLabels[entry.type];
  document.querySelector('#entry-subtitle').textContent = entry.type === 'points' ? 'نقاط مقابل إتمام المساعدة والتحقق منها' : entry.service;
  const facts = document.querySelector('#entry-facts');
  facts.replaceChildren();
  const rows = [
    ['الحالة',entry.type === 'points' ? 'أُضيفت النقاط' : statusLabel(entry)],
    ['نوع المساعدة',entry.service],
    ['التاريخ',dateFormat.format(new Date(entry.at))],
    ['الوقت',timeFormat.format(new Date(entry.at))],
    ['رقم النشاط',entry.id]
  ];
  if (entry.type === 'points') rows.splice(1,0,['النقاط المكتسبة',entry.points+' نقاط']);
  rows.forEach(([label,value]) => { const row = el('div'); row.append(el('dt','',label),el('dd','',value)); facts.append(row); });
  openDialog(entryDialog,opener);
}
function createEntry(entry) {
  const li = el('li');
  const button = el('button','feed-entry');
  button.type = 'button';
  button.dataset.entryId = entry.id;
  const badge = el('span','feed-icon tone-'+entry.type);
  badge.append(icon(entryIcon(entry)));
  const copy = el('span','feed-copy');
  copy.append(el('span','feed-title',typeLabels[entry.type]),el('span','feed-subtitle',entry.type === 'points' ? 'إتمام المساعدة · '+entry.service : entry.service));
  const side = el('span','feed-side');
  const status = el('span','status'+(entry.type === 'points' ? ' status-points' : entry.status === 'cancelled' ? ' status-cancelled' : ''));
  if (entry.type === 'points') { const amount = el('bdi','', '+'+entry.points); amount.dir = 'ltr'; status.append(amount,' نقاط'); }
  else status.textContent = statusLabel(entry);
  const time = el('time','',timeFormat.format(new Date(entry.at)));
  time.dateTime = entry.at;
  side.append(status,time);
  button.append(badge,copy,side,icon('arrow','feed-chevron'));
  button.addEventListener('click',() => showEntry(entry,button));
  li.append(button);
  return li;
}
function render({announce = false} = {}) {
  const matches = filteredEntries();
  tabs.forEach(tab => { const active = tab.dataset.filter === filter; tab.setAttribute('aria-selected',String(active)); tab.tabIndex = active ? 0 : -1; });
  document.querySelectorAll('.stat').forEach(stat => stat.setAttribute('aria-pressed',String(stat.dataset.filter === filter)));
  document.querySelector('#feed-panel').setAttribute('aria-labelledby','tab-'+filter);
  document.querySelector('#duration-label').textContent = rangeLabels[range];
  document.querySelector('#result-count').textContent = 'النشاطات: '+matches.length;
  const fragment = document.createDocumentFragment();
  let currentDay;
  let list;
  matches.slice(0,limit).forEach(entry => {
    const day = entry.at.slice(0,10);
    if (day !== currentDay) {
      currentDay = day;
      const label = day === '2026-10-16' ? 'اليوم' : day === '2026-10-15' ? 'أمس' : dateFormat.format(new Date(entry.at));
      const section = el('section','day-group');
      const heading = el('h3','day-heading',label);
      heading.id = 'day-'+day;
      section.setAttribute('aria-labelledby',heading.id);
      list = el('ul','day-entries');
      section.append(heading,list);
      fragment.append(section);
    }
    list.append(createEntry(entry));
  });
  feed.replaceChildren(fragment);
  document.querySelector('#empty-state').hidden = matches.length !== 0;
  loadMore.hidden = matches.length <= limit;
  if (announce) document.querySelector('#announcement').textContent = 'عدد النشاطات '+matches.length+'، '+rangeLabels[range];
}
function changeView(nextFilter,nextRange) {
  if (nextFilter === filter && nextRange === range) return;
  filter = nextFilter; range = nextRange; limit = PAGE_SIZE;
  const url = new URL(location.href);
  url.search = '';
  if (filter !== 'all') url.searchParams.set('filter',filter);
  if (range !== '30') url.searchParams.set('range',range);
  history.pushState(null,'',url);
  render({announce:true});
}
function readRoute() {
  const params = new URLSearchParams(location.search);
  filter = ['all','given','received','points'].includes(params.get('filter')) ? params.get('filter') : 'all';
  range = Object.hasOwn(rangeLabels,params.get('range')) ? params.get('range') : '30';
  limit = PAGE_SIZE;
  document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
  render();
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click',() => changeView(button.dataset.filter,range)));
tabs.forEach((tab,index) => tab.addEventListener('keydown',event => {
  let next;
  if (event.key === 'ArrowLeft') next = (index+1)%tabs.length;
  else if (event.key === 'ArrowRight') next = (index+tabs.length-1)%tabs.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = tabs.length-1;
  else return;
  event.preventDefault();
  changeView(tabs[next].dataset.filter,range);
  tabs[next].focus();
}));
document.querySelector('#duration-button').addEventListener('click',event => {
  document.querySelectorAll('[name="duration"]').forEach(input => { input.checked = input.value === range; });
  event.currentTarget.setAttribute('aria-expanded','true');
  openDialog(rangeDialog,event.currentTarget);
});
rangeDialog.addEventListener('close',() => document.querySelector('#duration-button').setAttribute('aria-expanded','false'));
document.querySelector('#duration-form').addEventListener('submit',event => {
  event.preventDefault();
  const selected = new FormData(event.currentTarget).get('duration');
  if (Object.hasOwn(rangeLabels,selected)) changeView(filter,selected);
  rangeDialog.close();
});
document.querySelector('#show-all-time').addEventListener('click',() => { changeView(filter,'all'); document.querySelector('#duration-button').focus({preventScroll:true}); });
loadMore.addEventListener('click',() => {
  const firstNew = filteredEntries()[limit];
  limit += PAGE_SIZE;
  render({announce:true});
  if (firstNew) document.querySelector('[data-entry-id="'+firstNew.id+'"]').focus({preventScroll:true});
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click',() => document.getElementById(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close',() => { const opener = openers.get(dialog); if (opener?.isConnected) opener.focus({preventScroll:true}); });
  dialog.addEventListener('click',event => { const r = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom)) dialog.close(); });
});
document.querySelector('#level-info').addEventListener('click',event => {
  document.querySelector('#info-title').textContent = 'كل مساعدة بترفع مستواك';
  const content = document.querySelector('#info-content');
  const list = el('ul','tier-list');
  [['برونزي','5 مساعدات'],['فضي','15 مساعدة'],['ذهبي','30 مساعدة'],['أخضر','60 مساعدة']].forEach(([name,count]) => { const item = el('li',name === 'فضي' ? 'current' : ''); item.append(el('strong','',name),el('span','',count)); if (name === 'فضي') item.append(el('span','','مستواك الحالي')); list.append(item); });
  content.replaceChildren(el('p','','مستواك حسب مجموع المساعدات المكتملة. معك 25 مساعدة، وباقي 5 للمستوى الذهبي.'),list);
  openDialog(infoDialog,event.currentTarget);
});
document.querySelectorAll('[data-info]').forEach(button => button.addEventListener('click',() => {
  if (button.dataset.info === 'account') { window.location.assign('../account/'); return; }
  document.querySelector('#info-title').textContent = 'مزايا أخو';
  document.querySelector('#info-content').replaceChildren(el('p','','من هون بتوصل لعروض مزايا أخو. هاي معاينة محلية لشكل الشريط، وما بتغيّر رصيد النقاط.'));
  openDialog(infoDialog,button);
}));
document.querySelector('#activity-nav').addEventListener('click',() => window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
window.addEventListener('popstate',readRoute);
readRoute();
