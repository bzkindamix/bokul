/* BOKUL — Evim (üssümdeki barınak / hub)
 * İki kapı: 🧍 Ben (görünüm/tip) ve 👕 Dolap (kıyafet: al-sat-giy). */
(function (B) {
  B.UI.registerScreen('evim', {
    enter(root) {
      const hud = B.UI.buildHud(root, { backTo: 'home' });
      this._hud = hud;

      const p = B.State.data.player;
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
        '</div>' +
        '<div class="evim-doors">' +
          '<button class="btn door door-ben">🧍<br>BEN<small>Tipimi ayarla</small></button>' +
          '<button class="btn door door-dolap">👕<br>DOLAP<small>Kıyafet al · sat · giy</small></button>' +
          '<button class="btn door door-store">📦<br>DEPOM<small>Eşya al · sakla</small></button>' +
          '<button class="btn door door-pets">🐾<br>EVCİL HAYVANLARIM<small>Sahiplen · bak</small></button>' +
          '<button class="btn door door-int">🎯<br>İLGİ ALANLARIM<small>Sevdiklerim</small></button>' +
        '</div>';
      root.appendChild(wrap);

      const evimTurn = wrap.querySelector('.evim-avatar .avatar-holder');
      if (evimTurn) B.Avatar.turntable(evimTurn); // pseudo-3D döndürme

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
