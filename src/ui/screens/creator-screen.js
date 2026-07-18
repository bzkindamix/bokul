/* BOKUL — Karakter Yaratma Sihirbazı (profil oluşturulduktan sonra)
 * Akış: cinsiyet seç → görünüm detayları (Ben) → sinematik → üs.
 * İsim, giriş ekranındaki kullanıcı adından gelir. */
(function (B) {

  B.UI.registerScreen('creator', {
    enter(root) {
      root.classList.add('creator-root');
      const kiz = B.Avatar.preset('kiz');
      const erkek = B.Avatar.preset('erkek');
      root.innerHTML =
        '<h2 class="creator-title">🎖️ Merhaba ' + (B.State.data.player.name || 'asker') + '! Karakterini yarat</h2>' +
        '<p class="creator-sub">Önce seç: kimsin sen, asker?</p>' +
        '<div class="gender-row">' +
          '<button class="gender-card" data-g="kiz">' +
            '<span class="gender-prev">' + B.Avatar.svg(kiz) + '</span>' +
            '<span class="gender-name">KIZ</span></button>' +
          '<button class="gender-card" data-g="erkek">' +
            '<span class="gender-prev">' + B.Avatar.svg(erkek) + '</span>' +
            '<span class="gender-name">ERKEK</span></button>' +
        '</div>';
      root.querySelectorAll('.gender-card').forEach(c => {
        c.onclick = () => {
          B.Audio.play('correct');
          B.State.data.player.avatar = B.Avatar.preset(c.dataset.g);
          B.Save.saveNow();
          // Görünüm detayları (Ben bölümü, onboarding modu)
          B.UI.show('locker', { onboarding: true });
        };
      });
    },
    exit() {},
  });
})(window.BOKUL = window.BOKUL || {});
