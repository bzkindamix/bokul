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

      // Toplanmayı bekleyen görev sayısı (kapıda rozet)
      const pending = B.Quest.pending();
      const badge = pending ? '<span class="door-badge">' + pending + '</span>' : '';

      const doors = document.createElement('div');
      doors.className = 'home-doors';
      doors.innerHTML =
        '<button class="btn door door-main">⚔️<br>HAREKÂT</button>' +
        '<button class="btn door door-side door-quests">📋<br>GÖREVLER' + badge + '</button>' +
        '<button class="btn door door-side door-evim">🏠<br>EVİM</button>';
      root.appendChild(doors);

      doors.querySelector('.door-main').onclick = () => { B.Audio.play('tick'); B.UI.show('world'); };
      doors.querySelector('.door-evim').onclick = () => { B.Audio.play('tick'); B.UI.show('evim'); };
      doors.querySelector('.door-quests').onclick = () => { B.Audio.play('tick'); B.UI.show('quests'); };

      // Hikâyeyi tekrar izleme
      const replay = document.createElement('button');
      replay.className = 'chip home-story';
      replay.textContent = '🎬 Hikâyeyi izle';
      replay.onclick = () => B.UI.show('intro', { replay: true });
      root.appendChild(replay);

      // Oyuncu değiştir / çıkış
      const out = document.createElement('button');
      out.className = 'chip home-logout';
      out.textContent = '🚪 Çıkış';
      out.onclick = () => B.Engine.logout();
      root.appendChild(out);

      this._hud = hud;
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
