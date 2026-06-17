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
  toast('🐾 Welcome to CatOS 2.0!');
  SND.play('meow');
  setTimeout(()=>SND.purr(true), 1500);
  setTimeout(()=>SND.purr(false), 4000);
  setTimeout(()=>openApp('aboutme'), 900);
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
  { name:'Purple Dream', src:'wp1.jpg' },
  { name:'Night Forest', src:'wp2.jpg' },
  { name:'Candy Sky',    src:'wp3.jpg' },
  { name:'Cat Cafe',     src:'wp4.jpg' },
  { name:'Space Meow',   src:'wp5.jpg' },
  { name:'Pastel Paws',  src:'wp6.jpg' },
];

function loadWallpaper(){
  const saved = LS.get('catos-wallpaper', null);
  applyWallpaper(saved || 'wp1.jpg');
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
  WP_PRESETS.forEach(wp=>{
    const d=document.createElement('div'); d.className='wp-preset-thumb';
    d.innerHTML=`<img src="${wp.src}" onerror="this.parentElement.style.background='var(--c-surface2)'"/><span>${wp.name}</span>`;
    d.onclick=()=>{
      applyWallpaper(wp.src);
      document.querySelectorAll('.wp-preset-thumb').forEach(t=>t.classList.remove('selected'));
      d.classList.add('selected');
      toast('🖼️ Wallpaper changed!');
      closeWpPicker();
    };
    grid.appendChild(d);
  });
}
function handleWpUpload(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{ applyWallpaper(ev.target.result); toast('🖼️ Custom wallpaper set!'); closeWpPicker(); };
  reader.readAsDataURL(file);
}
function openWallpaperPicker(){ document.getElementById('wp-picker').classList.remove('hidden'); hideCtx(); }
function closeWpPicker(){ document.getElementById('wp-picker').classList.add('hidden'); }

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
  memes:        { title:'Meme Gallery',    icon:'gallery.png',  w:640, h:520 },
  browser:      { title:'PurrFox',         icon:'browser.png',  w:740, h:540 },
  notepad:      { title:'Pawpad',          icon:'notepad.png',  w:560, h:430 },
  music:        { title:'MeowTunes',       icon:'music.png',    w:420, h:580 },
  paint:        { title:'CatPaint',        icon:'paint.png',    w:760, h:540 },
  terminal:     { title:'CatShell',        icon:'terminal.png', w:600, h:420 },
  files:        { title:'Fur Files',       icon:'files.png',    w:600, h:440 },
  calculator:   { title:'Calc-Cat',        icon:'calc.png',     w:300, h:500 },
  game:         { title:'Catch Yarn',      icon:'game.png',     w:640, h:500 },
  settings:     { title:'Settings',        icon:'settings.png', w:540, h:440 },
  calendar:     { title:'PurrPlanner',     icon:'calendar.png', w:500, h:480 },
  chat:         { title:'MeowChat',        icon:'chat.png',     w:640, h:460 },
  aboutme:      { title:'About Me',        icon:'owner.jpg',    w:420, h:560 },
  notifications:{ title:'Notifications',   icon:'bell.png',     w:380, h:420 },
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
    notifications:initNotifications, aboutme:initAboutMe
  };
  if(map[id]) map[id]();
}

/* ══════════════════════════════════════════════════
   MEMES APP
══════════════════════════════════════════════════ */
const MEMES=[
  { img:'meme1.jpg', top:'ONE DOES NOT SIMPLY',   bot:'IGNORE A CAT',            sub:'When the cat stares into your soul at 3am' },
  { img:'meme2.jpg', top:'I CAN HAS',             bot:'CHEEZBURGER?',            sub:'The original. The legend. The classic.' },
  { img:'meme3.jpg', top:'NOT SURE IF HUNGRY',    bot:'OR JUST BORED',           sub:'Cats eating for emotional reasons' },
  { img:'meme4.jpg', top:'THIS IS FINE',          bot:'*everything is on fire*', sub:'Cat comfort level: maximum denial' },
  { img:'meme5.jpg', top:'NOBODY:',               bot:'CAT AT 3AM: ZOOMIES',     sub:'Midnight energy is a feline superpower' },
  { img:'meme6.jpg', top:'GRUMPY CAT SAYS',       bot:'NO. JUST NO.',            sub:'Every Monday. Forever.' },
  { img:'meme7.jpg', top:'IN ANCIENT EGYPT',      bot:'I WAS WORSHIPPED',        sub:'Cats have not forgotten this' },
  { img:'meme8.jpg', top:'YOU HAD ME AT',         bot:'"PSPSPSPSPS"',            sub:'Cats and the sacred summoning call' },
  { img:'meme9.jpg', top:'SURPRISE MOTHERFLUFFER',bot:'🐾🐾🐾',                  sub:'When you open the treat cabinet' },
  { img:'meme10.jpg',top:'HOVER CAT',             bot:'IS WATCHING YOU',         sub:'Always watching. Always judging.' },
  { img:'meme11.jpg',top:'I SLEEP',               bot:'NOT YOUR PROBLEM',        sub:'Cat work ethic: aspirational' },
  { img:'meme12.jpg',top:'NYAN NYAN NYAN',        bot:'NYAN NYAN NYAN NYAN',     sub:'2011 forever' },
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
      <div class="br-shortcut" onclick="browserNav('cat://news')"><img src="news.png" onerror="this.outerHTML='📰'"/>News</div>
      <div class="br-shortcut" onclick="browserNav('cat://social')"><img src="chat.png" onerror="this.outerHTML='💬'"/>PawBook</div>
      <div class="br-shortcut" onclick="browserNav('cat://wiki')"><img src="notepad.png" onerror="this.outerHTML='📚'"/>WikiPurrdia</div>
      <div class="br-shortcut" onclick="browserNav('cat://shop')"><img src="shop.png" onerror="this.outerHTML='🛍️'"/>PawMart</div>
      <div class="br-shortcut" onclick="browserNav('cat://games')"><img src="game.png" onerror="this.outerHTML='🎮'"/>Games</div>
      <div class="br-shortcut" onclick="browserNav('cat://weather')"><img src="weather.png" onerror="this.outerHTML='🌤️'"/>Weather</div>
      <div class="br-shortcut" onclick="browserNav('cat://music')"><img src="music.png" onerror="this.outerHTML='🎵'"/>MeowTunes</div>
      <div class="br-shortcut" onclick="browserNav('cat://mail')"><img src="mail.png" onerror="this.outerHTML='📧'"/>PurrMail</div>
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
  { title:'Nyan Cat Theme',     artist:'Daniwell',       album:'Nyan Cat OST',    src:'nyan.mp3',     cover:'cover1.jpg', dur:'3:37' },
  { title:'Meow (Cat Song)',    artist:'Jingle Punks',   album:'Cat Beats',       src:'meow.mp3',     cover:'cover2.jpg', dur:'2:15' },
  { title:'Keyboard Cat',       artist:'Charlie Schmidt', album:'Internet Gold',   src:'keyboard.mp3', cover:'cover3.jpg', dur:'0:54' },
  { title:'Cat Vibes Lo-fi',    artist:'LoFi Cat',       album:'Chill Paws',      src:'lofi.mp3',     cover:'cover4.jpg', dur:'3:50' },
  { title:'Stray Cat Strut',    artist:'The Stray Cats',  album:'Built for Speed', src:'stray.mp3',    cover:'cover5.jpg', dur:'3:12' },
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
      <img class="pl-cover" src="${t.cover}" onerror="this.src='cover1.jpg'"/>
      <div class="pl-info"><div class="pl-title">${t.title}</div><div class="pl-artist">${t.artist}</div></div>
      <div class="pl-dur">${t.dur}</div>
    </div>`).join('');
}
function loadTrack(i){
  MX.idx=i; const t=TRACKS[i];
  const art=document.getElementById('music-art'); if(art){ art.src=t.cover; art.onerror=()=>art.src='cat-icon.png'; }
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
    { img:'notepad.png',  name:'resume_cat.pdf',    isImg:false },
    { img:'owner.jpg',    name:'selfie_01.jpg',      isImg:true  },
    { img:null,           name:'Projects/',          isImg:false, isDir:true },
    { img:'nyan.gif',     name:'nyan_cat.gif',       isImg:true  },
    { img:null,           name:'secrets.txt',        isImg:false },
    { img:null,           name:'box_collection/',    isImg:false, isDir:true },
  ],
  pictures:[
    { img:'owner.jpg',    name:'selfie_01.jpg',  isImg:true },
    { img:'cat1.jpg',     name:'nap_2024.jpg',   isImg:true },
    { img:'cat2.jpg',     name:'laser_chase.jpg',isImg:true },
    { img:'cat3.jpg',     name:'sunbeam.jpg',    isImg:true },
    { img:'nyan.gif',     name:'nyan_cat.gif',   isImg:true },
    { img:'owner.jpg',    name:'birdwatch.jpg',  isImg:true },
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
      <img src="owner.jpg" class="about-img" onerror="this.style.display='none'"/>
      <h2>CatOS 2.0</h2>
      <p><b>Powered by Paws™</b><br>The world's most feline operating system.<br><br>
      Kernel: PurrLinux 6.9-meow<br>Desktop: CatDE 2.0 (Clay Edition)<br>Memory: 9 lives / 16 GB<br>Storage: Infinite boxes<br><br>
      Built with ❤️ by ajmaleee__<br><br>
      🐾 In cats we trust 🐾</p>
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
  whiskers:{name:'Whiskers',av:'cat1.jpg',status:'🟢 Online',msgs:[
    {me:false,text:'Meow! How are you doing today?'},
    {me:false,text:'I found the best sunbeam. You should come see it.'},
  ]},
  mittens:{name:'Mittens',av:'cat2.jpg',status:'🟢 Online',msgs:[
    {me:false,text:'Did you see that laser dot?! IT WAS THERE AND THEN IT WASNT.'},
    {me:false,text:'I have been thinking about it for 3 hours now.'},
  ]},
  chairman:{name:'Chairman Meow',av:'cat3.jpg',status:'🔴 Demanding',msgs:[
    {me:false,text:'I demand treats. NOW. The time for delay is OVER.'},
    {me:false,text:'The humans have been warned. Treats or the vase gets it.'},
  ]},
  nyancat:{name:'Nyan Cat',av:'nyan.gif',status:'🟢 Nyaning',msgs:[
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
   SHUTDOWN
══════════════════════════════════════════════════ */
function shutDown(){
  // Close all windows
  Object.keys(openWins).forEach(id=>closeWin(id));
  const ov=document.createElement('div'); ov.id='shutdown-overlay';
  ov.innerHTML=`
    <img src="owner.jpg" class="shut-photo" onerror="this.style.display='none'"/>
    <h1>CatOS Napping...</h1>
    <p>All systems entering nap mode.</p>
    <p style="font-size:2rem;margin:8px 0">😴💤🐾</p>
    <button class="clay-btn accent" onclick="location.reload()">🐱 Wake Up</button>`;
  document.body.appendChild(ov);
  SND.purr(false);
}
