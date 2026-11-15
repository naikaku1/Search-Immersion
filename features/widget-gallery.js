/* =====================================================================
   Search Immersion v28 — カードを選ぶ画面
   以前は 3 つの枠それぞれのドロップダウンから、名前だけで選んでいた。
   左に実際の左列（上・中・下）を縮めて置き、右にカードの縮小見本を並べる。
   説明文は置かず、見本そのもので何のカードかが分かるようにする。
   入口：設定のウィジェットタブ／ホームのカードに乗せると出る「入れ替え」／コマンドパレット
   ===================================================================== */
(() => {
  const SLOTS = 3;
  const DEFAULTS = ['weather', 'news', 'countdown'];
  const ORDER = [
    'weather', 'worldclock', 'news', 'earthquake', 'todo', 'focus', 'timer', 'countdown',
    'year_progress', 'calc', 'sounds', 'english', 'japanese', 'readlater', 'sessions', 'webclip',
  ];

  /* 縮小見本。中身は拡張内の定数だけ（外から来た文字列は入れない） */
  const bars = (ws) => ws.map((w) => `<i class="b" style="width:${w}%"></i>`).join('');
  const THUMB = {
    weather: () => `<div class="l">TOKYO</div><span class="ic">${siIcon('cloud')}</span><div class="big">13°</div>`,
    news: () => `<div class="l">NEWS</div><div class="lines">${bars([92, 78, 86, 60])}</div>`,
    countdown: () => `<div class="l">EVENT</div><div class="big">12<em>DAYS</em></div>`,
    todo: () =>
      `<div class="l">TODO LIST</div><div class="lines">${[80, 62, 70].map((w) => `<span class="row"><i class="o"></i><i class="b" style="width:${w}%"></i></span>`).join('')}</div>`,
    calc: () => `<div class="l">CALCULATOR</div><div class="big r">128</div>`,
    timer: () => `<div class="l">TIMER</div><div class="big">05:00</div>`,
    japanese: () => `<div class="l">今日の言葉</div><div class="word jp">日々是好日</div>`,
    english: () => `<div class="l">WORD</div><div class="word">serene</div>`,
    earthquake: () => `<div class="l">EARTHQUAKE</div><div class="big">3<em>M4.2</em></div>`,
    year_progress: () => `<div class="l">YEAR</div><div class="big">48<em>DAYS LEFT</em></div>`,
    worldclock: () =>
      `<div class="l">WORLD CLOCK</div><div class="lines">${[['LONDON', '00:08'], ['NEW YORK', '19:08']]
        .map(([c, h]) => `<span class="row sp"><span class="s">${c}</span><span class="t">${h}</span></span>`)
        .join('')}</div>`,
    focus: () => `<div class="l">FOCUS</div><div class="big">25:00</div><i class="bar"></i>`,
    sounds: () =>
      `<div class="l">AMBIENT SOUND</div><div class="faders">${[60, 0, 0, 30, 0, 0, 0]
        .map((v) => `<i style="--v:${v}%"></i>`)
        .join('')}</div>`,
    readlater: () => `<div class="l">READ LATER</div><div class="lines">${bars([88, 52])}<i class="gap"></i>${bars([70, 40])}</div>`,
    sessions: () => `<div class="l">SAVED TABS</div><div class="big">12<em>TABS</em></div>`,
    webclip: () => `<div class="l">WEB CLIP</div><div class="shot"></div>`,
  };
  function thumbHTML(id) {
    if (id === 'none') return '';
    const f = THUMB[id];
    if (f) return f();
    return `<div class="l">${escapeHTML(nameOf(id)).toUpperCase()}</div><span class="ic">${siIcon('grid')}</span>`;
  }

  function catalog() {
    const ids = Object.keys(MODULE_DEFS).filter((id) => id !== 'none' && MODULE_DEFS[id].html);
    ids.sort((a, b) => {
      const ia = ORDER.indexOf(a);
      const ib = ORDER.indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
    return [...ids, 'none'];
  }

  function currentSlots() {
    const p = getPrefs();
    return [p.module1 || DEFAULTS[0], p.module2 || DEFAULTS[1], p.module3 || DEFAULTS[2]];
  }

  const nameOf = (id) => (id === 'none' ? t('mod_none') : t((MODULE_DEFS[id] && MODULE_DEFS[id].label) || 'mod_' + id));
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const thumb = (id, cls) => {
    const d = el('div', 'wg-th' + (cls ? ' ' + cls : '') + (id === 'none' ? ' is-none' : ''));
    d.dataset.id = id;
    d.innerHTML = thumbHTML(id);
    return d;
  };

  /* ---------------------------------------------------------- 選ぶ画面 */
  let ov = null;

  function open(targetSlot) {
    if (ov) return;
    const saved = currentSlots();
    const draft = saved.slice();
    let target = Math.min(SLOTS - 1, Math.max(0, (targetSlot || 1) - 1));

    ov = el('div', 'overlay-modal show');
    ov.id = 'si-wg';
    const card = el('div', 'glass-card si-wg-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', t('wg_title'));

    const head = el('div', 'si-wg-head');
    head.appendChild(el('div', 'si-wg-title', t('wg_title')));
    const x = el('button', 'si-icon-btn si-wg-x');
    x.type = 'button';
    x.setAttribute('aria-label', t('wg_cancel'));
    x.innerHTML = siIcon('close');
    x.onclick = close;
    head.appendChild(x);

    const body = el('div', 'si-wg-body');
    const column = el('div', 'si-wg-column');
    const grid = el('div', 'si-wg-grid');
    body.append(column, grid);

    const foot = el('div', 'si-wg-foot');
    const cancel = el('button', 'st-btn', t('wg_cancel'));
    cancel.type = 'button';
    cancel.onclick = close;
    const apply = el('button', 'st-btn primary-btn', t('wg_apply'));
    apply.type = 'button';
    apply.onclick = () => commit(draft);
    foot.append(cancel, apply);

    card.append(head, body, foot);
    ov.appendChild(card);
    ov.addEventListener('mousedown', (e) => {
      if (e.target === ov) close();
    });
    ov.addEventListener('keydown', onKey);
    (document.getElementById('immersion-root') || document.body).appendChild(ov);

    /* 左：実際の左列を縮めたもの。押した枠が入れ替え先になる */
    function renderColumn() {
      column.textContent = '';
      draft.forEach((id, i) => {
        const b = el('button', 'si-wg-slot' + (i === target ? ' active' : '') + (id !== saved[i] ? ' changed' : ''));
        b.type = 'button';
        b.setAttribute('aria-pressed', String(i === target));
        b.setAttribute('aria-label', t('wg_pos_' + (i + 1)) + ' ' + nameOf(id));
        b.appendChild(thumb(id, 'mini'));
        b.onclick = () => {
          target = i;
          renderAll();
        };
        column.appendChild(b);
      });
      apply.disabled = draft.every((id, i) => id === saved[i]);
    }

    /* 右：カードの見本 */
    function renderGrid() {
      grid.textContent = '';
      catalog().forEach((id) => {
        const b = el('button', 'si-wg-tile');
        b.type = 'button';
        const at = id === 'none' ? -1 : draft.indexOf(id);
        if (draft[target] === id) b.classList.add('current');
        else if (at >= 0) b.classList.add('in-use');
        b.appendChild(thumb(id));
        const name = el('span', 'si-wg-name', nameOf(id));
        if (at >= 0) name.appendChild(el('span', 'si-wg-pos', t('wg_pos_' + (at + 1))));
        b.appendChild(name);
        b.onclick = () => assign(id);
        grid.appendChild(b);
      });
    }

    function renderAll() {
      renderColumn();
      renderGrid();
    }

    function assign(id) {
      const other = id === 'none' ? -1 : draft.indexOf(id);
      if (other >= 0 && other !== target) draft[other] = draft[target];
      draft[target] = id;
      renderAll();
      const cur = grid.querySelector('.si-wg-tile.current');
      if (cur) cur.classList.add('just');
    }

    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.target.classList.contains('si-wg-slot')) {
        e.preventDefault();
        target = (target + (e.key === 'ArrowDown' ? 1 : SLOTS - 1)) % SLOTS;
        renderAll();
        column.children[target].focus();
      }
    }

    renderAll();
    setTimeout(() => column.children[target] && column.children[target].focus({ preventScroll: true }), 30);
  }

  function close() {
    if (!ov) return;
    const n = ov;
    ov = null;
    n.classList.add('closing');
    setTimeout(() => n.remove(), 160);
  }

  /* 反映。カードはそれぞれ独自のタイマーや監視を持つため、今は読み込み直して組み立て直す。
     暗転を挟み、設定画面から開いた場合は同じタブを開き直す。 */
  function commit(draft) {
    const patch = {};
    draft.forEach((id, i) => (patch['module' + (i + 1)] = id));
    setPrefs(patch);
    draft.forEach((id, i) => {
      const s = document.getElementById('set-module-' + (i + 1));
      if (s) s.value = id;
    });
    try {
      if (document.getElementById('settings-modal')?.classList.contains('show')) {
        sessionStorage.setItem('si_reopen_settings', 'tab-widgets');
      }
    } catch (e) {}
    const root = document.getElementById('immersion-root');
    if (root) {
      root.style.transition = 'opacity .18s ease';
      root.style.opacity = '0';
    }
    setTimeout(() => location.reload(), 190);
  }

  /* ---------------------------------------------------------- 設定のウィジェットタブ */
  function mountSettings() {
    if (!document.getElementById('set-module-1')) return;
    const rows = [1, 2, 3].map((i) => document.getElementById('set-module-' + i)?.closest('.st-row')).filter(Boolean);
    rows.forEach((r) => (r.style.display = 'none'));
    const box = el('div', 'si-wg-set');
    currentSlots().forEach((id, i) => {
      const b = el('button', 'si-wg-set-row');
      b.type = 'button';
      b.append(el('span', 'si-wg-set-pos', t('wg_pos_' + (i + 1))), el('span', 'si-wg-set-name', nameOf(id)));
      const go = el('span', 'si-wg-set-go');
      go.innerHTML = siIcon('chevR');
      b.appendChild(go);
      b.onclick = () => open(i + 1);
      box.appendChild(b);
    });
    rows[0].parentNode.insertBefore(box, rows[0]);
    const desc = rows[0].parentNode.querySelector('.st-desc');
    if (desc) desc.style.display = 'none';
  }

  /* ---------------------------------------------------------- ホームの「入れ替え」 */
  function mountHomeButton() {
    const root = document.getElementById('immersion-root');
    if (!root) return;
    const btn = el('button', 'si-wg-swap');
    btn.type = 'button';
    btn.innerHTML = siIcon('swap');
    btn.appendChild(el('span', '', t('wg_swap')));
    root.appendChild(btn);
    let card = null;
    let hideT = 0;

    const blocked = () =>
      document.body.classList.contains('zen-active') ||
      document.body.classList.contains('amb-on') ||
      !!document.querySelector('.overlay-modal.show');

    const place = (c) => {
      const r = c.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      /* #immersion-root は --ui-scale で zoom されている。座標を root の倍率で割り戻す */
      const z = parseFloat(getComputedStyle(root).zoom) || 1;
      btn.style.left = (r.left + r.width / 2) / z + 'px';
      btn.style.top = Math.max(4, r.top - 13) / z + 'px';
      return true;
    };
    const show = (c) => {
      clearTimeout(hideT);
      if (blocked() || !place(c)) return;
      card = c;
      btn.classList.add('show');
    };
    const hide = () => {
      clearTimeout(hideT);
      hideT = setTimeout(() => {
        btn.classList.remove('show');
        card = null;
      }, 220);
    };

    root.addEventListener('mouseover', (e) => {
      const c = e.target.closest && e.target.closest('[data-si-slot]');
      if (c) show(c);
      else if (!btn.contains(e.target)) hide();
    });
    root.addEventListener('mouseleave', hide);
    btn.addEventListener('mouseenter', () => clearTimeout(hideT));
    btn.addEventListener('click', () => {
      const slot = card ? parseInt(card.dataset.siSlot, 10) : 1;
      btn.classList.remove('show');
      open(slot);
    });
  }

  siRegister({
    id: 'widget-gallery',
    init() {
      mountSettings();
      mountHomeButton();
      window.SI.widgetGallery = { open };
      window.SI.commands.push({ id: 'widgets', title: t('wg_cmd'), run: () => open(1) });
    },
  });
})();
