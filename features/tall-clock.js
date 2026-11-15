/* =====================================================================
   Search Immersion v28 — 縦に伸びる時計
   iOS 26 のロック画面の時計は、縦に伸ばしても線の太さは変わらず、
   丸い部分の形も保ったまま、まっすぐな部分だけが長くなる。
   文字を transform で引き伸ばすと横の線まで太るので、数字を
   「太さ一定の線」で組み立て、高さに合わせて形そのものを作り直す。
   ===================================================================== */
(() => {
  /* 中心線で描く数字。W×H の箱、r は丸みの半径（横幅の半分）。
     縦の半径は r のまま保ち、余った高さは直線に回す */
  function digitPath(ch, W, H) {
    const r = W / 2;
    const cap = (v, max) => Math.min(v, max);
    const f = (n) => Math.round(n * 100) / 100;
    switch (ch) {
      case '0': {
        const ry = cap(r, H / 2);
        return `M0 ${f(ry)}A${f(r)} ${f(ry)} 0 0 1 ${f(W)} ${f(ry)}L${f(W)} ${f(H - ry)}A${f(r)} ${f(ry)} 0 0 1 0 ${f(H - ry)}Z`;
      }
      case '1': {
        const x = W * 0.6;
        return `M${f(W * 0.16)} ${f(cap(r * 0.75, H * 0.2))}L${f(x)} 0L${f(x)} ${f(H)}`;
      }
      case '2': {
        const ry = cap(r, H * 0.3);
        return `M0 ${f(ry)}A${f(r)} ${f(ry)} 0 0 1 ${f(W)} ${f(ry)}C${f(W)} ${f(ry + (H - ry) * 0.38)} 0 ${f(H - (H - ry) * 0.42)} 0 ${f(H)}L${f(W)} ${f(H)}`;
      }
      case '3': {
        const m = H * 0.46;
        const ra = cap(r * 0.94, m / 2);
        const rb = cap(r, (H - m) / 2);
        return `M0 ${f(ra)}A${f(r)} ${f(ra)} 0 0 1 ${f(W)} ${f(ra)}L${f(W)} ${f(m - ra)}A${f(r)} ${f(ra)} 0 0 1 ${f(W / 2)} ${f(m)}A${f(r)} ${f(rb)} 0 0 1 ${f(W)} ${f(m + rb)}L${f(W)} ${f(H - rb)}A${f(r)} ${f(rb)} 0 0 1 0 ${f(H - rb)}`;
      }
      case '4': {
        const x = W * 0.74;
        const y = H * 0.68;
        return `M${f(x)} ${f(H)}L${f(x)} 0L0 ${f(y)}L${f(W)} ${f(y)}`;
      }
      case '5': {
        const m = H * 0.4;
        const rb = cap(r, (H - m) / 2);
        return `M${f(W * 0.96)} 0L${f(W * 0.06)} 0L0 ${f(m)}L${f(W / 2)} ${f(m)}A${f(r)} ${f(rb)} 0 0 1 ${f(W)} ${f(m + rb)}L${f(W)} ${f(H - rb)}A${f(r)} ${f(rb)} 0 0 1 0 ${f(H - rb)}`;
      }
      case '6': {
        const m = H * 0.42;
        const rt = cap(r, H * 0.25);
        const rb = cap(r, (H - m) / 2);
        return `M${f(W)} ${f(rt)}A${f(r)} ${f(rt)} 0 0 0 0 ${f(rt)}L0 ${f(H - rb)}A${f(r)} ${f(rb)} 0 0 0 ${f(W)} ${f(H - rb)}L${f(W)} ${f(m + rb)}A${f(r)} ${f(rb)} 0 0 0 0 ${f(m + rb)}`;
      }
      case '7':
        return `M0 0L${f(W)} 0L${f(W * 0.3)} ${f(H)}`;
      case '8': {
        const m = H * 0.46;
        const xi = W * 0.06;
        const rt = (W - 2 * xi) / 2;
        const ra = cap(rt, m / 2);
        const rb = cap(r, (H - m) / 2);
        return (
          `M${f(xi)} ${f(ra)}A${f(rt)} ${f(ra)} 0 0 1 ${f(W - xi)} ${f(ra)}L${f(W - xi)} ${f(m - ra)}A${f(rt)} ${f(ra)} 0 0 1 ${f(xi)} ${f(m - ra)}Z` +
          `M0 ${f(m + rb)}A${f(r)} ${f(rb)} 0 0 1 ${f(W)} ${f(m + rb)}L${f(W)} ${f(H - rb)}A${f(r)} ${f(rb)} 0 0 1 0 ${f(H - rb)}Z`
        );
      }
      case '9': {
        const m = H * 0.58;
        const ra = cap(r, m / 2);
        const rb = cap(r, H * 0.25);
        return `M0 ${f(H - rb)}A${f(r)} ${f(rb)} 0 0 0 ${f(W)} ${f(H - rb)}L${f(W)} ${f(ra)}A${f(r)} ${f(ra)} 0 0 0 0 ${f(ra)}L0 ${f(m - ra)}A${f(r)} ${f(ra)} 0 0 0 ${f(W)} ${f(m - ra)}`;
      }
    }
    return '';
  }

  const NS = 'http://www.w3.org/2000/svg';
  let host = null;
  let lastKey = '';

  function geometry(timeEl) {
    const cs = getComputedStyle(timeEl);
    const fs = parseFloat(cs.fontSize) || 160;
    const weight = parseInt(cs.fontWeight, 10) || 600;
    const stretch = Math.min(2.2, Math.max(1, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--clock-stretch')) || 1));
    const H1 = fs * 0.72;
    const W = H1 * 0.56;
    const H = H1 * stretch;
    /* 太さの設定（100〜900）を線の太さに写す */
    let s = Math.max(2, W * (0.05 + ((Math.min(900, Math.max(100, weight)) - 100) / 800) * 0.27));
    /* Line テーマでは、太さの設定によらず細い一本線にする */
    if (document.body.classList.contains('line-mode')) s = Math.max(1.8, W * 0.04);
    return { W, H, s, gap: W * 0.2 };
  }

  function glyphSVG(ch, g) {
    const svg = document.createElementNS(NS, 'svg');
    if (ch === ':') {
      const w = Math.max(g.s * 1.6, 6);
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(g.H + g.s));
      svg.setAttribute('viewBox', `0 ${-g.s / 2} ${w} ${g.H + g.s}`);
      /* 縦に伸ばしても、点は中央付近にまとめておく */
      const d = Math.min(g.H * 0.16, g.W * 0.36);
      [-1, 1].forEach((k) => {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', String(w / 2));
        c.setAttribute('cy', String(g.H / 2 + k * d));
        c.setAttribute('r', String(document.body.classList.contains('line-mode') ? Math.max(2.4, g.s * 1.1) : g.s * 0.62));
        c.setAttribute('fill', 'currentColor');
        svg.appendChild(c);
      });
      return svg;
    }
    const p = digitPath(ch, g.W, g.H);
    svg.setAttribute('width', String(g.W + g.s));
    svg.setAttribute('height', String(g.H + g.s));
    svg.setAttribute('viewBox', `${-g.s / 2} ${-g.s / 2} ${g.W + g.s} ${g.H + g.s}`);
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', p);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', String(g.s));
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
  }

  function render() {
    const timeEl = document.getElementById('clock-time');
    if (!timeEl || !host) return;
    const on = document.body.classList.contains('clock-tall') || document.body.classList.contains('line-mode');
    if (!on) {
      lastKey = '';
      return;
    }
    /* 時刻の数字と、12 時間制の AM / PM を分けて読む */
    let digits = '';
    let suffix = '';
    timeEl.childNodes.forEach((n) => {
      if (n.nodeType === 3) digits += n.nodeValue;
      else suffix += n.textContent || '';
    });
    digits = digits.trim();
    const g = geometry(timeEl);
    const key = digits + '|' + suffix + '|' + [g.W, g.H, g.s].map((v) => v.toFixed(1)).join(',');
    if (key === lastKey) return;
    lastKey = key;

    const cs = getComputedStyle(timeEl);
    host.style.color = cs.color === 'rgba(0, 0, 0, 0)' || cs.color === 'transparent' ? 'rgba(255,255,255,.88)' : cs.color;
    host.style.gap = g.gap.toFixed(1) + 'px';
    host.textContent = '';
    [...digits].forEach((ch) => {
      if (/[0-9:]/.test(ch)) host.appendChild(glyphSVG(ch, g));
    });
    if (suffix.trim()) {
      const sp = document.createElement('span');
      sp.className = 'clock-tall-suffix';
      sp.textContent = suffix.trim();
      host.appendChild(sp);
    }
    host.setAttribute('aria-label', timeEl.textContent);
    glassLayer();
  }

  /* リキッドグラスでは、元の時計と同じく「数字の形に切り抜いた壁紙」を見せる。
     背景の切り抜き（background-clip:text）は SVG には効かないので、
     数字の線をまとめた 1 枚の SVG を作って、壁紙を敷いた層のマスクにする。
     壁紙の位置合わせは、ほかのガラス面と同じ alignLiquidGlass に任せる */
  function glassLayer() {
    host.querySelector('.ct-glass')?.remove();
    host.style.removeProperty('--ct-mask');
    if (!document.body.classList.contains('liquidglass-mode')) return;
    const hr = host.getBoundingClientRect();
    if (!hr.width || !hr.height) return;
    const z = hr.width / host.offsetWidth || 1;
    let inner = '';
    host.querySelectorAll('svg').forEach((svg) => {
      const r = svg.getBoundingClientRect();
      const x = ((r.left - hr.left) / z).toFixed(1);
      const y = ((r.top - hr.top) / z).toFixed(1);
      const body = svg.innerHTML.replace(/currentColor/g, '#000');
      inner += `<svg x="${x}" y="${y}" width="${svg.getAttribute('width')}" height="${svg.getAttribute('height')}" viewBox="${svg.getAttribute('viewBox')}" overflow="visible">${body}</svg>`;
    });
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    const mask = `<svg xmlns="${NS}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
    const layer = document.createElement('div');
    layer.className = 'ct-glass';
    layer.setAttribute('aria-hidden', 'true');
    const url = `url("data:image/svg+xml,${encodeURIComponent(mask)}")`;
    layer.style.webkitMaskImage = url;
    layer.style.maskImage = url;
    host.appendChild(layer);
    if (typeof lgRequestAlign === 'function') lgRequestAlign();
  }

  siRegister({
    id: 'tall-clock',
    init() {
      const timeEl = document.getElementById('clock-time');
      if (!timeEl) return;
      host = document.createElement('div');
      host.id = 'clock-tall';
      host.setAttribute('role', 'timer');
      timeEl.after(host);
      host.onclick = () => timeEl.click();
      new MutationObserver(render).observe(timeEl, { childList: true, characterData: true, subtree: true });
      /* テーマ・太さ・縦の長さが変わったとき（body の class と root の style） */
      new MutationObserver(() => {
        lastKey = '';
        render();
      }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
      new MutationObserver(() => {
        lastKey = '';
        render();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
      window.addEventListener('resize', () => {
        lastKey = '';
        render();
      });
      render();
    },
  });
})();
