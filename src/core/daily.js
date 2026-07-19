/* BOKUL — Günlük Ödül (retention motoru, REKLAMSIZ)
 * Her gün giriş yapınca artan ödül; ardışık günlerde seri büyür, gün kaçırılırsa
 * sıfırlanır. 7 günlük döngü. Amaç: çocuğu her gün ekrana geri getirmek — hiçbir
 * zaman reklam izletmeden, sadece öğrenme+oyun döngüsüyle. */
(function (B) {
  const REWARDS = [
    { coins: 20 }, { coins: 30 }, { coins: 40, chest: 'bronze' }, { coins: 50 },
    { coins: 60 }, { coins: 80 }, { coins: 120, chest: 'gold' },
  ];
  function state() { const s = B.State.data; if (!s.daily) s.daily = { lastClaim: '', streak: 0 }; return s.daily; }
  function today() { return new Date().toISOString().slice(0, 10); }
  function yesterday() { return new Date(Date.now() - 86400000).toISOString().slice(0, 10); }

  B.Daily = {
    ensure() { state(); },
    REWARDS,
    canClaim() { return state().lastClaim !== today(); },
    streak() { return state().streak || 0; },
    /* Bu sefer alınırsa seri kaç olacak (görüntü için) */
    nextStreak() { const s = state(); return (s.lastClaim === yesterday()) ? (s.streak || 0) + 1 : 1; },
    /* Bugünkü döngü günü (0..6) */
    todayIndex() { return (B.Daily.nextStreak() - 1) % 7; },

    claim() {
      if (!B.Daily.canClaim()) return { ok: false };
      const s = state();
      s.streak = (s.lastClaim === yesterday()) ? (s.streak || 0) + 1 : 1;
      s.lastClaim = today();
      const idx = (s.streak - 1) % 7;
      const r = REWARDS[idx];
      B.Reward.addCoins(r.coins, 'daily');
      if (r.chest && B.Chest) B.Chest.earn(r.chest);
      B.Save.saveNow();
      return { ok: true, reward: r, streak: s.streak, dayIndex: idx };
    },

    /* Günlük ödül takvimi (7 kutu) — claimable ise "AL" düğmesiyle */
    show() {
      const claimable = B.Daily.canClaim();
      const todayIdx = B.Daily.todayIndex();
      const streakNow = claimable ? B.Daily.nextStreak() - 1 : B.Daily.streak(); // bu döngüde alınmış gün sayısı
      const claimedInCycle = streakNow % 7; // bugünden önce bu döngüde alınanlar
      const tiles = REWARDS.map((r, i) => {
        const isToday = claimable && i === todayIdx;
        const isClaimed = i < claimedInCycle || (!claimable && i <= todayIdx);
        const cls = isToday ? ' day-today' : isClaimed ? ' day-claimed' : ' day-locked';
        return '<div class="daily-day' + cls + '"><span class="dd-n">' + (i + 1) + '. gün</span>' +
          '<span class="dd-r">💰' + r.coins + (r.chest ? ' 🎁' : '') + '</span>' +
          (isClaimed ? '<span class="dd-ok">✓</span>' : '') + '</div>';
      }).join('');
      const body = '<div class="ov-baba">🎁</div><h2>Günlük Ödül</h2>' +
        '<p class="ov-quote">' + (claimable ? '🔥 ' + B.Daily.nextStreak() + '. gün serisi! Ödülünü al ve yarın yine gel.' : '✅ Bugünkü ödülü aldın. Serin: ' + B.Daily.streak() + ' gün. Yarın devam!') + '</p>' +
        '<div class="daily-cal">' + tiles + '</div>';
      const ov = B.UI.overlay(body, claimable
        ? [{ label: '🎁 ÖDÜLÜ AL', onClick: null }]
        : [{ label: 'Kapat', cls: 'btn-quiet', onClick: null }]);
      if (claimable) {
        ov.querySelector('.overlay-btns .btn').onclick = () => {
          const r = B.Daily.claim(); ov.remove();
          if (!r.ok) return;
          B.Audio.play('fanfare'); if (B.Anim.confetti) B.Anim.confetti(50);
          B.UI.toast('🎁 +' + r.reward.coins + ' Altın' + (r.reward.chest ? ' + sandık!' : '') + ' · 🔥 ' + r.streak + '. gün');
        };
      }
      return ov;
    },
  };
})(window.BOKUL = window.BOKUL || {});
