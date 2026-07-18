/* BOKUL — Boss Ekranı
 * Konu Boss'u: can barı var, VURAMAZ (hata sadece kalkan verir).
 * Ünite Boss'u: VURUR — oyuncunun 3 zırh plakası var; yanlış cevap zırh kırar,
 * 3 ardışık doğru 1 zırh onarır; zırh biterse "geri çekilme" (kayıp yok). */
(function (B) {
  B.UI.registerScreen('boss', {
    enter(root, params) {
      const lesson = B.Lesson.active();
      const section = B.Lesson.findSection(params.sectionId).section;
      const boss = section.boss;
      const cfg = B.Content.get('config');
      const isUnit = boss.tier === 'unit';
      const prog = B.State.sectionProgress(lesson.id, params.sectionId);

      const hud = B.UI.buildHud(root, { backTo: 'map' });
      this._hud = hud;

      /* ---- Boss durumu ---- */
      const maxHp = boss.hp;
      let hp = Math.max(1, maxHp - (prog.bossHpCarry || 0)); // geri çekilme taşıması: yorgun başlar
      let shield = 0;                                        // konu boss'u kalkanı
      let armor = isUnit ? (cfg.unitBoss.armor || 3) : 0;    // ünite boss'unda oyuncu zırhı
      let repairStreak = 0;
      let dealt = maxHp - hp;
      let over = false;

      /* ---- Boss başlığı ---- */
      const head = document.createElement('div');
      head.className = 'boss-head' + (isUnit ? ' boss-unit' : '');
      head.innerHTML =
        '<div class="boss-face boss-enter">' +
          (B.SvgArt.boss(boss.id) || '<span class="boss-emoji">' + boss.icon + '</span>') + '</div>' +
        '<div class="boss-info"><div class="boss-name">' + boss.name.toUpperCase() +
        (isUnit ? ' — ⚔️ ÜNİTE BOSS\'U' : ' — KONU BOSS\'U') + '</div>' +
        '<div class="boss-hp"><i></i></div></div>' +
        '<div class="boss-shield"></div>';
      root.appendChild(head);
      const hpFill = head.querySelector('.boss-hp i');
      const shieldEl = head.querySelector('.boss-shield');

      /* ---- Zırh göstergesi (sadece ünite) ---- */
      let armorEl = null;
      if (isUnit) {
        armorEl = document.createElement('div');
        armorEl.className = 'boss-armor';
        root.appendChild(armorEl);
      }

      function refresh() {
        hpFill.style.width = Math.max(0, Math.round(hp / maxHp * 100)) + '%';
        shieldEl.textContent = shield > 0 ? '🛡️ Boss kalkanı!' : '';
        if (armorEl) {
          armorEl.innerHTML = 'ZIRHIN: ' +
            Array.from({ length: cfg.unitBoss.armor }, (_, i) =>
              '<span class="armor-plate' + (i < armor ? '' : ' broken') + '">🛡️</span>').join('') +
            '<small>3 doğru adım = 1 zırh onarımı</small>';
        }
      }
      refresh();

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

      cmd.sayFrom(isUnit ? 'boss.intro.unit' : 'boss.intro.topic', { bossName: boss.name });

      let view = null;
      const self = this;

      function nextQuestion() {
        if (over) return;
        if (view) { view.destroy(); view = null; }
        const q = B.Question.generate(lesson.interactionType,
          B.Lesson.resolveGenerator(params.sectionId, boss.generator), lesson.skills);
        let mistakes = 0;

        view = B.Question.view(lesson.interactionType)(stage, q, {
          say: t => cmd.say(t),
          onAnswer(step, correct, attempt) {
            B.Bus.emit(B.Events.STEP_ANSWERED, { stepType: step.type, correct, attempt, value: null });
            if (correct) {
              // Hasar: kalkan varsa önce kalkan kırılır
              if (shield > 0) { shield--; cmd.sayFrom('boss.shieldBreak'); }
              else {
                const dmg = 3;
                hp -= dmg; dealt += dmg;
                B.Bus.emit(B.Events.BOSS_DAMAGED, { amount: dmg, remaining: hp });
                head.classList.remove('boss-hit'); void head.offsetWidth;
                head.classList.add('boss-hit');
                // Baba düşmanla dalga geçer (bazen)
                if (Math.random() < 0.45) cmd.sayFrom('boss.taunt', { bossName: boss.name });
              }
              // Zırh onarımı
              if (isUnit) {
                repairStreak++;
                if (repairStreak >= (cfg.unitBoss.repairStreak || 3) && armor < cfg.unitBoss.armor) {
                  armor++; repairStreak = 0;
                  cmd.sayFrom('boss.armorRepair');
                }
              }
              refresh();
              if (hp <= 0) return victory();
            } else {
              mistakes++;
              if (isUnit) {
                // ÜNİTE BOSS'U VURUR: yanlış cevabını sana fırlatır
                armor--; repairStreak = 0;
                B.Bus.emit(B.Events.BOSS_ATTACKED, { armorLeft: armor });
                root.classList.remove('boss-quake'); void root.offsetWidth;
                root.classList.add('boss-quake');
                cmd.sayFrom('boss.playerHit', { wrongAnswer: '' });
                refresh();
                if (armor <= 0) return retreat();
              } else {
                shield++;
                cmd.sayFrom('boss.shieldUp');
                refresh();
              }
            }
          },
          onComplete() {
            if (over) return;
            // Hatasız hedef = kritik vuruş bonusu
            if (mistakes === 0 && hp > 0) {
              hp -= 6; dealt += 6;
              B.Bus.emit(B.Events.BOSS_DAMAGED, { amount: 6, remaining: hp });
              cmd.sayFrom('boss.crit');
              refresh();
              if (hp <= 0) return victory();
            }
            setTimeout(nextQuestion, 500);
          },
        });
      }

      function victory() {
        over = true;
        if (view) { view.destroy(); view = null; }
        B.Lesson.defeatBoss(params.sectionId);
        const xp = B.Reward.addXp(B.Reward.bossXp(boss.tier), 'boss');
        const coins = B.Reward.addCoins(isUnit ? 100 : 50, 'boss');
        B.Bus.emit(B.Events.BOSS_DEFEATED, { bossId: boss.id, tier: boss.tier });
        B.UI.overlay(
          '<div class="ov-big">' + boss.icon + '💥</div><h2>' + boss.name.toUpperCase() + ' DEVRİLDİ!</h2>' +
          '<p class="ov-xp">+' + xp + ' XP · +' + coins + ' 💰' + (isUnit ? ' · 🏆 Efsanevi zafer!' : ' · 💎 Epik zafer!') + '</p>' +
          '<p class="ov-crystal">💠 Bir Sayı Kristali parçası daha kurtarıldı!</p>' +
          '<p class="ov-quote">' + (B.Dialogue.pick('boss.win') || '') + '</p>',
          [{ label: 'HARİTAYA DÖN', onClick: () => B.UI.show('map') }]
        );
      }

      function retreat() {
        over = true;
        if (view) { view.destroy(); view = null; }
        // Emek boşa gitmez: verilen hasarın yarısı taşınır (boss yorgun başlar)
        prog.bossHpCarry = Math.round(dealt * (cfg.unitBoss.regroupHpCarry || 0.5));
        B.Bus.emit(B.Events.BOSS_RETREAT, {});
        B.UI.overlay(
          '<div class="ov-big">🏳️</div><h2>GERİ ÇEKİLME!</h2>' +
          '<p class="ov-quote">' + (B.Dialogue.pick('boss.retreat') || 'Yeniden toplan Komutan, kale hâlâ orada!') + '</p>' +
          '<p class="ov-xp">Boss yorgun: bir sonraki denemede ' + prog.bossHpCarry + ' hasarla başlıyorsun.</p>',
          [
            { label: 'TEKRAR SALDIR ⚔️', onClick: () => B.UI.show('boss', { sectionId: params.sectionId }) },
            { label: 'HARİTAYA DÖN', cls: 'btn-quiet', onClick: () => B.UI.show('map') },
          ]
        );
      }

      nextQuestion();
      this._view = () => view;
    },

    exit() {
      if (this._hud) this._hud.dispose();
      if (this._view) { const v = this._view(); if (v) v.destroy(); }
    },
  });
})(window.BOKUL = window.BOKUL || {});
