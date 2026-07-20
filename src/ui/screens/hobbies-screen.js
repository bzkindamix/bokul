/* BOKUL — Hobi Kursları Ekranı
 * Gerçek dünyadan bir hobi öğren (kısa quiz) → geçince ilgili blueprint'i (üretim tarifi) KAZAN.
 * Blueprint'in ikinci (öğrenerek açılan) yolu; nadir sandık şansına alternatif.
 * İçerik: content/hobbies.json (course.id = blueprints.json'daki blueprint.hobby ile eşleşir). */
(function (B) {
  B.UI.registerScreen('hobbies', {
    enter(root, params) {
      const data = B.Content.get('hobbies') || { courses: [], passRatio: 0.6 };
      const back = (params && params.back) || 'atolye';
      const hud = B.UI.buildHud(root, { backTo: back });
      this._hud = hud;

      const wrap = document.createElement('div');
      wrap.className = 'hobby-wrap';
      root.appendChild(wrap);

      const done = c => B.Blueprints && B.Blueprints.isLearned(c.blueprint);

      /* ---- Kurs listesi ---- */
      function renderList() {
        wrap.innerHTML =
          '<div class="hobby-head"><h2>🎓 Hobi Kursları</h2>' +
          '<p class="hobby-intro">' + (data.intro || '') + '</p></div>' +
          '<div class="hobby-list"></div>';
        const list = wrap.querySelector('.hobby-list');
        (data.courses || []).forEach(c => {
          const finished = done(c);
          const card = document.createElement('button');
          card.className = 'hobby-card' + (finished ? ' hobby-done' : '');
          card.innerHTML =
            '<span class="hobby-icon">' + c.icon + '</span>' +
            '<span class="hobby-info"><span class="hobby-name">' + c.name + '</span>' +
            '<span class="hobby-reward">🎁 ' + (c.reward || 'Tarif') + '</span></span>' +
            '<span class="hobby-status">' + (finished ? '✓ Öğrenildi' : '▶ Başla') + '</span>';
          card.onclick = () => {
            B.Audio.play('tick');
            if (finished) { B.UI.toast('✓ Bu tarifi zaten öğrendin — Atölye\'de üretebilirsin.'); return; }
            startCourse(c);
          };
          list.appendChild(card);
        });
      }

      /* ---- Kurs quiz'i ---- */
      function startCourse(c) {
        const qs = c.questions || [];
        let idx = 0, correct = 0;

        function draw() {
          if (idx >= qs.length) return finish();
          const q = qs[idx];
          wrap.innerHTML =
            '<div class="hobby-quiz">' +
              '<div class="hobby-quiz-head">' + c.icon + ' ' + c.name +
                '<span class="hobby-q-count">Soru ' + (idx + 1) + '/' + qs.length + '</span></div>' +
              '<div class="hobby-q">' + q.q + '</div>' +
              '<div class="hobby-opts"></div>' +
              '<div class="hobby-fb"></div>' +
            '</div>';
          const opts = wrap.querySelector('.hobby-opts');
          const fb = wrap.querySelector('.hobby-fb');
          q.options.forEach((opt, i) => {
            const b = document.createElement('button');
            b.className = 'hobby-opt';
            b.textContent = opt;
            b.onclick = () => {
              // tek deneme: cevap kesin
              opts.querySelectorAll('.hobby-opt').forEach(x => { x.disabled = true; });
              const right = i === q.correct;
              if (right) { correct++; b.classList.add('hobby-right'); B.Audio.play('correct'); }
              else {
                b.classList.add('hobby-wrong');
                opts.querySelectorAll('.hobby-opt')[q.correct].classList.add('hobby-right');
                B.Audio.play('wrong');
              }
              fb.innerHTML = (right ? '✅ Doğru!' : '❌ Doğru cevap işaretli.') +
                (q.hint ? ' <span class="hobby-hint">💡 ' + q.hint + '</span>' : '');
              const next = document.createElement('button');
              next.className = 'btn btn-action hobby-next';
              next.textContent = (idx + 1 >= qs.length) ? 'BİTİR ▶' : 'DEVAM ▶';
              next.onclick = () => { idx++; draw(); };
              fb.appendChild(next);
            };
            opts.appendChild(b);
          });
        }

        function finish() {
          const ratio = qs.length ? correct / qs.length : 0;
          const passed = ratio >= (data.passRatio || 0.6);
          if (passed) {
            const b = B.Blueprints.grantForHobby(c.id); // tarifi ÖĞRET
            B.Audio.play('fanfare'); if (B.Anim.confetti) B.Anim.confetti(50);
            B.UI.overlay(
              '<div class="ov-big">' + c.icon + '🎓</div><h2>' + c.name + ' — Geçtin!</h2>' +
              '<p class="ov-xp">' + correct + '/' + qs.length + ' doğru</p>' +
              '<p class="ov-quote">' + (b ? '📐 «' + b.name + '» tarifini ÖĞRENDİN! Artık Atölye\'de üretebilirsin.' : 'Bu tarifi zaten biliyordun.') + '</p>',
              [{ label: 'Harika!', onClick: () => renderList() }]
            );
          } else {
            B.Audio.play('wrong');
            B.UI.overlay(
              '<div class="ov-big">📚</div><h2>Az kaldı!</h2>' +
              '<p class="ov-xp">' + correct + '/' + qs.length + ' doğru</p>' +
              '<p class="ov-quote">Geçmek için biraz daha çalış — tekrar dene, bu sefer olacak!</p>',
              [{ label: '🔄 Tekrar dene', onClick: () => startCourse(c) }, { label: 'Sonra', cls: 'btn-quiet', onClick: () => renderList() }]
            );
          }
        }

        draw();
      }

      renderList();
    },

    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
