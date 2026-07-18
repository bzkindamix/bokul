/* BOKUL — Karakter Yaratma Sihirbazı (oyunun İLK adımı)
 * Akış: 1) Cinsiyet seç → 2) İsmini yaz → 3) Dolap'ta görünümü detaylandır
 * Sonrasında giriş sinematiği oynar ve üsse girilir. */
(function (B) {

  B.UI.registerScreen('creator', {
    enter(root) {
      root.classList.add('creator-root');

      /* ---- Adım 1: Cinsiyet ---- */
      function stepGender() {
        const kiz = B.Avatar.preset('kiz');
        const erkek = B.Avatar.preset('erkek');
        root.innerHTML =
          '<h2 class="creator-title">🎖️ Karakterini Yarat</h2>' +
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
            stepName();
          };
        });
      }

      /* ---- Adım 2: İsim ---- */
      function stepName() {
        root.innerHTML =
          '<h2 class="creator-title">' + B.Avatar.el(B.State.data.player.avatar, 'creator-mini') + '</h2>' +
          '<p class="creator-sub">Peki adın ne?</p>' +
          '<input id="creator-name" class="name-input creator-name" maxlength="14" placeholder="Adını yaz...">' +
          '<button class="btn btn-action creator-go">DEVAM ▶</button>';
        const input = root.querySelector('#creator-name');
        setTimeout(() => input.focus(), 100);
        root.querySelector('.creator-go').onclick = () => {
          const nm = (input.value || '').trim() || 'Asker';
          B.State.data.player.name = nm;
          B.Save.settings.set({ playerName: nm });
          B.Save.saveNow();
          B.Audio.play('tick');
          // Adım 3: görünüm detayları (Dolap, onboarding modu)
          B.UI.show('locker', { onboarding: true });
        };
      }

      stepGender();
    },
    exit() {},
  });
})(window.BOKUL = window.BOKUL || {});
