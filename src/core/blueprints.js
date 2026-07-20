/* BOKUL — Blueprint'ler (Üretim Tarifleri / Yetenekler)
 * Bir tarifi (recipe) craft edebilmek için onu açan blueprint'i ÖĞRENMİŞ olmak
 * gerekir. Blueprint'ler 💎 NADİR SANDIKLARDAN düşer (boss ödülü) → Depom'dan "Öğren".
 * (grantForHobby: gelecekteki Hobi Kursu özelliği için hazır ama HENÜZ bağlı değil.)
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

    /* Bir hobi kursu (lesson id) bitince ilgili blueprint'i DEPOYA düşür (ödül).
     * Oyuncu sonra Depom'dan "Öğren" ile açar. Zaten öğrenilmişse/eldeyse geç.
     * Döner: düşen blueprint ya da null. */
    grantForHobby(hobbyLessonId) {
      const b = (data().blueprints || []).find(x => x.hobby === hobbyLessonId);
      if (!b || B.Blueprints.isLearned(b.id) || (B.Items && B.Items.count(b.id) > 0)) return null;
      if (B.Items) B.Items.add(b.id, 1);
      return b;
    },

    /* Depodaki blueprint item'ından öğren: yeteneği aç + item'ı tüket (bedelsiz) */
    learnFromDepot(id) {
      if (B.Blueprints.isLearned(id)) return { ok: false, err: 'Bu tarifi zaten biliyorsun.' };
      const r = B.Blueprints.learn(id, { free: true });
      if (!r.ok) return r;
      if (B.Items && B.Items.count(id) > 0) B.Items.remove(id, 1); // öğrenince item tükenir
      return r;
    },
  };
})(window.BOKUL = window.BOKUL || {});
