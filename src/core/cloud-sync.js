/* BOKUL — Bulut Senkron (Firebase Firestore REST)
 * Çok-aileli senkron: her aile bir "aile kodu" ile ayrılır.
 * - Çocuğun cihazı ilerlemeyi buluta yazar (fotoğraf HARİÇ — cihazda kalır).
 * - Ebeveyn kendi cihazından, aynı aile koduyla tüm çocukları görür ve
 *   dilek hedefi/not (directives) yazar; çocuğun cihazı bir sonraki açılışta çeker.
 * SDK yok; doğrudan Firestore REST (fetch). Anahtar istemci içindir (public).
 * Yapılandırma yoksa modül sessizce devre dışıdır (çevrimdışı tek dosya bozulmaz). */
(function (B) {
  // Firebase istemci yapılandırması (public — dağıtılan dosyada olması normaldir)
  const CFG = {
    projectId: 'bokul-bc2c4',
    apiKey: 'AIzaSyCe9-6Dl_fcx1q8WxiX_MoGM7dpHc7YJeY',
  };
  const CODE_KEY = 'bokul.familyCode'; // cihaz düzeyinde (tüm profiller ortak)

  function base() {
    return 'https://firestore.googleapis.com/v1/projects/' + CFG.projectId + '/databases/(default)/documents';
  }
  function configured() { return !!(CFG.projectId && CFG.apiKey); }

  function getCode() { try { return localStorage.getItem(CODE_KEY) || ''; } catch (e) { return ''; } }
  function setCode(c) { try { c ? localStorage.setItem(CODE_KEY, c) : localStorage.removeItem(CODE_KEY); } catch (e) {} }
  function enabled() { return configured() && !!getCode(); }

  /* Rastgele, tahmin edilemez aile kodu (karışabilen harfler yok) */
  function genCode() {
    const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let s = '';
    const arr = new Uint32Array(10);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    for (let i = 0; i < 10; i++) s += abc[arr[i] % abc.length];
    return s;
  }

  /* Firestore alanı: her şeyi stringValue olarak tutuyoruz (basit) */
  function sv(s) { return { stringValue: String(s == null ? '' : s) }; }

  /* Kaydı buluta uygun hale getir: fotoğrafı çıkar (gizlilik) */
  function stripForCloud(state) {
    const copy = JSON.parse(JSON.stringify(state));
    if (copy.player && copy.player.avatar) { copy.player.avatar.photo = null; copy.player.avatar.usePhoto = false; }
    return copy;
  }

  async function req(url, opts) {
    const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'key=' + CFG.apiKey, opts);
    if (!res.ok) throw new Error('Firestore ' + res.status);
    return res.status === 200 ? res.json() : null;
  }

  function playerDoc(code, key) { return base() + '/families/' + encodeURIComponent(code) + '/players/' + encodeURIComponent(key); }

  B.Cloud = {
    configured, enabled, getCode, setCode, genCode,

    /* Aktif profilin kaydını buluta yaz (directives'e DOKUNMAZ) */
    async pushSave() {
      if (!enabled() || !B.Auth || !B.Auth.current()) return;
      const code = getCode(), key = B.Auth.current();
      const body = { fields: {
        name: sv(B.State.data.player.name),
        save: sv(JSON.stringify(stripForCloud(B.State.data))),
        updatedAt: sv(new Date().toISOString()),
      } };
      const mask = 'updateMask.fieldPaths=name&updateMask.fieldPaths=save&updateMask.fieldPaths=updatedAt';
      try {
        await req(playerDoc(code, key) + '?' + mask, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      } catch (e) { /* çevrimdışıysa sessiz geç, sonra tekrar denenir */ }
    },

    /* Ebeveyn direktiflerini çek ve yerel dileklere uygula */
    async pullDirectives() {
      if (!enabled() || !B.Auth || !B.Auth.current()) return;
      try {
        const doc = await req(playerDoc(getCode(), B.Auth.current()), { method: 'GET' });
        const d = doc && doc.fields && doc.fields.directives ? JSON.parse(doc.fields.directives.stringValue) : null;
        if (d) B.Cloud.applyDirectives(d);
      } catch (e) { /* yoksa/çevrimdışıysa geç */ }
    },

    /* Directives'i yerel wishes/ideas'e uygula (ebeveyn otoritedir) */
    applyDirectives(d) {
      let changed = false;
      (B.State.data.wishes || []).forEach(w => {
        const dw = d.wishes && d.wishes[w.id];
        if (dw) {
          if (dw.goal !== undefined) w.goal = dw.goal;
          if (dw.note !== undefined) w.note = dw.note;
          if (dw.status && dw.status !== w.status && !(w.status === 'earned' && dw.status === 'assigned')) w.status = dw.status;
          changed = true;
        }
      });
      (B.State.data.ideas || []).forEach(i => {
        const di = d.ideas && d.ideas[i.id];
        if (di) { if (di.status) i.status = di.status; if (di.note !== undefined) i.note = di.note; changed = true; }
      });
      if (changed) { B.Save.saveSoon(); if (B.Wish) B.Wish.checkEarned(); }
    },

    /* Ebeveyn: aile kodundaki tüm oyuncuları listele (uzaktan görüntüleme) */
    async listPlayers() {
      if (!enabled()) return [];
      try {
        const res = await req(base() + '/families/' + encodeURIComponent(getCode()) + '/players', { method: 'GET' });
        const docs = (res && res.documents) || [];
        return docs.map(doc => {
          const key = doc.name.split('/').pop();
          const f = doc.fields || {};
          let save = null; try { save = JSON.parse(f.save.stringValue); } catch (e) {}
          return { key, name: f.name ? f.name.stringValue : key, save, updatedAt: f.updatedAt ? f.updatedAt.stringValue : '' };
        }).filter(p => p.save);
      } catch (e) { return []; }
    },

    /* Ebeveyn: bir oyuncuya directives yaz (save'e DOKUNMAZ) */
    async writeDirectives(playerKey, directives) {
      if (!enabled()) return false;
      const body = { fields: { directives: sv(JSON.stringify(directives)) } };
      try {
        await req(playerDoc(getCode(), playerKey) + '?updateMask.fieldPaths=directives', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        return true;
      } catch (e) { return false; }
    },

    /* Mevcut directives'i oku (ebeveyn düzenlerken üstüne eklesin diye) */
    async readDirectives(playerKey) {
      if (!enabled()) return {};
      try {
        const doc = await req(playerDoc(getCode(), playerKey), { method: 'GET' });
        return doc && doc.fields && doc.fields.directives ? JSON.parse(doc.fields.directives.stringValue) : {};
      } catch (e) { return {}; }
    },

    init() {
      if (!configured()) return;
      // Kaydedince buluta gönder (debounce'lu)
      let t = null;
      B.Bus.on(B.Events.GAME_SAVED, () => {
        if (!enabled()) return;
        clearTimeout(t); t = setTimeout(() => B.Cloud.pushSave(), 1500);
      });
    },
  };
})(window.BOKUL = window.BOKUL || {});
