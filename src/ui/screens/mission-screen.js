/* BOKUL — Harekât Ekranı
 * Tüm harekât tiplerini oynatır: teach / guided / practice / challenge / review.
 * Hedef döngüsü: soru üret → tahtada çöz → yıldız + XP → sonraki hedef → harekât sonu. */
(function (B) {
  const AD = { teach: '🎓 Keşif Brifingi', guided: '🤝 Ortak Harekât', practice: '⚔️ Saha Görevi',
               challenge: '🧠 Yeni Nesil Operasyon', review: '🔄 Devriye' };

  B.UI.registerScreen('mission', {
    enter(root, params) {
      const lesson = B.Lesson.active();
      const mission = B.Lesson.findMission(params.sectionId, params.missionId);
      const sectionObj = (B.Lesson.findSection(params.sectionId) || {}).section || {};
      const itype = sectionObj.interactionType || lesson.interactionType; // bölüm bazlı soru tipi
      const cfg = B.Content.get('config');
      const self = this;

      const hud = B.UI.buildHud(root, {
        backTo: 'map',
        extra: '<div class="chip hud-target"></div><div class="chip hud-streak"></div>',
      });
      this._hud = hud;

      const streakChip = root.querySelector('.hud-streak');
      const targetChip = root.querySelector('.hud-target');
      function refreshStreak() {
        const s = B.State.data.streaks.current;
        const m = B.Reward.streakMultiplier();
        streakChip.textContent = s >= 2 ? ('🔥 Seri x' + s + (m > 1 ? ' → XP ×' + m : '')) : '';
      }
      this._offStreak = B.Bus.on(B.Events.STREAK_CHANGED, refreshStreak);
      refreshStreak();

      const title = document.createElement('div');
      title.className = 'mission-title';
      title.textContent = (AD[mission.type] || mission.type) + ' — ' + mission.title;
      root.appendChild(title);

      const layout = document.createElement('div');
      layout.className = 'mission-layout';
      root.appendChild(layout);

      const leftCol = document.createElement('div');
      leftCol.className = 'mission-left';
      layout.appendChild(leftCol);
      const cmd = B.Commander.mount(leftCol, { compact: true });

      const stage = document.createElement('div');
      stage.className = 'mission-stage';
      layout.appendChild(stage);

      /* ---------- TEACH: senaryo oynatıcı ---------- */
      if (mission.type === 'teach') {
        targetChip.textContent = '🎓 Brifing';
        const scriptSteps = [];
        (mission.segments || []).forEach(seg => {
          const s = (lesson.teachScripts || {})[seg.script];
          if (s) scriptSteps.push(...s);
        });
        cmd.sayFrom('teach.intro');
        this._teach = B.TeachModels.run(stage, scriptSteps, {
          say: t => cmd.say(t),
          onComplete() {
            // Brifing tamam: 3 yıldız sabit + görev XP'si
            finishMission([3]);
          },
        });
        return;
      }

      /* ---------- Soru bazlı tipler ---------- */
      const total = mission.targetCount || 3;
      let qIndex = 0;
      const starList = [];
      let view = null;

      // Review: önceki bölümlerin üreticilerinden karışık havuz
      const reviewGens = mission.source === 'spaced-repetition'
        ? B.Lesson.reviewGenerators(params.sectionId) : null;

      function nextQuestion() {
        if (view) { view.destroy(); view = null; }
        if (qIndex >= total) return finishMission(starList);
        targetChip.textContent = '🎯 Hedef ' + (qIndex + 1) + '/' + total;

        let gen = reviewGens
          ? reviewGens[Math.floor(Math.random() * reviewGens.length)]
          : B.Lesson.resolveGenerator(params.sectionId, mission.generator);
        gen = B.Curriculum.forType(itype, gen); // yaş/sınıfa göre zorluk (uzun bölme)
        const q = B.Question.generate(itype, gen, lesson.skills);
        B.Bus.emit(B.Events.QUESTION_STARTED, { questionId: qIndex, lessonId: lesson.id, type: mission.type });

        // Guided iskelesi: fadeOut ile her soruda bir adım daha oyuncuya bırakılır
        let prefilled = null;
        if (mission.scaffold) {
          let list = mission.scaffold.prefilledSteps || [];
          if (mission.scaffold.fadeOut) list = list.slice(0, Math.max(0, list.length - qIndex));
          if (list.length) prefilled = new Set(list);
        }

        // Challenge: problem metni şablondan
        let problemText = null;
        if (mission.problemTemplates && mission.problemTemplates.length) {
          const t = mission.problemTemplates[Math.floor(Math.random() * mission.problemTemplates.length)];
          problemText = t.replace('{dividend}', q.dividend).replace('{divisor}', q.divisor)
                         .replace('{name}', B.State.data.player.name || 'Komutan');
        }

        cmd.sayFrom(qIndex === 0 ? 'mission.start' : 'mission.next');
        let mistakes = 0;

        view = B.Question.view(itype)(stage, q, {
          prefilled, problemText,
          say: t => cmd.say(t),
          onAnswer(step, correct, attempt) {
            B.Bus.emit(B.Events.STEP_ANSWERED, { stepType: step.type, correct, attempt, value: null });
            if (correct) {
              B.Reward.addXp(B.Reward.stepXp(), 'step');
              if (Math.random() < 0.25) cmd.sayFrom('correct');
            } else mistakes++;
          },
          onComplete() {
            // Yıldız: config eşikleri (0 hata → 3★, ≤2 hata → 2★, üstü → 1★)
            const th = cfg.starThresholds;
            const stars = mistakes <= th.three ? 3 : mistakes <= th.two ? 2 : 1;
            starList.push(stars);
            B.Reward.onQuestionDone(stars === 3);
            B.Reward.addCoins(stars * 2, 'question');
            const xp = B.Reward.addXp(B.Reward.questionXp(stars), 'question', { applyStreak: true });
            B.Bus.emit(B.Events.QUESTION_COMPLETED, { stars, mistakes });
            showStars(stars, xp, () => { qIndex++; nextQuestion(); });
          },
        });
      }

      /* Hedef sonu yıldız töreni */
      function showStars(stars, xp, then) {
        const quip = stars === 3 ? B.Dialogue.pick('correct.streak3') || B.Dialogue.pick('correct')
                                 : B.Dialogue.pick(stars === 2 ? 'correct' : 'wrong.retry');
        B.UI.overlay(
          '<div class="ov-stars">' +
            [1, 2, 3].map(i => '<span class="ov-star' + (i <= stars ? ' lit' : '') + '" style="animation-delay:' + (i * 0.18) + 's">★</span>').join('') +
          '</div><p class="ov-xp">+' + xp + ' XP</p><p class="ov-quote">' + (quip || '') + '</p>',
          [{ label: 'DEVAM ▶', onClick: then }]
        );
      }

      /* Harekât sonu */
      function finishMission(starsArr) {
        const best = starsArr.length ? Math.round(starsArr.reduce((a, b) => a + b, 0) / starsArr.length) : 3;
        const stars = Math.max(1, Math.min(3, best));
        B.Lesson.completeMission(params.sectionId, params.missionId, stars);
        const bonus = B.Reward.addXp(B.Reward.missionBonus(), 'mission');
        const coins = B.Reward.addCoins(10, 'mission');
        B.Bus.emit(B.Events.MISSION_COMPLETED, { missionId: params.missionId, stars, xp: bonus });

        B.UI.overlay(
          '<div class="ov-big">🎖️</div><h2>HAREKÂT TAMAM!</h2>' +
          '<div class="ov-stars">' +
            [1, 2, 3].map(i => '<span class="ov-star' + (i <= stars ? ' lit' : '') + '">★</span>').join('') +
          '</div><p class="ov-xp">Görev bonusu: +' + bonus + ' XP · +' + coins + ' 💰</p>' +
          '<p class="ov-quote">' + (B.Dialogue.pick('mission.done') || '') + '</p>',
          [{ label: 'HARİTAYA DÖN', onClick: () => B.UI.show('map') }]
        );
      }

      nextQuestion();
      this._view = () => view;
    },

    exit() {
      if (this._hud) this._hud.dispose();
      if (this._offStreak) this._offStreak();
      if (this._teach) { this._teach.destroy(); this._teach = null; }
      if (this._view) { const v = this._view(); if (v) v.destroy(); }
    },
  });
})(window.BOKUL = window.BOKUL || {});
