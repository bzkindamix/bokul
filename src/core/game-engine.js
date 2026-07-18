/* BOKUL — GameEngine
 * Başlatma sırasının tek sahibi: kayıt → içerik → motorlar → arayüz. */
(function (B) {
  B.Engine = {
    async boot() {
      // 1) İçerik paketleri (kayıt YÜKLENMEZ — önce profil seçilir)
      const LESSONS = [
        'lessons/math-5-division',
        'lessons/ai-101',
        'lessons/care-101',
        'lessons/philo-101',
      ];
      await B.Content.loadAll(['config', 'dialogues', 'rewards', 'story', 'quests', ...LESSONS]);
      LESSONS.forEach(l => B.Lesson.register(B.Content.get(l)));
      B.Lesson.setActive(B.Content.get('lessons/math-5-division'));

      // 2) Motor başlatmaları (olay dinleyicileri bağlanır)
      B.Save.init();
      B.Audio.init();
      B.Progress.init();
      B.Reward.init();
      B.Chest.init();
      B.Quest.init();
      B.Anim.init();
      B.Commander.init();
      B.UI.init();
    },

    /* Splash'tan giriş: hatırlanan profil varsa devam, yoksa giriş ekranı */
    start() {
      B.Audio.unlock();
      const rem = B.Auth.remembered();
      if (rem && B.Auth.resume(rem)) return B.Engine.enterAs();
      B.UI.show('login');
    },

    /* Profil seçildikten sonra: kaydı yükle ve doğru ekrana yönlendir */
    enterAs() {
      const loaded = B.Save.load();
      // İlk profil + v0.10 öncesi tek kayıt varsa eski ilerlemeyi taşı
      if (!loaded && B.Save.hasLegacy() && B.Auth.users().length === 1) {
        B.Save.legacyImport();
        B.Save.saveNow();
      }
      // Sürüm uyumu: eksik alanları tamamla
      const p = B.State.data.player;
      if (p.coins == null) p.coins = 0;
      p.avatar = B.Avatar.normalize(p.avatar);
      if (!B.State.data.quests) B.State.data.quests = { daily: [], weekly: [], lastDailyReset: '', lastWeeklyReset: '' };

      // Yeni profil (henüz karakteri yok) → kullanıcı adını varsayılan yap, karakter yaratmaya git
      if (!p.name) {
        p.name = B.Auth.displayName();
        B.Save.saveNow();
        return B.UI.show('creator', {});
      }
      if (!B.State.data.meta.introSeen) return B.UI.show('intro', {});
      B.UI.show('home');
    },

    /* Sinematik bitince üsse geç */
    afterIntro() {
      B.State.data.meta.introSeen = true;
      B.Save.saveNow();
      B.UI.show('home');
    },

    /* Oyuncu değiştir / çıkış */
    logout() {
      B.Save.saveNow();
      B.Auth.logout();
      B.UI.show('login');
    },
  };
})(window.BOKUL = window.BOKUL || {});
