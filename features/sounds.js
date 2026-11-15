/* =====================================================================
   Search Immersion v28 — 環境音ミキサー
   雨・風・波・焚き火・小川・虫の声・ブラウンノイズを、その場で合成して混ぜる。
   音源ファイルは使わない（容量ゼロ・権利の心配なし）。
   このタブが開いている間だけ鳴る。
   ===================================================================== */
(() => {
  const CHANNELS = ['rain', 'wind', 'waves', 'fire', 'stream', 'insects', 'brown'];
  const ICONS = { rain: 'rain', wind: 'wind', waves: 'waves', fire: 'flame', stream: 'droplet', insects: 'moon', brown: 'noise' };
  const PRESETS = {
    rainynight: { rain: 0.65, fire: 0.3 },
    seaside: { waves: 0.7, wind: 0.2 },
    forest: { stream: 0.5, insects: 0.25, wind: 0.15 },
    focus: { brown: 0.45, rain: 0.25 },
  };

  const S = {
    ctx: null,
    master: null,
    nodes: {},
    playing: false,
    state: loadState(),
    timers: [],
  };

  function loadState() {
    let v = {};
    try {
      v = JSON.parse(localStorage.getItem('immersion_sounds')) || {};
    } catch (e) {}
    const vol = {};
    CHANNELS.forEach((c) => (vol[c] = Math.max(0, Math.min(1, Number((v.vol || {})[c]) || 0))));
    return { vol, master: v.master != null ? Number(v.master) : 0.8, on: !!v.on };
  }
  function saveState() {
    localStorage.setItem('immersion_sounds', JSON.stringify(S.state));
  }

  /* ------------------------------------------------------------- 素材 */
  function noiseBuffer(ctx, type, seconds = 4) {
    const len = ctx.sampleRate * seconds;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'white') d[i] = w * 0.5;
      else if (type === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      } else {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
    /* 継ぎ目のプチ音を消す */
    const fade = Math.min(2000, len / 10);
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      d[i] *= k;
      d[len - 1 - i] *= k;
    }
    return buf;
  }

  function loopSource(ctx, buf) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopStart = Math.random() * (buf.duration - 1);
    src.start(0, src.loopStart);
    return src;
  }

  function lfo(ctx, freq, depth, target, offset) {
    const o = ctx.createOscillator();
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = depth;
    o.connect(g);
    g.connect(target);
    if (offset != null) target.value = offset;
    o.start();
    return o;
  }

  /* ------------------------------------------------------- チャンネル */
  function buildChannel(name) {
    const ctx = S.ctx;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(S.master);
    const buffers = S.buffers;
    const parts = [];

    if (name === 'rain') {
      const src = loopSource(ctx, buffers.pink);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 500;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 7000;
      const g = ctx.createGain();
      g.gain.value = 0.9;
      src.connect(hp).connect(lp).connect(g).connect(out);
      parts.push(src, lfo(ctx, 0.13, 0.12, g.gain, 0.85));
      /* 屋根や窓に当たる粒の音 */
      const drop = () => {
        if (!S.playing || S.state.vol.rain <= 0) return;
        const now = ctx.currentTime;
        for (let k = 0; k < 6; k++) {
          const at = now + Math.random() * 0.25;
          const s = ctx.createBufferSource();
          s.buffer = buffers.white;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 1800 + Math.random() * 5200;
          bp.Q.value = 6;
          const e = ctx.createGain();
          e.gain.setValueAtTime(0.0001, at);
          e.gain.exponentialRampToValueAtTime(0.25 + Math.random() * 0.35, at + 0.004);
          e.gain.exponentialRampToValueAtTime(0.0001, at + 0.05 + Math.random() * 0.05);
          s.connect(bp).connect(e).connect(out);
          s.start(at, Math.random() * 2, 0.12);
        }
      };
      S.timers.push(setInterval(drop, 250));
    } else if (name === 'wind') {
      const src = loopSource(ctx, buffers.pink);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 0.9;
      const g = ctx.createGain();
      src.connect(bp).connect(g).connect(out);
      parts.push(src, lfo(ctx, 0.05, 260, bp.frequency, 480), lfo(ctx, 0.09, 0.35, g.gain, 0.6), lfo(ctx, 0.031, 120, bp.frequency));
    } else if (name === 'waves') {
      const src = loopSource(ctx, buffers.brown);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      const g = ctx.createGain();
      src.connect(lp).connect(g).connect(out);
      const src2 = loopSource(ctx, buffers.pink);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1500;
      const g2 = ctx.createGain();
      src2.connect(hp).connect(g2).connect(out);
      parts.push(src, src2, lfo(ctx, 0.085, 0.55, g.gain, 0.6), lfo(ctx, 0.085, 0.18, g2.gain, 0.12), lfo(ctx, 0.085, 500, lp.frequency));
    } else if (name === 'fire') {
      const src = loopSource(ctx, buffers.brown);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      const g = ctx.createGain();
      g.gain.value = 0.9;
      src.connect(lp).connect(g).connect(out);
      parts.push(src, lfo(ctx, 0.4, 0.15, g.gain, 0.8));
      const crackle = () => {
        if (!S.playing || S.state.vol.fire <= 0) return;
        const now = ctx.currentTime;
        const n = Math.random() < 0.4 ? 1 + Math.floor(Math.random() * 4) : 0;
        for (let k = 0; k < n; k++) {
          const at = now + Math.random() * 0.3;
          const s = ctx.createBufferSource();
          s.buffer = buffers.white;
          const hp = ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.value = 1200 + Math.random() * 3000;
          const e = ctx.createGain();
          e.gain.setValueAtTime(0.0001, at);
          e.gain.exponentialRampToValueAtTime(0.5 + Math.random() * 0.6, at + 0.002);
          e.gain.exponentialRampToValueAtTime(0.0001, at + 0.02 + Math.random() * 0.04);
          s.connect(hp).connect(e).connect(out);
          s.start(at, Math.random() * 2, 0.08);
        }
      };
      S.timers.push(setInterval(crackle, 300));
    } else if (name === 'stream') {
      const src = loopSource(ctx, buffers.white);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.2;
      const g = ctx.createGain();
      src.connect(bp).connect(g).connect(out);
      parts.push(src, lfo(ctx, 3.1, 500, bp.frequency, 1600), lfo(ctx, 1.7, 0.2, g.gain, 0.5), lfo(ctx, 0.23, 300, bp.frequency));
    } else if (name === 'insects') {
      /* 秋の虫: 高い正弦波を細かく震わせ、まとまって鳴いては休む */
      const mk = (f, rate, phase) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        const am = ctx.createGain();
        am.gain.value = 0;
        const g = ctx.createGain();
        g.gain.value = 0.08;
        o.connect(am).connect(g).connect(out);
        o.start();
        const trill = lfo(ctx, rate, 0.5, am.gain, 0.5);
        const phrase = ctx.createOscillator();
        phrase.frequency.value = 0.35 + phase;
        const pg = ctx.createGain();
        pg.gain.value = 0.08;
        phrase.connect(pg).connect(g.gain);
        phrase.start();
        parts.push(o, trill, phrase);
      };
      mk(4300, 38, 0);
      mk(5100, 45, 0.11);
      mk(3700, 29, 0.23);
    } else if (name === 'brown') {
      const src = loopSource(ctx, buffers.brown);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1100;
      src.connect(lp).connect(out);
      parts.push(src);
    }
    S.nodes[name] = { out, parts };
  }

  function ensureGraph() {
    if (S.ctx) return;
    S.ctx = siAudio();
    S.master = S.ctx.createGain();
    S.master.gain.value = 0;
    S.master.connect(S.ctx.destination);
    S.buffers = {
      white: noiseBuffer(S.ctx, 'white', 3),
      pink: noiseBuffer(S.ctx, 'pink', 6),
      brown: noiseBuffer(S.ctx, 'brown', 6),
    };
  }

  function applyVolumes(ramp = 0.6) {
    if (!S.ctx) return;
    const now = S.ctx.currentTime;
    CHANNELS.forEach((c) => {
      const v = S.state.vol[c];
      if (v > 0 && !S.nodes[c]) buildChannel(c);
      const node = S.nodes[c];
      if (!node) return;
      node.out.gain.cancelScheduledValues(now);
      node.out.gain.setTargetAtTime(v * v, now, ramp / 3);
    });
    S.master.gain.cancelScheduledValues(now);
    S.master.gain.setTargetAtTime(S.playing ? S.state.master : 0, now, ramp / 3);
  }

  function play() {
    ensureGraph();
    if (!CHANNELS.some((c) => S.state.vol[c] > 0)) S.state.vol = { ...S.state.vol, ...PRESETS.rainynight };
    S.playing = true;
    S.state.on = true;
    saveState();
    if (S.ctx.state === 'suspended') S.ctx.resume().catch(() => {});
    applyVolumes(1.2);
    renderAll();
  }
  function pause() {
    S.playing = false;
    S.state.on = false;
    saveState();
    applyVolumes(0.8);
    /* 鳴っていない間は合成を止めて CPU を使わない */
    setTimeout(() => {
      if (S.playing) return;
      S.timers.forEach(clearInterval);
      S.timers = [];
      Object.values(S.nodes).forEach((n) => {
        n.parts.forEach((p) => {
          try {
            p.stop();
          } catch (e) {}
        });
        try {
          n.out.disconnect();
        } catch (e) {}
      });
      S.nodes = {};
    }, 1500);
    renderAll();
  }
  function toggle() {
    S.playing ? pause() : play();
  }

  let focusSaved = null;
  window.SI.sounds = {
    play,
    pause,
    toggle,
    preset(name) {
      const p = PRESETS[name];
      if (!p) return;
      CHANNELS.forEach((c) => (S.state.vol[c] = p[c] || 0));
      saveState();
      play();
      applyVolumes();
      renderAll();
    },
    focusStart() {
      if (S.playing) return;
      focusSaved = { ...S.state.vol };
      if (!CHANNELS.some((c) => S.state.vol[c] > 0)) CHANNELS.forEach((c) => (S.state.vol[c] = PRESETS.focus[c] || 0));
      play();
    },
    focusStop() {
      if (focusSaved) {
        pause();
        focusSaved = null;
      }
    },
  };

  /* --------------------------------------------------------------- カード
     7 本の縦のフェーダー。棒をなぞって音量、アイコンで入り切り。
     上の大きな文字は、いまの配合に一致するプリセット名（なければ MIX）。 */
  const PRESET_ORDER = Object.keys(PRESETS);
  function currentPreset() {
    return PRESET_ORDER.find((name) =>
      CHANNELS.every((c) => Math.abs((PRESETS[name][c] || 0) - S.state.vol[c]) < 0.02),
    );
  }

  function renderAll() {
    const preset = currentPreset();
    document.querySelectorAll('.sounds-card').forEach((card) => {
      card.classList.toggle('playing', S.playing);
      const btn = card.querySelector('.snd-play');
      btn.innerHTML = siIcon(S.playing ? 'pause' : 'play');
      btn.title = S.playing ? t('snd_pause') : t('snd_play');
      card.querySelector('.snd-name').textContent = preset ? t('snd_preset_' + preset) : 'MIX';
      card.querySelectorAll('.snd-ch').forEach((col) => {
        const v = S.state.vol[col.dataset.ch];
        col.classList.toggle('on', v > 0);
        col.style.setProperty('--v', v);
        col.setAttribute('aria-valuenow', String(Math.round(v * 100)));
      });
    });
  }

  const lastVol = {};
  function setVol(c, v) {
    v = Math.max(0, Math.min(1, Math.round(v * 50) / 50));
    if (v > 0) lastVol[c] = v;
    S.state.vol[c] = v;
    saveState();
    if (!S.playing && v > 0) play();
    applyVolumes(0.3);
    renderAll();
  }

  function setupCards() {
    document.querySelectorAll('.sounds-card').forEach((card) => {
      const grid = card.querySelector('.snd-grid');
      CHANNELS.forEach((c) => {
        const col = document.createElement('div');
        col.className = 'snd-ch';
        col.dataset.ch = c;
        col.title = t('snd_' + c);
        col.setAttribute('role', 'slider');
        col.setAttribute('aria-label', t('snd_' + c));
        col.setAttribute('aria-valuemin', '0');
        col.setAttribute('aria-valuemax', '100');
        col.tabIndex = 0;
        const track = document.createElement('div');
        track.className = 'snd-track';
        track.appendChild(document.createElement('i'));
        const ic = document.createElement('button');
        ic.type = 'button';
        ic.className = 'snd-ic';
        ic.innerHTML = siIcon(ICONS[c]);
        ic.tabIndex = -1;
        ic.onclick = () => setVol(c, S.state.vol[c] > 0 ? 0 : lastVol[c] || 0.5);
        const fromY = (e) => {
          const r = track.getBoundingClientRect();
          setVol(c, 1 - (e.clientY - r.top) / r.height);
        };
        track.addEventListener('pointerdown', (e) => {
          track.setPointerCapture(e.pointerId);
          fromY(e);
          const move = (ev) => fromY(ev);
          const up = () => {
            track.removeEventListener('pointermove', move);
            track.removeEventListener('pointerup', up);
          };
          track.addEventListener('pointermove', move);
          track.addEventListener('pointerup', up);
        });
        col.addEventListener('wheel', (e) => {
          e.preventDefault();
          setVol(c, S.state.vol[c] + (e.deltaY < 0 ? 0.06 : -0.06));
        }, { passive: false });
        col.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') setVol(c, S.state.vol[c] + 0.1);
          else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') setVol(c, S.state.vol[c] - 0.1);
          else return;
          e.preventDefault();
        });
        col.append(track, ic);
        grid.appendChild(col);
      });
      card.querySelector('.snd-play').onclick = toggle;
      const step = (d) => {
        const cur = PRESET_ORDER.indexOf(currentPreset());
        const next = PRESET_ORDER[(cur + d + PRESET_ORDER.length) % PRESET_ORDER.length] || PRESET_ORDER[0];
        window.SI.sounds.preset(next);
      };
      card.querySelector('.snd-prev').onclick = () => step(-1);
      card.querySelector('.snd-next').onclick = () => step(1);
    });
    renderAll();
  }

  siRegister({
    id: 'sounds',
    modules: {
      sounds: {
        id: 'sounds',
        label: 'mod_sounds',
        html: `
          <div class="glass-card tilt-card module-card sounds-card">
            <div class="label-std si-card-head"><span>AMBIENT SOUND</span><button class="si-icon-btn snd-play" type="button"></button></div>
            <div class="snd-hero">
              <button class="si-icon-btn si-quiet snd-prev" type="button">${siIcon('chevL')}</button>
              <div class="snd-name"></div>
              <button class="si-icon-btn si-quiet snd-next" type="button">${siIcon('chevR')}</button>
            </div>
            <div class="snd-grid"></div>
          </div>`,
      },
    },
    init() {
      setupCards();
      window.SI.commands.push(
        { id: 'sound', title: t('sp_cmd_sound'), run: toggle },
        ...Object.keys(PRESETS).map((p) => ({
          id: 'sound-' + p,
          title: t('sp_cmd_sound_preset', { name: t('snd_preset_' + p) }),
          run: () => window.SI.sounds.preset(p),
        })),
      );
      /* 前回鳴らしていたなら再開を試みる（ブラウザが自動再生を止めた場合は ▶ で再開） */
      if (S.state.on) {
        ensureGraph();
        if (S.ctx.state === 'running') play();
        else {
          S.state.on = false;
          const resume = () => {
            document.removeEventListener('pointerdown', resume, true);
            document.removeEventListener('keydown', resume, true);
            if (!S.playing) play();
          };
          document.addEventListener('pointerdown', resume, true);
          document.addEventListener('keydown', resume, true);
        }
      }
    },
  });
})();
