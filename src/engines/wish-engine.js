/* BOKUL — Wish Engine (Dilek Kutusu + Ebeveyn Hedefleri)
 * Çocuk gerçek hayattan bir ödül ister (oyuncak vb.) veya oyuna fikir verir.
 * Ebeveyn konsolu bir isteğe oyun-içi HEDEF bağlar (ör. 30 hedef tamamla).
 * Çocuk hedefe ulaşınca istek "hak edildi" olur; ebeveyn gerçek ödülü verir.
 * Metrik hesapları hem aktif oyuncu hem admin (diğer kayıtlar) için ortaktır. */
(function (B) {

  /* Ebeveyn tarafından atanabilen, oyun-içi ölçülebilir hedefler */
  const METRICS = {
    targets: { name: 'Hedef tamamla', icon: '🎯' },
    level:   { name: 'Seviyeye ulaş', icon: '⭐' },
    stars:   { name: 'Yıldız topla',  icon: '🌟' },
    bosses:  { name: 'Boss yen',      icon: '🏰' },
  };

  function sumStars(save) {
    let s = 0;
    const L = (save.progress && save.progress.lessons) || {};
    Object.values(L).forEach(les => Object.values(les.sections || {}).forEach(sec =>
      Object.values(sec.missions || {}).forEach(m => { s += m.stars || 0; })));
    return s;
  }
  function countBosses(save) {
    let n = 0;
    const L = (save.progress && save.progress.lessons) || {};
    Object.values(L).forEach(les => Object.values(les.sections || {}).forEach(sec => { if (sec.bossDefeated) n++; }));
    return n;
  }

  function newId() { return 'w' + Date.now().toString(36) + Math.floor(Math.random() * 1000); }

  B.Wish = {
    METRICS,

    /* Bir kayıt (save-like) için metrik değeri */
    value(save, metric) {
      switch (metric) {
        case 'level':   return save.player.level || 1;
        case 'targets': return (save.stats && save.stats.questionsDone) || 0;
        case 'stars':   return sumStars(save);
        case 'bosses':  return countBosses(save);
        default:        return 0;
      }
    },

    /* Hedefli bir isteğin ilerlemesi */
    progress(save, wish) {
      if (!wish.goal) return null;
      const cur = B.Wish.value(save, wish.goal.metric);
      const target = wish.goal.target || 1;
      return { cur, target, pct: Math.min(100, Math.round(cur / target * 100)), done: cur >= target };
    },

    /* ---- Aktif oyuncu (çocuk) tarafı ---- */
    addWish(text) {
      text = String(text || '').trim();
      if (!text) return;
      B.State.data.wishes.push({ id: newId(), text, created: new Date().toISOString(), status: 'pending', goal: null, note: '' });
      B.Save.saveSoon();
    },
    addIdea(text) {
      text = String(text || '').trim();
      if (!text) return;
      B.State.data.ideas.push({ id: newId(), text, created: new Date().toISOString(), status: 'new', note: '' });
      B.Save.saveSoon();
    },
    myWishes() { return B.State.data.wishes || []; },
    myIdeas() { return B.State.data.ideas || []; },

    /* Atanmış hedefler tamamlandı mı? Tamamlandıysa "hak edildi" yap + müjde */
    checkEarned() {
      let changed = false;
      (B.State.data.wishes || []).forEach(w => {
        if (w.goal && w.status === 'assigned') {
          if (B.Wish.value(B.State.data, w.goal.metric) >= w.goal.target) {
            w.status = 'earned';
            changed = true;
            B.UI.toast('🎉 "' + w.text + '" ödülünü hak ettin! Baba\'na göster.');
            B.Bus.emit(B.Events.WISH_EARNED, {});
          }
        }
      });
      if (changed) B.Save.saveSoon();
    },

    init() {
      const E = B.Events;
      B.Bus.on(E.QUESTION_COMPLETED, p => {
        const st = B.State.data.stats;
        st.questionsDone = (st.questionsDone || 0) + 1;
        if (p && p.firstTry) st.firstTryCorrect = (st.firstTryCorrect || 0) + 1;
        if (p && typeof p.ms === 'number') st.timeSumMs = (st.timeSumMs || 0) + p.ms;
        B.Wish.checkEarned();
      });
      B.Bus.on(E.LEVEL_UP, () => B.Wish.checkEarned());
      B.Bus.on(E.BOSS_DEFEATED, () => B.Wish.checkEarned());
    },
  };
})(window.BOKUL = window.BOKUL || {});
