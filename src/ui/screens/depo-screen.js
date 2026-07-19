/* BOKUL — Depom (kare-ızgara envanter)
 * Sahip olunan eşyalar adetli hücrelerde; sürükleyip dizilebilir, dokununca
 * bilgi/sat. Evim → DEPOM kapısından açılır. (Mağazadan ayrıldı: v0.85) */
(function (B) {
  function esc(s) { return String(s == null ? '' : s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }
  B.UI.registerScreen('depo', {
    enter(root) {
      const hud = B.UI.buildHud(root, { backTo: 'evim' });
      this._hud = hud;
      const wrap = document.createElement('div');
      wrap.className = 'store-wrap';
      root.appendChild(wrap);
      function coins() { return B.State.data.player.coins || 0; }

      function shell() {
        wrap.innerHTML =
          '<div class="store-top"><div class="chip store-gold">💰 ' + coins() + ' Altın</div></div>' +
          '<div class="store-body"></div>';
        renderDepo(wrap.querySelector('.store-body'));
      }

      /* Eşya bilgisi + Sat popup'ı */
      function openItemPopup(it) {
        if (!it) return;
        B.Audio.play('tick');
        const sellPrice = Math.max(1, Math.round((it.price || 0) * 0.4)); // %60 daha ucuz
        B.UI.overlay('<div class="ov-big">' + it.icon + '</div><h2>' + esc(it.name) + '</h2>' +
          '<p class="ov-quote">' + esc(it.desc || '') + '</p>' +
          '<p class="ov-xp">Depoda: ' + B.Items.count(it.id) + ' adet · ' + ({ common: '🟢 Yaygın', rare: '🔵 Nadir', epic: '🟣 Epik', legendary: '🟡 Efsanevi' }[it.rarity || 'common']) + '</p>',
          [
            { label: '💰 Sat (' + sellPrice + ')', onClick: () => {
              const r = B.Items.sell(it.id);
              if (r.ok) { B.Audio.play('tick'); B.UI.toast('💰 ' + it.name + ' satıldı: +' + r.coins + ' Altın'); }
              shell();
            } },
            { label: 'Kapat', onClick: null },
          ]);
      }

      function renderDepo(body) {
        const owned = B.Items.orderedOwned(); // oyuncunun seçtiği sıra
        const cap = B.Items.capacity();
        const used = owned.length;
        const overfull = used > cap;
        const cells = owned.map(o =>
          '<button class="inv-cell filled rar-' + (o.item.rarity || 'common') + '" data-id="' + o.item.id + '" title="' + esc(o.item.name) + '">' +
            '<span class="inv-ic">' + o.item.icon + '</span>' +
            (o.count > 1 ? '<span class="inv-count">' + o.count + '</span>' : '') +
          '</button>').join('');
        const emptyN = Math.max(0, cap - used);
        const empties = Array.from({ length: emptyN }, () => '<div class="inv-cell empty"></div>').join('');
        body.innerHTML =
          '<div class="inv-head">' +
            '<span class="inv-title">📦 Depo</span>' +
            '<span class="inv-cap' + (overfull ? ' inv-over' : (used >= cap ? ' inv-warn' : '')) + '">' + used + ' / ' + cap + ' dolu</span>' +
            '<span class="inv-lvl">🎖️ Sv.' + ((B.State.data.player.level) || 1) + ' — seviye atlayınca depo büyür</span>' +
          '</div>' +
          (used ? '<div class="inv-hint">👆 Dokun: bilgi/sat · ✋ Sürükle: dizilişi değiştir</div>' : '<div class="store-empty">Depon boş. Çarşı\'dan eşya al, burada saklansın!</div>') +
          '<div class="inv-grid">' + cells + empties + '</div>' +
          (overfull ? '<div class="adm-warn">⚠️ Depo kapasiten aşıldı — seviye atla ya da eşyaları üretimde/bakımında kullan.</div>' : '');
        const grid = body.querySelector('.inv-grid');
        body.querySelectorAll('.inv-cell.filled').forEach(cell => makeCellDraggable(cell, grid, body));
      }

      /* Hücre sürükle-diz; setPointerCapture ile dokunmatikte kaymaz.
       * Eşik altı hareket = dokun→popup, üstü = sürükle→yeniden diz. */
      function makeCellDraggable(cell, grid, body) {
        let sx = 0, sy = 0, dragging = false, ghost = null, pid = null;
        const TH = 7;
        cell.style.touchAction = 'none';
        function clear() {
          if (ghost) { ghost.remove(); ghost = null; }
          cell.classList.remove('inv-dragging');
          grid.querySelectorAll('.inv-cell.inv-target').forEach(t => t.classList.remove('inv-target'));
        }
        cell.addEventListener('pointerdown', (e) => {
          if (e.button != null && e.button > 0) return;
          pid = e.pointerId; sx = e.clientX; sy = e.clientY; dragging = false;
          try { cell.setPointerCapture(pid); } catch (_) {}
          e.preventDefault();
        });
        cell.addEventListener('pointermove', (e) => {
          if (pid == null || e.pointerId !== pid) return;
          const dx = e.clientX - sx, dy = e.clientY - sy;
          if (!dragging && Math.hypot(dx, dy) > TH) {
            dragging = true;
            cell.classList.add('inv-dragging');
            ghost = cell.cloneNode(true);
            ghost.className = 'inv-cell filled inv-ghost ' + (cell.className.match(/rar-\w+/) || [''])[0];
            Object.assign(ghost.style, { position: 'fixed', pointerEvents: 'none', zIndex: 9999, margin: 0, width: cell.offsetWidth + 'px', height: cell.offsetHeight + 'px' });
            document.body.appendChild(ghost);
            B.Audio.play('tick');
          }
          if (dragging && ghost) {
            ghost.style.left = (e.clientX - ghost.offsetWidth / 2) + 'px';
            ghost.style.top = (e.clientY - ghost.offsetHeight / 2) + 'px';
            grid.querySelectorAll('.inv-cell.inv-target').forEach(t => t.classList.remove('inv-target'));
            const tgt = cellUnder(e.clientX, e.clientY, grid, cell);
            if (tgt) tgt.classList.add('inv-target');
          }
        });
        cell.addEventListener('pointerup', (e) => {
          if (pid == null || e.pointerId !== pid) return;
          const wasDrag = dragging;
          const tgt = wasDrag ? cellUnder(e.clientX, e.clientY, grid, cell) : null;
          try { cell.releasePointerCapture(pid); } catch (_) {}
          pid = null; dragging = false;
          clear();
          if (!wasDrag) { openItemPopup(B.Items.get(cell.dataset.id)); return; }
          if (tgt) { B.Items.reorder(cell.dataset.id, tgt.dataset.id || null); renderDepo(body); }
        });
        cell.addEventListener('pointercancel', (e) => {
          if (pid == null || e.pointerId !== pid) return;
          try { cell.releasePointerCapture(pid); } catch (_) {}
          pid = null; dragging = false; clear();
        });
      }

      function cellUnder(x, y, grid, self) {
        const el = document.elementFromPoint(x, y);
        if (!el) return null;
        const c = el.closest ? el.closest('.inv-cell') : null;
        if (!c || c === self || !grid.contains(c)) return null;
        return c;
      }

      shell();
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
