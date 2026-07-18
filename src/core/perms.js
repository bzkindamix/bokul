/* BOKUL — İzinler (Ebeveyn Kilitleri)
 * Ebeveyn her çocuk için hangi derslere (cephe) ve hangi bölümlere
 * erişilebileceğini belirler. İzinler kayıtta tutulur (save.perms) ve
 * bulutta "directives" ile uzaktan da ayarlanabilir.
 * Kural: KAYIT YOKSA = SERBEST (varsayılan açık). Yalnızca engellenenler saklanır. */
(function (B) {
  function P(save) {
    const s = save || (B.State && B.State.data) || {};
    if (!s.perms) s.perms = {};
    if (!s.perms.lessons) s.perms.lessons = {};
    if (!s.perms.features) s.perms.features = {};
    return s.perms;
  }

  B.Perms = {
    /* Kilitlenebilir oyun bölümleri (derslerin dışında) */
    FEATURES: [
      { key: 'shop', icon: '🏠', name: 'Evim / Kıyafet Dükkânı' },
      { key: 'store', icon: '📦', name: 'Eşya Mağazası / Depom' },
      { key: 'quests', icon: '📋', name: 'Günlük Görevler' },
      { key: 'wishes', icon: '🎁', name: 'Dilek Kutusu' },
      { key: 'story', icon: '🎬', name: 'Hikâye Sineması' },
    ],

    ensure(save) { return P(save); },

    /* Ders erişilebilir mi? (kayıt yoksa serbest) */
    lesson(id, save) { return P(save).lessons[id] !== false; },
    /* Özellik erişilebilir mi? */
    feature(name, save) { return P(save).features[name] !== false; },

    /* Ebeveyn: dersi aç/kapa (açıksa kaydı sil — varsayılan açık kalsın) */
    setLesson(id, allowed, save) {
      const p = P(save);
      if (allowed) delete p.lessons[id]; else p.lessons[id] = false;
    },
    setFeature(name, allowed, save) {
      const p = P(save);
      if (allowed) delete p.features[name]; else p.features[name] = false;
    },
  };
})(window.BOKUL = window.BOKUL || {});
