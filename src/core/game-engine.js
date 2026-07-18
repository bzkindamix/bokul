/* BOKUL — GameEngine
 * Başlatma sırasının tek sahibi: kayıt → içerik → motorlar → arayüz. */
(function (B) {
  B.Engine = {
    async boot() {
      // 1) Kayıt
      B.Save.load();

      // 2) İçerik paketleri
      await B.Content.loadAll([
        'config', 'dialogues', 'rewards',
        'lessons/math-5-division',
      ]);
      B.Lesson.setActive(B.Content.get('lessons/math-5-division'));

      // 3) Eski kayıtları yeni alanlarla tamamla (v0.6 → v0.7 uyumu)
      const p = B.State.data.player;
      if (p.coins == null) p.coins = 0;
      p.avatar = B.Avatar.normalize(p.avatar);

      // 4) Motor başlatmaları (olay dinleyicileri bağlanır)
      B.Save.init();
      B.Audio.init();
      B.Progress.init();
      B.Reward.init();
      B.Chest.init();
      B.Anim.init();
      B.Commander.init();
      B.UI.init();
    },

    /* Splash'tan oyuna giriş (ilk dokunuş ses kilidini de açar) */
    start() {
      B.Audio.unlock();
      const name = (B.Save.settings.get().playerName || B.State.data.player.name || '').trim();
      if (!name) return B.Engine.askName();
      B.State.data.player.name = name;
      B.UI.show('home');
    },

    /* İlk açılış: kendini tanıt → avatarını oluştur → üsse gir */
    askName() {
      const ov = B.UI.overlay(
        '<div class="ov-big">🫡</div><h2>Üsse yeni asker geldi!</h2>' +
        '<p class="ov-quote">Kendini tanıt: adın ne?</p>' +
        '<input id="name-input" class="name-input" maxlength="14" placeholder="Adını yaz...">',
        [{
          label: 'DEVAM ▶',
          onClick: () => {
            const v = (document.getElementById('name-input') || {}).value || '';
            const nm = v.trim() || 'Asker';
            B.State.data.player.name = nm;
            B.Save.settings.set({ playerName: nm });
            B.Save.saveNow();
            // İsimden sonra avatar oluşturma (Dolap, onboarding modu)
            B.UI.show('locker', { onboarding: true });
          },
        }]
      );
      setTimeout(() => { const i = ov.querySelector('#name-input'); if (i) i.focus(); }, 100);
    },
  };
})(window.BOKUL = window.BOKUL || {});
