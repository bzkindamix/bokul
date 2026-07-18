/* BOKUL — Quest Engine (Günün Emirleri)
 * Her gün 3 günlük görev üretir; ilerlemeyi olaylardan takip eder.
 * Görev bitince "TOPLA" ile ödül alınır; hepsi toplanınca Gümüş sandık gelir. */
(function (B) {
  function today() { return new Date().toISOString().slice(0, 10); }
  function Q() { return B.Content.get('quests') || { daily: [] }; }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  /* Yeni günse 3 günlük görev seç ve sıfırla */
  function ensureDaily() {
    const st = B.State.data.quests;
    if (st.lastDailyReset === today() && st.daily && st.daily.length) return;
    const tpls = (Q().daily || []).slice();
    const picked = [];
    for (let i = 0; i < 3 && tpls.length; i++) {
      const t = tpls.splice(Math.floor(Math.random() * tpls.length), 1)[0];
      const target = t.n ? rnd(t.n[0], t.n[1]) : 1;
      picked.push({
        tpl: t.id, text: t.text.replace('{n}', target),
        target, progress: 0, done: false, claimed: false,
        xp: t.xp, coins: t.coins, track: t.track, filter: t.filter || null,
      });
    }
    st.daily = picked;
    st.lastDailyReset = today();
    B.Save.saveSoon();
  }

  function matches(q, event, payload) {
    if (q.track !== event) return false;
    if (q.filter) for (const k in q.filter) if (payload[k] !== q.filter[k]) return false;
    return true;
  }

  function bump(event, payload) {
    const st = B.State.data.quests;
    if (!st.daily) return;
    let changed = false;
    st.daily.forEach(q => {
      if (q.done || !matches(q, event, payload)) return;
      q.progress = Math.min(q.target, q.progress + 1);
      if (q.progress >= q.target) q.done = true;
      changed = true;
    });
    if (changed) { B.Bus.emit(B.Events.QUEST_PROGRESS, {}); B.Save.saveSoon(); }
  }

  B.Quest = {
    ensureDaily,
    daily() { ensureDaily(); return B.State.data.quests.daily; },
    /* Toplanmayı bekleyen (bitmiş ama ödülü alınmamış) görev sayısı */
    pending() { ensureDaily(); return B.State.data.quests.daily.filter(q => q.done && !q.claimed).length; },

    claim(q) {
      if (!q.done || q.claimed) return null;
      q.claimed = true;
      B.Reward.addXp(q.xp || 50, 'quest');
      B.Reward.addCoins(q.coins || 20, 'quest');
      B.Bus.emit(B.Events.QUEST_COMPLETED, {});
      // Tüm günlük görevler toplandıysa Gümüş sandık ödülü
      if (B.State.data.quests.daily.every(x => x.claimed)) B.Chest.earn('silver');
      B.Save.saveSoon();
      return { xp: q.xp, coins: q.coins };
    },

    init() {
      const E = B.Events;
      B.Bus.on(E.QUESTION_COMPLETED, p => bump('question:completed', p));
      B.Bus.on(E.MISSION_COMPLETED, p => bump('mission:completed', p));
      B.Bus.on(E.BOSS_DEFEATED, p => bump('boss:defeated', p));
      B.Bus.on(E.STEP_ANSWERED, p => bump('step:answered', p));
    },
  };
})(window.BOKUL = window.BOKUL || {});
