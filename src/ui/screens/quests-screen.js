/* BOKUL — Görev Panosu (Günün Emirleri)
 * 3 günlük görev; ilerleme barı + biten göreve TOPLA butonu. */
(function (B) {
  B.UI.registerScreen('quests', {
    enter(root) {
      const hud = B.UI.buildHud(root, { backTo: 'home' });
      this._hud = hud;

      const title = document.createElement('div');
      title.className = 'map-title';
      title.textContent = '📋 GÜNÜN EMİRLERİ — Baba Komutan\'dan';
      root.appendChild(title);

      const list = document.createElement('div');
      list.className = 'quest-list';
      root.appendChild(list);

      const note = document.createElement('div');
      note.className = 'quest-note';
      note.textContent = '🥈 Üç emri de tamamla → Gümüş Sandık! Yeni emirler her gün gelir.';
      root.appendChild(note);

      function render() {
        list.innerHTML = '';
        B.Quest.daily().forEach(q => {
          const pct = Math.round(q.progress / q.target * 100);
          const card = document.createElement('div');
          card.className = 'quest-card' + (q.claimed ? ' quest-claimed' : q.done ? ' quest-done' : '');
          card.innerHTML =
            '<div class="quest-top"><b>' + q.text + '</b>' +
              '<span class="quest-reward">+' + q.xp + ' XP · +' + q.coins + ' 💰</span></div>' +
            '<div class="quest-bar"><i style="width:' + pct + '%"></i>' +
              '<span class="quest-count">' + q.progress + '/' + q.target + '</span></div>';
          if (q.claimed) {
            card.insertAdjacentHTML('beforeend', '<div class="quest-status">✓ TOPLANDI</div>');
          } else if (q.done) {
            const btn = document.createElement('button');
            btn.className = 'btn btn-action quest-claim';
            btn.textContent = '🎁 TOPLA';
            btn.onclick = () => {
              const r = B.Quest.claim(q);
              if (r) {
                B.Audio.play('fanfare');
                B.Anim.confetti(30);
                B.UI.toast('+' + r.xp + ' XP · +' + r.coins + ' 💰 toplandı!');
                render();
              }
            };
            card.appendChild(btn);
          }
          list.appendChild(card);
        });
      }
      render();
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
