/* BOKUL — Atölye (sürükle-bırak ÜRETİM alanı)
 * Depodaki ham malzemeleri TEZGAHA sürükle (ya da dokun) → grup oluştur → ÜRET.
 * Grup bir tarife tam uyunca ürün çıkar. Ürettiğin parçalar başka tariflerde malzeme olur. */
(function (B) {
  B.UI.registerScreen('atolye', {
    enter(root) {
      const hud = B.UI.buildHud(root, { backTo: 'evim' });
      this._hud = hud;
      const wrap = document.createElement('div');
      wrap.className = 'atolye-wrap';
      root.appendChild(wrap);

      let bench = {}; // tezgahtaki grup: { itemId: adet }

      // Baba ilk kez açıklar
      (function babaIntro() {
        const seen = B.Save.settings.get();
        if (seen.tut_craft2) return;
        B.Save.settings.set({ tut_craft2: true });
        B.UI.overlay('<div class="ov-baba">🔨</div><h2>Üretim Tezgahı</h2>' +
          '<p class="ov-quote">Malzemeleri aşağıdan TEZGAHA sürükle (ya da dokun) — doğru parçaları birleştirince ÜRET tuşu açılır. Ürettiğin parçalarla daha büyük şeyler üretirsin!</p>',
          [{ label: 'Anlaşıldı!', onClick: null }]);
      })();

      const avail = id => B.Items.count(id) - (bench[id] || 0); // daha sürüklenebilir adet
      function addToBench(id) {
        if (avail(id) <= 0) { B.Audio.play('wrong'); return; }
        bench[id] = (bench[id] || 0) + 1;
        B.Audio.play('tick');
        renderBench(); renderMats();
      }
      function removeFromBench(id) {
        if (!bench[id]) return;
        bench[id]--; if (!bench[id]) delete bench[id];
        B.Audio.play('tick');
        renderBench(); renderMats();
      }

      /* Malzeme çipini sürüklenebilir yap (pointer = fare+dokunmatik); tap = doğrudan ekle */
      function makeDraggable(el, id) {
        el.addEventListener('pointerdown', e => {
          if (avail(id) <= 0) return;
          const sx = e.clientX, sy = e.clientY;
          let ghost = null, moved = false;
          const move = ev => {
            const dx = ev.clientX - sx, dy = ev.clientY - sy;
            if (!moved && Math.hypot(dx, dy) > 7) {
              moved = true;
              ghost = document.createElement('div'); ghost.className = 'mat-ghost';
              ghost.textContent = (B.Items.get(id) || {}).icon || '📦';
              document.body.appendChild(ghost);
            }
            if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; }
            if (moved && ev.cancelable) ev.preventDefault();
          };
          const up = ev => {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            if (ghost) ghost.remove();
            if (!moved) { addToBench(id); return; }            // dokunma = ekle
            const t = document.elementFromPoint(ev.clientX, ev.clientY);
            if (t && t.closest('.craft-bench')) addToBench(id);  // tezgaha bırakıldı = ekle
          };
          document.addEventListener('pointermove', move, { passive: false });
          document.addEventListener('pointerup', up);
        });
      }

      function renderMats() {
        const host = wrap.querySelector('.atolye-mats-list');
        const owned = B.Items.ownedList().filter(o => ['malzeme', 'craft', 'pet'].includes(o.item.cat));
        if (!owned.length) {
          host.innerHTML = '<div class="atolye-mats-empty">📦 Depon boş — 🏪 Mağaza\'dan ham malzeme al, sonra buradan tezgaha sürükle!</div>';
          return;
        }
        host.innerHTML = owned.map(o => {
          const left = avail(o.item.id);
          return '<button class="mat-chip rar-' + (o.item.rarity || 'common') + (left <= 0 ? ' mat-out' : '') + '" data-id="' + o.item.id + '">' +
            '<span class="mat-ic">' + o.item.icon + '</span><span class="mat-nm">' + o.item.name + '</span>' +
            '<span class="mat-ct">' + left + '</span></button>';
        }).join('');
        host.querySelectorAll('.mat-chip').forEach(c => makeDraggable(c, c.dataset.id));
      }

      function renderBench() {
        const host = wrap.querySelector('.craft-bench');
        const ids = Object.keys(bench);
        const match = B.Craft.match(bench);
        const slots = ids.length
          ? ids.map(id => { const it = B.Items.get(id) || { icon: '❔', name: id };
              return '<button class="bench-slot rar-' + (it.rarity || 'common') + '" data-id="' + id + '" title="Çıkarmak için dokun">' +
                '<span class="bs-ic">' + it.icon + '</span><span class="bs-ct">×' + bench[id] + '</span></button>'; }).join('')
          : '<div class="bench-hint">Malzemeleri buraya sürükle ya da dokun →</div>';
        const lockedBp = match && B.Craft.lockedBy ? B.Craft.lockedBy(match) : null;
        let out = '';
        if (match && lockedBp) {
          out = '<div class="bench-out no">🔒 <b>' + match.name + '</b> için önce «' + lockedBp.name + '» taslağını kazan — 🎓 Hobi Kursları\'nda ilgili bakım kursunu geç.</div>';
        } else if (match) {
          const p = match.produces || {};
          const pic = p.type === 'upgrade' ? '⬆️' : ((B.Items.get(p.id) || {}).icon || match.icon);
          out = '<div class="bench-out ok">🔧 <b>' + match.name + '</b> üretilebilir! → ' + pic + '</div>';
        } else if (ids.length) {
          out = '<div class="bench-out no">Bu birleşim bir tarife uymuyor — tarifleri aşağıdan gör.</div>';
        }
        host.innerHTML = slots;
        wrap.querySelector('.bench-out-wrap').innerHTML = out;
        const doBtn = wrap.querySelector('.craft-do-btn');
        const ready = match && !lockedBp;
        doBtn.disabled = !ready;
        doBtn.className = 'btn craft-do-btn ' + (ready ? 'btn-action' : 'btn-quiet');
        host.querySelectorAll('.bench-slot').forEach(s => s.onclick = () => removeFromBench(s.dataset.id));
      }

      /* Tarif referansı (ne + ne = ne) — çocuk kombinasyonları öğrensin */
      function recipeRef() {
        const tiers = B.Craft.tiers(), recipes = B.Craft.recipes();
        return '<div class="craft-ref"><div class="craft-ref-h">📖 Tarifler (ne + ne = ne)</div>' +
          tiers.map(t => {
            const rs = recipes.filter(r => r.tier === t.id);
            if (!rs.length) return '';
            return '<div class="craft-tier"><b>' + t.name + '</b></div>' +
              rs.map(r => {
                const needs = Object.keys(r.needs).map(k => { const it = B.Items.get(k) || { icon: '❔' };
                  return '<span class="ref-need' + (B.Items.count(k) >= r.needs[k] ? ' rn-ok' : '') + '">' + it.icon + '×' + r.needs[k] + '</span>'; }).join('<span class="ref-plus">+</span>');
                const pit = r.produces && r.produces.type === 'item' ? (B.Items.get(r.produces.id) || {}).icon : '⬆️';
                const bp = B.Craft.lockedBy ? B.Craft.lockedBy(r) : null;
                const lock = bp ? '<span class="ref-lock">🔒 ' + bp.name + '</span>' : '';
                return '<div class="ref-row' + (bp ? ' ref-locked' : '') + '"><span class="ref-in">' + needs + '</span><span class="ref-eq">=</span>' +
                  '<span class="ref-out">' + (pit || r.icon) + ' ' + r.name + lock + '</span></div>';
              }).join('');
          }).join('') + '</div>';
      }

      function craftNow() {
        const match = B.Craft.match(bench);
        if (!match) return;
        const res = B.Craft.craft(match.id);
        if (!res.ok) { B.Audio.play('wrong'); B.UI.toast('⚠️ ' + res.err); return; }
        B.Audio.play('chest');
        bench = {};
        B.UI.overlay('<div class="ov-baba">' + match.icon + '</div><h2>' + match.name + ' üretildi! 🎉</h2>' +
          '<p class="ov-quote">' + (match.teach || '') + '</p>', [{ label: 'Süper!', onClick: null }]);
        renderBench(); renderMats();
        wrap.querySelector('.store-gold').textContent = '💰 ' + (B.State.data.player.coins || 0);
      }

      wrap.innerHTML =
        '<div class="atolye-head"><div class="atolye-title">🔨 Üretim Atölyesi</div>' +
          '<div class="chip store-gold">💰 ' + (B.State.data.player.coins || 0) + '</div></div>' +
        '<button class="atolye-hobby-btn">🎓 Hobi Kursları — yeni üretim tarifleri öğren</button>' +
        '<div class="craft-bench" aria-label="Üretim tezgahı"></div>' +
        '<div class="bench-out-wrap"></div>' +
        '<div class="bench-btns"><button class="btn btn-quiet bench-clear">✕ Temizle</button>' +
          '<button class="btn craft-do-btn btn-quiet" disabled>🔨 ÜRET</button></div>' +
        '<div class="atolye-mats"><div class="atolye-mats-t">📦 Malzemelerin (sürükle ya da dokun)</div>' +
          '<div class="atolye-mats-list"></div></div>' +
        recipeRef();

      wrap.querySelector('.atolye-hobby-btn').onclick = () => { B.Audio.play('tick'); B.UI.show('hobbies', { back: 'atolye' }); };
      wrap.querySelector('.bench-clear').onclick = () => { bench = {}; B.Audio.play('tick'); renderBench(); renderMats(); };
      wrap.querySelector('.craft-do-btn').onclick = craftNow;
      renderMats();
      renderBench();
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
