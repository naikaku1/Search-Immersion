/* =====================================================================
   Search Immersion v28 — 雨窓（Rainy Window）
   ・窓に付いた水滴が、後ろの壁紙を逆さまに映す（レンズの屈折）
   ・大きな粒は止まったり進んだりしながら流れ落ち、通ったあとは曇りが晴れる
   ・何もない所をドラッグすると、そこだけ窓を拭ける。曇りはゆっくり戻る
   2D Canvas だけで描く。30fps 上限・低解像度の曇り層・タブが裏なら停止。
   「視差効果を減らす」設定の環境では、流れる粒を止めて静止画にする。
   ===================================================================== */
(() => {
  const R = {
    on: false,
    canvas: null,
    ctx: null,
    img: null,
    imgUrl: '',
    fit: null,
    fog: null,
    mask: null,
    maskCtx: null,
    drops: null,
    dropsCtx: null,
    shade: null,
    statics: [],
    sliders: [],
    raf: 0,
    last: 0,
    lastStatic: 0,
    lastRefog: 0,
    w: 0,
    h: 0,
    k: 1,
    wiping: false,
    lastWipe: null,
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    mo: null,
  };
  const FOG_SCALE = 0.25;
  const MASK_SCALE = 0.5;

  const rand = (a, b) => a + Math.random() * (b - a);

  function wanted() {
    const p = getPrefs();
    if (p.themeMode === 'rain') return true;
    if (p.rainAuto && isRainyNow()) return true;
    return false;
  }

  /* 天気連動: 取得済みの天気コード（WMO）が雨・雷雨なら */
  function isRainyNow() {
    try {
      const cache = JSON.parse(localStorage.getItem('immersion_weather_cache'));
      const code =
        cache?.data?.current_weather?.weathercode ?? cache?.current_weather?.weathercode ?? cache?.weathercode;
      return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(Number(code));
    } catch (e) {
      return false;
    }
  }

  /* ---------------------------------------------------------- 準備 */
  function makeShade() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(32, 26, 4, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,0)');
    rg.addColorStop(0.72, 'rgba(0,0,0,0.05)');
    rg.addColorStop(1, 'rgba(0,0,0,0.38)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(32, 32, 32, 0, Math.PI * 2);
    g.fill();
    const hl = g.createRadialGradient(22, 19, 0, 22, 19, 9);
    hl.addColorStop(0, 'rgba(255,255,255,0.75)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hl;
    g.beginPath();
    g.arc(22, 19, 9, 0, Math.PI * 2);
    g.fill();
    return c;
  }

  function size() {
    const rect = R.canvas.getBoundingClientRect();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    R.k = dpr;
    R.w = Math.max(1, Math.round(rect.width * dpr));
    R.h = Math.max(1, Math.round(rect.height * dpr));
    R.canvas.width = R.w;
    R.canvas.height = R.h;
    R.mask.width = Math.round(R.w * MASK_SCALE);
    R.mask.height = Math.round(R.h * MASK_SCALE);
    R.maskCtx.fillStyle = '#000';
    R.maskCtx.fillRect(0, 0, R.mask.width, R.mask.height);
    R.drops.width = R.w;
    R.drops.height = R.h;
    computeFit();
    buildFog();
    seedStatics();
    drawStatics();
  }

  function computeFit() {
    if (!R.img || !R.img.naturalWidth) {
      R.fit = null;
      return;
    }
    const s = Math.max(R.w / R.img.naturalWidth, R.h / R.img.naturalHeight);
    R.fit = { s, ox: (R.w - R.img.naturalWidth * s) / 2, oy: (R.h - R.img.naturalHeight * s) / 2 };
  }

  /* 曇り: 縮小して描いてから拡大すると、それだけでぼけて見える。白い霞を少し重ねる */
  function buildFog() {
    const fw = Math.max(8, Math.round(R.w * FOG_SCALE));
    const fh = Math.max(8, Math.round(R.h * FOG_SCALE));
    R.fog.width = fw;
    R.fog.height = fh;
    const g = R.fog.getContext('2d');
    g.clearRect(0, 0, fw, fh);
    if (R.fit) {
      const tmp = document.createElement('canvas');
      tmp.width = Math.max(4, Math.round(fw / 4));
      tmp.height = Math.max(4, Math.round(fh / 4));
      const tg = tmp.getContext('2d');
      tg.drawImage(R.img, R.fit.ox / 16, R.fit.oy / 16, (R.img.naturalWidth * R.fit.s) / 16, (R.img.naturalHeight * R.fit.s) / 16);
      g.imageSmoothingQuality = 'high';
      g.filter = 'blur(6px)';
      g.drawImage(tmp, -8, -8, fw + 16, fh + 16);
      g.filter = 'none';
    } else {
      g.fillStyle = 'rgba(30,34,40,1)';
      g.fillRect(0, 0, fw, fh);
    }
    g.fillStyle = 'rgba(215,224,232,0.1)';
    g.fillRect(0, 0, fw, fh);
  }

  function seedStatics() {
    const area = (R.w * R.h) / (R.k * R.k);
    const n = Math.min(900, Math.round(area / 2600));
    R.statics = [];
    for (let i = 0; i < n; i++) R.statics.push(newStatic());
  }
  function newStatic(x, y) {
    const big = Math.random() < 0.08;
    return {
      x: x != null ? x : Math.random() * R.w,
      y: y != null ? y : Math.random() * R.h,
      r: (big ? rand(2.6, 4.6) : rand(0.8, 2.2)) * R.k,
    };
  }

  /* 水滴 1 粒: 円で切り抜き、その周りの景色を上下逆さに縮めて映す */
  function drawDrop(g, x, y, r, stretch = 1) {
    if (r < 0.6) return;
    g.save();
    g.beginPath();
    g.ellipse(x, y, r, r * stretch, 0, 0, Math.PI * 2);
    g.clip();
    if (R.fit) {
      const span = (r * 7) / R.fit.s;
      let sx = (x - R.fit.ox) / R.fit.s - span / 2;
      let sy = (y - R.fit.oy) / R.fit.s - span / 2;
      sx = Math.max(0, Math.min(R.img.naturalWidth - span, sx));
      sy = Math.max(0, Math.min(R.img.naturalHeight - span, sy));
      g.translate(x, y);
      g.scale(1, -1);
      g.drawImage(R.img, sx, sy, span, span, -r, -r * stretch, r * 2, r * 2 * stretch);
      g.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      g.fillStyle = 'rgba(255,255,255,0.08)';
      g.fill();
    }
    g.restore();
    g.drawImage(R.shade, x - r, y - r * stretch, r * 2, r * 2 * stretch);
  }

  function addStatic(d) {
    R.statics.push(d);
    drawDrop(R.dropsCtx, d.x, d.y, d.r);
  }

  function drawStatics() {
    const g = R.dropsCtx;
    g.clearRect(0, 0, R.w, R.h);
    for (const d of R.statics) drawDrop(g, d.x, d.y, d.r);
  }

  function spawnSlider() {
    return {
      x: Math.random() * R.w,
      y: rand(-0.2, 0.6) * R.h,
      r: rand(3.2, 7.5) * R.k,
      v: 0,
      wait: rand(0, 2500),
      wobble: Math.random() * 1000,
    };
  }

  /* ---------------------------------------------------------- 拭く */
  function wipeAt(x, y, radius) {
    const m = R.maskCtx;
    m.save();
    m.globalCompositeOperation = 'destination-out';
    const mx = x * MASK_SCALE;
    const my = y * MASK_SCALE;
    const mr = radius * MASK_SCALE;
    const g = m.createRadialGradient(mx, my, mr * 0.4, mx, my, mr);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = g;
    m.beginPath();
    m.arc(mx, my, mr, 0, Math.PI * 2);
    m.fill();
    m.restore();
  }

  function wipeLine(a, b, radius) {
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / (radius * 0.4)));
    for (let i = 0; i <= steps; i++) wipeAt(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps, radius);
    /* 拭いた所の粒は消す（配列を作り直さず、消えた粒の場所だけ描画からも消す） */
    const rr = radius * radius;
    for (let i = R.statics.length - 1; i >= 0; i--) {
      const d = R.statics[i];
      if ((d.x - b.x) ** 2 + (d.y - b.y) ** 2 > rr) continue;
      R.statics.splice(i, 1);
      const e = d.r * 2.2 + 1;
      R.dropsCtx.clearRect(d.x - e, d.y - e, e * 2, e * 2);
    }
  }

  const isBackground = (target) =>
    target === R.canvas ||
    target?.id === 'immersion-root' ||
    target?.classList?.contains('col') ||
    target?.classList?.contains('clock-container');

  function toCanvas(e) {
    const rect = R.canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * R.w, y: ((e.clientY - rect.top) / rect.height) * R.h };
  }
  function onDown(e) {
    if (!R.on || e.button !== 0 || !isBackground(e.target)) return;
    R.wiping = true;
    R.lastWipe = toCanvas(e);
    wipeLine(R.lastWipe, R.lastWipe, 46 * R.k);
    document.body.classList.add('rain-wiping');
  }
  function onMove(e) {
    if (!R.wiping) return;
    const p = toCanvas(e);
    wipeLine(R.lastWipe, p, 46 * R.k);
    R.lastWipe = p;
  }
  function onUp() {
    R.wiping = false;
    document.body.classList.remove('rain-wiping');
  }

  /* ---------------------------------------------------------- 描画 */
  /* 1 分間なにも操作がなければ、流れる粒を止めて描画を休む（窓の曇りと粒はそのまま残る）。
     マウスやキーに触れたら、すぐ再開する */
  const IDLE_MS = 60000;
  function noteInput() {
    R.lastInput = performance.now();
    if (R.on && R.sleeping) {
      R.sleeping = false;
      R.last = 0;
      R.raf = requestAnimationFrame(frame);
    }
  }

  function frame(now) {
    if (now - (R.lastInput || now) > IDLE_MS && !R.wiping) {
      R.sleeping = true;
      R.raf = 0;
      return;
    }
    R.raf = requestAnimationFrame(frame);
    if (now - R.last < 33) return;
    const dt = Math.min(100, now - (R.last || now));
    R.last = now;
    const g = R.ctx;

    /* 曇りはゆっくり戻る */
    if (now - R.lastRefog > 120) {
      R.lastRefog = now;
      R.maskCtx.fillStyle = 'rgba(0,0,0,0.02)';
      R.maskCtx.fillRect(0, 0, R.mask.width, R.mask.height);
    }

    /* 小さな粒は、ときどき足す（新しく付いては、流れに吸われて消える）。
       以前は足すたび・吸われるたびに 900 粒すべてを描き直していて、ほぼ毎フレームの重い処理になっていた。
       今は増えた粒だけを描き足し、吸われた粒はその場所だけ消す */
    if (now - R.lastStatic > 700) {
      R.lastStatic = now;
      const target = Math.min(900, Math.round((R.w * R.h) / (R.k * R.k) / 2600));
      for (let i = 0; i < 6 && R.statics.length < target; i++) addStatic(newStatic());
    }

    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, R.w, R.h);
    g.drawImage(R.fog, 0, 0, R.w, R.h);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(R.mask, 0, 0, R.w, R.h);
    g.globalCompositeOperation = 'source-over';
    g.drawImage(R.drops, 0, 0);

    if (!R.reduced) {
      while (R.sliders.length < Math.round(18 + R.w / R.k / 80)) R.sliders.push(spawnSlider());
      for (const d of R.sliders) {
        if (d.wait > 0) {
          d.wait -= dt;
        } else {
          /* 止まる・進むを繰り返す。大きい粒ほど速い */
          if (Math.random() < 0.01) d.wait = rand(200, 1600);
          d.v = Math.min(1.2 * R.k + d.r * 0.05, d.v + 0.02 * R.k);
          const prev = { x: d.x, y: d.y };
          d.y += d.v * (dt / 16);
          d.x += Math.sin((now + d.wobble) / 380) * 0.18 * R.k;
          wipeLine(prev, d, d.r * 0.7);
          /* 通り道にとても小さな粒を残す */
          if (Math.random() < 0.08) addStatic({ x: d.x + rand(-1, 1) * R.k, y: d.y - d.r * 1.6, r: rand(0.6, 1.4) * R.k });
          /* 進路上の粒を吸い込んで少し太る */
          for (let i = R.statics.length - 1; i >= 0; i--) {
            const s = R.statics[i];
            if (Math.abs(s.x - d.x) < d.r && Math.abs(s.y - d.y) < d.r) {
              d.r = Math.min(10 * R.k, d.r + s.r * 0.08);
              R.statics.splice(i, 1);
              const e = s.r * 2.2 + 1;
              R.dropsCtx.clearRect(s.x - e, s.y - e, e * 2, e * 2);
            }
          }
        }
        drawDrop(g, d.x, d.y, d.r, d.wait > 0 ? 1 : 1.18);
        if (d.y - d.r > R.h) Object.assign(d, spawnSlider(), { y: -20 });
      }
    }
  }

  /* ---------------------------------------------------------- 開始・停止 */
  function loadImage() {
    const url = typeof lgCurrentWallUrl === 'function' ? lgCurrentWallUrl() : '';
    if (!url || url === 'none' || url === R.imgUrl) {
      if (!url || url === 'none') {
        R.img = null;
        R.imgUrl = '';
        computeFit();
        buildFog();
        drawStatics();
      }
      return;
    }
    R.imgUrl = url;
    const img = new Image();
    img.onload = () => {
      if (R.imgUrl !== url) return;
      R.img = img;
      computeFit();
      buildFog();
      drawStatics();
    };
    img.onerror = () => {
      R.img = null;
      computeFit();
      buildFog();
    };
    img.src = url;
  }

  function start() {
    if (R.on) return;
    const root = document.getElementById('immersion-root');
    if (!root) return;
    R.on = true;
    document.body.classList.add('rain-active');
    R.canvas = document.createElement('canvas');
    R.canvas.id = 'si-rain';
    root.insertBefore(R.canvas, root.querySelector('.col'));
    R.ctx = R.canvas.getContext('2d');
    R.fog = document.createElement('canvas');
    R.mask = document.createElement('canvas');
    R.maskCtx = R.mask.getContext('2d');
    R.drops = document.createElement('canvas');
    R.dropsCtx = R.drops.getContext('2d');
    R.shade = R.shade || makeShade();
    R.sliders = [];
    size();
    loadImage();
    R.last = 0;
    R.lastInput = performance.now();
    R.sleeping = false;
    R.raf = requestAnimationFrame(frame);

    window.addEventListener('pointermove', noteInput, { capture: true, passive: true });
    window.addEventListener('keydown', noteInput, true);
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('resize', onResize);
    const bg = document.getElementById('bg-layer-original');
    if (bg && 'MutationObserver' in window) {
      R.mo = new MutationObserver(() => loadImage());
      R.mo.observe(bg, { attributes: true, attributeFilter: ['style'] });
    }
  }

  function stop() {
    if (!R.on) return;
    R.on = false;
    cancelAnimationFrame(R.raf);
    R.canvas?.remove();
    R.canvas = null;
    R.imgUrl = '';
    document.body.classList.remove('rain-active', 'rain-wiping');
    window.removeEventListener('pointermove', noteInput, { capture: true });
    window.removeEventListener('keydown', noteInput, true);
    R.sleeping = false;
    window.removeEventListener('pointerdown', onDown, true);
    window.removeEventListener('pointermove', onMove, true);
    window.removeEventListener('pointerup', onUp, true);
    window.removeEventListener('resize', onResize);
    R.mo?.disconnect();
    R.mo = null;
  }

  let resizeT = null;
  function onResize() {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => R.on && size(), 200);
  }

  function sync() {
    if (wanted()) start();
    else stop();
  }

  window.SI.rain = { start, stop, sync };
  document.addEventListener('si:theme', sync);

  siRegister({
    id: 'rain',
    init() {
      const auto = document.getElementById('set-rain-auto');
      if (auto) {
        auto.checked = !!getPrefs().rainAuto;
        auto.onchange = () => {
          setPrefs({ rainAuto: auto.checked });
          sync();
        };
      }
      /* 壁紙が決まるのを少し待ってから始める */
      setTimeout(sync, 300);
      setInterval(() => {
        if (getPrefs().rainAuto) sync();
      }, 10 * 60 * 1000);
    },
  });
})();
