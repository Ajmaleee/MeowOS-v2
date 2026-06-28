/* ═══════════════════════════════════════════════════
   CatOS 2.0 — script.js
═══════════════════════════════════════════════════ */

/* ── STORAGE HELPERS ─────────────────────────── */
const LS = {
  get: (k, def) => { try { const v=localStorage.getItem(k); return v===null?def:JSON.parse(v); } catch(e){ return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} },
};

/* ── SOUND ENGINE ────────────────────────────── */
const SND = {
  play(id){ try{ const a=document.getElementById('snd-'+id); if(a){a.currentTime=0;a.volume=LS.get('snd-vol',0.5);a.play().catch(()=>{});} }catch(e){} },
  purr(on){ try{ const a=document.getElementById('snd-purr'); if(!a)return; a.volume=0.15; on?a.play().catch(()=>{}):a.pause(); }catch(e){} }
};

/* ── BOOT / WELCOME ──────────────────────────── */
const BOOT_MSGS = [
  'Waking up the cat...','Loading purr engine...','Fluffing the desktop...',
  'Fetching fish from memory...','Calibrating whisker sensors...','Almost ready...'
];
let bootIdx = 0;
const $fill = document.getElementById('wProgressFill');
const $stat = document.getElementById('wStatus');

function bootStep(){
  const pct = Math.round((bootIdx/(BOOT_MSGS.length-1))*100);
  $fill.style.width = pct+'%';
  $stat.textContent = BOOT_MSGS[bootIdx];
  bootIdx++;
  if(bootIdx < BOOT_MSGS.length){ setTimeout(bootStep, 500+Math.random()*180); }
  else { setTimeout(finishBoot, 700); }
}
setTimeout(bootStep, 300);

function finishBoot(){
  const ws = document.getElementById('welcome-screen');
  ws.style.transition='opacity 0.7s'; ws.style.opacity='0';
  setTimeout(()=>{ ws.remove(); document.getElementById('desktop').classList.remove('hidden'); onDesktopReady(); }, 700);
}

function onDesktopReady(){
  startClock();
  loadWallpaper();
  buildWpPresets();
  startNotifSchedule();
  SND.play('meow');
  setTimeout(()=>SND.purr(true), 1500);
  setTimeout(()=>SND.purr(false), 4000);

  if(!LS.get('catos-onboarded', false)){
    setTimeout(()=>swShow(), 450);
  } else {
    swWelcomed = true;
    toast('🐾 Welcome to CatOS 2.0!');
    setTimeout(()=>openApp('aboutme'), 900);
  }
}

/* ══════════════════════════════════════════════════
   SHIPWRIGHT ONBOARDING — ask / tour / checklist
══════════════════════════════════════════════════ */
let swWelcomed = false;

function swMarkOnboarded(){ LS.set('catos-onboarded', true); }

function swShow(){
  document.getElementById('sw-overlay').classList.remove('hidden');
  document.getElementById('sw-step-ask').classList.remove('hidden');
  document.getElementById('sw-step-path').classList.add('hidden');
}
function swHide(){
  document.getElementById('sw-overlay').classList.add('hidden');
}
function swWelcomeToast(){
  if(swWelcomed) return;
  swWelcomed = true;
  toast('🐾 Welcome to CatOS 2.0! Happy shipwrighting ⚓');
  setTimeout(()=>{ if(!openWins['aboutme']) openApp('aboutme'); }, 500);
}
function swSkip(){
  swMarkOnboarded();
  swHide();
  swWelcomeToast();
}
function swChoose(isShipwright){
  if(!isShipwright){
    swMarkOnboarded();
    swHide();
    swWelcomeToast();
    return;
  }
  document.getElementById('sw-step-ask').classList.add('hidden');
  document.getElementById('sw-step-path').classList.remove('hidden');
}
function swStartTour(){
  swMarkOnboarded();
  swHide();
  tourStart();
}
function swOpenChecklist(){
  swMarkOnboarded();
  swHide();
  checklistOpen();
}
/* Re-open the path picker later (e.g. from Settings > About) */
function swRelaunch(){
  document.getElementById('sw-overlay').classList.remove('hidden');
  document.getElementById('sw-step-ask').classList.add('hidden');
  document.getElementById('sw-step-path').classList.add('hidden');
  document.getElementById('sw-step-tourdone').classList.add('hidden');
  document.getElementById('sw-step-path').classList.remove('hidden');
}

/* Shown right after the tour finishes (or is skipped) — offers the checklist */
function swShowTourDone(){
  document.getElementById('sw-overlay').classList.remove('hidden');
  document.getElementById('sw-step-ask').classList.add('hidden');
  document.getElementById('sw-step-path').classList.add('hidden');
  document.getElementById('sw-step-tourdone').classList.remove('hidden');
}
function swOpenChecklistFromTour(){
  swHide();
  checklistOpen();
}

/* ── GUIDED TOUR ──────────────────────────────── */
const TOUR_STEPS = [
  { sel:'#dock',                                title:'🐾 The Dock',     text:'Quick access to every app. Click an icon to open it — click again to minimize.' },
  { sel:'#top-bar',                              title:'🔔 Top Bar',      text:'Notifications and Settings live here, alongside a live clock.' },
  { sel:'.dock-item:first-child .dock-icon-wrap',title:'☰ Start Menu',    text:'Click the MeowOS logo to open the Start Menu and search every app.' },
  { sel:'#desktop-icons',                        title:'🖥️ Desktop Icons',text:'Double-click any icon here to launch the same apps as the dock.' },
  { sel:'.dock-item[data-app="aboutme"]',        title:'👤 About Me',     text:'Curious who built this? This opens the creator profile and links.' },
  { sel:'#dock',                                 title:'⚓ That\'s it!',   text:'Explore freely from here — right-click the desktop to try the wallpaper customizer. Happy shipwrighting!' },
];
let tourIdx = 0;

function tourStart(){
  tourIdx = 0;
  document.getElementById('tour-overlay').classList.remove('hidden');
  tourRender();
}
function tourRender(){
  const step = TOUR_STEPS[tourIdx];
  const el = document.querySelector(step.sel);
  const spot = document.getElementById('tour-spot');
  const tip = document.getElementById('tour-tip');
  if(el){
    const r = el.getBoundingClientRect();
    const pad = 10;
    spot.style.left   = (r.left - pad) + 'px';
    spot.style.top    = (r.top - pad) + 'px';
    spot.style.width  = (r.width + pad*2) + 'px';
    spot.style.height = (r.height + pad*2) + 'px';

    const tipW = Math.min(290, window.innerWidth - 24);
    let tipLeft = r.left + r.width/2 - tipW/2;
    tipLeft = Math.max(12, Math.min(tipLeft, window.innerWidth - tipW - 12));
    let tipTop = r.top - 168;
    if(tipTop < 50) tipTop = Math.min(r.bottom + 18, window.innerHeight - 200);
    tip.style.left  = tipLeft + 'px';
    tip.style.top   = tipTop + 'px';
    tip.style.width = tipW + 'px';
  }
  document.getElementById('tour-step-num').textContent = (tourIdx+1)+' / '+TOUR_STEPS.length;
  document.getElementById('tour-tip-title').textContent = step.title;
  document.getElementById('tour-tip-text').textContent = step.text;
  document.getElementById('tour-back-btn').style.visibility = tourIdx===0 ? 'hidden' : 'visible';
  document.getElementById('tour-next-btn').textContent = tourIdx===TOUR_STEPS.length-1 ? 'Finish ✓' : 'Next ▶';
}
function tourNext(){
  if(tourIdx >= TOUR_STEPS.length-1){ tourEnd(); return; }
  tourIdx++; tourRender();
}
function tourBack(){ if(tourIdx>0){ tourIdx--; tourRender(); } }
function tourSkip(){ tourEnd(); }
function tourEnd(){
  document.getElementById('tour-overlay').classList.add('hidden');
  swShowTourDone();
}
window.addEventListener('resize', ()=>{
  if(!document.getElementById('tour-overlay').classList.contains('hidden')) tourRender();
});

/* ── MANUAL CHECKLIST (floating, non-blocking) ── */
const CHECKLIST_ITEMS = [
  { id:'start',     label:'Open the Start Menu',                         app:null },
  { id:'wallpaper', label:'Change the wallpaper (right-click desktop)',  app:null },
  { id:'wp3',       label:'Try the Candy Sky cat customizer',            app:null },
  { id:'memes',     label:'Browse the Meme Gallery',                     app:'memes' },
  { id:'browser',   label:'Open PurrFox and visit a shortcut',           app:'browser' },
  { id:'notepad',   label:'Write a note in Pawpad',                      app:'notepad' },
  { id:'music',     label:'Play a track in MeowTunes',                   app:'music' },
  { id:'paint',     label:'Draw something in CatPaint',                  app:'paint' },
  { id:'terminal',  label:'Run a command in CatShell',                   app:'terminal' },
  { id:'files',     label:'Browse Fur Files',                            app:'files' },
  { id:'calculator',label:'Do some math in Calc-Cat',                    app:'calculator' },
  { id:'game',      label:'Play Catch the Yarn',                         app:'game' },
  { id:'calendar',  label:'Check PurrPlanner events',                    app:'calendar' },
  { id:'chat',      label:'Send a message in MeowChat',                  app:'chat' },
  { id:'reels',     label:'Scroll through PawGram reels',                app:'reels' },
  { id:'settings',  label:'Look through the Settings tabs',              app:'settings' },
  { id:'aboutme',   label:'Check out About Me',                          app:'aboutme' },
];

function checklistOpen(){
  renderChecklist();
  document.getElementById('checklist-fab').classList.add('hidden');
  document.getElementById('checklist-panel').classList.remove('hidden');
}
function checklistExpand(){
  document.getElementById('checklist-fab').classList.add('hidden');
  document.getElementById('checklist-panel').classList.remove('hidden');
}
function checklistMinimize(){
  document.getElementById('checklist-panel').classList.add('hidden');
  document.getElementById('checklist-fab').classList.remove('hidden');
}
function checklistClose(){
  document.getElementById('checklist-panel').classList.add('hidden');
  document.getElementById('checklist-fab').classList.add('hidden');
  swWelcomeToast();
}
function getChecklistState(){ return LS.get('catos-checklist', {}); }
function setChecklistState(s){ LS.set('catos-checklist', s); }
function checklistToggle(id){
  const s = getChecklistState();
  s[id] = !s[id];
  setChecklistState(s);
  renderChecklist();
  SND.play('click');
}
function checklistReset(){
  setChecklistState({});
  renderChecklist();
}
function renderChecklist(){
  const s = getChecklistState();
  const list = document.getElementById('checklist-list');
  if(!list) return;
  list.innerHTML = CHECKLIST_ITEMS.map(it=>`
    <div class="checklist-item ${s[it.id]?'checked':''}">
      <div class="checklist-check" onclick="checklistToggle('${it.id}')">${s[it.id]?'✓':''}</div>
      <div class="checklist-label">${it.label}</div>
      ${it.app?`<button class="clay-btn sm" onclick="openApp('${it.app}')">Open</button>`:''}
    </div>`).join('');
  const total = CHECKLIST_ITEMS.length;
  const done = CHECKLIST_ITEMS.filter(it=>s[it.id]).length;
  const fill = document.getElementById('checklistProgressFill');
  const label = document.getElementById('checklistProgressLabel');
  if(fill) fill.style.width = (total ? (done/total*100) : 0) + '%';
  if(label) label.textContent = `${done} / ${total} checked`;
}

/* ── CLOCK ───────────────────────────────────── */
function startClock(){
  const tick=()=>{
    const n=new Date();
    const h=String(n.getHours()).padStart(2,'0');
    const m=String(n.getMinutes()).padStart(2,'0');
    const s=String(n.getSeconds()).padStart(2,'0');
    document.getElementById('taskbar-clock').textContent=`${h}:${m}:${s}`;
  };
  tick(); setInterval(tick, 1000);
}

/* ── WALLPAPER ───────────────────────────────── */
const WP_PRESETS = [
  { name:'Purple Dream', src:'assets/images/wp1.jpg' },
  { name:'Night Forest', src:'assets/images/wp2.jpg' },
  { name:'Candy Sky',    src:'assets/images/wp3.jpg', customizable:true },
  { name:'Cat Cafe',     src:'assets/images/wp4.jpg' },
  { name:'Space Meow',   src:'assets/images/wp5.jpg' },
  { name:'Pastel Paws',  src:'assets/images/wp6.jpg' },
];

/* Candy Sky (wp3) cat dress-up options.
   Each entry is a FULL wallpaper image (the same wp3 scene with that
   accessory combo already baked into the picture). Drop the matching
   files into the project root using these exact filenames:
     wp3.jpg                              — classic / no accessories
     wp3-sunglasses.jpg                   — sunglasses only
     wp3-hat.jpg                          — hat only
     wp3-sunglasses-hat.jpg                — sunglasses + hat
     wp3-sunglasses-hat-ceiling.jpg         — sunglasses + hat + ceiling cat
     wp3-sunglasses-hat-multiceiling.jpg    — sunglasses + hat + many ceiling cats */
const WP3_VARIANTS = [
  { id:'classic',                     label:'Classic',          emoji:'🐱',     src:'assets/images/wp3.jpg' },
  { id:'sunglasses',                   label:'Sunglasses',       emoji:'😎',     src:'assets/images/wp3-sunglasses.jpg' },
  { id:'hat',                          label:'Hat Only',         emoji:'🎩',     src:'assets/images/wp3-hat.jpg' },
  { id:'sunglasses-hat',                label:'Sunglasses + Hat', emoji:'😎🎩',   src:'assets/images/wp3-sunglasses-hat.jpg' },
  { id:'sunglasses-hat-ceiling',         label:'+ Ceiling Cat',    emoji:'😎🎩🕳️',  src:'assets/images/wp3-sunglasses-hat-ceiling.jpg' },
  { id:'sunglasses-hat-multiceiling',    label:'+ Many Ceilings',  emoji:'😎🎩🐾',  src:'assets/images/wp3-sunglasses-hat-multiceiling.jpg' },
];

function loadWallpaper(){
  // wp1 ("Purple Dream") is always the default until the user picks something else.
  const saved = LS.get('catos-wallpaper', null);
  applyWallpaper(saved || 'assets/images/wp3.jpg');
}
function applyWallpaper(src){
  const desk = document.getElementById('desktop');
  if(src.startsWith('data:image/gif') || src.endsWith('.gif')){
    desk.style.backgroundImage = 'none';
    let gifBg = document.getElementById('desktop-gif-bg');
    if(!gifBg){
      gifBg = document.createElement('img');
      gifBg.id = 'desktop-gif-bg';
      gifBg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none;';
      desk.insertBefore(gifBg, desk.firstChild);
    }
    gifBg.src = src;
    gifBg.style.display = 'block';
  } else {
    const gifBg = document.getElementById('desktop-gif-bg');
    if(gifBg) gifBg.style.display = 'none';
    desk.style.backgroundImage = `url('${src}')`;
  }
  LS.set('catos-wallpaper', src);
}
function buildWpPresets(){
  const grid = document.getElementById('wp-presets');
  if(!grid) return;
  grid.innerHTML = '';
  const currentSrc = LS.get('catos-wallpaper', 'assets/images/wp3.jpg') || 'assets/images/wp3.jpg';
  WP_PRESETS.forEach(wp=>{
    const d=document.createElement('div');
    d.className='wp-preset-thumb'+(wp.customizable?' wp-special':'');
    const isActive = currentSrc===wp.src || (wp.customizable && currentSrc.startsWith('wp3'));
    if(isActive) d.classList.add('selected');
    d.innerHTML=`<img src="${wp.src}" onerror="this.parentElement.style.background='var(--c-surface2)'"/>
      <span>${wp.name}</span>
      ${wp.customizable?'<div class="wp-special-badge">✨ Dress up</div>':''}`;
    d.onclick=()=>{
      if(wp.customizable){ openWp3Customizer(); return; }
      applyWallpaper(wp.src);
      document.querySelectorAll('.wp-preset-thumb').forEach(t=>t.classList.remove('selected'));
      d.classList.add('selected');
      toast('🖼️ Wallpaper changed!');
      closeWpPicker();
    };
    grid.appendChild(d);
  });
}

/* ── WP3 CANDY-SKY CAT CUSTOMIZER ─────────────── */
function openWp3Customizer(){
  document.getElementById('wp-presets')?.classList.add('hidden');
  document.getElementById('wp-upload-row')?.classList.add('hidden');
  const panel=document.getElementById('wp3-customize-panel');
  if(!panel) return;
  panel.classList.remove('hidden');

  const vgrid=document.getElementById('wp3-variant-grid');
  if(vgrid && !vgrid.dataset.built){
    vgrid.innerHTML = WP3_VARIANTS.map(v=>`
      <div class="wp3-variant-card" data-id="${v.id}" onclick="selectWp3Variant('${v.id}')">
        <img src="${v.src}" onerror="this.parentElement.style.background='var(--c-surface2)'"/>
        <div class="wp3-variant-emoji">${v.emoji}</div>
        <span>${v.label}</span>
      </div>`).join('');
    vgrid.dataset.built='1';
  }
  const savedVariant = LS.get('catos-wp3-variant','classic');
  vgrid?.querySelectorAll('.wp3-variant-card').forEach(c=>c.classList.toggle('selected', c.dataset.id===savedVariant));
}
function wp3BackToPresets(){
  document.getElementById('wp3-customize-panel')?.classList.add('hidden');
  document.getElementById('wp-presets')?.classList.remove('hidden');
  document.getElementById('wp-upload-row')?.classList.remove('hidden');
}
function selectWp3Variant(id){
  const v=WP3_VARIANTS.find(x=>x.id===id); if(!v) return;
  applyWallpaper(v.src);
  LS.set('catos-wp3-variant', id);
  document.querySelectorAll('.wp3-variant-card').forEach(c=>c.classList.toggle('selected', c.dataset.id===id));
  toast(`${v.emoji} ${v.label} applied!`);
  SND.play('click');
  closeWpPicker();
}

function handleWpUpload(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{ applyWallpaper(ev.target.result); toast('🖼️ Custom wallpaper set!'); closeWpPicker(); };
  reader.readAsDataURL(file);
}
function openWallpaperPicker(){
  buildWpPresets();
  document.getElementById('wp-picker').classList.remove('hidden');
  hideCtx();
}
function closeWpPicker(){
  document.getElementById('wp-picker').classList.add('hidden');
  wp3BackToPresets();
}

/* ── TOAST ───────────────────────────────────── */
const notifs = [];
function toast(msg, dur=3200){
  const el=document.createElement('div'); el.className='toast'; el.textContent=msg;
  document.getElementById('toaster').appendChild(el);
  setTimeout(()=>el.remove(), dur);
  addNotification(msg);
}

/* ── NOTIFICATIONS ───────────────────────────── */
function addNotification(msg){
  notifs.unshift({ msg, time: new Date().toLocaleTimeString() });
  if(notifs.length>30) notifs.pop();
  const badge=document.getElementById('notif-badge');
  if(badge){ badge.textContent=notifs.length; badge.classList.toggle('hidden', notifs.length===0); }
}
function clearNotifs(){
  notifs.length=0;
  const badge=document.getElementById('notif-badge');
  if(badge) badge.classList.add('hidden');
  renderNotifs();
}
function renderNotifs(){
  const list=document.getElementById('notif-list'); if(!list) return;
  list.innerHTML = notifs.length
    ? notifs.map(n=>`<div class="notif-item"><div class="notif-icon-wrap">🐾</div><div><div class="notif-text">${n.msg}</div><div class="notif-time">${n.time}</div></div></div>`).join('')
    : '<div style="padding:14px;color:var(--c-text3);font-size:0.82rem;font-weight:700">No notifications — all cats napping.</div>';
}
function startNotifSchedule(){
  const msgs=[
    [3000,'😺 Whiskers wants to chat!'],
    [8000,'🧶 Yarn detected in the living room'],
    [16000,'🐟 Treat time reminder'],
    [26000,'😹 New meme uploaded to PurrBook'],
    [40000,'⚙️ CatOS update: v2.0.1 (more cats)'],
  ];
  msgs.forEach(([d,m])=>setTimeout(()=>{ toast(m); SND.play('notif'); }, d));
}

/* ── CONTEXT MENU ────────────────────────────── */
document.getElementById('desktop').addEventListener('contextmenu', e=>{
  e.preventDefault();
  const m=document.getElementById('context-menu');
  m.style.left=Math.min(e.clientX, window.innerWidth-200)+'px';
  m.style.top=Math.min(e.clientY, window.innerHeight-200)+'px';
  m.classList.remove('hidden');
});
document.addEventListener('click', e=>{
  if(!document.getElementById('context-menu').contains(e.target)) hideCtx();
});
function hideCtx(){ document.getElementById('context-menu').classList.add('hidden'); }

/* ── START MENU ──────────────────────────────── */
function toggleStartMenu(){ document.getElementById('start-menu').classList.toggle('hidden'); SND.play('click'); }
function closeStartMenu(){ document.getElementById('start-menu').classList.add('hidden'); }
document.getElementById('start-grid').querySelectorAll('.start-item').forEach(item=>{
  item.addEventListener('click', ()=>{ openApp(item.dataset.app); closeStartMenu(); SND.play('click'); });
});
document.addEventListener('click', e=>{
  const sm=document.getElementById('start-menu');
  const logo=document.querySelector('.dock-item');
  if(!sm.contains(e.target) && e.target!==logo && !(logo&&logo.contains(e.target))) sm.classList.add('hidden');
});
function filterStartApps(q){
  const lc=q.toLowerCase();
  document.querySelectorAll('#start-grid .start-item').forEach(item=>{
    item.style.display = item.querySelector('small').textContent.toLowerCase().includes(lc) ? '' : 'none';
  });
}

/* ── WINDOWS ENGINE ──────────────────────────── */
let zTop=200;
const openWins={};

const APP_META={
  memes:        { title:'Meme Gallery',    icon:'assets/icons/gallery.png',  w:640, h:520 },
  browser:      { title:'PurrFox',         icon:'assets/icons/browser.png',  w:740, h:540 },
  notepad:      { title:'Pawpad',          icon:'assets/icons/notepad.png',  w:560, h:430 },
  music:        { title:'MeowTunes',       icon:'assets/icons/music.png',    w:420, h:580 },
  paint:        { title:'CatPaint',        icon:'assets/icons/paint.png',    w:760, h:540 },
  terminal:     { title:'CatShell',        icon:'assets/icons/terminal.png', w:600, h:420 },
  files:        { title:'Fur Files',       icon:'assets/icons/files.png',    w:600, h:440 },
  calculator:   { title:'Calc-Cat',        icon:'assets/icons/calc.png',     w:300, h:500 },
  game:         { title:'Catch Yarn',      icon:'assets/icons/game.png',     w:640, h:500 },
  settings:     { title:'Settings',        icon:'assets/icons/settings.png', w:540, h:440 },
  calendar:     { title:'PurrPlanner',     icon:'assets/icons/calendar.png', w:500, h:480 },
  chat:         { title:'MeowChat',        icon:'assets/icons/chat.png',     w:640, h:460 },
  aboutme:      { title:'About Me',        icon:'assets/images/owner.jpg',    w:420, h:560 },
  notifications:{ title:'Notifications',   icon:'assets/icons/bell.png',     w:380, h:420 },
  reels:        { title:'PawGram',         icon:'assets/icons/reels.png',    w:380, h:720 },
};

function openApp(id){
  if(openWins[id]){ focusWin(id); unminimizeWin(id); return; }
  const meta=APP_META[id]; if(!meta) return;
  const tpl=document.getElementById('tpl-'+id); if(!tpl) return;
  SND.play('open');
  const win=document.createElement('div');
  win.className='window focused'; win.id='win-'+id;
  const W=Math.min(meta.w, window.innerWidth-40);
  const H=Math.min(meta.h, window.innerHeight-80);
  const off=Object.keys(openWins).length;
  win.style.width=W+'px'; win.style.height=H+'px';
  win.style.left=Math.min(60+off*22, window.innerWidth-W-20)+'px';
  win.style.top=Math.min(40+off*22, window.innerHeight-H-60)+'px';
  win.style.zIndex=++zTop;
  win.innerHTML=`
    <div class="win-titlebar" onmousedown="startDrag(event,'${id}')">
      <img class="win-icon" src="${meta.icon}" onerror="this.style.display='none'"/>
      <span class="win-title">${meta.title}</span>
      <div class="win-controls">
        <div class="win-ctrl-btn wc-close" onclick="closeWin('${id}')"></div>
        <div class="win-ctrl-btn wc-min"   onclick="minimizeWin('${id}')"></div>
        <div class="win-ctrl-btn wc-max"   onclick="maximizeWin('${id}')"></div>
      </div>
    </div>
    <div class="win-body" id="wb-${id}"></div>
    <div class="win-resize-se" onmousedown="startResize(event,'${id}')"></div>`;
  document.getElementById('windows-container').appendChild(win);
  document.getElementById('wb-'+id).appendChild(tpl.content.cloneNode(true));
  openWins[id]={ minimized:false, maxed:false, savedPos:null };
  win.addEventListener('mousedown', ()=>focusWin(id));
  addTbBtn(id, meta);
  initApp(id);
}

function focusWin(id){
  document.querySelectorAll('.window').forEach(w=>w.classList.remove('focused'));
  const win=document.getElementById('win-'+id); if(win){ win.classList.add('focused'); win.style.zIndex=++zTop; }
}
function closeWin(id){
  SND.play('close');
  const win=document.getElementById('win-'+id); if(win) win.remove();
  delete openWins[id];
  const dockItem = document.querySelector(`.dock-item[data-app="${id}"]`);
  if(dockItem){ dockItem.querySelector('.dock-dot')?.classList.add('hidden'); }
  if(id==='game') gameStop();
  if(id==='music') musicPause();
}
function minimizeWin(id){
  const win=document.getElementById('win-'+id); if(!win) return;
  win.classList.add('minimizing');
  setTimeout(()=>{ win.style.display='none'; win.classList.remove('minimizing'); }, 280);
  openWins[id].minimized=true;
}
function unminimizeWin(id){
  const win=document.getElementById('win-'+id); if(!win) return;
  win.style.display='flex'; win.classList.add('restoring');
  setTimeout(()=>win.classList.remove('restoring'), 280);
  openWins[id].minimized=false; focusWin(id);
}
function maximizeWin(id){
  const win=document.getElementById('win-'+id); if(!win) return;
  const ow=openWins[id];
  if(!ow.maxed){
    ow.savedPos={ l:win.style.left, t:win.style.top, w:win.style.width, h:win.style.height };
    win.style.left='0'; win.style.top='38px'; win.style.width='100vw'; win.style.height=(window.innerHeight-100)+'px'; ow.maxed=true;
  } else {
    const s=ow.savedPos; win.style.left=s.l; win.style.top=s.t; win.style.width=s.w; win.style.height=s.h; ow.maxed=false;
  }
}
function addTbBtn(id, meta){
  const dockItem = document.querySelector(`.dock-item[data-app="${id}"]`);
  if(dockItem){
    dockItem.querySelector('.dock-dot')?.classList.remove('hidden');
    dockItem.classList.add('bouncing');
    setTimeout(()=>dockItem.classList.remove('bouncing'), 450);
    dockItem.onclick = ()=>{
      if(openWins[id]?.minimized) unminimizeWin(id);
      else if(openWins[id]) minimizeWin(id);
      else openApp(id);
    };
  }
}

/* ── DRAG ─────────────────────────────────────── */
let drag=null;
function startDrag(e,id){
  if(e.target.classList.contains('win-ctrl-btn')) return;
  const win=document.getElementById('win-'+id); const r=win.getBoundingClientRect();
  drag={ id, ox:e.clientX-r.left, oy:e.clientY-r.top }; focusWin(id); e.preventDefault();
}
document.addEventListener('mousemove', e=>{
  if(drag){
    const win=document.getElementById('win-'+drag.id); if(!win) return;
    win.style.left=Math.max(0,Math.min(e.clientX-drag.ox, window.innerWidth-win.offsetWidth))+'px';
    win.style.top=Math.max(0,Math.min(e.clientY-drag.oy, window.innerHeight-win.offsetHeight-50))+'px';
  }
  if(resizeState){
    const win=document.getElementById('win-'+resizeState.id); if(!win) return;
    win.style.width=Math.max(280, resizeState.sw+e.clientX-resizeState.sx)+'px';
    win.style.height=Math.max(180, resizeState.sh+e.clientY-resizeState.sy)+'px';
    if(resizeState.id==='paint') resizePaintCanvas();
  }
});
document.addEventListener('mouseup', ()=>{ drag=null; resizeState=null; });

/* ── RESIZE ───────────────────────────────────── */
let resizeState=null;
function startResize(e,id){
  const win=document.getElementById('win-'+id);
  resizeState={ id, sx:e.clientX, sy:e.clientY, sw:win.offsetWidth, sh:win.offsetHeight };
  e.preventDefault(); e.stopPropagation();
}

/* ── APP INIT ─────────────────────────────────── */
function initApp(id){
  const map={
    memes:initMemes, browser:initBrowser, notepad:initNotepad, music:initMusic,
    paint:initPaint, terminal:initTerminal, files:initFiles, calculator:()=>{},
    game:()=>{}, settings:initSettings, calendar:initCalendar, chat:initChat,
    notifications:initNotifications, aboutme:initAboutMe, reels:initReels
  };
  if(map[id]) map[id]();
}

/* ══════════════════════════════════════════════════
   MEMES APP
══════════════════════════════════════════════════ */
const MEMES=[
  { img:'assets/images/meme1.jpg', top:'ONE DOES NOT SIMPLY',   bot:'IGNORE A CAT',            sub:'When the cat stares into your soul at 3am' },
  { img:'assets/images/meme2.jpg', top:'I CAN HAS',             bot:'CHEEZBURGER?',            sub:'The original. The legend. The classic.' },
  { img:'assets/images/meme3.jpg', top:'NOT SURE IF HUNGRY',    bot:'OR JUST BORED',           sub:'Cats eating for emotional reasons' },
  { img:'assets/images/meme4.jpg', top:'THIS IS FINE',          bot:'*everything is on fire*', sub:'Cat comfort level: maximum denial' },
  { img:'assets/images/meme5.jpg', top:'NOBODY:',               bot:'CAT AT 3AM: ZOOMIES',     sub:'Midnight energy is a feline superpower' },
  { img:'assets/images/meme6.jpg', top:'GRUMPY CAT SAYS',       bot:'NO. JUST NO.',            sub:'Every Monday. Forever.' },
  { img:'assets/images/meme7.jpg', top:'IN ANCIENT EGYPT',      bot:'I WAS WORSHIPPED',        sub:'Cats have not forgotten this' },
  { img:'assets/images/meme8.jpg', top:'YOU HAD ME AT',         bot:'"PSPSPSPSPS"',            sub:'Cats and the sacred summoning call' },
  { img:'assets/images/meme9.jpg', top:'SURPRISE MOTHERFLUFFER',bot:'🐾🐾🐾',                  sub:'When you open the treat cabinet' },
  { img:'assets/images/meme10.jpg',top:'HOVER CAT',             bot:'IS WATCHING YOU',         sub:'Always watching. Always judging.' },
  { img:'assets/images/meme11.jpg',top:'I SLEEP',               bot:'NOT YOUR PROBLEM',        sub:'Cat work ethic: aspirational' },
  { img:'assets/images/meme12.jpg',top:'NYAN NYAN NYAN',        bot:'NYAN NYAN NYAN NYAN',     sub:'2011 forever' },
];
let memeIdx=0;

function initMemes(){
  renderMeme(0);
  const strip=document.getElementById('meme-strip'); if(!strip) return;
  MEMES.forEach((m,i)=>{
    const b=document.createElement('div'); b.className='meme-thumb-btn'+(i===0?' active':'');
    b.innerHTML=`<img src="${m.img}" onerror="this.style.opacity=0.3"/>`;
    b.onclick=()=>renderMeme(i); strip.appendChild(b);
  });
}
function renderMeme(i){
  memeIdx=i; const m=MEMES[i];
  const img=document.getElementById('meme-img'); if(img){ img.src=m.img; img.onerror=()=>img.style.opacity='0.2'; }
  const top=document.getElementById('meme-top-text'); if(top) top.textContent=m.top;
  const bot=document.getElementById('meme-bot-text'); if(bot) bot.textContent=m.bot;
  const cap=document.getElementById('meme-caption'); if(cap) cap.textContent='💬 '+m.sub;
  const ctr=document.getElementById('meme-counter'); if(ctr) ctr.textContent=`${i+1} / ${MEMES.length}`;
  document.querySelectorAll('.meme-thumb-btn').forEach((b,j)=>b.classList.toggle('active',j===i));
}
function prevMeme(){ renderMeme((memeIdx-1+MEMES.length)%MEMES.length); }
function nextMeme(){ renderMeme((memeIdx+1)%MEMES.length); }
function shuffleMeme(){ renderMeme(Math.floor(Math.random()*MEMES.length)); }

/* ══════════════════════════════════════════════════
   PURR FOX BROWSER
══════════════════════════════════════════════════ */
const BPAGES={
  'cat://newtab': ()=>`<div class="br-newtab">
    <div class="br-newtab-logo">🐱</div>
    <h2>PurrFox — What shall we explore?</h2>
    <div class="br-search-bar">
      <input id="br-search-in" type="text" placeholder="Search the cat-web..." onkeydown="if(event.key==='Enter')browserNav('cat://search/'+this.value)"/>
      <button onclick="browserNav('cat://search/'+document.getElementById('br-search-in').value)">Search</button>
    </div>
    <div class="br-shortcuts">
      <div class="br-shortcut" onclick="browserNav('cat://news')"><img src="assets/icons/news.png" onerror="this.outerHTML='📰'"/>News</div>
      <div class="br-shortcut" onclick="browserNav('cat://social')"><img src="assets/icons/chat.png" onerror="this.outerHTML='💬'"/>PawBook</div>
      <div class="br-shortcut" onclick="browserNav('cat://wiki')"><img src="assets/icons/notepad.png" onerror="this.outerHTML='📚'"/>WikiPurrdia</div>
      <div class="br-shortcut" onclick="browserNav('cat://shop')"><img src="assets/icons/shop.png" onerror="this.outerHTML='🛍️'"/>PawMart</div>
      <div class="br-shortcut" onclick="browserNav('cat://games')"><img src="assets/icons/game.png" onerror="this.outerHTML='🎮'"/>Games</div>
      <div class="br-shortcut" onclick="browserNav('cat://weather')"><img src="assets/icons/weather.png" onerror="this.outerHTML='🌤️'"/>Weather</div>
      <div class="br-shortcut" onclick="browserNav('cat://music')"><img src="assets/icons/music.png" onerror="this.outerHTML='🎵'"/>MeowTunes</div>
      <div class="br-shortcut" onclick="browserNav('cat://mail')"><img src="assets/icons/mail.png" onerror="this.outerHTML='📧'"/>PurrMail</div>
    </div>
  </div>`,
  'cat://news': ()=>`<div class="br-page">
    <h1>📰 CatNews Daily</h1>
    <p style="color:#e040fb;font-weight:800">BREAKING: Local Cat Demands Third Breakfast — Achieves It</p>
    <h2>Top Stories</h2>
    <div class="br-card"><b>Area Cat Refuses To Move Off Keyboard</b><br>Owner forced to type around cat for 6 hours. Cat unmoved.</div>
    <div class="br-card"><b>Scientists Confirm: Cats Hear Treat Bags From 3 Floors Away</b><br>New study validates what owners always suspected.</div>
    <div class="br-card"><b>Cat Mayor Elected For Fourth Consecutive Term</b><br>Residents cite "steady purring policy" as decisive factor.</div>
    <div class="br-card"><b>International Yarn Shortage Crisis: Cats Unaware, Unbothered</b><br>"We have laser dots," notes feline spokesperson.</div>
    <span class="br-link" onclick="browserNav('cat://newtab')">← Home</span>
  </div>`,
  'cat://social': ()=>`<div class="br-page">
    <h1>🐾 PawBook</h1>
    <div class="br-card"><b>😺 Whiskers</b> posted: <i>"Knocked over the water glass. Zero regrets."</i> — 47 🐾</div>
    <div class="br-card"><b>😸 Mittens</b> shared: <i>"Found a sunbeam. This is my sunbeam now. Mine."</i> — 132 🐾</div>
    <div class="br-card"><b>😼 Chairman Meow</b> posted: <i>"The humans THINK they own this house. They are incorrect."</i> — 9.4K 🐾</div>
    <div class="br-card"><b>🌈 Nyan Cat</b> posted: <i>"nyan nyan nyan nyan nyan nyan nyan"</i> — ∞ 🐾</div>
    <div class="br-card"><b>🙀 Surprise Cat</b> posted: <i>"THEY'RE VACUUMING. ACTUALLY DOING IT."</i> — 27K 🐾</div>
    <span class="br-link" onclick="browserNav('cat://newtab')">← Home</span>
  </div>`,
  'cat://wiki': ()=>`<div class="br-page">
    <h1>📚 WikiPurrdia</h1>
    <h2>Cat (Felis catus)</h2>
    <p>The domestic cat, worshipped since ancient Egypt and confirmed ruler of the internet since 2006.</p>
    <div class="br-card"><b>Sleep:</b> 12–16 hours/day (professional grade)</div>
    <div class="br-card"><b>Purring:</b> 25–150 Hz. Therapeutic to all nearby humans.</div>
    <div class="br-card"><b>Kneading:</b> Inherited biscuit-making instinct. Complimentary service.</div>
    <div class="br-card"><b>Chirping at birds:</b> Scientists call it "frustration chattering." Cats call it "plotting."</div>
    <span class="br-link" onclick="browserNav('cat://newtab')">← Home</span>
  </div>`,
  'cat://shop': ()=>`<div class="br-page">
    <h1>🛍️ PawMart</h1>
    <div class="br-card"><b>🧶 Premium Yarn Ball</b> — ₹499 ★★★★★<br>Hours of zooming guaranteed.</div>
    <div class="br-card"><b>📦 Empty Cardboard Box</b> — FREE ★★★★★<br>5-star rating every time. Science confirms.</div>
    <div class="br-card"><b>🐟 Premium Tuna Feast</b> — ₹199 ★★★★☆<br>Cat will sniff, then walk away.</div>
    <div class="br-card"><b>🪄 Laser Pointer Pro</b> — ₹299 ★★★★★<br>The red dot technology: never ending zoomies.</div>
    <div class="br-card"><b>😺 Cat Tower Deluxe</b> — ₹4,999 ★★★☆☆<br>Cat will prefer the box it arrived in.</div>
    <span class="br-link" onclick="browserNav('cat://newtab')">← Home</span>
  </div>`,
  'cat://games': ()=>`<div class="br-page">
    <h1>🎮 CatArcade</h1>
    <div class="br-card" onclick="closeWin('browser');openApp('game')"><b>🧶 Catch the Yarn</b> — Play now in CatOS</div>
    <div class="br-card"><b>🐟 Fish Memory Match</b> — Match all fish pairs</div>
    <div class="br-card"><b>🐾 Paw Whack-a-Mole</b> — Whack before the cat does</div>
    <span class="br-link" onclick="browserNav('cat://newtab')">← Home</span>
  </div>`,
  'cat://weather': ()=>`<div class="br-page">
    <h1>🌤️ PurrCast</h1>
    <div class="br-card"><b>Today:</b> ☀️ Sunny. Perfect nap conditions. 28°C</div>
    <div class="br-card"><b>Tomorrow:</b> 🌧️ Light rain. Excellent window-watching weather.</div>
    <div class="br-card"><b>Sunbeam Index:</b> 🐾 MAXIMUM — reserve your spot now.</div>
    <span class="br-link" onclick="browserNav('cat://newtab')">← Home</span>
  </div>`,
  'cat://music': ()=>`<div class="br-page">
    <h1>🎵 MeowTunes Online</h1>
    <p>Open the MeowTunes app for the full experience!</p>
    <div class="br-card" onclick="closeWin('browser');openApp('music')"><b>▶ Open MeowTunes Player</b></div>
    <span class="br-link" onclick="browserNav('cat://newtab')">← Home</span>
  </div>`,
  'cat://mail': ()=>`<div class="br-page">
    <h1>📧 PurrMail</h1>
    <div class="br-card"><b>From: Whiskers</b><br><i>"Can you buy more tuna? Also I knocked your plant over. Not sorry."</i></div>
    <div class="br-card"><b>From: Chairman Meow</b><br><i>"TREATS. NOW. THIS IS NOT A DRILL."</i></div>
    <div class="br-card"><b>From: Nyan Cat</b><br><i>"nyan nyan nyan nyan nyan nyan"</i></div>
    <span class="br-link" onclick="browserNav('cat://newtab')">← Home</span>
  </div>`,
};
const browserHist=[], browserFwdStk=[];
function initBrowser(){ browserNav('cat://newtab'); }
function browserNav(url){
  url=(url||'cat://newtab').trim();
  const ui=document.getElementById('browser-url'); if(ui) ui.value=url;
  const content=document.getElementById('browser-content'); if(!content) return;
  const fn=BPAGES[url];
  const searchMatch=url.match(/^cat:\/\/search\/(.+)/);
  if(searchMatch){
    const q=decodeURIComponent(searchMatch[1]);
    content.innerHTML=`<div class="br-page"><h1>🔍 Search: "${q}"</h1>
      <div class="br-card">😹 Top result: cats are great · catsonline.cat</div>
      <div class="br-card">🐾 More cats found at: morecats.meow</div>
      <div class="br-card">😺 Did you mean: more cats?</div>
      <span class="br-link" onclick="browserNav('cat://newtab')">← Home</span></div>`;
  } else {
    content.innerHTML = fn ? fn() : `<div class="br-page"><h1>😿 404 — Page Not Found</h1><p>The cat knocked this page off the table.</p><span class="br-link" onclick="browserNav('cat://newtab')">← Home</span></div>`;
  }
  const titles={
    'cat://newtab':'New Tab','cat://news':'CatNews','cat://social':'PawBook',
    'cat://wiki':'WikiPurrdia','cat://shop':'PawMart','cat://games':'CatArcade',
    'cat://weather':'PurrCast','cat://music':'MeowTunes','cat://mail':'PurrMail'
  };
  const tt=document.getElementById('btab-title-0');
  if(tt) tt.textContent=titles[url]||(searchMatch?`Search: ${searchMatch[1]}`:url);
  if(browserHist[browserHist.length-1]!==url){ browserHist.push(url); browserFwdStk.length=0; }
}
function browserBack(){ if(browserHist.length>1){ browserFwdStk.push(browserHist.pop()); browserNav(browserHist[browserHist.length-1]); } }
function browserFwd(){ if(browserFwdStk.length) browserNav(browserFwdStk.pop()); }
function browserRefresh(){ browserNav(document.getElementById('browser-url')?.value||'cat://newtab'); }
function browserBookmark(){ toast('☆ Page bookmarked!'); }
function newBrowserTab(){ toast('+ Tab: feature coming in CatOS 2.1'); }
function closeBrowserTab(){ browserNav('cat://newtab'); }

/* ══════════════════════════════════════════════════
   PAWPAD NOTEPAD
══════════════════════════════════════════════════ */
function initNotepad(){
  const a=document.getElementById('notepad-area'); if(!a) return;
  const saved=LS.get('catos-note','');
  if(saved) a.value=saved;
  a.addEventListener('input',()=>{
    const st=document.getElementById('notepad-status');
    if(st) st.textContent=`${a.value.length} chars · ${a.value.split('\n').length} lines`;
  });
}
function notepadNew(){ const a=document.getElementById('notepad-area'); if(a&&confirm('Start fresh note?')){ a.value=''; toast('New note!'); } }
function notepadSave(){ const a=document.getElementById('notepad-area'); if(!a) return; LS.set('catos-note',a.value); toast('💾 Note saved!'); SND.play('click'); }
function notepadLoad(){ const a=document.getElementById('notepad-area'); const v=LS.get('catos-note',''); if(a&&v){ a.value=v; toast('📂 Note loaded!'); } else toast('😿 No saved note.'); }
function notepadFont(f){ const a=document.getElementById('notepad-area'); if(a) a.style.fontFamily=f; }
function notepadSize(s){ const a=document.getElementById('notepad-area'); if(a) a.style.fontSize=s+'px'; }

/* ══════════════════════════════════════════════════
   MEOWTUNES — REAL AUDIO
══════════════════════════════════════════════════ */
const TRACKS=[
  { title:'Nyan Cat Theme',     artist:'Daniwell',       album:'Nyan Cat OST',    src:'assets/audio/nyan.mp3',     cover:'assets/images/cover1.jpg', dur:'3:37' },
  { title:'Meow (Cat Song)',    artist:'Jingle Punks',   album:'Cat Beats',       src:'assets/audio/meow.mp3',     cover:'assets/images/cover2.jpg', dur:'2:15' },
  { title:'Keyboard Cat',       artist:'Charlie Schmidt', album:'Internet Gold',   src:'assets/audio/keyboard.mp3', cover:'assets/images/cover3.jpg', dur:'0:54' },
  { title:'Cat Vibes Lo-fi',    artist:'LoFi Cat',       album:'Chill Paws',      src:'assets/audio/lofi.mp3',     cover:'assets/images/cover4.jpg', dur:'3:50' },
  { title:'Stray Cat Strut',    artist:'The Stray Cats',  album:'Built for Speed', src:'assets/audio/stray.mp3',    cover:'assets/images/cover5.jpg', dur:'3:12' },
];

const MX={ idx:0, playing:false, shuffle:false, repeat:false, vol:0.7, audio:null };

function initMusic(){
  MX.audio=document.getElementById('music-audio');
  if(MX.audio){ MX.audio.volume=MX.vol; }
  buildPlaylist();
  loadTrack(0);
}
function buildPlaylist(){
  const pl=document.getElementById('music-playlist'); if(!pl) return;
  pl.innerHTML=TRACKS.map((t,i)=>`
    <div class="playlist-item ${i===MX.idx?'playing':''}" onclick="musicSelectTrack(${i})">
      <div class="pl-num">${i+1}</div>
      <img class="pl-cover" src="${t.cover}" onerror="this.src='assets/images/cover1.jpg'"/>
      <div class="pl-info"><div class="pl-title">${t.title}</div><div class="pl-artist">${t.artist}</div></div>
      <div class="pl-dur">${t.dur}</div>
    </div>`).join('');
}
function loadTrack(i){
  MX.idx=i; const t=TRACKS[i];
  const art=document.getElementById('music-art'); if(art){ art.src=t.cover; art.onerror=()=>art.src='assets/icons/cat-icon.png'; }
  const ti=document.getElementById('music-title');   if(ti) ti.textContent=t.title;
  const ar=document.getElementById('music-artist');  if(ar) ar.textContent=t.artist;
  const al=document.getElementById('music-album');   if(al) al.textContent=t.album;
  if(MX.audio){ MX.audio.src=t.src; if(MX.playing) MX.audio.play().catch(()=>{}); }
  buildPlaylist();
}
function musicSelectTrack(i){ loadTrack(i); MX.playing=true; MX.audio?.play().catch(()=>{}); updatePlayBtn(); }
function musicToggle(){
  if(!MX.audio) return;
  MX.playing=!MX.playing;
  if(MX.playing){ MX.audio.play().catch(()=>{}); toast('▶ '+TRACKS[MX.idx].title); }
  else { MX.audio.pause(); }
  updatePlayBtn();
}
function musicPause(){ if(MX.audio) MX.audio.pause(); MX.playing=false; updatePlayBtn(); }
function musicNext(){ loadTrack(MX.shuffle?Math.floor(Math.random()*TRACKS.length):(MX.idx+1)%TRACKS.length); }
function musicPrev(){ loadTrack((MX.idx-1+TRACKS.length)%TRACKS.length); }
function musicShuffle(){ MX.shuffle=!MX.shuffle; const b=document.getElementById('mc-shuf'); if(b) b.classList.toggle('active',MX.shuffle); toast(MX.shuffle?'🔀 Shuffle ON':'🔀 Shuffle OFF'); }
function musicRepeat(){ MX.repeat=!MX.repeat; const b=document.getElementById('mc-rep'); if(b) b.classList.toggle('active',MX.repeat); }
function musicVol(v){ MX.vol=parseFloat(v); if(MX.audio) MX.audio.volume=MX.vol; }
function updatePlayBtn(){ const b=document.getElementById('mc-play'); if(b) b.textContent=MX.playing?'⏸':'▶'; }
function musicEnded(){ if(MX.repeat){ MX.audio.currentTime=0; MX.audio.play(); } else musicNext(); }
function musicCanPlay(){ const d=document.getElementById('music-dur'); if(d&&MX.audio) d.textContent=fmtTime(MX.audio.duration||0); }
function musicTick(){
  if(!MX.audio) return;
  const pct=MX.audio.duration?(MX.audio.currentTime/MX.audio.duration*100):0;
  const f=document.getElementById('music-fill'); if(f) f.style.width=pct+'%';
  const th=document.getElementById('music-thumb'); if(th) th.style.left=pct+'%';
  const c=document.getElementById('music-cur'); if(c) c.textContent=fmtTime(MX.audio.currentTime);
}
function musicSeek(e){
  const bar=document.getElementById('music-track-bar'); if(!bar||!MX.audio||!MX.audio.duration) return;
  const r=bar.getBoundingClientRect();
  MX.audio.currentTime=((e.clientX-r.left)/r.width)*MX.audio.duration;
}
function fmtTime(s){ s=s||0; return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'); }

/* ══════════════════════════════════════════════════
   CAT PAINT
══════════════════════════════════════════════════ */
let PC=null, PT='pen', PDrawing=false, PStart={x:0,y:0}, PSnap=null;

function initPaint(){
  const canvas=document.getElementById('paint-canvas'); if(!canvas) return;
  resizePaintCanvas();
  PC=canvas.getContext('2d');
  PC.fillStyle='#ffffff'; PC.fillRect(0,0,canvas.width,canvas.height);
  canvas.addEventListener('mousedown', paintDown);
  canvas.addEventListener('mousemove', paintMove);
  canvas.addEventListener('mouseup',   paintUp);
  canvas.addEventListener('mouseleave',paintUp);
}
function resizePaintCanvas(){
  const canvas=document.getElementById('paint-canvas'); if(!canvas) return;
  const sidebar=canvas.parentElement?.querySelector('.paint-sidebar');
  const sideW=sidebar?sidebar.offsetWidth:52;
  const parent=canvas.parentElement;
  if(parent){ canvas.width=Math.max(200,parent.offsetWidth-sideW); canvas.height=Math.max(200,parent.offsetHeight); }
  if(PC){ PC.fillStyle='#fff'; PC.fillRect(0,0,canvas.width,canvas.height); }
}
function getPC(){ return document.getElementById('paint-color')?.value||'#c084fc'; }
function getPS(){ return parseInt(document.getElementById('paint-size')?.value||5); }
function paintDown(e){
  PDrawing=true; const r=e.target.getBoundingClientRect();
  PStart={x:e.clientX-r.left, y:e.clientY-r.top};
  if(PT==='fill'){ floodFill(PStart.x,PStart.y,getPC()); PDrawing=false; return; }
  if(['line','rect','circle'].includes(PT)) PSnap=PC.getImageData(0,0,e.target.width,e.target.height);
  PC.beginPath(); PC.moveTo(PStart.x,PStart.y);
}
function paintMove(e){
  if(!PDrawing) return;
  const r=e.target.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top;
  if(PT==='pen'){ PC.lineTo(x,y); PC.strokeStyle=getPC(); PC.lineWidth=getPS(); PC.lineCap='round'; PC.stroke(); }
  else if(PT==='eraser'){ const s=getPS(); PC.fillStyle='#fff'; PC.fillRect(x-s,y-s,s*2,s*2); }
  else if(PSnap){
    PC.putImageData(PSnap,0,0); PC.strokeStyle=getPC(); PC.lineWidth=getPS();
    if(PT==='line'){ PC.beginPath(); PC.moveTo(PStart.x,PStart.y); PC.lineTo(x,y); PC.stroke(); }
    else if(PT==='rect'){ PC.strokeRect(PStart.x,PStart.y,x-PStart.x,y-PStart.y); }
    else if(PT==='circle'){
      const rx=Math.abs(x-PStart.x)/2, ry=Math.abs(y-PStart.y)/2;
      PC.beginPath(); PC.ellipse(PStart.x+(x-PStart.x)/2,PStart.y+(y-PStart.y)/2,rx,ry,0,0,Math.PI*2); PC.stroke();
    }
  }
}
function paintUp(){ PDrawing=false; PSnap=null; }
function floodFill(sx,sy,fc){
  const canvas=document.getElementById('paint-canvas'); if(!canvas) return;
  const id=PC.getImageData(0,0,canvas.width,canvas.height);
  const data=id.data;
  const i=(Math.floor(sy)*canvas.width+Math.floor(sx))*4;
  const sr=data[i],sg=data[i+1],sb=data[i+2];
  const c=parseInt(fc.slice(1),16); const fr=(c>>16)&255,fg=(c>>8)&255,fb=c&255;
  if(sr===fr&&sg===fg&&sb===fb) return;
  const stack=[[Math.floor(sx),Math.floor(sy)]];
  while(stack.length){
    const [cx,cy]=stack.pop();
    if(cx<0||cx>=canvas.width||cy<0||cy>=canvas.height) continue;
    const ci=(cy*canvas.width+cx)*4;
    if(data[ci]!==sr||data[ci+1]!==sg||data[ci+2]!==sb||data[ci+3]<128) continue;
    data[ci]=fr; data[ci+1]=fg; data[ci+2]=fb; data[ci+3]=255;
    stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
  }
  PC.putImageData(id,0,0);
}
function setPaintTool(t,btn){
  PT=t;
  document.querySelectorAll('.paint-tool-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}
function paintStamp(){
  if(!PC) return;
  const canvas=document.getElementById('paint-canvas');
  const emojis=['🐱','😺','😸','🐾','🙀','😼'];
  PC.font='40px serif';
  PC.fillText(emojis[Math.floor(Math.random()*emojis.length)], Math.random()*(canvas.width-60)+10, Math.random()*(canvas.height-60)+50);
}
function paintClear(){
  if(!PC) return;
  const c=document.getElementById('paint-canvas');
  PC.fillStyle='#fff'; PC.fillRect(0,0,c.width,c.height);
  toast('Canvas cleared!');
}
function paintSaveImg(){
  const c=document.getElementById('paint-canvas'); if(!c) return;
  const a=document.createElement('a'); a.download='catpainting.png'; a.href=c.toDataURL(); a.click();
  toast('💾 Saved!');
}

/* ══════════════════════════════════════════════════
   CATSHELL TERMINAL
══════════════════════════════════════════════════ */
const termHist=[]; let tHI=-1;
const TCMDS={
  help:()=>`Available commands:\n  help      — show this\n  meow      — meow\n  ls        — list files\n  date      — current date\n  whoami    — identity\n  cat       — cat art\n  fortune   — cat wisdom\n  clear     — clear screen\n  echo [x]  — echo text\n  matrix    — cat matrix\n  joke      — cat joke\n  uname     — system info\n  uptime    — uptime`,
  meow:()=>['Meow!','MEOW!!','*purrs loudly*','mrrrow~','Meoooow...','MRROW!','*silent meow*'][Math.floor(Math.random()*7)],
  ls:()=>'drwxr-xr-x  paw-tures/\ndrwxr-xr-x  meow-sic/\ndrwxr-xr-x  docu-meows/\n-rw-r--r--  fish_list.txt\n-rw-r--r--  nap_schedule.cal\n-rw-r--r--  yarn_inventory.csv',
  date:()=>new Date().toString(),
  whoami:()=>'meow (uid=0 gid=0 groups=cats,nap,wheel)',
  cat:()=>`   /\\_____/\\\n  /  o   o  \\\n ( ==  ^  == )\n  )         (\n (  CatOS   )\n  ( (  )  ) )\n (__(__)____)`,
  fortune:()=>'🐾 '+['In ancient Egypt, you were a god. Act accordingly.','The internet belongs to cats.','Every cardboard box is a potential home.','The human is staff.','Knock it off the table. You will feel better.','Sleep is not laziness. It is professional napping.'][Math.floor(Math.random()*6)],
  clear:()=>{ document.getElementById('terminal-output').innerHTML=''; return ''; },
  matrix:()=>{ catMatrix(); return 'Entering cat matrix...'; },
  joke:()=>{
    const j=[
      ['Why do cats make bad storytellers?','Only one tail!'],
      ['What do cats eat for breakfast?','Mice Krispies!'],
      ['Why did the cat sit on the computer?','To keep an eye on the mouse!'],
      ['What do you call a cat that gets everything it wants?','Purrr-suasive!'],
      ['Why don\'t cats play poker in the jungle?','Too many cheetahs!'],
    ];
    const [q,a]=j[Math.floor(Math.random()*j.length)];
    return `Q: ${q}\nA: ${a}`;
  },
  uname:()=>'CatOS 2.0.0 (Whiskers) #1 SMP MEOW x86_paw',
  uptime:()=>{ const s=Math.floor(performance.now()/1000); return `Up: ${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`; },
  echo:(args)=>args.join(' '),
  pwd:()=>'/home/meow',
  neofetch:()=>`        /\\_____/\\       meow@catos\n       /  o   o  \\      ----------\n      ( ==  ^  == )     OS: CatOS 2.0 Whiskers\n       )         (      Kernel: PurrLinux 6.9\n      (  (  )  )  )     Shell: catsh 2.0\n     (__(__)____)       Memory: 9 lives / 16 GB\n                        Uptime: ${Math.floor(performance.now()/60000)}m`,
  ls_la:()=>'total 48\ndrwxr-xr-x  meow meow  paw-tures/\ndrwxr-xr-x  meow meow  meow-sic/\n-rw-r--r--  meow meow  fish_list.txt\n-rw-r--r--  meow meow  nap_schedule.cal',
};
function initTerminal(){ tPrint('CatShell v2.0 🐱 — type "help"','info'); tPrint(''); }
function tPrint(text,cls=''){
  const out=document.getElementById('terminal-output'); if(!out) return;
  const p=document.createElement('p'); p.className='t-line '+cls; p.textContent=text;
  out.appendChild(p); out.scrollTop=out.scrollHeight;
}
function termKey(e){
  const input=document.getElementById('terminal-input'); if(!input) return;
  if(e.key==='Enter'){
    const val=input.value.trim(); if(!val) return;
    termHist.unshift(val); tHI=-1;
    tPrint('meow@catos:~$ '+val);
    const [cmd,...args]=val.toLowerCase().split(' ');
    const fn=TCMDS[cmd];
    const res=fn?fn(args):`bash: ${cmd}: command not found`;
    if(res) tPrint(res, fn?'':'err');
    input.value='';
  } else if(e.key==='ArrowUp'){ tHI=Math.min(tHI+1,termHist.length-1); input.value=termHist[tHI]||''; e.preventDefault(); }
  else if(e.key==='ArrowDown'){ tHI=Math.max(tHI-1,-1); input.value=tHI>=0?termHist[tHI]:''; e.preventDefault(); }
}
function catMatrix(){
  const out=document.getElementById('terminal-output'); if(!out) return;
  const cats='🐱😺😸😹🐾🙀😼'; let i=0;
  const t=setInterval(()=>{
    const row=Array.from({length:16},()=>cats[Math.floor(Math.random()*cats.length)]).join(' ');
    tPrint(row,'cat'); out.scrollTop=out.scrollHeight;
    if(++i>10) clearInterval(t);
  },140);
}

/* ══════════════════════════════════════════════════
   FUR FILES
══════════════════════════════════════════════════ */
const FS={
  home:[
    { img:'assets/icons/notepad.png',  name:'resume_cat.pdf',    isImg:false },
    { img:'assets/images/owner.jpg',    name:'selfie_01.jpg',      isImg:true  },
    { img:null,           name:'Projects/',          isImg:false, isDir:true },
    { img:'assets/images/nyan.gif',     name:'nyan_cat.gif',       isImg:true  },
    { img:null,           name:'secrets.txt',        isImg:false },
    { img:null,           name:'box_collection/',    isImg:false, isDir:true },
  ],
  pictures:[
    { img:'assets/images/owner.jpg',    name:'selfie_01.jpg',  isImg:true },
    { img:'assets/images/cat1.jpg',     name:'nap_2024.jpg',   isImg:true },
    { img:'assets/images/cat2.jpg',     name:'laser_chase.jpg',isImg:true },
    { img:'assets/images/cat3.jpg',     name:'sunbeam.jpg',    isImg:true },
    { img:'assets/images/nyan.gif',     name:'nyan_cat.gif',   isImg:true },
    { img:'assets/images/owner.jpg',    name:'birdwatch.jpg',  isImg:true },
  ],
  music:[
    { img:null, name:'nyan_cat.mp3',    isImg:false, icon:'🎵' },
    { img:null, name:'meow_song.mp3',   isImg:false, icon:'🎵' },
    { img:null, name:'keyboard_cat.mp3',isImg:false, icon:'🎵' },
    { img:null, name:'lofi_cat.mp3',    isImg:false, icon:'🎵' },
    { img:null, name:'stray_cat.mp3',   isImg:false, icon:'🎵' },
  ],
  documents:[
    { img:null, name:'nap_schedule.docx',  icon:'📄' },
    { img:null, name:'fish_inventory.xlsx', icon:'📊' },
    { img:null, name:'human_training.pdf',  icon:'📄' },
    { img:null, name:'yarn_budget.txt',     icon:'📝' },
    { img:null, name:'demands_list.md',     icon:'📋' },
  ],
  trash:[
    { img:null, name:'monday.exe',    icon:'🗑️' },
    { img:null, name:'bath_time.app', icon:'🗑️' },
    { img:null, name:'diet_plan.pdf', icon:'🗑️' },
    { img:null, name:'vet_appt.cal',  icon:'🗑️' },
  ],
};
function initFiles(){ filesNav('home', document.querySelector('.files-nav-item')); }
function filesNav(sec, el){
  document.querySelectorAll('.files-nav-item').forEach(n=>n.classList.remove('active'));
  if(el) el.classList.add('active');
  const grid=document.getElementById('files-grid'), path=document.getElementById('files-path');
  if(!grid) return;
  const labels={home:'🏠 Home',pictures:'🖼️ Paw-tures',music:'🎵 Meow-sic',documents:'📄 Docu-meows',trash:'🗑️ Litter Box'};
  if(path) path.textContent=labels[sec]||sec;
  grid.innerHTML=(FS[sec]||[]).map(f=>`
    <div class="file-item" ondblclick="toast('Opening ${f.name}...')">
      ${f.isImg
        ? `<img src="${f.img}" onerror="this.outerHTML='<div class=\\'file-icon\\'>📄</div>'"/>`
        : `<div class="file-icon">${f.isDir?'📁':(f.icon||'📄')}</div>`
      }
      <small>${f.name}</small>
    </div>`).join('');
}

/* ══════════════════════════════════════════════════
   CALC-CAT
══════════════════════════════════════════════════ */
let cDisp='0', cExpr='', cOp='', cPrev='', cFresh=false;
const cSay={'+':'Adding fish...','−':'Removing fish...','×':'Multiplying paws!','÷':'Dividing treats...','=':'Purrfect!','C':'Clean slate!'};
function $c(id){ return document.getElementById(id); }
function cUpdate(){ $c('calc-result').textContent=cDisp; }
function calcNum(n){
  if(cFresh){ cDisp=n; cFresh=false; }
  else cDisp = cDisp==='0' ? n : (cDisp.length<12 ? cDisp+n : cDisp);
  cUpdate();
}
function calcOp(op){
  if(cOp && !cFresh){ calcEq(true); }
  cPrev=cDisp; cExpr=cDisp+' '+op; cOp=op; cFresh=true;
  $c('calc-expr').textContent=cExpr;
  $c('calc-cat-say').textContent='🐱 '+cSay[op];
}
function calcEq(chain=false){
  if(!cOp) return;
  const a=parseFloat(cPrev), b=parseFloat(cDisp);
  let res;
  if(cOp==='+') res=a+b;
  else if(cOp==='−') res=a-b;
  else if(cOp==='×') res=a*b;
  else if(cOp==='÷'){ res=b===0?'Error: ÷0':a/b; }
  else res=b;
  const out=typeof res==='number'?parseFloat(res.toPrecision(12)):res;
  $c('calc-expr').textContent=cExpr+cDisp+' =';
  cDisp=String(out); cOp=''; cPrev=''; cFresh=true;
  cUpdate();
  $c('calc-cat-say').textContent='🐱 '+cSay['='];
  SND.play('click');
}
function calcFn(fn){
  if(fn==='C'){ cDisp='0'; cExpr=''; cOp=''; cPrev=''; cFresh=false; $c('calc-expr').textContent=''; cUpdate(); $c('calc-cat-say').textContent='🐱 '+cSay['C']; }
  else if(fn==='±'){ cDisp=String(-parseFloat(cDisp)||0); cUpdate(); }
  else if(fn==='%'){ cDisp=String(parseFloat(cDisp)/100); cUpdate(); }
}

/* ══════════════════════════════════════════════════
   CATCH THE YARN GAME
══════════════════════════════════════════════════ */
let GS=null, GAF=null;
function initGame(){}
function gameStart(){
  const canvas=document.getElementById('game-canvas'); if(!canvas) return;
  const parent=canvas.parentElement;
  canvas.width=Math.min(580, parent.offsetWidth-16);
  canvas.height=Math.min(360, parent.offsetHeight-80);
  const W=canvas.width, H=canvas.height;
  const ctx=canvas.getContext('2d');
  GS={ score:0, level:1, lives:3, running:true,
    cat:{x:W/2, spd:7}, yarns:[], fish:[], keys:{}, spawn:0, fishT:0 };
  document.getElementById('g-start-btn').textContent='↺ Restart';
  canvas.onmousemove=e=>{ const r=canvas.getBoundingClientRect(); GS.cat.x=Math.max(30,Math.min(W-30,e.clientX-r.left)); };
  const kd=e=>{ if(GS) GS.keys[e.key]=true; };
  const ku=e=>{ if(GS) GS.keys[e.key]=false; };
  document.addEventListener('keydown',kd);
  document.addEventListener('keyup',ku);
  function loop(){
    if(!GS||!GS.running) return;
    ctx.fillStyle='#0d0820'; ctx.fillRect(0,0,W,H);
    // Stars
    for(let i=0;i<40;i++){
      ctx.fillStyle='rgba(255,255,255,'+(0.1+Math.sin(i)*0.1)+')';
      ctx.fillRect((i*79+3)%W,(i*53+7)%H,1.5,1.5);
    }
    // Input
    if(GS.keys['ArrowLeft']||GS.keys['a']) GS.cat.x=Math.max(30,GS.cat.x-GS.cat.spd);
    if(GS.keys['ArrowRight']||GS.keys['d']) GS.cat.x=Math.min(W-30,GS.cat.x+GS.cat.spd);
    // Spawn yarns
    GS.spawn++; GS.fishT++;
    const spawnRate=Math.max(28,90-GS.level*8);
    if(GS.spawn>=spawnRate){
      GS.yarns.push({
        x:Math.random()*(W-40)+20, y:-20, r:13,
        vy:1.8+GS.level*0.35+Math.random()*1.2,
        color:['#c084fc','#e040fb','#fb923c','#fbbf24','#69f0ae','#60a5fa'][Math.floor(Math.random()*6)]
      });
      GS.spawn=0;
    }
    // Spawn fish bonus
    if(GS.fishT>=180){ GS.fish.push({x:Math.random()*(W-40)+20,y:-20,vy:1.4+Math.random()}); GS.fishT=0; }
    // Draw & update yarns
    GS.yarns=GS.yarns.filter(y=>{
      y.y+=y.vy;
      ctx.beginPath(); ctx.arc(y.x,y.y,y.r,0,Math.PI*2); ctx.fillStyle=y.color; ctx.fill();
      ctx.font='18px serif'; ctx.fillText('🧶',y.x-9,y.y+7);
      if(Math.abs(y.x-GS.cat.x)<42&&y.y>H-58&&y.y<H-28){
        GS.score+=10*GS.level;
        if(GS.score>0 && GS.score%(100*GS.level)===0){ GS.level++; GS.cat.spd=Math.min(14,GS.cat.spd+0.5); }
        updateGameHUD(); return false;
      }
      if(y.y>H+20){ GS.lives--; updateGameHUD(); return false; }
      return true;
    });
    // Draw & update fish
    GS.fish=GS.fish.filter(f=>{
      f.y+=f.vy; ctx.font='22px serif'; ctx.fillText('🐟',f.x-11,f.y+7);
      if(Math.abs(f.x-GS.cat.x)<42&&f.y>H-58&&f.y<H-28){
        GS.score+=50; toast('🐟 +50 Bonus!'); SND.play('click'); updateGameHUD(); return false;
      }
      return f.y<=H+20;
    });
    // Draw cat
    ctx.font='48px serif'; ctx.fillText('🐱',GS.cat.x-24,H-12);
    if(GS.lives<=0){ gameOver(ctx,W,H); return; }
    GAF=requestAnimationFrame(loop);
  }
  if(GAF) cancelAnimationFrame(GAF);
  GAF=requestAnimationFrame(loop);
}
function updateGameHUD(){
  if(!GS) return;
  const s=document.getElementById('g-score'); if(s) s.textContent=GS.score;
  const l=document.getElementById('g-level'); if(l) l.textContent=GS.level;
  const lv=document.getElementById('g-lives'); if(lv) lv.textContent='🐱'.repeat(Math.max(0,GS.lives));
}
function gameOver(ctx,W,H){
  GS.running=false;
  ctx.fillStyle='rgba(0,0,0,0.75)'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#c084fc'; ctx.font='bold 32px Nunito,sans-serif'; ctx.textAlign='center';
  ctx.fillText('😿 GAME OVER', W/2, H/2-26);
  ctx.fillStyle='#fff'; ctx.font='18px Nunito,sans-serif';
  ctx.fillText('Score: '+GS.score, W/2, H/2+10);
  ctx.fillText('Click Restart to play again', W/2, H/2+38);
  ctx.textAlign='left';
  toast('😿 Game Over! Score: '+GS.score);
}
function gameStop(){ if(GAF){ cancelAnimationFrame(GAF); GAF=null; } if(GS) GS.running=false; GS=null; }

/* ══════════════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════════════ */
function setIconSize(size){
  size = parseInt(size);
  LS.set('catos-iconsize', size);
  document.querySelectorAll('.desk-icon').forEach(d => {
    d.style.width = (size + 36) + 'px';
    const img = d.querySelector('img');
    if(img) img.style.width = size + 'px';
  });
}

function initSettings(){
  setIconSize(LS.get('catos-iconsize', 40));
  settingsTab('appearance', document.querySelector('.s-nav'));
}
function settingsTab(tab, el){
  document.querySelectorAll('.s-nav').forEach(n=>n.classList.remove('active'));
  if(el) el.classList.add('active');
  const panel=document.getElementById('settings-panel'); if(!panel) return;
  if(tab==='appearance'){
    panel.innerHTML=`<h3>🎨 Appearance</h3>
      <div class="setting-row"><label>Change Wallpaper</label><button class="clay-btn sm" onclick="openWallpaperPicker()">Open Picker</button></div>
      <div class="setting-row"><label>Icon Size</label><input type="range" min="28" max="64" value="${LS.get('catos-iconsize',40)}" oninput="setIconSize(this.value)"/></div>
      <div class="setting-row"><label>Window Shadow</label><input type="checkbox" checked/></div>
      <div class="setting-row"><label>Accent Color</label><input type="color" value="#7c4dff" oninput="document.documentElement.style.setProperty('--c-accent',this.value)"/></div>`;
  } else if(tab==='sound'){
    panel.innerHTML=`<h3>🔊 Sound</h3>
      <div class="setting-row"><label>Master Volume</label><input type="range" min="0" max="1" step="0.05" value="${LS.get('snd-vol',0.5)}" oninput="LS.set('snd-vol',parseFloat(this.value))"/></div>
      <div class="setting-row"><label>Notification Meow</label><input type="checkbox" checked/></div>
      <div class="setting-row"><label>Click Sounds</label><input type="checkbox" checked/></div>
      <div class="setting-row"><label>Startup Purr</label><input type="checkbox" checked/></div>`;
  } else if(tab==='cat'){
    const saved=LS.get('catos-profile',{name:'Whiskers',breed:'Domestic Shorthair'});
    panel.innerHTML=`<h3>🐱 Cat Profile</h3>
      <div class="setting-row"><label>Cat Name</label>
        <input type="text" value="${saved.name}" style="background:var(--c-surface2);border:none;border-radius:8px;padding:5px 10px;font-family:var(--font);font-weight:700;color:var(--c-text);outline:none;"
        onchange="const p=LS.get('catos-profile',{});p.name=this.value;LS.set('catos-profile',p)"/></div>
      <div class="setting-row"><label>Breed</label>
        <select onchange="const p=LS.get('catos-profile',{});p.breed=this.value;LS.set('catos-profile',p)">
          <option ${saved.breed==='Domestic Shorthair'?'selected':''}>Domestic Shorthair</option>
          <option ${saved.breed==='Siamese'?'selected':''}>Siamese</option>
          <option ${saved.breed==='Persian'?'selected':''}>Persian</option>
          <option ${saved.breed==='Maine Coon'?'selected':''}>Maine Coon</option>
          <option ${saved.breed==='Bengal'?'selected':''}>Bengal</option>
          <option ${saved.breed==='Unknown (Chaotic)'?'selected':''}>Unknown (Chaotic)</option>
        </select></div>
      <div class="setting-row"><label>Mischief Level</label><input type="range" min="1" max="11" value="11"/></div>
      <div class="setting-row"><label>Treat Addiction</label><input type="range" min="0" max="100" value="100"/></div>`;
  } else if(tab==='about'){
    panel.innerHTML=`<div class="about-section">
      <img src="assets/images/owner.jpg" class="about-img" onerror="this.style.display='none'"/>
      <h2>CatOS 2.0</h2>
      <p><b>Powered by Paws™</b><br>The world's most feline operating system.<br><br>
      Kernel: PurrLinux 6.9-meow<br>Desktop: CatDE 2.0 (Clay Edition)<br>Memory: 9 lives / 16 GB<br>Storage: Infinite boxes<br><br>
      Built with ❤️ by ajmaleee__<br><br>
      🐾 In cats we trust 🐾</p>
      <button class="clay-btn sm" style="margin-top:14px" onclick="swRelaunch()">🧭 Replay Onboarding</button>
    </div>`;
  }
}

/* ══════════════════════════════════════════════════
   CALENDAR
══════════════════════════════════════════════════ */
const CAT_EVENTS={
  1:['🐟 Fish Day','🛌 Nap Championships'],
  5:['🧶 World Yarn Day'],
  8:['🌞 Sunbeam Day'],
  13:['😹 Cat Day'],
  17:['🐾 Paw Prints Day'],
  20:['😻 Love Your Cat'],
  25:['🎁 Treat Tuesday'],
  28:['🏆 CatOS Release']
};
let calD=new Date();
function initCalendar(){ renderCalendar(); }
function calPrev(){ calD.setMonth(calD.getMonth()-1); renderCalendar(); }
function calNext(){ calD.setMonth(calD.getMonth()+1); renderCalendar(); }
function renderCalendar(){
  const title=document.getElementById('cal-title'), grid=document.getElementById('cal-grid');
  if(!title||!grid) return;
  const now=new Date(), y=calD.getFullYear(), m=calD.getMonth();
  title.textContent=calD.toLocaleString('default',{month:'long',year:'numeric'});
  const first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate();
  const prevDays=new Date(y,m,0).getDate();
  grid.innerHTML='';
  for(let i=0;i<first;i++){
    const d=document.createElement('div'); d.className='cal-day other-month';
    d.textContent=prevDays-first+i+1; grid.appendChild(d);
  }
  for(let i=1;i<=days;i++){
    const d=document.createElement('div');
    const isToday=i===now.getDate()&&m===now.getMonth()&&y===now.getFullYear();
    d.className='cal-day'+(isToday?' today':'')+(CAT_EVENTS[i]?' has-event':'');
    d.textContent=i; d.onclick=()=>showCalEvents(i); grid.appendChild(d);
  }
  // Fill remaining cells
  const total=first+days; const remaining=(7-total%7)%7;
  for(let i=1;i<=remaining;i++){
    const d=document.createElement('div'); d.className='cal-day other-month';
    d.textContent=i; grid.appendChild(d);
  }
  showCalEvents(now.getDate());
}
function showCalEvents(day){
  const el=document.getElementById('cal-ev-list'); if(!el) return;
  const ev=CAT_EVENTS[day];
  el.innerHTML=ev
    ? ev.map(e=>`<div class="cal-ev-item">${e}</div>`).join('')
    : '<div style="padding:6px;color:var(--c-text3);font-size:0.8rem">No events — a purrfect nap day.</div>';
}

/* ══════════════════════════════════════════════════
   MEOWCHAT
══════════════════════════════════════════════════ */
const CONTACTS={
  whiskers:{name:'Whiskers',av:'assets/images/cat1.jpg',status:'🟢 Online',msgs:[
    {me:false,text:'Meow! How are you doing today?'},
    {me:false,text:'I found the best sunbeam. You should come see it.'},
  ]},
  mittens:{name:'Mittens',av:'assets/images/cat2.jpg',status:'🟢 Online',msgs:[
    {me:false,text:'Did you see that laser dot?! IT WAS THERE AND THEN IT WASNT.'},
    {me:false,text:'I have been thinking about it for 3 hours now.'},
  ]},
  chairman:{name:'Chairman Meow',av:'assets/images/cat3.jpg',status:'🔴 Demanding',msgs:[
    {me:false,text:'I demand treats. NOW. The time for delay is OVER.'},
    {me:false,text:'The humans have been warned. Treats or the vase gets it.'},
  ]},
  nyancat:{name:'Nyan Cat',av:'assets/images/nyan.gif',status:'🟢 Nyaning',msgs:[
    {me:false,text:'nyan nyan nyan nyan nyan nyan nyan nyan'},
    {me:false,text:'🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈'},
  ]},
};
const REPLIES={
  whiskers:['Meow meow! 🐱','*purrs* Yes yes','*stares judgingly*','I was napping, what do you want?','MEOW!','*knocks your message off the table*'],
  mittens:['THE LASER IS BACK!!','Wait... was that a bird?','*chirps at window*','ZOOMIES TIME!!'],
  chairman:['TREATS. NOW.','My demands are non-negotiable.','Do not test me.','*knocks over vase*'],
  nyancat:['nyan nyan nyan 🌈','NYAN!','🌈🌈🌈','nyan nyan nyan nyan'],
};
let curChat='whiskers';
function initChat(){ chatSelect('whiskers', document.querySelector('.chat-contact')); }
function chatSelect(id, el){
  curChat=id; const c=CONTACTS[id];
  document.querySelectorAll('.chat-contact').forEach(x=>x.classList.remove('active'));
  if(el) el.classList.add('active');
  const av=document.getElementById('chat-hdr-av');
  if(av){ av.src=c.av; av.onerror=()=>av.src='https://placecats.com/36/36'; }
  const nm=document.getElementById('chat-hdr-name'); if(nm) nm.textContent=c.name;
  const st=document.getElementById('chat-hdr-status'); if(st) st.textContent=c.status;
  renderMsgs(id);
}
function renderMsgs(id){
  const c=CONTACTS[id], msgs=document.getElementById('chat-msgs'); if(!msgs) return;
  msgs.innerHTML=c.msgs.map(m=>`
    <div class="chat-msg ${m.me?'me':'them'}">
      <div class="chat-msg-who">${m.me?'You 🐾':c.name}</div>
      ${m.text}
    </div>`).join('');
  msgs.scrollTop=msgs.scrollHeight;
}
function chatSend(){
  const input=document.getElementById('chat-input');
  if(!input||!input.value.trim()) return;
  const c=CONTACTS[curChat];
  c.msgs.push({me:true,text:input.value});
  input.value='';
  renderMsgs(curChat);
  SND.play('click');
  setTimeout(()=>{
    const reps=REPLIES[curChat];
    c.msgs.push({me:false,text:reps[Math.floor(Math.random()*reps.length)]});
    renderMsgs(curChat);
    SND.play('notif');
  }, 900+Math.random()*900);
}
function chatEmoji(){
  const emojis=['😺','😸','😹','😻','🙀','😼','🐱','🐾','🧶','🐟','🌈','💜'];
  const input=document.getElementById('chat-input');
  if(input){ input.value+=emojis[Math.floor(Math.random()*emojis.length)]; input.focus(); }
}

/* ══════════════════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════════════════ */
function initNotifications(){ renderNotifs(); }

/* ══════════════════════════════════════════════════
   ABOUT ME
══════════════════════════════════════════════════ */
function initAboutMe(){ /* all static HTML in index.html */ }

/* ══════════════════════════════════════════════════
   PAWGRAM — doomscrolling cat reels
   (exact Instagram Reels layout, cat content)
══════════════════════════════════════════════════ */
const REELS_DATA = [
  { file:'assets/video/reel-01.mp4', user:'@whiskers.wilson',     verified:true,  avatar:'assets/images/cat1.jpg',
    caption:'POV: you opened the treat bag at 3am 🐾😹 he heard it from two floors away',
    audio:'original audio · whiskers.wilson', likes:128400, comments:842,  shares:3100 },
  { file:'assets/video/reel-02.mp4', user:'@chairman.meow',       verified:true,  avatar:'assets/images/cat3.jpg',
    caption:'The humans THINK they own this couch. They are, in fact, incorrect. 👑',
    audio:'Royalty - Meow Beats',              likes:947000, comments:5200, shares:18900 },
  { file:'assets/video/reel-03.mp4', user:'@mittens_official',    verified:false, avatar:'assets/images/cat2.jpg',
    caption:'Day 47 of intense surveillance on the red dot. It always escapes. Always.',
    audio:'original audio · mittens_official',  likes:64200,  comments:391,  shares:980 },
  { file:'assets/video/reel-04.mp4', user:'@nyancat.daily',       verified:true,  avatar:'assets/images/nyan.gif',
    caption:'nyan nyan nyan nyan nyan nyan nyan 🌈 (this is the whole caption)',
    audio:'Nyan Theme - 8bit Classics',         likes:2400000,comments:88000,shares:512000 },
  { file:'assets/video/reel-05.mp4', user:'@purrlosophy',         verified:false, avatar:'assets/images/cat1.jpg',
    caption:'To nap, or to nap harder — that is the only question that has ever mattered',
    audio:'Lo-fi Purr Beats to Sleep/Judge to', likes:39800,  comments:204,  shares:610 },
  { file:'assets/video/reel-06.mp4', user:'@feline.fiasco',       verified:false, avatar:'assets/images/cat2.jpg',
    caption:'I was framed. The vase fell on its own. I have nothing further to add. 🏺💥',
    audio:'original audio · feline.fiasco',     likes:201500, comments:6700, shares:9400 },
  { file:'assets/video/reel-07.mp4', user:'@catnip.chronicles',   verified:true,  avatar:'assets/images/cat3.jpg',
    caption:'This is what peak performance looks like. 14 hours. No notes. 😴',
    audio:'Dreamy Sunbeam - Soft Purr Sounds',  likes:55300,  comments:312,  shares:740 },
  { file:'assets/video/reel-08.mp4', user:'@void.cat.energy',     verified:false, avatar:'assets/images/cat1.jpg',
    caption:'Box acquired. Box is now mine. I do not make the rules, the box does.',
    audio:'original audio · void.cat.energy',   likes:712900, comments:14200,shares:43000 },
  { file:'assets/video/reel-09.mp4', user:'@sir.fluffington',     verified:true,  avatar:'assets/images/cat2.jpg',
    caption:'Caught in 4K stealing my own reflection\'s spot in the mirror. Unrepentant.',
    audio:'Bougie - Catnip Sound Co.',           likes:88700,  comments:1100, shares:2300 },
  { file:'assets/video/reel-10.mp4', user:'@clawdia.official',    verified:false, avatar:'assets/images/cat3.jpg',
    caption:'3am zoomie championships. No referees. No rules. Just vibes and chaos. 🏃',
    audio:'original audio · clawdia.official',  likes:166000, comments:3900, shares:7800 },
  { file:'assets/video/reel-11.mp4', user:'@biscuit.maker',       verified:false, avatar:'assets/images/cat1.jpg',
    caption:'Kneading the blanket like it owes him rent. He will not stop. Ever.',
    audio:'Soft Kneads - Cozy Cat Lo-fi',        likes:47600,  comments:560,  shares:1200 },
  { file:'assets/video/reel-12.mp4', user:'@litterbox.legend',    verified:true,  avatar:'assets/images/cat2.jpg',
    caption:'Tell me you\'re a cat without telling me you\'re a cat. Challenge: impossible.',
    audio:'original audio · litterbox.legend',  likes:332000, comments:9800, shares:21000 },
  { file:'assets/video/reel-13.mp4', user:'@pawsitive.vibes',     verified:false, avatar:'assets/images/cat3.jpg',
    caption:'Bro found the one sunbeam in the entire apartment and defended it with his life',
    audio:'Golden Hour - Sunny Cat Mix',         likes:91200,  comments:1450, shares:3300 },
  { file:'assets/video/reel-14.mp4', user:'@meowtain.dew',        verified:false, avatar:'assets/images/cat1.jpg',
    caption:'When the vacuum turns on and your whole personality changes instantly 😾',
    audio:'original audio · meowtain.dew',      likes:218700, comments:4300, shares:8900 },
];

function igFormatCount(n){
  if(n>=1000000) return (n/1000000).toFixed(1).replace(/\.0$/,'')+'M';
  if(n>=1000)    return (n/1000).toFixed(1).replace(/\.0$/,'')+'K';
  return ''+n;
}

function igFallbackUrl(i){
  const w=480, h=854;
  return i%2===0
    ? `https://cataas.com/cat/gif?width=${w}&height=${h}&_=${i}`
    : `https://cataas.com/cat?width=${w}&height=${h}&_=${i}`;
}

function igIsVideoFile(file){
  return /\.(mp4|webm|mov|m4v)$/i.test(file||'');
}

/* Builds the actual <img>/<video> element for a reel.
   Tries your uploaded repo file first; if it 404s (not uploaded yet),
   falls back to a live cataas.com cat, then a static placeholder. */
function igBuildMediaEl(r, i){
  let el;
  if(igIsVideoFile(r.file)){
    el = document.createElement('video');
    el.autoplay = true; el.muted = true; el.loop = true; el.playsInline = true;
    el.src = r.file;
    el.onerror = ()=>{
      const img = document.createElement('img');
      img.className = 'ig-media';
      img.src = igFallbackUrl(i);
      img.onerror = ()=>{ img.onerror=null; img.src = `https://placecats.com/${480+i%3}/854`; };
      el.replaceWith(img);
    };
  } else {
    el = document.createElement('img');
    el.src = r.file;
    el.onerror = ()=>{
      el.onerror = null;
      el.src = igFallbackUrl(i);
      el.onerror = ()=>{ el.onerror=null; el.src = `https://placecats.com/${480+i%3}/854`; };
    };
  }
  el.className = 'ig-media';
  return el;
}

function igReelHTML(r, i){
  return `
  <div class="ig-reel" data-idx="${i}">
    <div class="ig-media-wrap">
      <div class="ig-media-slot" id="ig-media-slot-${i}"></div>
      <div class="ig-gradient"></div>
      <div class="ig-heartpop" id="ig-heartpop-${i}">❤️</div>
    </div>
    <div class="ig-actions">
      <div class="ig-act-btn${r.liked?' liked':''}" id="ig-like-${i}" onclick="igToggleLike(${i})">
        <svg class="ig-heart-icon" viewBox="0 0 24 24" width="28" height="28"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2 4.8 5.6 4.1 8 3.6 10.3 4.8 12 7c1.7-2.2 4-3.4 6.4-2.9 3.6.7 5.2 4.3 3.6 7.6C19.5 16.4 12 21 12 21z"/></svg>
        <span class="ig-act-count" id="ig-like-count-${i}">${igFormatCount(r.likes)}</span>
      </div>
      <div class="ig-act-btn" onclick="igToast('💬 Comments are closed (cats don\\'t read)')">
        <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-1.2 4.3 8.5 8.5 0 0 1-7.3 4.2 8.4 8.4 0 0 1-4.3-1.2L3 21l2.2-5.3a8.4 8.4 0 0 1-1.2-4.3 8.5 8.5 0 0 1 4.2-7.3A8.4 8.4 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8v.5z"/></svg>
        <span class="ig-act-count">${igFormatCount(r.comments)}</span>
      </div>
      <div class="ig-act-btn" onclick="igShare(${i})">
        <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        <span class="ig-act-count">${igFormatCount(r.shares)}</span>
      </div>
      <div class="ig-act-btn${r.saved?' saved':''}" id="ig-save-${i}" onclick="igToggleSave(${i})">
        <svg class="ig-save-icon" viewBox="0 0 24 24" width="25" height="25"><path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4.5L5 22V3a1 1 0 0 1 1-1z"/></svg>
      </div>
      <div class="ig-act-btn" onclick="igToast('🐾 More options: bury it like a litter box')">
        <svg viewBox="0 0 24 24" width="21" height="21" fill="#fff"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
      </div>
      <div class="ig-audio-disc" onclick="igToast('🎵 ${r.audio.replace(/'/g,"\\'")}')">
        <img src="${r.avatar}" onerror="this.src='https://placecats.com/40/40'"/>
      </div>
    </div>
    <div class="ig-info">
      <div class="ig-info-row">
        <img class="ig-avatar" src="${r.avatar}" onerror="this.src='https://placecats.com/32/32'"/>
        <span class="ig-username">${r.user}</span>
        ${r.verified?'<svg class="ig-verified" viewBox="0 0 24 24" width="14" height="14"><path fill="#3897f0" d="M12 2l2.2 2 2.9-.9 1.1 2.8 2.9.9-.4 3 2.3 1.9-2.3 1.9.4 3-2.9.9-1.1 2.8-2.9-.9L12 22l-2.2-2-2.9.9-1.1-2.8-2.9-.9.4-3L1 12l2.3-1.9-.4-3 2.9-.9L7 3.4l2.9.9z"/><path d="M8.5 12.3l2.3 2.2 4.3-4.6" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}
        <button class="ig-follow-btn${r.following?' following':''}" id="ig-follow-${i}" onclick="igToggleFollow(${i})">${r.following?'Following':'Follow'}</button>
      </div>
      <div class="ig-caption" id="ig-cap-${i}" onclick="this.classList.toggle('ig-cap-expanded')">${r.caption}</div>
      <div class="ig-audio-row">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="#fff"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        <span class="ig-audio-text">${r.audio}</span>
      </div>
    </div>
  </div>`;
}

let igInited = false;
function initReels(){
  const feed = document.getElementById('ig-feed');
  if(!feed) return;
  feed.innerHTML = REELS_DATA.map((r,i)=>igReelHTML(r,i)).join('');
  REELS_DATA.forEach((r,i)=>{
    const slot = document.getElementById('ig-media-slot-'+i);
    if(slot) slot.appendChild(igBuildMediaEl(r,i));
  });
  let lastTap = 0;
  feed.querySelectorAll('.ig-media-wrap').forEach((el,i)=>{
    el.addEventListener('click', ()=>{
      const now = Date.now();
      if(now - lastTap < 350) igDoubleTapLike(i);
      lastTap = now;
    });
  });
}

function igToggleLike(i){
  const r = REELS_DATA[i];
  r.liked = !r.liked;
  document.getElementById('ig-like-'+i).classList.toggle('liked', r.liked);
  document.getElementById('ig-like-count-'+i).textContent = igFormatCount(r.likes + (r.liked?1:0));
}
function igDoubleTapLike(i){
  const r = REELS_DATA[i];
  if(!r.liked){
    r.liked = true;
    document.getElementById('ig-like-'+i).classList.add('liked');
    document.getElementById('ig-like-count-'+i).textContent = igFormatCount(r.likes + 1);
  }
  const pop = document.getElementById('ig-heartpop-'+i);
  if(pop){
    pop.classList.remove('pop');
    void pop.offsetWidth; // restart animation
    pop.classList.add('pop');
  }
}
function igToggleSave(i){
  const r = REELS_DATA[i];
  r.saved = !r.saved;
  document.getElementById('ig-save-'+i).classList.toggle('saved', r.saved);
  igToast(r.saved ? '📌 Saved to your secret stash' : 'Removed from stash');
}
function igToggleFollow(i){
  const r = REELS_DATA[i];
  r.following = !r.following;
  const btn = document.getElementById('ig-follow-'+i);
  btn.textContent = r.following ? 'Following' : 'Follow';
  btn.classList.toggle('following', r.following);
  if(r.following) igToast('✅ Now following '+r.user);
}
function igShare(i){
  igToast('🐾 Shared to the litter box (everyone\'s inbox)');
}
function igNavTab(tab, el){
  document.querySelectorAll('.ig-nav-item').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
  if(tab !== 'reels'){
    igToast('🐾 '+tab.charAt(0).toUpperCase()+tab.slice(1)+' is napping right now');
    setTimeout(()=>{
      document.querySelectorAll('.ig-nav-item').forEach(n=>n.classList.toggle('active', n.dataset.tab==='reels'));
    }, 1100);
  }
}
function igToast(msg){ toast(msg || '🐾 Pawgram says meow'); }

/* ══════════════════════════════════════════════════
   SHUTDOWN
══════════════════════════════════════════════════ */
function shutDown(){
  // Close all windows
  Object.keys(openWins).forEach(id=>closeWin(id));
  const ov=document.createElement('div'); ov.id='shutdown-overlay';
  ov.innerHTML=`
    <img src="assets/images/owner.jpg" class="shut-photo" onerror="this.style.display='none'"/>
    <h1>CatOS Napping...</h1>
    <p>All systems entering nap mode.</p>
    <p style="font-size:2rem;margin:8px 0">😴💤🐾</p>
    <button class="clay-btn accent" onclick="location.reload()">🐱 Wake Up</button>`;
  document.body.appendChild(ov);
  SND.purr(false);
}
