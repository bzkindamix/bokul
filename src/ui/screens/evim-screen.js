/* BOKUL — Evim (üssümdeki barınak / hub)
 * İki kapı: 🧍 Ben (görünüm/tip) ve 👕 Dolap (kıyafet: al-sat-giy). */
(function (B) {
  B.UI.registerScreen('evim', {
    enter(root) {
      const hud = B.UI.buildHud(root, { backTo: 'home' });
      this._hud = hud;

      const p = B.State.data.player;

      // Evcil hayvan eşlikçileri (Evim'de görsel bağ + bakım hatırlatma)
      const petsOn = B.Perms.feature('pets') && !(B.Demo && B.Demo.featureLocked('pets'));
      const myPets = (petsOn && B.Pets) ? B.Pets.adopted() : [];
      const needy = myPets.filter(pt => B.Pets.isCaptured(pt) || (pt.tokluk || 0) < 50 || (pt.mutluluk || 0) < 50);
      const petBadge = needy.length ? '<span class="door-badge pet-need">' + needy.length + '</span>' : '';
      const compHtml = myPets.length ? ('<div class="evim-pets">' + myPets.map(pt => {
        const d = B.Pets.typeDef(pt.type) || { icon: '🐾', name: 'Dost' };
        const cap = B.Pets.isCaptured(pt);
        const care = cap || (pt.tokluk || 0) < 50 || (pt.mutluluk || 0) < 50;
        return '<button class="evim-pet' + (cap ? ' pet-cap' : (care ? ' pet-care' : '')) + '" data-uid="' + pt.uid + '">' +
          '<span class="ep-ico">' + d.icon + '</span>' +
          '<span class="ep-mood">' + B.Pets.mood(pt) + '</span>' +
          '<span class="ep-name">' + (pt.name || d.name) + '</span>' +
          (care ? '<span class="ep-flag">' + (cap ? '😈' : '🐾') + '</span>' : '') +
        '</button>';
      }).join('') + '</div>') : '';

      const wrap = document.createElement('div');
      wrap.className = 'evim-wrap';
      wrap.innerHTML =
        '<div class="evim-hero">' +
          '<div class="evim-avatar">' + B.Avatar.el(p.avatar, 'avatar-big') + '</div>' +
          '<div class="evim-name">' + (p.name || 'Asker') + '\'in Evi 🏠</div>' +
          '<div class="evim-levels">' +
            '<span class="chip">💰 ' + (p.coins || 0) + '</span>' +
            '<span class="chip">🏠 Ev Sv.' + (p.homeLevel || 1) + '</span>' +
            '<span class="chip">📦 Depo Sv.' + (p.depoLevel || 1) + '</span>' +
          '</div>' +
          compHtml +
        '</div>' +
        '<div class="evim-doors">' +
          '<button class="btn door door-char"><span class="door-ico">🎖️</span><span class="door-tt">KARAKTERİM</span><small>Kimlik · rozetler · istatistik</small></button>' +
          '<button class="btn door door-ben"><span class="door-ico">🧍</span><span class="door-tt">BEN</span><small>Tipimi ayarla</small></button>' +
          '<button class="btn door door-dolap"><span class="door-ico">👕</span><span class="door-tt">DOLAP</span><small>Kıyafet al · sat · giy</small></button>' +
          '<button class="btn door door-room"><span class="door-ico">🛋️</span><span class="door-tt">ODAM</span><small>Eşya yerleştir · süsle</small></button>' +
          '<button class="btn door door-store"><span class="door-ico">📦</span><span class="door-tt">DEPOM</span><small>Eşya al · sakla</small></button>' +
          '<button class="btn door door-atolye"><span class="door-ico">🔨</span><span class="door-tt">ATÖLYE</span><small>Depodan eşya üret</small></button>' +
          '<button class="btn door door-pets">' + petBadge + '<span class="door-ico">🐾</span><span class="door-tt">EVCİL HAYVANLARIM</span><small>' + (needy.length ? '🐾 ' + needy.length + ' dost bakım bekliyor' : 'Sahiplen · bak') + '</small></button>' +
          '<button class="btn door door-int"><span class="door-ico">🎯</span><span class="door-tt">İLGİ ALANLARIM</span><small>Sevdiklerim</small></button>' +
        '</div>';
      root.appendChild(wrap);

      // Eşlikçiye tıkla → evcil hayvan ekranı
      wrap.querySelectorAll('.evim-pet').forEach(b => b.onclick = () => { B.Audio.play('tick'); B.UI.show('pets', {}); });

      const evimTurn = wrap.querySelector('.evim-avatar .avatar-holder');
      if (evimTurn) B.Avatar.turntable(evimTurn); // pseudo-3D döndürme

      wrap.querySelector('.door-char').onclick = () => { B.Audio.play('tick'); B.UI.show('character'); };
      evimGate(wrap.querySelector('.door-room'), 'shop', () => { B.Audio.play('tick'); B.UI.show('room'); });
      evimGate(wrap.querySelector('.door-atolye'), 'shop', () => { B.Audio.play('tick'); B.UI.show('atolye'); });
      wrap.querySelector('.door-ben').onclick = () => { B.Audio.play('tick'); B.UI.show('locker', { section: 'ben' }); };
      wrap.querySelector('.door-dolap').onclick = () => { B.Audio.play('tick'); B.UI.show('locker', { section: 'dolap' }); };
      function evimGate(el, feature, go) {
        if (B.Demo && B.Demo.featureLocked(feature)) {
          el.classList.add('feat-locked');
          el.onclick = () => { B.Audio.play('wrong'); B.UI.toast('🎫 Demo sürüm — davet koduyla açılır.'); };
          return;
        }
        if (B.Perms.feature(feature)) { el.onclick = go; return; }
        el.classList.add('feat-locked');
        el.onclick = () => { B.Audio.play('wrong'); B.UI.toast('🔒 Bu bölümü ebeveynin kapatmış.'); };
      }
      evimGate(wrap.querySelector('.door-store'), 'store', () => { B.Audio.play('tick'); B.UI.show('store', { tab: 'depo' }); });
      evimGate(wrap.querySelector('.door-pets'), 'pets', () => { B.Audio.play('tick'); B.UI.show('pets', {}); });
      wrap.querySelector('.door-int').onclick = () => { B.Audio.play('tick'); B.UI.show('interests', {}); };
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
