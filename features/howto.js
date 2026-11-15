/* =====================================================================
   Search Immersion v28 — 使い方
   カードの中では説明しない。入口が見えにくいカード（Web Clip・あとで読む）だけ、
   空のときの一行の横に「使い方」を置き、押したときにだけ手順を見せる。
   コマンドパレットからも開ける。
   ===================================================================== */
(() => {
  const GUIDES = {
    webclip: { name: 'mod_webclip', steps: ['ht_webclip_1', 'ht_webclip_2', 'ht_webclip_3'] },
    readlater: { name: 'mod_readlater', steps: ['ht_readlater_1', 'ht_readlater_2', 'ht_readlater_3'] },
  };

  function show(id) {
    const g = GUIDES[id];
    if (!g || document.getElementById('si-howto')) return;
    const ov = document.createElement('div');
    ov.id = 'si-howto';
    ov.className = 'overlay-modal show';
    const card = document.createElement('div');
    card.className = 'glass-card si-wn-card si-ht-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');

    const label = document.createElement('div');
    label.className = 'si-wn-label';
    label.textContent = 'HOW TO';
    const title = document.createElement('div');
    title.className = 'si-ht-title';
    title.textContent = t(g.name);

    const list = document.createElement('div');
    list.className = 'si-wn-list';
    g.steps.forEach((key, i) => {
      const row = document.createElement('div');
      row.className = 'si-wn-item si-ht-step';
      const n = document.createElement('div');
      n.className = 'si-ht-n';
      n.textContent = String(i + 1);
      const d = document.createElement('div');
      d.className = 'si-ht-text';
      d.textContent = t(key);
      row.append(n, d);
      list.appendChild(row);
    });

    const foot = document.createElement('div');
    foot.className = 'si-wn-foot';
    const ok = document.createElement('button');
    ok.className = 'st-btn primary-btn';
    ok.textContent = t('wn_close');
    ok.onclick = close;
    foot.appendChild(ok);

    card.append(label, title, list, foot);
    ov.appendChild(card);
    ov.onclick = (e) => e.target === ov && close();
    ov.addEventListener('keydown', (e) => e.key === 'Escape' && close());
    (document.getElementById('immersion-root') || document.body).appendChild(ov);
    setTimeout(() => ok.focus({ preventScroll: true }), 50);
    function close() {
      ov.classList.remove('show');
      setTimeout(() => ov.remove(), 400);
    }
  }

  /* 空のカードに置く一行：「ページを右クリックして追加　使い方」 */
  function emptyLine(id, text) {
    const wrap = document.createElement('div');
    wrap.className = 'si-card-empty';
    wrap.appendChild(document.createTextNode(text));
    const a = document.createElement('button');
    a.type = 'button';
    a.className = 'si-ht-link';
    a.textContent = t('ht_link');
    a.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      show(id);
    };
    wrap.appendChild(a);
    return wrap;
  }

  window.SI.howto = show;
  window.SI.howtoEmpty = emptyLine;

  siRegister({
    id: 'howto',
    init() {
      Object.keys(GUIDES).forEach((id) =>
        window.SI.commands.push({ id: 'howto-' + id, title: t('ht_cmd', { name: t(GUIDES[id].name) }), run: () => show(id) }),
      );
    },
  });
})();
