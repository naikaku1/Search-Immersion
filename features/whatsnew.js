/* =====================================================================
   Search Immersion v28 — 更新のお知らせ
   バージョンが上がった最初の 1 回だけ、新しくできることを紹介する。
   初回セットアップ中の人には出さない（セットアップ完了扱いで既読にする）。
   ===================================================================== */
(() => {
  const SEEN_KEY = 'immersion_seen_version';

  /* 日付カードと同じ作法：細く大きな数字と、英字の小見出し。項目は名前と一言だけ */
  const ITEMS = ['wn_clip', 'wn_rain', 'wn_sounds', 'wn_focus', 'wn_search', 'wn_cards'];

  function show(version) {
    if (document.getElementById('si-whatsnew')) return;
    const ov = document.createElement('div');
    ov.id = 'si-whatsnew';
    ov.className = 'overlay-modal show';
    const card = document.createElement('div');
    card.className = 'glass-card si-wn-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');

    const head = document.createElement('div');
    head.className = 'si-wn-head';
    const label = document.createElement('div');
    label.className = 'si-wn-label';
    label.textContent = "WHAT'S NEW";
    const big = document.createElement('div');
    big.className = 'si-wn-ver';
    big.textContent = version.split('.')[0];
    head.append(label, big);

    const list = document.createElement('div');
    list.className = 'si-wn-list';
    ITEMS.forEach((key) => {
      const row = document.createElement('div');
      row.className = 'si-wn-item';
      const a = document.createElement('div');
      a.className = 'si-wn-name';
      a.textContent = t(key);
      const b = document.createElement('div');
      b.className = 'si-wn-desc';
      b.textContent = t(key + '_d');
      row.append(a, b);
      list.appendChild(row);
    });

    const foot = document.createElement('div');
    foot.className = 'si-wn-foot';
    const ok = document.createElement('button');
    ok.className = 'st-btn';
    ok.textContent = t('wn_close');
    ok.onclick = close;
    const go = document.createElement('button');
    go.className = 'st-btn primary-btn';
    go.textContent = t('wn_try_widgets');
    go.onclick = () => {
      close();
      if (window.SI.widgetGallery) {
        window.SI.widgetGallery.open(1);
        return;
      }
      document.getElementById('settings-btn')?.click();
      document.querySelector('.st-tab-btn[data-tab="tab-widgets"]')?.click();
    };
    foot.append(ok, go);

    card.append(head, list, foot);
    ov.appendChild(card);
    ov.onclick = (e) => e.target === ov && close();
    ov.addEventListener('keydown', (e) => e.key === 'Escape' && close());
    document.getElementById('immersion-root')?.appendChild(ov);
    setTimeout(() => go.focus({ preventScroll: true }), 50);
    function close() {
      ov.classList.remove('show');
      setTimeout(() => ov.remove(), 400);
    }
  }

  siRegister({
    id: 'whatsnew',
    init() {
      window.SI.commands.push({ id: 'whatsnew', title: t('sp_cmd_whatsnew'), run: () => show(chrome.runtime.getManifest().version) });
      /* Spotify API 連携は、配布物にクライアント ID が入っていないと使えない。押しても失敗するボタンは隠す */
      try {
        chrome.runtime.sendMessage({ action: 'checkSpotifyLogin' }, (res) => {
          void chrome.runtime.lastError;
          if (res && res.configured === false) {
            const area = document.getElementById('spotify-auth-area');
            if (area) area.style.display = 'none';
          }
        });
      } catch (e) {}

      const version = chrome.runtime.getManifest().version;
      const major = version.split('.')[0];
      let seen = '';
      try {
        seen = localStorage.getItem(SEEN_KEY) || '';
      } catch (e) {}
      const fresh = !localStorage.getItem('immersion_setup_done');
      localStorage.setItem(SEEN_KEY, version);
      if (fresh || seen.split('.')[0] === major) return;
      setTimeout(() => show(version), 900);
    },
  });

  window.SI.showWhatsNew = () => show(chrome.runtime.getManifest().version);
})();
