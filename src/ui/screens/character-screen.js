/* BOKUL — Karakterim (kimlik kartı + istatistik + rozet koleksiyonu) */
(function (B) {
  B.UI.registerScreen('character', {
    enter(root) {
      const hud = B.UI.buildHud(root, { backTo: 'evim' });
      this._hud = hud;

      const p = B.State.data.player;
      const st = B.State.data.stats || {};
      const rank = B.Reward.rankFor(p.level);
      const xpNeed = B.Reward.xpNeeded ? B.Reward.xpNeeded() : 100;
      const xpPct = Math.min(100, Math.round((p.xp || 0) / xpNeed * 100));

      // İstatistikler
      let stars = 0, bosses = 0, bossWon = 0;
      (B.Lesson.forPlayer() || []).forEach(l => l.units.forEach(u => u.sections.forEach(s => {
        stars += B.State.sectionStars(l.id, s.id);
        if (s.boss) { bosses++; if (B.State.sectionProgress(l.id, s.id).bossDefeated) bossWon++; }
      })));

      // Rozet kataloğu (kazanılmış/kilitli)
      const cat = B.Badges ? B.Badges.catalog() : [];
      const bStats = B.Badges ? B.Badges.stats() : { earned: 0, total: 0 };
      const badgeCards = cat.map(b => {
        const got = B.Badges.earned(b);
        const tierCls = b.tier === 'unit' ? ' badge-unit' : '';
        return '<div class="badge-card' + (got ? ' badge-got' + tierCls : ' badge-locked') + '">' +
          '<span class="badge-ic">' + (got ? b.icon : '🔒') + '</span>' +
          '<span class="badge-nm">' + (got ? b.name : '???') + '</span>' +
          '<span class="badge-sub">' + (got ? '🏆 ' + b.lesson : b.lesson + ' · ' + b.section) + '</span>' +
        '</div>';
      }).join('');

      const wrap = document.createElement('div');
      wrap.className = 'char-wrap';
      wrap.innerHTML =
        '<div class="char-card">' +
          '<div class="char-av">' + B.Avatar.el(p.avatar, 'avatar-big') + '</div>' +
          '<div class="char-info">' +
            '<div class="char-name">' + (p.name || 'Asker') + '</div>' +
            '<div class="char-rank">' + rank.icon + ' ' + rank.title + '</div>' +
            '<div class="char-xp"><span class="char-lvl">Seviye ' + p.level + '</span>' +
              '<div class="char-xpbar"><i style="width:' + xpPct + '%"></i></div></div>' +
            '<div class="char-stats">' +
              '<span class="chip">⭐ ' + stars + ' yıldız</span>' +
              '<span class="chip">💠 ' + bossWon + '/' + bosses + ' boss</span>' +
              '<span class="chip">✅ ' + (st.questionsDone || 0) + ' soru</span>' +
              '<span class="chip">💰 ' + (p.coins || 0) + '</span>' +
              '<span class="chip">🔥 ' + (B.State.data.streaks.current || 0) + ' seri</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="char-badges-head">🎖️ Rozet Koleksiyonu <span class="char-badges-count">' + bStats.earned + ' / ' + bStats.total + '</span></div>' +
        (cat.length
          ? '<div class="badge-grid">' + badgeCards + '</div>'
          : '<div class="dash-empty">Henüz cephe yok. Harekâta çık, boss yen, rozet kazan!</div>') +
        '<div class="char-hint">🏆 Her cephe boss\'unu yenince o cephenin rozetini kazanırsın. Hepsini topla asker!</div>';
      root.appendChild(wrap);

      const turnH = wrap.querySelector('.char-av .avatar-holder');
      if (turnH && B.Avatar.turntable) B.Avatar.turntable(turnH);
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
