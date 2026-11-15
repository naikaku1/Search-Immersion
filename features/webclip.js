/* =====================================================================
   Search Immersion v28 — Web Clip（サイトの一部をホームに置く）
   入口: ページを右クリック →「Search Immersion に切り抜く」
   ・画像として保存（どのサイトでも）
   ・要素を選んだ場合は文章とリンクも保存し、「更新」で取り直せる
     （そのサイトへのアクセスは、更新ボタンを押したときに初めて許可を求める）
   ・前回から増えた行には印が付く
   ===================================================================== */
(() => {
  const DB = () => window.SIClipDB;
  const AUTO_REFRESH_MS = 30 * 60 * 1000;
  const urls = new Map();

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const hostOf = (u) => {
    try {
      return new URL(u).hostname.replace(/^www\./, '');
    } catch (e) {
      return '';
    }
  };
  const originPattern = (u) => {
    const x = new URL(u);
    return `${x.protocol}//${x.hostname}/*`;
  };
  const ago = (ts) => {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return t('w_just_now');
    if (m < 60) return t('w_min_ago', { n: m });
    const h = Math.round(m / 60);
    if (h < 24) return t('w_hour_ago', { n: h });
    return t('w_day_ago', { n: Math.round(h / 24) });
  };
  const imgUrl = (clip) => {
    if (!clip.img) return '';
    if (!urls.has(clip.id)) urls.set(clip.id, URL.createObjectURL(clip.img));
    return urls.get(clip.id);
  };

  /* 切り離された文書（DOMParser）には innerText が無い。段落の切れ目で改行を入れて近づける */
  const BLOCK = new Set(['P', 'DIV', 'LI', 'UL', 'OL', 'TR', 'TABLE', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DT', 'DD', 'DL', 'BLOCKQUOTE', 'PRE', 'FIGURE', 'FIGCAPTION', 'NAV', 'ASIDE', 'MAIN', 'TIME']);
  function extractText(node) {
    let out = '';
    const walk = (n) => {
      if (n.nodeType === 3) {
        out += n.nodeValue.replace(/\s+/g, ' ');
        return;
      }
      if (n.nodeType !== 1) return;
      const tag = n.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE') return;
      if (tag === 'BR') {
        out += '\n';
        return;
      }
      const block = BLOCK.has(tag);
      if (block) out += '\n';
      if (tag === 'TD' || tag === 'TH') out += ' ';
      n.childNodes.forEach(walk);
      if (block) out += '\n';
    };
    walk(node);
    return out
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n')
      .slice(0, 6000);
  }
  const linksOf = (node, base) =>
    [...node.querySelectorAll('a[href]')]
      .map((a) => {
        let href = '';
        try {
          href = new URL(a.getAttribute('href'), base).href;
        } catch (e) {}
        return { text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140), href };
      })
      .filter((l) => l.text && /^https?:/.test(l.href))
      .slice(0, 30);

  /* 開いているタブに同じページがあれば、そこから読む（JS で描かれるサイト向け） */
  async function readFromOpenTab(clip) {
    const want = clip.url.replace(/#.*$/, '');
    const tabs = await chrome.tabs.query({});
    const tab = tabs.find((tb) => tb.url && tb.url.replace(/#.*$/, '') === want);
    if (!tab) return null;
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (sel) => {
        const n = document.querySelector(sel);
        if (!n) return null;
        return {
          text: (n.innerText || '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 6000),
          links: [...n.querySelectorAll('a[href]')]
            .map((a) => ({ text: (a.innerText || '').trim().slice(0, 140), href: a.href }))
            .filter((l) => l.text && /^https?:/.test(l.href))
            .slice(0, 30),
        };
      },
      args: [clip.selector],
    });
    return res && res.result ? { ...res.result, fromTab: true } : null;
  }

  async function refreshClip(clip, interactive) {
    if (clip.mode !== 'live' || !clip.selector) return { status: 'image' };
    const pattern = originPattern(clip.url);
    let ok;
    if (interactive) ok = await chrome.permissions.request({ origins: [pattern] });
    else ok = await chrome.permissions.contains({ origins: [pattern] });
    if (!ok) return { status: 'noperm' };

    let fresh = null;
    try {
      const res = await fetch(clip.url, { credentials: 'include', cache: 'no-cache' });
      if (res.ok) {
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        const node = doc.querySelector(clip.selector);
        const text = node ? extractText(node) : '';
        if (text) fresh = { text, links: linksOf(node, clip.url) };
      }
    } catch (e) {}
    if (!fresh) {
      try {
        fresh = await readFromOpenTab(clip);
      } catch (e) {}
    }
    clip.checkedAt = Date.now();
    if (!fresh || !fresh.text) {
      clip.lastStatus = 'notfound';
      await DB().put(clip);
      return { status: 'notfound' };
    }

    /* 取り方（innerText / 自前の抽出）で改行が揃わないので、同じ取り方どうしで比べる */
    const key = fresh.fromTab ? 'tabText' : 'liveText';
    const before = clip[key];
    let changed = 0;
    if (before && before !== fresh.text) {
      const old = new Set(before.split('\n'));
      changed = fresh.text.split('\n').filter((l) => !old.has(l)).length;
      clip.prevText = clip.liveText || clip.tabText || clip.text;
      clip.changedAt = Date.now();
      clip.changedLines = changed;
    }
    clip[key] = fresh.text;
    clip.shown = fresh.text;
    if (fresh.links && fresh.links.length) clip.links = fresh.links;
    clip.lastStatus = 'ok';
    await DB().put(clip);
    return { status: changed ? 'changed' : 'same', changed };
  }

  /* ================================================================ カード */
  function setupCards() {
    const cards = [...document.querySelectorAll('.webclip-card')];
    if (!cards.length || !DB()) return;
    let clips = [];

    const load = async () => {
      try {
        clips = await DB().all();
      } catch (e) {
        clips = [];
      }
    };

    const renderCard = (card) => {
      let idx = Math.min(Number(card.dataset.idx || 0), Math.max(0, clips.length - 1));
      card.dataset.idx = String(idx);
      const body = card.querySelector('.wcp-body');
      const src = card.querySelector('.wcp-src');
      const status = card.querySelector('.wcp-status');
      const dots = card.querySelector('.wcp-dots');
      const btns = card.querySelector('.wcp-actions');
      body.textContent = '';
      dots.textContent = '';
      status.textContent = '';

      if (!clips.length) {
        src.textContent = 'WEB CLIP';
        src.title = '';
        btns.style.visibility = 'hidden';
        card.querySelector('.wcp-foot').style.visibility = 'hidden';
        body.appendChild(window.SI.howtoEmpty ? window.SI.howtoEmpty('webclip', t('wc_empty')) : el('div', 'si-card-empty', t('wc_empty')));
        return;
      }
      btns.style.visibility = 'visible';
      card.querySelector('.wcp-foot').style.visibility = clips.length > 1 ? 'visible' : 'hidden';

      const clip = clips[idx];
      src.textContent = (hostOf(clip.url) || 'WEB CLIP').toUpperCase();
      src.title = clip.title;
      const view = clip.mode === 'live' && clip.view === 'text' ? 'text' : 'image';
      card.querySelector('.wcp-view').style.display = clip.mode === 'live' ? '' : 'none';
      card.querySelector('.wcp-view').innerHTML = siIcon(view === 'text' ? 'image' : 'text');
      card.querySelector('.wcp-view').title = view === 'text' ? t('wc_view_image') : t('wc_view_text');
      card.querySelector('.wcp-refresh').style.display = clip.mode === 'live' ? '' : 'none';

      if (view === 'image') {
        const im = el('img', 'wcp-img');
        im.src = imgUrl(clip);
        im.alt = clip.title;
        im.onclick = () => (location.href = clip.url);
        body.appendChild(im);
      } else {
        const wrap = el('div', 'wcp-text');
        const text = clip.shown || clip.liveText || clip.tabText || clip.text || '';
        const prev = new Set((clip.prevText || '').split('\n'));
        const fresh = clip.changedAt && Date.now() - clip.changedAt < 24 * 3600 * 1000;
        const linkMap = new Map((clip.links || []).map((l) => [l.text, l.href]));
        text
          .split('\n')
          .filter((l) => l.trim())
          .slice(0, 40)
          .forEach((line) => {
            const href = linkMap.get(line.trim());
            const row = el(href ? 'a' : 'div', 'wcp-line');
            row.textContent = line;
            if (href) row.href = href;
            if (fresh && clip.prevText && !prev.has(line)) row.classList.add('is-new');
            wrap.appendChild(row);
          });
        body.appendChild(wrap);
      }

      const bits = [];
      if (clip.changedAt && Date.now() - clip.changedAt < 24 * 3600 * 1000 && clip.changedLines) {
        bits.push(t('wc_changed', { n: clip.changedLines }));
        status.classList.add('hot');
      } else status.classList.remove('hot');
      if (clip.mode === 'live') {
        if (clip.lastStatus === 'notfound') bits.push(t('wc_notfound'));
        else bits.push(t('wc_checked', { ago: ago(clip.checkedAt || clip.at) }));
      } else bits.push(t('wc_saved', { ago: ago(clip.at) }));
      status.textContent = bits.join(' · ');

      clips.slice(0, 12).forEach((_, i) => {
        const d = el('i', i === idx ? 'on' : '');
        d.onclick = () => {
          card.dataset.idx = String(i);
          renderCard(card);
        };
        dots.appendChild(d);
      });
    };

    const renderAll = () => cards.forEach(renderCard);

    cards.forEach((card, ci) => {
      card.dataset.idx = String(ci);
      const cur = () => clips[Number(card.dataset.idx || 0)];
      card.querySelector('.wcp-prev').onclick = () => {
        card.dataset.idx = String((Number(card.dataset.idx) - 1 + clips.length) % clips.length);
        renderCard(card);
      };
      card.querySelector('.wcp-next').onclick = () => {
        card.dataset.idx = String((Number(card.dataset.idx) + 1) % clips.length);
        renderCard(card);
      };
      card.querySelector('.wcp-open').onclick = () => cur() && (location.href = cur().url);
      card.querySelector('.wcp-view').onclick = async () => {
        const c = cur();
        if (!c) return;
        c.view = c.view === 'text' ? 'image' : 'text';
        await DB().put(c);
        renderCard(card);
      };
      card.querySelector('.wcp-del').onclick = async () => {
        const c = cur();
        if (!c || !confirm(t('wc_delete_confirm'))) return;
        await DB().remove(c.id);
        if (urls.has(c.id)) URL.revokeObjectURL(urls.get(c.id));
        urls.delete(c.id);
        await load();
        renderAll();
      };
      const refreshBtn = card.querySelector('.wcp-refresh');
      refreshBtn.onclick = async () => {
        const c = cur();
        if (!c) return;
        refreshBtn.classList.add('spin');
        const r = await refreshClip(c, true).catch(() => ({ status: 'error' }));
        refreshBtn.classList.remove('spin');
        if (r.status === 'noperm') window.SI.toast && window.SI.toast(t('wc_need_perm'));
        else if (r.status === 'notfound') window.SI.toast && window.SI.toast(t('wc_notfound_long'));
        else if (r.status === 'changed') window.SI.toast && window.SI.toast(t('wc_changed', { n: r.changed }));
        else if (r.status === 'same') window.SI.toast && window.SI.toast(t('wc_same'));
        if (c.view !== 'text' && r.status === 'changed') c.view = 'text';
        renderCard(card);
      };
    });

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.action === 'clipAdded') {
        load().then(() => {
          cards.forEach((c) => (c.dataset.idx = '0'));
          renderAll();
        });
      }
    });

    load().then(async () => {
      renderAll();
      /* 許可済みのサイトだけ、30 分以上たっていたら裏で取り直す */
      for (const c of clips) {
        if (c.mode !== 'live' || Date.now() - (c.checkedAt || 0) < AUTO_REFRESH_MS) continue;
        try {
          await refreshClip(c, false);
        } catch (e) {}
      }
      renderAll();
    });
  }

  siRegister({
    id: 'webclip',
    modules: {
      webclip: {
        id: 'webclip',
        label: 'mod_webclip',
        html: `
          <div class="glass-card tilt-card module-card webclip-card">
            <div class="label-std si-card-head">
              <span class="wcp-src">WEB CLIP</span>
              <span class="wcp-actions">
                <button class="si-icon-btn wcp-refresh" type="button">${siIcon('refresh')}</button>
                <button class="si-icon-btn wcp-view" type="button"></button>
                <button class="si-icon-btn wcp-open" type="button">${siIcon('external')}</button>
                <button class="si-icon-btn wcp-del" type="button">${siIcon('close')}</button>
              </span>
            </div>
            <div class="wcp-body"></div>
            <div class="wcp-foot">
              <button class="si-icon-btn wcp-prev" type="button">${siIcon('chevL')}</button>
              <span class="wcp-dots"></span>
              <button class="si-icon-btn wcp-next" type="button">${siIcon('chevR')}</button>
            </div>
            <div class="wcp-status"></div>
          </div>`,
      },
    },
    init() {
      document.querySelectorAll('.wcp-refresh').forEach((b) => (b.title = t('wc_refresh')));
      document.querySelectorAll('.wcp-open').forEach((b) => (b.title = t('wc_open')));
      document.querySelectorAll('.wcp-del').forEach((b) => (b.title = t('ctx_del')));
      setupCards();
    },
  });
})();
