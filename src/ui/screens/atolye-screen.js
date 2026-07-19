/* BOKUL — Atölye (craft alanı)
 * Depodaki (Depom) ham malzemelerle yeni eşyalar ÜRET. Craft edilen parçalarla
 * daha büyük eşyalar craftlanır; evini/depoyu geliştirir, evcil hayvan ön koşulu
 * sağlarsın. Malzemeler B.State.inventory.items'ten (Depom) harcanır. */
(function (B) {
  B.UI.registerScreen('atolye', {
    enter(root) {
      const hud = B.UI.buildHud(root, { backTo: 'evim' });
      this._hud = hud;
      const wrap = document.createElement('div');
      wrap.className = 'atolye-wrap';
      root.appendChild(wrap);

      // Baba ilk kez açıklar
      (function babaIntro() {
        const seen = B.Save.settings.get();
        if (seen.tut_craft) return;
        B.Save.settings.set({ tut_craft: true });
        B.UI.overlay('<div class="ov-baba">🔨</div><h2>Atölye</h2>' +
          '<p class="ov-quote">' + B.Craft.intro() + '</p>', [{ label: 'Anlaşıldı!', onClick: null }]);
      })();

      /* Depodaki craft malzemeleri (ne ile üreteceğini gör) */
      function matStrip() {
        const owned = B.Items.ownedList().filter(o => ['malzeme', 'craft', 'pet'].includes(o.item.cat));
        if (!owned.length) {
          return '<div class="atolye-mats atolye-mats-empty">📦 Depon boş — 🏪 Mağaza\'dan ham malzeme (tahta, cam, metal, vida…) al, sonra burada birleştir!</div>';
        }
        return '<div class="atolye-mats"><div class="atolye-mats-t">📦 Depondaki malzemeler</div>' +
          '<div class="atolye-mats-list">' + owned.map(o =>
            '<span class="mat-chip">' + o.item.icon + ' ' + o.item.name + ' <b>×' + o.count + '</b></span>').join('') +
          '</div></div>';
      }

      function craftCard(r) {
        const can = B.Craft.missing(r).length === 0;
        const needRows = Object.keys(r.needs).map(k => {
          const it = B.Items.get(k) || { name: k, icon: '❔' };
          const have = B.Items.count(k), need = r.needs[k];
          const ok = have >= need;
          return '<span class="craft-need' + (ok ? ' need-ok' : ' need-no') + '">' + it.icon + ' ' + it.name + ' ' + have + '/' + need + '</span>';
        }).join('');
        return '<div class="craft-card' + (can ? '' : ' craft-cant') + '">' +
          '<div class="craft-head"><span class="craft-ic">' + r.icon + '</span><b>' + r.name + '</b></div>' +
          '<div class="craft-needs">' + needRows + '</div>' +
          '<button class="btn craft-do' + (can ? ' btn-action' : ' btn-quiet') + '" data-id="' + r.id + '"' + (can ? '' : ' disabled') + '>' +
            (can ? '🔨 Üret' : '🔒 Malzeme eksik') + '</button>' +
        '</div>';
      }

      function render() {
        const tiers = B.Craft.tiers();
        const recipes = B.Craft.recipes();
        wrap.innerHTML =
          '<div class="atolye-head"><div class="atolye-title">🔨 Atölye</div>' +
            '<div class="chip store-gold">💰 ' + (B.State.data.player.coins || 0) + '</div></div>' +
          matStrip() +
          '<div class="atolye-recipes">' + tiers.map(t => {
            const rs = recipes.filter(r => r.tier === t.id);
            if (!rs.length) return '';
            return '<div class="craft-tier"><b>' + t.name + '</b><small>' + (t.hint || '') + '</small></div>' +
              '<div class="craft-list">' + rs.map(craftCard).join('') + '</div>';
          }).join('') + '</div>';

        wrap.querySelectorAll('.craft-do').forEach(btn => btn.onclick = () => {
          const r = B.Craft.get(btn.dataset.id);
          if (!r) return;
          B.UI.confirm({
            icon: r.icon, title: r.name + ' üretilsin mi?',
            body: 'Depondaki gerekli malzemeler harcanacak.', yes: 'Üret 🔨', no: 'Vazgeç',
            onYes: () => {
              const res = B.Craft.craft(btn.dataset.id);
              if (!res.ok) { B.Audio.play('wrong'); B.UI.toast('⚠️ ' + res.err); return; }
              B.Audio.play('chest');
              B.UI.overlay('<div class="ov-baba">' + r.icon + '</div><h2>' + r.name + ' üretildi! 🎉</h2>' +
                '<p class="ov-quote">' + (r.teach || '') + '</p>', [{ label: 'Süper!', onClick: null }]);
              render();
            },
          });
        });
      }

      render();
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
