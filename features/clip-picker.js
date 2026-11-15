/* Web Clip — 範囲選び
   右クリック「Search Immersion に切り抜く」で、そのタブにだけ一度差し込まれる。
   ・カーソルの下の要素が囲まれる。クリックで決定
   ・ホイール / ↑↓ で範囲を親・子へ広げる・狭める
   ・ドラッグすると自由な四角で切り抜ける（画像のみ）
   ・Esc で中止
   ページの見た目に影響しないよう、表示は Shadow DOM の中に閉じ込める。 */
(() => {
  if (window.__siClipPicker) return;
  window.__siClipPicker = true;

  const lang = (navigator.language || 'en').slice(0, 2);
  const L = {
    ja: {
      hint: 'クリックで切り抜き　ホイール / ↑↓ で範囲を調整　ドラッグで自由な四角　Esc で中止',
      done: 'ホームに追加しました',
    },
    ko: {
      hint: '클릭으로 잘라내기　휠 / ↑↓ 로 범위 조정　드래그로 자유 영역　Esc 취소',
      done: '홈에 추가했습니다',
    },
    zh: { hint: '点击裁剪　滚轮 / ↑↓ 调整范围　拖动自由框选　Esc 取消', done: '已添加到主页' },
    en: { hint: 'Click to clip · Wheel / ↑↓ to resize · Drag for a free box · Esc to cancel', done: 'Added to your home' },
  }[lang] || null;
  const TXT = L || {
    hint: 'Click to clip · Wheel / ↑↓ to resize · Drag for a free box · Esc to cancel',
    done: 'Added to your home',
  };

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
    <style>
      .box{position:fixed;border:2px solid #50e3c2;background:rgba(80,227,194,.12);border-radius:6px;
        box-shadow:0 0 0 99999px rgba(0,0,0,.28);transition:all .08s ease;pointer-events:none}
      .bar{position:fixed;left:50%;top:14px;transform:translateX(-50%);background:rgba(18,18,20,.92);color:#fff;
        font:500 13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans",sans-serif;padding:10px 16px;
        border-radius:999px;box-shadow:0 8px 30px rgba(0,0,0,.35);white-space:nowrap;pointer-events:none}
      .tag{position:fixed;background:#50e3c2;color:#062;font:600 11px/1 ui-monospace,Menlo,monospace;padding:3px 6px;border-radius:4px;pointer-events:none}
    </style>
    <div class="box"></div><div class="tag"></div><div class="bar"></div>`;
  const box = root.querySelector('.box');
  const tag = root.querySelector('.tag');
  const bar = root.querySelector('.bar');
  bar.textContent = TXT.hint;
  document.documentElement.appendChild(host);

  let target = null;
  const stack = [];
  let drag = null;

  const show = (r, label) => {
    box.style.left = r.left + 'px';
    box.style.top = r.top + 'px';
    box.style.width = r.width + 'px';
    box.style.height = r.height + 'px';
    tag.textContent = label || '';
    tag.style.left = r.left + 'px';
    tag.style.top = Math.max(0, r.top - 20) + 'px';
    tag.style.display = label ? '' : 'none';
  };

  const describe = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.');
    const r = el.getBoundingClientRect();
    return `${s}  ${Math.round(r.width)}×${Math.round(r.height)}`;
  };

  const setTarget = (el) => {
    if (!el || el === document.documentElement) return;
    target = el;
    show(el.getBoundingClientRect(), describe(el));
  };

  const pick = (x, y) => {
    host.style.display = 'none';
    const el = document.elementFromPoint(x, y);
    host.style.display = '';
    return el;
  };

  /* 安定しやすい CSS セレクタを作る（id → 先頭からの nth-of-type の鎖） */
  const selectorOf = (el) => {
    if (el === document.body) return 'body';
    if (el.id && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) return '#' + CSS.escape(el.id);
    const parts = [];
    let cur = el;
    while (cur && cur.nodeType === 1 && cur !== document.body && parts.length < 12) {
      let part = cur.tagName.toLowerCase();
      if (cur.id && document.querySelectorAll('#' + CSS.escape(cur.id)).length === 1) {
        parts.unshift('#' + CSS.escape(cur.id));
        break;
      }
      const parent = cur.parentElement;
      if (parent) {
        const same = [...parent.children].filter((c) => c.tagName === cur.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(cur) + 1})`;
      }
      parts.unshift(part);
      cur = cur.parentElement;
    }
    if (parts[0] && !parts[0].startsWith('#')) parts.unshift('body');
    return parts.join(' > ');
  };

  const finish = (payload) => {
    cleanup();
    /* 囲み枠が写り込まないよう、消えてから 2 フレーム待って撮ってもらう */
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setTimeout(() => {
          chrome.runtime.sendMessage({ action: 'clipPicked', viewportW: window.innerWidth, ...payload }, (res) => {
            void chrome.runtime.lastError;
            if (res && res.ok) flash(TXT.done);
          });
        }, 60),
      ),
    );
  };

  const flash = (msg) => {
    const n = document.createElement('div');
    n.style.cssText =
      'position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:2147483647;background:rgba(18,18,20,.92);color:#fff;font:500 13px -apple-system,BlinkMacSystemFont,sans-serif;padding:10px 16px;border-radius:999px;pointer-events:none;transition:opacity .4s';
    n.innerHTML =
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#50e3c2" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:6px"><path d="m5.5 12.5 4.2 4.2 8.8-9.2"/></svg>';
    n.appendChild(document.createTextNode(msg));
    document.documentElement.appendChild(n);
    setTimeout(() => (n.style.opacity = '0'), 1400);
    setTimeout(() => n.remove(), 1900);
  };

  const commitElement = (el) => {
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = {
      x: Math.max(0, r.left),
      y: Math.max(0, r.top),
      w: Math.min(vw, r.right) - Math.max(0, r.left),
      h: Math.min(vh, r.bottom) - Math.max(0, r.top),
    };
    const links = [...el.querySelectorAll('a[href]')]
      .map((a) => ({ text: (a.innerText || a.textContent || '').trim().slice(0, 140), href: a.href }))
      .filter((l) => l.text && /^https?:/.test(l.href))
      .slice(0, 30);
    finish({
      mode: 'live',
      rect,
      dpr: window.devicePixelRatio || 1,
      selector: selectorOf(el),
      text: (el.innerText || el.textContent || '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 6000),
      links,
      title: document.title.slice(0, 200),
      url: location.href,
    });
  };

  const onMove = (e) => {
    if (drag) {
      drag.x2 = e.clientX;
      drag.y2 = e.clientY;
      if (Math.abs(drag.x2 - drag.x1) + Math.abs(drag.y2 - drag.y1) > 8) drag.moved = true;
      if (drag.moved) {
        const r = {
          left: Math.min(drag.x1, drag.x2),
          top: Math.min(drag.y1, drag.y2),
          width: Math.abs(drag.x2 - drag.x1),
          height: Math.abs(drag.y2 - drag.y1),
        };
        show(r, `${Math.round(r.width)}×${Math.round(r.height)}`);
      }
      return;
    }
    const el = pick(e.clientX, e.clientY);
    if (el && el !== target) {
      stack.length = 0;
      setTarget(el);
    }
  };
  const onDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    drag = { x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY, moved: false };
  };
  const onUp = (e) => {
    if (!drag) return;
    e.preventDefault();
    e.stopPropagation();
    const d = drag;
    drag = null;
    if (d.moved) {
      const rect = { x: Math.min(d.x1, d.x2), y: Math.min(d.y1, d.y2), w: Math.abs(d.x2 - d.x1), h: Math.abs(d.y2 - d.y1) };
      if (rect.w < 12 || rect.h < 12) return;
      finish({ mode: 'image', rect, dpr: window.devicePixelRatio || 1, title: document.title.slice(0, 200), url: location.href, text: '', links: [] });
    } else if (target) {
      commitElement(target);
    }
  };
  const swallow = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const grow = () => {
    if (target && target.parentElement && target.parentElement !== document.documentElement) {
      stack.push(target);
      setTarget(target.parentElement);
    }
  };
  const shrink = () => {
    if (stack.length) setTarget(stack.pop());
  };
  const onWheel = (e) => {
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.deltaY < 0) grow();
    else shrink();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') {
      swallow(e);
      cleanup();
    } else if (e.key === 'ArrowUp') {
      swallow(e);
      grow();
    } else if (e.key === 'ArrowDown') {
      swallow(e);
      shrink();
    } else if (e.key === 'Enter' && target) {
      swallow(e);
      commitElement(target);
    }
  };

  function cleanup() {
    window.removeEventListener('mousemove', onMove, true);
    window.removeEventListener('mousedown', onDown, true);
    window.removeEventListener('mouseup', onUp, true);
    /* クリックで決めたときは、mouseup の直後に同じクリックの click が届く。
       ここですぐ外すと、その click がページに渡り、リンクの上で決めたときにリンク先へ移ってしまう。
       少しだけ残して、その click も止めてから外す */
    setTimeout(() => window.removeEventListener('click', swallow, true), 400);
    window.removeEventListener('wheel', onWheel, { capture: true });
    window.removeEventListener('keydown', onKey, true);
    host.remove();
    window.__siClipPicker = false;
  }

  window.addEventListener('mousemove', onMove, true);
  window.addEventListener('mousedown', onDown, true);
  window.addEventListener('mouseup', onUp, true);
  window.addEventListener('click', swallow, true);
  window.addEventListener('wheel', onWheel, { capture: true, passive: false });
  window.addEventListener('keydown', onKey, true);
})();
