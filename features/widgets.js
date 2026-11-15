/* =====================================================================
   Search Immersion v28 — 新しいカード
   - worldclock : 世界時計（API 不要。昼夜と日付のずれも見える）
   - readlater  : あとで読む棚（右クリック「あとで読む」からも入る）
   - sessions   : 作業再開（開いていたタブ一式を保存して戻す）
   - focus      : 集中の庭（ポモドーロ。終えるたびに植物が 1 本増える）
   ===================================================================== */
(() => {
  const $ = (root, sel) => root.querySelector(sel);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const readJSON = (key, fallback) => {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  };
  const writeJSON = (key, v) => localStorage.setItem(key, JSON.stringify(v));
  const faviconOf = (url) => {
    const u = new URL(chrome.runtime.getURL('/_favicon/'));
    u.searchParams.set('pageUrl', url);
    u.searchParams.set('size', '32');
    return u.toString();
  };
  const hostOf = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (e) {
      return '';
    }
  };
  const ago = (ts) => {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return t('w_just_now');
    if (m < 60) return t('w_min_ago', { n: m });
    const h = Math.round(m / 60);
    if (h < 24) return t('w_hour_ago', { n: h });
    return t('w_day_ago', { n: Math.round(h / 24) });
  };

  /* ================================================================ 世界時計 */
  const DEFAULT_ZONES = [
    { tz: 'Europe/London', label: 'London' },
    { tz: 'America/New_York', label: 'New York' },
    { tz: 'Asia/Singapore', label: 'Singapore' },
  ];

  function zoneParts(tz, now) {
    const f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
    return { h: +p.hour, m: +p.minute, ymd: `${p.year}-${p.month}-${p.day}` };
  }
  function localYmd(now) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  function tzOffsetHours(tz, now) {
    const p = zoneParts(tz, now);
    const asUTC = Date.UTC(+p.ymd.slice(0, 4), +p.ymd.slice(5, 7) - 1, +p.ymd.slice(8, 10), p.h, p.m);
    const localUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
    return Math.round(((asUTC - localUTC) / 3600000) * 2) / 2;
  }

  function setupWorldClock() {
    const card = document.querySelector('.worldclock-card');
    if (!card) return;
    const list = $(card, '.wc-list');
    const addBtn = $(card, '.wc-add');
    const form = $(card, '.wc-form');
    const input = $(card, '.wc-input');
    const dl = $(card, 'datalist');

    let zones = readJSON('immersion_worldclock', DEFAULT_ZONES);
    if (!Array.isArray(zones)) zones = DEFAULT_ZONES;
    /* 文字列だけで保存されていた場合も読めるようにする */
    zones = zones
      .map((z) => (typeof z === 'string' ? { tz: z, label: z.split('/').pop().replace(/_/g, ' ') } : z))
      .filter((z) => z && z.tz);

    const all = (Intl.supportedValuesOf && Intl.supportedValuesOf('timeZone')) || [];
    all.forEach((tz) => {
      const o = document.createElement('option');
      o.value = tz.split('/').pop().replace(/_/g, ' ') + ' — ' + tz;
      dl.appendChild(o);
    });

    const render = () => {
      const now = new Date();
      const today = localYmd(now);
      list.textContent = '';
      zones.slice(0, 4).forEach((z, idx) => {
        let p;
        try {
          p = zoneParts(z.tz, now);
        } catch (e) {
          return;
        }
        const row = el('div', 'wc-row');
        row.classList.add(p.h >= 6 && p.h < 18 ? 'is-day' : 'is-night');

        const left = el('div', 'wc-left');
        left.append(el('div', 'wc-name', z.label));
        const off = tzOffsetHours(z.tz, now);
        let rel = off === 0 ? '±0' : (off > 0 ? '+' : '') + off + 'H';
        if (p.ymd > today) rel += ' · ' + t('w_tomorrow');
        if (p.ymd < today) rel += ' · ' + t('w_yesterday');
        left.append(el('div', 'wc-sub', rel));

        const time = el('div', 'wc-time', `${String(p.h).padStart(2, '0')}:${String(p.m).padStart(2, '0')}`);
        const del = el('button', 'wc-del');
        del.innerHTML = siIcon('close');
        del.type = 'button';
        del.title = t('ctx_del');
        del.onclick = () => {
          zones.splice(idx, 1);
          writeJSON('immersion_worldclock', zones);
          render();
        };
        row.append(left, time, del);
        list.appendChild(row);
      });
      addBtn.style.display = zones.length >= 4 ? 'none' : '';
    };

    addBtn.onclick = () => {
      card.classList.toggle('adding');
      if (card.classList.contains('adding')) input.focus();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') card.classList.remove('adding');
    });
    form.onsubmit = (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      const tz = raw.includes('—') ? raw.split('—').pop().trim() : all.find((x) => x.toLowerCase().includes(raw.toLowerCase().replace(/\s+/g, '_')));
      if (!tz || !all.includes(tz)) {
        input.classList.add('bad');
        setTimeout(() => input.classList.remove('bad'), 600);
        return;
      }
      zones.push({ tz, label: raw.includes('—') ? raw.split('—')[0].trim() : tz.split('/').pop().replace(/_/g, ' ') });
      writeJSON('immersion_worldclock', zones);
      input.value = '';
      card.classList.remove('adding');
      render();
    };

    render();
    const now = new Date();
    setTimeout(() => {
      render();
      setInterval(() => !document.hidden && render(), 60000);
    }, (60 - now.getSeconds()) * 1000);
    document.addEventListener('visibilitychange', () => !document.hidden && render());
  }

  /* ============================================================ あとで読む棚 */
  function loadShelf() {
    const v = readJSON('immersion_readlater', []);
    return Array.isArray(v) ? v.filter((x) => x && /^https?:/.test(x.url)) : [];
  }
  function saveShelf(list) {
    writeJSON('immersion_readlater', list.slice(0, 200));
    document.dispatchEvent(new CustomEvent('si:shelf-changed'));
  }
  function addToShelf(url, title) {
    if (!/^https?:\/\//.test(url)) return false;
    const list = loadShelf();
    if (list.some((x) => x.url === url)) return false;
    list.unshift({ url, title: (title || hostOf(url)).slice(0, 200), at: Date.now(), read: false });
    saveShelf(list);
    return true;
  }
  window.SI.shelf = { load: loadShelf, add: addToShelf };

  /* 右クリックで入れた分は background が chrome.storage に置いていく。ここで受け取る */
  function drainInbox() {
    chrome.storage.local.get(['si_shelf_inbox'], (r) => {
      const inbox = r.si_shelf_inbox || [];
      if (!inbox.length) return;
      inbox.forEach((x) => addToShelf(x.url, x.title));
      chrome.storage.local.remove('si_shelf_inbox');
    });
  }

  function setupReadLater() {
    drainInbox();
    chrome.storage.onChanged.addListener((ch, area) => {
      if (area === 'local' && ch.si_shelf_inbox && ch.si_shelf_inbox.newValue) drainInbox();
    });
    const card = document.querySelector('.readlater-card');
    if (!card) return;
    const listEl = $(card, '.rl-list');
    const countEl = $(card, '.rl-count');
    const form = $(card, '.rl-form');
    const input = $(card, '.rl-input');
    const toggle = $(card, '.rl-toggle');
    const addBtn = $(card, '.rl-add');
    let showAll = false;

    const render = () => {
      const list = loadShelf();
      const unread = list.filter((x) => !x.read);
      countEl.textContent = unread.length ? String(unread.length) : '';
      toggle.textContent = showAll ? t('rl_show_unread') : t('rl_show_all');
      toggle.style.display = list.length > unread.length || showAll ? '' : 'none';
      listEl.textContent = '';
      const items = showAll ? list : unread;
      if (!items.length) {
        if (list.length) listEl.appendChild(el('div', 'si-card-empty', t('rl_empty_done')));
        else listEl.appendChild(window.SI.howtoEmpty ? window.SI.howtoEmpty('readlater', t('rl_empty')) : el('div', 'si-card-empty', t('rl_empty')));
        return;
      }
      items.slice(0, 30).forEach((it) => {
        const row = el('a', 'rl-item' + (it.read ? ' read' : ''));
        row.href = it.url;
        const txt = el('div', 'rl-txt');
        txt.append(el('div', 'rl-title', it.title || it.url), el('div', 'rl-sub', `${hostOf(it.url)} · ${ago(it.at)}`));
        const done = el('button', 'rl-btn');
        done.innerHTML = siIcon(it.read ? 'undo' : 'check');
        done.type = 'button';
        done.title = it.read ? t('rl_mark_unread') : t('rl_mark_read');
        done.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const all = loadShelf();
          const hit = all.find((x) => x.url === it.url);
          if (hit) hit.read = !hit.read;
          saveShelf(all);
        };
        const del = el('button', 'rl-btn');
        del.innerHTML = siIcon('close');
        del.type = 'button';
        del.title = t('ctx_del');
        del.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          saveShelf(loadShelf().filter((x) => x.url !== it.url));
        };
        row.onclick = () => {
          const all = loadShelf();
          const hit = all.find((x) => x.url === it.url);
          if (hit) {
            hit.read = true;
            saveShelf(all);
          }
        };
        row.append(txt, done, del);
        listEl.appendChild(row);
      });
    };

    form.onsubmit = (e) => {
      e.preventDefault();
      let url = input.value.trim();
      if (!url) return;
      if (!/^https?:\/\//.test(url)) url = 'https://' + url;
      if (addToShelf(url)) {
        input.value = '';
        card.classList.remove('adding');
      }
    };
    addBtn.onclick = () => {
      card.classList.toggle('adding');
      if (card.classList.contains('adding')) input.focus();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') card.classList.remove('adding');
    });
    toggle.onclick = () => {
      showAll = !showAll;
      render();
    };
    document.addEventListener('si:shelf-changed', render);
    render();
  }

  /* ================================================================ 作業再開 */
  function setupSessions() {
    const card = document.querySelector('.sessions-card');
    if (!card) return;
    const listEl = $(card, '.ss-list');
    const saveBtn = $(card, '.ss-save');

    const render = () => {
      const S = window.SI.sessions;
      if (!S) return;
      const list = S.load();
      listEl.textContent = '';
      if (!list.length) {
        listEl.appendChild(el('div', 'si-card-empty', t('ss_empty')));
        return;
      }
      list.slice(0, 6).forEach((sess) => {
        const row = el('div', 'ss-item');
        row.tabIndex = 0;
        row.title = (sess.items || []).map((x) => x.title).join('\n');
        const txt = el('div', 'rl-txt');
        txt.append(el('div', 'rl-title', sess.name), el('div', 'rl-sub', ago(sess.at)));
        const n = el('div', 'ss-count');
        n.append(el('b', '', String((sess.items || []).length)), el('span', '', 'TABS'));
        const del = el('button', 'rl-btn');
        del.innerHTML = siIcon('close');
        del.type = 'button';
        del.title = t('ctx_del');
        del.onclick = (e) => {
          e.stopPropagation();
          if (!confirm(t('ss_delete_confirm', { name: sess.name }))) return;
          S.save(S.load().filter((x) => x.id !== sess.id));
        };
        row.onclick = () => S.restore(sess);
        row.onkeydown = (e) => e.key === 'Enter' && S.restore(sess);
        row.append(txt, n, del);
        listEl.appendChild(row);
      });
    };
    saveBtn.onclick = () => window.SI.sessions && window.SI.sessions.saveCurrentWindow();
    document.addEventListener('si:sessions-changed', render);
    render();
  }

  /* ============================================================== 集中の庭 */
  const PLANTS = 6;
  /* 線画の植物。線幅と作法はアイコンに揃え、色は currentColor に任せる。
     stage: 0〜1 で茎が伸び、葉が増え、1 で花（または実）が付く */
  function plantSVG(kind, stage) {
    stage = Math.max(0, Math.min(1, stage));
    const base = 58;
    const h = 6 + stage * 40;
    const top = base - h;
    const lean = kind % 2 ? 3 : -3;
    const leaves = Math.round(stage * 4);
    let d = `M30 ${base} C ${30 + lean} ${base - h * 0.45}, ${30 - lean * 0.6} ${base - h * 0.8}, 30 ${top}`;
    let leafs = '';
    for (let i = 0; i < leaves; i++) {
      const y = base - (h * (i + 1)) / (leaves + 1.4);
      const dir = i % 2 ? 1 : -1;
      const len = 7 + (i % 3) * 1.5;
      leafs += `<path d="M30 ${y.toFixed(1)} q ${dir * len * 0.6} ${-len * 0.55} ${dir * len} ${-len * 0.2} q ${-dir * len * 0.35} ${len * 0.45} ${-dir * len} ${len * 0.2}"/>`;
    }
    let crown = '';
    if (stage >= 1) {
      const k = kind % 3;
      if (k === 0) crown = `<circle cx="30" cy="${top - 3}" r="3.2"/>`;
      else if (k === 1)
        crown = [0, 72, 144, 216, 288]
          .map((a) => `<ellipse cx="30" cy="${top - 4.5}" rx="1.6" ry="3" transform="rotate(${a} 30 ${top - 1.5})"/>`)
          .join('');
      else crown = `<path d="M30 ${top} q 4 -4 0 -8 q -4 4 0 8Z"/>`;
    }
    return `<svg viewBox="0 0 60 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/>${leafs}${crown}</svg>`;
  }

  function loadFocus() {
    const v = readJSON('immersion_focus', {});
    return {
      mode: v.mode || 'idle' /* idle | focus | break | paused */,
      endAt: v.endAt || 0,
      left: v.left || 0,
      length: v.length || 25,
      breakLen: v.breakLen || 5,
      garden: Array.isArray(v.garden) ? v.garden.slice(-120) : [],
      kind: v.kind != null ? v.kind : Math.floor(Math.random() * PLANTS),
      phaseTotal: v.phaseTotal || 0,
      withSound: !!v.withSound,
    };
  }
  function saveFocus(st) {
    writeJSON('immersion_focus', st);
  }

  function setupFocus() {
    const card = document.querySelector('.focus-card');
    if (!card) return;
    const bar = $(card, '.fg-bar i');
    const timeEl = $(card, '.fg-time');
    const stateEl = $(card, '.fg-state');
    const plantEl = $(card, '.fg-plant');
    const garden = $(card, '.fg-garden');
    const stats = $(card, '.fg-stats');
    const startBtn = $(card, '.fg-start');
    const stopBtn = $(card, '.fg-stop');
    const lenBtn = $(card, '.fg-len');
    const soundBtn = $(card, '.fg-sound');
    const LENGTHS = [15, 25, 50, 90];

    let st = loadFocus();
    let iv = null;

    const today = () => localYmdKey(new Date());
    function localYmdKey(d) {
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    const renderGarden = () => {
      garden.textContent = '';
      st.garden.slice(-8).forEach((p) => {
        const pot = el('i', 'fg-pot');
        pot.innerHTML = plantSVG(p.kind, 1);
        pot.title = `${new Date(p.at).toLocaleString()} · ${p.min}${t('fg_min_short')}`;
        garden.appendChild(pot);
      });
      const todayMin = st.garden.filter((p) => localYmdKey(new Date(p.at)) === today()).reduce((a, p) => a + p.min, 0);
      stats.textContent = todayMin ? t('fg_today', { min: todayMin }) : '';
    };

    /* 星を付けた ToDo を、そのときの目標として小さく添える */
    const goal = () => {
      if (st.mode !== 'idle') return;
      const top = (typeof siLoadTodos === 'function' ? siLoadTodos() : []).find((x) => x.star && !x.done);
      stateEl.textContent = top ? top.text : '';
      stateEl.classList.toggle('is-goal', !!top);
    };

    const render = () => {
      let left;
      if (st.mode === 'focus' || st.mode === 'break') left = Math.max(0, Math.round((st.endAt - Date.now()) / 1000));
      else if (st.mode === 'paused') left = st.left;
      else left = st.length * 60;
      const total = st.phaseTotal || st.length * 60;
      const done = st.mode === 'idle' ? 0 : 1 - left / total;
      timeEl.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
      bar.style.transform = `scaleX(${Math.max(0, Math.min(1, done))})`;
      card.dataset.mode = st.mode;
      if (st.mode === 'idle') goal();
      else {
        stateEl.classList.remove('is-goal');
        stateEl.textContent = { focus: 'FOCUS', break: 'BREAK', paused: 'PAUSED' }[st.mode];
      }
      const running = st.mode === 'focus' || st.mode === 'break';
      startBtn.innerHTML = siIcon(running ? 'pause' : 'play');
      startBtn.title = running ? t('fg_pause') : st.mode === 'paused' ? t('fg_resume') : t('fg_start');
      stopBtn.style.visibility = st.mode === 'idle' ? 'hidden' : 'visible';
      lenBtn.textContent = st.length + ' MIN';
      lenBtn.disabled = st.mode !== 'idle';
      soundBtn.classList.toggle('on', st.withSound);
      /* 待っている間も、これから育つ芽を薄く見せておく */
      const growth = st.mode === 'focus' || (st.mode === 'paused' && st.pausedFrom !== 'break') ? 0.18 + done * 0.82 : st.mode === 'break' ? 1 : 0.18;
      plantEl.innerHTML = plantSVG(st.kind, growth);

      if (running && left <= 0) finishPhase();
    };

    const sound = (on) => {
      if (!st.withSound || !window.SI.sounds) return;
      if (on) window.SI.sounds.focusStart();
      else window.SI.sounds.focusStop();
    };

    const chime = () => {
      try {
        const ctx = siAudio();
        const n = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((f, k) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.value = f;
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.0001, n + k * 0.18);
          g.gain.exponentialRampToValueAtTime(0.35, n + k * 0.18 + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, n + k * 0.18 + 1.2);
          o.start(n + k * 0.18);
          o.stop(n + k * 0.18 + 1.3);
        });
      } catch (e) {}
    };

    function finishPhase() {
      if (st.mode === 'focus') {
        st.garden.push({ at: Date.now(), min: st.length, kind: st.kind });
        st.kind = Math.floor(Math.random() * PLANTS);
        st.mode = 'break';
        st.phaseTotal = st.breakLen * 60;
        st.endAt = Date.now() + st.phaseTotal * 1000;
        sound(false);
        chime();
        card.classList.add('fg-bloom');
        setTimeout(() => card.classList.remove('fg-bloom'), 1600);
        window.SI.toast && window.SI.toast(t('fg_bloomed'));
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Search Immersion', { body: t('fg_bloomed') });
        }
      } else {
        st.mode = 'idle';
        st.phaseTotal = 0;
        chime();
        stopTick();
      }
      saveFocus(st);
      renderGarden();
      render();
    }

    const startTick = () => {
      clearInterval(iv);
      iv = setInterval(render, 500);
    };
    const stopTick = () => {
      clearInterval(iv);
      iv = null;
    };

    startBtn.onclick = () => {
      if (st.mode === 'idle') {
        st.mode = 'focus';
        st.phaseTotal = st.length * 60;
        st.endAt = Date.now() + st.phaseTotal * 1000;
        sound(true);
        startTick();
      } else if (st.mode === 'focus' || st.mode === 'break') {
        st.pausedFrom = st.mode;
        st.left = Math.max(0, Math.round((st.endAt - Date.now()) / 1000));
        st.mode = 'paused';
        sound(false);
        stopTick();
      } else if (st.mode === 'paused') {
        st.mode = st.pausedFrom || 'focus';
        st.endAt = Date.now() + st.left * 1000;
        if (st.mode === 'focus') sound(true);
        startTick();
      }
      saveFocus(st);
      render();
    };
    stopBtn.onclick = () => {
      if (st.mode === 'focus' && !confirm(t('fg_stop_confirm'))) return;
      st.mode = 'idle';
      st.phaseTotal = 0;
      sound(false);
      stopTick();
      saveFocus(st);
      render();
    };
    lenBtn.onclick = () => {
      if (st.mode !== 'idle') return;
      st.length = LENGTHS[(LENGTHS.indexOf(st.length) + 1) % LENGTHS.length];
      st.breakLen = st.length >= 50 ? 10 : 5;
      saveFocus(st);
      render();
    };
    soundBtn.onclick = () => {
      st.withSound = !st.withSound;
      saveFocus(st);
      render();
    };
    timeEl.onclick = () => startBtn.click();

    document.addEventListener('si:todos-changed', () => st.mode === 'idle' && goal());
    goal();
    renderGarden();
    render();
    if (st.mode === 'focus' || st.mode === 'break') startTick();
  }

  /* ============================================================ 登録 */
  siRegister({
    id: 'widgets',
    modules: {
      worldclock: {
        id: 'worldclock',
        label: 'mod_worldclock',
        html: `
          <div class="glass-card tilt-card module-card worldclock-card">
            <div class="label-std si-card-head"><span>WORLD CLOCK</span><button class="si-icon-btn si-quiet wc-add" type="button">${siIcon('plus')}</button></div>
            <form class="wc-form si-card-form"><input class="wc-input" list="wc-zones" placeholder="Paris, Seoul, Los Angeles" autocomplete="off"><datalist id="wc-zones"></datalist></form>
            <div class="wc-list"></div>
          </div>`,
      },
      readlater: {
        id: 'readlater',
        label: 'mod_readlater',
        html: `
          <div class="glass-card tilt-card module-card readlater-card">
            <div class="label-std si-card-head"><span>READ LATER<b class="rl-count"></b></span><button class="si-icon-btn si-quiet rl-add" type="button">${siIcon('plus')}</button></div>
            <form class="rl-form si-card-form"><input class="rl-input" placeholder="https://" autocomplete="off"></form>
            <div class="rl-list"></div>
            <button class="si-card-foot rl-toggle" type="button"></button>
          </div>`,
      },
      sessions: {
        id: 'sessions',
        label: 'mod_sessions',
        html: `
          <div class="glass-card tilt-card module-card sessions-card">
            <div class="label-std si-card-head"><span>SAVED TABS</span><button class="si-icon-btn si-quiet ss-save" type="button">${siIcon('plus')}</button></div>
            <div class="ss-list"></div>
          </div>`,
      },
      focus: {
        id: 'focus',
        label: 'mod_focus',
        html: `
          <div class="glass-card tilt-card module-card focus-card" data-mode="idle">
            <div class="label-std si-card-head"><span>FOCUS</span>
              <span class="fg-head-r"><button class="si-icon-btn si-quiet fg-sound" type="button">${siIcon('headphones')}</button><button class="fg-len" type="button">25 MIN</button></span>
            </div>
            <div class="fg-plant"></div>
            <div class="fg-main">
              <div class="fg-time">25:00</div>
              <div class="fg-state"></div>
              <div class="fg-btns"><button class="si-icon-btn fg-start" type="button"></button><button class="si-icon-btn fg-stop" type="button">${siIcon('stop')}</button></div>
            </div>
            <div class="fg-foot"><div class="fg-garden"></div><div class="fg-stats"></div></div>
            <div class="fg-bar"><i></i></div>
          </div>`,
      },
    },
    init() {
      document.querySelectorAll('.wc-add').forEach((b) => (b.title = t('w_add_city')));
      document.querySelectorAll('.rl-add').forEach((b) => (b.title = t('rl_placeholder')));
      document.querySelectorAll('.ss-save').forEach((b) => (b.title = t('ss_save')));
      document.querySelectorAll('.fg-sound').forEach((b) => (b.title = t('fg_with_sound')));
      setupWorldClock();
      setupReadLater();
      setupSessions();
      setupFocus();
    },
  });
})();
