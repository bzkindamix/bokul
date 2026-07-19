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

      // Baba her 10 sn'de bir yeni bir şey söyler: şaka · bekleyen iş · craft bilgisi
      const babaJokes = [
        'Matematik kitabı neden üzgünmüş? Çünkü çok problemi varmış! 😄',
        'Sıfır sekize ne demiş? "Güzel kemerin varmış!" 🥋',
        'Kalem tıraşa girdi, çıkınca çok keskin bir fikir buldu! ✏️',
        'Bilgisayar neden hasta olmuş? Virüs kapmış tabii! 🦠',
        'İki nokta üst üste gelince ne olur? İki nokta olur, başka ne olacak! 😁',
        'Toplama işlemi neden popülermiş? Herkesi bir araya getiriyormuş! ➕',
      ];
      const craftTips = [
        'Atölye sırrı: 2 cam + 1 vida = cam panel. Küçük parçalar büyük eşyalara dönüşür! 🔨',
        'Balık ister misin? Önce akvaryum craftla: cam panel + filtre + temiz su + çakıl! 🐠',
        'İpi 3 kez birleştirince kumaş olur; kumaşla evini geliştirebilirsin! 🧵',
        'Ürettiğin eşyalarla hem evini hem dep\'onu büyüt — daha çok eşya saklarsın! 🏠',
        'Bir eşya craftlamak için birden çok parça gerekebilir; önce malzeme topla! 🧰',
        'Craft zinciri: küçük craftladığınla yenisini craftlarsın — Arc Raiders gibi! ⚙️',
      ];
      function babaPending() {
        const b = [];
        if (B.Quest && B.Quest.pending && B.Quest.pending()) b.push('Toplamanı bekleyen ' + B.Quest.pending() + ' görev ödülü var! 📋');
        if (B.Daily && B.Daily.canClaim && B.Daily.canClaim()) b.push('Günlük ödülün hazır — al da serin büyüsün! 🎁');
        const pets = (B.Perms.feature('pets') && B.Pets) ? B.Pets.adopted() : [];
        const cap = pets.filter(x => B.Pets.isCaptured(x)).length;
        const needy = pets.filter(x => !B.Pets.isCaptured(x) && (x.tokluk < 50 || x.mutluluk < 50)).length;
        if (cap) b.push(cap + ' dostun ' + B.Pets.villain() + "'a kaçırıldı — kurtar! 😈");
        else if (needy) b.push(needy + ' dostun bakım bekliyor, unutma! 🐾');
        const ch = (B.Chest && B.Chest.queue) ? B.Chest.queue().length : 0;
        if (ch) b.push(ch + ' sandık açılmayı bekliyor! 📦');
        return b.length ? b[Math.floor(Math.random() * b.length)] : 'Bekleyen işin yok — her şey yolunda, aferin asker! ✅';
      }
      let bJ = 0, bC = 0, bR = 0;
      const babaCats = [() => babaJokes[bJ++ % babaJokes.length], () => babaPending(), () => craftTips[bC++ % craftTips.length]];
      this._babaTimer = setInterval(() => {
        if (B.UI.currentScreen() !== 'home') return;
        if (document.querySelector('.overlay')) return; // tur/overlay açıkken bekle
        cmd.say(babaCats[bR++ % babaCats.length]());
      }, 10000);

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
        '<div class="dash-paths">' + (pathRows || '<div class="dash-empty">Cephe bulunamadı.</div>') + '</div>';
      root.appendChild(dash);
      dash.querySelectorAll('.dash-path').forEach(b => b.onclick = () => {
        B.Audio.play('tick');
        const l = lessons.find(x => x.id === b.dataset.lid);
        if (l) { B.Lesson.setActive(l); B.UI.show('map'); }
      });

      // "Seni bekleyenler" — geri gelme kancaları (retention, reklamsız)
      const reasons = [];
      if (B.Daily.canClaim()) reasons.push('🎁 Günlük ödül hazır!');
      const petsList = (B.Perms.feature('pets') && B.Pets ? B.Pets.adopted() : []);
      const captured = petsList.filter(p => B.Pets.isCaptured(p));
      if (captured.length) reasons.push('😈 ' + captured.length + ' dostun ' + B.Pets.villain() + "'a kaçırıldı — kurtar!");
      const needy = petsList.filter(p => !B.Pets.isCaptured(p) && (p.tokluk < 50 || p.mutluluk < 50));
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
      const ic = n => B.Icon ? '<span class="door-ic">' + B.Icon(n) + '</span>' : '';
      doors.innerHTML =
        '<button class="btn door door-main">' + (ic('sword') || '⚔️') + '<br>HAREKÂT</button>' +
        '<button class="btn door door-side door-quests">' + (ic('quests') || '📋') + '<br>GÖREVLER' + badge + '</button>' +
        '<button class="btn door door-side door-evim">' + (ic('home') || '🏠') + '<br>EVİM</button>' +
        '<button class="btn door door-side door-store">' + (ic('shop') || '🏪') + '<br>MAĞAZA</button>';
      root.appendChild(doors);

      // Kilit: demo kısıtı VEYA ebeveyn kilidi → tıklanınca uyarı
      function gate(el, feature, go) {
        if (B.Demo && B.Demo.featureLocked(feature)) {
          el.classList.add('feat-locked');
          el.onclick = () => { B.Audio.play('wrong'); B.UI.toast('🎫 Demo sürüm — davet koduyla açılır.'); };
          return;
        }
        if (B.Perms.feature(feature)) { el.onclick = go; return; }
        el.classList.add('feat-locked');
        el.onclick = () => { B.Audio.play('wrong'); B.UI.toast('🔒 Bu bölümü ebeveynin kapatmış.'); };
      }

      doors.querySelector('.door-main').onclick = () => { B.Audio.play('tick'); B.UI.show('world'); };
      gate(doors.querySelector('.door-evim'), 'shop', () => { B.Audio.play('tick'); B.UI.show('evim'); });
      gate(doors.querySelector('.door-quests'), 'quests', () => { B.Audio.play('tick'); B.UI.show('quests'); });
      gate(doors.querySelector('.door-store'), 'store', () => { B.Audio.play('tick'); B.UI.show('store', { tab: 'shop' }); });

      // Alt araç çubuğu (kompakt tek satır — ekrana sığması için)
      const footer = document.createElement('div');
      footer.className = 'home-footer';
      root.appendChild(footer);

      // Hikâyeyi tekrar izleme
      const replay = document.createElement('button');
      replay.className = 'chip home-story';
      replay.textContent = '🎬 Hikâye';
      gate(replay, 'story', () => B.UI.show('intro', { replay: true }));
      footer.appendChild(replay);

      // Dilek Kutusu (ödül isteği + oyun fikri)
      const wish = document.createElement('button');
      wish.className = 'chip home-wishes';
      const earned = (B.State.data.wishes || []).some(w => w.status === 'earned');
      wish.textContent = '🎁 Dilek' + (earned ? ' 🎉' : '');
      gate(wish, 'wishes', () => B.UI.show('wishes'));
      footer.appendChild(wish);

      const demoMode = B.Demo && B.Demo.isDemo();
      const tourPending = !(B.State.data.meta && B.State.data.meta.homeTourSeen); // ilk oyun: ekran turu

      // Günlük ödül (retention) — demo'da kapalı (ödül vermiyor)
      if (!demoMode) {
        const daily = document.createElement('button');
        daily.className = 'chip home-daily' + (B.Daily.canClaim() ? ' daily-ready' : '');
        daily.textContent = B.Daily.canClaim() ? '🎁 Günlük Ödül!' : '🎁 Seri: ' + B.Daily.streak() + ' gün';
        daily.onclick = () => B.Daily.show();
        footer.appendChild(daily);
      }

      // Demo bilgi + tam sürüme geçiş (davet kodu)
      if (demoMode) {
        const demo = document.createElement('button');
        demo.className = 'chip home-demo';
        demo.textContent = '🎫 Demo — Tam Sürüm İçin Davet Kodu';
        demo.onclick = () => {
          const ov = B.UI.overlay('<div class="ov-big">🎫</div><h2>Tam Sürümü Aç</h2>' +
            '<p class="ov-quote">Ebeveyninin davet kodunu gir; tüm dersler, altın, mağaza ve evcil hayvanlar açılsın!</p>' +
            '<input id="demo-code" class="name-input" maxlength="14" placeholder="Davet kodu" style="text-transform:uppercase">' +
            '<div class="login-err" id="demo-err"></div>',
            [{ label: 'AÇ ▶', onClick: null }, { label: 'Vazgeç', cls: 'btn-quiet', onClick: null }]);
          const btns = ov.querySelectorAll('.overlay-btns .btn');
          btns[0].onclick = () => {
            const v = (ov.querySelector('#demo-code').value || '').trim().toUpperCase();
            if (v.length < 6) { ov.querySelector('#demo-err').textContent = '⚠️ Kod en az 6 karakter.'; return; }
            B.Cloud.setCode(v); ov.remove();
            B.Audio.play('fanfare'); B.UI.toast('🎉 Tam sürüm açıldı! Aileye bağlandın.');
            B.UI.show('home');
          };
          btns[1].onclick = () => ov.remove();
        };
        footer.appendChild(demo);
      }

      // Oyuncu değiştir / çıkış
      const out = document.createElement('button');
      out.className = 'chip home-logout';
      out.textContent = '🚪 Çıkış';
      out.onclick = () => B.Engine.logout();
      footer.appendChild(out);

      // Günlük ödül hazırsa otomatik aç (günde bir; demo/tur değilse)
      if (!demoMode && !tourPending && B.Daily.canClaim()) setTimeout(() => { if (B.UI.currentScreen() === 'home') B.Daily.show(); }, 550);

      // İlk oyun: Baba Komutan çocuğa ekranını tanıtır (profil başına bir kez)
      if (tourPending && B.Tour) {
        B.State.data.meta.homeTourSeen = true; B.Save.saveNow();
        setTimeout(() => { if (B.UI.currentScreen() === 'home') B.Tour.run([
          { icon: '🧑‍✈️', title: 'Hoş geldin asker!', text: 'Ben Baba Komutan. Burası senin ÜSSÜN! Etrafı hızlıca tanıtayım.' },
          { icon: '⚔️', title: 'HAREKÂT', text: 'Buradan derslere girersin. Soruları çözüp yıldız, altın ve XP kazanırsın. Her cephe bir ders!' },
          { icon: '🏠', title: 'EVİM', text: 'Karakterini süsle (kıyafet, saç), eşyalarını Depom\'da sakla, evcil hayvanına bak.' },
          { icon: '🏪', title: 'MAĞAZA', text: 'Kazandığın altınla eşya al; Atölye\'de parçaları birleştirip yeni şeyler ÜRET (craft).' },
          { icon: '🐾', title: 'Evcil Hayvan', text: 'Bir dost sahiplen — ama sakın ihmal etme! Beslemez, oynamazsan Bulanık onu kaçırır. Düzenli bak!' },
          { icon: '🎁', title: 'Her Gün Gel', text: 'Her gün girince günlük ödül kazanır, serin büyür. Hadi göreve başla, Komutan!' },
        ]); }, 450);
      }

      this._hud = hud;
    },
    exit() { if (this._babaTimer) { clearInterval(this._babaTimer); this._babaTimer = null; } if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
