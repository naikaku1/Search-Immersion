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
  themeMode: 'glass',
  language: 'auto',
  bgBlur: '50',
  calendarUrls: [],
use12hFormat: false,
module1: 'weather',
  module2: 'news',
  module3: 'countdown'
};

const MODULE_DEFS = {
  weather: {
    id: 'weather',
    html: `
      <div class="glass-card tilt-card module-card weather-card">
        <div class="aw-header">
          <div class="aw-city change-city">📍 City</div>
          <div class="aw-cond w-cond">--</div>
        </div>
        <div class="aw-main">
          <div class="aw-icon w-icon">☁️</div>
          <div class="aw-temp w-temp">--°</div>
        </div>
        <div class="aw-footer">
          <span>H:<span class="w-high">--</span>° L:<span class="w-low">--</span>°</span>
        </div>
      </div>
    `
  },
  timer: {
    id: 'timer',
    html: `
      <div class="glass-card tilt-card module-card" id="card-timer">
        <div class="label-std">TIMER</div>
        
        <div class="timer-display-container">
          <div id="timer-input-mode">
            <input type="number" id="t-min" class="timer-input" placeholder="00" min="0" max="99">
            <span class="timer-colon">:</span>
            <input type="number" id="t-sec" class="timer-input" placeholder="00" min="0" max="59">
          </div>
          <div id="timer-running-mode" style="display:none;">
            <span id="t-display">00:00</span>
          </div>
        </div>

        <div class="timer-controls">
          <button id="btn-timer-reset" class="st-btn-small" style="background:rgba(255,255,255,0.1); color:#fff;">Reset</button>
          <button id="btn-timer-toggle" class="st-btn-small">Start</button>
        </div>
        
        <div id="timer-progress-bar"></div>
      </div>
    `
  },
  
    news: {
    id: 'news',
    html: `
      <div class="glass-card tilt-card module-card news-card-wrapper">
        <div class="label-std">NEWS</div>
        <div class="news-list-area" style="display:flex; flex-direction:column; gap:4px;">Loading...</div>
      </div>
    `
  },
  countdown: {
    id: 'countdown',
    html: `
      <div class="glass-card tilt-card module-card countdown-card" id="card-countdown" style="justify-content:center; align-items:center; position:relative;">
        <input type="datetime-local" class="cnt-picker" style="position:absolute; bottom:10px; right:10px; width:1px; height:1px; opacity:0; pointer-events:none;">
        
        <div class="label-std" style="width:100%; text-align:left; margin-bottom:0; cursor:pointer;" id="cnt-label">EVENT</div>
        <div class="cnt-main" style="cursor:pointer; width:100%;">
          <div class="cnt-days-wrapper">
            <span id="cnt-days" class="cnt-big">--</span>
            <span class="cnt-unit">DAYS</span>
          </div>
          <div class="cnt-sub-wrapper">
             <span id="cnt-hms" class="cnt-sub">--:--:--</span>
          </div>
        </div>
      </div>
    `
  },
  
    todo: {
    id: 'todo',
    html: `
      <div class="glass-card tilt-card module-card" id="card-todo">
        <div class="label-std">TODO LIST</div>
        <input type="text" id="todo-input" class="st-input" placeholder="Add task..." style="margin-bottom:10px;">
        <ul id="todo-list"></ul>
      </div>
    `
  },
  calc: {
    id: 'calc',
    html: `
      <div class="glass-card tilt-card module-card" id="card-calc">
        <div class="label-std">CALCULATOR</div>
        <div id="calc-display" class="calc-display">0</div>
        <div class="calc-grid" id="calc-keys"></div>
      </div>
    `
  },
  none: {
    id: 'none',
    html: '' 
  }
  
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
  'wallpapers/bg1.webp',
  'wallpapers/bg2.webp',
  'wallpapers/bg3.webp',
  'wallpapers/bg4.webp',
  'wallpapers/bg5.webp'
].map(path => chrome.runtime.getURL(path));

const defaultDockItems = [
  { icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>', url: "https://www.youtube.com/" },
  { icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>', url: "https://x.com/" },
  { icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>', url: "https://mail.google.com/" },
  { icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>', url: "https://www.google.com/maps" }
];


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNestHub);
} else {
  initNestHub();
}


function initNestHub() {
  if (document.getElementById('immersion-root')) return;

  const manifest = chrome.runtime.getManifest();
  const appName = manifest.name;
  const appVersion = manifest.version;
  const appDesc = manifest.description;

  document.body.classList.add('immersion-mode');
  const savedZoom = localStorage.getItem('immersion_custom_zoom');
  if (savedZoom) {
    document.body.style.zoom = savedZoom;
  }
  const root = document.createElement('div');
  root.id = 'immersion-root';
  const city = localStorage.getItem('immersion_city') || 'Tokyo';
  const savedMemo = localStorage.getItem('immersion_memo') || '';

  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  

  const activeModules = [
    prefs.module1 || 'weather',
    prefs.module2 || 'news',
    prefs.module3 || 'countdown'
  ]; 

  let leftColumnHTML = '';
  activeModules.forEach(key => {
    if (MODULE_DEFS[key]) {
      leftColumnHTML += MODULE_DEFS[key].html;
    }
  });

root.innerHTML = `
    <video id="bg-video" autoplay loop muted playsinline style="position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; object-fit: cover; z-index: -2; opacity: 0; transition: opacity 1s ease-in-out;"></video>
    <div id="bg-layer"></div>

    <div class="col col-left">
      ${leftColumnHTML}
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
        <div class="memo-top-row">
          <textarea id="memo-input" rows="2" placeholder="${t('memo_placeholder')}" autocomplete="off"></textarea>
          <button id="memo-new" class="memo-mini-btn" title="メモ作成">＋</button>
          <button id="memo-show-all" class="memo-mini-btn" title="すべてのメモ">☰</button>
        </div>
        <div id="memo-cards" class="memo-cards"></div>
      </div>

      <div class="search-wrapper">
        <span class="search-icon"></span>
        <input id="search-input" type="text" placeholder="${t('search_placeholder')}" autocomplete="off">
        <span id="search-clear" class="search-clear">×</span>
        <div id="search-suggestions" class="search-suggestions"></div>
      </div>

      <div class="dock" id="main-dock">
        <div class="dock-separator"></div>
        <div class="dock-item tilt-card" id="zen-btn" title="${t('zen_mode_tooltip')}" style="font-size:0.8rem; font-weight:700; letter-spacing:1px;">ZEN</div>
        <div class="dock-item tilt-card" id="settings-btn" title="${t('settings_tooltip')}">
            <svg viewBox="0 0 24 24" class="icon-svg" style="width:24px; height:24px;"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        </div>
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
          <button class="st-tab-btn active" data-tab="tab-general">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            ${t('settings_general')}
          </button>
          <button class="st-tab-btn" data-tab="tab-appearance">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-2.76-2.24-5-5-5zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
            ${t('settings_appearance')}
          </button>
          <button class="st-tab-btn" data-tab="tab-media">
             <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            ${t('settings_media')}
          </button>
          <button class="st-tab-btn" data-tab="tab-dock">
             <svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
            ${t('settings_dock')}
          </button>
          <div style="flex:1"></div>
          <button class="st-tab-btn" data-tab="tab-about">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            ${t('settings_about')}
          </button>
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
              
              <div class="st-group-title">${t('modules_group')} (Left Column)</div>

              <div class="st-row">
                <span>Slot 1 (Top)</span>
                <select id="set-module-1" class="st-select">
                  <option value="weather">Weather</option>
                  <option value="news">News</option>
                  <option value="countdown">Countdown</option>
                  <option value="todo">Todo List</option>
                  <option value="calc">Calculator</option>
                  <option value="timer">Timer</option>  <option value="none">なし (None)</option>
                </select>
              </div>

              <div class="st-row">
                <span>Slot 2 (Middle)</span>
                <select id="set-module-2" class="st-select">
                  <option value="weather">Weather</option>
                  <option value="news">News</option>
                  <option value="countdown">Countdown</option>
                  <option value="todo">Todo List</option>
                  <option value="calc">Calculator</option>
                  <option value="timer">Timer</option>  <option value="none">なし (None)</option>
                </select>
              </div>

              <div class="st-row">
                <span>Slot 3 (Bottom)</span>
                <select id="set-module-3" class="st-select">
                  <option value="weather">Weather</option>
                  <option value="news">News</option>
                  <option value="countdown">Countdown</option>
                  <option value="todo">Todo List</option>
                  <option value="calc">Calculator</option>
                  <option value="timer">Timer</option>  <option value="none">なし (None)</option>
                </select>
              </div>              
              <div class="st-row"><span>${t('greeting_msg')}</span><label class="toggle-switch"><input type="checkbox" id="set-show-quote"><span class="slider"></span></label></div>
              
              <div class="st-row column-layout">
                <span>${t('weather_city_label')}</span>
                <div class="input-with-btn">
                  <input type="text" id="set-weather-city" placeholder="Tokyo" class="st-input">
                  <button id="btn-apply-city" class="st-btn-small">${t('update_btn')}</button>
                </div>
              </div>

              <div class="st-row column-layout">
                <span>${t('rss_url_label')}</span>
                <input type="text" id="set-news-url" placeholder="https://news.yahoo.co.jp/rss/topics/it.xml" class="st-input">
                <div style="font-size:0.75rem; opacity:0.6; margin-top:4px;">${t('rss_url_hint')}</div>
              </div>

              <div class="st-row"><span>${t('zen_mode_btn')}</span><label class="toggle-switch"><input type="checkbox" id="set-show-zen"><span class="slider"></span></label></div>
              
              <div class="st-group-title">${t('event_settings_group')}</div>
              
              <div class="column-layout" style="padding: 0 10px;">
                <div style="font-size:0.8rem; margin-bottom:8px; opacity:0.8;">${t('calendar_urls_label')}</div>
                <div id="calendar-settings-list"></div>
                <button id="add-calendar-btn" class="st-btn" style="margin-top:5px; width:100%;">${t('add_calendar_btn')}</button>
                
                <div style="font-size:0.75rem; opacity:0.6; margin-top:8px; line-height:1.4;">
                  Google: 設定 > 統合 > iCal形式の非公開URL<br>
                  Apple: iCloudカレンダー > 共有 > 公開カレンダー > リンクをコピー
                </div>
              </div>

              <div class="st-row column-layout" style="margin-top:15px;">
                <span>${t('countdown_target')}</span>
                <input type="text" id="set-cnt-title" placeholder="${t('event_name_placeholder')}" class="st-input" style="margin-bottom:8px;">
                <div class="input-with-btn">
                  <input type="datetime-local" id="set-cnt-date" class="st-input">
                  <button id="btn-apply-cnt" class="st-btn-small">${t('update_btn')}</button>
                </div>
              </div>

              <div class="st-group-title" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                ${t('profile_list_group')}
              </div>
              
              <div class="st-row column-layout">
                <div class="input-with-btn">
                  <input type="text" id="new-profile-name" placeholder="${t('profile_name_input')}" class="st-input">
                  <button id="btn-save-profile" class="st-btn-small" style="white-space:nowrap;">${t('btn_save_profile')}</button>
                </div>
                <div id="saved-profiles-list" class="profile-grid"></div>
              </div>

              <div class="st-group-title" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
  ${t('backup_group')}
</div>
<div style="font-size: 0.8rem; opacity: 0.7; margin-bottom: 10px; padding: 0 5px;">
  ${t('backup_desc')}
</div>
              <div class="st-row" style="justify-content: flex-start; gap: 10px;">
                <button id="btn-export-settings" class="st-btn" style="flex:1;">
                  ${t('btn_export')}
                </button>
                <button id="btn-import-settings-trigger" class="st-btn" style="flex:1;">
                  ${t('btn_import')}
                </button>
                <input type="file" id="file-import-settings" accept=".json" style="display: none;">
              </div>
            </div>

           <div id="tab-appearance" class="st-section">
              <div class="st-group-title">${t('clock_style_group')}</div>

              <div class="st-row">
                <span>${t('time_format_12h')}</span>
                <label class="toggle-switch"><input type="checkbox" id="set-use-12h"><span class="slider"></span></label>
              </div>
              
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
              
              <div class="st-row">
                <span>Theme Mode</span>
                <select id="set-theme-mode" class="st-select">
                  <option value="glass">${t('theme_glass')}</option>
                  <option value="yarn">${t('theme_yarn')}</option>
                  <option value="terminal">${t('theme_terminal')}</option>
                  <option value="retro">${t('theme_retro')}</option>
                  <option value="lite">${t('theme_lite')}</option>
                </select>
              </div>

              <div class="st-row"><span>${t('accent_color')}</span><input type="color" id="set-accent" class="st-color"></div>
              <div class="st-row">
                <span>${t('time_format_12h')}</span>
                <label class="toggle-switch"><input type="checkbox" id="set-use-12h"><span class="slider"></span></label>
              </div>
              
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
              
              <div class="st-row"><span>${t('card_tilt')}</span><label class="toggle-switch"><input type="checkbox" id="set-card-tilt"><span class="slider"></span></label></div>
              
             <div class="st-row column-layout">
                <span>${t('custom_wallpaper_url')}</span>
                <div class="input-with-btn">
                  <input type="text" id="set-img" placeholder="https://..." class="st-input">
                  <button id="btn-apply-img" class="st-btn-small">${t('apply_btn')}</button>
                </div>
              </div>

              <div class="st-row column-layout" style="margin-top: 10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1);">
                <span>${t('wallpaper_upload_label')}</span>
                <div style="display:flex; gap:10px; width:100%;">
                    <label class="st-btn" style="flex:1; text-align:center; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                        📁 Select File
                        <input type="file" id="set-local-img-file" accept="image/*,video/*" style="display:none;">
                    </label>
                    <button id="btn-reset-local-img" class="st-btn danger-btn" style="flex:0 0 auto;">${t('wallpaper_reset_btn')}</button>
                </div>
                <div id="local-img-status" style="font-size:0.75rem; opacity:0.6; margin-top:4px; height:1.2em;"></div>
              </div>
            </div>

            <div id="tab-media" class="st-section">
              <div class="st-group-title">${t('service_link_group')}</div>
              
              <div class="st-row"><span>YouTube</span><label class="toggle-switch"><input type="checkbox" id="set-media-yt"><span class="slider"></span></label></div>
              <div class="st-row"><span>YouTube Music</span><label class="toggle-switch"><input type="checkbox" id="set-media-ytm"><span class="slider"></span></label></div>
              <div class="st-row"><span>${t('spotify_web_tab')}</span><label class="toggle-switch"><input type="checkbox" id="set-media-spotify"><span class="slider"></span></label></div>
              <div class="st-row"><span>${t('media_background_label')}</span><label class="toggle-switch"><input type="checkbox" id="set-media-bg"><span class="slider"></span></label></div>
              
              <div class="st-row column-layout" id="spotify-auth-area" style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                <span style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  ${t('spotify_api_label')} <span style="font-size:0.7rem; opacity:0.6; background:#1db954; color:#000; padding:2px 6px; border-radius:4px; font-weight:bold;">${t('spotify_recommended')}</span>
                </span>
                <button id="btn-spotify-login" class="st-btn primary-btn" style="width:100%; margin-top:8px;">${t('spotify_login_btn')}</button>
                <div style="font-size:0.75rem; opacity:0.6; margin-top:8px; line-height:1.4;">
                  ${t('spotify_desc')}
                </div>
              </div>

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


    <div id="memo-modal" class="overlay-modal">
      <div class="memo-window glass-card modal-card">
        <div class="memo-window-header">
          <div class="memo-window-title">メモ</div>
          <div class="memo-window-actions">
            <button id="memo-modal-new" class="memo-mini-btn" title="メモ作成">＋</button>
            <button id="memo-modal-close" class="memo-mini-btn" title="閉じる">×</button>
          </div>
        </div>
        <div class="memo-window-body">
          <div class="memo-list-pane">
            <input type="text" id="memo-search" class="st-input memo-search" placeholder="検索…" autocomplete="off">
            <div id="memo-list" class="memo-list"></div>
          </div>
          <div class="memo-editor-pane">
            <input type="text" id="memo-editor-title" class="st-input memo-title" placeholder="タイトル" autocomplete="off">
            <textarea id="memo-editor-text" class="memo-text" placeholder="ここにメモを書きます…"></textarea>
            <div class="memo-editor-footer">
              <div id="memo-updated" class="memo-meta"></div>
              <div class="memo-editor-actions">
                <button id="memo-editor-delete" class="st-btn danger-btn">削除</button>
                <button id="memo-editor-save" class="st-btn primary-btn">保存</button>
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
  adjustLayoutScale();
  setupAppLauncher();
  setupGoogleLens();
  showSetupWizard();
  setupNewModules();
  setupTimer();
  setupVideoIdleHandler();
  setupBackupSystem();
  setupProfileSystem();
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


  document.body.classList.remove('yarn-mode', 'lite-mode', 'terminal-mode', 'retro-mode'); 
  
  if (prefs.themeMode === 'yarn') {
    document.body.classList.add('yarn-mode');
  } else if (prefs.themeMode === 'lite') {
    document.body.classList.add('lite-mode');
  } else if (prefs.themeMode === 'terminal') {
    document.body.classList.add('terminal-mode');
  } else if (prefs.themeMode === 'retro') { 
    document.body.classList.add('retro-mode');
  }

  const themeSelect = document.getElementById('set-theme-mode');
  if (themeSelect) themeSelect.value = prefs.themeMode || 'glass';

  const setVal = (id, v) => { const el = document.getElementById(id); if(el) el.value = v; };

  setVal('set-user-name', prefs.userName !== undefined ? prefs.userName : 'User');
  setVal('set-news-url', prefs.newsUrl || '');
  setVal('set-ical-url', prefs.icalUrl || '');
  setVal('set-module-1', prefs.module1 || 'weather');
  setVal('set-module-2', prefs.module2 || 'news');
  setVal('set-module-3', prefs.module3 || 'countdown');

  const ownerLabel = document.getElementById('about-owner-name');
  if(ownerLabel) ownerLabel.innerText = prefs.userName !== undefined ? prefs.userName : 'User';

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

  const currentCity = localStorage.getItem('immersion_city') || 'Tokyo';
  const cityInput = document.getElementById('set-weather-city');
  if(cityInput) cityInput.value = currentCity;

  const setCheck = (id, v) => { const el = document.getElementById(id); if(el) el.checked = v !== false; };
  setCheck('set-burnin', prefs.burnIn);
  setCheck('set-card-tilt', prefs.cardTilt);
  setCheck('set-show-seconds', prefs.showSeconds);
  setCheck('set-use-12h', prefs.use12hFormat);
  setCheck('set-show-quote', prefs.showQuote);
  setCheck('set-show-music', prefs.showMusic);
  setCheck('set-show-calendar', prefs.showCalendar);

  setCheck('set-media-yt', prefs.mediaYT);
  setCheck('set-media-ytm', prefs.mediaYTMusic);
  setCheck('set-media-spotify', prefs.mediaSpotify);
  setCheck('set-media-bg', prefs.mediaBackground);
  setCheck('set-show-zen', prefs.showZenMode);

  const toggle = (id, visible) => {
    const el = document.getElementById(id);
    if(el) el.style.display = (visible === false) ? 'none' : 'flex';
    if(id === 'quote-box' && el) el.style.display = (visible === false) ? 'none' : 'block';
  };

  toggle('quote-box', prefs.showQuote);
  toggle('music-card-container', prefs.showMusic);
  toggle('card-calendar', prefs.showCalendar);
  toggle('zen-btn', prefs.showZenMode);
}


function savePreferences() {
  const getVal = (id) => document.getElementById(id)?.value;
  const getChk = (id) => document.getElementById(id)?.checked;

  const oldPrefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  const oldMods = (oldPrefs.module1 || '') + (oldPrefs.module2 || '') + (oldPrefs.module3 || '');
  const oldLang = oldPrefs.language;

  const prefs = {
    userName: getVal('set-user-name'),
    accent: getVal('set-accent'),
    clockFont: getVal('set-font'),
    bgBrightness: getVal('set-bright'),
    newsUrl: getVal('set-news-url'),
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
    cardTilt: getChk('set-card-tilt'),
    showSeconds: getChk('set-show-seconds'),
    use12hFormat: getChk('set-use-12h'),
    showQuote: getChk('set-show-quote'),
    mediaYT: getChk('set-media-yt'),
    
    themeMode: getVal('set-theme-mode'),

    module1: getVal('set-module-1'),
    module2: getVal('set-module-2'),
    module3: getVal('set-module-3'),
    
    mediaYTMusic: getChk('set-media-ytm'),
    mediaSpotify: getChk('set-media-spotify'),
    mediaBackground: getChk('set-media-bg'),
    showZenMode: getChk('set-show-zen'),
    calendarUrls: oldPrefs.calendarUrls || []
  };
  
  const cityInput = document.getElementById('set-weather-city');
  if (cityInput) {
      const newCity = cityInput.value.trim() || 'Tokyo';
      const oldCity = localStorage.getItem('immersion_city');
      if (newCity !== oldCity) {
          localStorage.setItem('immersion_city', newCity);
          fetchWeather(newCity); 
      }
  }

  localStorage.setItem('immersion_prefs', JSON.stringify(prefs));

  const newMods = prefs.module1 + prefs.module2 + prefs.module3;

  if (oldLang !== prefs.language || oldMods !== newMods) {
      document.getElementById('immersion-root')?.remove();
      initNestHub();
      document.getElementById('settings-btn').click();
      document.getElementById('settings-modal').classList.add('show');
      return;
  }

  applyPreferences();
  initTiltEffect();
  setupBurnInProtection();
  updateQuote();
  fetchNews();
}


function initSettingsLogic() {
  const modal = document.getElementById('settings-modal');
  const openBtn = document.getElementById('settings-btn');
  const closeBtn = document.getElementById('close-settings');

  openBtn.onclick = (e) => { 
      e.stopPropagation(); 
      modal.classList.add('show'); 
      renderDockSettingsList(); 
      renderCalendarSettingsList(); 
  };
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

      document.querySelector('.st-content-scroll').scrollTop = 0;
    };
  });

  ['set-accent', 'set-bright', 'set-blur', 'set-size', 'set-opacity', 'set-glass-opacity'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', savePreferences);
  });



  ['set-font', 'set-user-name', 'set-ical-url'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', savePreferences);
  });


  const newsInput = document.getElementById('set-news-url');
  if (newsInput) {
    newsInput.addEventListener('change', async (e) => {
      const url = e.target.value;
      

      const isGranted = await requestRssPermission(url);
      
      if (isGranted) {

        savePreferences();
      } else {

        const prefs = JSON.parse(localStorage.getItem('immersion_prefs'));
        e.target.value = prefs.newsUrl || ''; 
      }
    });
  }


  document.getElementById('set-language')?.addEventListener('change', savePreferences);
document.getElementById('set-theme-mode')?.addEventListener('change', savePreferences);
['set-module-1', 'set-module-2', 'set-module-3'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', savePreferences);
  });
  [
    'set-burnin', 'set-card-tilt', 'set-show-seconds', 'set-use-12h', 'set-show-quote', 'set-show-weather', 'set-show-news', 'set-show-countdown', 'set-show-music', 'set-show-calendar', 'set-show-zen',
    'set-media-yt', 'set-media-ytm', 'set-media-spotify', 'set-media-bg'
  ].forEach(id => document.getElementById(id)?.addEventListener('change', savePreferences));


  document.getElementById('btn-apply-img').onclick = () => {
    savePreferences();
    const prefs = JSON.parse(localStorage.getItem('immersion_prefs'));
    const bgLayer = document.getElementById('bg-layer');
    if(bgLayer && prefs.idleImgUrl) bgLayer.style.backgroundImage = `url('${prefs.idleImgUrl}')`;
    alert(t('wallpaper_updated'));
  };

  document.getElementById('btn-apply-cnt').onclick = () => {
    savePreferences();
    alert(t('event_set'));
  };

  document.getElementById('add-dock-item-btn').onclick = addDockItem;

  const loginBtn = document.getElementById('btn-spotify-login');
  if(loginBtn) {
      

      chrome.runtime.sendMessage({ action: "checkSpotifyLogin" }, (res) => {
          if (res && res.loggedIn) {

              loginBtn.innerText = t('spotify_connected'); 
              loginBtn.style.backgroundColor = "#1db954";
              loginBtn.style.color = "#fff";
          }
      });


      loginBtn.onclick = () => {
          loginBtn.innerText = t('spotify_connecting'); 
          chrome.runtime.sendMessage({ action: "loginSpotify" }, (res) => {
              if(res && res.success) {
                  loginBtn.innerText = t('spotify_connected'); 
                  loginBtn.style.backgroundColor = "#1db954";
                  loginBtn.style.color = "#fff";
                  alert(t('spotify_alert_success')); 
              } else {
                  loginBtn.innerText = t('spotify_fail'); 
                  console.error(res.error);
                  alert(t('spotify_alert_fail')); 
              }
          });
      };
  }
  

  const fileInput = document.getElementById('set-local-img-file');
  const resetBtn = document.getElementById('btn-reset-local-img');
  const statusLabel = document.getElementById('local-img-status');


  const savedLocalImg = localStorage.getItem('immersion_local_bg_data');
  if (savedLocalImg) {
      statusLabel.innerText = "Stored: Local Image";
      statusLabel.style.color = "#50E3C2";
  }


  fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // 動画なら500MBまで、画像なら20MBまで
      const limit = file.type.startsWith('video/') ? 500 : 20;
      if (file.size > limit * 1024 * 1024) {
          alert(`File too large (Max ${limit}MB)`);
          fileInput.value = '';
          return;
      }

      try {
          await saveImageToDB(file);
          
          const objectUrl = URL.createObjectURL(file);
          statusLabel.innerText = "Stored: " + file.name;
          statusLabel.style.color = "#50E3C2";
          

          const bgLayer = document.getElementById('bg-layer');
          const bgVideo = document.getElementById('bg-video');

          if (file.type.startsWith('video/')) {
              document.body.classList.add('has-video');
              if(bgVideo) {
                  bgVideo.src = objectUrl;
                  bgVideo.style.opacity = '1';
                  bgVideo.play();
              }
              if(bgLayer) bgLayer.style.backgroundImage = 'none';
          } else {
              document.body.classList.remove('has-video');
              if(bgVideo) {
                  bgVideo.style.opacity = '0';
                  bgVideo.pause();
              }
              if(bgLayer) bgLayer.style.backgroundImage = `url('${objectUrl}')`;
          }
          
          alert(t('wallpaper_updated'));
          localStorage.removeItem('immersion_local_bg_data');

      } catch (err) {
          console.error(err);
          alert("Failed to save file.");
      }
  });
 
 
 
  resetBtn.onclick = async () => {

      await deleteImageFromDB(); 
      localStorage.removeItem('immersion_local_bg_data');      

      statusLabel.innerText = "";
      fileInput.value = '';
      

      const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
      const bgLayer = document.getElementById('bg-layer');
      
      if (bgLayer) {
          if (prefs.idleImgUrl && prefs.idleImgUrl.startsWith('http')) {
  
              bgLayer.style.backgroundImage = `url('${prefs.idleImgUrl}')`;
          } else {
 
              const defImg = defaultWallpapers[Math.floor(Math.random() * defaultWallpapers.length)];
              bgLayer.style.backgroundImage = `url('${defImg}')`;
          }
      }
      
      alert("Image cleared.");
  };
  
  

  getImageFromDB().then(url => {
      if (url) {
          statusLabel.innerText = "Stored: Local Image (HD)";
          statusLabel.style.color = "#50E3C2";
      }
  });


  
  
  const cityBtn = document.getElementById('btn-apply-city');
  if(cityBtn) {
      cityBtn.onclick = () => {
          savePreferences();
          alert("Location updated!"); 
      };
  }

  document.querySelectorAll('.st-range').forEach(slider => {

    if (slider.parentElement.classList.contains('slider-wrapper')) return;


    const wrapper = document.createElement('div');
    wrapper.className = 'slider-wrapper';
    

    slider.parentNode.insertBefore(wrapper, slider);
    wrapper.appendChild(slider);


    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.className = 'st-num-input';
    numInput.min = slider.min;
    numInput.max = slider.max;
    numInput.step = slider.step || 1;
    numInput.value = slider.value;

 
    slider.addEventListener('input', () => {
      numInput.value = slider.value;

      slider.dispatchEvent(new Event('change')); 
    });


    numInput.addEventListener('input', () => {
      let val = parseFloat(numInput.value);
      

      if (val > parseFloat(slider.max)) val = parseFloat(slider.max);
      if (val < parseFloat(slider.min)) val = parseFloat(slider.min);
      
      slider.value = val;

      slider.dispatchEvent(new Event('input')); 
      slider.dispatchEvent(new Event('change')); 
    });


    wrapper.appendChild(numInput);
  });
  
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
    const cards = document.querySelectorAll('.countdown-card');
    if (cards.length === 0) return;

    const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    
    const target = prefs.cntDate ? new Date(prefs.cntDate).getTime() : 0;
    const now = new Date().getTime();
    

    let diff = target - now;
    

    const isPast = diff < 0; 
    diff = Math.abs(diff);

    let d = "--", hms = "--:--:--";
    
    if (prefs.cntDate) {

        d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        hms = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        

    }

    cards.forEach(card => {
        const titleEl = card.querySelector('#cnt-label') || card.querySelector('.label-std');
        const daysEl = card.querySelector('#cnt-days') || card.querySelector('.cnt-big');
        const unitEl = card.querySelector('.cnt-unit'); // "DAYS"の文字
        const hmsEl = card.querySelector('#cnt-hms') || card.querySelector('.cnt-sub');
        const picker = card.querySelector('.cnt-picker');
        const mainArea = card.querySelector('.cnt-main');


        if(titleEl) {
            titleEl.innerText = prefs.cntTitle || t('event');
            titleEl.onclick = (e) => {
                e.stopPropagation();
                const newTitle = prompt("Event Name:", prefs.cntTitle || "");
                if (newTitle !== null) {
                    prefs.cntTitle = newTitle;
                    localStorage.setItem('immersion_prefs', JSON.stringify(prefs));
                    update();
                }
            };
        }
        

        if(daysEl) daysEl.innerText = d;
        if(hmsEl) hmsEl.innerText = hms;
        

        if(unitEl) {
            unitEl.innerText = isPast && prefs.cntDate ? "DAYS AGO" : "DAYS";
            unitEl.style.color = isPast ? "#ff6b6b" : ""; 
        }


        if (mainArea && picker) {
            mainArea.onclick = (e) => {
                e.stopPropagation();
                try {

                    picker.showPicker(); 
                } catch(err) {

                    picker.style.display = 'block';
                    picker.focus();
                    picker.click();
                    picker.style.display = 'none';
                }
            };
            

            picker.onchange = (e) => {
                if (picker.value) {
                    prefs.cntDate = picker.value;
                    localStorage.setItem('immersion_prefs', JSON.stringify(prefs));
                    update();
                }
            };
            

            picker.onclick = (e) => e.stopPropagation();
        }
    });
  };
  
  setInterval(update, 1000);
  update();
}


function getDockItems() { const saved = localStorage.getItem('immersion_dock_items'); return saved ? JSON.parse(saved) : defaultDockItems; }
function renderDock() {
  const dock = document.getElementById('main-dock'); const items = getDockItems(); const existing = dock.querySelectorAll('.dynamic-dock-item'); existing.forEach(el => el.remove());
  items.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'dock-item tilt-card dynamic-dock-item';
    if (item.icon && (item.icon.startsWith('http') || item.icon.startsWith('data:image'))) {
        div.style.overflow = 'hidden';

        const img = document.createElement('img');
        img.src = item.icon;
        img.style.cssText = "width:100%; height:100%; object-fit:cover; display:block; pointer-events:none;";
        
        img.onerror = () => {
            img.style.display = 'none';
            div.innerText = item.icon; 
        };
        
        div.appendChild(img);
    } else {

        if (item.icon.trim().startsWith('<svg')) {
             div.innerHTML = item.icon;

             div.firstElementChild.classList.add('icon-svg');
             div.firstElementChild.style.width = '24px'; 
             div.firstElementChild.style.height = '24px';
        } else {
             div.innerText = item.icon;
        }
    }    div.title = item.url;
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
      <input type="text" class="ds-icon" placeholder="${t('icon_placeholder')}">
      <div class="ds-label" style="margin-top:8px;">${t('url_label')}</div>
      <input type="text" class="ds-url" placeholder="${t('url_label')}">
    `;

    const iI = row.querySelector('.ds-icon');
    const uI = row.querySelector('.ds-url');
    

    iI.value = item.icon;
    uI.value = item.url;

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
      container.style.display = 'none';
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.isComposing) return;

    if(e.key === 'Enter' && input.value) {
       const activeItem = document.querySelector('.suggestion-item.active');
       if (activeItem) {
          return;
       }

       const val = input.value.trim();


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


       chrome.search.query({ text: val, disposition: 'CURRENT_TAB' });
    }
  });



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


    const googlePromise = isEmp ? Promise.resolve([]) : new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ action: "fetchGoogleSuggestions", query: query }, (res) => {
           if (chrome.runtime.lastError || !res || !res.data) {
             resolve([]);
           } else {
             resolve(res.data);
           }
        });
      } catch(e) {
        resolve([]);
      }
    });

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

        chrome.search.query({ text: item.text, disposition: 'CURRENT_TAB' });
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
function setupMemo() {
  const LEGACY_KEY = 'immersion_memo';                 // 後方互換（旧：単一メモ）
  const MEMOS_KEY  = 'immersion_memos';                // 新：複数メモ
  const ACTIVE_KEY = 'immersion_active_memo_id';       // 新：選択中メモID

  const input = document.getElementById('memo-input');
  const cards = document.getElementById('memo-cards');
  const btnNew = document.getElementById('memo-new');
  const btnAll = document.getElementById('memo-show-all');

  const modal = document.getElementById('memo-modal');
  const modalClose = document.getElementById('memo-modal-close');
  const modalNew = document.getElementById('memo-modal-new');
  const search = document.getElementById('memo-search');
  const list = document.getElementById('memo-list');
  const edTitle = document.getElementById('memo-editor-title');
  const edText = document.getElementById('memo-editor-text');
  const edSave = document.getElementById('memo-editor-save');
  const edDelete = document.getElementById('memo-editor-delete');
  const updatedLabel = document.getElementById('memo-updated');

  if (!input || !cards) return;

  const nowIso = () => new Date().toISOString();
  const genId = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

  const loadMemos = () => {
    try {
      const raw = localStorage.getItem(MEMOS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr
        .filter(m => m && typeof m === 'object')
        .map(m => ({
          id: String(m.id || ''),
          title: String(m.title || 'メモ'),
          text: String(m.text || ''),
          createdAt: String(m.createdAt || ''),
          updatedAt: String(m.updatedAt || '')
        }))
        .filter(m => m.id);
    } catch {
      return [];
    }
  };

  const saveMemos = (arr) => {
    localStorage.setItem(MEMOS_KEY, JSON.stringify(arr));
  };

  const getActiveId = () => localStorage.getItem(ACTIVE_KEY) || '';
  const setActiveId = (id) => {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  };

  const findMemo = (id, memos) => (memos || loadMemos()).find(m => m.id === id) || null;

  const ensureMigration = () => {
    let memos = loadMemos();
    let activeId = getActiveId();

    // 旧キー（immersion_memo）→ 複数メモへ移行
    if (memos.length === 0) {
      const legacy = (localStorage.getItem(LEGACY_KEY) || '').trim();
      if (legacy) {
        const id = genId();
        const t = nowIso();
        memos = [{ id, title: 'メモ', text: legacy, createdAt: t, updatedAt: t }];
        saveMemos(memos);
        activeId = id;
        setActiveId(id);
      }
    }

    // active が無ければ先頭を選択
    if (!activeId && memos.length > 0) {
      activeId = memos[0].id;
      setActiveId(activeId);
    }

    // legacy を active と同期（プロファイル保存などの互換用）
    const active = activeId ? findMemo(activeId, memos) : null;
    if (active) localStorage.setItem(LEGACY_KEY, active.text || '');
  };

  const ensureAtLeastOne = () => {
    let memos = loadMemos();
    if (memos.length === 0) {
      const id = genId();
      const t = nowIso();
      memos = [{ id, title: 'メモ', text: '', createdAt: t, updatedAt: t }];
      saveMemos(memos);
      setActiveId(id);
      localStorage.setItem(LEGACY_KEY, '');
    }
  };

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleString();
    } catch {
      return '';
    }
  };

  const openModal = () => {
    if (!modal) return;
    modal.classList.add('show');
    renderModalList();
    loadEditor(getActiveId());
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('show');
    renderPreviewCards();
  };

  // opts.openModal: true なら一覧/編集モーダルを開く
  // opts.focusMain: true ならメイン入力へフォーカス
  const createMemo = (opts = { openModal: true, focusMain: false }) => {
    const memos = loadMemos();
    const id = genId();
    const t = nowIso();
    const m = { id, title: '新規メモ', text: '', createdAt: t, updatedAt: t };
    memos.unshift(m);
    saveMemos(memos);
    setActiveId(id);
    localStorage.setItem(LEGACY_KEY, '');
    syncInputToActive();

    // カードを即反映
    renderPreviewCards();

    if (opts && opts.openModal) {
      openModal();
      setTimeout(() => edTitle && edTitle.focus(), 0);
    } else if (opts && opts.focusMain) {
      setTimeout(() => {
        try {
          input && input.focus();
        } catch {}
      }, 0);
    }
  };

  const deleteActiveMemo = () => {
    const memos = loadMemos();
    const activeId = getActiveId();
    const idx = memos.findIndex(m => m.id === activeId);
    if (idx === -1) return;

    if (!confirm('このメモを削除しますか？')) return;

    memos.splice(idx, 1);

    if (memos.length === 0) {
      const id = genId();
      const t = nowIso();
      memos.push({ id, title: 'メモ', text: '', createdAt: t, updatedAt: t });
      setActiveId(id);
      localStorage.setItem(LEGACY_KEY, '');
    } else {
      setActiveId(memos[Math.max(0, idx - 1)].id);
      const next = findMemo(getActiveId(), memos);
      localStorage.setItem(LEGACY_KEY, next ? (next.text || '') : '');
    }

    saveMemos(memos);
    syncInputToActive();
    renderModalList();
    loadEditor(getActiveId());
    renderPreviewCards();
  };

  const setActiveMemo = (id) => {
    const memos = loadMemos();
    const memo = findMemo(id, memos);
    if (!memo) return;

    setActiveId(memo.id);
    localStorage.setItem(LEGACY_KEY, memo.text || '');
    syncInputToActive();
    renderPreviewCards();
  };

  let syncing = false;
  const syncInputToActive = () => {
    const memos = loadMemos();
    const active = findMemo(getActiveId(), memos);
    syncing = true;
    input.value = active ? (active.text || '') : '';
    syncing = false;
  };

  const renderPreviewCards = () => {
    const memos = loadMemos()
      .slice()
      .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    const activeId = getActiveId();

    cards.innerHTML = '';

    const MAX = 4;
    memos.slice(0, MAX).forEach(m => {
      const card = document.createElement('div');
      card.className = 'memo-card' + (m.id === activeId ? ' active' : '');

      const title = (m.title || 'メモ').trim();
      const text = (m.text || '').trim();
      const snippet = text ? text.split(/\r?\n/)[0].slice(0, 80) : '（空）';

      const titleEl = document.createElement('div');
      titleEl.className = 'memo-card-title';
      titleEl.textContent = title;

      const snipEl = document.createElement('div');
      snipEl.className = 'memo-card-snippet';
      snipEl.textContent = snippet;

      card.appendChild(titleEl);
      card.appendChild(snipEl);

      card.onclick = () => {
        setActiveMemo(m.id);
        openModal();
      };

      cards.appendChild(card);
    });

    if (memos.length > MAX) {
      const more = document.createElement('div');
      more.className = 'memo-more';
      more.textContent = `＋${memos.length - MAX} 件`;
      more.onclick = openModal;
      cards.appendChild(more);
    }

    if (memos.length === 0) {
      cards.innerHTML = `<div class=\"memo-empty\">メモがありません</div>`;
    }
  };

  let currentEditorId = '';

  const loadEditor = (id) => {
    if (!edTitle || !edText) return;
    const memos = loadMemos();
    const memo = findMemo(id, memos) || memos[0] || null;
    if (!memo) return;

    currentEditorId = memo.id;
    setActiveId(memo.id);
    localStorage.setItem(LEGACY_KEY, memo.text || '');

    edTitle.value = memo.title || 'メモ';
    edText.value = memo.text || '';

    if (updatedLabel) {
      const when = memo.updatedAt || memo.createdAt || '';
      updatedLabel.textContent = when ? `更新: ${formatTime(when)}` : '';
    }

    syncInputToActive();
    renderModalList();
  };

  const commitEditor = () => {
    if (!currentEditorId) return;

    const memos = loadMemos();
    const memo = findMemo(currentEditorId, memos);
    if (!memo) return;

    memo.title = (edTitle ? edTitle.value : memo.title) || 'メモ';
    memo.text = (edText ? edText.value : memo.text) || '';
    memo.updatedAt = nowIso();

    // 更新順を上に
    const idx = memos.findIndex(m => m.id === memo.id);
    if (idx > 0) {
      memos.splice(idx, 1);
      memos.unshift(memo);
    }

    saveMemos(memos);
    setActiveId(memo.id);
    localStorage.setItem(LEGACY_KEY, memo.text || '');

    if (updatedLabel) updatedLabel.textContent = `更新: ${formatTime(memo.updatedAt)}`;

    syncInputToActive();
    renderModalList();
    renderPreviewCards();
  };

  const renderModalList = () => {
    if (!list) return;

    const q = (search && search.value ? search.value : '').trim().toLowerCase();
    const memos = loadMemos()
      .slice()
      .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));

    list.innerHTML = '';

    memos.forEach(m => {
      const hay = `${m.title}
${m.text}`.toLowerCase();
      if (q && !hay.includes(q)) return;

      const item = document.createElement('div');
      item.className = 'memo-list-item' + (m.id === getActiveId() ? ' active' : '');

      const title = document.createElement('div');
      title.className = 'memo-list-title';
      title.textContent = (m.title || 'メモ').trim();

      const meta = document.createElement('div');
      meta.className = 'memo-list-meta';
      meta.textContent = formatTime(m.updatedAt || m.createdAt || '');

      const snip = document.createElement('div');
      snip.className = 'memo-list-snippet';
      snip.textContent = (m.text || '').trim().split(/\r?\n/)[0].slice(0, 90) || '（空）';

      item.appendChild(title);
      item.appendChild(meta);
      item.appendChild(snip);

      item.onclick = () => loadEditor(m.id);

      list.appendChild(item);
    });

    if (!list.children.length) {
      list.innerHTML = `<div class=\"memo-empty\">該当するメモがありません</div>`;
    }
  };

  // ---- 初期化 ----
  ensureMigration();
  ensureAtLeastOne();
  syncInputToActive();
  renderPreviewCards();

  // ---- メイン入力（アクティブメモを即時更新）----
  let inputTimer = null;
  input.addEventListener('input', () => {
    if (syncing) return;

    const activeId = getActiveId();
    const memos = loadMemos();
    const memo = findMemo(activeId, memos);
    if (!memo) return;

    memo.text = input.value || '';
    memo.updatedAt = nowIso();
    saveMemos(memos);
    localStorage.setItem(LEGACY_KEY, memo.text || '');

    // エディタが開いているなら同期
    if (edText && currentEditorId === memo.id) {
      edText.value = memo.text || '';
      if (updatedLabel) updatedLabel.textContent = `更新: ${formatTime(memo.updatedAt)}`;
    }

    if (inputTimer) clearTimeout(inputTimer);
    inputTimer = setTimeout(renderPreviewCards, 200);
  });

  // ---- ボタン ----
  // 「＋」(メイン) はポップアップせず、その場で新規メモを追加
  if (btnNew) btnNew.onclick = () => createMemo({ openModal: false, focusMain: true });
  if (btnAll) btnAll.onclick = openModal;
  // モーダル内の「＋」は従来通りモーダルで作成
  if (modalNew) modalNew.onclick = () => createMemo({ openModal: true, focusMain: false });
  if (modalClose) modalClose.onclick = closeModal;

  // モーダル外クリックで閉じる
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // ---- モーダル内 ----
  if (search) search.addEventListener('input', renderModalList);

  let editorTimer = null;
  const onEditorInput = () => {
    if (editorTimer) clearTimeout(editorTimer);
    editorTimer = setTimeout(commitEditor, 300);
  };

  if (edTitle) edTitle.addEventListener('input', onEditorInput);
  if (edText) edText.addEventListener('input', onEditorInput);

  if (edSave) edSave.onclick = commitEditor;
  if (edDelete) edDelete.onclick = deleteActiveMemo;

  // Ctrl+S / Cmd+S で保存
  if (modal) {
    modal.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        commitEditor();
      }
      if (e.key === 'Escape') closeModal();
    });
  }
}
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
    const now = new Date(); 
    
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    let s = String(now.getSeconds()).padStart(2, '0');
    
    let timeStr = "";
    
    if (prefs.use12hFormat) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; 
        
        timeStr = `${h}:${m}`;
        if(prefs.showSeconds) timeStr += `:${s}`;
        
        timeStr += `<span style="font-size:0.4em; margin-left:15px; opacity:0.6;">${ampm}</span>`;
    } else {
        h = String(h).padStart(2,'0');
        timeStr = `${h}:${m}`; 
        if(prefs.showSeconds) timeStr += `:${s}`;
    }

    const days = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
    const months = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];
    const mStr = months[now.getMonth()];
    const dStr = days[now.getDay()];


    let lang = prefs.language || 'auto';
    if (lang === 'auto') {
        const navLang = navigator.language.slice(0, 2);
        lang = (navLang === 'ja' || navLang === 'ko' || navLang === 'zh') ? navLang : 'en';
    }


    let dateStr = `${mStr} ${now.getDate()} (${dStr})`;
    
    if (lang === 'ja') {

         dateStr = `${mStr}${now.getDate()}日 (${dStr})`;
    } else if (lang === 'ko') {

         dateStr = `${mStr} ${now.getDate()}일 (${dStr})`;
    } else if (lang === 'zh') {

         dateStr = `${mStr}${now.getDate()}日 (${dStr})`;
    }
    
    document.getElementById('clock-time').innerHTML = timeStr; 
    document.getElementById('clock-date').innerText = dateStr;
  }; 
  setInterval(update, 1000); 
  update();
}
function fetchNews() {

  const lists = document.querySelectorAll(".news-list-area");
  

  if (lists.length === 0) return;

  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  const targetUrl = prefs.newsUrl;


  if (!targetUrl) {
    lists.forEach(list => {
        list.innerHTML = `<div style="padding:10px; opacity:0.7; text-align:center;">${t('news_rss_config_prompt')}</div>`;
    });
    return;
  }

  chrome.runtime.sendMessage({ action: "fetchNews", url: targetUrl }, (res) => {

    const currentLists = document.querySelectorAll(".news-list-area");
    if (currentLists.length === 0) return;


    if(!res || res.error || !res.data) {
        currentLists.forEach(list => {
            list.innerHTML = `<div style="padding:10px; opacity:0.7; text-align:center;">${t('news_error')}</div>`;
        });
        return;
    }

    const parser = new DOMParser();
    try {
      const doc = parser.parseFromString(res.data, "text/xml");
      const items = doc.querySelectorAll("item");


      if (items.length === 0) {
         currentLists.forEach(list => {
             list.innerHTML = `<div style="padding:10px; opacity:0.7; text-align:center;">${t('news_no_articles')}</div>`;
         });
         return;
      }

      const fragment = document.createDocumentFragment();
      for(let i=0; i<6; i++) {
        if(!items[i]) break;
        const div = document.createElement("div");
        div.className = "news-item";
        div.innerText = items[i].querySelector("title").textContent;
        const link = items[i].querySelector("link").textContent;
        div.onclick = () => window.location.href = link;
        fragment.appendChild(div);
      }

      currentLists.forEach(list => {
          list.innerHTML = "";

          list.appendChild(fragment.cloneNode(true));
      });

    } catch(e) {
      currentLists.forEach(list => {
          list.innerHTML = `<div style="padding:10px; opacity:0.7; text-align:center;">${t('news_rss_error')}</div>`;
      });
    }
  });
}

function fetchWeather(city) {

  const cards = document.querySelectorAll('.weather-card');
  if (cards.length === 0) return;

  chrome.runtime.sendMessage({ action: "fetchWeather", city: city }, (res) => {

    if(!res?.data) return;

    const w = res.data.current_weather;
    

    let icon = "☁️";
    let text = t('weather_cloudy');
    const code = w.weathercode;
    if(code === 0) { icon = "☀️"; text = t('weather_clear'); }
    else if(code <= 3) { icon = "⛅️"; text = t('weather_sunny'); }
    else if(code >= 51) { icon = "🌧"; text = t('weather_rain'); }


    cards.forEach(card => {

      const setTxt = (cls, val) => {
        const el = card.querySelector('.' + cls);
        if(el) el.innerText = val;
      };

      setTxt('w-temp', `${Math.round(w.temperature)}°`);
      setTxt('w-high', Math.round(w.temperature + 3));
      setTxt('w-low', Math.round(w.temperature - 2));
      setTxt('change-city', `📍 ${city}`);
      setTxt('w-icon', icon);
      setTxt('w-cond', text);
    });
  });
}

function initTiltEffect() {
  const cards = document.querySelectorAll('.tilt-card');
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  

  if (prefs.themeMode === 'lite' || prefs.cardTilt === false) {
     cards.forEach(c => {
       c.onmousemove = null;
       c.onmouseleave = null;
       c.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
     });
     return;
  }

  cards.forEach(card => {
    card.onmousemove = (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const cX = r.width / 2;
      const cY = r.height / 2;

      const isHoveringGrid = e.target.closest('.cal-grid') || e.target.closest('.event-list-area');
      const stabilizer = (card.id === 'card-calendar' && isHoveringGrid) ? 0 : 1;

      const rX = ((y - cY) / cY) * -6 * stabilizer;
      const rY = ((x - cX) / cX) * 6 * stabilizer;

      if (stabilizer === 0) {
          card.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
      } else {
          card.style.transition = 'transform 0.1s ease-out';
      }

      card.style.transform = `perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg) scale(1.02)`;
    };

    card.onmouseleave = () => {
      card.style.transition = 'transform 0.5s ease-out';
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
    };
  });
}


function startMediaSync() {
  let currentArt = "";
  const bgLayer = document.getElementById('bg-layer');
  const container = document.getElementById('music-card-container');


  const setInitialBackground = async () => {
    const bgLayer = document.getElementById('bg-layer');
    const bgVideo = document.getElementById('bg-video');
    

    const applyVideo = (blobUrl) => {
        if (!bgVideo) return;
        document.body.classList.add('has-video');
        bgVideo.src = blobUrl;
        bgVideo.oncanplay = () => {
            bgVideo.style.opacity = '1'; 
            bgVideo.play().catch(e => console.log("Autoplay blocked", e));
        };
    };


    const applyImage = (url) => {
        document.body.classList.remove('has-video');
        if(bgVideo) {
            bgVideo.style.opacity = '0';
            bgVideo.pause();
            bgVideo.src = ""; 
        }
        if(bgLayer) bgLayer.style.backgroundImage = `url('${url}')`;
    };


    const dbUrl = await getImageFromDB();
    if (dbUrl) {
        try {
            const res = await fetch(dbUrl);
            const blob = await res.blob();
            
            if (blob.type.startsWith('video/')) {
                applyVideo(dbUrl);
                return 'video';
            } else {
                applyImage(dbUrl);
                return dbUrl;
            }
        } catch(e) {
            console.error("File type check failed", e);
        }
    }


    const localBg = localStorage.getItem('immersion_local_bg_data');
    if (localBg) {
        applyImage(localBg);
        return localBg;
    }


    const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    if (prefs.idleImgUrl && prefs.idleImgUrl.startsWith('http')) {
         applyImage(prefs.idleImgUrl);
         return prefs.idleImgUrl;
    }

    


    const defImg = defaultWallpapers[Math.floor(Math.random() * defaultWallpapers.length)];
    applyImage(defImg);
    return defImg;
  };

  let sessionIdleArt = ""; 
  setInitialBackground().then(url => {
      sessionIdleArt = url;
  });


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
             document.getElementById('album-art').style.backgroundImage = `url('${d.artwork}')`;
             
             if(prefs.mediaBackground && currentArt !== d.artwork && bgLayer) {
                 currentArt = d.artwork;
                 bgLayer.style.backgroundImage = `url('${d.artwork}')`;
                 

                 document.body.classList.remove('has-video');
                 const v = document.getElementById('bg-video');
                 if(v) v.style.opacity = '0';
                 
             } else if (!prefs.mediaBackground && currentArt !== 'default' && bgLayer) {
                 currentArt = 'default';

                 const v = document.getElementById('bg-video');
                 if (v && v.getAttribute('src')) {
                     document.body.classList.add('has-video');
                     v.style.opacity = '1';
                     v.play();
                 } else {

                     const p = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
                     const targetImg = (p.idleImgUrl && p.idleImgUrl.startsWith('http')) ? p.idleImgUrl : sessionIdleArt;
                     if(targetImg && targetImg !== 'video') bgLayer.style.backgroundImage = `url('${targetImg}')`;
                 }
             }
          }
        } else {

          container?.classList.remove('music-active'); container?.classList.add('music-idle');
          
          const now = new Date();
          const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
          const longDays = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];
          
          const dayEl = document.getElementById('idle-day');
          if(dayEl) dayEl.innerText = longDays[now.getDay()];
          
          const dateEl = document.getElementById('idle-date');
          if(dateEl) dateEl.innerText = now.getDate();

          let idleMonthStr = `${t('dec')} ${now.getFullYear()}`;
          const mVals = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];
          
          if(prefs.language === 'ja' || (!prefs.language && navigator.language.startsWith('ja'))) idleMonthStr = `${now.getFullYear()}年 ${mVals[now.getMonth()]}`;
          else if(prefs.language === 'ko' || (!prefs.language && navigator.language.startsWith('ko'))) idleMonthStr = `${now.getFullYear()}년 ${mVals[now.getMonth()]}`;
          else idleMonthStr = `${mVals[now.getMonth()]} ${now.getFullYear()}`;

          const monthEl = document.getElementById('idle-month');
          if(monthEl) monthEl.innerText = idleMonthStr;


          if(currentArt !== 'default' && bgLayer) {
            currentArt = 'default';

            const v = document.getElementById('bg-video');

            if (v && v.getAttribute('src')) {

                document.body.classList.add('has-video');
                v.style.opacity = '1';
                v.play();
                bgLayer.style.backgroundImage = ''; 
            } else {

                getImageFromDB().then(dbUrl => {
                    if(dbUrl) {
                        bgLayer.style.backgroundImage = `url('${dbUrl}')`;
                    } else {
                         const p = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
                         if(p.idleImgUrl && p.idleImgUrl.startsWith('http')) {
                            bgLayer.style.backgroundImage = `url('${p.idleImgUrl}')`;
                         } else {
                           
                            if(sessionIdleArt && sessionIdleArt !== 'video') {
                                if (sessionIdleArt === 'mode-default') {
                                    bgLayer.style.backgroundImage = '';
                                } else {
                                    bgLayer.style.backgroundImage = `url('${sessionIdleArt}')`;
                                }
                            }
                         }
                    }
                });
            }
          }
      }
      
            });
    } catch(e) { clearInterval(loop); }
  }, 3000);

  const send = (c) => { try{chrome.runtime.sendMessage({action:"controlYouTube", command:c});}catch(e){} };
  document.getElementById('btn-play').onclick = () => send("toggle");
  document.getElementById('btn-prev').onclick = () => send("prev");
  document.getElementById('btn-next').onclick = () => send("next");

  const transferBtn = document.getElementById('btn-transfer');
  if(transferBtn) {
    transferBtn.onclick = () => {
        transferBtn.style.opacity = '0.5';
        chrome.runtime.sendMessage({ action: "transferSpotify" }, (res) => {
          transferBtn.style.opacity = '1';
          if (res && res.success) {
            console.log(`Switched to ${res.deviceName}`);
          } else {
            if (res && res.error === "no_device_found") {

            } else if (res && res.error === "not_logged_in") {
              alert("Spotifyにログインしていません。設定画面から連携してください。");
            }
          }
        });
    };
  }
}

function focusSearchInput() {
  const input = document.getElementById('search-input');
  if (input) {
    input.focus();
    input.select();
  }
}

function renderCalendarSettingsList() {
  const list = document.getElementById('calendar-settings-list');
  if (!list) return;
  
  list.innerHTML = '';
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  

  let urls = prefs.calendarUrls || [];
  if (prefs.icalUrl && urls.length === 0) {
      urls.push(prefs.icalUrl);
  }

  urls.forEach((url, index) => {
    const row = document.createElement('div');
    row.className = 'cal-setting-row';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cal-url-input';
    input.value = url;
    input.placeholder = "https://calendar.google.com/...";
    

    input.onchange = () => {
        urls[index] = input.value;
        saveCalendarUrls(urls);
    };

    const delBtn = document.createElement('div');
    delBtn.className = 'cal-del-btn';
    delBtn.innerText = '×';
    delBtn.onclick = () => {
        urls.splice(index, 1);
        saveCalendarUrls(urls);
        renderCalendarSettingsList();
    };

    row.appendChild(input);
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

function saveCalendarUrls(urls) {
    const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    

    prefs.calendarUrls = urls; 
    

    delete prefs.icalUrl;
    
    localStorage.setItem('immersion_prefs', JSON.stringify(prefs));
    syncGoogleCalendar(); 
}


document.addEventListener('click', (e) => {

    if (e.target && e.target.closest('#add-calendar-btn')) {
        const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
        const urls = prefs.calendarUrls || [];
        urls.push(""); 
        saveCalendarUrls(urls);
        renderCalendarSettingsList();
    }

    if (e.target && e.target.id === 'settings-btn') {
        setTimeout(renderCalendarSettingsList, 100);
    }
});


function syncGoogleCalendar() {
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  
  let urls = prefs.calendarUrls || [];
  if (prefs.icalUrl && !urls.includes(prefs.icalUrl)) {
      urls.push(prefs.icalUrl);
  }

  if (!urls || urls.length === 0) {
    googleEventsCache = {};
    renderCalendarSystem();
    return;
  }


  const fetchPromises = urls.map(url => {
      if (!url) return Promise.resolve(null);
      

      let targetUrl = url.trim();
      if (targetUrl.startsWith('webcal://')) {
          targetUrl = targetUrl.replace('webcal://', 'https://');
      }

      return new Promise(resolve => {
          chrome.runtime.sendMessage({ action: "fetchCalendar", url: targetUrl }, (res) => {
              if (!res || res.error || !res.data) {
                  console.warn("Calendar fetch failed:", targetUrl);
                  resolve(null);
              } else {
                  resolve(res.data);
              }
          });
      });
  });

  Promise.all(fetchPromises).then(results => {
    const mergedEvents = {};

    results.forEach(icalData => {
        if (!icalData) return;
        

        const lines = icalData.split(/\r\n|\n|\r/);
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
              if (mergedEvents[currentDate]) {
                mergedEvents[currentDate] += ` / ${finalTitle}`;
              } else {
                mergedEvents[currentDate] = finalTitle;
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
                 

                 const dateObj = new Date(y, m, d, h, min);                  
                 currentDate = `${dateObj.getFullYear()}_${dateObj.getMonth()}_${dateObj.getDate()}`;
                 timeStr = `${String(dateObj.getHours()).padStart(2,'0')}:${String(dateObj.getMinutes()).padStart(2,'0')}`;
              }
            }
            if (line.startsWith('SUMMARY:')) currentSummary = line.substring(8);
          }
        });

    });

    googleEventsCache = mergedEvents;
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


  eventList.innerHTML = '';
  let hasEvent = false;


  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);



  for(let d=1; d<=lastDate; d++) {
    const key = `event_${year}_${month}_${d}`;
    const localVal = localStorage.getItem(key);
    const googleVal = googleEventsCache[`${year}_${month}_${d}`];

    if(localVal || googleVal) {

        const checkDate = new Date(year, month, d);
        if (checkDate < todayDate) {
            continue; 
        }

        hasEvent = true;
        const rawText = localVal ? `📝 ${localVal}` : googleVal;
        const eventsArray = rawText.split(' / ');

        const r = document.createElement('div');
        r.className = 'event-row';
        

        

        const dateBadge = document.createElement('div');
        dateBadge.className = 'event-date-badge';
        dateBadge.style.cssText = "align-self: flex-start; margin-top: 2px;";
        dateBadge.innerText = d; 


        const contentDiv = document.createElement('div');
        contentDiv.className = 'event-content';
        contentDiv.style.whiteSpace = 'normal';


        eventsArray.forEach(evtText => {
            const line = document.createElement('div');
            line.style.marginBottom = '2px';
            line.innerText = evtText; 
            contentDiv.appendChild(line);
        });


        r.appendChild(dateBadge);
        r.appendChild(contentDiv);



        r.onclick = () => {
            if (!localVal && googleVal) {
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
  
    if(!hasEvent) {

      eventList.innerHTML = `<div style="opacity:0.5; font-size:0.8rem; text-align:center; padding:10px;">${t('no_events')}</div>`;
  }
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


  const oldActions = document.getElementById('ev-external-actions');
  if (oldActions) oldActions.remove();


  const btnContainer = document.createElement('div');
  btnContainer.id = 'ev-external-actions';
  btnContainer.style.cssText = "display:flex; gap:10px; margin-top:15px; margin-bottom:5px; justify-content:center;";


  const googleBtn = document.createElement('button');
  googleBtn.className = 'st-btn';
  googleBtn.innerHTML = 'Google ↗';
  googleBtn.title = "Googleカレンダーに追加";
  googleBtn.style.flex = "1";
  googleBtn.onclick = () => {
      const text = input.value || "New Event";
      const pad = (n) => String(n).padStart(2, '0');
      const sDate = `${year}${pad(month+1)}${pad(day)}`;
      const eDate = `${year}${pad(month+1)}${pad(day+1)}`; 
      const gUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${sDate}/${eDate}`;
      window.open(gUrl, '_blank');
  };


  const appleBtn = document.createElement('button');
  appleBtn.className = 'st-btn';
  appleBtn.innerHTML = 'Apple / PC ⬇';
  appleBtn.title = "カレンダーアプリに追加 (.ics)";
  appleBtn.style.flex = "1";
  appleBtn.onclick = () => {
      const text = input.value || "New Event";
      const pad = (n) => String(n).padStart(2, '0');
      

      const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SearchImmersion//EN
BEGIN:VEVENT
SUMMARY:${text}
DTSTART;VALUE=DATE:${year}${pad(month+1)}${pad(day)}
DTEND;VALUE=DATE:${year}${pad(month+1)}${pad(day+1)}
DESCRIPTION:Added via Search Immersion
END:VEVENT
END:VCALENDAR`;


      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event_${year}${pad(month+1)}${pad(day)}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  btnContainer.appendChild(googleBtn);
  btnContainer.appendChild(appleBtn);


  input.parentNode.insertBefore(btnContainer, input.nextSibling);



  modal.classList.add('show');
  input.focus();

  const close = () => modal.classList.remove('show');
  closeBtn.onclick = close;
  modal.onclick = (e) => { if(e.target === modal) close(); };

  saveBtn.onclick = () => {
      const text = input.value;
      if(text) {

          localStorage.setItem(currentEventKey, text);
          

          
      } else {
          localStorage.removeItem(currentEventKey);
      }
      renderCalendarSystem();
      close();
  };

  delBtn.onclick = () => {
      localStorage.removeItem(currentEventKey);
      renderCalendarSystem();
      close();
  };

  input.onkeydown = (e) => { if(e.key === 'Enter') saveBtn.click(); };
}
setTimeout(syncGoogleCalendar, 2000);
setInterval(syncGoogleCalendar, 5 * 60 * 1000);
window.addEventListener('focus', syncGoogleCalendar);



const defaultGoogleApps = [
    { name: "Google", url: "https://www.google.com/" },
    { name: "YouTube", url: "https://www.youtube.com/" },
    { name: "Maps", url: "https://www.google.com/maps" },
    { name: "Gmail", url: "https://mail.google.com/" },
    { name: "Meet", url: "https://meet.google.com/" },
    { name: "Chat", url: "https://chat.google.com/" },
    { name: "Contacts", url: "https://contacts.google.com/" },
    { name: "Drive", url: "https://drive.google.com/" },
    { name: "Calendar", url: "https://calendar.google.com/" },
    { name: "Translate", url: "https://translate.google.com/" },
    { name: "Photos", url: "https://photos.google.com/" },
    { name: "Duo", url: "https://duo.google.com/" },
    { name: "Chrome", url: "https://www.google.com/chrome/" },
    { name: "News", url: "https://news.google.com/" },
    { name: "Keep", url: "https://keep.google.com/" },
    { name: "Docs", url: "https://docs.google.com/" },
    { name: "Sheets", url: "https://sheets.google.com/" },      { name: "Slides", url: "https://slides.google.com/" },      { name: "Forms", url: "https://forms.google.com/" },        { name: "Play", url: "https://play.google.com/" },
    { name: "YT Music", url: "https://music.youtube.com/" },
    { name: "Gemini", url: "https://gemini.google.com/" },
    { name: "NotebookLM", url: "https://notebooklm.google.com/" },
    { name: "Finance", url: "https://www.google.com/finance/" },
    { name: "Travel", url: "https://www.google.com/travel/" },
    { name: "Earth", url: "https://earth.google.com/" },
    { name: "Classroom", url: "https://classroom.google.com/" },
    { name: "Arts", url: "https://artsandculture.google.com/" },
    { name: "Ads", url: "https://ads.google.com/" },
    { name: "One", url: "https://one.google.com/" }
];

function getAppItems() {
    const saved = localStorage.getItem('immersion_app_order');
    return saved ? JSON.parse(saved) : defaultGoogleApps;
}

function setupAppLauncher() {
    const searchWrapper = document.querySelector('.search-wrapper');
    if (!searchWrapper) return;


    const oldBtn = document.getElementById('app-launcher-btn');
    const oldMenu = document.getElementById('app-launcher-menu');
    if (oldBtn) oldBtn.remove();
    if (oldMenu) oldMenu.remove();


    const btn = document.createElement('div');
    btn.id = 'app-launcher-btn';
    btn.title = 'Google Apps';
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"></path></svg>';
    searchWrapper.appendChild(btn);


    const menu = document.createElement('div');
    menu.id = 'app-launcher-menu';
    searchWrapper.appendChild(menu);


    const renderApps = () => {
        menu.innerHTML = '';
        const apps = getAppItems();

        apps.forEach((app, index) => {
            const a = document.createElement('a');
            a.className = 'app-item';
            a.href = app.url;
            a.draggable = true; 
            a.dataset.index = index; 


            const iconUrl = `https://www.google.com/s2/favicons?domain=${app.url}&sz=128`;
            
            a.innerHTML = `
                <div class="app-icon-wrapper">
                    <img src="${iconUrl}" class="app-icon" alt="${app.name}" draggable="false">
                </div>
                <div class="app-name">${app.name}</div>
            `;

            a.addEventListener('dragstart', handleDragStart);
            a.addEventListener('dragover', handleDragOver);
            a.addEventListener('drop', handleDrop);
            a.addEventListener('dragenter', handleDragEnter);
            a.addEventListener('dragleave', handleDragLeave);


            a.addEventListener('click', (e) => {

            });

            menu.appendChild(a);
        });
    };


    let dragSrcEl = null;

    function handleDragStart(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        this.classList.add('dragging');
    }

    function handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('over');
    }

    function handleDragLeave(e) {
        this.classList.remove('over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();

        if (dragSrcEl !== this) {

            const apps = getAppItems();
            const srcIdx = parseInt(dragSrcEl.dataset.index);
            const targetIdx = parseInt(this.dataset.index);


            const [removed] = apps.splice(srcIdx, 1);
            apps.splice(targetIdx, 0, removed);

            localStorage.setItem('immersion_app_order', JSON.stringify(apps));
            renderApps();
        }
        return false;
    }


    menu.addEventListener('dragend', () => {
        const items = menu.querySelectorAll('.app-item');
        items.forEach(item => {
            item.classList.remove('over');
            item.classList.remove('dragging');
        });
    });


    renderApps();


    btn.onclick = (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
        btn.classList.toggle('active');
    };

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
            menu.classList.remove('show');
            btn.classList.remove('active');
        }
    });
}

function adjustLayoutScale() {
  const root = document.getElementById('immersion-root');
  if (!root) return;


  root.style.zoom = "";
  root.style.transform = "";
  root.style.width = "100vw";
  root.style.height = "100vh";
  root.style.transformOrigin = "";


  let scale = 1;
  const customZoom = localStorage.getItem('immersion_custom_zoom');

  if (customZoom) {

    scale = parseFloat(customZoom);
  } else {
  
    const baseHeight = 920;
    const windowHeight = window.innerHeight;
    if (windowHeight < baseHeight) {
      scale = Math.max(0.6, windowHeight / baseHeight);
    }
  }

 
  if (scale !== 1) {

    root.style.transform = `scale(${scale})`;
    root.style.transformOrigin = "top left"; 
    
    root.style.width = `${100 / scale}vw`;
    root.style.height = `${100 / scale}vh`;
  }
}

window.addEventListener('resize', adjustLayoutScale);

function showSetupWizard() {
  if (localStorage.getItem('immersion_setup_done')) return;


  const savedZoom = localStorage.getItem('immersion_custom_zoom');
  const currentZoom = savedZoom ? parseFloat(savedZoom) : 1.0;


  const root = document.createElement('div');
  root.id = 'setup-wizard-overlay';
  
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  const currentLang = prefs.language || 'auto';
  const langLabelMap = { 'auto': 'Auto', 'ja': '日本語', 'en': 'English', 'ko': '한국어', 'zh_cn': '中文' };
  const currentLangLabel = langLabelMap[currentLang] || 'Language';


  root.innerHTML = `
    <div class="setup-card" style="position:relative;">
      
      <div style="position:absolute; top:24px; right:24px; z-index:10;">
        <div class="lang-selector-container">
          <span style="font-size:1rem; line-height:1;">🌐</span>
          <div style="position:relative; display:flex; align-items:center;">
            <span style="font-size:0.8rem; font-weight:500; color:rgba(255,255,255,0.9); margin-right:4px;">${currentLangLabel}</span>
            <span style="font-size:0.6rem; opacity:0.5;">▼</span>
            <select id="wiz-lang" style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer; appearance:none;">
              <option value="auto" ${currentLang === 'auto' ? 'selected' : ''}>Auto (System)</option>
              <option value="ja" ${currentLang === 'ja' ? 'selected' : ''}>日本語</option>
              <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
              <option value="ko" ${currentLang === 'ko' ? 'selected' : ''}>한국어</option>
              <option value="zh_cn" ${currentLang === 'zh_cn' ? 'selected' : ''}>简体中文</option>
            </select>
          </div>
        </div>
      </div>

      <div class="setup-title">${t('wizard_title')}</div>
      <div class="setup-desc">${t('wizard_desc')}</div>

      <div class="setup-group">
        <label class="setup-label">${t('wizard_name_label')}</label>
        <input type="text" id="wiz-name" class="st-input" value="${prefs.userName || ''}" placeholder="${t('wizard_name_placeholder')}">
      </div>

      <div class="setup-group">
        <label class="setup-label">${t('wizard_zoom_label')}</label>
        <input type="range" id="wiz-zoom" class="st-range" min="0.25" max="3.0" step="0.05" value="${currentZoom}" style="width:100%">
        <div style="font-size:0.7rem; opacity:0.6; margin-top:5px; text-align:center; color:rgba(255,255,255,0.5);">
          ${t('wizard_zoom_hint')}
        </div>
      </div>

      <div class="setup-group">
        <label class="setup-label">${t('wizard_color_label')}</label>
        <input type="color" id="wiz-color" class="st-color" value="${prefs.accent}" style="width:100%; height:54px; cursor:pointer;">
      </div>

      <button id="wiz-finish" class="setup-btn">${t('wizard_finish_btn')}</button>
    </div>
  `;

  document.body.appendChild(root);


  const nameInput = document.getElementById('wiz-name');
  const zoomInput = document.getElementById('wiz-zoom');
  const colorInput = document.getElementById('wiz-color');
  const finishBtn = document.getElementById('wiz-finish');
  const langSelect = document.getElementById('wiz-lang');


  if (zoomInput) {
    zoomInput.addEventListener('input', (e) => {
      document.body.style.zoom = e.target.value;
      localStorage.setItem('immersion_custom_zoom', e.target.value);
    });

    const togglePreview = (active) => {
        if(active) root.classList.add('preview-mode');
        else root.classList.remove('preview-mode');
    };
    zoomInput.addEventListener('mousedown', () => togglePreview(true));
    zoomInput.addEventListener('touchstart', () => togglePreview(true));
    zoomInput.addEventListener('mouseup', () => togglePreview(false));
    zoomInput.addEventListener('touchend', () => togglePreview(false));
  }

  colorInput.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--accent', e.target.value);
  });

  langSelect.onchange = (e) => {
    const p = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    p.language = e.target.value;
    localStorage.setItem('immersion_prefs', JSON.stringify(p));
    location.reload(); 
  };

  finishBtn.onclick = () => {
    const newPrefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    newPrefs.userName = nameInput.value || 'User';
    newPrefs.accent = colorInput.value;
    newPrefs.language = langSelect.value;
    
    localStorage.setItem('immersion_prefs', JSON.stringify(newPrefs));
    localStorage.setItem('immersion_setup_done', 'true');

    root.style.opacity = '0';
    setTimeout(() => root.remove(), 500);
    
    applyPreferences();
    updateQuote();
  };
}

function adjustLayoutScale() {

}


function setupNewModules() {
  setupTodo();
  setupCalculator();
}

function setupTodo() {
  const input = document.getElementById('todo-input');
  const list = document.getElementById('todo-list');
  if (!input || !list) return;


  let savedTodos = JSON.parse(localStorage.getItem('immersion_todos')) || [];

 
  savedTodos = savedTodos.filter(todo => !todo.done);
  localStorage.setItem('immersion_todos', JSON.stringify(savedTodos));
  
  const renderTodos = () => {
    list.innerHTML = '';
    savedTodos.forEach((todo, index) => {
      const li = document.createElement('li');
      li.className = `todo-item ${todo.done ? 'checked' : ''}`;
      li.innerHTML = `<span class="todo-check">${todo.done ? '✅' : '⬜'}</span> <span>${todo.text}</span>`;
      
      li.onclick = (e) => {
        if(e.shiftKey) {

           savedTodos.splice(index, 1);
        } else {

           todo.done = !todo.done;
        }
        localStorage.setItem('immersion_todos', JSON.stringify(savedTodos));
        renderTodos();
      };
      list.appendChild(li);
    });
  };

  input.addEventListener('keydown', (e) => {

    if (e.key === 'Enter' && !e.isComposing && input.value.trim()) {
      savedTodos.push({ text: input.value, done: false });
      localStorage.setItem('immersion_todos', JSON.stringify(savedTodos));
      input.value = '';
      renderTodos();
    }
  });

  renderTodos();
}
function setupCalculator() {
  const grid = document.getElementById('calc-keys');
  const display = document.getElementById('calc-display');
  if (!grid || !display) return;


  grid.innerHTML = '';

  const keys = ['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'];
  
  keys.forEach(key => {
    const btn = document.createElement('button');
    btn.className = 'calc-btn';
    btn.innerText = key;
    
    btn.onclick = () => {
      const current = display.innerText;
      
      if (key === 'C') {
        display.innerText = '0';
      } else if (key === '=') {
        try {

          let tokens = current.match(/(\d+(\.\d+)?|[\+\-\*\/])/g);
          
          if (!tokens) return;


          for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '*' || tokens[i] === '/') {
              const left = parseFloat(tokens[i-1]);
              const right = parseFloat(tokens[i+1]);
              const result = tokens[i] === '*' ? (left * right) : (left / right);
              

              tokens.splice(i-1, 3, result);
              i--; 
            }
          }

          for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '+' || tokens[i] === '-') {
              const left = parseFloat(tokens[i-1]);
              const right = parseFloat(tokens[i+1]);
              const result = tokens[i] === '+' ? (left + right) : (left - right);
              
              tokens.splice(i-1, 3, result);
              i--;
            }
          }

          display.innerText = tokens[0];

        } catch(e) {
          display.innerText = 'Error';
        }
      } else {

        if (current === '0' || current === 'Error') {

            if (['+','-','*','/'].includes(key)) {
                display.innerText = (current === 'Error' ? '0' : current) + key;
            } else {
                display.innerText = key;
            }
        } else {
            display.innerText += key;
        }
      }
    };
    grid.appendChild(btn);
  });
}



function setupTimer() {
  const card = document.getElementById('card-timer');
  if (!card) return;

  const minInput = document.getElementById('t-min');
  const secInput = document.getElementById('t-sec');
  const displayMode = document.getElementById('timer-running-mode');
  const inputMode = document.getElementById('timer-input-mode');
  const timeDisplay = document.getElementById('t-display');
  const toggleBtn = document.getElementById('btn-timer-toggle');
  const resetBtn = document.getElementById('btn-timer-reset');
  const progressBar = document.getElementById('timer-progress-bar');

  let timerInterval = null;
  let alarmLoopInterval = null;
  let totalSeconds = 0;
  let remainingSeconds = 0;
  let isRunning = false;
  let isRinging = false;

  const pad = (n) => String(n).padStart(2, '0');


  const playOneSequence = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine'; 
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(10.0, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    beep(880, now, 0.1);
    beep(880, now + 0.2, 0.1);
    beep(1760, now + 0.4, 0.6);
  };

  const startAlarm = () => {
    isRinging = true;
    
    toggleBtn.innerText = "Stop Alarm";
    toggleBtn.classList.add('active-state');
    card.style.boxShadow = '0 0 50px rgba(255, 69, 58, 0.6)';

    playOneSequence();

    alarmLoopInterval = setInterval(() => {
      playOneSequence();
      
      card.animate([
        { boxShadow: '0 0 0 rgba(255,0,0,0)' },
        { boxShadow: '0 0 50px rgba(255, 69, 58, 0.8)' },
        { boxShadow: '0 0 0 rgba(255,0,0,0)' }
      ], { duration: 500 });
      
    }, 2000);
  };

  const stopAlarm = () => {
    if (alarmLoopInterval) {
      clearInterval(alarmLoopInterval);
      alarmLoopInterval = null;
    }
    isRinging = false;
    card.style.boxShadow = '';
    toggleBtn.innerText = "Start";
    toggleBtn.classList.remove('active-state');
    resetTimer();
  };

  const updateDisplay = () => {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    timeDisplay.innerText = `${pad(m)}:${pad(s)}`;
    
    if (totalSeconds > 0) {
      const percent = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
      progressBar.style.width = `${percent}%`;
    }
  };

  const toggleTimer = () => {
    if (isRinging) {
      stopAlarm();
      return;
    }

    if (isRunning) {
      clearInterval(timerInterval);
      isRunning = false;
      toggleBtn.innerText = "Resume";
      toggleBtn.classList.remove('active-state');
    } else {
      if (remainingSeconds === 0) {
        const m = parseInt(minInput.value) || 0;
        const s = parseInt(secInput.value) || 0;
        if (m === 0 && s === 0) return;

        totalSeconds = m * 60 + s;
        remainingSeconds = totalSeconds;
      }

      inputMode.style.display = 'none';
      displayMode.style.display = 'block';
      toggleBtn.innerText = "Pause";
      toggleBtn.classList.add('active-state');
      
      isRunning = true;
      updateDisplay();

      timerInterval = setInterval(() => {
        remainingSeconds--;
        updateDisplay();

        if (remainingSeconds <= 0) {
          clearInterval(timerInterval);
          isRunning = false;
          startAlarm();
        }
      }, 1000);
    }
  };

  const resetTimer = () => {
    if (isRinging) {
        stopAlarm();
        return; 
    }

    clearInterval(timerInterval);
    isRunning = false;
    remainingSeconds = 0;
    totalSeconds = 0;
    
    toggleBtn.innerText = "Start";
    toggleBtn.classList.remove('active-state');
    
    displayMode.style.display = 'none';
    inputMode.style.display = 'flex';
    progressBar.style.width = '0%';
    card.style.boxShadow = '';
  };

  toggleBtn.onclick = toggleTimer;
  resetBtn.onclick = resetTimer;
}

async function requestRssPermission(url) {
  if (!url) return true; 

  try {

    const urlObj = new URL(url);
    const origin = `${urlObj.protocol}//${urlObj.hostname}/*`;

    const granted = await new Promise(resolve => {
      chrome.permissions.request({
        origins: [origin]
      }, (result) => {

        resolve(result);
      });
    });

    if (granted) {
      console.log("権限が許可されました:", origin);
      return true;
    } else {
      alert("RSSを取得するには、表示されるポップアップで「許可」を選択してください。");
      return false;
    }
  } catch (e) {
    console.error("URLの形式が正しくありません", e);
    return false; 
  }
}


const DB_NAME = 'ImmersionDB';
const STORE_NAME = 'wallpapers';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e);
  });
}


async function saveImageToDB(file, key = 'custom_bg') {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(file, key);
    

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(false);
  });
}

async function getImageFromDB(key = 'custom_bg') {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => {
      if (request.result) {
        resolve(URL.createObjectURL(request.result));
      } else {
        resolve(null);
      }
    };
    request.onerror = () => resolve(null);
  });
}

async function getBlobFromDB(key = 'custom_bg') {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

async function deleteImageFromDB(key = 'custom_bg') {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => resolve();
  });
}

function setupVideoIdleHandler() {
  let idleTime = 0;
  const idleLimit = 60; 
  const videoEl = document.getElementById('bg-video');

  const resetIdle = () => {
    idleTime = 0;
    const v = document.getElementById('bg-video');

    if (v && v.paused && document.body.classList.contains('has-video')) {
      v.play().catch(() => {}); 

    }
  };


  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => 
    document.addEventListener(evt, resetIdle, {passive: true})
  );


  setInterval(() => {
    idleTime++;
    if (idleTime >= idleLimit) {
      const v = document.getElementById('bg-video');

      if (v && !v.paused && document.body.classList.contains('has-video')) {
        v.pause();
      }
    }
  }, 1000);
}
function setupBackupSystem() {
  const exportBtn = document.getElementById('btn-export-settings');
  const importTrigger = document.getElementById('btn-import-settings-trigger');
  const fileInput = document.getElementById('file-import-settings');

  if (!exportBtn || !importTrigger || !fileInput) return;


  exportBtn.onclick = () => {
    const backupData = {};

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('immersion_') || key.startsWith('event_')) {
        backupData[key] = localStorage.getItem(key);
      }
    });

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `immersion_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  importTrigger.onclick = () => {
    if (confirm(t('import_confirm'))) {
      fileInput.click();
    }
  };


  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data || typeof data !== 'object') throw new Error('Invalid JSON');


        Object.keys(data).forEach(key => {
            if (key.startsWith('immersion_') || key.startsWith('event_')) {
                localStorage.setItem(key, data[key]);
            }
        });
        alert(t('import_success'));
        location.reload(); 
      } catch (err) {
        console.error(err);
        alert(t('import_error'));
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  };
}



function setupProfileSystem() {
  const saveBtn = document.getElementById('btn-save-profile');
  const nameInput = document.getElementById('new-profile-name');
  const listContainer = document.getElementById('saved-profiles-list');

  if (!saveBtn || !nameInput || !listContainer) return;

  const loadProfiles = () => JSON.parse(localStorage.getItem('immersion_saved_profiles')) || [];


  const render = async () => {
    listContainer.innerHTML = '';
    const profiles = loadProfiles();

    if (profiles.length === 0) {
        listContainer.style.display = 'block';
        listContainer.innerHTML = `<div style="opacity:0.4; font-size:0.8rem; text-align:center; padding:20px;">(保存された設定はありません)</div>`;
        return;
    }
    
    listContainer.style.display = 'grid';

    for (let i = 0; i < profiles.length; i++) {
        const p = profiles[i];
        const card = document.createElement('div');
        card.className = 'profile-card';
        
        let bgStyle = `background-color: #333;`;
        if (p.prefs && p.prefs.idleImgUrl && p.prefs.idleImgUrl.startsWith('http')) {
            bgStyle = `background-image: url('${p.prefs.idleImgUrl}');`;
        } else if (p.bgKey) {
            const blobUrl = await getImageFromDB(p.bgKey); 
            if (blobUrl) bgStyle = `background-image: url('${blobUrl}');`;
        } else if (p.prefs && p.prefs.accent) {
            bgStyle = `background-color: ${p.prefs.accent};`;
        }
        
        card.style.cssText = bgStyle;
        card.innerHTML = `
            <div class="profile-del-btn">×</div>
            <div class="profile-name-tag">${p.name}</div>
        `;
        

        card.onclick = async (e) => {
            if (e.target.classList.contains('profile-del-btn')) return;
            if(confirm(t('profile_confirm_load'))) {
                card.style.opacity = '0.5';
                document.body.style.cursor = 'wait';

                try {

                    if(p.prefs) localStorage.setItem('immersion_prefs', JSON.stringify(p.prefs));
                    if(p.dock) localStorage.setItem('immersion_dock_items', JSON.stringify(p.dock));
                    if(p.apps) localStorage.setItem('immersion_app_order', JSON.stringify(p.apps));
                    if(p.todos) localStorage.setItem('immersion_todos', JSON.stringify(p.todos));
                    if (p.memos) localStorage.setItem('immersion_memos', JSON.stringify(p.memos));
                    if (p.activeMemoId) localStorage.setItem('immersion_active_memo_id', p.activeMemoId);
                    localStorage.setItem('immersion_memo', p.memo || (p.memos && p.activeMemoId ? (p.memos.find(x => x && x.id === p.activeMemoId)?.text || '') : ''));
                    localStorage.setItem('immersion_city', p.city || '');
                    

                    if (p.bgKey) {
                        const savedBlob = await getBlobFromDB(p.bgKey);
                        if (savedBlob) {
                            await saveImageToDB(savedBlob, 'custom_bg');
                        } else {
                            await deleteImageFromDB('custom_bg');
                        }
                    } else {
   
                        await deleteImageFromDB('custom_bg');
                    }
                    

                    location.reload();
                    
                } catch(err) {
                    console.error(err);
                    alert("エラー: 設定を読み込めませんでした");
                    document.body.style.cursor = 'default';
                    card.style.opacity = '1';
                }
            }
        };


        card.querySelector('.profile-del-btn').onclick = async (e) => {
            e.stopPropagation();
            if(confirm(t('profile_confirm_delete'))) {
                if (p.bgKey) await deleteImageFromDB(p.bgKey);
                profiles.splice(i, 1);
                localStorage.setItem('immersion_saved_profiles', JSON.stringify(profiles));
                render();
            }
        };

        listContainer.appendChild(card);
    }
  };


  saveBtn.onclick = async () => {
    const name = nameInput.value.trim();
    if(!name) { alert("名前を入力してください"); return; }
    
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;
    
    try {
        const profiles = loadProfiles();
        

        const currentBlob = await getBlobFromDB('custom_bg');
        let savedBgKey = null;
        
        if (currentBlob) {
            savedBgKey = `profile_bg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await saveImageToDB(currentBlob, savedBgKey);
        }

        const data = {
            name: name,
            bgKey: savedBgKey,
            prefs: JSON.parse(localStorage.getItem('immersion_prefs')),
            dock: JSON.parse(localStorage.getItem('immersion_dock_items')),
            apps: JSON.parse(localStorage.getItem('immersion_app_order')),
            todos: JSON.parse(localStorage.getItem('immersion_todos')),
            memo: localStorage.getItem('immersion_memo') || '',
            memos: (() => { try { return JSON.parse(localStorage.getItem('immersion_memos')) || []; } catch { return []; } })(),
            activeMemoId: localStorage.getItem('immersion_active_memo_id') || '',
            city: localStorage.getItem('immersion_city') || ''
        };
        
        profiles.push(data);
        localStorage.setItem('immersion_saved_profiles', JSON.stringify(profiles));
        
        nameInput.value = '';
        render();
        
    } catch (e) {
        console.error(e);
        alert("保存エラーが発生しました");
    } finally {
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
  };

  render();
}



function setupGoogleLens() {
  const searchWrapper = document.querySelector('.search-wrapper');
  if (!searchWrapper) return;


  const oldBtn = document.getElementById('google-lens-btn');
  if (oldBtn) oldBtn.remove();


  const btn = document.createElement('div');
  btn.id = 'google-lens-btn';
  btn.title = 'Search with Google Lens';
  

  btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/><path d="M12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';


  btn.onclick = () => {
    window.location.href = "https://lens.google.com/";
  };


  searchWrapper.appendChild(btn);
}
