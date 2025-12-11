let burnInInterval = null;
let currentEventKey = null;

const defaultSettings = {
  accent: '#50E3C2',
  clockFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  bgBrightness: '0.6',
  bgOpacity: '1.0',
  glassOpacity: '0.55',
  clockSize: '10',
  idleImgUrl: '',
  cntTitle: 'イベント',
  cntDate: '',
  burnIn: false,
  userName: 'User', 
  showSeconds: false,
  showQuote: true,
  showWeather: true,
  showNews: true,
  newsUrl: '', 
  showCountdown: true,
  showMusic: true,
  showCalendar: true,
  mediaYT: true,
  mediaYTMusic: true,
  mediaSpotify: true
};
const defaultWallpapers = [
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2070',
  'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070',
  'https://images.unsplash.com/photo-1534237710431-e2fc698436d0?q=80&w=2070',
  'https://images.unsplash.com/photo-1519681393798-2f15f18e901b?q=80&w=2070'
];

const defaultDockItems = [
  { icon: "▶", url: "https://www.youtube.com/" },
  { icon: "𝕏", url: "https://x.com/" },
  { icon: "✉️", url: "https://mail.google.com/" },
  { icon: "map", url: "https://www.google.com/maps" }
];

function shouldRun() {
  if (window.location.href.includes('/maps')) return false;
  if (window.location.pathname === "/search") return false;
  if (window.location.href.includes("?q=")) return false;
  return true;
}

if (shouldRun()) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNestHub);
  } else {
    initNestHub();
  }
} else {
  document.body.classList.remove('immersion-mode');
}

setInterval(() => {
  if (window.location.pathname === "/search" || window.location.href.includes("?q=")) {
    document.getElementById('immersion-root')?.remove();
    document.body.classList.remove('immersion-mode');
  }
}, 300);

function initNestHub() {
  if (document.getElementById('immersion-root')) return;

  const manifest = chrome.runtime.getManifest();
  const appName = manifest.name;
  const appVersion = manifest.version;
  const appDesc = manifest.description;

  document.body.classList.add('immersion-mode');
  const root = document.createElement('div');
  root.id = 'immersion-root';
  const city = localStorage.getItem('immersion_city') || 'Tokyo';
  const savedMemo = localStorage.getItem('immersion_memo') || '';
  
  root.innerHTML = `
    <div id="bg-layer"></div>

    <div class="col col-left">
      <div id="card-weather" class="glass-card tilt-card weather-card" style="flex:1;">
        <div class="aw-header">
          <div class="aw-city" id="change-city" style="cursor:pointer">📍 ${city}</div>
          <div class="aw-cond" id="w-cond">--</div>
        </div>
        <div class="aw-main">
          <div class="aw-icon" id="w-icon">☁️</div>
          <div class="aw-temp" id="w-temp">--°</div>
        </div>
        <div class="aw-footer">
          <span>高:<span id="w-high">--</span>° 低:<span id="w-low">--</span>°</span>
          <span><span id="w-wind">--</span></span>
        </div>
      </div>

      <div id="card-news" class="glass-card tilt-card" style="flex:1.2;">
        <div class="label-std">News</div>
        <div id="news-list" style="display:flex; flex-direction:column; gap:4px;">Loading...</div>
      </div>

      <div id="card-countdown" class="glass-card tilt-card countdown-card" style="flex:0.8; justify-content:center; align-items:center;">
        <div class="label-std" style="width:100%; text-align:left; margin-bottom:0;" id="cnt-label">EVENT</div>
        <div class="cnt-main">
          <div class="cnt-days-wrapper">
            <span id="cnt-days" class="cnt-big">--</span>
            <span class="cnt-unit">DAYS</span>
          </div>
          <div class="cnt-sub-wrapper">
             <span id="cnt-hms" class="cnt-sub">--:--:--</span>
          </div>
        </div>
      </div>
    </div>

    <div class="col col-center">
      <div class="clock-container">
        <div id="clock-time">00:00</div>
        <div id="clock-date">Reading...</div>
      </div>
      
      <div id="quote-box">
        <div id="quote-text">Hello</div>
        <div id="quote-author">Have a nice day</div>
      </div>

      <div id="memo-area">
        <input type="text" id="memo-input" placeholder="メモを入力..." value="${savedMemo}" autocomplete="off">
      </div>

      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input id="search-input" type="text" placeholder="Google 検索..." autocomplete="off">
      </div>

      <div class="dock" id="main-dock">
        <div class="dock-separator"></div>
        <div class="dock-item tilt-card" id="zen-btn" title="Zenモード">ZEN</div>
        <div class="dock-item tilt-card" id="settings-btn" title="設定">⚙️</div>
      </div>
    </div>

    <div class="col col-right">
      <div id="music-card-container" class="glass-card tilt-card music-idle">
        <div class="music-panel">
          <div class="album-art" id="album-art"></div>
          <div class="track-info-wrap"><span class="track-title" id="track-title">Title</span></div>
          <div class="track-artist" id="track-artist">Artist</div>
          <div class="controls">
             <div class="ctrl-btn" id="btn-prev">⏮</div>
             <div class="ctrl-btn play-btn" id="btn-play">▶</div>
             <div class="ctrl-btn" id="btn-next">⏭</div>
          </div>
        </div>
        <div class="idle-mode-content">
          <div class="day-of-week" id="idle-day">MONDAY</div>
          <div class="big-date" id="idle-date">--</div>
          <div class="month-label" id="idle-month">DECEMBER 2025</div>
        </div>
      </div>

      <div id="card-calendar" class="glass-card tilt-card calendar-card">
        <div class="label-std" style="text-align:center;"><span id="cal-month">Calendar</span></div>
        <div class="cal-grid" id="cal-grid"></div>
        <div class="event-list-area" id="event-list"></div>
      </div>
    </div>

    <div id="settings-modal" class="overlay-modal">
      <div class="settings-window">
        <nav class="st-sidebar">
          <button class="st-tab-btn active" data-tab="tab-general"><span>🏠</span> 一般</button>
          <button class="st-tab-btn" data-tab="tab-appearance"><span>🎨</span> 外観・時計</button>
          <button class="st-tab-btn" data-tab="tab-media"><span>🎵</span> メディア連携</button>
          <button class="st-tab-btn" data-tab="tab-dock"><span>⚓</span> Dock</button>
          <div style="flex:1"></div>
          <button class="st-tab-btn" data-tab="tab-about"><span>ℹ️</span> 情報</button>
        </nav>

        <div class="st-main">
          <div class="st-header">
            <span class="st-title" id="st-header-title">一般設定</span>
            <div class="close-modal-btn" id="close-settings">×</div>
          </div>
          
          <div class="st-content-scroll">
            
            <div id="tab-general" class="st-section active">
              <div class="st-group-title">プロフィール</div>
              <div class="st-row column-layout">
                <span>ユーザー名 (挨拶用)</span>
                <div class="input-with-btn">
                  <input type="text" id="set-user-name" placeholder="名前を入力..." class="st-input">
                </div>
              </div>

              <div class="st-group-title">動作設定</div>
              <div class="st-row"><span>新しいタブをGoogleにする</span><label class="toggle-switch"><input type="checkbox" id="set-newtab-redirect"><span class="slider"></span></label></div>

              <div class="st-group-title">表示モジュール</div>
              <div class="st-row"><span>挨拶メッセージ</span><label class="toggle-switch"><input type="checkbox" id="set-show-quote"><span class="slider"></span></label></div>
              <div class="st-row"><span>天気カード</span><label class="toggle-switch"><input type="checkbox" id="set-show-weather"><span class="slider"></span></label></div>
              <div class="st-row"><span>ニュースカード</span><label class="toggle-switch"><input type="checkbox" id="set-show-news"><span class="slider"></span></label></div>
              <div class="st-row column-layout">
                <span>RSS URL (ニュースソース)</span>
                <input type="text" id="set-news-url" placeholder="https://news.yahoo.co.jp/rss/topics/it.xml" class="st-input">
                <div style="font-size:0.75rem; opacity:0.6; margin-top:4px;">※ RSSフィードのURLを入力してください</div>
              </div>

              <div class="st-row"><span>カウントダウン</span><label class="toggle-switch"><input type="checkbox" id="set-show-countdown"><span class="slider"></span></label></div>
              
              <div class="st-group-title">イベント設定</div>
              <div class="st-row column-layout">
                <span>カウントダウン対象</span>
                <input type="text" id="set-cnt-title" placeholder="イベント名" class="st-input" style="margin-bottom:8px;">
                <div class="input-with-btn">
                  <input type="datetime-local" id="set-cnt-date" class="st-input">
                  <button id="btn-apply-cnt" class="st-btn-small">更新</button>
                </div>
              </div>
            </div>

            <div id="tab-appearance" class="st-section">
              <div class="st-group-title">時計スタイル</div>
              <div class="st-row"><span>秒を表示</span><label class="toggle-switch"><input type="checkbox" id="set-show-seconds"><span class="slider"></span></label></div>
              <div class="st-row">
                <span>フォント</span>
                <select id="set-font" class="st-select">
                  <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">標準 (System)</option>
                  <option value="'Inter', sans-serif">モダン (Inter)</option>
                  <option value="'Bebas Neue', sans-serif">インパクト (Bebas)</option>
                  <option value="'Shippori Mincho', serif">明朝体 (Shippori)</option>
                  <option value="'JetBrains Mono', monospace">Mono (JetBrains)</option>
                </select>
              </div>
              <div class="st-row"><span>サイズ</span><input type="range" id="set-size" min="4" max="20" step="0.5" class="st-range"></div>

              <div class="st-group-title">テーマ・壁紙</div>
              <div class="st-row"><span>アクセント色</span><input type="color" id="set-accent" class="st-color"></div>
              <div class="st-row"><span>背景の明るさ</span><input type="range" id="set-bright" min="0.1" max="1.0" step="0.1" class="st-range"></div>
              <div class="st-row"><span>背景の不透明度</span><input type="range" id="set-opacity" min="0" max="1.0" step="0.1" class="st-range"></div>
              <div class="st-row"><span>カード透明度</span><input type="range" id="set-glass-opacity" min="0.1" max="0.9" step="0.05" class="st-range"></div>
              <div class="st-row"><span>焼き付き防止 (5分毎)</span><label class="toggle-switch"><input type="checkbox" id="set-burnin"><span class="slider"></span></label></div>
              
              <div class="st-row column-layout">
                <span>カスタム壁紙 URL</span>
                <div class="input-with-btn">
                  <input type="text" id="set-img" placeholder="https://..." class="st-input">
                  <button id="btn-apply-img" class="st-btn-small">適用</button>
                </div>
              </div>
            </div>

            <div id="tab-media" class="st-section">
              <div class="st-group-title">連携サービス</div>
              <div class="st-row"><span>YouTube</span><label class="toggle-switch"><input type="checkbox" id="set-media-yt"><span class="slider"></span></label></div>
              <div class="st-row"><span>YouTube Music</span><label class="toggle-switch"><input type="checkbox" id="set-media-ytm"><span class="slider"></span></label></div>
              <div class="st-row"><span>Spotify</span><label class="toggle-switch"><input type="checkbox" id="set-media-spotify"><span class="slider"></span></label></div>
              <div style="font-size:0.8rem; opacity:0.6; padding:10px;">※ バックグラウンドで開いているタブから情報を取得します。</div>
            </div>

            <div id="tab-dock" class="st-section">
              <div class="st-group-title">ショートカット編集</div>
              <div id="dock-settings-list"></div>
              <button id="add-dock-item-btn" class="st-btn" style="margin-top:10px;">+ アイテムを追加</button>
            </div>

            <div id="tab-about" class="st-section">
              <div class="about-hero" style="padding-top:80px; padding-bottom:60px;">
                <div class="about-title" style="font-size:2.2rem; margin-bottom:10px;">${appName}</div>
                <div class="about-version" style="font-size:1rem; opacity:0.7;">Version ${appVersion}</div>
                <div style="font-size:0.9rem; color:rgba(255,255,255,0.5); margin:20px auto; max-width:80%; line-height:1.6;">${appDesc}</div>
                
                <div class="about-badge" style="margin-top:20px;">Owner: <span id="about-owner-name">User</span></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <div id="event-modal" class="overlay-modal">
      <div class="glass-card modal-card">
        <div class="st-header"><span class="st-title" id="ev-modal-date">日付</span><span class="close-modal-btn" id="close-event">×</span></div>
        <div style="padding:20px;">
           <input type="text" id="ev-input" class="st-input big-input" placeholder="予定を入力..." autocomplete="off">
           <div class="modal-actions"><button id="ev-delete" class="st-btn danger-btn">削除</button><button id="ev-save" class="st-btn primary-btn">保存</button></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);
  
  chrome.storage.local.get(['redirectNewTab'], (r) => {
    const el = document.getElementById('set-newtab-redirect');
    if(el) el.checked = r.redirectNewTab !== false; 
  });

  applyPreferences(); 
  renderDock();
  initSettingsLogic(); 
  startClock();
  setupSearch();
  setupMemo();
  setupCountdown();
  setupZenMode();
  setupBurnInProtection(); 
  renderCalendarSystem();
  fetchWeather(city);
  fetchNews();
  updateQuote(); 
  startMediaSync();
  initTiltEffect();
  initUpdateChecker();
}

function applyPreferences() {
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty('--accent', prefs.accent);
  rootStyle.setProperty('--clock-font', prefs.clockFont);
  rootStyle.setProperty('--bg-brightness', prefs.bgBrightness);
  rootStyle.setProperty('--bg-opacity', prefs.bgOpacity || '1.0');
  rootStyle.setProperty('--glass-opacity', prefs.glassOpacity || '0.55');
  rootStyle.setProperty('--clock-size', (prefs.clockSize || '10') + 'rem');
  
  const setVal = (id, v) => { const el = document.getElementById(id); if(el) el.value = v; };
  
  setVal('set-user-name', prefs.userName || 'User'); 
  setVal('set-news-url', prefs.newsUrl || ''); 
  
  const ownerLabel = document.getElementById('about-owner-name');
  if(ownerLabel) ownerLabel.innerText = prefs.userName || 'User';

  setVal('set-accent', prefs.accent);
  setVal('set-font', prefs.clockFont);
  setVal('set-bright', prefs.bgBrightness);
  setVal('set-size', prefs.clockSize || '10');
  setVal('set-opacity', prefs.bgOpacity || '1.0');
  setVal('set-glass-opacity', prefs.glassOpacity || '0.55');
  setVal('set-img', prefs.idleImgUrl || '');
  setVal('set-cnt-title', prefs.cntTitle || '');
  setVal('set-cnt-date', prefs.cntDate || '');

  const setCheck = (id, v) => { const el = document.getElementById(id); if(el) el.checked = v !== false; };
  setCheck('set-burnin', prefs.burnIn);
  setCheck('set-show-seconds', prefs.showSeconds);
  setCheck('set-show-quote', prefs.showQuote);
  setCheck('set-show-weather', prefs.showWeather);
  setCheck('set-show-news', prefs.showNews);
  setCheck('set-show-countdown', prefs.showCountdown);
  setCheck('set-show-music', prefs.showMusic);
  setCheck('set-show-calendar', prefs.showCalendar);
  
  setCheck('set-media-yt', prefs.mediaYT);
  setCheck('set-media-ytm', prefs.mediaYTMusic);
  setCheck('set-media-spotify', prefs.mediaSpotify);
  setCheck('set-media-apple', prefs.mediaApple);
  setCheck('set-media-netflix', prefs.mediaNetflix);

  const toggle = (id, visible) => {
    const el = document.getElementById(id);
    if(el) el.style.display = (visible === false) ? 'none' : 'flex'; 
    if(id === 'quote-box' && el) el.style.display = (visible === false) ? 'none' : 'block';
  };

  toggle('quote-box', prefs.showQuote);
  toggle('card-weather', prefs.showWeather);
  toggle('card-news', prefs.showNews);
  toggle('card-countdown', prefs.showCountdown);
  toggle('music-card-container', prefs.showMusic);
  toggle('card-calendar', prefs.showCalendar);
}

function savePreferences() {
  const getVal = (id) => document.getElementById(id)?.value;
  const getChk = (id) => document.getElementById(id)?.checked;
  
  const prefs = {
    userName: getVal('set-user-name'), 
    accent: getVal('set-accent'),
    clockFont: getVal('set-font'),
    bgBrightness: getVal('set-bright'),
    bgOpacity: getVal('set-opacity'),
    glassOpacity: getVal('set-glass-opacity'),
    clockSize: getVal('set-size'),
    idleImgUrl: getVal('set-img'),
    cntTitle: getVal('set-cnt-title'),
    cntDate: getVal('set-cnt-date'),
    burnIn: getChk('set-burnin'),
    showSeconds: getChk('set-show-seconds'),
    showQuote: getChk('set-show-quote'),
    showWeather: getChk('set-show-weather'),
    showNews: getChk('set-show-news'),
    newsUrl: getVal('set-news-url'), 
    showCountdown: getChk('set-show-countdown'),
    mediaYT: getChk('set-media-yt'),
    mediaYTMusic: getChk('set-media-ytm'),
    mediaSpotify: getChk('set-media-spotify')
  };
  
  localStorage.setItem('immersion_prefs', JSON.stringify(prefs));


  applyPreferences();      
  setupBurnInProtection(); 
  updateQuote();
  fetchNews(); 
}  


function initSettingsLogic() {
  const modal = document.getElementById('settings-modal');
  const openBtn = document.getElementById('settings-btn');
  const closeBtn = document.getElementById('close-settings');
  
  openBtn.onclick = (e) => { e.stopPropagation(); modal.classList.add('show'); renderDockSettingsList(); };
  closeBtn.onclick = () => modal.classList.remove('show');
  modal.onclick = (e) => { if(e.target === modal) modal.classList.remove('show'); };
  
  const tabs = document.querySelectorAll('.st-tab-btn');
  const sections = document.querySelectorAll('.st-section');
  const title = document.getElementById('st-header-title');
  
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
      
      title.innerText = tab.innerText.replace(/^[^\s]+\s/, ''); 
    };
  });

  ['set-accent', 'set-font', 'set-bright', 'set-size', 'set-opacity', 'set-glass-opacity', 'set-user-name', 'set-news-url'].forEach(id => {
    document.getElementById(id)?.addEventListener(id === 'set-font' ? 'change' : 'input', savePreferences);
  });
  
  [
    'set-burnin', 'set-show-seconds', 'set-show-quote', 'set-show-weather', 'set-show-news', 'set-show-countdown', 'set-show-music', 'set-show-calendar',
    'set-media-yt', 'set-media-ytm', 'set-media-spotify', 'set-media-apple', 'set-media-netflix'
  ].forEach(id => document.getElementById(id)?.addEventListener('change', savePreferences));

  document.getElementById('set-newtab-redirect')?.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    chrome.storage.local.set({ redirectNewTab: isChecked });
  });

  document.getElementById('btn-apply-img').onclick = () => {
    savePreferences();
    const prefs = JSON.parse(localStorage.getItem('immersion_prefs'));
    const bgLayer = document.getElementById('bg-layer');
    if(bgLayer && prefs.idleImgUrl) bgLayer.style.backgroundImage = `url('${prefs.idleImgUrl}')`;
    alert("壁紙を更新しました");
  };

  document.getElementById('btn-apply-cnt').onclick = () => {
    savePreferences();
    alert("イベントを設定しました");
  };
  
  document.getElementById('add-dock-item-btn').onclick = addDockItem;
}

function setupBurnInProtection() {
  if (burnInInterval) clearInterval(burnInInterval);
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  if (prefs.burnIn) {
    burnInInterval = setInterval(() => {
      document.body.classList.add('burn-in-active');
      setTimeout(() => {
        document.body.classList.remove('burn-in-active');
        const root = document.getElementById('immersion-root');
        if(root) {
          const x = Math.floor(Math.random() * 6) - 3; 
          const y = Math.floor(Math.random() * 6) - 3;
          root.style.padding = `${30 + y}px ${30 + x}px ${30 - y}px ${30 - x}px`;
        }
      }, 8000);
    }, 300000);
  }
}
function renderCalendarSystem() {
  const grid = document.getElementById('cal-grid');
  const eventList = document.getElementById('event-list');
  const now = new Date();
  const year = now.getFullYear(); const month = now.getMonth();
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  document.getElementById('cal-month').innerText = `${year}年 ${months[month]}`;
  grid.innerHTML = ['日','月','火','水','木','金','土'].map(w => `<div class="cal-head">${w}</div>`).join('');
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month+1, 0).getDate();
  for(let i=0; i<firstDay; i++) grid.innerHTML += `<div></div>`;
  for(let d=1; d<=lastDate; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell'; cell.innerText = d;
    if(d === now.getDate()) cell.classList.add('cal-today');
    const key = `event_${year}_${month}_${d}`;
    if(localStorage.getItem(key)) cell.classList.add('cal-has-event');
    cell.onclick = () => openEventModal(year, month, d);
    grid.appendChild(cell);
  }
  eventList.innerHTML = ''; let h = false;
  for(let d=1; d<=lastDate; d++) {
    const k = `event_${year}_${month}_${d}`; const v = localStorage.getItem(k);
    if(v) { h=true; const r=document.createElement('div'); r.className='event-row'; r.innerHTML=`<span class="event-date-badge">${d}</span><span class="event-content">${v}</span>`; r.onclick = () => openEventModal(year, month, d); eventList.appendChild(r); }
  }
  if(!h) eventList.innerHTML = '<div style="opacity:0.5; font-size:0.8rem; text-align:center; padding:10px;">予定はありません</div>';
}
function openEventModal(year, month, day) {
  const modal = document.getElementById('event-modal'); const input = document.getElementById('ev-input'); const dateLabel = document.getElementById('ev-modal-date');
  const closeBtn = document.getElementById('close-event'); const saveBtn = document.getElementById('ev-save'); const delBtn = document.getElementById('ev-delete');
  currentEventKey = `event_${year}_${month}_${day}`; const currentVal = localStorage.getItem(currentEventKey) || "";
  dateLabel.innerText = `${month + 1}月${day}日 の予定`; input.value = currentVal; modal.classList.add('show'); input.focus();
  const close = () => modal.classList.remove('show'); closeBtn.onclick = close; modal.onclick = (e) => { if(e.target === modal) close(); };
  saveBtn.onclick = () => { if(input.value) localStorage.setItem(currentEventKey, input.value); else localStorage.removeItem(currentEventKey); renderCalendarSystem(); close(); };
  delBtn.onclick = () => { localStorage.removeItem(currentEventKey); renderCalendarSystem(); close(); }; input.onkeydown = (e) => { if(e.key === 'Enter') saveBtn.click(); };
}
function setupCountdown() {
  const update = () => {
    const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    const titleEl = document.getElementById('cnt-label'); const daysEl = document.getElementById('cnt-days'); const hmsEl = document.getElementById('cnt-hms');
    if (!prefs.cntDate) { titleEl.innerText = "NO EVENT"; daysEl.innerText = "--"; hmsEl.innerText = "--:--:--"; return; }
    titleEl.innerText = prefs.cntTitle || "EVENT";
    const target = new Date(prefs.cntDate).getTime(); const now = new Date().getTime(); const diff = target - now;
    if (diff < 0) { daysEl.innerText = "0"; hmsEl.innerText = "FINISHED"; } 
    else { const d = Math.floor(diff / (1000 * 60 * 60 * 24)); const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); const s = Math.floor((diff % (1000 * 60)) / 1000); daysEl.innerText = d; hmsEl.innerText = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
  }; setInterval(update, 1000); update();
}
function getDockItems() { const saved = localStorage.getItem('immersion_dock_items'); return saved ? JSON.parse(saved) : defaultDockItems; }
function renderDock() {
  const dock = document.getElementById('main-dock'); const items = getDockItems(); const existing = dock.querySelectorAll('.dynamic-dock-item'); existing.forEach(el => el.remove());
  items.forEach(item => { const div = document.createElement('div'); div.className = 'dock-item tilt-card dynamic-dock-item'; div.innerText = item.icon; div.title = item.url; div.onclick = () => { if(item.url.includes('%s')) { const input = document.getElementById('search-input'); const v = input.value; window.location.href = v ? item.url.replace('%s', encodeURIComponent(v)) : item.url.split('?')[0]; } else { window.location.href = item.url; } }; dock.insertBefore(div, document.querySelector('.dock-separator')); }); initTiltEffect();
}
function renderDockSettingsList() {
  const list = document.getElementById('dock-settings-list'); list.innerHTML = ''; const items = getDockItems();
  items.forEach((item, index) => { const row = document.createElement('div'); row.className = 'dock-setting-row'; row.innerHTML = `<input type="text" class="ds-icon" value="${item.icon}" placeholder="絵"><input type="text" class="ds-url" value="${item.url}" placeholder="URL"><button class="ds-del">×</button>`; const iI = row.querySelector('.ds-icon'); const uI = row.querySelector('.ds-url'); const d = row.querySelector('.ds-del'); const save = () => { items[index].icon = iI.value; items[index].url = uI.value; localStorage.setItem('immersion_dock_items', JSON.stringify(items)); renderDock(); }; iI.oninput = save; uI.oninput = save; d.onclick = () => { items.splice(index, 1); localStorage.setItem('immersion_dock_items', JSON.stringify(items)); renderDockSettingsList(); renderDock(); }; list.appendChild(row); });
}
function addDockItem() { const items = getDockItems(); items.push({ icon: "🔗", url: "https://example.com" }); localStorage.setItem('immersion_dock_items', JSON.stringify(items)); renderDockSettingsList(); renderDock(); }
function setupSearch() { const input = document.getElementById('search-input'); input.focus(); input.addEventListener('keydown', (e) => { if(e.key === 'Enter' && input.value) window.location.href = `https://www.google.com/search?q=${encodeURIComponent(input.value)}`; }); document.getElementById('change-city').onclick = () => { const c = prompt("都市名を入力してください (英語):", "Tokyo"); if(c) { localStorage.setItem('immersion_city', c); fetchWeather(c); } }; }
function setupZenMode() { const btn = document.getElementById('zen-btn'); if (btn) btn.onclick = (e) => { e.stopPropagation(); document.body.classList.toggle('zen-active'); }; }
function setupMemo() { const input = document.getElementById('memo-input'); input.addEventListener('input', () => { localStorage.setItem('immersion_memo', input.value); }); }
function updateQuote() {
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  const name = prefs.userName || "Guest";
  const now = new Date();
  const hour = now.getHours();
  
  let greeting = "";
  let subText = "";

  if (hour >= 5 && hour < 11) {
    greeting = `おはようございます、${name}さん`;
    subText = "今日も良い一日を。";
  } else if (hour >= 11 && hour < 18) {
    greeting = `こんにちは、${name}さん`;
    subText = "午後の作業も頑張りましょう。";
  } else if (hour >= 18 && hour < 23) {
    greeting = `こんばんは、${name}さん`;
    subText = "今日もお疲れ様でした。";
  } else {
    greeting = `こんばんは、${name}さん`; 
    subText = "おやすみなさい。";
  }

  const qText = document.getElementById('quote-text');
  const qAuthor = document.getElementById('quote-author');
  
  if(qText) qText.innerText = greeting;
  if(qAuthor) qAuthor.innerText = subText; 
}

function startClock() {
  const update = () => {
    const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    const now = new Date(); const h = String(now.getHours()).padStart(2,'0'); const m = String(now.getMinutes()).padStart(2,'0');
    let timeStr = `${h}:${m}`; if(prefs.showSeconds) timeStr += `:${String(now.getSeconds()).padStart(2,'0')}`;
    const days = ['日', '月', '火', '水', '木', '金', '土']; const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    document.getElementById('clock-time').innerText = timeStr; document.getElementById('clock-date').innerText = `${months[now.getMonth()]}${now.getDate()}日 (${days[now.getDay()]})`;
  }; setInterval(update, 1000); update();
}
function fetchNews() { 
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  const targetUrl = prefs.newsUrl;
  const list = document.getElementById("news-list");

  if (!targetUrl) {
    list.innerHTML = '<div style="padding:10px; opacity:0.7; text-align:center;">設定からRSSのURLを<br>入力してください</div>';
    return;
  }

  chrome.runtime.sendMessage({ action: "fetchNews", url: targetUrl }, (res) => { 
    if(!res || res.error || !res.data) {
        list.innerHTML = '<div style="padding:10px; opacity:0.7; text-align:center;">取得できませんでした</div>';
        return;
    }
    
    const parser = new DOMParser(); 
    try {
      const doc = parser.parseFromString(res.data, "text/xml");
      const items = doc.querySelectorAll("item"); 
      
      list.innerHTML = ""; 
      
      if (items.length === 0) {
         list.innerHTML = '<div style="padding:10px; opacity:0.7; text-align:center;">記事が見つかりません</div>';
         return;
      }

      for(let i=0; i<6; i++) { 
        if(!items[i]) break; 
        const div = document.createElement("div"); 
        div.className = "news-item"; 
        div.innerText = items[i].querySelector("title").textContent; 
        const link = items[i].querySelector("link").textContent; 
        div.onclick = () => window.location.href = link; 
        list.appendChild(div); 
      }
    } catch(e) {
      list.innerHTML = '<div style="padding:10px; opacity:0.7; text-align:center;">RSS形式エラー</div>';
    }
  }); 
}


function fetchWeather(city) { chrome.runtime.sendMessage({ action: "fetchWeather", city: city }, (res) => { if(!res?.data) return; const w = res.data.current_weather; document.getElementById('w-temp').innerText = `${Math.round(w.temperature)}°`; document.getElementById('w-high').innerText = Math.round(w.temperature + 3); document.getElementById('w-low').innerText = Math.round(w.temperature - 2); document.getElementById('w-wind').innerText = `${w.windspeed}km/h`; document.getElementById('change-city').innerText = `📍 ${city}`; let icon = "☁️"; let text = "曇り"; const code = w.weathercode; if(code === 0) { icon = "☀️"; text = "快晴"; } else if(code <= 3) { icon = "⛅️"; text = "晴れ/曇り"; } else if(code >= 51) { icon = "🌧"; text = "雨"; } document.getElementById('w-icon').innerText = icon; document.getElementById('w-cond').innerText = text; }); }
function initTiltEffect() { const cards = document.querySelectorAll('.tilt-card'); cards.forEach(card => { card.onmousemove = (e) => { const r = card.getBoundingClientRect(); const x = e.clientX - r.left; const y = e.clientY - r.top; const cX = r.width / 2; const cY = r.height / 2; const rX = ((y - cY) / cY) * -6; const rY = ((x - cX) / cX) * 6; card.style.transform = `perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg) scale(1.02)`; }; card.onmouseleave = () => { card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`; }; }); }

function startMediaSync() {
  let currentArt = "";
  const bgLayer = document.getElementById('bg-layer'); 
  const container = document.getElementById('music-card-container');
  
  const getIdleImage = () => {
    const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    if (prefs.idleImgUrl && prefs.idleImgUrl.startsWith('http')) return prefs.idleImgUrl;
    return defaultWallpapers[Math.floor(Math.random() * defaultWallpapers.length)];
  };
  const sessionIdleArt = getIdleImage();
  if(bgLayer) bgLayer.style.backgroundImage = `url('${sessionIdleArt}')`;

  const loop = setInterval(() => {
    if (!chrome.runtime?.id) { clearInterval(loop); return; }
    try {
      const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
      
      chrome.runtime.sendMessage({ 
        action: "getYouTubeData",
        enabledSettings: {
          yt: prefs.mediaYT,
          ytm: prefs.mediaYTMusic,
          spotify: prefs.mediaSpotify
        }
      }, (res) => {
        if (chrome.runtime.lastError) return;
        
        if (res && res.status === "connected" && (res.data.isPlaying || (res.data.title && res.data.title !== ""))) {
          container?.classList.remove('music-idle'); container?.classList.add('music-active');
          const d = res.data;
          
          const titleEl = document.getElementById('track-title');
          if(titleEl) {
            const newTitle = d.title || "Unknown";
           
            if (titleEl.innerText !== newTitle) {
               titleEl.classList.remove('scroll-active'); 
               titleEl.innerText = newTitle;              
               
               
               if(titleEl.scrollWidth > titleEl.parentElement.clientWidth) {
                 titleEl.classList.add('scroll-active');
               }
            }
          }

          document.getElementById('track-artist').innerText = d.artist || "Unknown";
          document.getElementById('btn-play').innerText = d.isPlaying ? "⏸" : "▶";
          if (d.artwork) {
             document.getElementById('album-art').style.backgroundImage = `url(${d.artwork})`;
             if(currentArt !== d.artwork && bgLayer) { currentArt = d.artwork; bgLayer.style.backgroundImage = `url(${d.artwork})`; }
          }
        } else {
          container?.classList.remove('music-active'); container?.classList.add('music-idle');
          const now = new Date();
          const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
          const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
          document.getElementById('idle-day').innerText = days[now.getDay()];
          document.getElementById('idle-date').innerText = now.getDate();
          document.getElementById('idle-month').innerText = `${now.getFullYear()}年 ${months[now.getMonth()]}`;
          if(currentArt !== 'default' && bgLayer) { 
            currentArt = 'default'; 
            const p = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
            const targetImg = (p.idleImgUrl && p.idleImgUrl.startsWith('http')) ? p.idleImgUrl : sessionIdleArt;
            bgLayer.style.backgroundImage = `url('${targetImg}')`; 
          }
        }
      });
    } catch(e) { clearInterval(loop); }
  }, 1000);
  const send = (c) => { try{chrome.runtime.sendMessage({action:"controlYouTube", command:c});}catch(e){} };
  document.getElementById('btn-play').onclick = () => send("toggle");
  document.getElementById('btn-prev').onclick = () => send("prev");
  document.getElementById('btn-next').onclick = () => send("next");
}


function initUpdateChecker() {
  
  const CHECK_URL = 'https://raw.githubusercontent.com/naikaku1/Search-Immersion/refs/heads/main/manifest.json';
  const DOWNLOAD_PAGE = 'https://github.com/naikaku1/Search-Immersion'; 

  const currentVersion = chrome.runtime.getManifest().version;
  
  fetch(`${CHECK_URL}?t=${Date.now()}`)
    .then(res => {
      if (!res.ok) throw new Error('Update check failed');
      return res.json();
    })
    .then(remoteManifest => {
      if (isNewerVersion(remoteManifest.version, currentVersion)) {
        showUpdateBanner(remoteManifest.version, DOWNLOAD_PAGE);
      }
    })
    .catch(err => {
    });
}

function isNewerVersion(remote, local) {
  const rParts = remote.split('.').map(Number);
  const lParts = local.split('.').map(Number);
  for (let i = 0; i < Math.max(rParts.length, lParts.length); i++) {
    const r = rParts[i] || 0;
    const l = lParts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

function showUpdateBanner(newVer, linkUrl) {
  if (document.getElementById('immersion-update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'immersion-update-banner';
  
  Object.assign(banner.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '320px',
    padding: '16px 20px',
    background: 'rgba(20, 20, 25, 0.75)',
    backdropFilter: 'blur(20px)',
    webkitBackdropFilter: 'blur(20px)',
    border: '1px solid #50E3C2',
    borderRadius: '16px',
    color: '#fff',
    zIndex: '2147483647',
    boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
    fontFamily: '"Inter", sans-serif',
    cursor: 'pointer',
    opacity: '0',
    transform: 'translateY(20px)',
    transition: '0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  });

  banner.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-weight:700; color:#50E3C2; letter-spacing:0.05em;">UPDATE AVAILABLE</span>
      <span id="close-update-btn" style="font-size:1.4rem; line-height:1; cursor:pointer; opacity:0.6;">×</span>
    </div>
    <div style="font-size:0.9rem; color:rgba(255,255,255,0.8); line-height:1.4;">
      最新版 <b>v${newVer}</b> が公開されました。<br>ここからダウンロードできます。
    </div>
  `;

  banner.onclick = () => window.open(linkUrl, '_blank');
  
  const closeBtn = banner.querySelector('#close-update-btn');
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(20px)';
    setTimeout(() => banner.remove(), 500);
  };

  document.body.appendChild(banner);

  setTimeout(() => {
    banner.style.opacity = '1';
    banner.style.transform = 'translateY(0)';
  }, 100);
}