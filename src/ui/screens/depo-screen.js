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
      let filterCat = 'all'; // süzme: kategori (dokunmatik dostu, konumu bozmaz)

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
        const actions = [];
        // Blueprint ise ÖĞREN seçeneği (yeteneği açar, item'ı tüketir) — satın ALINAMAZ, satılabilir
        if (it.blueprint) {
          actions.push({ label: '📖 Öğren', onClick: () => {
            const r = B.Blueprints.learnFromDepot(it.id);
            if (!r.ok) { B.Audio.play('wrong'); B.UI.toast('⚠️ ' + r.err); return; }
            B.Audio.play('chest'); B.UI.toast('🎓 ' + (it.name || 'Tarif') + ' öğrenildi! Artık Atölye\'de üretebilirsin.');
            shell();
          } });
        }
        actions.push({ label: '💰 Sat (' + sellPrice + ')', onClick: () => {
          const r = B.Items.sell(it.id);
          if (r.ok) { B.Audio.play('tick'); B.UI.toast('💰 ' + it.name + ' satıldı: +' + r.coins + ' Altın'); }
          shell();
        } });
        actions.push({ label: 'Kapat', onClick: null });
        B.UI.overlay('<div class="ov-big">' + it.icon + '</div><h2>' + esc(it.name) + '</h2>' +
          '<p class="ov-quote">' + esc(it.desc || '') + '</p>' +
          '<p class="ov-xp">Depoda: ' + B.Items.count(it.id) + ' adet · ' + ({ common: '🟢 Yaygın', rare: '🔵 Nadir', epic: '🟣 Epik', legendary: '🟡 Efsanevi' }[it.rarity || 'common']) +
            (it.blueprint ? '<br>📐 Bu bir üretim tarifi — <b>Öğren</b>ince Atölye\'de yeni eşyalar üretebilirsin.' : '') + '</p>',
          actions);
      }

      function renderDepo(body) {
        B.Items.syncSlots();               // yeni eşyaları ilk boşa yerleştir
        const slots = B.Items.slotArray();
        const cap = B.Items.capacity();
        const used = slots.filter(Boolean).length;
        // Süzme için mevcut kategoriler
        const owned = B.Items.ownedList();
        const catSet = [];
        owned.forEach(o => { const c = o.item.cat || 'diger'; if (!catSet.some(x => x.id === c)) catSet.push({ id: c, name: B.Items.catName(c) }); });
        if (!owned.some(o => (o.item.cat || 'diger') === filterCat)) if (filterCat !== 'all') filterCat = 'all';
        const filterRow = used ? '<div class="depo-tools">' +
          '<div class="depo-filters">' +
            '<button class="chip dchip' + (filterCat === 'all' ? ' tab-on' : '') + '" data-f="all">Tümü</button>' +
            catSet.map(c => '<button class="chip dchip' + (filterCat === c.id ? ' tab-on' : '') + '" data-f="' + c.id + '">' + esc(c.name) + '</button>').join('') +
          '</div>' +
          '<div class="depo-sorts">🔀 Sırala: ' +
            '<button class="chip schip" data-s="rarity">Enderlik</button>' +
            '<button class="chip schip" data-s="name">Ad</button>' +
            '<button class="chip schip" data-s="cat">Tür</button>' +
          '</div></div>' : '';
        let cells = '';
        for (let i = 0; i < cap; i++) {
          const ci = B.Items.cellItem(i);
          if (ci) {
            const dim = filterCat !== 'all' && (ci.item.cat || 'diger') !== filterCat;
            cells += '<button class="inv-cell filled rar-' + (ci.item.rarity || 'common') + (dim ? ' inv-dim' : '') + (ci.item.blueprint ? ' inv-bp' : '') + '" data-idx="' + i + '" data-id="' + ci.item.id + '" title="' + esc(ci.item.name) + '">' +
              '<span class="inv-ic">' + ci.item.icon + '</span>' +
              (ci.count > 1 ? '<span class="inv-count">' + ci.count + '</span>' : '') +
              (ci.item.blueprint ? '<span class="inv-bp-tag">📐</span>' : '') +
            '</button>';
          } else {
            cells += '<div class="inv-cell empty" data-idx="' + i + '"></div>';
          }
        }
        const upCost = B.Items.depoUpgradeCost();
        const dLvl = B.Items.depoLevel(), dMax = B.Items.maxDepoLevel(), maxed = !B.Items.canUpgradeDepo();
        const upCtrl = maxed
          ? '<span class="chip depo-maxed">🔒 Maks (Sv.' + dMax + ') — seviye atla</span>'
          : '<button class="chip depo-up' + (coins() >= upCost ? '' : ' store-poor') + '">⬆️ Depoyu Yükselt · Sv.' + dLvl + '/' + dMax + '</button>';
        body.innerHTML =
          '<div class="inv-head">' +
            '<span class="inv-title">📦 Depo</span>' +
            '<span class="inv-cap' + (used >= cap ? ' inv-warn' : '') + '">' + used + ' / ' + cap + ' dolu</span>' +
            upCtrl +
          '</div>' +
          filterRow +
          (used ? '<div class="inv-hint">👆 Dokun: bilgi/sat · ✋ Sürükle: istediğin boş hücreye taşı</div>' : '<div class="store-empty">Depon boş. Çarşı\'dan eşya al, burada saklansın!</div>') +
          '<div class="inv-grid">' + cells + '</div>' +
          (B.Items.slotsUsed() > used ? '<div class="adm-warn">⚠️ Bazı eşyalar depoya sığmadı — seviye atla ya da eşyaları üretimde/bakımında kullan.</div>' : '');
        const grid = body.querySelector('.inv-grid');
        body.querySelectorAll('.inv-cell.filled').forEach(cell => makeCellDraggable(cell, grid, body));
        // Süzme (kategoriye göre soluklaştır; konumu bozmaz, sürükleme çalışır)
        body.querySelectorAll('.dchip').forEach(b => b.onclick = () => { filterCat = b.dataset.f; B.Audio.play('tick'); renderDepo(body); });
        // Sıralama (baştan sıkıştır + sırala)
        body.querySelectorAll('.schip').forEach(b => b.onclick = () => { B.Items.sortSlots(b.dataset.s); B.Audio.play('tick'); filterCat = 'all'; renderDepo(body); });
        // Depoyu yükselt: iki yol — ALTIN (pahalı) ya da HAM MADDE (%30 ucuz)
        const upBtn = body.querySelector('.depo-up');
        if (upBtn) upBtn.onclick = () => openUpgrade();
      }

      function openUpgrade() {
        const goldCost = B.Items.depoUpgradeCost();
        const mats = B.Items.depoMaterials();
        const matVal = B.Items.depoMaterialsValue();
        const canGold = coins() >= goldCost;
        const canMats = B.Items.depoMaterialsMissing().length === 0;
        const capNow = B.Items.capacity();
        const matList = Object.keys(mats).map(k => {
          const it = B.Items.get(k) || { icon: '❔', name: k };
          const have = B.Items.count(k), ok = have >= mats[k];
          return '<span class="up-mat' + (ok ? ' up-ok' : ' up-miss') + '">' + it.icon + ' ' + mats[k] + ' <small>(' + have + ')</small></span>';
        }).join('');
        B.UI.overlay(
          '<div class="ov-big">📦</div><h2>Depoyu Yükselt</h2>' +
          '<p class="ov-quote">Kapasite ' + capNow + ' → ' + (capNow + 4) + ' (+4 hücre) · Depo Sv.' + B.Items.depoLevel() + '/' + B.Items.maxDepoLevel() + '</p>' +
          '<div class="up-opt"><div class="up-h">💰 Altınla al <b class="up-tag pahali">hazır</b></div>' +
            '<div class="up-cost' + (canGold ? '' : ' up-miss') + '">' + goldCost + ' Altın</div></div>' +
          '<div class="up-opt"><div class="up-h">🧰 Ham madde ile <b class="up-tag ucuz">topla = bedava</b></div>' +
            '<div class="up-mats">' + matList + '</div>' +
            '<div class="up-note">Malzemeyi oyunla toplarsan altın harcamazsın (değeri ≈ ' + matVal + ').</div></div>',
          [
            { label: '💰 Altınla (' + goldCost + ')', onClick: () => doUpgrade('gold') },
            { label: '🧰 Ham madde ile', onClick: () => doUpgrade('mats') },
            { label: 'Kapat', onClick: null },
          ]);
      }
      function doUpgrade(via) {
        const r = via === 'gold' ? B.Items.upgradeDepo() : B.Items.upgradeDepoWithMaterials();
        if (!r.ok) {
          B.Audio.play('wrong');
          if (via === 'mats' && r.missing) {
            B.UI.toast('🧰 Ham madde eksik: ' + r.missing.map(m => m.icon + m.name + ' ' + m.have + '/' + m.need).join(', '));
          } else { B.UI.toast('💰 ' + r.err); }
          return;
        }
        B.Audio.play('chest'); B.UI.toast('📦 Depo büyüdü! Yeni kapasite: ' + r.cap);
        shell();
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
          if (tgt) { B.Items.moveSlot(+cell.dataset.idx, +tgt.dataset.idx); renderDepo(body); }
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
