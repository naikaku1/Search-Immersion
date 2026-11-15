/* =====================================================================
   Search Immersion v28 — 検索の強化
   - !bang（!yt 猫 / 猫 !yt）で検索先を切り替える。自分で追加もできる
   - 計算・単位換算をその場で答える（Enter でコピー）
   - 開いているタブ・ブックマークを探して切り替える
   - > で始めるとコマンドパレット（テーマ変更・Zen・タイマー・タブ整理など）
   - Ctrl/⌘+K でコマンドパレット、/ で検索欄へ
   外部へ送るのは従来どおり Google の検索候補だけ。ここで足した処理は端末内で完結する。
   ===================================================================== */
(() => {
  const ICON = {
    bang: siIcon('arrow'),
    calc: siIcon('calc'),
    tab: siIcon('tab'),
    bookmark: siIcon('bookmark'),
    cmd: siIcon('command'),
    timer: siIcon('timer'),
    session: siIcon('layers'),
  };

  /* ------------------------------------------------------------ !bang */
  const DEFAULT_BANGS = [
    { key: 'g', name: 'Google', url: 'https://www.google.com/search?q=%s' },
    { key: 'yt', name: 'YouTube', url: 'https://www.youtube.com/results?search_query=%s' },
    { key: 'ytm', name: 'YouTube Music', url: 'https://music.youtube.com/search?q=%s' },
    { key: 'w', name: 'Wikipedia', url: 'https://{lang}.wikipedia.org/w/index.php?search=%s' },
    { key: 'gh', name: 'GitHub', url: 'https://github.com/search?q=%s' },
    { key: 'a', name: 'Amazon', url: 'https://www.amazon.co.jp/s?k=%s' },
    { key: 'm', name: 'Google Maps', url: 'https://www.google.com/maps/search/%s' },
    { key: 'i', name: 'Google Images', url: 'https://www.google.com/search?tbm=isch&q=%s' },
    { key: 'tr', name: 'Google Translate', url: 'https://translate.google.com/?sl=auto&text=%s' },
    { key: 'x', name: 'X', url: 'https://x.com/search?q=%s' },
    { key: 'r', name: 'Reddit', url: 'https://www.reddit.com/search/?q=%s' },
    { key: 'so', name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=%s' },
    { key: 'mdn', name: 'MDN', url: 'https://developer.mozilla.org/search?q=%s' },
    { key: 'd', name: 'Weblio', url: 'https://www.weblio.jp/content/%s' },
    { key: 'claude', name: 'Claude', url: 'https://claude.ai/new?q=%s' },
  ];

  const uiLang = () => {
    const p = getPrefs().language || 'auto';
    const l = p === 'auto' ? (navigator.language || 'en').slice(0, 2) : p.slice(0, 2);
    return l === 'zh' ? 'zh' : l;
  };

  function loadBangs() {
    let custom = [];
    try {
      custom = JSON.parse(localStorage.getItem('immersion_search_bangs')) || [];
    } catch (e) {}
    if (!Array.isArray(custom)) custom = [];
    custom = custom.filter(
      (b) => b && /^[a-z0-9_-]{1,12}$/i.test(b.key) && typeof b.url === 'string' && /^https?:\/\//.test(b.url),
    );
    const map = new Map();
    DEFAULT_BANGS.forEach((b) => map.set(b.key, { ...b, builtin: true }));
    custom.forEach((b) => map.set(b.key.toLowerCase(), { key: b.key.toLowerCase(), name: b.name || b.key, url: b.url }));
    return [...map.values()];
  }

  function bangUrl(bang, query) {
    return bang.url.replace('{lang}', uiLang()).replace('%s', encodeURIComponent(query));
  }

  /* "!yt 猫" / "猫 !yt" の両方を読む */
  function parseBang(text) {
    const m1 = text.match(/^!([a-z0-9_-]+)(?:\s+(.*))?$/i);
    const m2 = text.match(/^(.*\S)\s+!([a-z0-9_-]+)$/i);
    let key, q;
    if (m1) {
      key = m1[1];
      q = m1[2] || '';
    } else if (m2) {
      key = m2[2];
      q = m2[1];
    } else return null;
    const bang = loadBangs().find((b) => b.key === key.toLowerCase());
    return bang ? { bang, query: q.trim() } : null;
  }

  function openUrl(url, ev) {
    if (ev && (ev.metaKey || ev.ctrlKey)) {
      chrome.tabs.create({ url, active: false });
      return;
    }
    window.location.href = url;
  }

  /* --------------------------------------------- 計算（eval を使わない） */
  const FUNCS = {
    sqrt: Math.sqrt,
    abs: Math.abs,
    sin: (x) => Math.sin(x),
    cos: (x) => Math.cos(x),
    tan: (x) => Math.tan(x),
    log: Math.log10,
    ln: Math.log,
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil,
  };
  const CONSTS = { pi: Math.PI, π: Math.PI, e: Math.E };

  function evaluate(src) {
    const s = src
      .replace(/[×xX]/g, (c, i, str) => (/[\d)]\s*$/.test(str.slice(0, i)) ? '*' : c))
      .replace(/÷/g, '/')
      .replace(/，/g, ',')
      .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
      .replace(/＋/g, '+')
      .replace(/－|ー/g, '-')
      .replace(/＊/g, '*')
      .replace(/／/g, '/')
      .replace(/（/g, '(')
      .replace(/）/g, ')')
      .replace(/(\d),(\d{3})/g, '$1$2');
    let i = 0;
    const peek = () => s[i];
    const skip = () => {
      while (s[i] === ' ') i++;
    };
    const num = () => {
      skip();
      const m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i);
      if (m) {
        i += m[0].length;
        return parseFloat(m[0]);
      }
      const w = s.slice(i).match(/^[a-zπ]+/i);
      if (w) {
        const name = w[0].toLowerCase();
        i += w[0].length;
        if (FUNCS[name]) {
          skip();
          if (s[i] !== '(') throw new Error('fn');
          i++;
          const v = expr();
          skip();
          if (s[i] !== ')') throw new Error(')');
          i++;
          return FUNCS[name](v);
        }
        if (name in CONSTS) return CONSTS[name];
        throw new Error('word');
      }
      if (s[i] === '(') {
        i++;
        const v = expr();
        skip();
        if (s[i] !== ')') throw new Error(')');
        i++;
        return v;
      }
      throw new Error('num');
    };
    const unary = () => {
      skip();
      if (s[i] === '-') {
        i++;
        return -unary();
      }
      if (s[i] === '+') {
        i++;
        return unary();
      }
      let v = num();
      skip();
      if (s[i] === '%') {
        i++;
        v = v / 100;
      }
      return v;
    };
    const power = () => {
      const b = unary();
      skip();
      if (s[i] === '^' || (s[i] === '*' && s[i + 1] === '*')) {
        i += s[i] === '^' ? 1 : 2;
        return Math.pow(b, power());
      }
      return b;
    };
    const term = () => {
      let v = power();
      for (;;) {
        skip();
        const c = peek();
        if (c === '*' && s[i + 1] !== '*') {
          i++;
          v *= power();
        } else if (c === '/') {
          i++;
          v /= power();
        } else if (c === '(') {
          v *= power();
        } else return v;
      }
    };
    const expr = () => {
      let v = term();
      for (;;) {
        skip();
        const c = peek();
        if (c === '+') {
          i++;
          v += term();
        } else if (c === '-') {
          i++;
          v -= term();
        } else return v;
      }
    };
    const v = expr();
    skip();
    if (i !== s.length) throw new Error('rest');
    return v;
  }

  function looksLikeMath(text) {
    const tx = text
      .trim()
      .replace(/^=/, '')
      .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
      .replace(/(\d)\s*[xX×]\s*(?=\d)/g, '$1*');
    if (tx.length < 2 || !/\d/.test(tx)) return false;
    if (!/[+\-*/^%×÷()（）＋－＊／]|sqrt|sin|cos|tan|log|ln|pi|π/i.test(tx)) return false;
    if (/^\d+(-\d+)+$/.test(tx)) return false; /* 電話番号・日付らしきもの */
    return /^[\d\s.,+\-*/^%()×÷xX０-９＋－ー＊／（）πa-z]+$/i.test(tx);
  }

  function formatNumber(v) {
    if (!isFinite(v)) return null;
    const r = Math.abs(v) >= 1e15 || (Math.abs(v) < 1e-6 && v !== 0) ? v.toExponential(6) : String(+v.toPrecision(12));
    return r;
  }

  /* --------------------------------------------------------- 単位換算 */
  const UNITS = {
    mm: ['len', 0.001], cm: ['len', 0.01], m: ['len', 1], km: ['len', 1000],
    in: ['len', 0.0254], inch: ['len', 0.0254], ft: ['len', 0.3048], yd: ['len', 0.9144], mi: ['len', 1609.344], mile: ['len', 1609.344],
    mg: ['mass', 0.001], g: ['mass', 1], kg: ['mass', 1000], t: ['mass', 1e6], lb: ['mass', 453.59237], lbs: ['mass', 453.59237], oz: ['mass', 28.349523125],
    ml: ['vol', 0.001], l: ['vol', 1], gal: ['vol', 3.785411784], cup: ['vol', 0.2365882365], floz: ['vol', 0.0295735295625],
    'km/h': ['spd', 1 / 3.6], kmh: ['spd', 1 / 3.6], mph: ['spd', 0.44704], 'm/s': ['spd', 1], kn: ['spd', 0.514444],
    b: ['data', 1], kb: ['data', 1024], mb: ['data', 1024 ** 2], gb: ['data', 1024 ** 3], tb: ['data', 1024 ** 4],
    sec: ['time', 1], s: ['time', 1], min: ['time', 60], h: ['time', 3600], hr: ['time', 3600], day: ['time', 86400], week: ['time', 604800],
    c: ['temp'], '°c': ['temp'], f: ['temp'], '°f': ['temp'], k: ['temp'],
    '坪': ['area', 3.305785], '畳': ['area', 1.62], 'm2': ['area', 1], 'm²': ['area', 1], ha: ['area', 10000], acre: ['area', 4046.8564224],
  };
  const JA_UNIT = { 'キロ': 'km', 'メートル': 'm', 'センチ': 'cm', 'ミリ': 'mm', 'インチ': 'in', 'フィート': 'ft', 'マイル': 'mi', 'キログラム': 'kg', 'グラム': 'g', 'ポンド': 'lb', 'オンス': 'oz', 'リットル': 'l', '度': 'c', '℃': 'c', '℉': 'f' };

  function normUnit(u) {
    const x = u.trim().toLowerCase();
    return JA_UNIT[u.trim()] || x;
  }

  function convert(text) {
    const m = text
      .trim()
      .match(/^(-?[\d.,]+)\s*([^\s\d]+?)\s*(?:to|in|→|->|は|を)\s*([^\s\d]+?)(?:\s*(?:で|に|だと|は\?|\?|？))?$/i);
    if (!m) return null;
    const value = parseFloat(m[1].replace(/,/g, ''));
    const from = normUnit(m[2]);
    const to = normUnit(m[3]);
    const a = UNITS[from];
    const b = UNITS[to];
    if (!a || !b || a[0] !== b[0] || !isFinite(value)) return null;
    let out;
    if (a[0] === 'temp') {
      const toC = { c: (v) => v, '°c': (v) => v, f: (v) => ((v - 32) * 5) / 9, '°f': (v) => ((v - 32) * 5) / 9, k: (v) => v - 273.15 };
      const fromC = { c: (v) => v, '°c': (v) => v, f: (v) => (v * 9) / 5 + 32, '°f': (v) => (v * 9) / 5 + 32, k: (v) => v + 273.15 };
      out = fromC[to](toC[from](value));
    } else {
      out = (value * a[1]) / b[1];
    }
    const label = formatNumber(+out.toPrecision(8));
    return label == null ? null : { value: label, unit: m[3].trim(), expr: `${m[1]} ${m[2]}` };
  }

  /* ------------------------------------------------------ トースト */
  function toast(msg) {
    let el = document.getElementById('si-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'si-toast';
      (document.getElementById('immersion-root') || document.body).appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 1800);
  }
  window.SI.toast = toast;

  function copy(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast(t('sp_copied', { v: text })))
      .catch(() => toast(text));
  }

  /* ---------------------------------------------------- クイックタイマー
     どのカード構成でも使えるよう、画面上部に小さな札として出す。
     終了時刻を基準に数えるので、タブが裏に回ってもずれない。 */
  const QT = { endAt: 0, label: '', iv: null };
  function startQuickTimer(minutes, label) {
    const mins = Math.max(0.1, Math.min(600, minutes));
    QT.endAt = Date.now() + mins * 60000;
    QT.label = label || '';
    try {
      localStorage.setItem('si_quick_timer', JSON.stringify({ endAt: QT.endAt, label: QT.label }));
    } catch (e) {}
    runQuickTimer();
    toast(t('sp_timer_started', { n: formatNumber(mins) }));
  }
  function stopQuickTimer() {
    QT.endAt = 0;
    clearInterval(QT.iv);
    QT.iv = null;
    try {
      localStorage.removeItem('si_quick_timer');
    } catch (e) {}
    document.getElementById('si-quick-timer')?.remove();
  }
  function chime() {
    try {
      const ctx = siAudio();
      const n = ctx.currentTime;
      [0, 0.25, 0.5].forEach((d, k) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = [880, 1175, 1568][k];
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, n + d);
        g.gain.exponentialRampToValueAtTime(0.4, n + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, n + d + 0.9);
        o.start(n + d);
        o.stop(n + d + 1);
      });
    } catch (e) {}
  }
  function runQuickTimer() {
    let el = document.getElementById('si-quick-timer');
    if (!el) {
      el = document.createElement('button');
      el.id = 'si-quick-timer';
      el.type = 'button';
      el.title = t('sp_timer_stop');
      el.onclick = stopQuickTimer;
      (document.getElementById('immersion-root') || document.body).appendChild(el);
    }
    clearInterval(QT.iv);
    const tick = () => {
      const left = Math.max(0, Math.round((QT.endAt - Date.now()) / 1000));
      const mm = String(Math.floor(left / 60)).padStart(2, '0');
      const ss = String(left % 60).padStart(2, '0');
      el.innerHTML = `${siIcon('timer')}<span>${escapeHTML(QT.label ? QT.label + ' · ' : '')}${mm}:${ss}</span>`;
      if (left <= 0) {
        clearInterval(QT.iv);
        el.classList.add('done');
        el.innerHTML = `${siIcon('check')}<span>${escapeHTML(t('sp_timer_done'))}</span>`;
        chime();
        try {
          localStorage.removeItem('si_quick_timer');
        } catch (e) {}
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Search Immersion', { body: t('sp_timer_done') });
        }
        setTimeout(() => el.remove(), 15000);
      }
    };
    tick();
    QT.iv = setInterval(tick, 500);
  }
  window.SI.startQuickTimer = startQuickTimer;

  /* ------------------------------------------------------ タブ・セッション */
  const NEWTAB_BASE = chrome.runtime.getURL('');
  const isOwnTab = (tab) => !tab.url || tab.url.startsWith(NEWTAB_BASE) || tab.url.startsWith('chrome://newtab');

  function focusTab(tab) {
    chrome.tabs.update(tab.id, { active: true });
    if (tab.windowId != null) chrome.windows.update(tab.windowId, { focused: true });
  }

  function loadSessions() {
    try {
      const v = JSON.parse(localStorage.getItem('immersion_sessions')) || [];
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }
  function saveSessions(list) {
    localStorage.setItem('immersion_sessions', JSON.stringify(list.slice(0, 20)));
    document.dispatchEvent(new CustomEvent('si:sessions-changed'));
  }
  function saveCurrentWindow(name) {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const items = (tabs || [])
        .filter((tb) => !isOwnTab(tb) && /^https?:/.test(tb.url))
        .map((tb) => ({ url: tb.url, title: (tb.title || tb.url).slice(0, 200) }));
      if (!items.length) {
        toast(t('sp_session_empty'));
        return;
      }
      const list = loadSessions();
      const d = new Date();
      list.unshift({
        id: 's' + Date.now().toString(36),
        name: name || `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
        at: Date.now(),
        items,
      });
      saveSessions(list);
      toast(t('sp_session_saved', { n: items.length }));
    });
  }
  function restoreSession(sess) {
    (sess.items || []).forEach((it, idx) => chrome.tabs.create({ url: it.url, active: idx === 0 }));
  }
  window.SI.sessions = { load: loadSessions, save: saveSessions, saveCurrentWindow, restore: restoreSession };

  function closeDuplicateTabs() {
    chrome.tabs.query({}, (tabs) => {
      const seen = new Map();
      const dupes = [];
      (tabs || []).forEach((tb) => {
        if (isOwnTab(tb) || !tb.url) return;
        const key = tb.url.replace(/#.*$/, '');
        if (seen.has(key)) dupes.push(tb);
        else seen.set(key, tb);
      });
      if (!dupes.length) {
        toast(t('sp_no_dupes'));
        return;
      }
      if (!confirm(t('sp_close_dupes_confirm', { n: dupes.length }))) return;
      chrome.tabs.remove(dupes.map((d) => d.id), () => toast(t('sp_dupes_closed', { n: dupes.length })));
    });
  }

  /* ------------------------------------------------------- コマンド */
  function setTheme(mode) {
    setPrefs({ themeMode: mode });
    applyPreferences();
    toast(t('sp_theme_set', { name: t('theme_' + mode) }));
  }

  function commandList() {
    const themes = ['glass', 'liquidglass', 'rain', 'paper', 'line', 'yarn', 'terminal', 'retro', 'lite', 'mono'];
    const cmds = [
      { id: 'settings', title: t('sp_cmd_settings'), run: () => document.getElementById('settings-btn')?.click() },
      { id: 'zen', title: t('sp_cmd_zen'), run: () => document.getElementById('zen-btn')?.click() },
      {
        id: 'horizon',
        title: t('sp_cmd_horizon'),
        run: () => {
          if (typeof ambEnter === 'function') ambEnter();
          else document.getElementById('ambient-btn')?.click();
        },
      },
      ...themes.map((m) => ({ id: 'theme-' + m, title: t('sp_cmd_theme', { name: t('theme_' + m) }), run: () => setTheme(m) })),
      { id: 'timer', title: t('sp_cmd_timer'), hint: '> timer 25', arg: true, run: (arg) => startQuickTimer(parseFloat(arg) || 25) },
      { id: 'timer-stop', title: t('sp_timer_stop'), run: stopQuickTimer, when: () => !!QT.endAt },
      { id: 'session-save', title: t('sp_cmd_session_save'), run: (arg) => saveCurrentWindow(arg) , arg: true },
      { id: 'dupes', title: t('sp_cmd_dupes'), run: closeDuplicateTabs },
      {
        id: 'bookmarks',
        title: t('sp_cmd_bookmarks'),
        run: () => enableBookmarks(),
        when: () => !getPrefs().searchBookmarks,
      },
      {
        id: 'notify',
        title: t('sp_cmd_notify'),
        when: () => 'Notification' in window && Notification.permission === 'default',
        run: () => Notification.requestPermission(),
      },
    ];
    (window.SI.commands || []).forEach((c) => cmds.push(c));
    return cmds.filter((c) => !c.when || c.when());
  }

  function matchCommands(q) {
    const raw = q.replace(/^>\s*/, '');
    const [head, ...rest] = raw.split(/\s+/);
    const arg = rest.join(' ');
    const needle = raw.toLowerCase();
    const all = commandList();
    const scored = all
      .map((c) => {
        const hay = (c.title + ' ' + c.id).toLowerCase();
        let score = 0;
        if (!needle) score = 1;
        else if (hay.includes(needle)) score = 3;
        else if (head && (c.id.startsWith(head.toLowerCase()) || hay.includes(head.toLowerCase()))) score = 2;
        else if (needle.split(/\s+/).every((w) => hay.includes(w))) score = 1;
        return { c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, 10).map(({ c }) => ({
      kind: 'cmd',
      text: c.title,
      sub: c.hint || '',
      iconSvg: ICON.cmd,
      keepInput: true,
      fill: q,
      run: () => {
        const input = document.getElementById('search-input');
        if (input) input.value = '';
        window.SI.hideSuggestions && window.SI.hideSuggestions();
        c.run(c.arg ? arg : undefined);
      },
    }));
  }

  function enableBookmarks() {
    chrome.permissions.request({ permissions: ['bookmarks'] }, (ok) => {
      setPrefs({ searchBookmarks: !!ok });
      const box = document.getElementById('set-search-bookmarks');
      if (box) box.checked = !!ok;
      toast(ok ? t('sp_bookmarks_on') : t('sp_bookmarks_denied'));
    });
  }
  window.SI.enableBookmarks = enableBookmarks;

  /* ------------------------------------------------------ 候補の供給 */
  window.SI.suggestProviders.push({
    id: 'commands',
    exclusive: (q) => q.trim().startsWith('>') || /^!\S*$/.test(q.trim()) || !!parseBang(q.trim()),
    suggest: (q) => {
      const tx = q.trim();
      if (tx.startsWith('>')) return matchCommands(tx);
      if (/^!\S*$/.test(tx)) {
        const key = tx.slice(1).toLowerCase();
        return loadBangs()
          .filter((b) => b.key.startsWith(key))
          .slice(0, 10)
          .map((b) => ({
            kind: 'bang',
            text: `!${b.key}`,
            sub: b.name,
            iconSvg: ICON.bang,
            fill: `!${b.key} `,
            run: () => {
              const input = document.getElementById('search-input');
              input.value = `!${b.key} `;
              input.focus();
              window.SI.refreshSuggestions();
            },
          }));
      }
      return [];
    },
  });

  window.SI.suggestProviders.push({
    id: 'instant',
    suggest: (q) => {
      const out = [];
      const tx = q.trim();
      if (!tx) return out;
      const pb = parseBang(tx);
      if (pb && pb.query) {
        out.push({
          kind: 'bang',
          text: t('sp_bang_search', { name: pb.bang.name, q: pb.query }),
          sub: `!${pb.bang.key}`,
          iconSvg: ICON.bang,
          keepInput: true,
          fill: tx,
          run: (ev) => openUrl(bangUrl(pb.bang, pb.query), ev),
        });
        return out;
      }
      if (getPrefs().searchCalc !== false) {
        const conv = convert(tx);
        if (conv) {
          out.push({
            kind: 'calc',
            text: `${conv.value} ${conv.unit}`,
            sub: `${conv.expr} → ${t('sp_enter_copy')}`,
            iconSvg: ICON.calc,
            keepInput: true,
            fill: tx,
            run: () => copy(conv.value),
          });
        } else if (looksLikeMath(tx)) {
          try {
            const v = formatNumber(evaluate(tx.replace(/^=/, '')));
            if (v != null) {
              out.push({
                kind: 'calc',
                text: `= ${v}`,
                sub: t('sp_enter_copy'),
                iconSvg: ICON.calc,
                keepInput: true,
                fill: tx,
                run: () => copy(v),
              });
            }
          } catch (e) {}
        }
      }
      return out;
    },
  });

  window.SI.suggestProviders.push({
    id: 'tabs',
    suggest: (q) =>
      new Promise((resolve) => {
        const tx = q.trim().toLowerCase();
        if (tx.length < 2 || tx.startsWith('>') || tx.startsWith('!') || getPrefs().searchTabs === false) return resolve([]);
        const words = tx.split(/\s+/);
        chrome.tabs.query({}, (tabs) => {
          const hits = (tabs || [])
            .filter((tb) => !isOwnTab(tb))
            .filter((tb) => {
              const hay = ((tb.title || '') + ' ' + (tb.url || '')).toLowerCase();
              return words.every((w) => hay.includes(w));
            })
            .slice(0, 3)
            .map((tb) => ({
              kind: 'tab',
              text: tb.title || tb.url,
              sub: (() => {
                try {
                  return new URL(tb.url).hostname;
                } catch (e) {
                  return '';
                }
              })(),
              img: tb.favIconUrl && /^https?:|^data:image\//.test(tb.favIconUrl) ? tb.favIconUrl : '',
              iconSvg: ICON.tab,
              badge: t('sp_switch_tab'),
              keepInput: true,
              fill: q,
              run: () => focusTab(tb),
            }));
          resolve(hits);
        });
      }),
  });

  window.SI.suggestProviders.push({
    id: 'bookmarks',
    position: 'bottom',
    suggest: (q) =>
      new Promise((resolve) => {
        const tx = q.trim();
        if (tx.length < 2 || /^[>!]/.test(tx) || !getPrefs().searchBookmarks || !chrome.bookmarks) return resolve([]);
        chrome.bookmarks.search(tx, (nodes) => {
          if (chrome.runtime.lastError) return resolve([]);
          resolve(
            (nodes || [])
              .filter((n) => n.url && /^https?:/.test(n.url))
              .slice(0, 3)
              .map((n) => ({
                kind: 'bookmark',
                text: n.title || n.url,
                sub: n.url.replace(/^https?:\/\//, '').slice(0, 60),
                iconSvg: ICON.bookmark,
                keepInput: true,
                fill: q,
                run: (ev) => openUrl(n.url, ev),
              })),
          );
        });
      }),
  });

  /* Enter（候補を選んでいないとき）の扱い */
  window.SI.handleEnter = (val, ev) => {
    const tx = val.trim();
    if (tx.startsWith('>')) {
      const list = matchCommands(tx);
      if (list[0]) list[0].run();
      return true;
    }
    const pb = parseBang(tx);
    if (pb) {
      openUrl(pb.query ? bangUrl(pb.bang, pb.query) : new URL(pb.bang.url.replace('{lang}', uiLang())).origin, ev);
      return true;
    }
    if (getPrefs().searchCalc !== false) {
      const conv = convert(tx);
      if (conv) {
        copy(conv.value);
        return true;
      }
      if (looksLikeMath(tx)) {
        try {
          const v = formatNumber(evaluate(tx.replace(/^=/, '')));
          if (v != null) {
            copy(v);
            return true;
          }
        } catch (e) {}
      }
    }
    return false;
  };

  /* ------------------------------------------------- キーボード */
  function openPalette() {
    const input = document.getElementById('search-input');
    if (!input) return;
    input.value = '> ';
    input.focus();
    input.dispatchEvent(new Event('input'));
  }
  window.SI.openPalette = openPalette;

  document.addEventListener('keydown', (e) => {
    const typing = e.target && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openPalette();
      return;
    }
    if (!typing && e.key === '/' && !e.metaKey && !e.ctrlKey) {
      const input = document.getElementById('search-input');
      if (input) {
        e.preventDefault();
        input.focus();
      }
    }
  });

  /* ------------------------------------------------- 設定画面 */
  function renderBangSettings() {
    const host = document.getElementById('si-bang-list');
    if (!host) return;
    host.textContent = '';
    let custom = [];
    try {
      custom = JSON.parse(localStorage.getItem('immersion_search_bangs')) || [];
    } catch (e) {}
    loadBangs().forEach((b) => {
      const row = document.createElement('div');
      row.className = 'si-bang-row';
      const key = document.createElement('code');
      key.textContent = '!' + b.key;
      const name = document.createElement('span');
      name.textContent = b.name;
      row.append(key, name);
      if (!b.builtin || custom.some((c) => c.key === b.key)) {
        const del = document.createElement('button');
        del.className = 'st-btn-small';
        del.textContent = '×';
        del.onclick = () => {
          const next = custom.filter((c) => c.key !== b.key);
          localStorage.setItem('immersion_search_bangs', JSON.stringify(next));
          renderBangSettings();
        };
        row.appendChild(del);
      }
      host.appendChild(row);
    });
  }

  function wireSettings() {
    const pane = document.getElementById('tab-search');
    if (!pane) return;
    const prefs = getPrefs();
    const bind = (id, key, def, onEnable) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.checked = prefs[key] == null ? def : !!prefs[key];
      el.onchange = () => {
        if (el.checked && onEnable) {
          el.checked = false;
          onEnable();
          return;
        }
        setPrefs({ [key]: el.checked });
      };
    };
    bind('set-search-google', 'searchSuggestGoogle', true);
    bind('set-search-history', 'searchSuggestHistory', true);
    bind('set-search-tabs', 'searchTabs', true);
    bind('set-search-calc', 'searchCalc', true);
    bind('set-search-bookmarks', 'searchBookmarks', false, enableBookmarks);

    const add = document.getElementById('si-bang-add');
    if (add) {
      add.onclick = () => {
        const key = document.getElementById('si-bang-key').value.trim().replace(/^!/, '').toLowerCase();
        const name = document.getElementById('si-bang-name').value.trim();
        const url = document.getElementById('si-bang-url').value.trim();
        if (!/^[a-z0-9_-]{1,12}$/.test(key) || !/^https?:\/\/.+%s/.test(url)) {
          alert(t('sp_bang_invalid'));
          return;
        }
        let custom = [];
        try {
          custom = JSON.parse(localStorage.getItem('immersion_search_bangs')) || [];
        } catch (e) {}
        custom = custom.filter((c) => c.key !== key);
        custom.push({ key, name: name || key, url });
        localStorage.setItem('immersion_search_bangs', JSON.stringify(custom));
        ['si-bang-key', 'si-bang-name', 'si-bang-url'].forEach((id) => (document.getElementById(id).value = ''));
        renderBangSettings();
      };
    }
    renderBangSettings();
  }

  function buildSettingsPane() {
    if (document.getElementById('tab-search')) return;
    const nav = document.querySelector('.st-sidebar');
    const scroll = document.querySelector('.st-content-scroll');
    if (!nav || !scroll) return;
    const btn = document.createElement('button');
    btn.className = 'st-tab-btn';
    btn.dataset.tab = 'tab-search';
    btn.innerHTML =
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';
    btn.appendChild(document.createTextNode(' ' + t('settings_search')));
    const general = nav.querySelector('[data-tab="tab-general"]');
    general.after(btn);

    const sec = document.createElement('div');
    sec.id = 'tab-search';
    sec.className = 'st-section';
    const toggleRow = (id, label, desc) => `
      <div class="st-row column-layout">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
          <span>${escapeHTML(label)}</span>
          <label class="toggle-switch"><input type="checkbox" id="${id}"><span class="slider"></span></label>
        </div>
        ${desc ? `<div class="st-desc">${escapeHTML(desc)}</div>` : ''}
      </div>`;
    sec.innerHTML = `
      <div class="st-section-sub">${escapeHTML(t('search_sub'))}</div>
      <div class="st-group-title">${escapeHTML(t('search_group_sources'))}</div>
      ${toggleRow('set-search-google', t('search_google'), t('search_google_desc'))}
      ${toggleRow('set-search-history', t('search_history'), t('search_history_desc'))}
      ${toggleRow('set-search-tabs', t('search_tabs'), t('search_tabs_desc'))}
      ${toggleRow('set-search-bookmarks', t('search_bookmarks'), t('search_bookmarks_desc'))}
      ${toggleRow('set-search-calc', t('search_calc'), t('search_calc_desc'))}
      <div class="st-group-title" style="margin-top:22px;">${escapeHTML(t('search_group_bangs'))}</div>
      <div class="st-desc" style="margin:-8px 0 12px;">${escapeHTML(t('search_bangs_desc'))}</div>
      <div id="si-bang-list" class="si-bang-list"></div>
      <div class="si-bang-add">
        <input id="si-bang-key" class="st-input" placeholder="yt2" maxlength="12">
        <input id="si-bang-name" class="st-input" placeholder="${escapeHTML(t('search_bang_name'))}">
        <input id="si-bang-url" class="st-input" placeholder="https://example.com/search?q=%s">
        <button id="si-bang-add" class="st-btn">${escapeHTML(t('add_item_btn'))}</button>
      </div>
      <div class="st-group-title" style="margin-top:22px;">${escapeHTML(t('search_group_keys'))}</div>
      <div class="st-desc si-keys">${t('search_keys_desc')}</div>
    `;
    scroll.appendChild(sec);

    /* 既存のタブ切替は初期化時に配線済みなので、新しいタブにも同じ動きを付ける */
    btn.onclick = () => {
      document.querySelectorAll('.st-tab-btn').forEach((x) => x.classList.remove('active'));
      document.querySelectorAll('.st-section').forEach((x) => x.classList.remove('active'));
      btn.classList.add('active');
      sec.classList.add('active');
      const title = document.getElementById('st-header-title');
      if (title) title.innerText = t('settings_search');
      scroll.scrollTop = 0;
    };
    document.querySelectorAll('.st-tab-btn').forEach((other) => {
      if (other === btn) return;
      other.addEventListener('click', () => sec.classList.remove('active'));
    });
    wireSettings();
  }

  siRegister({
    id: 'search-plus',
    init() {
      buildSettingsPane();
      try {
        const saved = JSON.parse(localStorage.getItem('si_quick_timer'));
        if (saved && saved.endAt > Date.now()) {
          QT.endAt = saved.endAt;
          QT.label = saved.label || '';
          runQuickTimer();
        }
      } catch (e) {}
    },
  });

  /* テスト用に外へ出しておく（DevTools から確認できる） */
  window.SI._calc = { evaluate, convert, parseBang, looksLikeMath };
})();
