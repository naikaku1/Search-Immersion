let burnInInterval = null;
let currentEventKey = null;
let calendarDisplayDate = new Date();

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
  mediaSpotify: true,
  mediaBackground: true,
  showZenMode: true,
  language: 'auto',
  bgBlur: '50',
  icalUrl: ''
};

let googleEventsCache = {};

function t(key, params = {}) {
  const translations = window.immersion_i18n || {};
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  let lang = prefs.language || 'auto';
  if (lang === 'auto') {
    const navLang = navigator.language.slice(0, 2);
    lang = (navLang === 'ja' || navLang === 'ko' || navLang === 'zh') ? navLang : 'en';
  }
  const dict = translations[lang] || translations.en || {};
  const enDict = translations.en || {};
  let str = dict[key] || enDict[key] || key;
  Object.keys(params).forEach(k => { str = str.replace(`{${k}}`, params[k]); });
  return str;
}
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
          <span>${t('weather_high')}:<span id="w-high">--</span>° ${t('weather_low')}:<span id="w-low">--</span>°</span>
          <span><span id="w-wind">--</span></span>
        </div>
      </div>

      <div id="card-news" class="glass-card tilt-card news-card" style="flex:1.2;">
        <div class="label-std">${t('news_card')}</div>
        <div id="news-list" style="display:flex; flex-direction:column; gap:4px;">${t('news_loading')}</div>
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
        <input type="text" id="memo-input" placeholder="${t('memo_placeholder')}" value="${savedMemo}" autocomplete="off">
      </div>

      <div class="search-wrapper">
        <span class="search-icon"></span>
        <input id="search-input" type="text" placeholder="${t('search_placeholder')}" autocomplete="off">
        <span id="search-clear" class="search-clear">×</span>
        <div id="search-suggestions" class="search-suggestions"></div>
      </div>

      <div class="dock" id="main-dock">
        <div class="dock-separator"></div>
        <div class="dock-item tilt-card" id="zen-btn" title="${t('zen_mode_tooltip')}">ZEN</div>
        <div class="dock-item tilt-card" id="settings-btn" title="${t('settings_tooltip')}">⚙️</div>
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
        <div class="label-std" style="text-align:center;"><span id="cal-month">${t('calendar_label')}</span></div>
        <div class="cal-grid" id="cal-grid"></div>
        <div class="event-list-area" id="event-list"></div>
      </div>
    </div>

    <div id="settings-modal" class="overlay-modal">
      <div class="settings-window">
        <nav class="st-sidebar">
          <button class="st-tab-btn active" data-tab="tab-general"><span>🏠</span> ${t('settings_general')}</button>
          <button class="st-tab-btn" data-tab="tab-appearance"><span>🎨</span> ${t('settings_appearance')}</button>
          <button class="st-tab-btn" data-tab="tab-media"><span>🎵</span> ${t('settings_media')}</button>
          <button class="st-tab-btn" data-tab="tab-dock"><span>⚓</span> ${t('settings_dock')}</button>
          <div style="flex:1"></div>
          <button class="st-tab-btn" data-tab="tab-about"><span>ℹ️</span> ${t('settings_about')}</button>
        </nav>

        <div class="st-main">
          <div class="st-header">
            <span class="st-title" id="st-header-title">${t('settings_header_general')}</span>
            <div class="close-modal-btn" id="close-settings">×</div>
          </div>
          
          <div class="st-content-scroll">
            
            <div id="tab-general" class="st-section active">
              <div class="st-group-title">${t('profile_group')}</div>
              <div class="st-row column-layout">
                <span>${t('username_label')}</span>
                <div class="input-with-btn">
                  <input type="text" id="set-user-name" placeholder="${t('username_placeholder')}" class="st-input">
                </div>
              </div>

              <div class="st-group-title">${t('behavior_group')}</div>
              <div class="st-row"><span>${t('language_label')}</span>
                <select id="set-language" class="st-select">
                  <option value="auto">${t('lang_auto')}</option>
                  <option value="ja">${t('lang_ja')}</option>
                  <option value="en">${t('lang_en')}</option>
                  <option value="ko">${t('lang_ko')}</option>
                  <option value="zh_cn">${t('lang_zh_cn')}</option>
                </select>
              </div>
              <div class="st-row"><span>${t('newtab_redirect')}</span><label class="toggle-switch"><input type="checkbox" id="set-newtab-redirect"><span class="slider"></span></label></div>

              <div class="st-group-title">${t('modules_group')}</div>
              <div class="st-row"><span>${t('greeting_msg')}</span><label class="toggle-switch"><input type="checkbox" id="set-show-quote"><span class="slider"></span></label></div>
              <div class="st-row"><span>${t('weather_card')}</span><label class="toggle-switch"><input type="checkbox" id="set-show-weather"><span class="slider"></span></label></div>
              <div class="st-row"><span>${t('news_card')}</span><label class="toggle-switch"><input type="checkbox" id="set-show-news"><span class="slider"></span></label></div>
              <div class="st-row column-layout">
                <span>${t('rss_url_label')}</span>
                <input type="text" id="set-news-url" placeholder="https://news.yahoo.co.jp/rss/topics/it.xml" class="st-input">
                <div style="font-size:0.75rem; opacity:0.6; margin-top:4px;">${t('rss_url_hint')}</div>
              </div>

              <div class="st-row"><span>${t('countdown_label')}</span><label class="toggle-switch"><input type="checkbox" id="set-show-countdown"><span class="slider"></span></label></div>
              <div class="st-row"><span>${t('zen_mode_btn')}</span><label class="toggle-switch"><input type="checkbox" id="set-show-zen"><span class="slider"></span></label></div>
              
            <div class="st-group-title">${t('event_settings_group')}</div>

<div class="st-row column-layout">
  <span>Google Calendar (iCal URL)</span>
  <input type="text" id="set-ical-url" placeholder="https://calendar.google.com/calendar/ical/..." class="st-input">
  <div style="font-size:0.75rem; opacity:0.6; margin-top:4px;">
    Google Calendar > Settings > Integrate > Secret address in iCal format
  </div>
</div>

<div class="st-row column-layout">
  <span>${t('countdown_target')}</span>
                <input type="text" id="set-cnt-title" placeholder="${t('event_name_placeholder')}" class="st-input" style="margin-bottom:8px;">
                <div class="input-with-btn">
                  <input type="datetime-local" id="set-cnt-date" class="st-input">
                  <button id="btn-apply-cnt" class="st-btn-small">${t('update_btn')}</button>
                </div>
              </div>
            </div>

            <div id="tab-appearance" class="st-section">
              <div class="st-group-title">${t('clock_style_group')}</div>
              <div class="st-row"><span>${t('show_seconds')}</span><label class="toggle-switch"><input type="checkbox" id="set-show-seconds"><span class="slider"></span></label></div>
              <div class="st-row">
                <span>${t('font_label')}</span>
                <select id="set-font" class="st-select">
                  <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${t('font_system')}</option>
                  <option value="'Inter', sans-serif">${t('font_modern')}</option>
                  <option value="'Bebas Neue', sans-serif">${t('font_impact')}</option>
                  <option value="'Shippori Mincho', serif">${t('font_mincho')}</option>
                  <option value="'JetBrains Mono', monospace">${t('font_mono')}</option>
                </select>
              </div>
              <div class="st-row"><span>${t('size_label')}</span><input type="range" id="set-size" min="4" max="20" step="0.5" class="st-range"></div>

              <div class="st-group-title">${t('theme_wallpaper_group')}</div>
              <div class="st-row"><span>${t('accent_color')}</span><input type="color" id="set-accent" class="st-color"></div>
              <div class="st-row"><span>${t('bg_brightness')}</span><input type="range" id="set-bright" min="0.1" max="1.0" step="0.1" class="st-range"></div>
              <div class="st-row"><span>${t('bg_blur')}</span><input type="range" id="set-blur" min="0" max="100" step="1" class="st-range"></div>
              <div class="st-row"><span>${t('bg_opacity')}</span><input type="range" id="set-opacity" min="0" max="1.0" step="0.1" class="st-range"></div>
              <div class="st-row"><span>${t('glass_opacity')}</span><input type="range" id="set-glass-opacity" min="0.1" max="0.9" step="0.05" class="st-range"></div>
              <div class="st-row"><span>${t('burn_in_protection')}</span><label class="toggle-switch"><input type="checkbox" id="set-burnin"><span class="slider"></span></label></div>
              
              <div class="st-row column-layout">
                <span>${t('custom_wallpaper_url')}</span>
                <div class="input-with-btn">
                  <input type="text" id="set-img" placeholder="https://..." class="st-input">
                  <button id="btn-apply-img" class="st-btn-small">${t('apply_btn')}</button>
                </div>
              </div>
            </div>

            <div id="tab-media" class="st-section">
              <div class="st-group-title">${t('service_link_group')}</div>
              <div class="st-row"><span>YouTube</span><label class="toggle-switch"><input type="checkbox" id="set-media-yt"><span class="slider"></span></label></div>
              <div class="st-row"><span>YouTube Music</span><label class="toggle-switch"><input type="checkbox" id="set-media-ytm"><span class="slider"></span></label></div>
              <div class="st-row"><span>Spotify</span><label class="toggle-switch"><input type="checkbox" id="set-media-spotify"><span class="slider"></span></label></div>
              
              <div class="st-row"><span>${t('media_background_label')}</span><label class="toggle-switch"><input type="checkbox" id="set-media-bg"><span class="slider"></span></label></div>
              
              <div style="font-size:0.8rem; opacity:0.6; padding:10px;">${t('media_hint')}</div>
            </div>

            <div id="tab-dock" class="st-section">
              <div class="st-group-title">${t('shortcut_edit_group')}</div>
              <div id="dock-settings-list"></div>
              <button id="add-dock-item-btn" class="st-btn" style="margin-top:10px;">${t('add_item_btn')}</button>
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
        <div class="st-header"><span class="st-title" id="ev-modal-date">Date</span><span class="close-modal-btn" id="close-event">×</span></div>
        <div style="padding:20px;">
           <input type="text" id="ev-input" class="st-input big-input" placeholder="${t('date_input_placeholder')}" autocomplete="off">
           <div class="modal-actions"><button id="ev-delete" class="st-btn danger-btn">${t('delete_btn')}</button><button id="ev-save" class="st-btn primary-btn">${t('save_btn')}</button></div>
        </div>
      </div>
    </div>

    <div id="dock-context-menu" class="dock-context-menu">
      <div class="dock-context-item" id="ctx-edit"><span>✎</span> ${t('ctx_edit')}</div>
      <div class="dock-context-item danger" id="ctx-del"><span>🗑</span> ${t('ctx_del')}</div>
    </div>

    <div id="dock-edit-modal" class="overlay-modal">
      <div class="glass-card modal-card" style="padding: 20px !important;">
        <div class="st-header" style="padding:0; height:auto; border:none; margin-bottom:15px;">
          <span class="st-title">${t('edit_modal_title')}</span>
          <span class="close-modal-btn" id="close-dock-edit">×</span>
        </div>
        <div class="column-layout">
          <span>${t('icon_label')}</span>
          <input type="text" id="dock-edit-icon" class="st-input" placeholder="${t('icon_placeholder')}">
          <span>${t('url_label')}</span>
          <input type="text" id="dock-edit-url" class="st-input" placeholder="https://...">
        </div>
        <div class="modal-actions">
          <button id="dock-edit-save" class="st-btn primary-btn">${t('save_btn')}</button>
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
  setupDockContextMenu();
  startClock();
  focusSearchInput();
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

let contextMenuTargetIndex = -1;

function setupDockContextMenu() {
  const menu = document.getElementById('dock-context-menu');
  const editBtn = document.getElementById('ctx-edit');
  const delBtn = document.getElementById('ctx-del');

  document.addEventListener('click', (e) => {
    if (menu) menu.classList.remove('show');
  });

  if(editBtn) editBtn.onclick = () => {
     if(contextMenuTargetIndex >= 0) openDockEditModal(contextMenuTargetIndex);
  };

  if(delBtn) delBtn.onclick = () => {
    if(contextMenuTargetIndex >= 0) {
        const items = getDockItems();
        if(confirm(t('delete_confirm', { icon: items[contextMenuTargetIndex].icon }))) {
            items.splice(contextMenuTargetIndex, 1);
            localStorage.setItem('immersion_dock_items', JSON.stringify(items));
            renderDock();
            renderDockSettingsList();
        }
    }
  };

  const modal = document.getElementById('dock-edit-modal');
  const closeBtn = document.getElementById('close-dock-edit');
  const saveBtn = document.getElementById('dock-edit-save');

  if(closeBtn) closeBtn.onclick = () => modal.classList.remove('show');
  if(modal) modal.onclick = (e) => { if(e.target === modal) modal.classList.remove('show'); };

  if(saveBtn) saveBtn.onclick = () => {
      const iconVal = document.getElementById('dock-edit-icon').value;
      const urlVal = document.getElementById('dock-edit-url').value;
      if(contextMenuTargetIndex >= 0 && iconVal && urlVal) {
          const items = getDockItems();
          items[contextMenuTargetIndex] = { icon: iconVal, url: urlVal };
          localStorage.setItem('immersion_dock_items', JSON.stringify(items));
          renderDock();
          renderDockSettingsList();
          modal.classList.remove('show');
      }
  };
}

function openDockEditModal(index) {
    const items = getDockItems();
    const item = items[index];
    if(!item) return;
    document.getElementById('dock-edit-icon').value = item.icon;
    document.getElementById('dock-edit-url').value = item.url;
    contextMenuTargetIndex = index;

    document.getElementById('dock-edit-modal').classList.add('show');
}

function applyPreferences() {
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty('--accent', prefs.accent);
  rootStyle.setProperty('--clock-font', prefs.clockFont);
  rootStyle.setProperty('--bg-brightness', prefs.bgBrightness);
  rootStyle.setProperty('--bg-blur', (prefs.bgBlur || '50') + 'px');
  rootStyle.setProperty('--bg-opacity', prefs.bgOpacity || '1.0');
  rootStyle.setProperty('--glass-opacity', prefs.glassOpacity || '0.55');
  rootStyle.setProperty('--clock-size', (prefs.clockSize || '10') + 'rem');

  const setVal = (id, v) => { const el = document.getElementById(id); if(el) el.value = v; };

  setVal('set-user-name', prefs.userName || 'User');
  setVal('set-news-url', prefs.newsUrl || '');
  setVal('set-ical-url', prefs.icalUrl || '');
  const ownerLabel = document.getElementById('about-owner-name');
  if(ownerLabel) ownerLabel.innerText = prefs.userName || 'User';

  setVal('set-accent', prefs.accent);
  setVal('set-font', prefs.clockFont);
  setVal('set-bright', prefs.bgBrightness);
  setVal('set-blur', prefs.bgBlur || '50');
  setVal('set-size', prefs.clockSize || '10');
  setVal('set-opacity', prefs.bgOpacity || '1.0');
  setVal('set-glass-opacity', prefs.glassOpacity || '0.55');
  setVal('set-img', prefs.idleImgUrl || '');
  setVal('set-cnt-title', prefs.cntTitle || '');
  setVal('set-cnt-date', prefs.cntDate || '');
  setVal('set-language', prefs.language || 'auto');

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
  setCheck('set-media-bg', prefs.mediaBackground);
  setCheck('set-media-apple', prefs.mediaApple);
  setCheck('set-media-netflix', prefs.mediaNetflix);
  setCheck('set-show-zen', prefs.showZenMode);

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
  toggle('zen-btn', prefs.showZenMode);
}

function savePreferences() {
  const getVal = (id) => document.getElementById(id)?.value;
  const getChk = (id) => document.getElementById(id)?.checked;

  const prefs = {
    userName: getVal('set-user-name'),
    accent: getVal('set-accent'),
    clockFont: getVal('set-font'),
    bgBrightness: getVal('set-bright'),
    bgBlur: getVal('set-blur'),
    bgOpacity: getVal('set-opacity'),
    glassOpacity: getVal('set-glass-opacity'),
    clockSize: getVal('set-size'),
    idleImgUrl: getVal('set-img'),
    cntTitle: getVal('set-cnt-title'),
    cntDate: getVal('set-cnt-date'),
    language: getVal('set-language'),
    icalUrl: getVal('set-ical-url'),
    burnIn: getChk('set-burnin'),
    showSeconds: getChk('set-show-seconds'),
    showQuote: getChk('set-show-quote'),
    showWeather: getChk('set-show-weather'),
    showNews: getChk('set-show-news'),
    newsUrl: getVal('set-news-url'),
    showCountdown: getChk('set-show-countdown'),
    mediaYT: getChk('set-media-yt'),
    mediaYTMusic: getChk('set-media-ytm'),
    mediaYTMusic: getChk('set-media-ytm'),
    mediaSpotify: getChk('set-media-spotify'),
    mediaBackground: getChk('set-media-bg'),
    showZenMode: getChk('set-show-zen')
  };

  const prevLang = JSON.parse(localStorage.getItem('immersion_prefs'))?.language;
  localStorage.setItem('immersion_prefs', JSON.stringify(prefs));

  if (prevLang !== prefs.language) {
      document.getElementById('immersion-root')?.remove();
      initNestHub();
      document.getElementById('settings-btn').click();
      document.getElementById('settings-modal').classList.add('show');
      return;
  }

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

 ['set-accent', 'set-font', 'set-bright', 'set-blur', 'set-size', 'set-opacity', 'set-glass-opacity', 'set-user-name', 'set-news-url', 'set-ical-url'].forEach(id => {
    document.getElementById(id)?.addEventListener(id === 'set-font' ? 'change' : 'input', savePreferences);
  });

  document.getElementById('set-language')?.addEventListener('change', savePreferences);

  [
    'set-burnin', 'set-show-seconds', 'set-show-quote', 'set-show-weather', 'set-show-news', 'set-show-countdown', 'set-show-music', 'set-show-calendar', 'set-show-zen',
    'set-media-yt', 'set-media-ytm', 'set-media-spotify', 'set-media-apple', 'set-media-netflix', 'set-media-bg'
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
function setupCountdown() {
  const update = () => {
    const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    const titleEl = document.getElementById('cnt-label'); const daysEl = document.getElementById('cnt-days'); const hmsEl = document.getElementById('cnt-hms');
    if (!prefs.cntDate) { titleEl.innerText = "NO EVENT"; daysEl.innerText = "--"; hmsEl.innerText = "--:--:--"; return; }
    titleEl.innerText = prefs.cntTitle || t('event');
    const target = new Date(prefs.cntDate).getTime(); const now = new Date().getTime(); const diff = target - now;
    if (diff < 0) { daysEl.innerText = "0"; hmsEl.innerText = "FINISHED"; }
    else { const d = Math.floor(diff / (1000 * 60 * 60 * 24)); const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); const s = Math.floor((diff % (1000 * 60)) / 1000); daysEl.innerText = d; hmsEl.innerText = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
  }; setInterval(update, 1000); update();
}
function getDockItems() { const saved = localStorage.getItem('immersion_dock_items'); return saved ? JSON.parse(saved) : defaultDockItems; }
function renderDock() {
  const dock = document.getElementById('main-dock'); const items = getDockItems(); const existing = dock.querySelectorAll('.dynamic-dock-item'); existing.forEach(el => el.remove());
  items.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'dock-item tilt-card dynamic-dock-item';
    if (item.icon && (item.icon.startsWith('http') || item.icon.startsWith('data:image'))) {
        div.style.overflow = 'hidden';
        div.innerHTML = `<img src="${item.icon}" style="width:100%; height:100%; object-fit:cover; display:block; pointer-events:none;" onerror="this.style.display='none'; this.parentElement.innerText='${item.icon.replace(/'/g, "\\'")}';">`;
    } else {
        div.innerText = item.icon;
    }
    div.title = item.url;
    div.onclick = () => { if(item.url.includes('%s')) { const input = document.getElementById('search-input'); const v = input.value; window.location.href = v ? item.url.replace('%s', encodeURIComponent(v)) : item.url.split('?')[0]; } else { window.location.href = item.url; } };
    div.oncontextmenu = (e) => {
      e.preventDefault(); e.stopPropagation();
      contextMenuTargetIndex = index;
      const menu = document.getElementById('dock-context-menu');
      menu.style.top = e.clientY + 'px'; menu.style.left = e.clientX + 'px';
      menu.classList.add('show');
    };
    dock.insertBefore(div, document.querySelector('.dock-separator'));
  });
  initTiltEffect();
}
function renderDockSettingsList() {
  const list = document.getElementById('dock-settings-list');
  list.innerHTML = '';
  const items = getDockItems();

  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'dock-setting-row';

    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span class="ds-label">${t('icon_label')}</span>
        <div class="ds-controls" style="display:flex; gap: 5px;">
           ${index > 0 ? '<span class="ds-move-btn ds-up">↑</span>' : ''}
           ${index < items.length - 1 ? '<span class="ds-move-btn ds-down">↓</span>' : ''}
           <span class="ds-move-btn ds-del-inline" style="color:#ff453a;">×</span>
        </div>
      </div>
      <input type="text" class="ds-icon" value="${item.icon}" placeholder="${t('icon_placeholder')}">
      <div class="ds-label" style="margin-top:8px;">${t('url_label')}</div>
      <input type="text" class="ds-url" value="${item.url}" placeholder="${t('url_label')}">
    `;

    const iI = row.querySelector('.ds-icon');
    const uI = row.querySelector('.ds-url');
    const d = row.querySelector('.ds-del-inline');

    const save = () => { items[index].icon = iI.value; items[index].url = uI.value; localStorage.setItem('immersion_dock_items', JSON.stringify(items)); renderDock(); };
    iI.oninput = save; uI.oninput = save;

    d.onclick = () => { items.splice(index, 1); localStorage.setItem('immersion_dock_items', JSON.stringify(items)); renderDockSettingsList(); renderDock(); };

    const upBtn = row.querySelector('.ds-up');
    if(upBtn) {
        upBtn.onclick = () => {
            [items[index], items[index - 1]] = [items[index - 1], items[index]];
            localStorage.setItem('immersion_dock_items', JSON.stringify(items));
            renderDockSettingsList();
            renderDock();
        };
    }
    const downBtn = row.querySelector('.ds-down');
    if(downBtn) {
        downBtn.onclick = () => {
            [items[index], items[index + 1]] = [items[index + 1], items[index]];
            localStorage.setItem('immersion_dock_items', JSON.stringify(items));
            renderDockSettingsList();
            renderDock();
        };
    }

    list.appendChild(row);
  });
}

function addDockItem() { const items = getDockItems(); items.push({ icon: "🔗", url: "https://example.com" }); localStorage.setItem('immersion_dock_items', JSON.stringify(items)); renderDockSettingsList(); renderDock(); }
function debounce(func, wait) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); }; }

function setupSearch() {
  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');

  const updateClearBtn = () => {
    if(input.value) clearBtn.style.display = 'block';
    else clearBtn.style.display = 'none';
  };

  input.addEventListener('input', updateClearBtn);
  updateClearBtn();

  clearBtn.onclick = () => {
    input.value = '';
    input.focus();
    updateClearBtn();
    const container = document.getElementById('search-suggestions');
    if(container) {
    }
  };

  input.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && input.value) {
       const activeItem = document.querySelector('.suggestion-item.active');
       if (activeItem) {
          return;
       }

       const val = input.value.trim();
       let isUrl = false;

       const hasProtocol = /^[a-zA-Z]+:\/\//.test(val);
       const isDomain = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(:[0-9]+)?(\/.*)?$/.test(val);
       const noSpaces = !val.includes(' ');

       if (hasProtocol) {
           window.location.href = val;
           return;
       }
       if (noSpaces && (val.startsWith('www.') || isDomain)) {
           window.location.href = 'https://' + val;
           return;
       }

       window.location.href = `https://www.google.com/search?q=${encodeURIComponent(val)}`;
    }
  });

  document.getElementById('change-city').onclick = () => {
    const c = prompt("City Name (English):", "Tokyo");
    if(c) { localStorage.setItem('immersion_city', c); fetchWeather(c); }
  };

  setupSearchAutocomplete(input);
}

function setupSearchAutocomplete(input) {
  const container = document.getElementById('search-suggestions');
  let currentFocus = -1;

  const fetchSuggestions = debounce((query) => {

    const isEmp = !query || query.trim() === '';

    const historyPromise = new Promise((resolve) => {
      try {
        if (!chrome.runtime?.id) { resolve([]); return; }
        chrome.runtime.sendMessage({ action: "searchHistory", query: query || "" }, (res) => {
          if (chrome.runtime.lastError) { resolve([]); return; }
          resolve(res?.data || []);
        });
      } catch (e) {
        resolve([]);
      }
    });

    const googlePromise = isEmp ? Promise.resolve([]) : fetch(`https://www.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => data[1] || [])
      .catch(() => []);

    Promise.all([historyPromise, googlePromise]).then(([historyItems, googleItems]) => {
      const combined = [];
      const seenTitles = new Set();
      const maxHistory = 8;

      const extractSearchTerm = (url) => {
        try {
          const u = new URL(url);
          if (u.hostname.includes('google') && u.pathname === '/search') {
            return u.searchParams.get('q');
          }
        } catch(e) {}
        return null;
      };

      historyItems.forEach(h => {
        if (combined.length >= maxHistory) return;

        const term = extractSearchTerm(h.url);
        if (term && !seenTitles.has(term)) {
          combined.push({ text: term, type: 'history', url: h.url });
          seenTitles.add(term);
        }
      });

      googleItems.forEach(g => {
        if(combined.length < 8 && !seenTitles.has(g)) {
           combined.push({ text: g, type: 'search' });
           seenTitles.add(g);
        }
      });

      if (combined.length > 0) {
        renderSuggestions(combined);
      } else {
        container.style.display = 'none';
      }
    });

  }, 200);

  const renderSuggestions = (items) => {
    container.innerHTML = '';
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.setAttribute('data-val', item.text);
      const icon = item.type === 'history' ? '🕒' : '🔍';

      let innerHTML = `<div style="display:flex; align-items:center; flex:1; min-width:0;">
        <span style="opacity:0.6; margin-right:10px; flex-shrink:0;">${icon}</span> 
        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.text}</span>
      </div>`;

      if (item.type === 'history') {
          innerHTML += `<span class="suggestion-del" title="${t('ctx_del')}" style="opacity:0.4; padding:0 10px; cursor:pointer;">×</span>`;
      }
      div.innerHTML = innerHTML;

      div.onclick = () => {
        input.value = item.text;
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(item.text)}`;
      };

      if (item.type === 'history') {
          const delBtn = div.querySelector('.suggestion-del');
          if(delBtn) {
              delBtn.onclick = (e) => {
                  e.stopPropagation();
                  chrome.runtime.sendMessage({ action: "deleteHistory", url: item.url }, () => {
                      fetchSuggestions(input.value || '');
                  });
              };
              delBtn.onmouseenter = () => delBtn.style.opacity = '1';
              delBtn.onmouseleave = () => delBtn.style.opacity = '0.4';
          }
      }

      container.appendChild(div);
    });
    container.style.display = 'block';
    currentFocus = -1;
  };

  input.addEventListener('input', () => {
    fetchSuggestions(input.value);
    if(!input.value) fetchSuggestions('');
  });
  const trigger = () => { if(!input.value) fetchSuggestions(''); };
  input.addEventListener('focus', trigger);
  input.addEventListener('click', trigger);

  input.addEventListener('keydown', (e) => {
    const items = container.querySelectorAll('.suggestion-item');
    if (e.key === 'ArrowDown') {
      currentFocus++;
      if (currentFocus >= items.length) currentFocus = 0;
      setActive(items);
    } else if (e.key === 'ArrowUp') {
      currentFocus--;
      if (currentFocus < 0) currentFocus = items.length - 1;
      setActive(items);
    } else if (e.key === 'Enter') {
      if (currentFocus > -1 && items[currentFocus]) {
        e.preventDefault();
        items[currentFocus].click();
      }
    } else if (e.key === 'Escape') {
      container.style.display = 'none';
      input.blur();
    }
  });

  const setActive = (items) => {
    if (!items || items.length === 0) return;
    items.forEach(item => item.classList.remove('active'));
    if (currentFocus >= 0 && items[currentFocus]) {
      items[currentFocus].classList.add('active');
      input.value = items[currentFocus].getAttribute('data-val');
    }
  };

  document.addEventListener('click', (e) => {
    if (e.target !== input && e.target !== container) {
      container.style.display = 'none';
    }
  });
}
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
    greeting = t('greeting_morning', { name });
    subText = t('subtext_morning');
  } else if (hour >= 11 && hour < 18) {
    greeting = t('greeting_afternoon', { name });
    subText = t('subtext_afternoon');
  } else if (hour >= 18 && hour < 23) {
    greeting = t('greeting_evening', { name });
    subText = t('subtext_evening');
  } else {
    greeting = t('greeting_night', { name });
    subText = t('subtext_night');
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
    const days = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
    const months = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];
    const mStr = months[now.getMonth()];
    const dStr = days[now.getDay()];
    let dateStr = `${mStr} ${now.getDate()} (${dStr})`;
    if (prefs.language === 'ja' || (!prefs.language && navigator.language.startsWith('ja'))) {
         dateStr = `${mStr}${now.getDate()}日 (${dStr})`;
    } else if (prefs.language === 'ko' || (!prefs.language && navigator.language.startsWith('ko'))) {
         dateStr = `${mStr} ${now.getDate()}일 (${dStr})`;
    }
    document.getElementById('clock-time').innerText = timeStr; document.getElementById('clock-date').innerText = dateStr;
  }; setInterval(update, 1000); update();
}
function fetchNews() {
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  const targetUrl = prefs.newsUrl;
  const list = document.getElementById("news-list");

  if (!targetUrl) {
    list.innerHTML = `<div style="padding:10px; opacity:0.7; text-align:center;">${t('news_rss_config_prompt')}</div>`;
    return;
  }

  chrome.runtime.sendMessage({ action: "fetchNews", url: targetUrl }, (res) => {
    if(!res || res.error || !res.data) {
        list.innerHTML = `<div style="padding:10px; opacity:0.7; text-align:center;">${t('news_error')}</div>`;
        return;
    }

    const parser = new DOMParser();
    try {
      const doc = parser.parseFromString(res.data, "text/xml");
      const items = doc.querySelectorAll("item");

      list.innerHTML = "";

      if (items.length === 0) {
         list.innerHTML = `<div style="padding:10px; opacity:0.7; text-align:center;">${t('news_no_articles')}</div>`;
         return;
      }

      for(let i=0; i<items.length; i++) {
        if(!items[i]) break;
        const div = document.createElement("div");
        div.className = "news-item";
        div.innerText = items[i].querySelector("title").textContent;
        const link = items[i].querySelector("link").textContent;
        div.onclick = () => window.location.href = link;
        list.appendChild(div);
      }
    } catch(e) {
      list.innerHTML = `<div style="padding:10px; opacity:0.7; text-align:center;">${t('news_rss_error')}</div>`;
    }
  });
}


function fetchWeather(city) { chrome.runtime.sendMessage({ action: "fetchWeather", city: city }, (res) => { if(!res?.data) return; const w = res.data.current_weather; document.getElementById('w-temp').innerText = `${Math.round(w.temperature)}°`; document.getElementById('w-high').innerText = Math.round(w.temperature + 3); document.getElementById('w-low').innerText = Math.round(w.temperature - 2); document.getElementById('w-wind').innerText = `${w.windspeed}km/h`; document.getElementById('change-city').innerText = `📍 ${city}`; let icon = "☁️"; let text = t('weather_cloudy'); const code = w.weathercode; if(code === 0) { icon = "☀️"; text = t('weather_clear'); } else if(code <= 3) { icon = "⛅️"; text = t('weather_sunny'); } else if(code >= 51) { icon = "🌧"; text = t('weather_rain'); } document.getElementById('w-icon').innerText = icon; document.getElementById('w-cond').innerText = text; }); }
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
             if(prefs.mediaBackground && currentArt !== d.artwork && bgLayer) {
                 currentArt = d.artwork;
                 bgLayer.style.backgroundImage = `url(${d.artwork})`;
             } else if (!prefs.mediaBackground && currentArt !== 'default' && bgLayer) {
                 currentArt = 'default';
                 const p = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
                 const targetImg = (p.idleImgUrl && p.idleImgUrl.startsWith('http')) ? p.idleImgUrl : sessionIdleArt;
                 bgLayer.style.backgroundImage = `url('${targetImg}')`;
             }
          }
        } else {
          container?.classList.remove('music-active'); container?.classList.add('music-idle');
          const now = new Date();
          const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
          const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    document.getElementById('idle-day').innerText = t('sunday');

    const longDays = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];
    document.getElementById('idle-day').innerText = longDays[now.getDay()];
    document.getElementById('idle-date').innerText = now.getDate();

    let idleMonthStr = `${t('dec')} ${now.getFullYear()}`;
    const mVals = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];
    const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;

    if(prefs.language === 'ja' || (!prefs.language && navigator.language.startsWith('ja'))) idleMonthStr = `${now.getFullYear()}年 ${mVals[now.getMonth()]}`;
    else if(prefs.language === 'ko' || (!prefs.language && navigator.language.startsWith('ko'))) idleMonthStr = `${now.getFullYear()}년 ${mVals[now.getMonth()]}`;
    else idleMonthStr = `${mVals[now.getMonth()]} ${now.getFullYear()}`;

    document.getElementById('idle-month').innerText = idleMonthStr;
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
      <span style="font-weight:700; color:#50E3C2; letter-spacing:0.05em;">${t('update_available')}</span>
      <span id="close-update-btn" style="font-size:1.4rem; line-height:1; cursor:pointer; opacity:0.6;">×</span>
    </div>
    <div style="font-size:0.9rem; color:rgba(255,255,255,0.8); line-height:1.4;">
      ${t('update_desc', {version: newVer})}
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

function focusSearchInput() {
  const input = document.getElementById('search-input');
  if (input) {
    input.focus();
    input.select();
  }
}
function syncGoogleCalendar() {
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  if (!prefs.icalUrl) {
    googleEventsCache = {};
    renderCalendarSystem();
    return;
  }

  chrome.runtime.sendMessage({ action: "fetchCalendar", url: prefs.icalUrl }, (res) => {
    if (!res || res.error || !res.data) return;

    const events = {};
    const lines = res.data.split(/\r\n|\n|\r/);
    let inEvent = false;
    let currentDate = null;
    let currentSummary = "";
    let timeStr = "";

    lines.forEach(line => {
      if (line.startsWith('BEGIN:VEVENT')) {
        inEvent = true;
        currentDate = null;
        currentSummary = "";
        timeStr = "";
      }

      if (line.startsWith('END:VEVENT')) {
        inEvent = false;
        if (currentDate && currentSummary) {

          const finalTitle = timeStr ? `${timeStr} ${currentSummary}` : currentSummary;

          if (events[currentDate]) {

            events[currentDate] += ` / ${finalTitle}`;
          } else {
            events[currentDate] = finalTitle;
          }
        }
      }

      if (inEvent) {

        if (line.startsWith('DTSTART;VALUE=DATE:')) {
          const d = line.split(':')[1].trim();
          if(d.length === 8) currentDate = `${parseInt(d.substring(0,4))}_${parseInt(d.substring(4,6))-1}_${parseInt(d.substring(6,8))}`;
        }

        else if (line.startsWith('DTSTART')) {
          const val = line.split(':')[1].trim();
          if(val.includes('T') && val.length >= 15) {
             const y = parseInt(val.substring(0,4));
             const m = parseInt(val.substring(4,6)) - 1;
             const d = parseInt(val.substring(6,8));
             const h = parseInt(val.substring(9,11));
             const min = parseInt(val.substring(11,13));


             let dateObj;
             if (val.endsWith('Z')) {
               dateObj = new Date(Date.UTC(y, m, d, h, min));
             } else {
               dateObj = new Date(y, m, d, h, min);
             }


             const jYear = dateObj.getFullYear();
             const jMonth = dateObj.getMonth();
             const jDate = dateObj.getDate();
             currentDate = `${jYear}_${jMonth}_${jDate}`;


             const jH = String(dateObj.getHours()).padStart(2, '0');
             const jM = String(dateObj.getMinutes()).padStart(2, '0');
             timeStr = `${jH}:${jM}`;
          }
        }

        if (line.startsWith('SUMMARY:')) currentSummary = line.substring(8);
      }
    });

    googleEventsCache = events;
    renderCalendarSystem();
  });
}
function renderCalendarSystem() {
  const grid = document.getElementById('cal-grid');
  const eventList = document.getElementById('event-list');
  const realNow = new Date();

  const year = calendarDisplayDate.getFullYear();
  const month = calendarDisplayDate.getMonth();

  const months = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;

  let myStr = `${months[month]} ${year}`;
  if (prefs.language === 'ja' || (!prefs.language && navigator.language.startsWith('ja'))) myStr = `${year}年 ${months[month]}`;
  else if (prefs.language === 'ko' || (!prefs.language && navigator.language.startsWith('ko'))) myStr = `${year}년 ${months[month]}`;

  const calendarCard = document.getElementById('card-calendar');
  const headerParent = calendarCard ? calendarCard.querySelector('.label-std') : null;

  if (headerParent) {
      if (!headerParent.querySelector('#cal-prev')) {
        headerParent.style.display = 'flex';
        headerParent.style.justifyContent = 'space-between';
        headerParent.style.alignItems = 'center';
        headerParent.style.padding = '0';

        headerParent.innerHTML = `
          <div id="cal-prev" style="cursor:pointer; opacity:0.6; padding: 8px 20px; font-family:var(--clock-font); user-select: none; font-size: 1.2rem;">◀</div>
          <span id="cal-title" style="font-weight:600; user-select: none;">${myStr}</span>
          <div id="cal-next" style="cursor:pointer; opacity:0.6; padding: 8px 20px; font-family:var(--clock-font); user-select: none; font-size: 1.2rem;">▶</div>
        `;
        document.getElementById('cal-prev').onclick = (e) => { e.stopPropagation(); calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1); renderCalendarSystem(); };
        document.getElementById('cal-next').onclick = (e) => { e.stopPropagation(); calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1); renderCalendarSystem(); };
      } else {
        document.getElementById('cal-title').innerText = myStr;
      }
  }

  const days = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
  grid.innerHTML = days.map(w => `<div class="cal-head">${w}</div>`).join('');

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month+1, 0).getDate();

  for(let i=0; i<firstDay; i++) grid.innerHTML += `<div></div>`;

  for(let d=1; d<=lastDate; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell'; cell.innerText = d;
    if(d === realNow.getDate() && month === realNow.getMonth() && year === realNow.getFullYear()) {
        cell.classList.add('cal-today');
    }

    const key = `event_${year}_${month}_${d}`;
    const localVal = localStorage.getItem(key);
    const googleVal = googleEventsCache[`${year}_${month}_${d}`];

    if(localVal || googleVal) cell.classList.add('cal-has-event');

    cell.onclick = () => openEventModal(year, month, d, localVal, googleVal);
    grid.appendChild(cell);
  }

  eventList.innerHTML = ''; let h = false;
  for(let d=1; d<=lastDate; d++) {
    const key = `event_${year}_${month}_${d}`;
    const localVal = localStorage.getItem(key);
    const googleVal = googleEventsCache[`${year}_${month}_${d}`];

    if(localVal || googleVal) {
        h=true;
        // 絵文字削除: メモなら📝をつけるが、Google予定はそのまま表示
        const displayText = localVal ? `📝 ${localVal}` : googleVal;

        const r=document.createElement('div');
        r.className='event-row';
        r.innerHTML=`<span class="event-date-badge">${d}</span><span class="event-content">${displayText}</span>`;

        // クリック時の挙動: Google予定のみならGoogleへ飛ぶ、メモがあるなら編集モーダルへ
        r.onclick = () => {
            if (!localVal && googleVal) {
                // Googleカレンダーの日表示URLを作成して開く
                const pad = (n) => String(n).padStart(2, '0');
                const url = `https://calendar.google.com/calendar/r/day/${year}/${pad(month+1)}/${pad(d)}`;
                window.open(url, '_blank');
            } else {
                openEventModal(year, month, d, localVal, googleVal);
            }
        };
        eventList.appendChild(r);
    }
  }
  if(!h) eventList.innerHTML = `<div style="opacity:0.5; font-size:0.8rem; text-align:center; padding:10px;">${t('no_events')}</div>`;
}




function openEventModal(year, month, day, localVal, googleVal) {
  const modal = document.getElementById('event-modal');
  const input = document.getElementById('ev-input');
  const dateLabel = document.getElementById('ev-modal-date');
  const closeBtn = document.getElementById('close-event');
  const saveBtn = document.getElementById('ev-save');
  const delBtn = document.getElementById('ev-delete');


  const currentEventKey = `event_${year}_${month}_${day}`;

  dateLabel.innerText = t('date_modal_title', { month: month + 1, day: day });


  if (localVal) {
      input.value = localVal;
  } else if (googleVal) {

      input.value = googleVal.replace(/^\d{2}:\d{2}\s/, '');
  } else {
      input.value = "";
  }
  input.placeholder = t('event_name_placeholder');


  const oldGoBtn = document.getElementById('ev-google-jump');
  if(oldGoBtn) oldGoBtn.remove();

  if(googleVal) {
      const goBtn = document.createElement('button');
      goBtn.id = 'ev-google-jump';
      goBtn.className = 'st-btn';
      goBtn.style.marginRight = 'auto';
      goBtn.style.backgroundColor = 'rgba(255,255,255,0.1)';
      goBtn.innerText = 'GCal ↗';
      goBtn.onclick = () => {
          const pad = (n) => String(n).padStart(2, '0');
          const url = `https://calendar.google.com/calendar/r/day/${year}/${pad(month+1)}/${pad(day)}`;
          window.open(url, '_blank');
      };
      const actionsDiv = modal.querySelector('.modal-actions');
      actionsDiv.insertBefore(goBtn, actionsDiv.firstChild);
  }

  modal.classList.add('show');
  input.focus();

  const close = () => modal.classList.remove('show');
  closeBtn.onclick = close;
  modal.onclick = (e) => { if(e.target === modal) close(); };


  saveBtn.onclick = () => {
      const text = input.value;
      if(text) {

          localStorage.setItem(currentEventKey, text);


          const pad = (n) => String(n).padStart(2, '0');
          const sDate = `${year}${pad(month+1)}${pad(day)}`;
          const eDate = `${year}${pad(month+1)}${pad(day+1)}`;
          const gUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${sDate}/${eDate}`;
          window.open(gUrl, '_blank', 'width=700,height=600');
      } else {

          localStorage.removeItem(currentEventKey);
      }

      renderCalendarSystem();
      close();
  };


  delBtn.onclick = () => {

      localStorage.removeItem(currentEventKey);


      if(googleVal) {
          alert("Googleカレンダーの予定は、Googleの画面から削除してください。");
          const pad = (n) => String(n).padStart(2, '0');
          const url = `https://calendar.google.com/calendar/r/day/${year}/${pad(month+1)}/${pad(day)}`;
          window.open(url, '_blank');
      }

      renderCalendarSystem();
      close();
  };

  input.onkeydown = (e) => { if(e.key === 'Enter') saveBtn.click(); };
}
setTimeout(syncGoogleCalendar, 2000);
setInterval(syncGoogleCalendar, 5 * 60 * 1000);
window.addEventListener('focus', syncGoogleCalendar);
