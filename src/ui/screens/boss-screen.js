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
      const itype = section.interactionType || lesson.interactionType; // bölüm bazlı soru tipi
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
      // Hasar/zırh SORU başına işlenir (adım başına DEĞİL) → uzun bölme (çok adım) ile MC (tek adım)
      // boss'ları eşit adaletli olur: eskiden LD'de tek soruda 3 zırh birden kırılabiliyordu.
      // Tip-bağımsız denge: her boss ~KILL kusursuz soruda düşer (hp'den türetilir).
      const KILL = (cfg.bossQuestionsToKill) || 5;
      const qDmg = Math.max(3, Math.ceil(maxHp / KILL));

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
      const stageWrap = document.createElement('div');
      stageWrap.className = 'mission-stagewrap';
      layout.appendChild(stageWrap);
      const timerHost = document.createElement('div');
      timerHost.className = 'qtimer-host';
      stageWrap.appendChild(timerHost);
      const stage = document.createElement('div');
      stage.className = 'mission-stage';
      stageWrap.appendChild(stage);

      const tcfg = cfg.timer || {};
      const timerSec = tcfg.enabled ? (tcfg[itype] || tcfg.default || 0) : 0;
      let timerCtl = null;

      cmd.sayFrom(isUnit ? 'boss.intro.unit' : 'boss.intro.topic', { bossName: boss.name });

      let view = null;
      const self = this;

      function nextQuestion() {
        if (over) return;
        if (view) { view.destroy(); view = null; }
        if (timerCtl) { timerCtl.stop(); timerCtl = null; }
        const q = B.Question.generate(itype,
          B.Curriculum.forType(itype, B.Lesson.resolveGenerator(params.sectionId, boss.generator)), lesson.skills);
        let mistakes = 0;

        view = B.Question.view(itype)(stage, q, {
          say: t => cmd.say(t),
          // Adımlar yalnız ustalık kaydı + hata sayımı için; HASAR/ZIRH soru sonunda işlenir.
          onAnswer(step, correct, attempt) {
            B.Bus.emit(B.Events.STEP_ANSWERED, { stepType: step.type, correct, attempt, value: null });
            if (!correct) mistakes++;
          },
          onComplete() {
            if (over) return;
            if (timerCtl) { timerCtl.stop(); timerCtl = null; }
            const flawless = mistakes === 0;
            if (flawless) {
              // Kusursuz SORU: kalkan varsa önce kalkanı kır, yoksa tam hasar ver
              if (shield > 0) { shield--; cmd.sayFrom('boss.shieldBreak'); }
              else {
                hp -= qDmg; dealt += qDmg;
                B.Bus.emit(B.Events.BOSS_DAMAGED, { amount: qDmg, remaining: hp });
                head.classList.remove('boss-hit'); void head.offsetWidth;
                head.classList.add('boss-hit');
                if (B.Anim.damageFloat) B.Anim.damageFloat(qDmg, head);
                if (Math.random() < 0.45) cmd.sayFrom('boss.taunt', { bossName: boss.name });
              }
              // Zırh onarımı: ardışık kusursuz SORU (adım değil)
              if (isUnit) {
                repairStreak++;
                if (repairStreak >= (cfg.unitBoss.repairStreak || 3) && armor < cfg.unitBoss.armor) {
                  armor++; repairStreak = 0; cmd.sayFrom('boss.armorRepair');
                }
              }
              refresh();
              if (hp <= 0) return victory();
            } else {
              // Hatalı SORU (soru başına BİR kez): ünite boss vurur (1 plaka), konu boss kalkan kurar
              if (isUnit) {
                armor--; repairStreak = 0;
                B.Bus.emit(B.Events.BOSS_ATTACKED, { armorLeft: armor });
                root.classList.remove('boss-quake'); void root.offsetWidth;
                root.classList.add('boss-quake');
                cmd.sayFrom('boss.playerHit', { wrongAnswer: '' });
                refresh();
                if (armor <= 0) return retreat();
              } else {
                shield++; cmd.sayFrom('boss.shieldUp'); refresh();
              }
            }
            setTimeout(nextQuestion, 500);
          },
        });

        // Süre dolunca: hasarsız, sonraki soruya geç (nazik)
        if (timerSec > 0) timerCtl = B.Timer.create(timerHost, timerSec, () => {
          if (over) return;
          if (view) { view.destroy(); view = null; }
          cmd.sayFrom('timeUp');
          setTimeout(nextQuestion, 400);
        });
      }

      function victory() {
        over = true;
        if (timerCtl) { timerCtl.stop(); timerCtl = null; }
        if (view) { view.destroy(); view = null; }
        // Sandık YALNIZCA ilk yenişte gelir (tekrar oynayınca değil) → grind ile bedava sandık yok
        const firstKill = !B.State.sectionProgress(lesson.id, params.sectionId).bossDefeated;
        B.Lesson.defeatBoss(params.sectionId);
        // Rozet (nişan) kazan — bölüm/ünite tamamlama madalyası
        if (B.Badges && boss.rewards && boss.rewards.badge) {
          B.Badges.grant({ id: boss.rewards.badge, name: boss.name, icon: boss.icon, tier: boss.tier,
            lesson: lesson.title, lessonId: lesson.id, section: section.title });
        }
        const isFinal = boss.tier === 'final';
        // Altın/XP de SADECE ilk yenişte (tekrar boss = ödülsüz alıştırma; sandıklar zaten firstKill'de)
        const xp = firstKill ? B.Reward.addXp(B.Reward.bossXp(boss.tier), 'boss') : 0;
        const coins = firstKill ? B.Reward.addCoins(isFinal ? 250 : isUnit ? 100 : 50, 'boss') : 0;
        // Sandıklar SADECE İLK yenişte + az adet (denge): konu boss'u 1 · ünite boss'u 2 · FINAL 3
        let chestCount = 0;
        if (firstKill && B.Chest && B.Chest.earn && !(B.Demo && B.Demo.isDemo())) {
          const drop = isFinal ? ['nadir', 'kiyafet', 'esya']
                     : isUnit  ? ['nadir', 'kiyafet']
                               : ['nadir'];
          drop.forEach(t => B.Chest.earn(t));
          chestCount = drop.length;
        }
        head.classList.remove('boss-hit', 'boss-enter'); void head.offsetWidth;
        head.classList.add('boss-defeated'); // patlama animasyonu
        B.Bus.emit(B.Events.BOSS_DEFEATED, { bossId: boss.id, tier: boss.tier }); // konfeti + ekran parlaması
        // Zafer kartını biraz geciktir: önce boss'un patlaması + konfeti görünsün
        setTimeout(() => B.UI.overlay(
          '<div class="ov-big">' + boss.icon + '💥</div><h2>' + boss.name.toUpperCase() + ' DEVRİLDİ!</h2>' +
          '<p class="ov-xp">' + (firstKill ? ('+' + xp + ' XP · +' + coins + ' 💰' + (chestCount ? ' · 🎁 ' + chestCount + ' sandık' : '')) : '🔁 Alıştırma — bu boss zaten yenildi (ödül yok)') + (isFinal ? ' · 🐉 DERS USTASI OLDUN!' : isUnit ? ' · 🏆 Efsanevi zafer!' : ' · 💎 Epik zafer!') + '</p>' +
          '<p class="ov-crystal">💠 Bir Sayı Kristali parçası daha kurtarıldı!</p>' +
          '<p class="ov-quote">' + (B.Dialogue.pick('boss.win') || '') + '</p>',
          [{ label: 'HARİTAYA DÖN', onClick: () => B.UI.show('map') }]
        ), 700);
      }

      function retreat() {
        over = true;
        if (timerCtl) { timerCtl.stop(); timerCtl = null; }
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
      this._stopTimer = () => { if (timerCtl) { timerCtl.stop(); timerCtl = null; } };
    },

    exit() {
      if (this._hud) this._hud.dispose();
      if (this._stopTimer) this._stopTimer();
      if (this._view) { const v = this._view(); if (v) v.destroy(); }
    },
  });
})(window.BOKUL = window.BOKUL || {});
