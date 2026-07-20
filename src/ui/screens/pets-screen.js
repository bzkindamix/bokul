/* BOKUL — Evcil Hayvanlarım
 * Sahiplenilen hayvanları bakım (besle/oynat/gezdir...) ile mutlu tut;
 * ön koşulları tamamlanan yeni türleri sahiplen. */
(function (B) {
  B.UI.registerScreen('pets', {
    enter(root) {
      const hud = B.UI.buildHud(root, { backTo: 'evim' });
      this._hud = hud;
      B.Pets.ensure();

      const wrap = document.createElement('div');
      wrap.className = 'pets-wrap';
      root.appendChild(wrap);

      // Baba ilk ziyaret açıklaması (bir kez)
      const seen = B.Save.settings.get();
      if (!seen.tut_pets) {
        B.Save.settings.set({ tut_pets: true });
        B.UI.overlay('<div class="ov-baba">🐾</div><h2>Baba Komutan</h2><p class="ov-quote">' + B.Pets.intro() + '</p>', [{ label: 'Anlaşıldı!', onClick: null }]);
      }

      function bar(label, val, cls) {
        return '<div class="pet-stat"><span>' + label + '</span><div class="pet-bar ' + cls + '"><i style="width:' + val + '%"></i></div></div>';
      }

      function render() {
        const pets = B.Pets.adopted();
        let html = '<div class="pets-title">🐾 Evcil Hayvanlarım</div>';

        if (!pets.length) {
          html += '<div class="pets-empty">Henüz evcil hayvanın yok. Aşağıdan ön koşulları tamamla ve ilkini sahiplen!</div>';
        } else {
          html += '<div class="pets-list">' + pets.map(p => {
            const def = B.Pets.typeDef(p.type) || { icon: '🐾', care: [] };
            const cap = B.Pets.isCaptured(p);
            const care = (def.care || []).map(a => {
              const left = B.Pets.cooldownLeft(p, a);
              const cd = left > 0 ? ' disabled' : '';
              const lbl = left > 0 ? Math.ceil(left / 3600000) + ' sa' : (cap ? '🦸 ' + a.label : a.label);
              return '<button class="btn pet-care' + cd + '" data-uid="' + p.uid + '" data-act="' + a.id + '"' + cd + '>' + a.icon + ' ' + lbl + '</button>';
            }).join('');
            return '<div class="pet-card' + (cap ? ' pet-captured' : '') + '">' +
              '<div class="pet-head"><span class="pet-face">' + def.icon + '</span>' +
                '<div class="pet-id"><b>' + esc(p.name) + '</b><span class="pet-mood">' + B.Pets.mood(p) + '</span></div></div>' +
              (cap ? '<div class="pet-capmsg">😈 <b>' + B.Pets.villain() + '</b> ' + esc(p.name) + '\'i kaçırdı! Besleyip mutlu ederek KURTAR (tokluk + mutluluk ortalaması 50\'ye ulaşınca geri döner).</div>' : '') +
              bar('🍖 Tokluk', p.tokluk, 'b-tok') + bar('❤️ Mutluluk', p.mutluluk, 'b-mut') +
              '<div class="pet-actions">' + care + '</div></div>';
          }).join('') + '</div>';
        }

        // Sahiplenilebilir türler
        html += '<div class="pets-title pets-title2">🏠 Yeni Dost Sahiplen</div>';
        html += '<div class="adopt-list">' + B.Pets.types().map(def => {
          const owned = B.Pets.hasType(def.id);
          const miss = B.Pets.missingPrereq(def.id);
          const ready = !owned && miss.length === 0;
          const prereqRows = (def.prereq || []).map(r => {
            const it = B.Items.get(r.item) || { name: r.item, icon: '❔' };
            const have = B.Items.count(r.item), ok = have >= r.n;
            return '<span class="adopt-need' + (ok ? ' need-ok' : ' need-no') + '">' + it.icon + ' ' + it.name + ' ' + have + '/' + r.n + '</span>';
          }).join('');
          return '<div class="adopt-card' + (owned ? ' adopt-owned' : '') + '">' +
            '<div class="pet-head"><span class="pet-face">' + def.icon + '</span><b>' + def.name + '</b></div>' +
            '<div class="adopt-needs">' + prereqRows + '</div>' +
            (owned
              ? '<div class="adopt-tag">✓ Sahiplendin</div>'
              : '<button class="btn adopt-go' + (ready ? ' btn-action' : ' btn-quiet') + '" data-type="' + def.id + '"' + (ready ? '' : ' disabled') + '>' +
                  (ready ? '🐾 Sahiplen' : '🔒 Ön koşul eksik') + '</button>') +
            '</div>';
        }).join('') + '</div>';

        wrap.innerHTML = html;

        // Bakım aksiyonları
        wrap.querySelectorAll('.pet-care').forEach(b => { if (!b.disabled) b.onclick = () => {
          const r = B.Pets.care(b.dataset.uid, b.dataset.act);
          if (!r.ok) { B.Audio.play('wrong'); B.UI.toast('⚠️ ' + r.err); return; }
          if (r.rescued) {
            B.Audio.play('fanfare'); if (B.Anim.confetti) B.Anim.confetti(60);
            B.UI.overlay('<div class="ov-baba">🦸</div><h2>' + esc(r.pet.name) + ' kurtarıldı! 🎉</h2>' +
              '<p class="ov-quote">Sevgin ' + B.Pets.villain() + '\'ı yendi. Bir daha ihmal etme — düzenli besle ve oyna!</p>',
              [{ label: 'Yaşasın!', onClick: null }]);
          } else {
            B.Audio.play('correct');
            B.UI.toast('💛 ' + r.act.label + ' — teşekkür eder!');
          }
          render();
        }; });

        // Sahiplenme
        wrap.querySelectorAll('.adopt-go').forEach(b => { if (!b.disabled) b.onclick = () => {
          const def = B.Pets.typeDef(b.dataset.type);
          const ov = B.UI.overlay('<div class="ov-baba">' + def.icon + '</div><h2>' + def.name + ' sahiplen</h2>' +
            '<p class="ov-quote">Sarf malzemeleri (mama, kum, tasma…) harcanır; yuvası (kafes/akvaryum/kulübe) sende kalır ve Odam\'a koyabilirsin — dostun orada yaşar. Ona bir isim ver:</p>' +
            '<input id="pet-name" class="name-input" maxlength="14" placeholder="' + def.name + ' adı" value="' + def.name + '">',
            [{ label: 'Sahiplen 🐾', onClick: null }, { label: 'Vazgeç', cls: 'btn-quiet', onClick: null }]);
          const btns = ov.querySelectorAll('.overlay-btns .btn');
          btns[0].onclick = () => {
            const nm = ov.querySelector('#pet-name').value;
            const r = B.Pets.adopt(b.dataset.type, nm);
            ov.remove();
            if (!r.ok) { B.Audio.play('wrong'); B.UI.toast('⚠️ ' + r.err); return; }
            B.Audio.play('fanfare'); if (B.Anim.confetti) B.Anim.confetti(40);
            B.UI.overlay('<div class="ov-baba">' + def.icon + '</div><h2>' + esc(r.pet.name) + ' ailene katıldı! 🎉</h2><p class="ov-quote">' + (def.teach || '') + '</p>', [{ label: 'Yaşasın!', onClick: null }]);
            render();
          };
          btns[1].onclick = () => ov.remove();
        }; });
      }

      function esc(s) { return String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }
      render();
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
