/* =====================================================================
   Search Immersion v28 — 見た目の試作（すべて初期状態はオフ）
   1. 一日で移ろう壁紙   labDaylight     時刻に合わせて、壁紙の色味と明るさを少しずつ変える
   2. 壁紙から色を取る   labAutoAccent   壁紙の主な色から、アクセント色を決める
   3. 画面の配置         layoutMode      standard / minimal / left
   4. 曲の色を画面全体に labMusicWash    再生中は、ジャケットの色を画面全体ににじませる
   5. 窓の外の天気       labWeather      晴れの光・雪・夜の街の灯り・霧を、天気と時刻に合わせて重ねる
   確認用に SI.lab.preview({ ... }) で状態を強制できる（保存はしない）。
   ===================================================================== */
(() => {
  const P = () => getPrefs();
  const forced = {};
  const root = () => document.getElementById('immersion-root');

  /* ================================================== 1. 一日で移ろう壁紙
     時刻ごとの「上の色・下の色・暗さ」を決めておき、その間をなめらかにつなぐ。
     色は soft-light で重ねるので、写真の明暗はそのまま、色味だけが移る */
  const SKY = [
    [0, [10, 18, 52, 0.55], [24, 28, 70, 0.5], 0.34],
    [4.5, [24, 34, 86, 0.5], [70, 56, 120, 0.42], 0.26],
    [6, [110, 120, 200, 0.32], [255, 150, 120, 0.42], 0.1],
    [8, [170, 200, 255, 0.16], [255, 214, 170, 0.2], 0.02],
    [10.5, [255, 255, 255, 0.06], [255, 255, 255, 0.0], 0],
    [15, [255, 250, 235, 0.08], [255, 236, 200, 0.08], 0],
    [17, [255, 190, 110, 0.3], [255, 120, 50, 0.5], 0.04],
    [18.3, [150, 90, 190, 0.42], [255, 96, 90, 0.42], 0.14],
    [19.6, [40, 50, 120, 0.5], [90, 60, 140, 0.42], 0.26],
    [21, [14, 22, 60, 0.55], [30, 32, 78, 0.5], 0.32],
    [24, [10, 18, 52, 0.55], [24, 28, 70, 0.5], 0.34],
  ];
  const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  function skyAt(h) {
    let i = 0;
    while (i < SKY.length - 2 && SKY[i + 1][0] <= h) i++;
    const [h0, t0, b0, d0] = SKY[i];
    const [h1, t1, b1, d1] = SKY[i + 1];
    const k = Math.max(0, Math.min(1, (h - h0) / (h1 - h0)));
    const e = k * k * (3 - 2 * k);
    return { top: mix(t0, t1, e), bottom: mix(b0, b1, e), dark: d0 + (d1 - d0) * e };
  }
  const rgba = (c) => `rgba(${c.slice(0, 3).map(Math.round).join(',')},${c[3].toFixed(3)})`;
  let skyEl = null;
  let skyTimer = 0;
  function renderSky() {
    const on = forced.daylight != null || P().labDaylight;
    if (!on) {
      skyEl?.remove();
      skyEl = null;
      clearInterval(skyTimer);
      skyTimer = 0;
      return;
    }
    if (!skyEl) {
      skyEl = document.createElement('div');
      skyEl.id = 'si-sky';
      skyEl.innerHTML = '<i class="tint"></i><i class="shade"></i>';
      const blurred = document.getElementById('bg-layer-blurred');
      (blurred ? blurred.after.bind(blurred) : (n) => root()?.prepend(n))(skyEl);
    }
    const now = new Date();
    const h = typeof forced.daylight === 'number' ? forced.daylight : now.getHours() + now.getMinutes() / 60;
    const s = skyAt(h);
    skyEl.style.setProperty('--sky-top', rgba(s.top));
    skyEl.style.setProperty('--sky-bottom', rgba(s.bottom));
    skyEl.style.setProperty('--sky-dark', s.dark.toFixed(3));
    if (!skyTimer && forced.daylight == null) skyTimer = siEvery(renderSky, 5 * 60 * 1000);
  }

  /* ================================================== 2. 壁紙から色を取る
     縮小した壁紙の画素を色相ごとに数え、鮮やかさと明るさで重み付けして一番強い色を選ぶ。
     読みやすいよう、明るさと鮮やかさは UI 向けにそろえる */
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h * 60, s, l];
  }
  function hslToHex(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(c * 255)
        .toString(16)
        .padStart(2, '0');
    };
    return '#' + f(0) + f(8) + f(4);
  }
  function pickAccent(img) {
    const c = document.createElement('canvas');
    c.width = 72;
    c.height = 48;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, c.width, c.height);
    const px = g.getImageData(0, 0, c.width, c.height).data;
    const bins = Array.from({ length: 24 }, () => ({ w: 0, h: 0, s: 0 }));
    for (let i = 0; i < px.length; i += 4) {
      const [h, s, l] = rgbToHsl(px[i], px[i + 1], px[i + 2]);
      if (s < 0.18 || l < 0.12 || l > 0.92) continue;
      const w = s * s * (1 - Math.abs(l - 0.5) * 1.4);
      if (w <= 0) continue;
      const b = bins[Math.floor(h / 15) % 24];
      b.w += w;
      b.h += h * w;
      b.s += s * w;
    }
    const best = bins.reduce((a, b) => (b.w > a.w ? b : a));
    if (best.w < 1) return null;
    const hue = best.h / best.w;
    const sat = Math.min(0.85, Math.max(0.55, best.s / best.w + 0.15));
    return hslToHex(hue, sat, 0.66);
  }
  let accentUrl = '';
  function renderAccent() {
    const on = forced.accent != null ? forced.accent : P().labAutoAccent;
    if (!on) {
      document.body.style.removeProperty('--accent');
      accentUrl = '';
      return;
    }
    const url = typeof lgCurrentWallUrl === 'function' ? lgCurrentWallUrl() : '';
    if (!url || url === 'none' || url === accentUrl) return;
    accentUrl = url;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const hex = pickAccent(img);
        if (hex && accentUrl === url) document.body.style.setProperty('--accent', hex);
      } catch (e) {
        /* 読めない画像（別のサイトの画像など）は、今のアクセント色のまま */
      }
    };
    img.src = url;
  }

  /* ================================================== 3. 画面の配置 */
  const LAYOUTS = ['standard', 'minimal', 'left'];
  function renderLayout() {
    const mode = forced.layout || P().layoutMode || 'standard';
    LAYOUTS.forEach((m) => document.body.classList.toggle('layout-' + m, m === mode && m !== 'standard'));
  }

  /* ================================================== 4. 曲の色を画面全体に
     色は Now Playing の展開表示と同じもの（--np-c1〜3。ジャケットから取った色）を使う */
  function renderWash() {
    const on = forced.wash != null ? forced.wash : P().labMusicWash;
    document.body.classList.toggle('si-music-wash', !!on);
    const playing = forced.playing != null ? forced.playing : !!document.querySelector('#music-card-container.music-playing');
    document.body.classList.toggle('si-playing', !!playing);
  }

  /* ================================================== 5. 窓の外の天気 */
  let wx = null;
  function weatherKind() {
    if (forced.weather) return forced.weather;
    const mode = P().labWeather;
    if (!mode) return '';
    let code = null;
    try {
      const c = JSON.parse(localStorage.getItem('immersion_weather_cache'));
      code = c?.data?.current_weather?.weathercode ?? c?.current_weather?.weathercode ?? c?.weathercode ?? null;
    } catch (e) {}
    const h = new Date().getHours();
    const night = h < 6 || h >= 18;
    /* 雪は降らせ続ける描画が要り、待機中でも CPU 3% 前後かかる。自動では出さない（試作として残す） */
    if ([45, 48].includes(code)) return 'fog';
    if (night) return 'night';
    if ([0, 1].includes(code)) return 'sun';
    return '';
  }

  function stopWeather() {
    if (!wx) return;
    cancelAnimationFrame(wx.raf);
    wx.el.remove();
    wx = null;
  }

  function renderWeather() {
    const kind = weatherKind();
    if (wx && wx.kind === kind) return;
    stopWeather();
    if (!kind) return;
    const el = document.createElement('div');
    el.id = 'si-window';
    el.className = 'wx-' + kind;
    const anchor = document.getElementById('si-sky') || document.getElementById('bg-layer-blurred');
    if (anchor) anchor.after(el);
    else root()?.prepend(el);
    wx = { kind, el, raf: 0 };
    if (kind === 'sun') el.innerHTML = '<i class="glow"></i><i class="ray r1"></i><i class="ray r2"></i><i class="ray r3"></i>';
    if (kind === 'fog') el.innerHTML = '<i class="fog f1"></i><i class="fog f2"></i>';
    if (kind === 'night') drawCity(el);
    if (kind === 'snow') startSnow(el);
  }

  /* 夜の街の灯り：ぼけた光の粒を一度だけ描き、ゆっくり瞬かせる（CSS） */
  function drawCity(el) {
    const c = document.createElement('canvas');
    const W = (c.width = Math.round(window.innerWidth * 0.75));
    const H = (c.height = Math.round(window.innerHeight * 0.75));
    const g = c.getContext('2d');
    const colors = ['255,196,120', '255,170,90', '255,228,170', '160,200,255', '255,140,110'];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 160; i++) {
      const y = H * (0.55 + Math.pow(rnd(), 0.7) * 0.45);
      const x = rnd() * W;
      const r = 3 + rnd() * 16 * (y / H);
      const col = colors[Math.floor(rnd() * colors.length)];
      const a = 0.08 + rnd() * 0.22;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `rgba(${col},${a})`);
      grd.addColorStop(0.55, `rgba(${col},${a * 0.6})`);
      grd.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    el.appendChild(c);
  }

  /* 雪：画面の奥と手前で大きさと速さを変える。30fps、1 分操作がなければ止める */
  function startSnow(el) {
    const c = document.createElement('canvas');
    el.appendChild(c);
    const g = c.getContext('2d');
    const k = Math.min(1.5, window.devicePixelRatio || 1);
    const size = () => {
      c.width = Math.round(window.innerWidth * k);
      c.height = Math.round(window.innerHeight * k);
    };
    size();
    window.addEventListener('resize', size);
    const flakes = Array.from({ length: 140 }, () => {
      const z = Math.random();
      return { x: Math.random(), y: Math.random(), z, r: (0.8 + z * 2.6) * k, v: 0.0004 + z * 0.0012, sway: Math.random() * 6.28 };
    });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      flakes.forEach((f) => draw(f));
      return;
    }
    let last = 0;
    let lastInput = performance.now();
    const wakeUp = () => {
      lastInput = performance.now();
      if (wx && !wx.raf) wx.raf = requestAnimationFrame(frame);
    };
    window.addEventListener('pointermove', wakeUp, { passive: true });
    function draw(f) {
      g.globalAlpha = 0.35 + f.z * 0.55;
      g.beginPath();
      g.arc(f.x * c.width, f.y * c.height, f.r, 0, Math.PI * 2);
      g.fill();
    }
    function frame(now) {
      if (!wx || wx.kind !== 'snow') return;
      if (now - lastInput > 60000) {
        wx.raf = 0;
        return;
      }
      wx.raf = requestAnimationFrame(frame);
      if (now - last < 33) return;
      const dt = Math.min(80, now - (last || now));
      last = now;
      g.clearRect(0, 0, c.width, c.height);
      g.fillStyle = '#fff';
      for (const f of flakes) {
        f.y += f.v * (dt / 16);
        f.x += Math.sin(now / 1400 + f.sway) * 0.00025 * (0.5 + f.z);
        if (f.y > 1.02) {
          f.y = -0.02;
          f.x = Math.random();
        }
        draw(f);
      }
      g.globalAlpha = 1;
    }
    wx.raf = requestAnimationFrame(frame);
  }

  /* ================================================== まとめ */
  function renderAll() {
    renderSky();
    renderAccent();
    renderLayout();
    renderWash();
    renderWeather();
  }

  window.SI.lab = {
    /* 確認用：状態を強制する（保存しない）。null で解除 */
    preview(o) {
      Object.keys(o || {}).forEach((k) => (o[k] == null ? delete forced[k] : (forced[k] = o[k])));
      if ('accent' in (o || {})) accentUrl = '';
      renderAll();
    },
    refresh: renderAll,
  };

  /* ---------------------------------------------------------- 設定（見た目タブ）
     重くならないものだけを出す。どれも読み込み直さずに、その場で切り替わる */
  function mountSettings() {
    const accentRow = document.getElementById('set-accent')?.closest('.st-row');
    if (!accentRow) return;
    const p = P();
    const toggle = (id, label, desc, checked) => `
      <div class="st-row column-layout">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
          <span>${escapeHTML(label)}</span>
          <label class="toggle-switch"><input type="checkbox" id="${id}"${checked ? ' checked' : ''}><span class="slider"></span></label>
        </div>
        <div class="st-desc">${escapeHTML(desc)}</div>
      </div>`;
    const box = document.createElement('div');
    box.innerHTML = `
      <div class="st-group-title" style="margin-top:22px;">${escapeHTML(t('mood_group'))}</div>
      <div class="st-row column-layout">
        <span>${escapeHTML(t('layout_label'))}</span>
        <select id="set-layout" class="st-select">
          <option value="standard">${escapeHTML(t('layout_standard'))}</option>
          <option value="minimal">${escapeHTML(t('layout_minimal'))}</option>
          <option value="left">${escapeHTML(t('layout_left'))}</option>
        </select>
      </div>
      ${toggle('set-daylight', t('daylight_label'), t('daylight_desc'), p.labDaylight)}
      ${toggle('set-auto-accent', t('auto_accent_label'), t('auto_accent_desc'), p.labAutoAccent)}
      ${toggle('set-music-wash', t('music_wash_label'), t('music_wash_desc'), p.labMusicWash)}
      ${toggle('set-window-weather', t('window_weather_label'), t('window_weather_desc'), p.labWeather)}`;
    accentRow.after(...box.children);
    const sel = document.getElementById('set-layout');
    sel.value = p.layoutMode || 'standard';
    sel.onchange = () => {
      setPrefs({ layoutMode: sel.value });
      renderLayout();
    };
    [
      ['set-daylight', 'labDaylight', renderSky],
      ['set-auto-accent', 'labAutoAccent', () => ((accentUrl = ''), renderAccent())],
      ['set-music-wash', 'labMusicWash', renderWash],
      ['set-window-weather', 'labWeather', renderWeather],
    ].forEach(([id, key, fn]) => {
      const el = document.getElementById(id);
      el.onchange = () => {
        setPrefs({ [key]: el.checked });
        fn();
      };
    });
  }

  siRegister({
    id: 'lab',
    init() {
      mountSettings();
      renderAll();
      const bg = document.getElementById('bg-layer-original');
      if (bg) new MutationObserver(renderAccent).observe(bg, { attributes: true, attributeFilter: ['style'] });
      const music = document.getElementById('music-card-container');
      if (music) new MutationObserver(renderWash).observe(music, { attributes: true, attributeFilter: ['class'] });
      siEvery(renderWeather, 10 * 60 * 1000);
    },
  });
})();
