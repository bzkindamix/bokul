/* BOKUL — RewardEngine
 * XP, level, rütbe, seri (streak) ve günlük çalışma serisi ekonomisi.
 * Tüm sayılar content/rewards.json'dan gelir — kodda denge sabiti YOK. */
(function (B) {
  function R() { return B.Content.get('rewards'); }

  /* Level n'i geçmek için gereken XP: base + (n-1)*perLevel */
  function xpForLevel(n) { const L = R().levels; return L.base + (n - 1) * L.perLevel; }

  B.Reward = {
    /* ---- XP ---- */
    addXp(amount, source, opts) {
      opts = opts || {};
      let final = amount;
      if (opts.applyStreak) final = Math.round(final * B.Reward.streakMultiplier());
      final = Math.round(final * (1 + B.Reward.dailyBonus()));
      const p = B.State.data.player;
      p.xp += final;
      B.Bus.emit(B.Events.XP_GAINED, { amount: final, source });
      // Level kontrolü (tek olayda birden çok level atlanabilir)
      while (p.xp >= B.Reward.xpNeeded()) {
        p.xp -= B.Reward.xpNeeded();
        p.level++;
        const rank = B.Reward.rankFor(p.level);
        const rankChanged = rank.id !== p.rank;
        p.rank = rank.id;
        B.Bus.emit(B.Events.LEVEL_UP, { newLevel: p.level, newRank: rankChanged ? rank : null });
      }
      return final;
    },

    xpNeeded() { return xpForLevel(B.State.data.player.level); },

    rankFor(level) {
      const ranks = R().ranks;
      let cur = ranks[0];
      ranks.forEach(r => { if (level >= r.minLevel) cur = r; });
      return cur;
    },

    /* ---- Hatasız hedef serisi ---- */
    streakMultiplier() {
      const mults = R().xp.streakMultipliers;
      const s = B.State.data.streaks.current;
      let m = 1;
      Object.keys(mults).map(Number).sort((a, b) => a - b)
        .forEach(k => { if (s >= k) m = mults[k]; });
      return m;
    },

    onQuestionDone(flawless) {
      const st = B.State.data.streaks;
      if (flawless) {
        st.current++;
        if (st.current > st.best) st.best = st.current;
        // Doğru-cevap serisi ödülü: her 25/50/75/100'de KADEMELİ artan sandık (100'lük döngü tekrar eder)
        if (st.current % 25 === 0 && B.Chest && B.Chest.earn && !(B.Demo && B.Demo.isDemo())) {
          const pos = st.current % 100; // 25 · 50 · 75 · 0(=100)
          const type = { 25: 'esya', 50: 'altin', 75: 'kiyafet', 0: 'nadir' }[pos];
          B.Chest.earn(type);
          const ic = (B.Chest.meta ? B.Chest.meta(type).icon : '🎁');
          if (B.UI && B.UI.toast) B.UI.toast('🔥 ' + st.current + ' DOĞRU SERİ! ' + ic + ' ' + (pos === 0 ? 'Efsanevi' : pos === 75 ? 'Büyük' : pos === 50 ? 'Altın' : '') + ' sandık kazandın!');
          if (B.Anim && B.Anim.confetti) B.Anim.confetti(pos === 0 ? 120 : 70);
        }
      } else st.current = 0;
      B.Bus.emit(B.Events.STREAK_CHANGED, { count: st.current, multiplier: B.Reward.streakMultiplier() });
    },

    /* ---- Günlük çalışma serisi (login değil, HAREKÂT bitirme serisi) ---- */
    dailyBonus() {
      const x = R().xp;
      return Math.min(B.State.data.streaks.dailyDays * x.dailyStreakBonusPerDay, x.dailyStreakBonusMax);
    },

    registerDailyPlay() {
      const st = B.State.data.streaks;
      // YEREL takvim gününü tek tabanda kullan (eski kod yerel gece yarısı + toISOString/UTC
      // karıştırıyordu → UTC+3'te (Türkiye) gün anahtarı 1 gün geri kayıyor, ardışık oynayışta
      // diff=2 çıkıp seri hiç ilerlemiyordu). Şimdi hem anahtar hem diff yerel Y/M/G üzerinden.
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      const todayStr = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      if (st.lastPlayDate === todayStr) return;
      if (st.lastPlayDate) {
        const [y, m, day] = st.lastPlayDate.split('-').map(Number);
        const diff = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(y, m - 1, day)) / 86400000);
        if (diff === 1) st.dailyDays++;
        else if (diff > 1) st.dailyDays = Math.max(0, st.dailyDays - 2); // kırılınca sıfırlama YOK: 2 kademe düşer
      } else st.dailyDays = 1;
      st.lastPlayDate = todayStr;
    },

    /* ---- Altın (para) ---- */
    addCoins(amount, source) {
      if (B.Demo && B.Demo.isDemo()) return 0; // demo: altın kazanılamaz
      const p = B.State.data.player;
      p.coins = (p.coins || 0) + amount;
      B.Bus.emit(B.Events.COINS_CHANGED, { total: p.coins, delta: amount });
      return amount;
    },
    spendCoins(amount) {
      const p = B.State.data.player;
      if ((p.coins || 0) < amount) return false;
      p.coins -= amount;
      B.Bus.emit(B.Events.COINS_CHANGED, { total: p.coins, delta: -amount });
      B.Save.saveSoon();
      return true;
    },

    /* ---- Soru/görev ödül yardımcıları ---- */
    stepXp() { return R().xp.perStep; },
    questionXp(stars) { return R().xp.perQuestionByStars[String(stars)] || 0; },
    missionBonus() { return R().xp.missionBonus; },
    bossXp(tier) { return tier === 'final' ? (R().xp.bossFinal || R().xp.bossUnit * 2) : tier === 'unit' ? R().xp.bossUnit : R().xp.bossTopic; },

    init() {
      // Harekât bittiğinde günlük seri işlenir
      B.Bus.on(B.Events.MISSION_COMPLETED, () => B.Reward.registerDailyPlay());
    },
  };
})(window.BOKUL = window.BOKUL || {});
