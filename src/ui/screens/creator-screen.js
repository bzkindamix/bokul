/* BOKUL — Karakter Yaratma Sihirbazı (profil oluşturulduktan sonra)
 * Akış: cinsiyet → yaş & sınıf (müfredat buna göre ayarlanır) → görünüm → sinematik → üs.
 * İsim, giriş ekranındaki kullanıcı adından gelir. */
(function (B) {

  B.UI.registerScreen('creator', {
    enter(root) {
      root.classList.add('creator-root');
      const self = this;

      /* ---- Adım 1: Cinsiyet ---- */
      function stepGender() {
        const kiz = B.Avatar.preset('kiz');
        const erkek = B.Avatar.preset('erkek');
        root.innerHTML =
          '<h2 class="creator-title">🎖️ Merhaba ' + (B.State.data.player.name || 'asker') + '! Karakterini yarat</h2>' +
          '<p class="creator-sub">Önce seç: kimsin sen, asker?</p>' +
          '<div class="gender-row">' +
            '<button class="gender-card" data-g="kiz"><span class="gender-prev">' + B.Avatar.svg(kiz) + '</span><span class="gender-name">KIZ</span></button>' +
            '<button class="gender-card" data-g="erkek"><span class="gender-prev">' + B.Avatar.svg(erkek) + '</span><span class="gender-name">ERKEK</span></button>' +
          '</div>';
        root.querySelectorAll('.gender-card').forEach(c => {
          c.onclick = () => {
            B.Audio.play('correct');
            B.State.data.player.avatar = B.Avatar.preset(c.dataset.g);
            stepAgeGrade();
          };
        });
      }

      /* ---- Adım 2: Yaş & Sınıf (müfredatı belirler) ---- */
      function stepAgeGrade() {
        let age = B.State.data.player.age || 10;
        let grade = B.State.data.player.grade;
        const ages = [];
        for (let i = 5; i <= 14; i++) ages.push(i);
        const grades = [{ v: 0, l: 'Henüz' }, { v: 1, l: '1.' }, { v: 2, l: '2.' }, { v: 3, l: '3.' },
                        { v: 4, l: '4.' }, { v: 5, l: '5.' }, { v: 6, l: '6.' }, { v: 7, l: '7.' }, { v: 8, l: '8.' }];
        function draw() {
          root.innerHTML =
            '<h2 class="creator-title">🎓 Seni tanıyalım</h2>' +
            '<p class="creator-sub">Bu bilgiler dersleri senin seviyene göre ayarlar.</p>' +
            '<div class="ag-q">Kaç yaşındasın?</div>' +
            '<div class="ag-row">' + ages.map(a => '<button class="chip ag-age' + (a === age ? ' ag-on' : '') + '" data-a="' + a + '">' + a + '</button>').join('') + '</div>' +
            '<div class="ag-q">Kaçıncı sınıfı bitirdin?</div>' +
            '<div class="ag-row">' + grades.map(g => '<button class="chip ag-grade' + (g.v === grade ? ' ag-on' : '') + '" data-g="' + g.v + '">' + g.l + '</button>').join('') + '</div>' +
            '<button class="btn btn-action creator-go"' + (grade == null ? ' disabled' : '') + '>DEVAM ▶</button>';
          root.querySelectorAll('.ag-age').forEach(b => b.onclick = () => { age = +b.dataset.a; draw(); });
          root.querySelectorAll('.ag-grade').forEach(b => b.onclick = () => { grade = +b.dataset.g; draw(); });
          const go = root.querySelector('.creator-go');
          go.onclick = () => {
            if (grade == null) return;
            B.State.data.player.age = age;
            B.State.data.player.grade = grade;
            B.Save.saveNow();
            B.Audio.play('tick');
            B.UI.show('locker', { onboarding: true });
          };
        }
        draw();
      }

      stepGender();
    },
    exit() {},
  });
})(window.BOKUL = window.BOKUL || {});
