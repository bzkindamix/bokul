/* BOKUL — Harita Ekranı
 * Ünite → bölüm kartları → harekât düğümleri patikası + boss kapısı. */
(function (B) {
  const TYPE_ICON = { teach: '🎓', guided: '🤝', practice: '⚔️', challenge: '🧠', review: '🔄' };

  B.UI.registerScreen('map', {
    enter(root) {
      const lesson = B.Lesson.active();
      const hud = B.UI.buildHud(root, { backTo: 'world' });

      const title = document.createElement('div');
      title.className = 'map-title';
      title.textContent = lesson.icon + ' ' + lesson.title + ' — ' + lesson.subtitle;
      root.appendChild(title);

      const scroll = document.createElement('div');
      scroll.className = 'map-scroll';
      root.appendChild(scroll);

      lesson.units.forEach(unit => {
        const uHead = document.createElement('div');
        uHead.className = 'map-unit';
        uHead.textContent = unit.title;
        scroll.appendChild(uHead);

        unit.sections.forEach(section => {
          const unlocked = B.Lesson.isSectionUnlocked(section.id);
          const gradeLocked = B.Lesson.gradeLocked(section.id);
          const prog = B.State.sectionProgress(lesson.id, section.id);
          const stars = B.State.sectionStars(lesson.id, section.id);
          const maxStars = section.missions.length * 3;

          const card = document.createElement('div');
          card.className = 'map-section' + (unlocked ? '' : ' map-locked');
          card.innerHTML =
            '<div class="map-sec-head"><b>' + section.title + '</b>' +
            '<span class="map-stars">⭐ ' + stars + '/' + maxStars + '</span>' +
            (unlocked ? '' : '<span class="map-lock">🔒</span>') + '</div>' +
            (gradeLocked ? '<div class="map-gradelock">🎓 Bu bölümü ' + section.minGrade + '. sınıfta açacaksın. Şimdilik seviyene uygun bölümlere odaklan!</div>' : '');

          if (unlocked) {
            const path = document.createElement('div');
            path.className = 'map-path';

            section.missions.forEach(m => {
              const done = prog.missions[m.id];
              const open = B.Lesson.isMissionUnlocked(section.id, m.id);
              const node = document.createElement('button');
              node.className = 'map-node' +
                (done ? ' node-done' : open ? ' node-active' : ' node-locked');
              node.innerHTML = (TYPE_ICON[m.type] || '⚔️') +
                (done ? '<small>' + '★'.repeat(done.stars) + '☆'.repeat(3 - done.stars) + '</small>' : '');
              node.title = m.title;
              if (open) node.onclick = () => {
                B.Audio.play('tick');
                B.UI.show('mission', { sectionId: section.id, missionId: m.id });
              };
              path.appendChild(node);
            });

            // Boss düğümü + ustalık kapısı
            const gate = B.Lesson.bossGate(section.id);
            const boss = document.createElement('button');
            const isUnit = section.boss.tier === 'unit';
            boss.className = 'map-node map-boss' + (isUnit ? ' map-uboss' : '') +
              (prog.bossDefeated ? ' node-done' : gate.open ? ' node-active' : ' node-locked');
            boss.innerHTML = section.boss.icon +
              '<small>' + (prog.bossDefeated ? 'FETHEDİLDİ'
                : gate.open ? 'SAVAŞ!'
                : gate.missionsDone ? '⭐ Biraz daha yıldız topla!'
                : 'Harekâtlar sürüyor') + '</small>';
            if (gate.open || prog.bossDefeated) boss.onclick = () => {
              B.Audio.play('tick');
              B.UI.show('boss', { sectionId: section.id });
            };
            path.appendChild(boss);
            card.appendChild(path);
          }
          scroll.appendChild(card);
        });
      });

      // Ünite 2 içerik notu (v0.8'de gelecek bölümler için dürüst ilan)
      if (lesson.comingSoon) {
        const note = document.createElement('div');
        note.className = 'map-soon';
        note.textContent = '🛰️ ' + lesson.comingSoon;
        scroll.appendChild(note);
      }

      this._hud = hud;
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
