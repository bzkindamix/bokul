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
          '<div class="chip">💰 ' + (p.coins || 0) + ' Altın</div>' +
        '</div>' +
        '<div class="evim-doors">' +
          '<button class="btn door door-ben">🧍<br>BEN<small>Tipimi ayarla</small></button>' +
          '<button class="btn door door-dolap">👕<br>DOLAP<small>Kıyafet al · sat · giy</small></button>' +
        '</div>';
      root.appendChild(wrap);

      wrap.querySelector('.door-ben').onclick = () => { B.Audio.play('tick'); B.UI.show('locker', { section: 'ben' }); };
      wrap.querySelector('.door-dolap').onclick = () => { B.Audio.play('tick'); B.UI.show('locker', { section: 'dolap' }); };
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
