let burnInInterval = null;
let currentEventKey = null;
let calendarDisplayDate = new Date();

const defaultSettings = {
  accent: '#50E3C2',
  clockFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  clockColor: '',
  clockWeight: '',
  bgBrightness: '0.6',
  bgOpacity: '1.0',
  glassOpacity: '0.55',
  clockSize: '10',
  idleImgUrl: '',
  cntTitle: 'イベント',
  cntDate: '',
  burnIn: false,
  userName: 'User',
  showProfileSwitcher: false,
  showSeconds: false,
  showQuote: true,
  showMemo: true,
  showWeather: true,
  showNews: true,
  newsUrl: 'https://news.yahoo.co.jp/rss/topics/it.xml',
  cardTilt: false,
  showCountdown: true,
  showMusic: true,
  showCalendar: true,
  mediaYT: true,
  mediaYTMusic: true,
  showLyrics: true,
  mediaSpotify: true,
  mediaBackground: true,
  showZenMode: true,
  showAmbient: false,
  ambientIdleStart: '0',
  ambientSky: true,
  ambientCurve: true,
  ambientWeather: true,
  ambientSchedule: true,
  ambientMusic: true,
  ambientGreeting: true,
  ambientWakeLock: true,
  ambientFullscreen: true,
  ambientHideCursor: true,
  ambientBurnIn: true,
  ambientMotion: 'auto',
  ambientNight: true,
  ambientNightStart: '22',
  ambientNightEnd: '5',
  ambientNightColor: 'amber',
  ambientNightBrightness: '65',
  themeMode: 'glass',
  language: 'auto',
  bgBlur: '50',
  calendarUrls: [],
  use12hFormat: false,
  module1: 'weather',
  module2: 'news',
  module3: 'countdown',
};

const MODULE_DEFS = {
  weather: {
    id: 'weather',
    html: `
      <div class="glass-card tilt-card module-card weather-card">
        <div class="aw-top-group">
          <div class="aw-left-block">
            <div class="aw-city change-city">City</div>
            <div class="aw-main-info">
              <div class="aw-temp w-temp">--°</div>
              <div class="aw-cond w-cond">--</div>
            </div>
          </div>
          <div class="aw-right-block">
            <div class="aw-icon w-icon"></div>
            <div class="aw-hl">H:<span class="w-high">--</span>° L:<span class="w-low">--</span>°</div>
          </div>
        </div>
        <div class="aw-forecast">
          <div class="fc-day fc-day-1"><div class="fc-name">--</div><div class="fc-icon"></div><div class="fc-temps"><span class="fc-high">--</span>° <span class="fc-low">--</span>°</div></div>
          <div class="fc-day fc-day-2"><div class="fc-name">--</div><div class="fc-icon"></div><div class="fc-temps"><span class="fc-high">--</span>° <span class="fc-low">--</span>°</div></div>
          <div class="fc-day fc-day-3"><div class="fc-name">--</div><div class="fc-icon"></div><div class="fc-temps"><span class="fc-high">--</span>° <span class="fc-low">--</span>°</div></div>
        </div>
      </div>
    `,
  },
  english: {
    id: 'english',
    html: `
      <div class="glass-card tilt-card module-card english-card" id="card-english">
        <div class="eng-header">
          <span class="label-std">WORD OF THE MOMENT</span>
          <button class="eng-reload-btn" title="Next Word">↻</button>
        </div>

        <div class="eng-content-wrapper">
          <div class="eng-loader" style="display:none;">Loading...</div>

          <div class="eng-main-view">
            <div class="eng-word-row">
              <div class="eng-word">Loading...</div>
            </div>
            <div class="eng-meta">
              <span class="eng-part"></span>
              <span class="eng-pronounce"></span>
            </div>
            <div class="eng-meaning"></div>
          </div>
        </div>

        <div class="eng-source">via Wiktionary</div>

        <div class="eng-bg-text">A</div>
      </div>
    `,
  },

  japanese: {
    id: 'japanese',
    html: `
      <div class="glass-card tilt-card module-card japanese-card" id="card-japanese">
        <div class="jp-header">
          <span class="label-std">今日の言葉</span>
          <button class="jp-reload-btn" title="次の言葉">↻</button>
        </div>

        <div class="jp-content-wrapper">
          <div class="jp-main-view">
            <div class="jp-word-container">
              <div class="jp-word">日々是好日</div>
            </div>

            <div class="jp-meaning-container">
              <div class="jp-yomi">ひびこれこうじつ</div>
              <div class="jp-meaning">来る日も来る日も、楽しく平和なよい日であること。</div>
            </div>
          </div>
        </div>
      </div>
    `,
  },

  year_progress: {
    id: 'year_progress',
    html: `
      <div class="glass-card tilt-card module-card particle-card" id="card-particle">
        <div class="label-std" style="justify-content: center; z-index: 10;"><span id="p-year-label">YEAR</span></div>

        <div class="particle-content">
          <div class="particle-days"><span class="p-days-val">--</span></div>
          <div class="p-days-unit">DAYS LEFT</div>
        </div>

        <canvas id="particle-canvas"></canvas>

        <div class="particle-footer">
          <div class="particle-percent">--%</div>
        </div>
      </div>
    `,
  },

  timer: {
    id: 'timer',
    html: `
      <div class="glass-card tilt-card module-card timer-card">
        <div class="label-std">TIMER</div>

        <div class="timer-display-container">
          <div class="timer-input-mode">
            <input type="number" class="timer-input t-min" placeholder="00" min="0" max="99">
            <span class="timer-colon">:</span>
            <input type="number" class="timer-input t-sec" placeholder="00" min="0" max="59">
          </div>
          <div class="timer-running-mode" style="display:none;">
            <span class="t-display">00:00</span>
          </div>
        </div>

        <div class="timer-controls">
          <button class="st-btn-small btn-timer-reset" style="background:rgba(255,255,255,0.1); color:#fff;">Reset</button>
          <button class="st-btn-small btn-timer-toggle">Start</button>
        </div>

        <div class="timer-progress-bar"></div>
      </div>
    `,
  },
  news: {
    id: 'news',
    html: `
      <div class="glass-card tilt-card module-card news-card-wrapper">
        <div class="label-std">NEWS</div>
        <div class="news-list-area" style="display:flex; flex-direction:column; gap:4px;">Loading...</div>
      </div>
    `,
  },
  countdown: {
    id: 'countdown',
    html: `
      <div class="glass-card tilt-card module-card countdown-card" style="justify-content:center; align-items:center; position:relative;">
        <input type="datetime-local" class="cnt-picker" style="position:absolute; bottom:10px; right:10px; width:1px; height:1px; opacity:0; pointer-events:none;">

        <div class="label-std cnt-label" style="width:100%; text-align:left; margin-bottom:0; cursor:pointer;">EVENT</div>
        <div class="cnt-main" style="cursor:pointer; width:100%;">
          <div class="cnt-days-wrapper">
            <span class="cnt-big cnt-days">--</span>
            <span class="cnt-unit">DAYS</span>
          </div>
          <div class="cnt-sub-wrapper">
             <span class="cnt-sub cnt-hms">--:--:--</span>
          </div>
        </div>
      </div>
    `,
  },
  todo: {
    id: 'todo',
    html: `
      <div class="glass-card tilt-card module-card todo-card">
        <div class="label-std">TODO LIST</div>
        <input type="text" class="st-input todo-input" placeholder="Add task..." style="margin-bottom:10px;">
        <ul class="todo-list" style="flex:1; overflow-y:auto; list-style:none; padding:0; margin:0;"></ul>
      </div>
    `,
  },
  calc: {
    id: 'calc',
    html: `
      <div class="glass-card tilt-card module-card calc-card">
        <div class="label-std">CALCULATOR</div>
        <div class="calc-display">0</div>
        <div class="calc-grid calc-keys"></div>
      </div>
    `,
  },
  earthquake: {
    id: 'earthquake',
    html: `
      <div class="glass-card tilt-card module-card eq-card" id="card-earthquake">
        <div class="label-std">EARTHQUAKE INFO</div>
        <div class="eq-status-icon">🌊</div>
        <div class="eq-main-wrapper">
          <div class="eq-shindo-label">最大震度</div>
          <div class="eq-shindo-value">--</div>
        </div>
        <div class="eq-details">
          <div class="eq-location">取得中...</div>
          <div class="eq-sub-info">
            <span class="eq-time">--:--</span>
            <span class="eq-mag">M-.--</span>
          </div>
        </div>
        <div class="eq-source">
          Data: 気象庁, <a href="https://www.p2pquake.net/" target="_blank" rel="noopener noreferrer">P2P地震情報</a>
        </div>
        </div>
    `,
  },

  currency: {
    id: 'currency',
    html: `
      <div class="glass-card tilt-card module-card currency-card" id="card-currency">
        <div class="label-std">USD/JPY RATE</div>
        <div class="curr-icon-bg">$</div>
        <div class="curr-main-wrapper">
          <div class="curr-row">
            <span class="curr-symbol">¥</span>
            <span class="curr-value">---.--</span>
          </div>
        </div>
        <div class="curr-footer">
          <span class="curr-update">Updating...</span>
        </div>
        <div class="eq-source">
          Rates By <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">ExchangeRate-API.com</a>
        </div>
        </div>
    `,
  },
  none: {
    id: 'none',
    html: '',
  },
};

let googleEventsCache = {};

function t(key, params = {}) {
  const translations = window.immersion_i18n || {};
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  let lang = prefs.language || 'auto';
  if (lang === 'auto') {
    const navLang = navigator.language.slice(0, 2);
    lang = navLang === 'ja' || navLang === 'ko' || navLang === 'zh' ? navLang : 'en';
  }
  const dict = translations[lang] || translations.en || {};
  const enDict = translations.en || {};
  let str = dict[key] || enDict[key] || key;
  Object.keys(params).forEach((k) => {
    str = str.replace(`{${k}}`, params[k]);
  });
  return str;
}

function buildRefractMap(w, h, opt) {
  opt = opt || {};
  const radius = opt.radius != null ? opt.radius : 28;
  const bezel = opt.bezel != null ? opt.bezel : 16;
  const ior = opt.ior != null ? opt.ior : 1.5;

  const mapScale = opt.mapScale != null ? opt.mapScale : 0.5;
  const W = Math.max(8, Math.round(w * mapScale)),
    H = Math.max(8, Math.round(h * mapScale));

  const mradius = radius * mapScale,
    mbezel = bezel * mapScale;
  const cvs = document.createElement('canvas');
  cvs.width = W;
  cvs.height = H;
  const ctx = cvs.getContext('2d');
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const hw = W / 2,
    hh = H / 2,
    r = Math.min(mradius, hw, hh);

  const sdf = (px, py) => {
    const qx = Math.abs(px - hw) - (hw - r);
    const qy = Math.abs(py - hh) - (hh - r);
    return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
  };

  const N = 128,
    prof = new Float32Array(N);
  let mx = 1e-6;
  const surf = (x) => Math.pow(1 - Math.pow(1 - x, 4), 0.25);
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1),
      e = 1e-3;
    const slope = (surf(Math.min(1, x + e)) - surf(Math.max(0, x - e))) / (2 * e);
    const t1 = Math.atan(slope);
    const t2 = Math.asin(Math.min(1, Math.sin(t1) / ior));
    prof[i] = Math.tan(t1 - t2);
    if (prof[i] > mx) mx = prof[i];
  }
  for (let i = 0; i < N; i++) prof[i] /= mx;
  const scale = opt.scale != null ? opt.scale : Math.min(bezel * 2.2, 46);
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const i = (py * W + px) * 4;
      let rx = 0,
        ry = 0;
      const dist = -sdf(px + 0.5, py + 0.5);
      if (dist >= 0 && dist < mbezel) {
        const mag = prof[Math.min(N - 1, Math.round((dist / mbezel) * (N - 1)))];
        const gx = sdf(px + 1.5, py + 0.5) - sdf(px - 0.5, py + 0.5);
        const gy = sdf(px + 0.5, py + 1.5) - sdf(px + 0.5, py - 0.5);
        const gl = Math.hypot(gx, gy) || 1;

        rx = -(gx / gl) * mag;
        ry = -(gy / gl) * mag;
      }
      d[i] = Math.max(0, Math.min(255, 128 + rx * 127));
      d[i + 1] = Math.max(0, Math.min(255, 128 + ry * 127));
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const octx = out.getContext('2d');
  octx.filter = 'blur(1px)';
  octx.drawImage(cvs, 0, 0);
  return { url: out.toDataURL(), scale: scale };
}

const __lgFilters = {};
let __lgFid = 0;
function lgFilterForSize(w, h, radius) {
  const W = Math.max(8, Math.round(w)),
    H = Math.max(8, Math.round(h));
  const key = Math.round(W / 6) * 6 + 'x' + Math.round(H / 6) * 6 + 'r' + radius;
  if (__lgFilters[key]) return __lgFilters[key];
  const defs = document.querySelector('#lg-svg defs');
  if (!defs) return 'none';

  let res;

  const cacheKey = 'lgmap_v1_' + key;
  let cached = null;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}
  if (cached && cached.u) {
    res = { url: cached.u, scale: cached.s };
  } else {
    try {
      res = buildRefractMap(W, H, { radius: radius, bezel: 16 });
    } catch (e) {
      return 'none';
    }
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ u: res.url, s: res.scale }));
    } catch (e) {
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('lgmap_'))
          .forEach((k) => localStorage.removeItem(k));
      } catch (e2) {}
    }
  }
  const SVGNS = 'http://www.w3.org/2000/svg';
  const id = 'lg-f' + __lgFid++;
  const f = document.createElementNS(SVGNS, 'filter');
  f.setAttribute('id', id);

  f.setAttribute('filterUnits', 'userSpaceOnUse');
  f.setAttribute('x', '0');
  f.setAttribute('y', '0');
  f.setAttribute('width', W);
  f.setAttribute('height', H);
  f.setAttribute('color-interpolation-filters', 'sRGB');
  const fe = document.createElementNS(SVGNS, 'feImage');
  fe.setAttribute('x', '0');
  fe.setAttribute('y', '0');
  fe.setAttribute('width', W);
  fe.setAttribute('height', H);
  fe.setAttribute('preserveAspectRatio', 'none');
  fe.setAttribute('result', 'm');
  fe.setAttributeNS('http://www.w3.org/1999/xlink', 'href', res.url);
  fe.setAttribute('href', res.url);
  const dm = document.createElementNS(SVGNS, 'feDisplacementMap');
  dm.setAttribute('in', 'SourceGraphic');
  dm.setAttribute('in2', 'm');
  dm.setAttribute('scale', res.scale);
  dm.setAttribute('xChannelSelector', 'R');
  dm.setAttribute('yChannelSelector', 'G');
  const gb = document.createElementNS(SVGNS, 'feGaussianBlur');
  gb.setAttribute('stdDeviation', '0.3');
  f.appendChild(fe);
  f.appendChild(dm);
  f.appendChild(gb);
  defs.appendChild(f);
  __lgFilters[key] = 'url(#' + id + ')';
  return __lgFilters[key];
}

const __lg = { iw: 0, ih: 0, wallKey: '', wired: false, alignQueued: false, revealed: false };

const __lgSizeMemo = new WeakMap();
const LG_SURFACE_SEL = '.glass-card, .dock-item, #search-input, #clock-time';

function lgCurrentWallUrl() {
  const bg = document.getElementById('bg-layer-original');
  if (!bg) return '';
  const bgImg = getComputedStyle(bg).backgroundImage;
  const m = bgImg && bgImg.match(/url\(["']?(.*?)["']?\)/);
  return m ? m[1] : '';
}

function lgLoadWallpaper(retry) {
  retry = retry || 0;
  if (!document.body.classList.contains('liquidglass-mode')) return;
  const url = lgCurrentWallUrl();
  if (!url || url === 'none') {
    document.body.classList.remove('lg-has-wall');
    if (retry < 8) setTimeout(() => lgLoadWallpaper(retry + 1), 350);
    return;
  }
  if (url === __lg.wallKey && __lg.iw) {
    alignLiquidGlass();
    return;
  }
  __lg.wallKey = url;
  document.documentElement.style.setProperty(
    '--lg-wall',
    'url("' + url.replace(/"/g, '\\"') + '")',
  );
  const img = new Image();
  img.onload = () => {
    __lg.iw = img.naturalWidth || 1;
    __lg.ih = img.naturalHeight || 1;
    document.body.classList.add('lg-has-wall');
    alignLiquidGlass();
  };
  img.onerror = () => {
    document.body.classList.remove('lg-has-wall');
  };
  img.src = url;
}

function lgGetScale() {
  const root = document.getElementById('immersion-root');
  const z = root && parseFloat(root.style.getPropertyValue('--ui-scale'));
  return z && z > 0 ? z : 1;
}

function alignLiquidGlass() {
  if (!document.body.classList.contains('liquidglass-mode') || !__lg.iw) return;
  const Z = lgGetScale();
  const vw = window.innerWidth / Z,
    vh = window.innerHeight / Z;
  const s = Math.max(vw / __lg.iw, vh / __lg.ih);
  const dw = __lg.iw * s,
    dh = __lg.ih * s;
  const ox = (vw - dw) / 2,
    oy = (vh - dh) / 2;
  document.documentElement.style.setProperty(
    '--lg-w-size',
    dw.toFixed(1) + 'px ' + dh.toFixed(1) + 'px',
  );
  let revealIdx = 0;
  document.querySelectorAll(LG_SURFACE_SEL).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    const lx = r.left / Z,
      ly = r.top / Z,
      lw = r.width / Z,
      lh = r.height / Z;
    el.style.setProperty('--lg-pos', (ox - lx).toFixed(1) + 'px ' + (oy - ly).toFixed(1) + 'px');

    if (el.matches('.glass-card, .dock-item')) {
      const dimKey = Math.round(lw / 6) * 6 + 'x' + Math.round(lh / 6) * 6;
      if (__lgSizeMemo.get(el) !== dimKey) {
        __lgSizeMemo.set(el, dimKey);
        const rad = Math.round(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 24);
        el.style.setProperty('--lg-disp', lgFilterForSize(lw, lh, rad));
      }

      if (!__lg.revealed) {
        el.style.setProperty('--lg-reveal-delay', (revealIdx * 0.05).toFixed(2) + 's');
        revealIdx++;
      }
    }
  });
  __lg.revealed = true;

  document.body.classList.add('lg-aligned');
}

function lgRequestAlign() {
  if (__lg.alignQueued) return;
  __lg.alignQueued = true;
  requestAnimationFrame(() => {
    __lg.alignQueued = false;
    alignLiquidGlass();
  });
}

const LG_REF_W = 1600,
  LG_REF_H = 1000,
  LG_MIN_SCALE = 0.45;
function applyUiScale() {
  const root = document.getElementById('immersion-root');
  if (!root) return;
  let z = Math.min(1, window.innerWidth / LG_REF_W, window.innerHeight / LG_REF_H);
  z = Math.max(LG_MIN_SCALE, z);
  root.style.setProperty('--ui-scale', z.toFixed(3));
  lgRequestAlign();
}

function setupLiquidGlass() {
  lgLoadWallpaper();
  lgRequestAlign();
  if (__lg.wired) return;
  __lg.wired = true;

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    document.body.classList.add('lg-resizing');
    lgRequestAlign();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document.body.classList.remove('lg-resizing');
      alignLiquidGlass();
    }, 160);
  });

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => lgRequestAlign());
    const observeAll = () =>
      document.querySelectorAll('.glass-card, .dock-item, #clock-time, .col').forEach((el) => {
        try {
          ro.observe(el);
        } catch (e) {}
      });
    observeAll();
    __lg.ro = ro;
    __lg.observeAll = observeAll;
  }

  document.addEventListener('click', lgRequestAlign, true);

  if ('MutationObserver' in window) {
    const bg = document.getElementById('bg-layer-original');
    if (bg) {
      const mo = new MutationObserver(() => {
        __lg.wallKey = '';
        lgLoadWallpaper();
      });
      mo.observe(bg, { attributes: true, attributeFilter: ['style', 'class'] });
      __lg.mo = mo;
    }
  }
}

const defaultWallpapers = [
  'wallpapers/bg1.webp',
  'wallpapers/bg2.webp',
  'wallpapers/bg3.webp',
  'wallpapers/bg4.webp',
  'wallpapers/bg5.webp',
].map((path) => chrome.runtime.getURL(path));

const defaultDockItems = [
  {
    type: 'folder',
    icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>',
    name: 'Social',
    items: [
      {
        icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>',
        url: 'https://www.youtube.com/',
      },
      {
        icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
        url: 'https://x.com/',
      },
    ],
  },

  {
    icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    url: 'https://mail.google.com/',
  },
  {
    icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>',
    url: 'https://www.google.com/maps',
  },
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

  document.body.style.zoom = '1';
  localStorage.removeItem('immersion_custom_zoom');
  const root = document.createElement('div');
  root.id = 'immersion-root';
  const city = localStorage.getItem('immersion_city') || 'Tokyo';
  const savedMemo = localStorage.getItem('immersion_memo') || '';

  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;

  const activeModules = [
    prefs.module1 || 'weather',
    prefs.module2 || 'news',
    prefs.module3 || 'countdown',
  ];

  let leftColumnHTML = '';

  activeModules.forEach((key) => {
    if (MODULE_DEFS[key]) {
      leftColumnHTML += MODULE_DEFS[key].html;
    }
  });

  const moduleOptionsHTML = getModuleOptionsHTML();
  const hourOptionsHTML = Array.from(
    { length: 24 },
    (_, i) => `<option value="${i}">${String(i).padStart(2, '0')}:00</option>`,
  ).join('');

  root.innerHTML = `
    <svg id="lg-svg" width="0" height="0" aria-hidden="true" style="position:absolute;width:0;height:0;pointer-events:none;overflow:hidden;">
      <defs></defs>
    </svg>
    <video id="bg-video" autoplay loop muted playsinline style="position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; object-fit: cover; z-index: -3; opacity: 0; transition: opacity 1s ease-in-out;"></video>
    <div id="bg-layer-original" class="bg-layer"></div>
    <div id="bg-layer-blurred" class="bg-layer"></div>

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
        <div class="dock-item tilt-card" id="zen-btn" title="${t('zen_mode_tooltip')}" style="font-size:0.8rem; font-weight:700; letter-spacing:1px;">ZEN</div>
        <div class="dock-item tilt-card" id="ambient-btn" title="${t('ambient_mode_tooltip')}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.4" y="4" width="19.2" height="13" rx="2.2"/><path d="M12 17v3.4M8.4 20.4h7.2"/></svg>
        </div>
        <div class="dock-item tilt-card" id="settings-btn" title="${t('settings_tooltip')}">
            <svg viewBox="0 0 24 24" class="icon-svg" style="width:24px; height:24px;"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        </div>
      </div>
    </div>

    <div class="col col-right">
      <div id="music-card-container" class="glass-card tilt-card music-idle">
        <div class="music-source-indicator" id="music-source-indicator"></div>
        <div class="music-panel">
          <div class="album-art-wrapper">
            <div class="album-art" id="album-art"></div>
            <div class="lyrics-overlay" id="lyrics-overlay">
              <div class="lyrics-text" id="lyrics-text"></div>
            </div>
            <div class="lyrics-toggle-btn" id="lyrics-toggle-btn" title="Lyrics">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L2 22l5.71-1.97A9.957 9.957 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.28 0-2.5-.27-3.61-.75l-2.43.84.84-2.43C6.27 16.5 6 15.28 6 14c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/><path d="M8 11h8v2H8zm0-3h8v2H8zm0 6h5v2H8z"/></svg>
            </div>
          </div>
          <div class="track-info-wrap"><span class="track-title" id="track-title">Title</span></div>
          <div class="track-artist" id="track-artist">Artist</div>
          <div class="controls">
             <div class="ctrl-btn" id="btn-prev"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M11.22 11.15 19.3 5.76c.72-.48 1.7.04 1.7.9v10.68c0 .86-.98 1.38-1.7.9l-8.08-5.39a1.01 1.01 0 0 1 0-1.7ZM2.22 11.15 10.3 5.76c.72-.48 1.7.04 1.7.9v10.68c0 .86-.98 1.38-1.7.9L2.22 12.85a1.01 1.01 0 0 1 0-1.7Z"/></svg></div>
             <div class="ctrl-btn play-btn" id="btn-play"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 5.224v13.552a1.5 1.5 0 0 0 2.296 1.272l10.842-6.776a1.5 1.5 0 0 0 0-2.544L9.296 3.952A1.5 1.5 0 0 0 7 5.224Z"/></svg></div>
             <div class="ctrl-btn" id="btn-next"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12.78 12.85 4.7 18.24c-.72.48-1.7-.04-1.7-.9V6.66c0-.86.98-1.38 1.7-.9l8.08 5.39a1.01 1.01 0 0 1 0 1.7ZM21.78 12.85l-8.08 5.39c-.72.48-1.7-.04-1.7-.9V6.66c0-.86.98-1.38 1.7-.9l8.08 5.39a1.01 1.01 0 0 1 0 1.7Z"/></svg></div>
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
          <button class="st-tab-btn" data-tab="tab-widgets">
             <svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
            ${t('settings_widgets')}
          </button>
          <button class="st-tab-btn" data-tab="tab-dock">
             <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
            ${t('settings_dock')}
          </button>
          <button class="st-tab-btn" data-tab="tab-media">
             <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            ${t('settings_media')}
          </button>
          <button class="st-tab-btn" data-tab="tab-ambient">
             <svg viewBox="0 0 24 24"><path fill="currentColor" d="M21 3H3c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H3V5h18v11z"/></svg>
            ${t('settings_ambient')}
          </button>
          <button class="st-tab-btn" data-tab="tab-data">
             <svg viewBox="0 0 24 24"><path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
            ${t('settings_data')}
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
              <div class="st-section-sub">${t('basic_sub')}</div>

              <div class="st-row column-layout">
                <span>${t('username_label')}</span>
                <div class="input-with-btn">
                  <input type="text" id="set-user-name" placeholder="${t('username_placeholder')}" class="st-input">
                </div>
                <div class="st-desc">${t('desc_username')}</div>
              </div>

              <div class="st-row column-layout">
                <span>${t('language_label')}</span>
                <select id="set-language" class="st-select">
                  <option value="auto">Auto (System)</option>
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                  <option value="ko">한국어</option>
                  <option value="zh_cn">简体中文</option>
                </select>
                <div class="st-desc">${t('desc_language')}</div>
              </div>

              <div class="st-row column-layout">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span>${t('greeting_msg')}</span>
                  <label class="toggle-switch"><input type="checkbox" id="set-show-quote"><span class="slider"></span></label>
                </div>
                <div class="st-desc">${t('desc_greeting')}</div>
              </div>

              <div class="st-row column-layout">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span>${t('memo_display_label')}</span>
                  <label class="toggle-switch"><input type="checkbox" id="set-show-memo"><span class="slider"></span></label>
                </div>
                <div class="st-desc">${t('desc_memo')}</div>
              </div>

              <div class="st-row column-layout">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span>${t('zen_mode_btn')}</span>
                  <label class="toggle-switch"><input type="checkbox" id="set-show-zen"><span class="slider"></span></label>
                </div>
                <div class="st-desc">${t('desc_zen')}</div>
              </div>
            </div>

            <div id="tab-widgets" class="st-section">
              <div class="st-section-sub">${t('widgets_sub')}</div>

              <div class="st-group-title">${t('module_group')}</div>
              <div class="st-desc" style="margin:-8px 0 12px;">${t('module_slot_desc')}</div>

              <div class="st-row">
                <span>${t('module_slot_1')}</span>
                <select id="set-module-1" class="st-select">${moduleOptionsHTML}
                </select>
              </div>
              <div class="st-row">
                <span>${t('module_slot_2')}</span>
                <select id="set-module-2" class="st-select">${moduleOptionsHTML}
                </select>
              </div>
              <div class="st-row">
                <span>${t('module_slot_3')}</span>
                <select id="set-module-3" class="st-select">${moduleOptionsHTML}
                </select>
              </div>

              <div class="st-group-title" style="margin-top:22px;">${t('widget_detail_group')}</div>

              <div class="st-row column-layout">
                <span>${t('weather_city_label')}</span>
                <div class="input-with-btn">
                  <input type="text" id="set-weather-city" placeholder="Tokyo" class="st-input">
                  <button id="btn-apply-city" class="st-btn-small">${t('update_btn')}</button>
                </div>
                <div class="st-desc">${t('desc_weather_city')}</div>
              </div>

              <div class="st-row column-layout">
                <span>${t('rss_url_label')}</span>
                <input type="text" id="set-news-url" placeholder="https://news.yahoo.co.jp/rss/topics/it.xml" class="st-input">
                <div class="st-desc">${t('desc_news_url')}</div>
              </div>

              <div class="st-row column-layout">
                <span>${t('countdown_target')}</span>
                <input type="text" id="set-cnt-title" placeholder="${t('event_name_placeholder')}" class="st-input" style="margin-bottom:10px;">
                <div class="input-with-btn">
                  <input type="datetime-local" id="set-cnt-date" class="st-input">
                  <button id="btn-apply-cnt" class="st-btn-small">${t('update_btn')}</button>
                </div>
                <div class="st-desc">${t('desc_countdown')}</div>
              </div>

              <div class="st-row column-layout">
                <span>${t('calendar_urls_label')}</span>
                <div id="calendar-settings-list"></div>
                <button id="add-calendar-btn" class="st-btn" style="margin-top:5px; width:100%;">${t('add_calendar_btn')}</button>
                <div class="st-desc">${t('desc_calendar')}</div>
                <div class="st-desc" style="margin-top:6px;">
                  Google: 設定 > 統合 > iCal形式の非公開URL<br>
                  Apple: iCloudカレンダー > 共有 > 公開カレンダー > リンクをコピー
                </div>
              </div>
            </div>

            <div id="tab-data" class="st-section">
              <div class="st-section-sub">${t('data_sub')}</div>

              <div class="st-group-title">${t('profile_list_group')}</div>
              <div class="st-desc" style="margin:-8px 0 12px;">${t('desc_profiles')}</div>

              <div class="st-row">
                <div class="input-with-btn">
                  <input type="text" id="new-profile-name" placeholder="${t('profile_name_input')}" class="st-input">
                  <button id="btn-save-profile" class="st-btn-small">${t('btn_save_profile')}</button>
                </div>
              </div>

              <div id="saved-profiles-list" class="profile-grid"></div>

              <div class="st-row column-layout" style="margin-top:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span>${t('show_profile_switcher')}</span>
                  <label class="toggle-switch"><input type="checkbox" id="set-show-profile-switcher"><span class="slider"></span></label>
                </div>
              </div>

              <div class="st-group-title" style="margin-top:22px;">${t('backup_group')}</div>
              <div class="st-desc" style="margin:-8px 0 12px;">${t('backup_desc')}</div>
              <div class="st-row" style="justify-content: flex-start; gap: 10px;">
                <button id="btn-export-settings" class="st-btn" style="flex:1;">
                  ${t('btn_export')}
                </button>
                <button id="btn-import-settings-trigger" class="st-btn" style="flex:1;">
                  ${t('btn_import')}
                </button>
                <input type="file" id="file-import-settings" accept=".json" style="display: none;">
              </div>

              <div class="st-group-title" style="margin-top:22px;">${t('reset_group')}</div>
              <div class="st-desc" style="margin:-8px 0 12px;">${t('reset_desc')}</div>
              <div class="st-row" style="justify-content: flex-start;">
                <button id="btn-reset-all" class="st-btn danger-btn" style="flex:1;">
                  ${t('btn_reset_all')}
                </button>
              </div>
            </div>

           <div id="tab-appearance" class="st-section">
              <div class="st-section-sub">${t('appearance_sub')}</div>

              <div class="st-group-title">${t('theme_group')}</div>
              <div class="st-row column-layout">
                <span>${t('theme_mode_label')}</span>
                <select id="set-theme-mode" class="st-select">
                  <option value="glass">${t('theme_glass')}</option>
                  <option value="liquidglass">${t('theme_liquidglass')}</option>
                  <option value="yarn">${t('theme_yarn')}</option>
                  <option value="terminal">${t('theme_terminal')}</option>
                  <option value="retro">${t('theme_retro')}</option>
                  <option value="lite">${t('theme_lite')}</option>
                  <option value="mono">${t('theme_mono')}</option>
                </select>
                <div class="st-desc">${t('desc_theme')}</div>
              </div>
              <div class="st-row"><span>${t('accent_color')}</span><input type="color" id="set-accent" class="st-color"></div>

              <div class="st-group-title" style="margin-top:22px;">${t('wallpaper_group')}</div>
              <div class="st-row column-layout">
                <span>${t('custom_wallpaper_url')}</span>
                <div class="input-with-btn">
                  <input type="text" id="set-img" placeholder="https://..." class="st-input">
                  <button id="btn-apply-img" class="st-btn-small">${t('apply_btn')}</button>
                </div>
              </div>
              <div class="st-row column-layout" style="margin-top: 10px;">
                <span>${t('wallpaper_upload_label')}</span>
                <div style="display:flex; gap:10px; width:100%;">
                    <label class="st-btn" style="flex:1; text-align:center; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                        <svg viewBox="0 0 24 24" style="width:18px; height:18px; fill:currentColor; flex:0 0 auto;"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                        ${t('select_file_btn')}
                        <input type="file" id="set-local-img-file" accept="image/*,video/*" style="display:none;">
                    </label>
                    <button id="btn-reset-local-img" class="st-btn danger-btn" style="flex:0 0 auto;">${t('wallpaper_reset_btn')}</button>
                </div>
                <div id="local-img-status" style="font-size:0.75rem; opacity:0.6; margin-top:4px; height:1.2em;"></div>
              </div>

              <div class="st-group-title" style="margin-top:22px;">${t('clock_group')}</div>
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
                  <option value="'Antonio', sans-serif">Antonio (iOS Style)</option>
                  <option value="'Bebas Neue', sans-serif">Bebas Neue (Bold)</option>
                  <option value="'Orbitron', sans-serif">Orbitron (Tech/Sci-Fi)</option>
                  <option value="'Rajdhani', sans-serif">Rajdhani (Modern)</option>
                  <option value="'Audiowide', sans-serif">Audiowide (Retro Tech)</option>
                  <option value="'Exo 2', sans-serif">Exo 2 (Futuristic)</option>
                  <option value="'Saira', sans-serif">Saira (Clean)</option>
                  <option value="'Righteous', sans-serif">Righteous (Bold Curve)</option>
                  <option value="'Monoton', sans-serif">Monoton (Neon)</option>
                  <option value="'Russo One', sans-serif">Russo One (Strong)</option>
                  <option value="'Bungee', sans-serif">Bungee (Playful)</option>
                  <option value="'Fredoka One', sans-serif">Fredoka One (Round)</option>
                  <option value="'Ubuntu', sans-serif">Ubuntu (Friendly)</option>
                  <option value="'Chakra Petch', sans-serif">Chakra Petch (Thai Tech)</option>
                  <option value="'Teko', sans-serif">Teko (Condensed)</option>
                  <option value="'Shippori Mincho', serif">${t('font_mincho')}</option>
                  <option value="'JetBrains Mono', monospace">${t('font_mono')}</option>
                  <option value="custom">カスタムフォント (Custom Font)</option>
                </select>
              </div>
              <div class="st-row column-layout" id="custom-font-row" style="display:none;">
                <span>${t('custom_font_label')}</span>
                <input type="text" id="set-custom-font" placeholder="例: 'Poppins', sans-serif" class="st-input">
                <div class="st-desc">${t('custom_font_desc')}</div>
              </div>
              <div class="st-row column-layout">
                <span>${t('clock_color_label')}</span>
                <div style="display:flex; gap:10px; width:100%;">
                  <input type="color" id="set-clock-color" class="st-color" style="flex:1; height:38px; cursor:pointer;">
                  <button id="btn-reset-clock-color" class="st-btn-small">${t('color_reset_btn')}</button>
                </div>
              </div>
              <div class="st-row"><span>${t('size_label')}</span><input type="range" id="set-size" min="4" max="20" step="0.5" class="st-range"></div>
              <div class="st-row"><span>${t('weight_label')}</span><input type="range" id="set-clock-weight" min="100" max="900" step="100" class="st-range"></div>

              <details class="st-advanced">
                <summary>${t('advanced_toggle')}</summary>
                <div class="st-desc" style="margin:6px 0 14px;">${t('desc_advanced')}</div>
                <div class="st-row"><span>${t('bg_brightness')}</span><input type="range" id="set-bright" min="0.1" max="1.0" step="0.1" class="st-range"></div>
                <div class="st-row"><span>${t('bg_blur')}</span><input type="range" id="set-blur" min="0" max="100" step="1" class="st-range"></div>
                <div class="st-row"><span>${t('bg_opacity')}</span><input type="range" id="set-opacity" min="0" max="1.0" step="0.1" class="st-range"></div>
                <div class="st-row"><span>${t('glass_opacity')}</span><input type="range" id="set-glass-opacity" min="0" max="0.9" step="0.05" class="st-range"></div>
                <div class="st-row column-layout">
                  <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <span>${t('burn_in_protection')}</span>
                    <label class="toggle-switch"><input type="checkbox" id="set-burnin"><span class="slider"></span></label>
                  </div>
                  <div class="st-desc">${t('desc_burnin')}</div>
                </div>
                <div class="st-row column-layout">
                  <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <span>${t('card_tilt')}</span>
                    <label class="toggle-switch"><input type="checkbox" id="set-card-tilt"><span class="slider"></span></label>
                  </div>
                  <div class="st-desc">${t('desc_card_tilt')}</div>
                </div>
              </details>
            </div>

            <div id="tab-media" class="st-section">
              <div class="st-section-sub">${t('media_sub')}</div>
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

            <div id="tab-ambient" class="st-section">
              <div class="st-section-sub">${t('ambient_sub')}</div>

              <div class="st-group-title">${t('amb_group_behavior')}</div>

              <div class="st-row column-layout">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span>${t('ambient_mode_btn')}</span>
                  <label class="toggle-switch"><input type="checkbox" id="set-show-ambient"><span class="slider"></span></label>
                </div>
                <div class="st-desc">${t('desc_ambient')}</div>
              </div>

              <div class="st-row column-layout">
                <span>${t('amb_idle')}</span>
                <select id="set-amb-idle" class="st-select" style="width:100%; margin-top:8px;">
                  <option value="0">${t('amb_idle_off')}</option>
                  <option value="1">${t('amb_idle_min', { n: 1 })}</option>
                  <option value="3">${t('amb_idle_min', { n: 3 })}</option>
                  <option value="5">${t('amb_idle_min', { n: 5 })}</option>
                  <option value="10">${t('amb_idle_min', { n: 10 })}</option>
                  <option value="30">${t('amb_idle_min', { n: 30 })}</option>
                </select>
                <div class="st-desc" style="margin-top:8px;">${t('amb_idle_desc')}</div>
              </div>

              <div class="st-group-title" style="margin-top:22px;">${t('amb_group_shows')}</div>
              <div class="st-desc" style="margin:-8px 0 12px;">${t('amb_shows_desc')}</div>
              <div class="st-row column-layout">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span>${t('amb_show_sky')}</span>
                  <label class="toggle-switch"><input type="checkbox" id="set-amb-sky"><span class="slider"></span></label>
                </div>
                <div class="st-desc">${t('amb_show_sky_desc')}</div>
              </div>
              <div class="st-row"><span>${t('amb_show_weather')}</span><label class="toggle-switch"><input type="checkbox" id="set-amb-weather"><span class="slider"></span></label></div>
              <div class="st-row"><span>${t('amb_show_sched')}</span><label class="toggle-switch"><input type="checkbox" id="set-amb-sched"><span class="slider"></span></label></div>
              <div class="st-row column-layout">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span>${t('amb_show_ridge')}</span>
                  <label class="toggle-switch"><input type="checkbox" id="set-amb-curve"><span class="slider"></span></label>
                </div>
                <div class="st-desc">${t('amb_show_ridge_desc')}</div>
              </div>
              <div class="st-row column-layout">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span>${t('amb_show_music')}</span>
                  <label class="toggle-switch"><input type="checkbox" id="set-amb-music"><span class="slider"></span></label>
                </div>
                <div class="st-desc">${t('amb_show_music_desc')}</div>
              </div>
              <div class="st-row"><span>${t('amb_show_greet')}</span><label class="toggle-switch"><input type="checkbox" id="set-amb-greet"><span class="slider"></span></label></div>

              <div class="st-group-title" style="margin-top:22px;">${t('amb_group_screen')}</div>
              <div class="st-row column-layout">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span>${t('amb_wakelock')}</span>
                  <label class="toggle-switch"><input type="checkbox" id="set-amb-wakelock"><span class="slider"></span></label>
                </div>
                <div class="st-desc">${t('amb_wakelock_desc')}</div>
              </div>
              <div class="st-row column-layout">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span>${t('amb_fullscreen')}</span>
                  <label class="toggle-switch"><input type="checkbox" id="set-amb-fullscreen"><span class="slider"></span></label>
                </div>
                <div class="st-desc">${t('amb_fullscreen_desc')}</div>
              </div>
              <div class="st-row"><span>${t('amb_hide_cursor')}</span><label class="toggle-switch"><input type="checkbox" id="set-amb-cursor"><span class="slider"></span></label></div>
              <div class="st-row column-layout">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span>${t('amb_burnin')}</span>
                  <label class="toggle-switch"><input type="checkbox" id="set-amb-burnin"><span class="slider"></span></label>
                </div>
                <div class="st-desc">${t('amb_burnin_desc')}</div>
              </div>

              <div class="st-group-title" style="margin-top:22px;">${t('amb_group_motion')}</div>

              <div class="st-row column-layout">
                <span>${t('amb_motion')}</span>
                <select id="set-amb-motion" class="st-select" style="width:100%; margin-top:8px;">
                  <option value="auto">${t('amb_motion_auto')}</option>
                  <option value="full">${t('amb_motion_full')}</option>
                  <option value="reduced">${t('amb_motion_reduced')}</option>
                </select>
                <div class="st-desc" style="margin-top:8px;">${t('amb_motion_desc')}</div>
              </div>

              <div class="st-group-title" style="margin-top:22px;">${t('amb_group_night')}</div>
              <div class="st-row column-layout">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span>${t('amb_night')}</span>
                  <label class="toggle-switch"><input type="checkbox" id="set-amb-night"><span class="slider"></span></label>
                </div>
                <div class="st-desc">${t('amb_night_desc')}</div>
              </div>

              <div class="st-row">
                <span>${t('amb_night_start')}</span>
                <select id="set-amb-night-start" class="st-select">${hourOptionsHTML}</select>
              </div>
              <div class="st-row">
                <span>${t('amb_night_end')}</span>
                <select id="set-amb-night-end" class="st-select">${hourOptionsHTML}</select>
              </div>
              <div class="st-row">
                <span>${t('amb_night_color')}</span>
                <select id="set-amb-night-color" class="st-select">
                  <option value="amber">${t('amb_color_amber')}</option>
                  <option value="red">${t('amb_color_red')}</option>
                  <option value="white">${t('amb_color_white')}</option>
                </select>
              </div>
              <div class="st-row"><span>${t('amb_night_bright')}</span><input type="range" id="set-amb-night-bright" min="20" max="100" step="5" class="st-range"></div>

              <div style="font-size:0.8rem; opacity:0.6; padding:10px;">${t('amb_hint')}</div>
            </div>

            <div id="tab-dock" class="st-section">
              <div class="st-section-sub">${t('dock_sub')}</div>
              <div class="st-group-title">${t('shortcut_edit_group')}</div>
              <div class="st-desc" style="margin:-8px 0 12px;">${t('desc_dock')}</div>
              <div id="dock-settings-list"></div>
              <div style="display:flex; gap:10px; margin-top:10px;">
                <button id="add-dock-item-btn" class="st-btn" style="flex:1;">
                  ${t('add_item_btn')}
                </button>
                <button id="add-dock-folder-btn" class="st-btn" style="flex:1;">
                  ${t('add_folder_btn')}
                </button>
              </div>
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
          <span>${t('url_label')}</span>
          <input type="text" id="dock-edit-url" class="st-input" placeholder="https://...">
          <span>${t('icon_label')}</span>
          <textarea id="dock-edit-icon" class="st-input icon-textarea" placeholder="${t('icon_placeholder')}" rows="3" spellcheck="false"></textarea>
          <button type="button" id="dock-edit-favicon" class="st-btn-small icon-fetch-btn">${t('fetch_favicon_btn')}</button>
        </div>
        <div class="modal-actions">
          <button id="dock-edit-save" class="st-btn primary-btn">${t('save_btn')}</button>
        </div>
      </div>
    </div>

    <div id="folder-submenu" class="folder-submenu">
      <!-- フォルダ内のアイテムを動的に生成 -->
    </div>
  `;
  document.body.appendChild(root);

  applyUiScale();
  window.addEventListener('resize', applyUiScale);

  chrome.storage.local.get(['redirectNewTab'], (r) => {
    const el = document.getElementById('set-newtab-redirect');
    if (el) el.checked = r.redirectNewTab !== false;
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
  setupAmbientMode();
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
  setupIOSFocusSwitcher();

  const lyricsBtn = document.getElementById('lyrics-toggle-btn');
  const lyricsOverlay = document.getElementById('lyrics-overlay');
  if (lyricsBtn && lyricsOverlay) {
    lyricsBtn.onclick = (e) => {
      e.stopPropagation();
      lyricsOverlay.classList.toggle('show');
      lyricsBtn.classList.toggle('active');
    };
  }
}

let contextMenuTargetIndex = -1;

function showFolderSubmenu(folderItem, dockElement) {
  const submenu = document.getElementById('folder-submenu');
  if (!submenu) return;

  const searchContainer = document.getElementById('search-suggestions');
  if (searchContainer) searchContainer.style.display = 'none';
  document.getElementById('search-input')?.blur();

  if (submenu.classList.contains('show') && submenu._activeTrigger === dockElement) {
    submenu.classList.remove('show');
    submenu._activeTrigger = null;
    return;
  }

  submenu.innerHTML = '';

  folderItem.items.forEach((subItem) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'folder-submenu-item';

    if (subItem.icon && subItem.icon.trim().startsWith('<svg')) {
      itemDiv.innerHTML = subItem.icon;
      itemDiv.firstElementChild.classList.add('icon-svg');
    } else if (
      subItem.icon &&
      (subItem.icon.startsWith('http') || subItem.icon.startsWith('data:image'))
    ) {
      const img = document.createElement('img');
      img.src = subItem.icon;
      img.className = 'dock-img-icon';
      img.style.cssText =
        'width:26px; height:26px; object-fit:contain; border-radius:6px; display:block; pointer-events:none;';
      img.onerror = () => {
        img.style.display = 'none';
        itemDiv.innerText = subItem.icon;
      };
      itemDiv.appendChild(img);
    } else {
      itemDiv.innerText = subItem.icon;
    }

    itemDiv.title = subItem.url;
    itemDiv.onclick = (e) => {
      e.stopPropagation();
      window.location.href = subItem.url;
    };

    submenu.appendChild(itemDiv);
  });

  const rect = dockElement.getBoundingClientRect();
  const submenuRect = submenu.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2 - submenuRect.width / 2;
  submenu.style.left = Math.max(10, centerX) + 'px';
  submenu.style.bottom = window.innerHeight - rect.top + 15 + 'px';

  submenu.classList.add('show');
  submenu._activeTrigger = dockElement;

  const closeHandler = (e) => {
    if (!submenu.contains(e.target) && !dockElement.contains(e.target)) {
      submenu.classList.remove('show');
      submenu._activeTrigger = null;
      document.removeEventListener('click', closeHandler);
    }
  };

  setTimeout(() => {
    document.addEventListener('click', closeHandler);
  }, 50);
}

function setupDockContextMenu() {
  const menu = document.getElementById('dock-context-menu');
  const editBtn = document.getElementById('ctx-edit');
  const delBtn = document.getElementById('ctx-del');

  document.addEventListener('click', (e) => {
    if (menu) menu.classList.remove('show');
  });

  if (editBtn)
    editBtn.onclick = () => {
      if (contextMenuTargetIndex >= 0) openDockEditModal(contextMenuTargetIndex);
    };

  if (delBtn)
    delBtn.onclick = () => {
      if (contextMenuTargetIndex >= 0) {
        const items = getDockItems();
        if (confirm(t('delete_confirm', { icon: items[contextMenuTargetIndex].icon }))) {
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
  const faviconBtn = document.getElementById('dock-edit-favicon');

  if (faviconBtn)
    faviconBtn.onclick = () => {
      const urlVal = document.getElementById('dock-edit-url').value;
      const fav = faviconUrlForSite(urlVal);
      if (!urlVal.trim()) {
        alert(t('fetch_favicon_empty_url'));
        return;
      }
      if (!fav) {
        alert(t('fetch_favicon_fail'));
        return;
      }
      document.getElementById('dock-edit-icon').value = fav;
    };

  if (closeBtn) closeBtn.onclick = () => modal.classList.remove('show');
  if (modal)
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.remove('show');
    };

  if (saveBtn)
    saveBtn.onclick = () => {
      const iconVal = document.getElementById('dock-edit-icon').value;
      const urlVal = document.getElementById('dock-edit-url').value;
      if (contextMenuTargetIndex >= 0 && iconVal && urlVal) {
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
  if (!item) return;
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

  if (prefs.clockColor) {
    rootStyle.setProperty('--clock-color', prefs.clockColor);
    document.body.classList.add('custom-clock-color');
  } else {
    document.body.classList.remove('custom-clock-color');
    rootStyle.removeProperty('--clock-color');
  }
  const colorInput = document.getElementById('set-clock-color');
  if (colorInput) colorInput.value = prefs.clockColor || '#ffffff';

  if (prefs.clockWeight) {
    rootStyle.setProperty('--clock-weight', prefs.clockWeight);
  } else {
    rootStyle.removeProperty('--clock-weight');
  }
  const weightInput = document.getElementById('set-clock-weight');
  if (weightInput)
    weightInput.value = prefs.clockWeight || (prefs.themeMode === 'liquidglass' ? '300' : '600');

  rootStyle.setProperty('--bg-brightness', prefs.bgBrightness);
  rootStyle.setProperty('--bg-opacity', prefs.bgOpacity || '1.0');

  const blurValue = prefs.bgBlur || '50';
  const blurOpacity = blurValue / 100;
  rootStyle.setProperty('--bg-blur-opacity', blurOpacity);

  rootStyle.setProperty('--bg-blur', blurValue + 'px');
  const glassOpacity = prefs.glassOpacity || '0.55';
  rootStyle.setProperty('--glass-opacity', glassOpacity);
  if (glassOpacity === '0' || glassOpacity === '0.0') {
    document.body.classList.add('glass-opacity-zero');
  } else {
    document.body.classList.remove('glass-opacity-zero');
  }
  rootStyle.setProperty('--clock-size', (prefs.clockSize || '10') + 'rem');

  applyThemeClass(prefs.themeMode);

  const themeSelect = document.getElementById('set-theme-mode');
  if (themeSelect) themeSelect.value = prefs.themeMode || 'glass';

  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v;
  };

  setVal('set-user-name', prefs.userName !== undefined ? prefs.userName : 'User');
  setVal('set-news-url', prefs.newsUrl || '');
  setVal('set-ical-url', prefs.icalUrl || '');
  setVal('set-module-1', prefs.module1 || 'weather');
  setVal('set-module-2', prefs.module2 || 'news');
  setVal('set-module-3', prefs.module3 || 'countdown');

  const ownerLabel = document.getElementById('about-owner-name');
  if (ownerLabel) ownerLabel.innerText = prefs.userName !== undefined ? prefs.userName : 'User';

  setVal('set-accent', prefs.accent);

  const fontSelect = document.getElementById('set-font');
  const customFontRow = document.getElementById('custom-font-row');
  const customFontInput = document.getElementById('set-custom-font');

  if (fontSelect && customFontRow && customFontInput) {
    let isPreset = false;
    for (let i = 0; i < fontSelect.options.length; i++) {
      if (fontSelect.options[i].value === prefs.clockFont) {
        isPreset = true;
        break;
      }
    }

    if (isPreset) {
      fontSelect.value = prefs.clockFont;
      customFontRow.style.display = 'none';
      customFontInput.value = '';
    } else {
      fontSelect.value = 'custom';
      customFontRow.style.display = 'block';

      if (document.activeElement !== customFontInput) {
        customFontInput.value = prefs.clockFont || '';
      }
    }
  }

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
  if (cityInput) cityInput.value = currentCity;

  const setCheck = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.checked = v !== false;
  };
  setCheck('set-burnin', prefs.burnIn);
  setCheck('set-card-tilt', prefs.cardTilt);
  setCheck('set-show-seconds', prefs.showSeconds);
  setCheck('set-use-12h', prefs.use12hFormat);
  setCheck('set-show-quote', prefs.showQuote);
  setCheck('set-show-memo', prefs.showMemo);
  setCheck('set-show-music', prefs.showMusic);
  setCheck('set-show-calendar', prefs.showCalendar);

  setCheck('set-media-yt', prefs.mediaYT);
  setCheck('set-media-ytm', prefs.mediaYTMusic);
  setCheck('set-show-lyrics', prefs.showLyrics);
  setCheck('set-media-spotify', prefs.mediaSpotify);
  setCheck('set-media-bg', prefs.mediaBackground);
  setCheck('set-show-zen', prefs.showZenMode);
  setCheck('set-show-ambient', prefs.showAmbient);
  setVal('set-amb-idle', prefs.ambientIdleStart ?? '0');
  setCheck('set-amb-sky', prefs.ambientSky);
  setCheck('set-amb-curve', prefs.ambientCurve);
  setCheck('set-amb-weather', prefs.ambientWeather);
  setCheck('set-amb-sched', prefs.ambientSchedule);
  setCheck('set-amb-music', prefs.ambientMusic);
  setCheck('set-amb-greet', prefs.ambientGreeting);
  setCheck('set-amb-wakelock', prefs.ambientWakeLock);
  setCheck('set-amb-fullscreen', prefs.ambientFullscreen);
  setCheck('set-amb-cursor', prefs.ambientHideCursor);
  setCheck('set-amb-burnin', prefs.ambientBurnIn);
  setCheck('set-amb-night', prefs.ambientNight);
  setVal(
    'set-amb-motion',
    { light: 'full', minimal: 'reduced' }[prefs.ambientMotion] || prefs.ambientMotion || 'auto',
  );
  setVal('set-amb-night-start', prefs.ambientNightStart || '22');
  setVal('set-amb-night-end', prefs.ambientNightEnd || '5');
  setVal('set-amb-night-color', prefs.ambientNightColor || 'amber');
  setVal('set-amb-night-bright', prefs.ambientNightBrightness || '65');
  setCheck('set-show-profile-switcher', prefs.showProfileSwitcher);
  setupIOSFocusSwitcher();

  const toggle = (id, visible) => {
    const el = document.getElementById(id);
    if (el) el.style.display = visible === false ? 'none' : 'flex';
    if (id === 'quote-box' && el) el.style.display = visible === false ? 'none' : 'block';
  };

  toggle('quote-box', prefs.showQuote);
  toggle('memo-area', prefs.showMemo);
  toggle('music-card-container', prefs.showMusic);
  toggle('card-calendar', prefs.showCalendar);
  toggle('zen-btn', prefs.showZenMode);
  toggle('ambient-btn', prefs.showAmbient);
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
    clockFont: getVal('set-font') === 'custom' ? getVal('set-custom-font') : getVal('set-font'),
    clockColor: getVal('set-clock-color'),
    bgBrightness: getVal('set-bright'),
    newsUrl: getVal('set-news-url'),
    bgBlur: getVal('set-blur'),
    bgOpacity: getVal('set-opacity'),
    glassOpacity: getVal('set-glass-opacity'),
    clockSize: getVal('set-size'),
    clockWeight: getVal('set-clock-weight'),
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
    showMemo: getChk('set-show-memo'),
    mediaYT: getChk('set-media-yt'),

    themeMode: getVal('set-theme-mode'),

    module1: getVal('set-module-1'),
    module2: getVal('set-module-2'),
    module3: getVal('set-module-3'),

    mediaYTMusic: getChk('set-media-ytm'),
    showLyrics: getChk('set-show-lyrics'),
    mediaSpotify: getChk('set-media-spotify'),
    mediaBackground: getChk('set-media-bg'),
    showZenMode: getChk('set-show-zen'),
    showAmbient: getChk('set-show-ambient'),
    ambientIdleStart: getVal('set-amb-idle') ?? oldPrefs.ambientIdleStart ?? '0',
    ambientSky: getChk('set-amb-sky'),
    ambientCurve: getChk('set-amb-curve'),
    ambientWeather: getChk('set-amb-weather'),
    ambientSchedule: getChk('set-amb-sched'),
    ambientMusic: getChk('set-amb-music'),
    ambientGreeting: getChk('set-amb-greet'),
    ambientWakeLock: getChk('set-amb-wakelock'),
    ambientFullscreen: getChk('set-amb-fullscreen'),
    ambientHideCursor: getChk('set-amb-cursor'),
    ambientBurnIn: getChk('set-amb-burnin'),
    ambientMotion: getVal('set-amb-motion') ?? oldPrefs.ambientMotion ?? 'auto',
    ambientNight: getChk('set-amb-night'),
    ambientNightStart: getVal('set-amb-night-start') ?? oldPrefs.ambientNightStart ?? '22',
    ambientNightEnd: getVal('set-amb-night-end') ?? oldPrefs.ambientNightEnd ?? '5',
    ambientNightColor: getVal('set-amb-night-color') ?? oldPrefs.ambientNightColor ?? 'amber',
    ambientNightBrightness:
      getVal('set-amb-night-bright') ?? oldPrefs.ambientNightBrightness ?? '65',
    showProfileSwitcher: getChk('set-show-profile-switcher'),

    calendarUrls: oldPrefs.calendarUrls || [],
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

  if (typeof AMBIENT !== 'undefined' && AMBIENT.on) {
    ambApplyPrefs();
    ambRender();
  }

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

    const folderSubmenu = document.getElementById('folder-submenu');
    if (folderSubmenu) folderSubmenu.classList.remove('show');

    modal.classList.add('show');
    renderDockSettingsList();
    renderCalendarSettingsList();
  };
  closeBtn.onclick = () => modal.classList.remove('show');
  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove('show');
  };

  const tabs = document.querySelectorAll('.st-tab-btn');
  const sections = document.querySelectorAll('.st-section');
  const title = document.getElementById('st-header-title');

  tabs.forEach((tab) => {
    tab.onclick = () => {
      tabs.forEach((t) => t.classList.remove('active'));
      sections.forEach((s) => s.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');

      title.innerText = tab.innerText.replace(/^[^\s]+\s/, '');

      document.querySelector('.st-content-scroll').scrollTop = 0;
    };
  });

  const fontSelect = document.getElementById('set-font');
  const customFontRow = document.getElementById('custom-font-row');
  if (fontSelect && customFontRow) {
    fontSelect.addEventListener('change', () => {
      customFontRow.style.display = fontSelect.value === 'custom' ? 'block' : 'none';
      savePreferences();
    });
  }

  [
    'set-accent',
    'set-bright',
    'set-blur',
    'set-size',
    'set-clock-weight',
    'set-opacity',
    'set-glass-opacity',
    'set-amb-night-bright',
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', savePreferences);
  });

  document.getElementById('set-custom-font')?.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--clock-font', e.target.value);

    savePreferences();
  });

  ['set-font', 'set-user-name', 'set-ical-url'].forEach((id) => {
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

  document.getElementById('set-clock-color')?.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--clock-color', e.target.value);
    document.body.classList.add('custom-clock-color');
  });
  document.getElementById('set-clock-color')?.addEventListener('change', savePreferences);

  document.getElementById('btn-reset-clock-color').onclick = () => {
    const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    prefs.clockColor = '';
    localStorage.setItem('immersion_prefs', JSON.stringify(prefs));
    applyPreferences();
  };
  document.getElementById('set-theme-mode')?.addEventListener('change', savePreferences);
  ['set-module-1', 'set-module-2', 'set-module-3'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', savePreferences);
  });
  [
    'set-burnin',
    'set-card-tilt',
    'set-show-seconds',
    'set-use-12h',
    'set-show-quote',
    'set-show-memo',
    'set-show-weather',
    'set-show-news',
    'set-show-countdown',
    'set-show-music',
    'set-show-calendar',
    'set-show-zen',
    'set-show-ambient',
    'set-amb-idle',
    'set-amb-sky',
    'set-amb-curve',
    'set-amb-weather',
    'set-amb-sched',
    'set-amb-music',
    'set-amb-greet',
    'set-amb-wakelock',
    'set-amb-fullscreen',
    'set-amb-cursor',
    'set-amb-burnin',
    'set-amb-night',
    'set-amb-motion',
    'set-amb-night-start',
    'set-amb-night-end',
    'set-amb-night-color',
    'set-media-yt',
    'set-media-ytm',
    'set-media-spotify',
    'set-media-bg',
    'set-show-profile-switcher',
  ].forEach((id) => document.getElementById(id)?.addEventListener('change', savePreferences));

  const widgetStackToggle = document.getElementById('set-widget-stack-enabled');
  if (widgetStackToggle) {
    widgetStackToggle.addEventListener('change', (e) => {
      const settingsArea = document.getElementById('widget-stack-settings');
      if (settingsArea) {
        settingsArea.style.display = e.target.checked ? 'block' : 'none';
      }
      savePreferences();
      location.reload();
    });
  }

  ['widget-weather', 'widget-news', 'widget-countdown', 'widget-music', 'widget-calendar'].forEach(
    (id) => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          savePreferences();
          location.reload();
        });
      }
    },
  );

  const autoSwitchSelect = document.getElementById('set-widget-auto-switch');
  if (autoSwitchSelect) {
    autoSwitchSelect.addEventListener('change', () => {
      savePreferences();
      if (typeof stopWidgetAutoSwitch === 'function') stopWidgetAutoSwitch();
      if (typeof startWidgetAutoSwitch === 'function') startWidgetAutoSwitch();
    });
  }

  document.getElementById('btn-apply-img').onclick = () => {
    savePreferences();
    const prefs = JSON.parse(localStorage.getItem('immersion_prefs'));
    const bgOriginal = document.getElementById('bg-layer-original');
    const bgBlurred = document.getElementById('bg-layer-blurred');
    if (bgOriginal && bgBlurred && prefs.idleImgUrl) {
      bgOriginal.style.backgroundImage = `url('${prefs.idleImgUrl}')`;
      bgOriginal.classList.add('dynamic-blur');
      bgBlurred.style.display = 'none';
    }
    alert(t('wallpaper_updated'));
  };

  document.getElementById('btn-apply-cnt').onclick = () => {
    savePreferences();
    alert(t('event_set'));
  };

  document.getElementById('add-dock-item-btn').onclick = addDockItem;
  document.getElementById('add-dock-folder-btn').onclick = addDockFolder;

  const loginBtn = document.getElementById('btn-spotify-login');
  if (loginBtn) {
    chrome.runtime.sendMessage({ action: 'checkSpotifyLogin' }, (res) => {
      if (res && res.loggedIn) {
        loginBtn.innerText = t('spotify_connected');
        loginBtn.style.backgroundColor = '#1db954';
        loginBtn.style.color = '#fff';
      }
    });

    loginBtn.onclick = () => {
      loginBtn.innerText = t('spotify_connecting');
      chrome.runtime.sendMessage({ action: 'loginSpotify' }, (res) => {
        if (res && res.success) {
          loginBtn.innerText = t('spotify_connected');
          loginBtn.style.backgroundColor = '#1db954';
          loginBtn.style.color = '#fff';
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
    statusLabel.innerText = 'Stored: Local Image';
    statusLabel.style.color = '#50E3C2';
  }

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const limit = file.type.startsWith('video/') ? 500 : 20;
    if (file.size > limit * 1024 * 1024) {
      alert(`File too large (Max ${limit}MB)`);
      fileInput.value = '';
      return;
    }

    try {
      await saveImageToDB(file);

      const objectUrl = URL.createObjectURL(file);
      statusLabel.innerText = 'Stored: ' + file.name;
      statusLabel.style.color = '#50E3C2';

      const bgOriginal = document.getElementById('bg-layer-original');
      const bgBlurred = document.getElementById('bg-layer-blurred');
      const bgVideo = document.getElementById('bg-video');

      if (file.type.startsWith('video/')) {
        sessionIdleArt = 'video';
        document.body.classList.add('has-video');
        if (bgVideo) {
          bgVideo.src = objectUrl;
          bgVideo.style.opacity = '1';
          bgVideo.play();
        }
        if (bgOriginal) bgOriginal.style.backgroundImage = 'none';
        if (bgBlurred) bgBlurred.style.display = 'none';
      } else {
        document.body.classList.remove('has-video');
        if (bgVideo) {
          bgVideo.style.opacity = '0';
          bgVideo.pause();
        }

        const savedData = await getImageFromDB();
        if (savedData && bgOriginal && bgBlurred) {
          sessionIdleArt = savedData;
          bgOriginal.style.backgroundImage = `url('${savedData.original}')`;
          bgBlurred.style.backgroundImage = `url('${savedData.blurred}')`;
          bgOriginal.classList.remove('dynamic-blur');
          bgBlurred.style.display = 'block';
        }
      }

      alert(t('wallpaper_updated'));
      localStorage.removeItem('immersion_local_bg_data');
    } catch (err) {
      console.error(err);
      alert('Failed to save file.');
    }
  });

  resetBtn.onclick = async () => {
    await deleteImageFromDB();
    localStorage.removeItem('immersion_local_bg_data');

    statusLabel.innerText = '';
    fileInput.value = '';

    const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    const bgOriginal = document.getElementById('bg-layer-original');
    const bgBlurred = document.getElementById('bg-layer-blurred');

    if (bgOriginal && bgBlurred) {
      if (prefs.idleImgUrl && prefs.idleImgUrl.startsWith('http')) {
        sessionIdleArt = prefs.idleImgUrl;
        bgOriginal.style.backgroundImage = `url('${prefs.idleImgUrl}')`;
        bgOriginal.classList.add('dynamic-blur');
        bgBlurred.style.display = 'none';
      } else {
        const defImg = defaultWallpapers[Math.floor(Math.random() * defaultWallpapers.length)];
        sessionIdleArt = defImg;
        bgOriginal.style.backgroundImage = `url('${defImg}')`;
        bgOriginal.classList.add('dynamic-blur');
        bgBlurred.style.display = 'none';
      }
    }

    alert('Image cleared.');
  };

  getImageFromDB().then((url) => {
    if (url) {
      statusLabel.innerText = 'Stored: Local Image (HD)';
      statusLabel.style.color = '#50E3C2';
    }
  });

  const cityBtn = document.getElementById('btn-apply-city');
  if (cityBtn) {
    cityBtn.onclick = () => {
      savePreferences();
      alert('Location updated!');
    };
  }

  document.querySelectorAll('.st-range').forEach((slider) => {
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
        if (root) {
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

    let d = '--',
      hms = '--:--:--';
    if (prefs.cntDate) {
      d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      hms = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    cards.forEach((card) => {
      const titleEl = card.querySelector('.cnt-label') || card.querySelector('.label-std');
      const daysEl = card.querySelector('.cnt-days') || card.querySelector('.cnt-big');
      const unitEl = card.querySelector('.cnt-unit');
      const hmsEl = card.querySelector('.cnt-hms') || card.querySelector('.cnt-sub');
      const picker = card.querySelector('.cnt-picker');
      const mainArea = card.querySelector('.cnt-main');

      if (titleEl) {
        titleEl.innerText = prefs.cntTitle || t('event');
        titleEl.onclick = (e) => {
          e.stopPropagation();
          const newTitle = prompt('Event Name:', prefs.cntTitle || '');
          if (newTitle !== null) {
            prefs.cntTitle = newTitle;
            localStorage.setItem('immersion_prefs', JSON.stringify(prefs));
            update();
          }
        };
      }

      if (daysEl) daysEl.innerText = d;
      if (hmsEl) hmsEl.innerText = hms;
      if (unitEl) {
        unitEl.innerText = isPast && prefs.cntDate ? 'DAYS AGO' : 'DAYS';
        unitEl.style.color = isPast ? '#ff6b6b' : '';
      }
      if (mainArea && picker) {
        mainArea.onclick = (e) => {
          e.stopPropagation();
          try {
            picker.showPicker();
          } catch (err) {
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

function getDockItems() {
  const saved = localStorage.getItem('immersion_dock_items');
  return saved ? JSON.parse(saved) : defaultDockItems;
}

// サイトのURLから favicon の取得用URLを組み立てる（Googleのfaviconサービス利用）
function faviconUrlForSite(rawUrl) {
  if (!rawUrl) return '';
  let value = rawUrl.trim();
  if (!value) return '';
  // %s 入りの検索URLなどはプレースホルダを除去してからホスト判定
  value = value.replace('%s', '');
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) value = 'https://' + value;
  try {
    const host = new URL(value).hostname;
    if (!host) return '';
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  } catch (e) {
    return '';
  }
}
function renderDock() {
  const dock = document.getElementById('main-dock');
  const items = getDockItems();
  const existing = dock.querySelectorAll('.dynamic-dock-item');
  existing.forEach((el) => el.remove());

  items.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'dock-item tilt-card dynamic-dock-item';

    if (item.type === 'folder') {
      if (item.icon && item.icon.trim().startsWith('<svg')) {
        div.innerHTML = item.icon;
        div.firstElementChild.classList.add('icon-svg');
        div.firstElementChild.style.width = '24px';
        div.firstElementChild.style.height = '24px';
      } else {
        div.innerText = item.icon;
      }
      div.title = item.name;
      div.onclick = (e) => {
        e.stopPropagation();
        showFolderSubmenu(item, div);
      };
      div.oncontextmenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        contextMenuTargetIndex = index;
        const menu = document.getElementById('dock-context-menu');
        menu.style.top = e.clientY + 'px';
        menu.style.left = e.clientX + 'px';
        menu.classList.add('show');
      };
      dock.insertBefore(div, document.querySelector('.dock-separator'));
      return;
    }

    if (item.icon && (item.icon.startsWith('http') || item.icon.startsWith('data:image'))) {
      const img = document.createElement('img');
      img.src = item.icon;
      // SVGアイコン(24px・中央配置)と見た目を揃える。タイルいっぱいに広げない。
      img.className = 'dock-img-icon';
      img.style.cssText =
        'width:28px; height:28px; object-fit:contain; border-radius:6px; display:block; pointer-events:none;';
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
    }

    div.title = item.url;
    div.onclick = () => {
      if (item.url.includes('%s')) {
        const input = document.getElementById('search-input');
        const v = input.value;
        window.location.href = v
          ? item.url.replace('%s', encodeURIComponent(v))
          : item.url.split('?')[0];
      } else {
        window.location.href = item.url;
      }
    };
    div.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      contextMenuTargetIndex = index;
      const menu = document.getElementById('dock-context-menu');
      menu.style.top = e.clientY + 'px';
      menu.style.left = e.clientX + 'px';
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

    if (item.type === 'folder') {
      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span class="ds-label" style="display:flex; align-items:center; gap:6px;">
            <svg viewBox="0 0 24 24" style="width:16px; height:16px;"><path fill="currentColor" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
            ${t('folder_label')} - ${item.name}
          </span>
          <div class="ds-controls" style="display:flex; gap: 5px;">
            ${index > 0 ? '<span class="ds-move-btn ds-up">↑</span>' : ''}
            ${index < items.length - 1 ? '<span class="ds-move-btn ds-down">↓</span>' : ''}
            <span class="ds-move-btn ds-del-inline" style="color:#ff453a;">×</span>
          </div>
        </div>
        <div class="ds-label" style="margin-bottom:4px;">フォルダ名</div>
        <input type="text" class="st-input ds-folder-name" placeholder="Folder Name" style="margin-bottom:8px;">
        <div class="ds-label" style="margin-bottom:4px;">アイコン (SVG推奨)</div>
        <textarea class="st-input ds-folder-icon icon-textarea" placeholder="<svg>...</svg>" rows="3" spellcheck="false"></textarea>
        <div class="ds-label" style="margin-top:12px;">フォルダ内のアイテム</div>
        <div class="folder-items-list" style="margin-top:8px; margin-bottom:8px;"></div>
        <button class="st-btn-small" style="width:100%; font-size:0.8rem; display:flex; align-items:center; justify-content:center; gap:4px;">
          アイテムを追加
        </button>
      `;

      const nameInput = row.querySelector('.ds-folder-name');
      const iconInput = row.querySelector('.ds-folder-icon');
      const itemsList = row.querySelector('.folder-items-list');
      const addBtn = row.querySelector('button');

      nameInput.value = item.name;
      iconInput.value = item.icon;

      const saveFolder = () => {
        items[index].name = nameInput.value;
        items[index].icon = iconInput.value;
        localStorage.setItem('immersion_dock_items', JSON.stringify(items));
        renderDock();
      };
      nameInput.oninput = saveFolder;
      iconInput.oninput = saveFolder;

      const renderFolderItems = () => {
        itemsList.innerHTML = '';
        item.items.forEach((subItem, subIndex) => {
          const subRow = document.createElement('div');
          subRow.style.cssText =
            'display:flex; gap:5px; margin-bottom:5px; padding:8px; background:rgba(0,0,0,0.2); border-radius:6px;';
          subRow.innerHTML = `
            <input type="text" class="st-input" placeholder="Icon" style="flex:0 0 60px; font-size:0.8rem; padding:4px 6px;">
            <input type="text" class="st-input" placeholder="URL" style="flex:1; font-size:0.8rem; padding:4px 6px;">
            <span class="ds-move-btn sub-favicon-btn" title="${t('fetch_favicon_btn')}" style="flex:0 0 24px; font-size:0.9rem;">★</span>
            <span class="ds-move-btn" style="color:#ff453a; flex:0 0 24px; font-size:1rem;">×</span>
          `;

          const subIconInput = subRow.children[0];
          const subUrlInput = subRow.children[1];
          const subFavBtn = subRow.children[2];
          const subDelBtn = subRow.children[3];

          subIconInput.value = subItem.icon;
          subUrlInput.value = subItem.url;

          const saveSubItem = () => {
            items[index].items[subIndex].icon = subIconInput.value;
            items[index].items[subIndex].url = subUrlInput.value;
            localStorage.setItem('immersion_dock_items', JSON.stringify(items));
            renderDock();
          };
          subIconInput.oninput = saveSubItem;
          subUrlInput.oninput = saveSubItem;

          subFavBtn.onclick = () => {
            const fav = faviconUrlForSite(subUrlInput.value);
            if (!subUrlInput.value.trim()) {
              alert(t('fetch_favicon_empty_url'));
              return;
            }
            if (!fav) {
              alert(t('fetch_favicon_fail'));
              return;
            }
            subIconInput.value = fav;
            saveSubItem();
          };

          subDelBtn.onclick = () => {
            items[index].items.splice(subIndex, 1);
            localStorage.setItem('immersion_dock_items', JSON.stringify(items));
            renderFolderItems();
            renderDock();
          };

          itemsList.appendChild(subRow);
        });
      };
      renderFolderItems();

      addBtn.onclick = () => {
        items[index].items.push({ icon: '🔗', url: 'https://example.com' });
        localStorage.setItem('immersion_dock_items', JSON.stringify(items));
        renderFolderItems();
        renderDock();
      };

      const delBtn = row.querySelector('.ds-del-inline');
      delBtn.onclick = () => {
        if (confirm('フォルダとその中のアイテムを削除しますか？')) {
          items.splice(index, 1);
          localStorage.setItem('immersion_dock_items', JSON.stringify(items));
          renderDockSettingsList();
          renderDock();
        }
      };
    } else {
      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span class="ds-label">${t('icon_label')}</span>
          <div class="ds-controls" style="display:flex; gap: 5px;">
             ${index > 0 ? '<span class="ds-move-btn ds-up">↑</span>' : ''}
             ${index < items.length - 1 ? '<span class="ds-move-btn ds-down">↓</span>' : ''}
             <span class="ds-move-btn ds-del-inline" style="color:#ff453a;">×</span>
          </div>
        </div>
        <div class="ds-label" style="margin-bottom:4px;">${t('url_label')}</div>
        <input type="text" class="ds-url" placeholder="${t('url_label')}">
        <div class="ds-label" style="margin-top:8px; margin-bottom:4px;">${t('icon_label')}</div>
        <textarea class="ds-icon icon-textarea" placeholder="${t('icon_placeholder')}" rows="2" spellcheck="false"></textarea>
        <button type="button" class="st-btn-small ds-favicon-btn icon-fetch-btn">${t('fetch_favicon_btn')}</button>
      `;

      const iI = row.querySelector('.ds-icon');
      const uI = row.querySelector('.ds-url');
      iI.value = item.icon;
      uI.value = item.url;

      const d = row.querySelector('.ds-del-inline');
      const save = () => {
        items[index].icon = iI.value;
        items[index].url = uI.value;
        localStorage.setItem('immersion_dock_items', JSON.stringify(items));
        renderDock();
      };
      iI.oninput = save;
      uI.oninput = save;

      const favBtn = row.querySelector('.ds-favicon-btn');
      if (favBtn)
        favBtn.onclick = () => {
          const fav = faviconUrlForSite(uI.value);
          if (!uI.value.trim()) {
            alert(t('fetch_favicon_empty_url'));
            return;
          }
          if (!fav) {
            alert(t('fetch_favicon_fail'));
            return;
          }
          iI.value = fav;
          save();
        };

      d.onclick = () => {
        items.splice(index, 1);
        localStorage.setItem('immersion_dock_items', JSON.stringify(items));
        renderDockSettingsList();
        renderDock();
      };
    }

    const upBtn = row.querySelector('.ds-up');
    if (upBtn) {
      upBtn.onclick = () => {
        [items[index], items[index - 1]] = [items[index - 1], items[index]];
        localStorage.setItem('immersion_dock_items', JSON.stringify(items));
        renderDockSettingsList();
        renderDock();
      };
    }
    const downBtn = row.querySelector('.ds-down');
    if (downBtn) {
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
function addDockItem() {
  const items = getDockItems();
  items.push({ icon: '🔗', url: 'https://example.com' });
  localStorage.setItem('immersion_dock_items', JSON.stringify(items));
  renderDockSettingsList();
  renderDock();
}

function addDockFolder() {
  const items = getDockItems();
  items.push({
    type: 'folder',
    icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>',
    name: 'New Folder',
    items: [],
  });
  localStorage.setItem('immersion_dock_items', JSON.stringify(items));
  renderDockSettingsList();
  renderDock();
}

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function setupSearch() {
  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');

  const updateClearBtn = () => {
    if (input.value) clearBtn.style.display = 'block';
    else clearBtn.style.display = 'none';
  };

  input.addEventListener('input', updateClearBtn);
  updateClearBtn();

  clearBtn.onclick = () => {
    input.value = '';
    input.focus();
    updateClearBtn();
    const container = document.getElementById('search-suggestions');
    if (container) {
      container.style.display = 'none';
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.isComposing) return;

    if (e.key === 'Enter' && input.value) {
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
        if (!chrome.runtime?.id) {
          resolve([]);
          return;
        }
        chrome.runtime.sendMessage({ action: 'searchHistory', query: query || '' }, (res) => {
          if (chrome.runtime.lastError) {
            resolve([]);
            return;
          }
          resolve(res?.data || []);
        });
      } catch (e) {
        resolve([]);
      }
    });

    const googlePromise = isEmp
      ? Promise.resolve([])
      : new Promise((resolve) => {
          try {
            chrome.runtime.sendMessage(
              { action: 'fetchGoogleSuggestions', query: query },
              (res) => {
                if (chrome.runtime.lastError || !res || !res.data) {
                  resolve([]);
                } else {
                  resolve(res.data);
                }
              },
            );
          } catch (e) {
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
        } catch (e) {}
        return null;
      };

      historyItems.forEach((h) => {
        if (combined.length >= maxHistory) return;

        const term = extractSearchTerm(h.url);
        if (term && !seenTitles.has(term)) {
          combined.push({ text: term, type: 'history', url: h.url });
          seenTitles.add(term);
        }
      });

      googleItems.forEach((g) => {
        if (combined.length < 8 && !seenTitles.has(g)) {
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
    items.forEach((item) => {
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
        if (delBtn) {
          delBtn.onclick = (e) => {
            e.stopPropagation();
            chrome.runtime.sendMessage({ action: 'deleteHistory', url: item.url }, () => {
              fetchSuggestions(input.value || '');
            });
          };
          delBtn.onmouseenter = () => (delBtn.style.opacity = '1');
          delBtn.onmouseleave = () => (delBtn.style.opacity = '0.4');
        }
      }

      container.appendChild(div);
    });
    container.style.display = 'block';
    currentFocus = -1;
  };

  input.addEventListener('input', () => {
    fetchSuggestions(input.value);
    if (!input.value) fetchSuggestions('');
  });
  const trigger = () => {
    if (!input.value) fetchSuggestions('');
  };

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
    items.forEach((item) => item.classList.remove('active'));
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

function setupZenMode() {
  const btn = document.getElementById('zen-btn');
  if (btn)
    btn.onclick = (e) => {
      e.stopPropagation();
      document.body.classList.toggle('zen-active');
    };
}
/* =========================================================================
   AMBIENT MODE — 一枚もの

   面をめくらない。時計は移動しない。動くのは分の数字と、いまの位置だけ。
   横に長い画面を活かすのは下の一本の帯で、そこに気温の推移と予定の目盛りが
   同じ横軸で乗る。予定そのものは右の一覧が受け持つので、
   予定が0件でも10件でもレイアウトは崩れない。
   ========================================================================= */

const AMBIENT = {
  root: null,
  on: false,
  clockTimer: null,
  dataTimer: null,
  wakeLock: null,
  cursorTimer: null,
  enterTimer: null,
  auto: false,
  lastFace: '',
  wasNight: null,
  wired: false,
};

/* 時間帯で色が変わる設計なので、確認のために時刻を差し替えられる口を作る */
function ambNow() {
  return new Date();
}

/* 15か所から呼ばれ、毎秒2回も通る。中身が変わるのは設定を保存したときだけ */
function ambPrefs() {
  const raw = localStorage.getItem('immersion_prefs');
  if (ambPrefs._raw !== raw) {
    ambPrefs._raw = raw;
    try {
      ambPrefs._v = JSON.parse(raw) || defaultSettings;
    } catch (e) {
      ambPrefs._v = defaultSettings;
    }
  }
  return ambPrefs._v;
}

function ambLang() {
  const prefs = ambPrefs();
  let lang = prefs.language || 'auto';
  if (lang === 'auto') {
    const nav = navigator.language.slice(0, 2);
    lang = nav === 'ja' || nav === 'ko' || nav === 'zh' ? nav : 'en';
  }
  return lang;
}

/* --- 天気アイコン。動かすのは降ってくるものだけ --- */
function ambWeatherVisual(code) {
  const s = (d) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const body =
    '<path d="M7.5 18.5h9.5a4.2 4.2 0 0 0 .3-8.4 6.4 6.4 0 0 0-12.2 1.9 3.4 3.4 0 0 0 2.4 6.5Z"/>';
  const bodyHi =
    '<path d="M7.5 15.6h9.5a4.2 4.2 0 0 0 .3-8.4 6.4 6.4 0 0 0-12.2 1.9 3.4 3.4 0 0 0 2.4 6.5Z"/>';
  const sun =
    '<circle cx="12" cy="12" r="4.6"/><path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>';
  const part =
    '<circle cx="8.5" cy="8" r="3.1"/><path d="M8.5 2.4v1.6M2.9 8h1.6M4.5 4l1.1 1.1"/>' +
    '<path d="M10.5 19.6h7.4a3.6 3.6 0 0 0 .2-7.2 5.4 5.4 0 0 0-10.3 1.6 2.9 2.9 0 0 0 2 5.6Z"/>';
  const rain =
    bodyHi +
    '<path class="amb-drop amb-d1" d="M9 17.8v2"/><path class="amb-drop amb-d2" d="M13 17.8v2"/><path class="amb-drop amb-d3" d="M17 17.8v2"/>';
  const snow =
    bodyHi +
    '<path class="amb-drop amb-d1" d="M9 18.6h.01"/><path class="amb-drop amb-d2" d="M13 18.6h.01"/><path class="amb-drop amb-d3" d="M17 18.6h.01"/>';
  const storm = bodyHi + '<path d="M13.4 17.4 10.6 21h3.4l-2.6 3.2"/>';
  const fog =
    '<path d="M7.5 14.4h9.5a4.2 4.2 0 0 0 .3-8.4 6.4 6.4 0 0 0-12.2 1.9 3.4 3.4 0 0 0 2.4 6.5Z"/><path d="M5 18h14M7 21.4h10"/>';

  if (code === 0) return { icon: s(sun), text: t('weather_clear') };
  if (code <= 2) return { icon: s(part), text: t('weather_sunny') };
  if (code === 3) return { icon: s(body), text: t('weather_cloudy') };
  if (code === 45 || code === 48) return { icon: s(fog), text: t('weather_cloudy') };
  if (code >= 51 && code <= 67) return { icon: s(rain), text: t('weather_rain') };
  if (code >= 71 && code <= 86) return { icon: s(snow), text: t('weather_cloudy') };
  if (code >= 95) return { icon: s(storm), text: t('weather_rain') };
  return { icon: s(body), text: t('weather_cloudy') };
}

/* 1回の描画で5〜6か所から呼ばれる。中身は数十分に一度しか変わらないので、
   生の文字列が同じならパースし直さない。ここが効かないと3秒ごとに
   96時間ぶんのJSONを何度も読み直すことになる。 */
function ambWeatherData() {
  try {
    const raw = localStorage.getItem('immersion_weather_cache');
    if (!raw) return null;
    if (ambWeatherData._raw !== raw) {
      ambWeatherData._raw = raw;
      const c = JSON.parse(raw);
      ambWeatherData._v =
        c && c.data && c.data.current_weather
          ? {
              city: c.city,
              cur: c.data.current_weather,
              daily: c.data.daily,
              hourly: c.data.hourly,
            }
          : null;
    }
    return ambWeatherData._v;
  } catch (e) {
    return null;
  }
}

/* --- その日の予定。ローカルのメモとカレンダー購読の両方から拾う --- */
function ambDayEvents(date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const key = `${y}_${m}_${d}`;
  const raw = [googleEventsCache[key], localStorage.getItem(`event_${key}`)]
    .filter(Boolean)
    .join(' / ');
  if (!raw) return [];

  return raw
    .split(' / ')
    .map((str) => str.trim())
    .filter(Boolean)
    .map((str) => {
      const mt = str.match(/^(\d{1,2}):(\d{2})\s+(.*)$/);
      if (mt) {
        const hh = parseInt(mt[1], 10);
        const mm = parseInt(mt[2], 10);
        return {
          at: new Date(y, m, d, hh, mm),
          hour: hh + mm / 60,
          time: `${String(hh).padStart(2, '0')}:${mt[2]}`,
          title: mt[3],
          timed: true,
        };
      }
      /* 時刻のない終日予定。並びの都合で一日の終わりに置く */
      return { at: new Date(y, m, d, 23, 59), hour: 23.98, time: '', title: str, timed: false };
    })
    .sort((a, b) => a.at - b.at);
}

/* --- 昼の時間帯。取れないときは 6:00-18:00 で代用する --- */
function ambDaylight() {
  const w = ambWeatherData();
  if (w && ambDaylight._src === w) return ambDaylight._v;
  const fallback = { from: 6, to: 18, real: false };
  if (!w || !w.daily || !w.daily.sunrise || !w.daily.sunset) return fallback;
  const rise = new Date(w.daily.sunrise[0]);
  const set = new Date(w.daily.sunset[0]);
  if (isNaN(rise) || isNaN(set)) return fallback;
  ambDaylight._src = w;
  ambDaylight._v = {
    from: rise.getHours() + rise.getMinutes() / 60,
    to: set.getHours() + set.getMinutes() / 60,
    real: true,
    riseText: `${rise.getHours()}:${String(rise.getMinutes()).padStart(2, '0')}`,
    setText: `${set.getHours()}:${String(set.getMinutes()).padStart(2, '0')}`,
  };
  return ambDaylight._v;
}

/* --- 今日の0時から24時まで、1時間ごとの気温と降水確率 --- */
function ambHourlyToday() {
  const w = ambWeatherData();
  if (!w || !w.hourly || !w.hourly.time || !w.hourly.temperature_2m) return null;
  const n = ambNow();
  const ck = n.toDateString();
  if (ambHourlyToday._src === w && ambHourlyToday._day === ck) return ambHourlyToday._v;
  ambHourlyToday._src = w;
  ambHourlyToday._day = ck;
  const key = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(
    n.getDate(),
  ).padStart(2, '0')}`;
  const start = w.hourly.time.findIndex((s) => s.indexOf(key) === 0);
  if (start < 0) return null;

  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const idx = start + i;
    if (idx >= w.hourly.time.length) break;
    const temp = w.hourly.temperature_2m[idx];
    if (typeof temp !== 'number') break;
    pts.push({
      h: i,
      temp,
      pop: w.hourly.precipitation_probability ? w.hourly.precipitation_probability[idx] || 0 : 0,
    });
  }
  ambHourlyToday._v = pts.length >= 24 ? pts : null;
  return ambHourlyToday._v;
}

/* --- 折れ線を角の立たない曲線にする（Catmull-Rom をベジエへ） --- */
function ambSmoothPath(P) {
  if (P.length < 2) return '';
  let d = `M ${P[0].x.toFixed(1)} ${P[0].y.toFixed(1)}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i];
    const p1 = P[i];
    const p2 = P[i + 1];
    const p3 = P[i + 2] || P[i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(
      1,
    )}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function ambMusicData() {
  const box = document.getElementById('music-card-container');
  if (!box || !box.classList.contains('music-active')) return null;
  const title = document.getElementById('track-title')?.innerText || '';
  if (!title) return null;
  /* 元のカードがすでに取ってきているものを読む。取得の口を二重に持たない */
  const art = document.getElementById('album-art')?.style.backgroundImage || '';
  return {
    title,
    artist: document.getElementById('track-artist')?.innerText || '',
    art: art && art !== 'none' ? art : '',
    playing: box.classList.contains('music-playing'),
    pos: parseFloat(box.dataset.pos),
    dur: parseFloat(box.dataset.dur),
    at: parseFloat(box.dataset.at),
  };
}

/* いま何割まで来たか。読んだ時刻からの経過を足して補う。
   長さが取れない配信元や生放送では null を返し、線はただの区切りに戻る。 */
function ambMusicProgress(music) {
  if (!music || !(music.dur > 0) || !isFinite(music.pos) || music.pos < 0) return null;
  let p = music.pos;
  if (music.playing && isFinite(music.at)) p += (Date.now() - music.at) / 1000;
  return Math.max(0, Math.min(1, p / music.dur));
}

function ambIsNight() {
  const p = ambPrefs();
  if (p.ambientNight === false) return false;
  const h = ambNow().getHours();
  const from = parseInt(p.ambientNightStart ?? '22', 10);
  const to = parseInt(p.ambientNightEnd ?? '5', 10);
  if (isNaN(from) || isNaN(to) || from === to) return false;
  return from < to ? h >= from && h < to : h >= from || h < to;
}

const AMB_NIGHT_COLORS = { amber: '#ffb37a', red: '#ff5c47', white: '#dfe7ec' };

/* 動きの量。一枚ものになったので、動くのは数字とドリフトだけ */
function ambMotionTier() {
  const p = ambPrefs();
  const set = p.ambientMotion || 'auto';
  if (set === 'full' || set === 'light') return 'full';
  if (set === 'reduced' || set === 'minimal') return 'reduced';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced';
  if (p.themeMode === 'lite') return 'reduced';
  return 'full';
}

function ambApplyPrefs() {
  const root = AMBIENT.root;
  if (!root) return;
  const p = ambPrefs();
  root.dataset.motion = ambMotionTier();
  root.dataset.burnin = p.ambientBurnIn === false ? 'off' : 'on';
  root.dataset.np = p.ambientMusic === false ? 'off' : 'on';
  root.style.setProperty(
    '--amb-night-color',
    AMB_NIGHT_COLORS[p.ambientNightColor] || AMB_NIGHT_COLORS.amber,
  );
}

/* =======================================================================
   空の色

   色は世界から取る。装飾からは取らない ── これが「綺麗」と「AIっぽい」の
   分かれ目だと考えている。ここでは日の出/日の入りから太陽の高さを出し、
   天気で彩度を落として、画面の地の色を決める。
   明るさは常に十数%以下に抑える。OLEDで焼き付かせないためと、
   文字のコントラストを落とさないため。
   ======================================================================= */

/* 太陽の高さの近似。1=南中、0=地平線、-1=真夜中 */
function ambSunElev(now, light) {
  const h = now.getHours() + now.getMinutes() / 60;
  const sr = light.from;
  const ss = light.to;
  if (ss <= sr) return 0;
  const noon = (sr + ss) / 2;
  const half = Math.max(0.5, (ss - sr) / 2);
  if (h >= sr && h <= ss) return Math.cos(((h - noon) / half) * (Math.PI / 2));
  const nightHalf = Math.max(0.5, (24 - (ss - sr)) / 2);
  const dist = h < sr ? sr - h : h - ss;
  return -Math.min(1, dist / nightHalf);
}

/* 正なら赤へ、負なら青へ。朝と夕を分けるためだけに使う */
function ambWarm(c, k) {
  return [c[0] * (1 + k * 0.55), c[1] * (1 - Math.abs(k) * 0.06), c[2] * (1 - k * 0.45)].map((v) =>
    Math.max(0, Math.min(255, Math.round(v))),
  );
}

/* 天気でどれだけ色を抜くか */
function ambSkyDull(code) {
  if (code === 0) return 0.05;
  if (code <= 2) return 0.2;
  if (code === 3) return 0.48;
  if (code === 45 || code === 48) return 0.62;
  if (code >= 95) return 0.72;
  if (code >= 51) return 0.64;
  return 0.4;
}

const AMB_SKY_KEYS = [
  { e: -1.0, top: [3, 4, 9], hor: [6, 7, 13] },
  { e: -0.4, top: [5, 7, 16], hor: [12, 12, 24] },
  { e: -0.08, top: [8, 11, 25], hor: [30, 20, 30] },
  { e: 0.06, top: [11, 16, 38], hor: [62, 38, 40] },
  { e: 0.22, top: [13, 20, 46], hor: [72, 44, 42] },
  { e: 0.55, top: [14, 24, 56], hor: [34, 48, 76] },
  { e: 1.0, top: [12, 30, 64], hor: [30, 52, 84] },
];

function ambMix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function ambRgb(c, a) {
  return a === undefined ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

function ambDesaturate(c, amount) {
  const l = Math.round(0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]);
  return ambMix(c, [l, l, l], amount);
}

function ambSkyColors(now) {
  const light = ambDaylight();
  const e = ambSunElev(now, light);
  const K = AMB_SKY_KEYS;
  let i = 0;
  while (i < K.length - 2 && e > K[i + 1].e) i++;
  const span = K[i + 1].e - K[i].e;
  const t = span ? Math.max(0, Math.min(1, (e - K[i].e) / span)) : 0;

  let top = ambMix(K[i].top, K[i + 1].top, t);
  let hor = ambMix(K[i].hor, K[i + 1].hor, t);

  /* 朝と夕を同じ色にしない。太陽高度だけで引くと、5時と18時が鏡写しになる。
     実際には日中の対流で舞い上がった塵が夕方に残るので、同じ高さでも夕焼けのほうが赤い。
     朝はその分だけ澄んでいる。地平線に近いときほど強く効かせる。 */
  const near = Math.max(0, 1 - Math.abs(e) / 0.45);
  if (near > 0) {
    const hh = now.getHours() + now.getMinutes() / 60;
    const k = near * 0.16 * (hh >= (light.from + light.to) / 2 ? 1 : -1);
    hor = ambWarm(hor, k);
    top = ambWarm(top, k * 0.35);
  }

  const w = ambWeatherData();
  if (w) {
    const dull = ambSkyDull(w.cur.weathercode);
    top = ambDesaturate(top, dull);
    hor = ambDesaturate(hor, dull);
    if (w.cur.weathercode >= 51) {
      top = ambMix(top, [0, 0, 0], 0.2);
      hor = ambMix(hor, [0, 0, 0], 0.2);
    }
  }
  return { top, hor, elev: e, dull: w ? ambSkyDull(w.cur.weathercode) : 0 };
}

/* 地の色。いちばん明るい帯（地平線）を、下の一日の帯と同じ高さに置く */
function ambApplySky(now) {
  const root = AMBIENT.root;
  const sc = ambSkyColors(now);
  if (!root) return sc;
  const prefs = ambPrefs();
  if (prefs.ambientSky === false) {
    if (root.style.backgroundImage !== 'none') root.style.backgroundImage = 'none';
    root.style.removeProperty('--amb-fg');
    const g0 = document.getElementById('amb-lg0');
    if (g0) g0.setAttribute('stop-color', 'rgb(10,10,12)');
    return sc;
  }

  const { top, hor } = sc;
  /* 空は素直に一枚。暖色は太陽が受け持つので、ここでは横一面に敷かない */
  const mid = ambMix(top, hor, 0.45);
  const g =
    `linear-gradient(180deg, ${ambRgb(top)} 0%, ${ambRgb(mid)} 46%, ` +
    `${ambRgb(hor)} 66%, ${ambRgb(hor)} 100%)`;
  if (root.style.backgroundImage !== g) root.style.backgroundImage = g;

  /* 地面は地平線の色をぐっと落としたもの。空と地続きに見せる */
  const g0 = document.getElementById('amb-lg0');
  if (g0) g0.setAttribute('stop-color', ambRgb(ambMix(hor, [0, 0, 0], 0.8)));

  /* 文字も同じ光を受ける。夕方はわずかに暖かい白、昼はわずかに冷たい白。
     気づかない程度でいい ── 画面全体が一つの素材に見えることが目的 */
  const warm = (hor[0] - hor[2]) / 255;
  const fg =
    warm > 0
      ? [255, Math.round(255 - warm * 11), Math.round(255 - warm * 28)]
      : [Math.round(255 + warm * 16), Math.round(255 + warm * 6), 255];
  root.style.setProperty('--amb-fg', ambRgb(fg));
  return sc;
}

/* ------------------------------------------------------------- 時刻の桁組み */

function ambTimeParts() {
  const prefs = ambPrefs();
  const now = ambNow();
  let h = now.getHours();
  let suffix = '';
  if (prefs.use12hFormat) {
    suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
  }
  const hh = prefs.use12hFormat ? String(h) : String(h).padStart(2, '0');
  return { text: `${hh}:${String(now.getMinutes()).padStart(2, '0')}`, suffix };
}

function ambBuildFace(el, str) {
  el.textContent = '';
  for (const ch of str) {
    const cell = document.createElement('span');
    if (ch >= '0' && ch <= '9') {
      cell.className = 'amb-dg';
      const a = document.createElement('i');
      const b = document.createElement('i');
      a.textContent = ch;
      b.textContent = ch;
      cell.appendChild(a);
      cell.appendChild(b);
    } else {
      cell.className = 'amb-sep-ch';
      cell.textContent = ch;
    }
    el.appendChild(cell);
  }
}

function ambRollFace(el, str) {
  if (!el) return;
  if (el.children.length !== str.length) {
    ambBuildFace(el, str);
    return;
  }
  const still = ambMotionTier() === 'reduced';
  for (let i = 0; i < str.length; i++) {
    const cell = el.children[i];
    if (!cell.classList.contains('amb-dg')) continue;
    const ch = str[i];
    if (cell.children[0].textContent === ch) continue;
    if (still) {
      cell.children[0].textContent = ch;
      cell.children[1].textContent = ch;
      continue;
    }
    cell.children[1].textContent = ch;
    cell.classList.add('rolling');
    setTimeout(() => {
      cell.classList.remove('rolling');
      cell.children[0].textContent = ch;
      cell.children[1].textContent = ch;
    }, 660);
  }
}

/* ----------------------------------------------------------------- 文字組み */

function ambDateText(date) {
  const days = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
  const months = [
    t('jan'),
    t('feb'),
    t('mar'),
    t('apr'),
    t('may'),
    t('jun'),
    t('jul'),
    t('aug'),
    t('sep'),
    t('oct'),
    t('nov'),
    t('dec'),
  ];
  const mStr = months[date.getMonth()];
  const dStr = days[date.getDay()];
  const lang = ambLang();
  if (lang === 'ja' || lang === 'zh') return `${mStr}${date.getDate()}日 (${dStr})`;
  if (lang === 'ko') return `${mStr} ${date.getDate()}일 (${dStr})`;
  return `${mStr} ${date.getDate()} (${dStr})`;
}

function ambGreeting() {
  const prefs = ambPrefs();
  const name = prefs.userName || 'Guest';
  const h = ambNow().getHours();
  if (h >= 5 && h < 11) return t('greeting_morning', { name });
  if (h >= 11 && h < 18) return t('greeting_afternoon', { name });
  if (h >= 18 && h < 23) return t('greeting_evening', { name });
  return t('greeting_night', { name });
}

function ambRelative(target) {
  const diff = target.getTime() - ambNow().getTime();
  if (diff <= 0) return t('amb_now');
  const mins = Math.round(diff / 60000);
  if (mins < 60) return t('amb_in_min', { n: mins });
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (hours < 24) {
    return rest ? t('amb_in_hm', { h: hours, m: rest }) : t('amb_in_h', { h: hours });
  }
  return t('amb_in_d', { n: Math.round(hours / 24) });
}

/* ---------------------------------------------------------------- 組み立て */

function ambBuild() {
  if (AMBIENT.root) return AMBIENT.root;

  const root = document.createElement('div');
  root.id = 'amb-root';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', t('ambient_mode_tooltip'));
  root.innerHTML = `
    <div class="amb-shell" id="amb-shell">
      <div class="amb-sun" id="amb-sun"></div>
      <div class="amb-moon" id="amb-moon"><i></i></div>

      <div class="amb-landwrap" id="amb-landwrap">
      <svg class="amb-land" id="amb-land" viewBox="0 0 ${AMB_W} ${AMB_H}"
           preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="amb-lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" id="amb-lg0"/>
            <stop offset="0.3" stop-color="rgb(9,8,10)"/>
            <stop offset="1" stop-color="rgb(4,4,6)"/>
          </linearGradient>
        </defs>
        <path class="amb-land-fill" id="amb-land-fill" fill="url(#amb-lg)"/>
        <path class="amb-land-edge" id="amb-land-edge" fill="none"
              vector-effect="non-scaling-stroke"/>
        <g class="amb-marks" id="amb-marks" vector-effect="non-scaling-stroke"></g>
        <circle class="amb-next-dot" id="amb-next-dot" r="4.5" style="display:none"/>
        <line class="amb-nowmark" id="amb-nowmark" vector-effect="non-scaling-stroke"/>
      </svg>
      </div>

      <div class="amb-clock" id="amb-clock">
        <div class="amb-face" id="amb-face"></div>
        <div class="amb-ampm" id="amb-ampm"></div>
      </div>
      <div class="amb-line">
        <div class="amb-date" id="amb-date"></div>
        <div class="amb-meta" id="amb-meta"></div>
      </div>
      <div class="amb-greet" id="amb-greet"></div>

      <span class="amb-peak amb-num" id="amb-hi"></span>
      <span class="amb-peak amb-num" id="amb-lo"></span>

      <div class="amb-ground">
        <div class="amb-agenda">
          <div class="amb-k" id="amb-k"></div>
          <div class="amb-hero" id="amb-hero"></div>
          <div class="amb-tail amb-num" id="amb-tail"></div>
          <div class="amb-np" id="amb-np">
            <div class="amb-np-art" id="amb-np-art"></div>
            <div class="amb-np-t" id="amb-np-t"></div>
            <div class="amb-np-a" id="amb-np-a"></div>
            <div class="amb-np-ctl" id="amb-np-ctl">
              <button type="button" class="amb-np-b" id="amb-np-prev" aria-label="${t('amb_track_prev')}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11.22 11.15 19.3 5.76c.72-.48 1.7.04 1.7.9v10.68c0 .86-.98 1.38-1.7.9l-8.08-5.39a1.01 1.01 0 0 1 0-1.7ZM2.22 11.15 10.3 5.76c.72-.48 1.7.04 1.7.9v10.68c0 .86-.98 1.38-1.7.9L2.22 12.85a1.01 1.01 0 0 1 0-1.7Z"/></svg>
              </button>
              <button type="button" class="amb-np-b amb-np-play" id="amb-np-play" aria-label="${t('amb_playpause')}"></button>
              <button type="button" class="amb-np-b" id="amb-np-next" aria-label="${t('amb_track_next')}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.78 12.85 4.7 18.24c-.72.48-1.7-.04-1.7-.9V6.66c0-.86.98-1.38 1.7-.9l8.08 5.39a1.01 1.01 0 0 1 0 1.7ZM21.78 12.85l-8.08 5.39c-.72.48-1.7-.04-1.7-.9V6.66c0-.86.98-1.38 1.7-.9l8.08 5.39a1.01 1.01 0 0 1 0 1.7Z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="amb-ctl" id="amb-ctl">
      <button type="button" class="amb-btn" id="amb-close" aria-label="${t('amb_exit')}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(root);
  AMBIENT.root = root;

  root.querySelector('#amb-close').onclick = (e) => {
    e.stopPropagation();
    ambExit();
  };

  for (const [id, cmd] of [
    ['amb-np-prev', 'prev'],
    ['amb-np-play', 'toggle'],
    ['amb-np-next', 'next'],
  ]) {
    root.querySelector('#' + id).onclick = (e) => {
      e.stopPropagation();
      ambMediaCommand(cmd);
      ambWake(); /* 押したらしばらく操作を出したままにする */
    };
  }
  return root;
}

function ambSet(id, html) {
  const el = document.getElementById(id);
  if (el && el.innerHTML !== html) el.innerHTML = html;
}

function ambSetText(id, txt) {
  const el = document.getElementById(id);
  if (el && el.textContent !== txt) el.textContent = txt;
}

/* 時計は tabular-nums なので全桁が同じ送り幅になる。そのぶん「1」のように
   字面の細い数字は左右のアキが大きく、箱の左端と字の左端がずれる。
   時刻によって見え方が変わってしまうので、
   実際の桁幅（DOM）と字面の幅（canvas）から左アキを出して日付をそこへ寄せる。 */
function ambAlignDate() {
  const clock = document.getElementById('amb-clock');
  const face = document.getElementById('amb-face');
  const date = document.getElementById('amb-date');
  if (!clock || !face || !date) return;

  const cell = face.querySelector('.amb-dg');
  const ch = cell ? (cell.textContent || '').charAt(0) : '';
  const advance = cell ? cell.getBoundingClientRect().width : 0;
  const cs = getComputedStyle(clock);
  const size = parseFloat(cs.fontSize);
  if (!ch || !advance || !size) return;

  const key = ch + '|' + Math.round(advance) + '|' + cs.fontWeight + '|' + cs.fontFamily;
  if (ambAlignDate._key !== key) {
    ambAlignDate._key = key;
    let ink = 0;
    try {
      const cv = (ambAlignDate._cv = ambAlignDate._cv || document.createElement('canvas'));
      const ctx = cv.getContext('2d');
      ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
      const m = ctx.measureText(ch);
      const inkW = (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0);
      /* 等幅数字は字面が送り幅の中央に置かれるので、左右のアキは半分ずつ */
      if (inkW > 0 && inkW < advance) ink = (advance - inkW) / 2;
    } catch (e) {
      ink = 0;
    }
    if (!isFinite(ink)) ink = 0;
    ambAlignDate._px = Math.max(0, Math.min(advance * 0.42, ink)).toFixed(1) + 'px';
  }

  const px = ambAlignDate._px;
  const greet = document.getElementById('amb-greet');
  if (date.style.marginLeft !== px) date.style.marginLeft = px;
  if (greet && greet.style.marginLeft !== px) greet.style.marginLeft = px;
}

/* ================================================================= 稜線
   画面の地平線は今日の気温の形をしている。昼に高く、朝夕に低い。
   予定はその稜線に立つ目盛りになり、太陽は「時刻＝横、高度＝高さ」に置く。
   数字はすべて 1600x900 のビューボックス上で持ち、表示は伸縮させる。 */

const AMB_W = 1600;
const AMB_H = 900;
const AMB_RIDGE_BASE = 510; /* いちばん低い気温のときの地平線 */
const AMB_RIDGE_LIFT = 62; /* 最低から最高までで持ち上がる量 */
const AMB_SUN_RISE = 400; /* 太陽高度1.0のときの高さ */

function ambRidgeX(h) {
  return (h / 24) * AMB_W;
}

/* 今日の気温の幅を、稜線の高さに写す */
function ambRidgeScale(pts) {
  let lo = Infinity;
  let hi = -Infinity;
  let loH = 5;
  let hiH = 14;
  for (const p of pts) {
    if (p.temp < lo) {
      lo = p.temp;
      loH = p.h;
    }
    if (p.temp > hi) {
      hi = p.temp;
      hiH = p.h;
    }
  }
  const span = Math.max(1, hi - lo);
  return { lo, hi, loH, hiH, y: (t) => AMB_RIDGE_BASE - ((t - lo) / span) * AMB_RIDGE_LIFT };
}

/* 稜線。気温が取れないとき、あるいは切ってあるときは水平にする */
function ambRidge() {
  const flat = {
    pts: null,
    y: () => AMB_RIDGE_BASE - AMB_RIDGE_LIFT * 0.5,
    at: () => AMB_RIDGE_BASE - AMB_RIDGE_LIFT * 0.5,
    temp: null,
    lo: null,
    hi: null,
  };
  if (ambPrefs().ambientCurve === false) return flat;
  const pts = ambHourlyToday();
  if (!pts || pts.length < 24) return flat;
  const sc = ambRidgeScale(pts);
  const temp = (h) => {
    const i = Math.max(0, Math.min(pts.length - 2, Math.floor(h)));
    const k = Math.max(0, Math.min(1, h - i));
    return pts[i].temp + (pts[i + 1].temp - pts[i].temp) * (k * k * (3 - 2 * k));
  };
  return {
    pts,
    y: sc.y,
    at: (h) => sc.y(temp(h)),
    temp,
    lo: sc.lo,
    hi: sc.hi,
    loH: sc.loH,
    hiH: sc.hiH,
  };
}

function ambRidgePath(ridge) {
  if (ambRidgePath._src === ridge.pts && ambRidgePath._v) return ambRidgePath._v;
  ambRidgePath._src = ridge.pts;
  ambRidgePath._v = ambBuildRidgePath(ridge);
  return ambRidgePath._v;
}

function ambBuildRidgePath(ridge) {
  if (!ridge.pts) {
    const y = ridge.at(0).toFixed(1);
    return `M 0 ${y} L ${AMB_W} ${y}`;
  }
  return ambSmoothPath(ridge.pts.map((p) => ({ x: ambRidgeX(p.h), y: ridge.y(p.temp) })));
}

function ambRenderLand(now, events, ridge, prefs) {
  const edge = document.getElementById('amb-land-edge');
  const fill = document.getElementById('amb-land-fill');
  if (!edge || !fill) return;

  const d = ambRidgePath(ridge);
  if (ambRenderLand._d !== d) {
    ambRenderLand._d = d;
    edge.setAttribute('d', d);
    fill.setAttribute('d', `${d} L ${AMB_W} ${AMB_H} L 0 ${AMB_H} Z`);
  }

  /* 予定は稜線から立ち上がる短い棒。文字は下に逃がしてあるので衝突しない */
  const timed = prefs.ambientSchedule === false ? [] : events.filter((e) => e.timed);
  const key = timed.map((e) => e.hour.toFixed(3)).join(',') + '|' + d;
  if (ambRenderLand._marks !== key) {
    ambRenderLand._marks = key;
    ambSet(
      'amb-marks',
      timed
        .map((e) => {
          const x = ambRidgeX(e.hour).toFixed(1);
          const y = ridge.at(e.hour);
          return `<line x1="${x}" y1="${(y - 3).toFixed(1)}" x2="${x}" y2="${(y - 21).toFixed(1)}"/>`;
        })
        .join(''),
    );
  }

  const nowH = now.getHours() + now.getMinutes() / 60;
  const nx = ambRidgeX(nowH);
  const ny = ridge.at(nowH);
  const mark = document.getElementById('amb-nowmark');
  if (mark) {
    mark.setAttribute('x1', nx.toFixed(1));
    mark.setAttribute('x2', nx.toFixed(1));
    mark.setAttribute('y1', ny.toFixed(1));
    mark.setAttribute('y2', (ny - 14).toFixed(1));
  }

  const upcoming = timed.filter((e) => e.at.getTime() >= now.getTime());
  const dot = document.getElementById('amb-next-dot');
  if (dot) {
    if (upcoming.length) {
      const h = upcoming[0].hour;
      dot.setAttribute('cx', ambRidgeX(h).toFixed(1));
      dot.setAttribute('cy', (ridge.at(h) - 24).toFixed(1));
      dot.style.display = '';
    } else {
      dot.style.display = 'none';
    }
  }

  /* 最高と最低は、その時刻の稜線の上に置く */
  const hi = document.getElementById('amb-hi');
  const lo = document.getElementById('amb-lo');
  for (const [el, h, v] of [
    [hi, ridge.hiH, ridge.hi],
    [lo, ridge.loH, ridge.lo],
  ]) {
    if (!el) continue;
    if (v == null) {
      el.style.display = 'none';
      continue;
    }
    el.style.display = '';
    /* 最低気温が0時や24時に来ると、中央そろえのままでは端で半分切れる。
       端に寄ったときだけ、外側の辺で揃える。 */
    const px = (ambRidgeX(h) / AMB_W) * 100;
    if (px < 4) {
      el.style.left = '0%';
      el.style.transform = 'translate(0, -100%)';
    } else if (px > 96) {
      el.style.left = '100%';
      el.style.transform = 'translate(-100%, -100%)';
    } else {
      el.style.left = px.toFixed(2) + '%';
      el.style.transform = 'translate(-50%, -100%)';
    }
    el.style.top = (((ridge.y(v) - 13) / AMB_H) * 100).toFixed(2) + '%';
    ambSetText(el.id, `${Math.round(v)}°`);
    /* 一日の最低は明け方に来るので、稜線の左端 ＝ 挨拶や日付の真下に立ちやすい。
       下へ回しても今度は下段とぶつかる。置き場所が無いときは、出さない ──
       稜線の形がすでに同じことを言っているので、無くても困らない。 */
    const r = el.getBoundingClientRect();
    const pad = 6;
    /* 日付の行は天気を右端に送るために全幅の箱になった。箱で当たりを見ると
       空いているところでも当たってしまうので、中の文字そのものと比べる。 */
    const hits = ['#amb-date', '#amb-meta', '.amb-greet', '.amb-ground'].some((sel) => {
      const t2 = document.querySelector(sel);
      if (!t2 || !t2.textContent.trim() || getComputedStyle(t2).display === 'none') return false;
      const b = t2.getBoundingClientRect();
      return (
        r.left < b.right + pad &&
        r.right > b.left - pad &&
        r.top < b.bottom + pad &&
        r.bottom > b.top - pad
      );
    });
    if (hits) el.style.display = 'none';
  }
}

/* --- 月。日が沈んだら、太陽と同じ仕組みで月に入れ替わる。
       月齢は基準の新月からの日数、位置は月齢ぶんずれた南中時刻から。
       満月なら真夜中に高く、新月なら太陽と一緒に沈んでいる。 --- */
const AMB_SYNODIC = 29.530588853;
const AMB_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

function ambMoon(now) {
  const age =
    ((((now.getTime() - AMB_NEW_MOON) / 86400000) % AMB_SYNODIC) + AMB_SYNODIC) % AMB_SYNODIC;
  const phase = age / AMB_SYNODIC; /* 0=新月 0.5=満月 */
  const illum = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const light = ambDaylight();
  const transit = ((light.from + light.to) / 2 + phase * 24) % 24;
  const h = now.getHours() + now.getMinutes() / 60;
  let d = h - transit;
  while (d > 12) d -= 24;
  while (d < -12) d += 24;
  return { phase, illum, waxing: phase < 0.5, elev: Math.cos((d / 6.2) * (Math.PI / 2)) };
}

function ambPlaceMoon(now, ridge, sky) {
  const el = document.getElementById('amb-moon');
  if (!el) return;
  const m = ambMoon(now);
  /* 明るいうちは出さない。細すぎる月も見えないので出さない */
  const show =
    ambPrefs().ambientSky !== false && sky.elev <= 0.02 && m.elev > 0.02 && m.illum > 0.04;
  if (!show) {
    if (el.style.display !== 'none') {
      el.style.display = 'none';
      delete el.dataset.at;
    }
    return;
  }
  el.style.display = '';
  const mh = now.getHours() + now.getMinutes() / 60;
  const op = ((0.5 + 0.5 * m.illum) * (1 - sky.dull * 0.6)).toFixed(2);
  ambMoveOrb(el, ambRidgeX(mh), ridge.at(mh) - m.elev * AMB_SUN_RISE * 0.82, op);
  /* 影の円を、光っている側と反対へずらす。ずらし量がそのまま満ち欠け */
  const shift = ((m.waxing ? -1 : 1) * m.illum * 100).toFixed(1);
  if (el.dataset.ph !== shift) {
    el.dataset.ph = shift;
    el.firstElementChild.style.transform = `translateX(${shift}%)`;
  }
}

/* --- 太陽。横は時刻、高さは太陽高度。低いほど大きく赤い --- */
function ambSunColor(e) {
  if (e < 0.16) return [255, 150, 74];
  if (e < 0.45) return ambMix([255, 150, 74], [255, 206, 150], (e - 0.16) / 0.29);
  return ambMix([255, 206, 150], [228, 238, 255], Math.min(1, (e - 0.45) / 0.55));
}

function ambPlaceSun(now, ridge, sky) {
  const el = document.getElementById('amb-sun');
  if (!el) return;
  if (ambPrefs().ambientSky === false || sky.elev <= 0) {
    if (el.style.display !== 'none') {
      el.style.display = 'none';
      delete el.dataset.at;
    }
    return;
  }
  el.style.display = '';
  const h = now.getHours() + now.getMinutes() / 60;
  const e = Math.max(0, Math.min(1, sky.elev));
  const w = 44 - 20 * e;
  const c = ambDesaturate(ambSunColor(e), sky.dull * 0.7);
  const a = (0.58 - 0.3 * e) * (1 - sky.dull * 0.55);
  ambMoveOrb(el, ambRidgeX(h), ridge.at(h) - e * AMB_SUN_RISE, '1');
  /* 大きさは0.5%刻みに丸める。連続で変えるとそのたびにレイアウトが走る */
  const ws = (Math.round(w * 2) / 2).toFixed(1);
  if (el.dataset.w !== ws) {
    el.dataset.w = ws;
    el.style.width = ws + '%';
    el.style.height = (parseFloat(ws) * (AMB_W / AMB_H)).toFixed(1) + '%';
  }
  const g =
    `radial-gradient(closest-side, ${ambRgb(c, a.toFixed(2))} 0%, ` +
    `${ambRgb(c, (a * 0.34).toFixed(2))} 26%, transparent 66%)`;
  if (el.style.backgroundImage !== g) el.style.backgroundImage = g;
}

/* 空にあるものの置き方。％やlefttopではなく transform で動かす ──
   合成だけで済むので、動かしてもレイアウトも再描画も起きない。 */
function ambMoveOrb(el, vx, vy, opacity) {
  const root = AMBIENT.root;
  if (!root) return;
  const x = (vx / AMB_W) * root.clientWidth;
  const y = (vy / AMB_H) * root.clientHeight;
  const key = Math.round(x) + ',' + Math.round(y);
  if (el.dataset.at === key && el.style.opacity === opacity) return;
  const tf = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -50%)`;

  /* 出てくるときは、いた場所の記録が無い。そのまま動かすと
     前にいた位置（何時間も前）や画面の隅から2秒かけて飛んでくる。
     位置だけ先に置いて、明るさだけを昇らせる。 */
  if (!el.dataset.at) {
    el.style.transition = 'none';
    el.style.transform = tf;
    el.style.opacity = '0';
    void el.offsetWidth;
    el.style.transition = '';
  } else if (el.style.transform !== tf) {
    el.style.transform = tf;
  }
  el.dataset.at = key;
  if (el.style.opacity !== opacity) el.style.opacity = opacity;
}

/* =========================================================== 下段の文字
   主役は1件だけ。残りは横一列に流す。縦に積まないので何件あっても崩れない。 */

function ambHM(h) {
  const hh = Math.floor(((h % 24) + 24) % 24);
  const mm = Math.round((h - Math.floor(h)) * 60) % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/* 予定がない日は「自分の次」ではなく「その日の次」を出す。
   いちばん早く来るものを1つだけ。作り物は入れない。 */
function ambDayMoment(now, ridge) {
  const h = now.getHours() + now.getMinutes() / 60;
  const light = ambDaylight();
  const out = [];

  if (ridge.pts) {
    /* まとまった雨のはじまり。ぽつぽつは出さない */
    let wet = null;
    for (const p of ridge.pts) {
      if (p.h > h && p.pop >= 50) {
        wet = p.h;
        break;
      }
    }
    if (wet != null) out.push({ at: wet, name: t('amb_rain_from') });
    if (ridge.hiH != null && h < ridge.hiH) {
      out.push({ at: ridge.hiH, name: t('amb_day_high', { n: Math.round(ridge.hi) }) });
    }
  }
  if (light.real) {
    if (h < light.from) out.push({ at: light.from, name: t('amb_sunrise') });
    if (h < light.to) out.push({ at: light.to, name: t('amb_sunset') });
    out.push({ at: light.from + 24, name: t('amb_sunrise') });
  }
  if (!out.length) return null;
  out.sort((x, y2) => x.at - y2.at);
  const pick = out[0];
  const target = new Date(now);
  target.setHours(0, 0, 0, 0);
  target.setMinutes(Math.round(pick.at * 60));
  return { time: ambHM(pick.at), name: pick.name, rel: ambRelative(target) };
}

function ambRenderAgenda(now, events, ridge, prefs) {
  const off = prefs.ambientSchedule === false;
  const upcoming = off ? [] : events.filter((e) => e.at.getTime() >= now.getTime());

  if (upcoming.length) {
    const n = upcoming[0];
    ambSetText('amb-k', t('amb_next_up'));
    document.getElementById('amb-k').classList.remove('soft');
    ambSet(
      'amb-hero',
      (n.time ? `<span class="amb-hero-t amb-num">${n.time}</span>` : '') +
        `<span class="amb-hero-n">${n.title}</span>` +
        (n.timed ? `<span class="amb-hero-r">${ambRelative(n.at)}</span>` : ''),
    );
    ambSet(
      'amb-tail',
      upcoming
        .slice(1, 5)
        .map((e) => `<span><b>${e.time || '—'}</b> ${e.title}</span>`)
        .join(''),
    );
    return;
  }

  /* 予定がない日 */
  const k = document.getElementById('amb-k');
  if (k) k.classList.add('soft');
  ambSetText('amb-k', off ? '' : events.length ? t('amb_today_done') : t('amb_today_free'));
  const m = ambDayMoment(now, ridge);
  ambSet(
    'amb-hero',
    m
      ? `<span class="amb-hero-t amb-num">${m.time}</span>` +
          `<span class="amb-hero-n">${m.name}</span>` +
          `<span class="amb-hero-r">${m.rel}</span>`
      : '',
  );
  ambSet('amb-tail', '');
}

/* ================================================================ 描画 */

function ambRender() {
  const root = AMBIENT.root;
  if (!root) return;
  const prefs = ambPrefs();
  const now = ambNow();

  /* --- 夜は時計だけに落とす。1日に2回しか変わらない --- */
  const night = ambIsNight();
  if (AMBIENT.wasNight !== night) {
    root.dataset.night = night ? 'on' : 'off';
    AMBIENT.wasNight = night;
    if (night) {
      const bright = parseInt(prefs.ambientNightBrightness ?? '65', 10);
      root.style.setProperty(
        '--amb-night-alpha',
        Math.max(0.12, (isNaN(bright) ? 65 : bright) / 100),
      );
    }
  }

  ambSetText('amb-date', ambDateText(now));
  ambAlignDate();

  const h = now.getHours();
  const greetOn = prefs.ambientGreeting !== false && h >= 5 && h < 11;
  ambSetText('amb-greet', greetOn ? ambGreeting() : '');

  if (night) return;

  const ridge = ambRidge();
  const sky = ambApplySky(now);
  ambPlaceSun(now, ridge, sky);
  ambPlaceMoon(now, ridge, sky);

  /* --- 天気は日付と同じ一行に置く。数字だけ大きくしない --- */
  const w = prefs.ambientWeather === false ? null : ambWeatherData();
  if (w) {
    const info = ambWeatherVisual(w.cur.weathercode);
    ambSet(
      'amb-meta',
      `<i>${info.text}</i><span class="amb-num">${Math.round(w.cur.temperature)}°</span>`,
    );
  } else {
    ambSet('amb-meta', '');
  }

  const events = ambDayEvents(now);
  ambRenderLand(now, events, ridge, prefs);
  ambRenderAgenda(now, events, ridge, prefs);
  ambRenderNowPlaying(prefs);
}
/* 再生中。左下の空いているところに置くので、
   曲が始まっても止まっても、時計も予定も動かない。
   操作は画面を触ったとき（.amb-awake）だけ浮かび上がる。 */
function ambRenderNowPlaying(prefs) {
  const el = document.getElementById('amb-np');
  if (!el) return;
  const music = prefs.ambientMusic === false ? null : ambMusicData();
  /* 設定で切ってあるときだけ場所ごと消す。曲が止まっただけなら
     行は残しておく ── 消すと下段全体が沈んで、予定が動いてしまう */
  el.style.display = prefs.ambientMusic === false ? 'none' : '';
  el.style.visibility = music ? '' : 'hidden';
  if (!music) return;

  const art = document.getElementById('amb-np-art');
  if (art && art.style.backgroundImage !== music.art) {
    art.style.backgroundImage = music.art;
    art.style.display = music.art ? '' : 'none';
  }
  ambSetText('amb-np-t', music.title);
  ambSetText('amb-np-a', music.artist);

  ambSetProgress(ambMusicProgress(music));
  el.classList.toggle('playing', music.playing);
  const play = document.getElementById('amb-np-play');
  const icon = music.playing
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="4" width="4.5" height="16" rx="2.25" fill="currentColor"/><rect x="14" y="4" width="4.5" height="16" rx="2.25" fill="currentColor"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 5.224v13.552a1.5 1.5 0 0 0 2.296 1.272l10.842-6.776a1.5 1.5 0 0 0 0-2.544L9.296 3.952A1.5 1.5 0 0 0 7 5.224Z"/></svg>';
  if (play && play.innerHTML !== icon) play.innerHTML = icon;
}

/* 区切り線がそのまま再生の軌道になる。数字は出さない ──
   毎秒動く数字を置くと、この画面でいちばん落ち着かないものになる。 */
function ambSetProgress(frac) {
  const el = document.getElementById('amb-np');
  if (!el) return;
  const v = frac == null ? '' : (frac * 100).toFixed(1) + '%';
  if (el.dataset.prog === v) return;
  el.dataset.prog = v;
  if (v) el.style.setProperty('--amb-np-p', v);
  else el.style.removeProperty('--amb-np-p');
}

/* 描き直しは15秒に1回なので、線だけは毎秒進めてやる */
function ambTickProgress() {
  if (!AMBIENT.on || ambIsNight()) return;
  const p = ambPrefs();
  if (p.ambientMusic === false) return;
  ambSetProgress(ambMusicProgress(ambMusicData()));
}

/* 元のカードのボタンと同じ口を叩く */
function ambMediaCommand(cmd) {
  try {
    chrome.runtime.sendMessage({ action: 'controlYouTube', command: cmd }, () => {
      void chrome.runtime.lastError;
    });
  } catch (e) {
    /* 拡張のコンテキストが切れているときは黙って諦める */
  }
}

/* 「画面を消さない」の中身。呼び出しだけがあって定義が無く、
   Horizon に入るたびここで ReferenceError になって止まっていた
   （そのため、すぐ後ろの全画面化も実行されていない）。

   Wake Lock はタブが見えているあいだしか取れず、隠れると
   ブラウザが勝手に外す。戻ってきたときは ambOnVisibility が取り直すので、
   外されたことを AMBIENT.wakeLock に反映しておく必要がある。 */
function ambRequestWakeLock() {
  if (AMBIENT.wakeLock) return;
  try {
    if (!navigator.wakeLock || document.visibilityState !== 'visible') return;
    navigator.wakeLock
      .request('screen')
      .then((lock) => {
        /* 取れるまでのあいだに Horizon を出ていたら、持っていても仕方がない */
        if (!AMBIENT.on) {
          lock.release().catch(() => {});
          return;
        }
        AMBIENT.wakeLock = lock;
        lock.addEventListener('release', () => {
          if (AMBIENT.wakeLock === lock) AMBIENT.wakeLock = null;
        });
      })
      .catch(() => {
        /* 省電力設定などで断られることがある。景色はそのまま出しておく */
      });
  } catch (e) {}
}

function ambReleaseWakeLock() {
  if (AMBIENT.wakeLock) {
    AMBIENT.wakeLock.release().catch(() => {});
    AMBIENT.wakeLock = null;
  }
}

function ambOnVisibility() {
  if (document.visibilityState === 'visible' && AMBIENT.on && !AMBIENT.wakeLock) {
    ambRequestWakeLock();
  }
}

function ambOnKey(e) {
  if (!AMBIENT.on) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    ambExit();
  }
}

function ambWake() {
  if (!AMBIENT.on) return;
  const root = AMBIENT.root;
  root.classList.remove('amb-hidecursor');
  root.classList.add('amb-awake');
  clearTimeout(AMBIENT.cursorTimer);
  const hide = ambPrefs().ambientHideCursor !== false;
  AMBIENT.cursorTimer = setTimeout(() => {
    if (hide) root.classList.add('amb-hidecursor');
    root.classList.remove('amb-awake');
  }, 3000);
}

/* ---------------------------------------------------------------- 出入り */

/* 入るときに一度だけ、画面が組み上がるところを見せる。
   段取りは CSS 側の .amb-in に置いてある。1.8秒で外して、以降は何も動かない。 */
function ambPlayEntrance() {
  const root = AMBIENT.root;
  if (!root) return;
  root.classList.add('amb-in');
  clearTimeout(AMBIENT.enterTimer);
  AMBIENT.enterTimer = setTimeout(() => root.classList.remove('amb-in'), 1800);
}

function ambEnter() {
  if (AMBIENT.on) return;
  const prefs = ambPrefs();

  ambBuild();
  AMBIENT.on = true;
  AMBIENT.wasNight = null;

  const parts = ambTimeParts();
  ambBuildFace(document.getElementById('amb-face'), parts.text);
  AMBIENT.lastFace = parts.text;
  const ampm = document.getElementById('amb-ampm');
  if (ampm) {
    ampm.textContent = parts.suffix;
    ampm.style.display = parts.suffix ? '' : 'none';
  }

  document.body.classList.add('amb-on');
  ambApplyPrefs();
  ambRender();

  /* 一度レイアウトを確定させてから .show を付ける */
  void AMBIENT.root.offsetWidth;
  AMBIENT.root.classList.add('show');
  ambPlayEntrance();

  AMBIENT.clockTimer = setInterval(() => {
    const p = ambTimeParts();
    if (p.text !== AMBIENT.lastFace) {
      ambRollFace(document.getElementById('amb-face'), p.text);
      AMBIENT.lastFace = p.text;
      ambAlignDate();
    }
    const a = document.getElementById('amb-ampm');
    if (a && a.textContent !== p.suffix) a.textContent = p.suffix;
    /* 稜線の「いま」の印は1時間に画面幅の1/24しか動かない。
       毎秒さわる意味がないので、描き直しのときだけでよい */
    ambTickProgress();
    if (ambIsNight() !== AMBIENT.wasNight) ambRender();
  }, 1000);

  /* 天気も予定も秒単位では変わらない。分の数字は上の1秒タイマーが持つ */
  AMBIENT.dataTimer = setInterval(ambRender, 15000);

  clearTimeout(AMB_IDLE.timer);
  if (AMBIENT.auto) {
    for (const ev of ['mousemove', 'mousedown', 'wheel', 'keydown']) {
      document.addEventListener(ev, ambAutoExit, { passive: true, capture: true });
    }
  }
  document.addEventListener('keydown', ambOnKey, true);
  document.addEventListener('mousemove', ambWake, { passive: true });
  document.addEventListener('visibilitychange', ambOnVisibility);
  window.addEventListener('resize', ambRender);
  ambWake();

  if (prefs.ambientWakeLock !== false) ambRequestWakeLock();
  if (prefs.ambientFullscreen !== false && !document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }
}

function ambExit() {
  if (!AMBIENT.on) return;
  AMBIENT.on = false;

  clearInterval(AMBIENT.clockTimer);
  clearInterval(AMBIENT.dataTimer);
  clearTimeout(AMBIENT.cursorTimer);
  clearTimeout(AMBIENT.enterTimer);
  AMBIENT.clockTimer = AMBIENT.dataTimer = null;

  document.removeEventListener('keydown', ambOnKey, true);
  document.removeEventListener('mousemove', ambWake);
  document.removeEventListener('visibilitychange', ambOnVisibility);
  window.removeEventListener('resize', ambRender);

  for (const ev of ['mousemove', 'mousedown', 'wheel', 'keydown']) {
    document.removeEventListener(ev, ambAutoExit, { capture: true });
  }
  AMBIENT.auto = false;

  ambReleaseWakeLock();
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});

  AMBIENT.root?.classList.remove('show', 'amb-in', 'amb-hidecursor', 'amb-awake');
  document.body.classList.remove('amb-on');
  ambIdleReset();
}

/* ------------------------------------------------------- ひとりでに入る
   スマートディスプレイの本体は「置きっぱなしにしていると景色になる」ことなので、
   手で押す以外の入り方を用意する。ただし自分から入ったときは、
   何か触られたらすぐ引っ込む ── 押して入ったときと違って、
   ユーザーはそれを頼んでいないため。 */

const AMB_IDLE = { timer: null };

function ambIdleMinutes() {
  const v = parseInt(ambPrefs().ambientIdleStart ?? '0', 10);
  return isNaN(v) || v < 0 ? 0 : v;
}

function ambIdleOK() {
  const a = document.activeElement;
  if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return false;
  if (document.querySelector('.overlay-modal.show')) return false;
  if (document.body.classList.contains('zen-active')) return false;
  return true;
}

function ambIdleReset() {
  clearTimeout(AMB_IDLE.timer);
  const m = ambIdleMinutes();
  if (!m || AMBIENT.on || document.hidden) return;
  AMB_IDLE.timer = setTimeout(() => {
    if (AMBIENT.on || document.hidden || !ambIdleOK()) return;
    AMBIENT.auto = true;
    ambEnter();
  }, m * 60000);
}

/* 自分から入ったときだけ、触られたら戻る */
function ambAutoExit(e) {
  if (!AMBIENT.on || !AMBIENT.auto) return;
  if (e.type === 'mousemove' && Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0) < 12)
    return;
  ambExit();
}

function ambToggle() {
  AMBIENT.on ? ambExit() : ambEnter();
}

function setupAmbientMode() {
  const btn = document.getElementById('ambient-btn');
  if (btn) {
    btn.onclick = (e) => {
      e.stopPropagation();
      ambToggle();
    };
  }

  /* 言語やモジュールを変えると initNestHub がやり直しになる。
     開いていないときは作り直して、新しい言語で組み直せるようにする */
  if (!AMBIENT.on && AMBIENT.root) {
    AMBIENT.root.remove();
    AMBIENT.root = null;
  }

  if (AMBIENT.wired) return;
  AMBIENT.wired = true;

  /* どのタブからでも呼べるショートカット（Alt+Shift+H）から届く */
  try {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.action === 'toggleHorizon') {
        AMBIENT.auto = false;
        ambToggle();
      }
    });
    chrome.storage?.local?.get(['horizonOnOpen'], (r) => {
      const t0 = r && r.horizonOnOpen;
      if (!t0 || Date.now() - t0 > 8000) return;
      chrome.storage.local.remove('horizonOnOpen');
      AMBIENT.auto = false;
      ambEnter();
    });
  } catch (e) {
    /* 拡張の外で読み込まれたとき */
  }

  /* 時計そのものを入口にする。ドックにボタンを増やさずに済み、
     しかも「この時計が画面いっぱいになる」という動きが名前どおりになる。 */
  const cc = document.querySelector('.clock-container');
  if (cc) {
    cc.classList.add('hz-launch');
    cc.setAttribute('role', 'button');
    cc.setAttribute('tabindex', '0');
    cc.setAttribute('title', t('ambient_mode_tooltip'));
    cc.addEventListener('click', (e) => {
      e.stopPropagation();
      if (AMBIENT.on) return;
      AMBIENT.auto = false;
      ambEnter();
    });
    cc.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      AMBIENT.auto = false;
      ambEnter();
    });
  }

  let idleTick = 0;
  const poke = () => {
    const now = Date.now();
    if (now - idleTick < 500) return; /* mousemove は数えきれないほど飛ぶ */
    idleTick = now;
    if (!AMBIENT.on) ambIdleReset();
  };
  for (const ev of ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart']) {
    document.addEventListener(ev, poke, { passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(AMB_IDLE.timer);
    else if (!AMBIENT.on) ambIdleReset();
  });
  ambIdleReset();

  document.addEventListener('fullscreenchange', () => {
    /* ユーザーが F11 などで全画面を抜けたときは、こちらも畳む */
    if (AMBIENT.on && !document.fullscreenElement) {
      const prefs = ambPrefs();
      if (prefs.ambientFullscreen !== false) ambExit();
    }
  });
}

function setupMemo() {
  const input = document.getElementById('memo-input');
  input.addEventListener('input', () => {
    localStorage.setItem('immersion_memo', input.value);
  });
}
function updateQuote() {
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  const name = prefs.userName || 'Guest';
  const now = new Date();
  const hour = now.getHours();

  let greeting = '';
  let subText = '';

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

  if (qText) qText.innerText = greeting;
  if (qAuthor) qAuthor.innerText = subText;
}

function startClock() {
  const update = () => {
    const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    const now = new Date();

    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    let s = String(now.getSeconds()).padStart(2, '0');

    let timeStr = '';

    if (prefs.use12hFormat) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;

      timeStr = `${h}:${m}`;
      if (prefs.showSeconds) timeStr += `:${s}`;

      timeStr += `<span style="font-size:0.4em; margin-left:15px; opacity:0.6;">${ampm}</span>`;
    } else {
      h = String(h).padStart(2, '0');
      timeStr = `${h}:${m}`;
      if (prefs.showSeconds) timeStr += `:${s}`;
    }

    const days = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
    const months = [
      t('jan'),
      t('feb'),
      t('mar'),
      t('apr'),
      t('may'),
      t('jun'),
      t('jul'),
      t('aug'),
      t('sep'),
      t('oct'),
      t('nov'),
      t('dec'),
    ];
    const mStr = months[now.getMonth()];
    const dStr = days[now.getDay()];

    let lang = prefs.language || 'auto';
    if (lang === 'auto') {
      const navLang = navigator.language.slice(0, 2);
      lang = navLang === 'ja' || navLang === 'ko' || navLang === 'zh' ? navLang : 'en';
    }

    let dateStr = `${mStr} ${now.getDate()} (${dStr})`;

    if (lang === 'ja') {
      dateStr = `${mStr}${now.getDate()}日 (${dStr})`;
    } else if (lang === 'ko') {
      dateStr = `${mStr} ${now.getDate()}일 (${dStr})`;
    } else if (lang === 'zh') {
      dateStr = `${mStr}${now.getDate()}日 (${dStr})`;
    }

    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    if (timeEl && timeEl.innerHTML !== timeStr) timeEl.innerHTML = timeStr;
    if (dateEl && dateEl.innerText !== dateStr) dateEl.innerText = dateStr;
  };
  setInterval(update, 1000);
  update();
}
function fetchNews() {
  const lists = document.querySelectorAll('.news-list-area');

  if (lists.length === 0) return;

  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  const targetUrl = prefs.newsUrl;

  if (!targetUrl) {
    lists.forEach((list) => {
      list.innerHTML = `<div style="padding:10px; opacity:0.7; text-align:center;">${t('news_rss_config_prompt')}</div>`;
    });
    return;
  }

  chrome.runtime.sendMessage({ action: 'fetchNews', url: targetUrl }, (res) => {
    const currentLists = document.querySelectorAll('.news-list-area');
    if (currentLists.length === 0) return;

    if (!res || res.error || !res.data) {
      currentLists.forEach((list) => {
        list.innerHTML = `<div style="padding:10px; opacity:0.7; text-align:center;">${t('news_error')}</div>`;
      });
      return;
    }

    const parser = new DOMParser();
    try {
      const doc = parser.parseFromString(res.data, 'text/xml');
      const items = doc.querySelectorAll('item');

      if (items.length === 0) {
        currentLists.forEach((list) => {
          list.innerHTML = `<div style="padding:10px; opacity:0.7; text-align:center;">${t('news_no_articles')}</div>`;
        });
        return;
      }

      const fragment = document.createDocumentFragment();
      for (let i = 0; i < 6; i++) {
        if (!items[i]) break;
        const a = document.createElement('a');
        a.className = 'news-item';
        a.innerText = items[i].querySelector('title').textContent;
        const link = items[i].querySelector('link').textContent;
        a.href = link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.style.textDecoration = 'none';
        a.style.color = 'inherit';
        a.style.display = 'block';
        fragment.appendChild(a);
      }

      currentLists.forEach((list) => {
        list.innerHTML = '';

        list.appendChild(fragment.cloneNode(true));
      });
    } catch (e) {
      currentLists.forEach((list) => {
        list.innerHTML = `<div style="padding:10px; opacity:0.7; text-align:center;">${t('news_rss_error')}</div>`;
      });
    }
  });
}

function renderWeatherUI(data, city) {
  const cards = document.querySelectorAll('.weather-card');
  if (cards.length === 0 || !data) return;

  const w = data.current_weather;
  const daily = data.daily;

  const getWeatherInfo = (code) => {
    const svg = {
      sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
      cloud:
        '<svg viewBox="0 0 24 24"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>',
      rain: '<svg viewBox="0 0 24 24"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><path d="M8 15v4M12 17v4M16 15v4"/></svg>',
      snow: '<svg viewBox="0 0 24 24"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><path d="M8 15v2M12 17v2M16 15v2"/></svg>',
      storm:
        '<svg viewBox="0 0 24 24"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><path d="M13 14l-4 5h6l-4 5"/></svg>',
      fog: '<svg viewBox="0 0 24 24"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><path d="M8 17h8M8 21h8"/></svg>',
    };

    if (code === 0) return { icon: svg.sun, text: t('weather_clear') };
    if (code <= 3) return { icon: svg.cloud, text: t('weather_sunny') };
    if (code === 45 || code === 48) return { icon: svg.fog, text: 'Fog' };
    if (code >= 51 && code <= 67) return { icon: svg.rain, text: t('weather_rain') };
    if (code >= 71 && code <= 82) return { icon: svg.snow, text: 'Snow' };
    if (code >= 95) return { icon: svg.storm, text: 'Storm' };
    return { icon: svg.cloud, text: t('weather_cloudy') };
  };

  const currentInfo = getWeatherInfo(w.weathercode);

  cards.forEach((card) => {
    const setTxt = (cls, val) => {
      const el = card.querySelector('.' + cls);
      if (el) el.innerText = val;
    };
    const setHTML = (cls, html) => {
      const el = card.querySelector('.' + cls);
      if (el) el.innerHTML = html;
    };

    setTxt('w-temp', `${Math.round(w.temperature)}°`);
    setTxt(
      'w-high',
      daily ? Math.round(daily.temperature_2m_max[0]) : Math.round(w.temperature + 3),
    );
    setTxt(
      'w-low',
      daily ? Math.round(daily.temperature_2m_min[0]) : Math.round(w.temperature - 2),
    );
    setTxt('change-city', city);
    setHTML('w-icon', currentInfo.icon);
    setTxt('w-cond', currentInfo.text);

    const fcArea = card.querySelector('.aw-forecast');
    if (daily && daily.time && daily.time.length >= 4) {
      if (fcArea) fcArea.style.display = 'flex';
      const daysOfWeek = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];

      for (let i = 1; i <= 3; i++) {
        const date = new Date(daily.time[i]);
        const dayName = daysOfWeek[date.getDay()];
        const info = getWeatherInfo(daily.weathercode[i]);

        const dayEl = card.querySelector(`.fc-day-${i}`);
        if (dayEl) {
          const nEl = dayEl.querySelector('.fc-name');
          const iEl = dayEl.querySelector('.fc-icon');
          const hEl = dayEl.querySelector('.fc-high');
          const lEl = dayEl.querySelector('.fc-low');

          if (nEl) nEl.innerText = dayName;
          if (iEl) iEl.innerHTML = info.icon;
          if (hEl) hEl.innerText = Math.round(daily.temperature_2m_max[i]);
          if (lEl) lEl.innerText = Math.round(daily.temperature_2m_min[i]);
        }
      }
    } else {
      if (fcArea) fcArea.style.display = 'none';
    }
  });
}

function fetchWeather(city) {
  const cards = document.querySelectorAll('.weather-card');
  if (cards.length === 0) return;

  const cachedJson = localStorage.getItem('immersion_weather_cache');
  let cacheValid = false;
  if (cachedJson) {
    try {
      const cache = JSON.parse(cachedJson);

      if (cache && cache.city === city && cache.data) {
        renderWeatherUI(cache.data, city);
        const cacheAge = Date.now() - cache.timestamp;
        if (cacheAge < 15 * 60 * 1000) {
          cacheValid = true;
        }
      }
    } catch (e) {
      console.error('Failed to parse weather cache', e);
    }
  }

  if (!cacheValid) {
    chrome.runtime.sendMessage({ action: 'fetchWeather', city: city }, (res) => {
      if (!res?.data) return;

      const weatherCache = {
        timestamp: Date.now(),
        city: city,
        data: res.data,
      };
      localStorage.setItem('immersion_weather_cache', JSON.stringify(weatherCache));

      renderWeatherUI(res.data, city);
    });
  }
}

function initTiltEffect() {
  const cards = document.querySelectorAll('.tilt-card');
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;

  if (prefs.themeMode === 'lite' || prefs.cardTilt !== true) {
    cards.forEach((c) => {
      c.onmousemove = null;
      c.onmouseleave = null;
      c.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
    return;
  }

  cards.forEach((card) => {
    card.onmousemove = (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const cX = r.width / 2;
      const cY = r.height / 2;

      const isHoveringGrid = e.target.closest('.cal-grid') || e.target.closest('.event-list-area');
      const stabilizer = card.id === 'card-calendar' && isHoveringGrid ? 0 : 1;

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
  let currentArt = '';
  let currentLyricsTrack = '';
  const bgLayer = document.getElementById('bg-layer');
  const container = document.getElementById('music-card-container');

  const updateIdleDateInstantly = () => {
    const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    const now = new Date();
    const longDays = [
      t('sunday'),
      t('monday'),
      t('tuesday'),
      t('wednesday'),
      t('thursday'),
      t('friday'),
      t('saturday'),
    ];

    const dayEl = document.getElementById('idle-day');
    if (dayEl) dayEl.innerText = longDays[now.getDay()];

    const dateEl = document.getElementById('idle-date');
    if (dateEl) dateEl.innerText = now.getDate();

    let idleMonthStr = `${t('dec')} ${now.getFullYear()}`;
    const mVals = [
      t('jan'),
      t('feb'),
      t('mar'),
      t('apr'),
      t('may'),
      t('jun'),
      t('jul'),
      t('aug'),
      t('sep'),
      t('oct'),
      t('nov'),
      t('dec'),
    ];

    if (prefs.language === 'ja' || (!prefs.language && navigator.language.startsWith('ja')))
      idleMonthStr = `${now.getFullYear()}年 ${mVals[now.getMonth()]}`;
    else if (prefs.language === 'ko' || (!prefs.language && navigator.language.startsWith('ko')))
      idleMonthStr = `${now.getFullYear()}년 ${mVals[now.getMonth()]}`;
    else idleMonthStr = `${mVals[now.getMonth()]} ${now.getFullYear()}`;

    const monthEl = document.getElementById('idle-month');
    if (monthEl) monthEl.innerText = idleMonthStr;
  };
  updateIdleDateInstantly();

  const setInitialBackground = async () => {
    const bgLayer = document.getElementById('bg-layer');
    const bgVideo = document.getElementById('bg-video');

    const applyVideo = (blobUrl) => {
      if (!bgVideo) return;
      document.body.classList.add('has-video');
      bgVideo.src = blobUrl;
      bgVideo.oncanplay = () => {
        bgVideo.style.opacity = '1';
        bgVideo.play().catch((e) => console.log('Autoplay blocked', e));
      };
    };

    const applyImage = (dataUrlOrObj) => {
      document.body.classList.remove('has-video');
      if (bgVideo) {
        bgVideo.style.opacity = '0';
        bgVideo.pause();
        bgVideo.src = '';
      }

      const bgOriginal = document.getElementById('bg-layer-original');
      const bgBlurred = document.getElementById('bg-layer-blurred');

      if (!bgOriginal || !bgBlurred) return;

      if (typeof dataUrlOrObj === 'object' && dataUrlOrObj.original) {
        bgOriginal.style.backgroundImage = `url('${dataUrlOrObj.original}')`;
        bgBlurred.style.backgroundImage = `url('${dataUrlOrObj.blurred}')`;
        bgOriginal.classList.remove('dynamic-blur');
        bgBlurred.style.display = 'block';
      } else {
        bgOriginal.style.backgroundImage = `url('${dataUrlOrObj}')`;
        bgOriginal.classList.add('dynamic-blur');
        bgBlurred.style.display = 'none';
      }
    };

    const dbUrl = await getImageFromDB();
    if (dbUrl) {
      if (typeof dbUrl === 'object') {
        applyImage(dbUrl);
        return dbUrl;
      }
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
      } catch (e) {
        console.error('File type check failed', e);
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

  let sessionIdleArt = '';
  setInitialBackground().then((url) => {
    sessionIdleArt = url;
  });

  const loop = setInterval(() => {
    if (!chrome.runtime?.id) {
      clearInterval(loop);
      return;
    }
    try {
      const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;

      chrome.runtime.sendMessage(
        {
          action: 'getYouTubeData',
          enabledSettings: {
            yt: prefs.mediaYT,
            ytm: prefs.mediaYTMusic,
            spotify: prefs.mediaSpotify,
          },
        },
        (res) => {
          if (chrome.runtime.lastError) return;

          if (
            res &&
            res.status === 'connected' &&
            (res.data.isPlaying || (res.data.title && res.data.title !== ''))
          ) {
            container?.classList.remove('music-idle');
            container?.classList.add('music-active');
            const d = res.data;
            container?.classList.toggle('music-playing', !!d.isPlaying);
            /* 再生位置は3秒ごとにしか来ない。読んだ時刻も一緒に控えておいて、
               表示側でその後の経過を足せるようにする */
            if (container) {
              container.dataset.pos = d.duration > 0 ? String(d.position) : '';
              container.dataset.dur = d.duration > 0 ? String(d.duration) : '';
              container.dataset.at = String(Date.now());
            }

            const titleEl = document.getElementById('track-title');
            if (titleEl) {
              const newTitle = d.title || 'Unknown';
              if (titleEl.innerText !== newTitle) {
                titleEl.classList.remove('scroll-active');
                titleEl.innerText = newTitle;
                if (titleEl.scrollWidth > titleEl.parentElement.clientWidth) {
                  titleEl.classList.add('scroll-active');
                }
              }
            }

            const artistEl = document.getElementById('track-artist');
            const newArtist = d.artist || 'Unknown';
            if (artistEl && artistEl.innerText !== newArtist) artistEl.innerText = newArtist;

            const lyricsBtn = document.getElementById('lyrics-toggle-btn');
            if (prefs.showLyrics) {
              lyricsBtn.style.display = 'flex';
              if (d.title + d.artist !== currentLyricsTrack) {
                currentLyricsTrack = d.title + d.artist;
                const lyricsTextEl = document.getElementById('lyrics-text');
                if (lyricsTextEl) {
                  lyricsTextEl.innerText = 'Loading lyrics...';
                  lyricsTextEl.scrollTop = 0;
                  chrome.runtime.sendMessage(
                    { action: 'fetchLyrics', title: d.title, artist: d.artist },
                    (lRes) => {
                      if (chrome.runtime.lastError) return;
                      if (lRes && lRes.lyrics && lRes.lyrics !== 'No lyrics found.') {
                        lyricsTextEl.innerText = lRes.lyrics;
                      } else {
                        lyricsTextEl.innerText = '歌詞が見つかりませんでした。';
                      }
                    },
                  );
                }
              }
            } else {
              lyricsBtn.style.display = 'none';
              document.getElementById('lyrics-overlay').classList.remove('show');
            }
            const playBtn = document.getElementById('btn-play');
            if (playBtn) {
              const playSvg = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 5.224v13.552a1.5 1.5 0 0 0 2.296 1.272l10.842-6.776a1.5 1.5 0 0 0 0-2.544L9.296 3.952A1.5 1.5 0 0 0 7 5.224Z"/></svg>`;
              const pauseSvg = `<svg viewBox="0 0 24 24"><rect x="5.5" y="4" width="4.5" height="16" rx="2.25" fill="currentColor"/><rect x="14" y="4" width="4.5" height="16" rx="2.25" fill="currentColor"/></svg>`;
              const targetSvg = d.isPlaying ? pauseSvg : playSvg;
              if (playBtn.innerHTML !== targetSvg) {
                playBtn.innerHTML = targetSvg;
              }
            }
            const sourceEl = document.getElementById('music-source-indicator');
            if (sourceEl) {
              const src = d.source || 'yt';
              let svgContent = '';
              if (src === 'spotify') {
                svgContent = `<svg viewBox="0 0 24 24" title="Spotify"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.668-.135-.744-.47-.077-.337.135-.669.47-.745 3.854-.88 7.15-.506 9.822 1.13.295.178.387.563.205.86zm1.225-2.72c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.08-1.182-.413.125-.85-.107-.978-.52-.128-.414.108-.85.52-.977 3.67-1.114 8.243-.573 11.353 1.34.367.227.487.708.26 1.075zm.105-2.833C14.437 8.78 8.683 8.59 5.344 9.607c-.527.16-1.08-.14-1.24-.667-.16-.526.14-1.08.667-1.24 3.843-1.167 10.198-.948 14.2 1.507.475.282.63.897.347 1.37-.282.476-.897.632-1.37.348z"/></svg>`;
              } else if (src === 'ytm') {
                svgContent = `<svg viewBox="0 0 24 24" title="YouTube Music"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1.5-11.5v7l5-3.5-5-3.5z"/></svg>`;
              } else {
                svgContent = `<svg viewBox="0 0 24 24" title="YouTube"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.387.507 9.387.507s7.517 0 9.387-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
              }
              if (sourceEl.innerHTML !== svgContent) {
                sourceEl.innerHTML = svgContent;
              }
            }
            if (d.artwork) {
              const artEl = document.getElementById('album-art');
              const artUrl = `url('${d.artwork}')`;
              if (artEl && artEl.style.backgroundImage !== artUrl) {
                artEl.style.backgroundImage = artUrl;
              }

              const bgOriginal = document.getElementById('bg-layer-original');
              const bgBlurred = document.getElementById('bg-layer-blurred');

              if (prefs.mediaBackground && currentArt !== d.artwork && bgOriginal) {
                currentArt = d.artwork;

                bgOriginal.style.backgroundImage = `url('${d.artwork}')`;
                bgOriginal.classList.add('dynamic-blur');
                if (bgBlurred) bgBlurred.style.display = 'none';

                document.body.classList.remove('has-video');
                const v = document.getElementById('bg-video');
                if (v) v.style.opacity = '0';
              } else if (!prefs.mediaBackground && currentArt !== 'default') {
                currentArt = 'default';

                const v = document.getElementById('bg-video');
                if (v && v.getAttribute('src')) {
                  document.body.classList.add('has-video');
                  v.style.opacity = '1';
                  v.play();
                } else {
                  getImageFromDB().then((dbData) => {
                    if (dbData) {
                      if (typeof dbData === 'object' && dbData.original) {
                        if (bgOriginal) {
                          bgOriginal.style.backgroundImage = `url('${dbData.original}')`;
                          bgOriginal.classList.remove('dynamic-blur');
                        }
                        if (bgBlurred) {
                          bgBlurred.style.backgroundImage = `url('${dbData.blurred}')`;
                          bgBlurred.style.display = 'block';
                        }
                      } else if (typeof dbData === 'string') {
                        if (bgOriginal) {
                          bgOriginal.style.backgroundImage = `url('${dbData}')`;
                          bgOriginal.classList.add('dynamic-blur');
                        }
                        if (bgBlurred) bgBlurred.style.display = 'none';
                      }
                    } else {
                      const p =
                        JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
                      const targetImg =
                        p.idleImgUrl && p.idleImgUrl.startsWith('http')
                          ? p.idleImgUrl
                          : sessionIdleArt;
                      if (targetImg && targetImg !== 'video') {
                        if (typeof targetImg === 'object' && targetImg.original) {
                          if (bgOriginal) {
                            bgOriginal.style.backgroundImage = `url('${targetImg.original}')`;
                            bgOriginal.classList.remove('dynamic-blur');
                          }
                          if (bgBlurred) {
                            bgBlurred.style.backgroundImage = `url('${targetImg.blurred}')`;
                            bgBlurred.style.display = 'block';
                          }
                        } else {
                          if (bgOriginal) {
                            bgOriginal.style.backgroundImage = `url('${targetImg}')`;
                            bgOriginal.classList.add('dynamic-blur');
                          }
                          if (bgBlurred) bgBlurred.style.display = 'none';
                        }
                      }
                    }
                  });
                }
              }
            }
          } else {
            container?.classList.remove('music-active');
            container?.classList.add('music-idle');
            const sourceEl = document.getElementById('music-source-indicator');
            if (sourceEl) sourceEl.innerHTML = '';

            const now = new Date();
            const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
            const longDays = [
              t('sunday'),
              t('monday'),
              t('tuesday'),
              t('wednesday'),
              t('thursday'),
              t('friday'),
              t('saturday'),
            ];

            const dayEl = document.getElementById('idle-day');
            if (dayEl) dayEl.innerText = longDays[now.getDay()];

            const dateEl = document.getElementById('idle-date');
            if (dateEl) dateEl.innerText = now.getDate();

            let idleMonthStr = `${t('dec')} ${now.getFullYear()}`;
            const mVals = [
              t('jan'),
              t('feb'),
              t('mar'),
              t('apr'),
              t('may'),
              t('jun'),
              t('jul'),
              t('aug'),
              t('sep'),
              t('oct'),
              t('nov'),
              t('dec'),
            ];

            if (prefs.language === 'ja' || (!prefs.language && navigator.language.startsWith('ja')))
              idleMonthStr = `${now.getFullYear()}年 ${mVals[now.getMonth()]}`;
            else if (
              prefs.language === 'ko' ||
              (!prefs.language && navigator.language.startsWith('ko'))
            )
              idleMonthStr = `${now.getFullYear()}년 ${mVals[now.getMonth()]}`;
            else idleMonthStr = `${mVals[now.getMonth()]} ${now.getFullYear()}`;

            const monthEl = document.getElementById('idle-month');
            if (monthEl) monthEl.innerText = idleMonthStr;

            const bgOriginal = document.getElementById('bg-layer-original');
            const bgBlurred = document.getElementById('bg-layer-blurred');

            if (currentArt !== 'default' && bgOriginal) {
              currentArt = 'default';

              const v = document.getElementById('bg-video');

              if (v && v.getAttribute('src')) {
                document.body.classList.add('has-video');
                v.style.opacity = '1';
                v.play();
                bgOriginal.style.backgroundImage = '';
                if (bgBlurred) bgBlurred.style.backgroundImage = '';
              } else {
                getImageFromDB().then((dbData) => {
                  if (dbData) {
                    if (typeof dbData === 'object' && dbData.original) {
                      bgOriginal.style.backgroundImage = `url('${dbData.original}')`;
                      bgOriginal.classList.remove('dynamic-blur');
                      if (bgBlurred) {
                        bgBlurred.style.backgroundImage = `url('${dbData.blurred}')`;
                        bgBlurred.style.display = 'block';
                      }
                    } else if (typeof dbData === 'string') {
                      bgOriginal.style.backgroundImage = `url('${dbData}')`;
                      bgOriginal.classList.add('dynamic-blur');
                      if (bgBlurred) bgBlurred.style.display = 'none';
                    }
                  } else {
                    const p =
                      JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
                    if (p.idleImgUrl && p.idleImgUrl.startsWith('http')) {
                      bgOriginal.style.backgroundImage = `url('${p.idleImgUrl}')`;
                      bgOriginal.classList.add('dynamic-blur');
                      if (bgBlurred) bgBlurred.style.display = 'none';
                    } else {
                      if (sessionIdleArt && sessionIdleArt !== 'video') {
                        if (sessionIdleArt === 'mode-default') {
                          bgOriginal.style.backgroundImage = '';
                          if (bgBlurred) bgBlurred.style.backgroundImage = '';
                        } else if (typeof sessionIdleArt === 'object' && sessionIdleArt.original) {
                          bgOriginal.style.backgroundImage = `url('${sessionIdleArt.original}')`;
                          bgOriginal.classList.remove('dynamic-blur');
                          if (bgBlurred) {
                            bgBlurred.style.backgroundImage = `url('${sessionIdleArt.blurred}')`;
                            bgBlurred.style.display = 'block';
                          }
                        } else {
                          bgOriginal.style.backgroundImage = `url('${sessionIdleArt}')`;
                          bgOriginal.classList.add('dynamic-blur');
                          if (bgBlurred) bgBlurred.style.display = 'none';
                        }
                      }
                    }
                  }
                });
              }
            }
          }
        },
      );
    } catch (e) {
      clearInterval(loop);
    }
  }, 3000);

  const send = (c) => {
    try {
      chrome.runtime.sendMessage({ action: 'controlYouTube', command: c });
    } catch (e) {}
  };
  document.getElementById('btn-play').onclick = () => send('toggle');
  document.getElementById('btn-prev').onclick = () => send('prev');
  document.getElementById('btn-next').onclick = () => send('next');

  const transferBtn = document.getElementById('btn-transfer');
  if (transferBtn) {
    transferBtn.onclick = () => {
      transferBtn.style.opacity = '0.5';
      chrome.runtime.sendMessage({ action: 'transferSpotify' }, (res) => {
        transferBtn.style.opacity = '1';
        if (res && res.success) {
          console.log(`Switched to ${res.deviceName}`);
        } else {
          if (res && res.error === 'no_device_found') {
          } else if (res && res.error === 'not_logged_in') {
            alert('Spotifyにログインしていません。設定画面から連携してください。');
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
    input.placeholder = 'https://calendar.google.com/...';

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
    urls.push('');
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

  const fetchPromises = urls.map((url) => {
    if (!url) return Promise.resolve(null);

    let targetUrl = url.trim();
    if (targetUrl.startsWith('webcal://')) {
      targetUrl = targetUrl.replace('webcal://', 'https://');
    }

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'fetchCalendar', url: targetUrl }, (res) => {
        if (!res || res.error || !res.data) {
          console.warn('Calendar fetch failed:', targetUrl);
          resolve(null);
        } else {
          resolve(res.data);
        }
      });
    });
  });

  Promise.all(fetchPromises).then((results) => {
    const mergedEvents = {};

    results.forEach((icalData) => {
      if (!icalData) return;

      const cleanData = icalData
        .replace(/\r\n[ \t]/g, '')
        .replace(/\n[ \t]/g, '')
        .replace(/\r[ \t]/g, '');

      const lines = cleanData.split(/\r\n|\n|\r/);

      let inEvent = false;
      let currentDate = null;
      let currentSummary = '';
      let timeStr = '';

      lines.forEach((line) => {
        if (line.startsWith('BEGIN:VEVENT')) {
          inEvent = true;
          currentDate = null;
          currentSummary = '';
          timeStr = '';
        } else if (line.startsWith('END:VEVENT')) {
          inEvent = false;

          if (currentDate && currentSummary) {
            const finalTitle = timeStr ? `${timeStr} ${currentSummary}` : currentSummary;
            if (mergedEvents[currentDate]) {
              mergedEvents[currentDate] += ` / ${finalTitle}`;
            } else {
              mergedEvents[currentDate] = finalTitle;
            }
          }
        } else if (inEvent) {
          const colonIndex = line.indexOf(':');
          if (colonIndex === -1) return;

          let keyPart = line.substring(0, colonIndex);
          const value = line.substring(colonIndex + 1);

          const keyParams = keyPart.split(';');
          const key = keyParams[0];

          if (key === 'SUMMARY') {
            currentSummary = value
              .replace(/\\,/g, ',')
              .replace(/\\;/g, ';')
              .replace(/\\n/g, ' ')
              .replace(/\\N/g, ' ');
          } else if (key === 'DTSTART') {
            const cleanVal = value.replace('Z', '').replace('T', '');
            const isZ = value.endsWith('Z');

            if (cleanVal.length === 8) {
              const y = parseInt(cleanVal.substring(0, 4));
              const m = parseInt(cleanVal.substring(4, 6)) - 1;
              const d = parseInt(cleanVal.substring(6, 8));

              currentDate = `${y}_${m}_${d}`;
            } else if (cleanVal.length >= 12) {
              const y = parseInt(cleanVal.substring(0, 4));
              const m = parseInt(cleanVal.substring(4, 6)) - 1;
              const d = parseInt(cleanVal.substring(6, 8));
              const h = parseInt(cleanVal.substring(8, 10));
              const min = parseInt(cleanVal.substring(10, 12));
              const s = parseInt(cleanVal.substring(12, 14) || '00');

              let dateObj;
              if (isZ) {
                dateObj = new Date(Date.UTC(y, m, d, h, min, s));
              } else {
                dateObj = new Date(y, m, d, h, min, s);
              }

              currentDate = `${dateObj.getFullYear()}_${dateObj.getMonth()}_${dateObj.getDate()}`;

              const hh = String(dateObj.getHours()).padStart(2, '0');
              const mm = String(dateObj.getMinutes()).padStart(2, '0');
              timeStr = `${hh}:${mm}`;
            }
          }
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

  const months = [
    t('jan'),
    t('feb'),
    t('mar'),
    t('apr'),
    t('may'),
    t('jun'),
    t('jul'),
    t('aug'),
    t('sep'),
    t('oct'),
    t('nov'),
    t('dec'),
  ];
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;

  let myStr = `${months[month]} ${year}`;
  if (prefs.language === 'ja' || (!prefs.language && navigator.language.startsWith('ja')))
    myStr = `${year}年 ${months[month]}`;
  else if (prefs.language === 'ko' || (!prefs.language && navigator.language.startsWith('ko')))
    myStr = `${year}년 ${months[month]}`;

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
          <span id="cal-title" style="font-weight:600; user-select: none; cursor: pointer;" title="Open Google Calendar (Month View)">${myStr}</span>
          <div id="cal-next" style="cursor:pointer; opacity:0.6; padding: 8px 20px; font-family:var(--clock-font); user-select: none; font-size: 1.2rem;">▶</div>
        `;

      document.getElementById('cal-prev').onclick = (e) => {
        e.stopPropagation();
        calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1);
        renderCalendarSystem();
      };
      document.getElementById('cal-next').onclick = (e) => {
        e.stopPropagation();
        calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1);
        renderCalendarSystem();
      };

      const openMonthView = (e) => {
        e.stopPropagation();
        const y = calendarDisplayDate.getFullYear();
        const m = String(calendarDisplayDate.getMonth() + 1).padStart(2, '0');
        window.open(`https://calendar.google.com/calendar/r/month/${y}/${m}/1`, '_blank');
      };
      document.getElementById('cal-title').onclick = openMonthView;
    } else {
      const titleEl = document.getElementById('cal-title');
      titleEl.innerText = myStr;

      titleEl.style.cursor = 'pointer';
      titleEl.title = 'Open Google Calendar (Month View)';
      titleEl.onclick = (e) => {
        e.stopPropagation();
        const y = calendarDisplayDate.getFullYear();
        const m = String(calendarDisplayDate.getMonth() + 1).padStart(2, '0');
        window.open(`https://calendar.google.com/calendar/r/month/${y}/${m}/1`, '_blank');
      };
    }
  }

  const days = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
  grid.innerHTML = days.map((w) => `<div class="cal-head">${w}</div>`).join('');

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div></div>`;

  for (let d = 1; d <= lastDate; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    cell.innerText = d;
    if (d === realNow.getDate() && month === realNow.getMonth() && year === realNow.getFullYear()) {
      cell.classList.add('cal-today');
    }

    const key = `event_${year}_${month}_${d}`;
    const localVal = localStorage.getItem(key);
    const googleVal = googleEventsCache[`${year}_${month}_${d}`];

    if (localVal || googleVal) cell.classList.add('cal-has-event');

    cell.onclick = () => openEventModal(year, month, d, localVal, googleVal);
    grid.appendChild(cell);
  }

  eventList.innerHTML = '';
  let hasEvent = false;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  for (let d = 1; d <= lastDate; d++) {
    const key = `event_${year}_${month}_${d}`;
    const localVal = localStorage.getItem(key);
    const googleVal = googleEventsCache[`${year}_${month}_${d}`];

    if (localVal || googleVal) {
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
      dateBadge.style.cssText = 'align-self: flex-start; margin-top: 2px;';
      dateBadge.innerText = d;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'event-content';
      contentDiv.style.whiteSpace = 'normal';

      eventsArray.forEach((evtText) => {
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
          const url = `https://calendar.google.com/calendar/r/day/${year}/${pad(month + 1)}/${pad(d)}`;
          window.open(url, '_blank');
        } else {
          openEventModal(year, month, d, localVal, googleVal);
        }
      };
      eventList.appendChild(r);
    }
  }

  if (!hasEvent) {
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

  const oldList = document.getElementById('ev-existing-list');
  if (oldList) oldList.remove();

  const existingList = document.createElement('div');
  existingList.id = 'ev-existing-list';
  existingList.style.cssText =
    'margin-bottom:10px; font-size:0.9rem; opacity:0.9; max-height:120px; overflow-y:auto; background:rgba(255,255,255,0.05); border-radius:8px; padding:0;';

  let hasExisting = false;

  if (googleVal) {
    const events = googleVal.split(' / ');
    events.forEach((evt) => {
      const row = document.createElement('div');
      row.innerText = evt;
      row.style.cssText = 'padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.05);';
      existingList.appendChild(row);
    });
    hasExisting = true;

    input.value = '';
  } else if (localVal) {
    input.value = localVal;
  } else {
    input.value = '';
  }

  input.placeholder = t('event_name_placeholder');

  if (hasExisting) {
    input.parentNode.insertBefore(existingList, input);
  }

  const oldActions = document.getElementById('ev-external-actions');
  if (oldActions) oldActions.remove();

  const btnContainer = document.createElement('div');
  btnContainer.id = 'ev-external-actions';
  btnContainer.style.cssText =
    'display:flex; gap:10px; margin-top:15px; margin-bottom:5px; justify-content:center;';

  const googleBtn = document.createElement('button');
  googleBtn.className = 'st-btn';
  googleBtn.innerHTML = 'Google ↗';
  googleBtn.title = 'Googleカレンダーに追加';
  googleBtn.style.flex = '1';
  googleBtn.onclick = () => {
    const text = input.value || 'New Event';
    const pad = (n) => String(n).padStart(2, '0');
    const sDate = `${year}${pad(month + 1)}${pad(day)}`;
    const eDate = `${year}${pad(month + 1)}${pad(day + 1)}`;
    const gUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${sDate}/${eDate}`;
    window.open(gUrl, '_blank');
  };

  const appleBtn = document.createElement('button');
  appleBtn.className = 'st-btn';
  appleBtn.innerHTML = 'Apple / PC ⬇';
  appleBtn.title = 'カレンダーアプリに追加 (.ics)';
  appleBtn.style.flex = '1';
  appleBtn.onclick = () => {
    const text = input.value || 'New Event';
    const pad = (n) => String(n).padStart(2, '0');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SearchImmersion//EN
BEGIN:VEVENT
SUMMARY:${text}
DTSTART;VALUE=DATE:${year}${pad(month + 1)}${pad(day)}
DTEND;VALUE=DATE:${year}${pad(month + 1)}${pad(day + 1)}
DESCRIPTION:Added via Search Immersion
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event_${year}${pad(month + 1)}${pad(day)}.ics`;
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
  modal.onclick = (e) => {
    if (e.target === modal) close();
  };

  saveBtn.onclick = () => {
    const text = input.value;
    if (text) {
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

  input.onkeydown = (e) => {
    if (e.key === 'Enter') saveBtn.click();
  };
}

setTimeout(syncGoogleCalendar, 2000);
setInterval(syncGoogleCalendar, 5 * 60 * 1000);
window.addEventListener('focus', syncGoogleCalendar);

const defaultGoogleApps = [
  { name: 'Google', url: 'https://www.google.com/' },
  { name: 'YouTube', url: 'https://www.youtube.com/' },
  { name: 'Maps', url: 'https://www.google.com/maps' },
  { name: 'Gmail', url: 'https://mail.google.com/' },
  { name: 'Meet', url: 'https://meet.google.com/' },
  { name: 'Chat', url: 'https://chat.google.com/' },
  { name: 'Contacts', url: 'https://contacts.google.com/' },
  { name: 'Drive', url: 'https://drive.google.com/' },
  { name: 'Calendar', url: 'https://calendar.google.com/' },
  { name: 'Translate', url: 'https://translate.google.com/' },
  { name: 'Photos', url: 'https://photos.google.com/' },
  { name: 'Duo', url: 'https://duo.google.com/' },
  { name: 'Chrome', url: 'https://www.google.com/chrome/' },
  { name: 'News', url: 'https://news.google.com/' },
  { name: 'Keep', url: 'https://keep.google.com/' },
  { name: 'Docs', url: 'https://docs.google.com/' },
  { name: 'Sheets', url: 'https://sheets.google.com/' },
  { name: 'Slides', url: 'https://slides.google.com/' },
  { name: 'Forms', url: 'https://forms.google.com/' },
  { name: 'Play', url: 'https://play.google.com/' },
  { name: 'YT Music', url: 'https://music.youtube.com/' },
  { name: 'Gemini', url: 'https://gemini.google.com/' },
  { name: 'NotebookLM', url: 'https://notebooklm.google.com/' },
  { name: 'Finance', url: 'https://www.google.com/finance/' },
  { name: 'Travel', url: 'https://www.google.com/travel/' },
  { name: 'Earth', url: 'https://earth.google.com/' },
  { name: 'Classroom', url: 'https://classroom.google.com/' },
  { name: 'Arts', url: 'https://artsandculture.google.com/' },
  { name: 'Ads', url: 'https://ads.google.com/' },
  { name: 'One', url: 'https://one.google.com/' },
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
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"></path></svg>';
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

      a.addEventListener('click', (e) => {});

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
    items.forEach((item) => {
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

function getModuleOptionsHTML() {
  return `
                  <option value="weather">${t('mod_weather')}</option>
                  <option value="news">${t('mod_news')}</option>
                  <option value="countdown">${t('mod_countdown')}</option>
                  <option value="todo">${t('mod_todo')}</option>
                  <option value="calc">${t('mod_calc')}</option>
                  <option value="timer">${t('mod_timer')}</option>
                  <option value="japanese">${t('mod_japanese')}</option>
                  <option value="english">${t('mod_english')}</option>
                  <option value="earthquake">${t('mod_earthquake')}</option>
                  <option value="year_progress">${t('mod_year_progress')}</option>
                  <option value="none">${t('mod_none')}</option>`;
}

function applyThemeClass(themeMode) {
  document.body.classList.remove(
    'yarn-mode',
    'lite-mode',
    'terminal-mode',
    'retro-mode',
    'mono-mode',
    'liquidglass-mode',
    'lg-aligned',
  );

  if (themeMode === 'yarn') {
    document.body.classList.add('yarn-mode');
  } else if (themeMode === 'lite') {
    document.body.classList.add('lite-mode');
  } else if (themeMode === 'terminal') {
    document.body.classList.add('terminal-mode');
  } else if (themeMode === 'retro') {
    document.body.classList.add('retro-mode');
  } else if (themeMode === 'mono') {
    document.body.classList.add('mono-mode');
  } else if (themeMode === 'liquidglass') {
    document.body.classList.add('liquidglass-mode');
    setupLiquidGlass();
  }
}

function adjustLayoutScale() {
  document.body.style.zoom = '';
  if (localStorage.getItem('immersion_custom_zoom')) {
    localStorage.removeItem('immersion_custom_zoom');
  }
}

function showSetupWizard() {
  if (localStorage.getItem('immersion_setup_done')) return;

  const root = document.createElement('div');
  root.id = 'setup-wizard-overlay';

  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
  const currentLang = prefs.language || 'auto';
  const langLabelMap = { auto: 'Auto', ja: '日本語', en: 'English', ko: '한국어', zh_cn: '中文' };
  const currentLangLabel = langLabelMap[currentLang] || 'Language';

  const currentTheme = prefs.themeMode || 'glass';
  const wizThemes = [
    ['glass', '#7c8aa0', 'theme_glass'],
    ['liquidglass', '#9db4d6', 'theme_liquidglass'],
    ['yarn', '#e6d3bd', 'theme_yarn'],
    ['terminal', '#0e2a16', 'theme_terminal'],
    ['retro', '#e7e3d8', 'theme_retro'],
    ['lite', '#3a3a40', 'theme_lite'],
    ['mono', '#d9d9d9', 'theme_mono'],
  ];
  const shortLabel = (s) => s.replace(/[（(].*$/, '').trim();
  const themeCardsHTML = wizThemes
    .map(
      ([v, c, key]) =>
        `<button type="button" class="wiz-theme-card${v === currentTheme ? ' selected' : ''}" data-theme="${v}">
           <span class="wiz-theme-swatch" style="background:${c};"></span>
           <span class="wiz-theme-name">${shortLabel(t(key))}</span>
         </button>`,
    )
    .join('');
  const moduleOptionsHTML = getModuleOptionsHTML();

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

      <div class="wiz-progress">
        <span class="wiz-dot active" data-dot="1"></span>
        <span class="wiz-dot" data-dot="2"></span>
        <span class="wiz-dot" data-dot="3"></span>
      </div>

      <div class="wiz-steps">
        <div class="wiz-step" data-step="1">
          <div class="wiz-step-title">${t('wizard_step_name')}</div>
          <div class="setup-group">
            <label class="setup-label">${t('wizard_name_label')}</label>
            <input type="text" id="wiz-name" class="st-input" value="${prefs.userName || ''}" placeholder="${t('wizard_name_placeholder')}">
          </div>
        </div>

        <div class="wiz-step" data-step="2" style="display:none;">
          <div class="wiz-step-title">${t('wizard_step_theme')}</div>
          <div class="setup-group">
            <label class="setup-label">${t('wizard_theme_label')}</label>
            <div class="wiz-theme-grid" id="wiz-theme-grid">${themeCardsHTML}</div>
            <input type="hidden" id="wiz-theme" value="${currentTheme}">
          </div>
          <div class="setup-group" style="margin-bottom:0;">
            <label class="setup-label">${t('wizard_color_label')}</label>
            <input type="color" id="wiz-color" class="st-color" value="${prefs.accent}" style="width:100%; height:54px; cursor:pointer;">
          </div>
        </div>

        <div class="wiz-step" data-step="3" style="display:none;">
          <div class="wiz-step-title">${t('wizard_step_cards')}</div>
          <div class="wiz-desc">${t('module_slot_desc')}</div>
          <div class="setup-group" style="margin-bottom:14px;">
            <label class="setup-label">${t('module_slot_1')}</label>
            <select id="wiz-mod-1" class="st-input" style="width:100%;">${moduleOptionsHTML}</select>
          </div>
          <div class="setup-group" style="margin-bottom:14px;">
            <label class="setup-label">${t('module_slot_2')}</label>
            <select id="wiz-mod-2" class="st-input" style="width:100%;">${moduleOptionsHTML}</select>
          </div>
          <div class="setup-group" style="margin-bottom:0;">
            <label class="setup-label">${t('module_slot_3')}</label>
            <select id="wiz-mod-3" class="st-input" style="width:100%;">${moduleOptionsHTML}</select>
          </div>
        </div>
      </div>

      <div class="wiz-nav">
        <button id="wiz-back" class="setup-btn wiz-btn-secondary" style="display:none;">${t('wizard_back_btn')}</button>
        <button id="wiz-next" class="setup-btn">${t('wizard_next_btn')}</button>
        <button id="wiz-finish" class="setup-btn" style="display:none;">${t('wizard_finish_btn')}</button>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const nameInput = document.getElementById('wiz-name');
  const colorInput = document.getElementById('wiz-color');
  const themeSelect = document.getElementById('wiz-theme');
  const finishBtn = document.getElementById('wiz-finish');
  const nextBtn = document.getElementById('wiz-next');
  const backBtn = document.getElementById('wiz-back');
  const langSelect = document.getElementById('wiz-lang');

  if (themeSelect) themeSelect.value = prefs.themeMode || 'glass';

  const modSelects = [
    document.getElementById('wiz-mod-1'),
    document.getElementById('wiz-mod-2'),
    document.getElementById('wiz-mod-3'),
  ];
  modSelects[0].value = prefs.module1 || 'weather';
  modSelects[1].value = prefs.module2 || 'news';
  modSelects[2].value = prefs.module3 || 'countdown';

  root.querySelectorAll('.wiz-theme-card').forEach((cardBtn) => {
    cardBtn.onclick = () => {
      const value = cardBtn.dataset.theme;
      themeSelect.value = value;
      root
        .querySelectorAll('.wiz-theme-card')
        .forEach((c) => c.classList.toggle('selected', c === cardBtn));
      try {
        applyThemeClass(value);
      } catch (err) {
        console.error('theme preview failed', err);
      }
    };
  });

  const TOTAL_STEPS = 3;
  let currentStep = 1;

  const showStep = (step) => {
    currentStep = step;
    root.querySelectorAll('.wiz-step').forEach((el) => {
      el.style.display = Number(el.dataset.step) === step ? 'block' : 'none';
    });
    root.querySelectorAll('.wiz-dot').forEach((el) => {
      el.classList.toggle('active', Number(el.dataset.dot) <= step);
    });
    backBtn.style.display = step > 1 ? 'block' : 'none';
    nextBtn.style.display = step < TOTAL_STEPS ? 'block' : 'none';
    finishBtn.style.display = step === TOTAL_STEPS ? 'block' : 'none';
  };

  nextBtn.onclick = () => {
    if (currentStep < TOTAL_STEPS) showStep(currentStep + 1);
  };
  backBtn.onclick = () => {
    if (currentStep > 1) showStep(currentStep - 1);
  };

  colorInput.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--accent', e.target.value);
  });

  langSelect.onchange = (e) => {
    const p = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    p.language = e.target.value;
    localStorage.setItem('immersion_prefs', JSON.stringify(p));
    location.reload();
  };

  finishBtn.onclick = async () => {
    const modules = [modSelects[0].value, modSelects[1].value, modSelects[2].value];

    // ニュースを選んだ場合のみ、その場（ユーザー操作中）に取得元の権限を要求する。
    // manifest に固定の権限を足すと配信時に既存ユーザーの拡張が停止されるため、任意権限で対応。
    if (modules.includes('news')) {
      try {
        await new Promise((resolve) => {
          chrome.permissions.request(
            { origins: ['https://news.yahoo.co.jp/*'] },
            () => resolve(),
          );
        });
      } catch (e) {
        console.error('news permission request failed', e);
      }
    }

    const newPrefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;
    newPrefs.userName = nameInput.value || 'User';
    newPrefs.accent = colorInput.value;
    newPrefs.language = langSelect.value;
    if (themeSelect) newPrefs.themeMode = themeSelect.value;
    newPrefs.module1 = modules[0];
    newPrefs.module2 = modules[1];
    newPrefs.module3 = modules[2];

    localStorage.setItem('immersion_prefs', JSON.stringify(newPrefs));
    localStorage.setItem('immersion_setup_done', 'true');

    root.style.opacity = '0';
    setTimeout(() => location.reload(), 350);
  };
}

function setupCurrency() {
  const card = document.getElementById('card-currency');
  if (!card) return;

  const update = async () => {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await res.json();

      if (!data || !data.rates || !data.rates.JPY) return;

      const rate = data.rates.JPY;
      const rateStr = rate.toFixed(2);

      const valEl = card.querySelector('.curr-value');
      valEl.innerText = rateStr;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      card.querySelector('.curr-update').innerText = `Updated: ${timeStr}`;

      const prevRate = parseFloat(localStorage.getItem('immersion_prev_rate'));
      if (prevRate) {
        card.classList.remove('rate-up', 'rate-down');
        if (rate > prevRate)
          card.classList.add('rate-up');
        else if (rate < prevRate) card.classList.add('rate-down');
      }
      localStorage.setItem('immersion_prev_rate', rate);
    } catch (e) {
      console.error('Currency fetch error:', e);
      card.querySelector('.curr-update').innerText = 'Update Failed';
    }
  };

  update();
  setInterval(update, 600000);
}
function setupEarthquake() {
  const card = document.getElementById('card-earthquake');
  if (!card) return;

  const update = async () => {
    try {
      const res = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=1');
      const data = await res.json();

      if (!data || data.length === 0) return;

      const eq = data[0];
      const time = new Date(eq.time);
      const loc = eq.earthquake.hypocenter.name;
      const mag = eq.earthquake.hypocenter.magnitude;
      const maxScale = eq.earthquake.maxScale / 10;

      let scaleStr = '?';
      let scaleClass = 'level-1';

      if (eq.earthquake.maxScale === 10) {
        scaleStr = '1';
        scaleClass = 'level-1';
      } else if (eq.earthquake.maxScale === 20) {
        scaleStr = '2';
        scaleClass = 'level-2';
      } else if (eq.earthquake.maxScale === 30) {
        scaleStr = '3';
        scaleClass = 'level-3';
      } else if (eq.earthquake.maxScale === 40) {
        scaleStr = '4';
        scaleClass = 'level-4';
      } else if (eq.earthquake.maxScale === 45) {
        scaleStr = '5-';
        scaleClass = 'level-5';
      } else if (eq.earthquake.maxScale === 50) {
        scaleStr = '5+';
        scaleClass = 'level-5';
      } else if (eq.earthquake.maxScale === 55) {
        scaleStr = '6-';
        scaleClass = 'level-6';
      } else if (eq.earthquake.maxScale === 60) {
        scaleStr = '6+';
        scaleClass = 'level-6';
      } else if (eq.earthquake.maxScale === 70) {
        scaleStr = '7';
        scaleClass = 'level-7';
      }

      card.querySelector('.eq-shindo-value').innerText = scaleStr;
      card.querySelector('.eq-location').innerText = loc;
      card.querySelector('.eq-mag').innerText = `M${mag.toFixed(1)}`;

      const timeStr = `${time.getMonth() + 1}/${time.getDate()} ${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
      card.querySelector('.eq-time').innerText = timeStr;

      const tsunami = eq.earthquake.domesticTsunami;
      const icon = card.querySelector('.eq-status-icon');
      if (tsunami === 'None') {
        icon.innerText = '✓';
        icon.style.color = '';
      } else if (tsunami === 'Checking') {
        icon.innerText = '⚠';
        icon.style.color = '#FFD700';
      } else {
        icon.innerText = '🌊';
        icon.style.color = '#ff453a';
      }

      card.classList.remove(
        'level-1',
        'level-2',
        'level-3',
        'level-4',
        'level-5',
        'level-6',
        'level-7',
      );
      card.classList.add(scaleClass);
    } catch (e) {
      console.error('Eq fetch error:', e);
    }
  };
  update();
  setInterval(update, 60000);
}

function setupNewModules() {
  setupTodo();
  setupCalculator();
  setupEarthquake();
  setupCurrency();
  setupEnglishWidget();
  setupJapaneseWidget();
  setupParticleVoid();
}

function setupTodo() {
  const cards = document.querySelectorAll('.todo-card');
  if (cards.length === 0) return;

  let savedTodos = JSON.parse(localStorage.getItem('immersion_todos')) || [];
  savedTodos = savedTodos.filter((todo) => !todo.done);
  localStorage.setItem('immersion_todos', JSON.stringify(savedTodos));

  const renderAll = () => {
    document.querySelectorAll('.todo-card').forEach((card) => {
      const list = card.querySelector('.todo-list');
      if (!list) return;
      list.innerHTML = '';
      savedTodos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.done ? 'checked' : ''}`;
        li.innerHTML = `<span class="todo-check">${todo.done ? '✅' : '⬜'}</span> <span>${todo.text}</span>`;
        li.onclick = (e) => {
          if (e.shiftKey) savedTodos.splice(index, 1);
          else todo.done = !todo.done;
          localStorage.setItem('immersion_todos', JSON.stringify(savedTodos));
          renderAll();
        };
        list.appendChild(li);
      });
    });
  };

  cards.forEach((card) => {
    const input = card.querySelector('.todo-input');
    if (input.dataset.initDone) return;
    input.dataset.initDone = 'true';
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing && input.value.trim()) {
        savedTodos.push({ text: input.value, done: false });
        localStorage.setItem('immersion_todos', JSON.stringify(savedTodos));
        document.querySelectorAll('.todo-input').forEach((i) => (i.value = ''));
        renderAll();
      }
    });
  });
  renderAll();
}

function setupCalculator() {
  const cards = document.querySelectorAll('.calc-card');
  if (cards.length === 0) return;
  const keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', 'C', '0', '=', '+'];

  cards.forEach((card) => {
    const grid = card.querySelector('.calc-keys');
    const display = card.querySelector('.calc-display');
    if (grid.innerHTML !== '') return;

    keys.forEach((key) => {
      const btn = document.createElement('button');
      btn.className = 'calc-btn';
      btn.innerText = key;
      btn.onclick = () => {
        const current = display.innerText;
        if (key === 'C') display.innerText = '0';
        else if (key === '=') {
          try {
            let tokens = current.match(/(\d+(\.\d+)?|[\+\-\*\/])/g);
            if (!tokens) return;
            for (let i = 0; i < tokens.length; i++) {
              if (tokens[i] === '*' || tokens[i] === '/') {
                const res =
                  tokens[i] === '*'
                    ? parseFloat(tokens[i - 1]) * parseFloat(tokens[i + 1])
                    : parseFloat(tokens[i - 1]) / parseFloat(tokens[i + 1]);
                tokens.splice(i - 1, 3, res);
                i--;
              }
            }
            for (let i = 0; i < tokens.length; i++) {
              if (tokens[i] === '+' || tokens[i] === '-') {
                const res =
                  tokens[i] === '+'
                    ? parseFloat(tokens[i - 1]) + parseFloat(tokens[i + 1])
                    : parseFloat(tokens[i - 1]) - parseFloat(tokens[i + 1]);
                tokens.splice(i - 1, 3, res);
                i--;
              }
            }
            display.innerText = tokens[0];
          } catch (e) {
            display.innerText = 'Error';
          }
        } else {
          if (current === '0' || current === 'Error') {
            display.innerText =
              ['+', '-', '*', '/'].includes(key) && current !== 'Error' ? current + key : key;
          } else display.innerText += key;
        }
      };
      grid.appendChild(btn);
    });
  });
}

function setupTimer() {
  const cards = document.querySelectorAll('.timer-card');
  if (cards.length === 0) return;

  cards.forEach((card) => {
    if (card.dataset.initDone) return;
    card.dataset.initDone = 'true';

    const minInput = card.querySelector('.t-min');
    const secInput = card.querySelector('.t-sec');
    const displayMode = card.querySelector('.timer-running-mode');
    const inputMode = card.querySelector('.timer-input-mode');
    const timeDisplay = card.querySelector('.t-display');
    const toggleBtn = card.querySelector('.btn-timer-toggle');
    const resetBtn = card.querySelector('.btn-timer-reset');
    const progressBar = card.querySelector('.timer-progress-bar');

    let timerInterval = null,
      alarmLoopInterval = null,
      totalSeconds = 0,
      remainingSeconds = 0,
      isRunning = false,
      isRinging = false;
    const pad = (n) => String(n).padStart(2, '0');

    const playOneSequence = () => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const beep = (freq, s, d) => {
        const o = ctx.createOscillator(),
          g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(1.0, s);
        g.gain.exponentialRampToValueAtTime(0.01, s + d);
        o.start(s);
        o.stop(s + d);
      };
      const n = ctx.currentTime;
      beep(880, n, 0.1);
      beep(880, n + 0.2, 0.1);
      beep(1760, n + 0.4, 0.6);
    };

    const startAlarm = () => {
      isRinging = true;
      toggleBtn.innerText = 'Stop Alarm';
      toggleBtn.classList.add('active-state');
      card.style.boxShadow = '0 0 50px rgba(255, 69, 58, 0.6)';
      playOneSequence();
      alarmLoopInterval = setInterval(() => {
        playOneSequence();
        card.animate(
          [
            { boxShadow: '0 0 0 rgba(255,0,0,0)' },
            { boxShadow: '0 0 50px rgba(255,69,58,0.8)' },
            { boxShadow: '0 0 0 rgba(255,0,0,0)' },
          ],
          { duration: 500 },
        );
      }, 2000);
    };

    const stopAlarm = () => {
      if (alarmLoopInterval) {
        clearInterval(alarmLoopInterval);
        alarmLoopInterval = null;
      }
      isRinging = false;
      card.style.boxShadow = '';
      toggleBtn.innerText = 'Start';
      toggleBtn.classList.remove('active-state');
      resetTimer();
    };

    const updateDisplay = () => {
      const m = Math.floor(remainingSeconds / 60),
        s = remainingSeconds % 60;
      timeDisplay.innerText = `${pad(m)}:${pad(s)}`;
      if (totalSeconds > 0)
        progressBar.style.width = `${((totalSeconds - remainingSeconds) / totalSeconds) * 100}%`;
    };

    const toggleTimer = () => {
      if (isRinging) {
        stopAlarm();
        return;
      }
      if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        toggleBtn.innerText = 'Resume';
        toggleBtn.classList.remove('active-state');
      } else {
        if (remainingSeconds === 0) {
          const m = parseInt(minInput.value) || 0,
            s = parseInt(secInput.value) || 0;
          if (m === 0 && s === 0) return;
          totalSeconds = m * 60 + s;
          remainingSeconds = totalSeconds;
        }
        inputMode.style.display = 'none';
        displayMode.style.display = 'block';
        toggleBtn.innerText = 'Pause';
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
      toggleBtn.innerText = 'Start';
      toggleBtn.classList.remove('active-state');
      displayMode.style.display = 'none';
      inputMode.style.display = 'flex';
      progressBar.style.width = '0%';
      card.style.boxShadow = '';
    };
    toggleBtn.onclick = toggleTimer;
    resetBtn.onclick = resetTimer;
  });
}

async function requestRssPermission(url) {
  if (!url) return true;

  try {
    const urlObj = new URL(url);
    const origin = `${urlObj.protocol}//${urlObj.hostname}/*`;

    const granted = await new Promise((resolve) => {
      chrome.permissions.request(
        {
          origins: [origin],
        },
        (result) => {
          resolve(result);
        },
      );
    });

    if (granted) {
      console.log('権限が許可されました:', origin);
      return true;
    } else {
      alert('RSSを取得するには、表示されるポップアップで「許可」を選択してください。');
      return false;
    }
  } catch (e) {
    console.error('URLの形式が正しくありません', e);
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

async function createBlurredImage(file) {
  return new Promise((resolve) => {
    if (file.type.startsWith('video/')) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const blurRadius = 60;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.filter = `blur(${blurRadius}px)`;

      const scale = 1.15;
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const offsetX = (img.width - drawWidth) / 2;
      const offsetY = (img.height - drawHeight) / 2;

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = (err) => {
      console.error('Image load failed in createBlurredImage', err);
      resolve(null);
    };
    img.src = URL.createObjectURL(file);
  });
}

async function saveImageToDB(file, key = 'custom_bg') {
  const db = await openDB();

  let dataToSave;
  if (file && typeof file === 'object' && 'original' in file && 'blurred' in file) {
    dataToSave = file;
  } else if (file instanceof File || file instanceof Blob) {
    if (file.type.startsWith('video/')) {
      dataToSave = file;
    } else {
      const blurredDataUrl = await createBlurredImage(file);
      dataToSave = { original: file, blurred: blurredDataUrl };
    }
  } else {
    dataToSave = file;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.put(dataToSave, key);

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
        if (request.result instanceof File || request.result instanceof Blob) {
          resolve(URL.createObjectURL(request.result));
        } else if (request.result.original) {
          resolve({
            original: URL.createObjectURL(request.result.original),
            blurred: request.result.blurred,
          });
        } else {
          resolve(null);
        }
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

  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach((evt) =>
    document.addEventListener(evt, resetIdle, { passive: true }),
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

    Object.keys(localStorage).forEach((key) => {
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

        Object.keys(data).forEach((key) => {
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

  const resetBtn = document.getElementById('btn-reset-all');
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (!confirm(t('reset_confirm'))) return;
      // 設定のみリセットし初期セットアップを再表示する。
      // ショートカット・プロフィール・壁紙・メモなどのユーザーデータは残す。
      localStorage.removeItem('immersion_prefs');
      localStorage.removeItem('immersion_setup_done');
      localStorage.removeItem('immersion_custom_zoom');
      location.reload();
    };
  }
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

    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.gap = '8px';

    for (let i = 0; i < profiles.length; i++) {
      const p = profiles[i];

      const row = document.createElement('div');
      row.className = 'profile-row';

      let bgStyle = `background-color: #333;`;
      if (p.prefs && p.prefs.idleImgUrl && p.prefs.idleImgUrl.startsWith('http')) {
        bgStyle = `background-image: url('${p.prefs.idleImgUrl}');`;
      } else if (p.bgKey) {
        const blobUrl = await getImageFromDB(p.bgKey);
        if (blobUrl) {
          const urlStr = typeof blobUrl === 'object' ? blobUrl.original : blobUrl;
          bgStyle = `background-image: url('${urlStr}');`;
        }
      } else if (p.prefs && p.prefs.accent) {
        bgStyle = `background-color: ${p.prefs.accent};`;
      }

      row.innerHTML = `
            <div class="profile-indicator" style="${bgStyle}"></div>
            <div class="profile-info">
                <div class="profile-name-text">${p.name}</div>
            </div>
            <div class="profile-del-btn" title="削除">×</div>
        `;

      row.onclick = async (e) => {
        if (e.target.classList.contains('profile-del-btn')) return;

        if (confirm(t('profile_confirm_load'))) {
          row.style.opacity = '0.5';
          document.body.style.cursor = 'wait';

          try {
            if (p.prefs) localStorage.setItem('immersion_prefs', JSON.stringify(p.prefs));
            if (p.dock) localStorage.setItem('immersion_dock_items', JSON.stringify(p.dock));
            if (p.apps) localStorage.setItem('immersion_app_order', JSON.stringify(p.apps));
            if (p.todos) localStorage.setItem('immersion_todos', JSON.stringify(p.todos));
            localStorage.setItem('immersion_memo', p.memo || '');
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
          } catch (err) {
            console.error(err);
            alert('エラー: 設定を読み込めませんでした');
            document.body.style.cursor = 'default';
            row.style.opacity = '1';
          }
        }
      };

      row.querySelector('.profile-del-btn').onclick = async (e) => {
        e.stopPropagation();
        if (confirm(t('profile_confirm_delete'))) {
          if (p.bgKey) await deleteImageFromDB(p.bgKey);
          profiles.splice(i, 1);
          localStorage.setItem('immersion_saved_profiles', JSON.stringify(profiles));
          render();
        }
      };

      listContainer.appendChild(row);
    }
  };

  saveBtn.onclick = async () => {
    const name = nameInput.value.trim();
    if (!name) {
      alert('名前を入力してください');
      return;
    }

    const originalText = saveBtn.innerText;
    saveBtn.innerText = 'Saving...';
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
        city: localStorage.getItem('immersion_city') || '',
      };

      profiles.push(data);
      localStorage.setItem('immersion_saved_profiles', JSON.stringify(profiles));

      nameInput.value = '';
      render();
    } catch (e) {
      console.error(e);
      alert('保存エラーが発生しました');
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

  btn.innerHTML =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/><path d="M12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';

  btn.onclick = () => {
    window.location.href = 'https://lens.google.com/';
  };

  searchWrapper.appendChild(btn);
}

function setupIOSFocusSwitcher() {
  const prefs = JSON.parse(localStorage.getItem('immersion_prefs')) || defaultSettings;

  const oldBtn = document.getElementById('ios-focus-btn');
  const oldMenu = document.getElementById('ios-focus-menu');
  if (oldBtn) oldBtn.remove();
  if (oldMenu) oldMenu.remove();

  if (!prefs.showProfileSwitcher) return;

  const dock = document.getElementById('main-dock');
  if (!dock) {
    setTimeout(setupIOSFocusSwitcher, 500);
    return;
  }

  const currentProfileName = localStorage.getItem('immersion_current_profile_name') || 'Default';

  const btn = document.createElement('div');
  btn.id = 'ios-focus-btn';

  btn.innerHTML = `
    <svg id="ios-focus-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-7v4h3l-4 7z"/></svg>
    <span id="ios-focus-label">${currentProfileName}</span>
  `;

  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    dock.insertBefore(btn, settingsBtn);
  } else {
    dock.appendChild(btn);
  }

  const menu = document.createElement('div');
  menu.id = 'ios-focus-menu';

  document.getElementById('immersion-root').appendChild(menu);

  const toggleMenu = (e) => {
    e.stopPropagation();
    const isActive = menu.classList.contains('show');

    document.querySelectorAll('.show').forEach((el) => el.classList.remove('show'));

    if (!isActive) {
      renderFocusList();
      btn.classList.add('active');
      menu.classList.add('show');

      const rect = btn.getBoundingClientRect();
      menu.style.left = rect.left + rect.width / 2 + 'px';
    } else {
      btn.classList.remove('active');
    }
  };

  btn.onclick = toggleMenu;

  const renderFocusList = async () => {
    menu.innerHTML = '';

    const profiles = JSON.parse(localStorage.getItem('immersion_saved_profiles')) || [];

    if (profiles.length === 0) {
      menu.innerHTML += `<div class="no-profile-msg" style="padding:20px; text-align:center; opacity:0.6;">No profiles saved.<br>Create one in settings.</div>`;
      return;
    }

    const getBlobUrl = async (key) => {
      try {
        return await getImageFromDB(key);
      } catch (e) {
        return null;
      }
    };

    for (const p of profiles) {
      const item = document.createElement('div');
      item.className = 'focus-item';

      const isSelected = p.name === localStorage.getItem('immersion_current_profile_name');
      if (isSelected) item.classList.add('selected');

      let bgStyle = 'background-color: #666;';
      if (p.prefs && p.prefs.idleImgUrl && p.prefs.idleImgUrl.startsWith('http')) {
        bgStyle = `background-image: url('${p.prefs.idleImgUrl}');`;
      } else if (p.bgKey) {
        const blobUrl = await getBlobUrl(p.bgKey);
        if (blobUrl) {
          const urlStr = typeof blobUrl === 'object' ? blobUrl.original : blobUrl;
          bgStyle = `background-image: url('${urlStr}');`;
        }
      } else if (p.prefs && p.prefs.accent) {
        bgStyle = `background-color: ${p.prefs.accent};`;
      }

      item.innerHTML = `
        <div class="focus-indicator" style="${bgStyle}"></div>
        <div class="focus-name">${p.name}</div>
        <div class="focus-check">✓</div>
      `;

      item.onclick = async (e) => {
        e.stopPropagation();
        if (isSelected) return;

        localStorage.setItem('immersion_current_profile_name', p.name);

        document.body.style.cursor = 'wait';
        item.style.opacity = '0.7';

        try {
          if (p.prefs) localStorage.setItem('immersion_prefs', JSON.stringify(p.prefs));
          if (p.dock) localStorage.setItem('immersion_dock_items', JSON.stringify(p.dock));
          if (p.apps) localStorage.setItem('immersion_app_order', JSON.stringify(p.apps));
          if (p.todos) localStorage.setItem('immersion_todos', JSON.stringify(p.todos));
          localStorage.setItem('immersion_memo', p.memo || '');
          localStorage.setItem('immersion_city', p.city || '');

          if (p.bgKey) {
            const savedBlob = await getBlobFromDB(p.bgKey);
            if (savedBlob) await saveImageToDB(savedBlob, 'custom_bg');
            else await deleteImageFromDB('custom_bg');
          } else {
            await deleteImageFromDB('custom_bg');
          }

          location.reload();
        } catch (err) {
          console.error(err);
          alert('Error loading profile');
          document.body.style.cursor = 'default';
        }
      };

      menu.appendChild(item);
    }
  };

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.remove('show');
      btn.classList.remove('active');
    }
  });
}

function setupEnglishWidget() {
  const card = document.getElementById('card-english');
  if (!card) return;

  const ui = {
    word: card.querySelector('.eng-word'),
    pron: card.querySelector('.eng-pronounce'),
    part: card.querySelector('.eng-part'),
    mean: card.querySelector('.eng-meaning'),
    bg: card.querySelector('.eng-bg-text'),
    loader: card.querySelector('.eng-loader'),
    main: card.querySelector('.eng-main-view'),
    reloadBtn: card.querySelector('.eng-reload-btn'),
  };

  let isFetching = false;

  const fetchRandomWord = async () => {
    if (isFetching) return;
    isFetching = true;

    ui.main.style.opacity = '0';
    ui.loader.style.display = 'block';
    ui.reloadBtn.classList.add('spinning');

    try {
      let found = false;
      let retryCount = 0;

      while (!found && retryCount < 5) {
        try {
          const rRes = await fetch('https://random-word-api.herokuapp.com/word?number=1');
          const rData = await rRes.json();
          const targetWord = rData[0];

          const dRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${targetWord}`);
          if (!dRes.ok) throw new Error('Definition not found');

          const dData = await dRes.json();
          const entry = dData[0];

          if (entry.meanings && entry.meanings.length > 0) {
            renderWord(entry);
            found = true;
          } else {
            throw new Error('No meanings');
          }
        } catch (e) {
          retryCount++;
          console.log('Retry word fetch...', retryCount);
        }
      }

      if (!found) throw new Error('Failed to find word');
    } catch (err) {
      console.error(err);
      ui.word.innerText = 'Error';
      ui.mean.innerText = 'Failed to load word. Please reload.';
      ui.main.style.opacity = '1';
    } finally {
      isFetching = false;
      ui.loader.style.display = 'none';
      ui.reloadBtn.classList.remove('spinning');
    }
  };

  const renderWord = (data) => {
    const word = data.word;

    ui.word.innerText = word;
    ui.bg.innerText = word.charAt(0).toUpperCase();

    const phoneticText = data.phonetic || data.phonetics.find((p) => p.text)?.text || '';
    ui.pron.innerText = phoneticText;

    const meaningObj = data.meanings[0];
    ui.part.innerText = meaningObj.partOfSpeech;
    ui.mean.innerText = meaningObj.definitions[0].definition;

    ui.main.style.opacity = '1';
  };

  fetchRandomWord();

  ui.reloadBtn.onclick = (e) => {
    e.stopPropagation();
    fetchRandomWord();
  };

  card.onclick = (e) => {
    if (e.target === ui.reloadBtn) return;
    const w = ui.word.innerText;
    if (w && w !== 'Loading...' && w !== 'Error') {
      window.open(`https://www.google.com/search?q=define+${w}`, '_blank');
    }
  };
}

function setupJapaneseWidget() {
  const card = document.getElementById('card-japanese');
  if (!card) return;

  const ui = {
    word: card.querySelector('.jp-word'),
    yomi: card.querySelector('.jp-yomi'),
    mean: card.querySelector('.jp-meaning'),
    reloadBtn: card.querySelector('.jp-reload-btn'),
  };

  const wordList = [
    { w: '一期一会', y: 'いちごいちえ', m: '一生に一度だけの機会。この出会いを大切にすること。' },
    { w: '花鳥風月', y: 'かちょうふうげつ', m: '自然の美しい景色や、それを愛でる風流な心。' },
    {
      w: '行雲流水',
      y: 'こううんりゅうすい',
      m: '空を行く雲や流れる水のように、物事に執着せず自然の成り行きに任せること。',
    },
    {
      w: '明鏡止水',
      y: 'めいきょうしすい',
      m: '曇りのない鏡や静止した水のように、邪念がなく澄み切った心境。',
    },
    {
      w: '温故知新',
      y: 'おんこちしん',
      m: '昔の物事を研究し、そこから新しい知識や見解を得ること。',
    },
    {
      w: '桜梅桃李',
      y: 'おうばいとうり',
      m: '桜、梅、桃、李（すもも）のこと。それぞれが独自の美しい花を咲かせるように、他人と比べず自分らしく生きること。',
    },
    {
      w: '晴耕雨読',
      y: 'せいこううどく',
      m: '晴れた日は畑を耕し、雨の日は本を読んで過ごす。悠々自適な生活。',
    },
    {
      w: '一陽来復',
      y: 'いちようらいふく',
      m: '冬が去り春が来ること。悪いことが続いた後に、ようやく良い方向に向かうこと。',
    },
    { w: '切磋琢磨', y: 'せっさたくま', m: '仲間同士で励まし合い、学問や人格を磨くこと。' },
    { w: '不撓不屈', y: 'ふとうふくつ', m: 'どんな困難や苦労にもくじけない強い心。' },
    {
      w: '勇往邁進',
      y: 'ゆうおうまいしん',
      m: '目的に向かって、わきめもふらず勇ましく前進すること。',
    },
    { w: '有言実行', y: 'ゆうげんじっこう', m: '口に出したことは、責任を持って必ず実行すること。' },
    {
      w: '因果応報',
      y: 'いんがおうほう',
      m: '良い行いには良い報いが、悪い行いには悪い報いがあるということ。',
    },
    {
      w: '雲外蒼天',
      y: 'うんがいそうてん',
      m: '雲を突き抜けた先には青空が広がっている。困難を乗り越えれば、その先には明るい未来がある。',
    },
    { w: '初志貫徹', y: 'しょしかんてつ', m: '最初に決めた志を、最後まで貫き通すこと。' },
    { w: '日進月歩', y: 'にっしんげっぽ', m: '日に日に、絶えず進歩すること。' },
    {
      w: '百花繚乱',
      y: 'ひゃっかりょうらん',
      m: 'いろいろな花が咲き乱れること。優れた人物や業績が一時期にたくさん現れること。',
    },
    {
      w: '風林火山',
      y: 'ふうりんかざん',
      m: '疾きこと風の如く、徐かなること林の如く、侵掠すること火の如く、動かざること山の如し。',
    },
    { w: '木漏れ日', y: 'こもれび', m: '木の葉の間から差し込む日光。' },
    { w: '泡沫', y: 'うたかた', m: '水面に浮かぶ泡。はかなく消えやすいものの例え。' },
    { w: '茜空', y: 'あかねぞら', m: '秋の夕暮れ時の、赤く染まった空。' },
    { w: '星月夜', y: 'ほしづきよ', m: '月が出ていないが、星が明るく輝いている夜。' },
  ];

  const updateWord = () => {
    const item = wordList[Math.floor(Math.random() * wordList.length)];

    ui.word.style.opacity = 0;
    ui.yomi.style.opacity = 0;
    ui.mean.style.opacity = 0;

    setTimeout(() => {
      ui.word.innerText = item.w;
      ui.yomi.innerText = item.y;
      ui.mean.innerText = item.m;

      ui.word.style.opacity = 1;
      ui.yomi.style.opacity = 1;
      ui.mean.style.opacity = 1;
    }, 200);
  };

  updateWord();

  ui.reloadBtn.onclick = (e) => {
    e.stopPropagation();

    const btn = e.target;
    btn.style.transition = 'transform 0.4s ease';
    btn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
      btn.style.transition = 'none';
      btn.style.transform = 'rotate(0deg)';
    }, 400);

    updateWord();
  };

  card.onclick = (e) => {
    if (e.target === ui.reloadBtn) return;
    const w = ui.word.innerText;
    window.open(`https://www.google.com/search?q=${w}+意味`, '_blank');
  };
}

function setupParticleVoid() {
  const card = document.getElementById('card-particle');
  if (!card) return;

  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  const daysValEl = card.querySelector('.p-days-val');
  const percentEl = card.querySelector('.particle-percent');
  const yearLabel = document.getElementById('p-year-label');

  const now = new Date();
  const currentYear = now.getFullYear();
  const start = new Date(currentYear, 0, 1);
  const end = new Date(currentYear + 1, 0, 1);
  const total = end - start;
  const current = now - start;
  const percent = (current / total) * 100;
  const oneDay = 1000 * 60 * 60 * 24;
  const passedDays = Math.floor(current / oneDay) + 1;
  const remainingDays = Math.ceil((end - now) / oneDay);

  if (yearLabel) yearLabel.innerText = currentYear;
  if (daysValEl) daysValEl.innerText = remainingDays;
  if (percentEl) percentEl.innerText = `${percent.toFixed(1)}%`;

  let particles = [];
  const particleRadius = 4.0;
  let width, height;

  let gravityX = 0;
  let gravityY = 0.25;

  function resize() {
    const rect = card.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    width = canvas.width;
    height = canvas.height;
  }
  window.addEventListener('resize', resize);
  resize();

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    gravityX = mouseX * 0.005;
    gravityY = 0.25 + mouseY * 0.005;
  });

  card.addEventListener('mouseleave', () => {
    gravityX = 0;
    gravityY = 0.25;
  });

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;

      this.vx = (Math.random() - 0.5) * 3;
      this.vy = Math.random() * 5 + 2;
      this.radius = particleRadius;
      this.friction = 0.95;
      this.restitution = 0.4;
    }

    update() {
      this.vx += gravityX;
      this.vy += gravityY;

      this.vx *= 0.99;
      this.vy *= 0.99;

      this.x += this.vx;
      this.y += this.vy;

      if (this.y + this.radius > height) {
        this.y = height - this.radius;
        this.vy *= -this.restitution;
        this.vx *= this.friction;
      } else if (this.y - this.radius < 0) {
        this.y = this.radius;
        this.vy *= -this.restitution;
      }

      if (this.x + this.radius > width) {
        this.x = width - this.radius;
        this.vx *= -this.restitution;
      } else if (this.x - this.radius < 0) {
        this.x = this.radius;
        this.vx *= -this.restitution;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle =
        getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#50E3C2';
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(this.x - 1, this.y - 1, this.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function resolveCollisions() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = p1.radius + p2.radius;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);

          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;

          p1.x -= nx * overlap;
          p1.y -= ny * overlap;
          p2.x += nx * overlap;
          p2.y += ny * overlap;

          const jitter = (Math.random() - 0.5) * 0.1;
          const tx = p1.vx;
          p1.vx = p2.vx * 0.9 + jitter;
          p2.vx = tx * 0.9 - jitter;

          const ty = p1.vy;
          p1.vy = p2.vy * 0.9;
          p2.vy = ty * 0.9;
        }
      }
    }
  }

  for (let i = 0; i < passedDays; i++) {
    particles.push(
      new Particle(
        Math.random() * width,
        Math.random() * -height * 1.5 - 50,
      ),
    );
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => p.update());

    for (let k = 0; k < 3; k++) resolveCollisions();

    particles.forEach((p) => p.draw());
    requestAnimationFrame(animate);
  }

  animate();
}

function setupTvClock() {
  const card = document.getElementById('card-tv-clock');
  if (!card) return;

  const update = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');

    const mStr = now.getMonth() + 1;
    const dStr = now.getDate();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const dayStr = days[now.getDay()];

    const hhmmEl = card.querySelector('.tvc-hhmm');
    const ssEl = card.querySelector('.tvc-ss');
    const dateEl = card.querySelector('.tvc-date');

    if (hhmmEl) hhmmEl.innerText = `${h}:${m}`;
    if (ssEl) ssEl.innerText = s;
    if (dateEl) dateEl.innerText = `${mStr}/${dStr} (${dayStr})`;
  };

  update();
  setInterval(update, 1000);
}

const originalSetupNewModules = setupNewModules;
setupNewModules = function () {
  originalSetupNewModules();
  setupTvClock();
  setupCurrencyWidget();
};

function setupCurrencyWidget() {
  const card = document.getElementById('card-currency');
  if (!card) return;

  const update = () => {
    chrome.runtime.sendMessage({ action: 'fetchCurrency' }, (res) => {
      const valEl = card.querySelector('.curr-value');
      const updateEl = card.querySelector('.curr-update');

      if (!res || res.error || !res.data) {
        if (valEl) valEl.innerText = 'Error';
        return;
      }

      const rate = res.data.rates.JPY;
      if (rate) {
        if (valEl) valEl.innerText = rate.toFixed(2);

        const now = new Date();
        const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (updateEl) updateEl.innerText = `Updated: ${timeStr}`;
      }
    });
  };

  update();
  setInterval(update, 30 * 60 * 1000);
}
