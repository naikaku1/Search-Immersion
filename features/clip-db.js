/* Web Clip の保存先。新しいタブ（ページ）と background（Service Worker）の両方から読む。
   拡張の origin は共通なので、同じ IndexedDB を見られる。 */
(function (g) {
  const DB = 'SIClips';
  const STORE = 'clips';
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const s = db.createObjectStore(STORE, { keyPath: 'id' });
          s.createIndex('at', 'at');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbp = null;
        reject(req.error);
      };
    });
    return dbp;
  }

  function tx(mode, fn) {
    return open().then(
      (db) =>
        new Promise((resolve, reject) => {
          const t = db.transaction(STORE, mode);
          const store = t.objectStore(STORE);
          let out;
          Promise.resolve(fn(store)).then((v) => (out = v));
          t.oncomplete = () => resolve(out);
          t.onerror = () => reject(t.error);
          t.onabort = () => reject(t.error);
        }),
    );
  }

  const reqP = (r) =>
    new Promise((resolve, reject) => {
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });

  g.SIClipDB = {
    put: (clip) => tx('readwrite', (s) => reqP(s.put(clip))),
    get: (id) => tx('readonly', (s) => reqP(s.get(id))),
    remove: (id) => tx('readwrite', (s) => reqP(s.delete(id))),
    all: () =>
      tx('readonly', (s) => reqP(s.getAll())).then((list) => (list || []).sort((a, b) => b.at - a.at)),
    count: () => tx('readonly', (s) => reqP(s.count())),
  };
})(typeof self !== 'undefined' ? self : window);
