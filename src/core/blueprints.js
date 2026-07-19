/* BOKUL — Blueprint'ler (Üretim Tarifleri / Yetenekler)
 * Bir tarifi (recipe) craft edebilmek için onu açan blueprint'i ÖĞRENMİŞ olmak
 * gerekir. Blueprint iki yolla öğrenilir: (1) ilgili Hobi Kursu'nu bitirmek
 * (ücretsiz, kalıcı yetenek), (2) Çarşı → Tarifhane'den yüksek bedelle satın almak.
 * Öğrenilenler: B.State.data.blueprints = [blueprintId, ...]
 * İçerik: content/blueprints.json */
(function (B) {
  function data() { return B.Content.get('blueprints') || { blueprints: [] }; }
  function learnedArr() { const s = B.State.data; if (!s.blueprints) s.blueprints = []; return s.blueprints; }

  B.Blueprints = {
    all() { return data().blueprints || []; },
    get(id) { return (data().blueprints || []).find(b => b.id === id) || null; },
    intro() { return data().intro || ''; },

    learned() { return learnedArr().slice(); },
    isLearned(id) { return learnedArr().indexOf(id) >= 0; },

    /* Bu tarifi açan blueprint (yoksa null = zaten serbest) */
    forRecipe(recipeId) { return (data().blueprints || []).find(b => (b.grants || []).indexOf(recipeId) >= 0) || null; },
    /* Tarif craft edilebilir mi? (blueprint yok → serbest; varsa öğrenilmiş olmalı) */
    recipeUnlocked(recipeId) {
      const b = B.Blueprints.forRecipe(recipeId);
      return !b || B.Blueprints.isLearned(b.id);
    },

    /* Öğren: opts.free ise bedelsiz (kurs ödülü), değilse altınla satın al */
    learn(id, opts) {
      const b = B.Blueprints.get(id);
      if (!b) return { ok: false, err: 'Blueprint bulunamadı.' };
      if (B.Blueprints.isLearned(id)) return { ok: false, err: 'Bu blueprint\'i zaten öğrendin.' };
      const free = !!(opts && opts.free);
      if (!free) {
        if ((B.State.data.player.coins || 0) < b.price) return { ok: false, err: 'Altının yetmiyor! Görev ve harekâtlardan kazan.' };
        if (!B.Reward.spendCoins(b.price)) return { ok: false, err: 'Altının yetmiyor!' };
      }
      learnedArr().push(id);
      if (B.Bus && B.Events) B.Bus.emit(B.Events.BLUEPRINT_LEARNED || 'blueprint:learned', { id, free });
      B.Save.saveSoon();
      return { ok: true, bp: b, free };
    },

    /* Bir hobi kursu (lesson id) bitince ilgili blueprint'i ücretsiz öğret.
     * Zaten öğrenilmişse sessizce geçer. Döner: öğrenilen blueprint ya da null. */
    grantForHobby(hobbyLessonId) {
      const b = (data().blueprints || []).find(x => x.hobby === hobbyLessonId);
      if (!b || B.Blueprints.isLearned(b.id)) return null;
      const r = B.Blueprints.learn(b.id, { free: true });
      return r.ok ? b : null;
    },
  };
})(window.BOKUL = window.BOKUL || {});
