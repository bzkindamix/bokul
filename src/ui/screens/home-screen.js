/* BOKUL — Üs Ekranı (ana ekran) */
(function (B) {
  B.UI.registerScreen('home', {
    enter(root) {
      const hud = B.UI.buildHud(root, {});

      const mid = document.createElement('div');
      mid.className = 'home-mid';
      root.appendChild(mid);
      const cmd = B.Commander.mount(mid);

      const today = new Date().toISOString().slice(0, 10);
      const first = B.State.data.streaks.lastPlayDate !== today;
      cmd.sayFrom(first ? 'greeting.firstOfDay' : 'greeting');

      // Bekleyen sandık: sallanan buton (dopamin kancası)
      const q = B.Chest.queue();
      if (q.length) {
        const c = document.createElement('button');
        c.className = 'chest-float';
        c.innerHTML = '🎁<small>' + q.length + ' sandık!</small>';
        c.onclick = () => B.ChestUI.openCeremony(() => B.UI.show('home'));
        root.appendChild(c);
      }

      // ---- Baba'nın Panosu (dashboard): durum + öğrenme yolları + şaka ----
      const p = B.State.data.player;
      const st = B.State.data.stats || {};
      const rank = B.Reward.rankFor(p.level);
      const lessons = (B.Lesson.forPlayer() || []).filter(l => B.Perms.lesson(l.id));
      const pathRows = lessons.map(l => {
        let stars = 0, max = 0, bosses = 0, done = 0;
        l.units.forEach(u => u.sections.forEach(s => {
          max += s.missions.length * 3; stars += B.State.sectionStars(l.id, s.id);
          bosses++; if (B.State.sectionProgress(l.id, s.id).bossDefeated) done++;
        }));
        const pct = max ? Math.round(stars / max * 100) : 0;
        return '<button class="dash-path" data-lid="' + l.id + '">' +
          '<span class="dash-picon">' + l.icon + '</span>' +
          '<span class="dash-pinfo"><b>' + l.title + '</b>' +
            '<span class="dash-bar"><i style="width:' + pct + '%"></i></span>' +
            '<small>⭐ ' + stars + '/' + max + ' · 💠 ' + done + '/' + bosses + '</small></span>' +
          '<span class="dash-pgo">▶</span></button>';
      }).join('');
      const jokes = [
        'Matematik kitabı neden üzgünmüş? Çünkü çok problemi varmış! 😄',
        'Sıfır sekize ne demiş? "Güzel kemerin varmış!" 🥋',
        'Kalem tıraşına girdi, çıkınca çok keskin bir fikir buldu! ✏️',
        'Bilgisayar neden hasta olmuş? Virüs kapmış tabii! 🦠',
        'İki nokta üst üste gelince ne olur? İki nokta olur, başka ne olacak! 😁',
      ];
      const joke = jokes[(p.level + (st.questionsDone || 0)) % jokes.length];

      const dash = document.createElement('div');
      dash.className = 'home-dash';
      dash.innerHTML =
        '<div class="dash-stats">' +
          '<span class="dash-stat">' + rank.icon + ' ' + rank.title + '</span>' +
          '<span class="dash-stat">🎖️ Sv.' + p.level + '</span>' +
          '<span class="dash-stat">💰 ' + (p.coins || 0) + '</span>' +
          '<span class="dash-stat">🔥 Seri ' + (B.State.data.streaks.current || 0) + '</span>' +
          '<span class="dash-stat">✅ ' + (st.questionsDone || 0) + ' soru</span>' +
        '</div>' +
        '<div class="dash-title">🗺️ Öğrenme Yolların</div>' +
        '<div class="dash-paths">' + (pathRows || '<div class="dash-empty">Cephe bulunamadı.</div>') + '</div>' +
        '<div class="dash-joke">🧑‍✈️ <b>Baba:</b> ' + joke + '</div>';
      root.appendChild(dash);
      dash.querySelectorAll('.dash-path').forEach(b => b.onclick = () => {
        B.Audio.play('tick');
        const l = lessons.find(x => x.id === b.dataset.lid);
        if (l) { B.Lesson.setActive(l); B.UI.show('map'); }
      });

      // "Seni bekleyenler" — geri gelme kancaları (retention, reklamsız)
      const reasons = [];
      if (B.Daily.canClaim()) reasons.push('🎁 Günlük ödül hazır!');
      const needy = (B.Perms.feature('pets') && B.Pets ? B.Pets.adopted() : []).filter(p => p.tokluk < 50 || p.mutluluk < 50);
      if (needy.length) reasons.push('🐾 ' + needy.length + ' dostun bakım istiyor');
      const chq = B.Chest.queue ? B.Chest.queue().length : 0;
      if (chq) reasons.push('📦 ' + chq + ' sandık seni bekliyor');
      if (reasons.length) {
        const rz = document.createElement('div');
        rz.className = 'home-reasons';
        rz.innerHTML = reasons.map(r => '<span class="reason-chip">' + r + '</span>').join('');
        root.appendChild(rz);
      }

      // Toplanmayı bekleyen görev sayısı (kapıda rozet)
      const pending = B.Quest.pending();
      const badge = pending ? '<span class="door-badge">' + pending + '</span>' : '';

      const doors = document.createElement('div');
      doors.className = 'home-doors';
      doors.innerHTML =
        '<button class="btn door door-main">⚔️<br>HAREKÂT</button>' +
        '<button class="btn door door-side door-quests">📋<br>GÖREVLER' + badge + '</button>' +
        '<button class="btn door door-side door-evim">🏠<br>EVİM</button>' +
        '<button class="btn door door-side door-store">🏪<br>MAĞAZA</button>';
      root.appendChild(doors);

      // Ebeveyn kilidi: engelli özellikler tıklanınca uyarı verir
      function gate(el, feature, go) {
        if (B.Perms.feature(feature)) { el.onclick = go; return; }
        el.classList.add('feat-locked');
        el.onclick = () => { B.Audio.play('wrong'); B.UI.toast('🔒 Bu bölümü ebeveynin kapatmış.'); };
      }

      doors.querySelector('.door-main').onclick = () => { B.Audio.play('tick'); B.UI.show('world'); };
      gate(doors.querySelector('.door-evim'), 'shop', () => { B.Audio.play('tick'); B.UI.show('evim'); });
      gate(doors.querySelector('.door-quests'), 'quests', () => { B.Audio.play('tick'); B.UI.show('quests'); });
      gate(doors.querySelector('.door-store'), 'store', () => { B.Audio.play('tick'); B.UI.show('store', { tab: 'shop' }); });

      // Hikâyeyi tekrar izleme
      const replay = document.createElement('button');
      replay.className = 'chip home-story';
      replay.textContent = '🎬 Hikâyeyi izle';
      gate(replay, 'story', () => B.UI.show('intro', { replay: true }));
      root.appendChild(replay);

      // Dilek Kutusu (ödül isteği + oyun fikri)
      const wish = document.createElement('button');
      wish.className = 'chip home-wishes';
      const earned = (B.State.data.wishes || []).some(w => w.status === 'earned');
      wish.textContent = '🎁 Dilek Kutusu' + (earned ? ' 🎉' : '');
      gate(wish, 'wishes', () => B.UI.show('wishes'));
      root.appendChild(wish);

      // Günlük ödül (retention)
      const daily = document.createElement('button');
      daily.className = 'chip home-daily' + (B.Daily.canClaim() ? ' daily-ready' : '');
      daily.textContent = B.Daily.canClaim() ? '🎁 Günlük Ödül!' : '🎁 Seri: ' + B.Daily.streak() + ' gün';
      daily.onclick = () => B.Daily.show();
      root.appendChild(daily);

      // Oyuncu değiştir / çıkış
      const out = document.createElement('button');
      out.className = 'chip home-logout';
      out.textContent = '🚪 Çıkış';
      out.onclick = () => B.Engine.logout();
      root.appendChild(out);

      // Günlük ödül hazırsa otomatik aç (günde bir; ekran korunuyorsa)
      if (B.Daily.canClaim()) setTimeout(() => { if (B.UI.currentScreen() === 'home') B.Daily.show(); }, 550);

      this._hud = hud;
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
