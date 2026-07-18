/* BOKUL — Dünya Haritası (Cephe Seçimi)
 * Her ders bir "Cephe" kartıdır. Kart seçilince o ders aktif olur ve
 * bölüm haritası açılır. Yeni ders eklemek = content/lessons/'a JSON eklemek. */
(function (B) {

  B.UI.registerScreen('world', {
    enter(root) {
      const hud = B.UI.buildHud(root, { backTo: 'home' });
      this._hud = hud;

      const title = document.createElement('div');
      title.className = 'map-title';
      title.textContent = '🌌 CEPHE SEÇ — Hangi kristal parçasının peşindesin?';
      root.appendChild(title);

      const list = document.createElement('div');
      list.className = 'world-list';
      root.appendChild(list);

      (B.Lesson.forPlayer() || []).forEach(lesson => {
        // Dersin toplam yıldız / maksimum yıldız hesabı
        let stars = 0, max = 0, bosses = 0, bossesDone = 0;
        lesson.units.forEach(u => u.sections.forEach(s => {
          max += s.missions.length * 3;
          stars += B.State.sectionStars(lesson.id, s.id);
          bosses++;
          if (B.State.sectionProgress(lesson.id, s.id).bossDefeated) bossesDone++;
        }));

        // Matematik cephesi çocuğun sınıfına göre bölümleri açar/ayarlar
        const gradeNote = (lesson.gradeAware && B.State.data.player.grade != null)
          ? '<span class="world-grade">🎓 Senin seviyene ayarlı (' + (B.State.data.player.grade === 0 ? 'okul öncesi' : B.State.data.player.grade + '. sınıfı bitirdin') + ')</span>'
          : '';

        const allowed = B.Perms.lesson(lesson.id);
        const card = document.createElement('button');
        card.className = 'world-card' + (allowed ? '' : ' world-locked');
        card.innerHTML =
          '<span class="world-icon">' + lesson.icon + '</span>' +
          '<span class="world-info"><b>' + lesson.title + '</b>' +
          '<small>' + lesson.subtitle + '</small>' +
          (allowed
            ? '<span class="world-progress">⭐ ' + stars + '/' + max +
              ' · 💠 ' + bossesDone + '/' + bosses + ' kristal</span>' + gradeNote
            : '<span class="world-lock-note">🔒 Bu cephe şu an ebeveyn tarafından kapalı</span>') +
          '</span>' +
          '<span class="world-go">' + (allowed ? '▶' : '🔒') + '</span>';
        card.onclick = () => {
          if (!allowed) { B.Audio.play('wrong'); B.UI.toast('🔒 Bu cepheyi ebeveynin kapatmış.'); return; }
          B.Audio.play('tick');
          B.Lesson.setActive(lesson);
          B.UI.show('map');
        };
        list.appendChild(card);
      });
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
