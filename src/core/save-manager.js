/* BOKUL — SaveManager
 * LocalStorage kayıt: debounce'lu otomatik kayıt + şema migrasyonu.
 * Bozuk kayıt asla sessizce silinmez; yedeğe kopyalanır. */
(function (B) {
  // Kayıt anahtarı artık AKTİF PROFİLE göre (bkz. Auth.saveKey()).
  // Eski tek-oyunculu kayıt anahtarı (v0.10 öncesi) göç için okunur.
  const LEGACY_KEY = 'bokul.save.v1';
  const SETTINGS_KEY = 'bokul.settings';
  let timer = null;

  /* Eski şemaları yeniye taşıyan zincir: migrations[eskiSürüm] = fn(data) => data */
  const migrations = {
    // Örnek: 1: (d) => { d.yeniAlan = ...; d.meta.schemaVersion = 2; return d; }
  };

  function key() { return B.Auth ? B.Auth.saveKey() : LEGACY_KEY; }

  B.Save = {
    /* Aktif profilin kaydını yükle; yoksa taze durum. Eski tek kayıt varsa
     * ilk profile bir kez taşınır (legacyImport). */
    load() {
      const k = key();
      if (!k) { B.State.data = B.State.fresh(); return false; }
      let raw = null;
      try { raw = localStorage.getItem(k); } catch (e) { /* gizli mod vb. */ }
      if (!raw) { B.State.data = B.State.fresh(); return false; }
      try {
        let data = JSON.parse(raw);
        while (data.meta.schemaVersion < B.State.SCHEMA_VERSION) {
          const fn = migrations[data.meta.schemaVersion];
          if (!fn) throw new Error('Migrasyon eksik: ' + data.meta.schemaVersion);
          data = fn(data);
        }
        B.State.data = Object.assign(B.State.fresh(), data);
        B.Bus.emit(B.Events.GAME_LOADED, {});
        return true;
      } catch (e) {
        console.error('[BOKUL] Kayıt okunamadı, yedeğe alınıyor:', e);
        try { localStorage.setItem(k + '.corrupt', raw); localStorage.removeItem(k); } catch (e2) {}
        B.State.data = B.State.fresh();
        return false;
      }
    },

    /* v0.10 öncesi tek kayıt varsa, yeni bir profile içeriğini taşı */
    legacyImport() {
      try {
        const raw = localStorage.getItem(LEGACY_KEY);
        if (!raw) return false;
        B.State.data = Object.assign(B.State.fresh(), JSON.parse(raw));
        return true;
      } catch (e) { return false; }
    },
    hasLegacy() { try { return !!localStorage.getItem(LEGACY_KEY); } catch (e) { return false; } },

    saveNow() {
      const k = key();
      if (!k) return; // profil seçilmeden yazma
      B.State.touch();
      try {
        localStorage.setItem(k, JSON.stringify(B.State.data));
        B.Bus.emit(B.Events.GAME_SAVED, {});
      } catch (e) { console.error('[BOKUL] Kayıt yazılamadı:', e); }
    },

    /* Debounce: art arda olaylarda tek yazım (config: autoSaveDebounceMs) */
    saveSoon() {
      clearTimeout(timer);
      const ms = (B.Content && B.Content.get('config') || {}).autoSaveDebounceMs || 2000;
      timer = setTimeout(() => B.Save.saveNow(), ms);
    },

    settings: {
      get() {
        try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
        catch (e) { return {}; }
      },
      set(patch) {
        const cur = B.Save.settings.get();
        Object.assign(cur, patch);
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(cur)); } catch (e) {}
        return cur;
      },
    },

    /* Önemli olaylarda otomatik kayıt bağla */
    init() {
      const E = B.Events;
      [E.QUESTION_COMPLETED, E.MISSION_COMPLETED, E.LEVEL_UP,
       E.BOSS_DEFEATED, E.BOSS_RETREAT, E.XP_GAINED]
        .forEach(ev => B.Bus.on(ev, () => B.Save.saveSoon()));
      window.addEventListener('beforeunload', () => B.Save.saveNow());
    },
  };
})(window.BOKUL = window.BOKUL || {});
