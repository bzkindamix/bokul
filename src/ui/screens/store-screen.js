/* BOKUL — Mağaza & Depom
 * 🏪 Mağaza: altınla eşya satın al (kategori süzgeçli).
 * 📦 Depom : sahip olduğun eşyalar (adetli), Evim'de saklanır.
 * Eşyalar ileride evcil hayvan craft'ında ön koşul olur. */
(function (B) {
  function esc(s) { return String(s == null ? '' : s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }
  B.UI.registerScreen('store', {
    enter(root, params) {
      const hud = B.UI.buildHud(root, { backTo: 'evim' });
      this._hud = hud;
      let tab = (params && params.tab) || 'shop';
      if (tab === 'craft') tab = 'shop'; // craft artık kendi ekranı (atolye)
      let vendorId = null; // Eşya sekmesinde seçili satıcı
      let kcat = 'all'; // kıyafet sekmesi tür süzgeci

      const wrap = document.createElement('div');
      wrap.className = 'store-wrap';
      root.appendChild(wrap);

      function coins() { return B.State.data.player.coins || 0; }

      function shell() {
        wrap.innerHTML =
          '<div class="store-top"><div class="chip store-gold">💰 ' + coins() + ' Altın</div></div>' +
          '<div class="store-tabs">' +
            '<button class="chip stab" data-t="shop">🏪 Eşya</button>' +
            '<button class="chip stab" data-t="kiyafet">👕 Kıyafet</button>' +
            '<button class="chip stab" data-t="depo">📦 Depom (' + B.Items.total() + ')</button>' +
            '<button class="chip stab store-goatolye">🔨 Atölye ▶</button>' +
          '</div>' +
          '<div class="store-body"></div>';
        wrap.querySelectorAll('.stab[data-t]').forEach(b => b.onclick = () => {
          tab = b.dataset.t;
          wrap.querySelectorAll('.stab').forEach(x => x.classList.toggle('tab-on', x === b));
          renderBody();
        });
        const goAt = wrap.querySelector('.store-goatolye');
        if (goAt) goAt.onclick = () => { B.Audio.play('tick'); B.UI.show('atolye'); };
        wrap.querySelector('.stab[data-t="' + tab + '"]').classList.add('tab-on');
        renderBody();
      }

      function renderBody() {
        const body = wrap.querySelector('.store-body');
        if (tab === 'shop') renderShop(body);
        else if (tab === 'kiyafet') renderKiyafet(body);
        else renderDepo(body);
      }

      /* Baba bir mekaniği ilk kez açıklıyor (bir kez gösterilir) */
      function babaSays(key, icon, text) {
        const seen = B.Save.settings.get();
        if (seen['tut_' + key]) return;
        B.Save.settings.set({ ['tut_' + key]: true });
        B.UI.overlay('<div class="ov-baba">' + (icon || '🧑‍✈️') + '</div><h2>Baba Komutan</h2>' +
          '<p class="ov-quote">' + text + '</p>', [{ label: 'Anlaşıldı!', onClick: null }]);
      }

      /* Satıcı afişi: karakter yüzü + adı + o an söylediği replik */
      function vendorBanner(v) {
        if (!v) return '';
        return '<div class="vendor-banner" style="--vc:' + v.color + '">' +
          '<div class="vendor-face">' + v.icon + '</div>' +
          '<div class="vendor-info">' +
            '<div class="vendor-name">' + esc(v.name) + '</div>' +
            '<div class="vendor-say">💬 ' + esc(B.Vendors.say(v.id)) + '</div>' +
          '</div></div>';
      }

      /* ---- 🏪 Mağaza (satıcı gruplarına ayrılmış) ---- */
      function renderShop(body) {
        babaSays('shop', '🛒', 'Burası Çarşı! Her satıcının kendi tezgâhı var: Demirci Baba ham madde, Robotçu Zeki teknoloji, Marangoz Usta oda eşyası, Barınak Teyze evcil malzemesi satar. Altınla al, aldıkların Depom\'a gider. Ham maddeyi sonra 🔨 Atölye\'de birleştirip yeni şeyler ÜRET.');
        // Terzi kıyafet sekmesinde; burada eşya satıcıları
        const vendors = B.Vendors.all().filter(v => (v.cats || []).some(c => c !== 'kiyafet'));
        if (!vendors.length) { body.innerHTML = '<div class="store-empty">Satıcı bulunamadı.</div>'; return; }
        if (!vendorId || !vendors.some(v => v.id === vendorId)) vendorId = vendors[0].id;
        const vendor = B.Vendors.get(vendorId);
        const vrow = '<div class="store-vendors">' + vendors.map(v =>
          '<button class="chip vchip' + (v.id === vendorId ? ' tab-on' : '') + '" data-v="' + v.id + '" style="--vc:' + v.color + '">' +
            v.icon + ' ' + esc(v.name) + '</button>').join('') + '</div>';
        const banner = vendorBanner(vendor);
        // Barınak: ücretsiz sahiplenme kısayolu
        const adoptBtn = vendor.id === 'barinak'
          ? '<button class="btn-adopt">🐾 Dostunu ÜCRETSİZ sahiplen ▶</button>' : '';
        const buyable = B.Items.catalog().filter(it => !it.craftOnly && (vendor.cats || []).includes(it.cat));
        const cards = buyable.map(it => {
          const owned = B.Items.count(it.id);
          const isOwnedUnique = it.unique && owned > 0;
          const afford = coins() >= it.price;
          const stockLeft = it.unique ? (owned ? 0 : 1) : B.Items.stockLeft(it.id);
          const outOfStock = !isOwnedUnique && stockLeft <= 0;
          const disabled = isOwnedUnique || outOfStock;
          return '<button class="store-card rar-' + (it.rarity || 'common') + (isOwnedUnique ? ' store-owned' : '') + (outOfStock ? ' store-nostock' : '') + (afford || disabled ? '' : ' store-poor') + '" data-id="' + it.id + '"' + (disabled ? ' disabled' : '') + '>' +
            '<span class="rar-dot"></span>' +
            '<span class="store-ic">' + it.icon + '</span>' +
            '<span class="store-nm">' + it.name + '</span>' +
            '<span class="store-desc">' + (it.desc || '') + '</span>' +
            (owned && !it.unique ? '<span class="store-have">Depoda: ' + owned + '</span>' : '') +
            (isOwnedUnique ? '<span class="store-tag">✓ Sende var</span>'
                           : (outOfStock ? '<span class="store-tag store-nostock-tag">⛔ Bugün tükendi</span>'
                                         : '<span class="store-price">💰 ' + it.price + ' <small class="store-stock">📦' + stockLeft + '</small></span>')) +
            '</button>';
        }).join('');
        const grid = cards ? '<div class="store-grid">' + cards + '</div>'
                           : '<div class="store-empty">Bu tezgâhta şimdilik bir şey yok.</div>';
        body.innerHTML = vrow + banner + adoptBtn + grid;

        body.querySelectorAll('.vchip').forEach(b => b.onclick = () => {
          vendorId = b.dataset.v;
          B.Audio.play('tick');
          renderShop(body);
        });
        const adoptEl = body.querySelector('.btn-adopt');
        if (adoptEl) adoptEl.onclick = () => { B.Audio.play('tick'); B.UI.show('pets', {}); };

        body.querySelectorAll('.store-card[data-id]').forEach(cardEl => {
          if (cardEl.disabled) return;
          cardEl.onclick = () => {
            const it = B.Items.get(cardEl.dataset.id);
            if (!it) return;
            if (coins() < it.price) { B.Audio.play('wrong'); B.UI.toast('💰 Altının yetmiyor!'); return; }
            B.UI.confirm({
              icon: it.icon, title: it.name + ' alınsın mı?',
              body: '💰 ' + it.price + ' Altın karşılığında satın alacaksın.',
              yes: 'Satın al', no: 'Vazgeç',
              onYes: () => {
                const r = B.Items.buy(cardEl.dataset.id);
                if (!r.ok) { B.Audio.play('wrong'); B.UI.toast('💰 ' + r.err); return; }
                B.Audio.play('chest');
                B.UI.toast('✨ ' + r.item.name + ' alındı! Depom\'da.');
                shell(); // altın + depo sayısı güncellensin
              },
            });
          };
        });
      }

      /* Not: Atölye (craft) artık ayrı ekran → src/ui/screens/atolye-screen.js */

      /* ---- 👕 Kıyafet & Kozmetik (sahip OLMADIĞIN her şey) ---- */
      function renderKiyafet(body) {
        babaSays('kiyafet', '👕', 'Burası Kıyafet Reyonu! Sahip olmadığın tüm kıyafet, saç, aksesuar burada. Altınla al → Dolabına gider → Görünüşüm\'den giyersin. Sahip olduklarını Dolabında bulursun.');
        const gender = (B.State.data.player.avatar || {}).gender;
        const prices = B.Content.get('rewards').shopPrices;
        const priceOf = p => prices[p.rarity] || 50;
        // Cinsiyete uygun + henüz sahip OLMADIĞIN kozmetikler
        const all = B.Avatar.cosmeticCatalog().filter(c => B.Avatar.genderOk(c.part, gender) && !B.Avatar.isUnlocked(c.part));
        if (!all.length) {
          body.innerHTML = '<div class="store-empty">👑 Harika Komutan! Tüm kıyafet ve kozmetikler artık senin. Dolabından giyebilirsin.</div>';
          return;
        }
        // Tür süzgeci (Üst/Alt/Saç…)
        const types = [];
        all.forEach(c => { if (!types.some(t => t.id === c.type)) types.push({ id: c.type, label: c.typeLabel }); });
        const terziBanner = vendorBanner(B.Vendors.get('terzi'));
        const filterRow = terziBanner + '<div class="store-cats">' +
          '<button class="chip kcat" data-c="all">Hepsi</button>' +
          types.map(t => '<button class="chip kcat" data-c="' + t.id + '">' + t.label + '</button>').join('') +
          '</div>';
        const shown = all.filter(c => kcat === 'all' || c.type === kcat);
        const cards = shown.map(c => {
          const a = B.Avatar.normalize(B.State.data.player.avatar); a.usePhoto = false; a[c.type] = c.part.id;
          const full = c.type === 'outfit' || c.type === 'bottom';
          const afford = coins() >= priceOf(c.part);
          return '<button class="store-card cos-card rar-' + (c.rarity || 'common') + (full ? ' cos-tall' : '') + (afford ? '' : ' store-poor') + '" data-type="' + c.type + '" data-id="' + c.id + '">' +
            '<span class="rar-dot"></span>' +
            '<span class="cos-prev' + (full ? ' cos-prev-tall' : '') + '">' + (full ? B.Avatar.fullBody(a) : B.Avatar.svg(a)) + '</span>' +
            '<span class="store-nm">' + c.name + '</span>' +
            '<span class="store-sub">' + c.typeLabel + '</span>' +
            '<span class="store-price">💰 ' + priceOf(c.part) + '</span>' +
            '</button>';
        }).join('');
        body.innerHTML = filterRow + '<div class="store-grid cos-grid">' + cards + '</div>';

        body.querySelectorAll('.kcat').forEach(b => b.onclick = () => {
          kcat = b.dataset.c;
          renderKiyafet(body);
        });
        const active = body.querySelector('.kcat[data-c="' + kcat + '"]'); if (active) active.classList.add('tab-on');

        body.querySelectorAll('.cos-card[data-id]').forEach(el => el.onclick = () => {
          const c = all.find(x => x.type === el.dataset.type && x.id === el.dataset.id);
          if (!c) return;
          const price = priceOf(c.part);
          if (coins() < price) { B.Audio.play('wrong'); B.UI.toast('💰 Altının yetmiyor! Görev ve harekâtlardan kazan.'); return; }
          B.UI.confirm({
            icon: '👕', title: c.name + ' alınsın mı?',
            body: '💰 ' + price + ' Altın — alınca Dolabına eklenir, Görünüşüm\'den giyersin.',
            yes: 'Satın al', no: 'Vazgeç',
            onYes: () => {
              if (!B.Reward.spendCoins(price)) { B.Audio.play('wrong'); B.UI.toast('💰 Altının yetmiyor!'); return; }
              B.State.data.inventory.cosmetics.push(c.id);
              if (B.Bus && B.Events && B.Events.COSMETIC_UNLOCKED) B.Bus.emit(B.Events.COSMETIC_UNLOCKED, { itemId: c.id });
              B.Audio.play('chest'); B.Save.saveSoon();
              B.UI.toast('✨ ' + c.name + ' alındı! Dolabında.');
              shell(); // altın + liste güncellensin (satın alınan kaybolur)
            },
          });
        });
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
              shell(); // altın + depo tazelensin (depo sekmesinde kal)
            } },
            { label: 'Kapat', onClick: null },
          ]);
      }

      /* ---- 📦 Depom (kare-ızgara envanter; sürükleyip dizilebilir) ---- */
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
          (used ? '<div class="inv-hint">👆 Dokun: bilgi/sat · ✋ Sürükle: dizilişi değiştir</div>' : '<div class="store-empty">Depon boş. Mağazadan eşya al, burada saklansın!</div>') +
          '<div class="inv-grid">' + cells + empties + '</div>' +
          (overfull ? '<div class="adm-warn">⚠️ Depo kapasiten aşıldı — seviye atla ya da eşyaları üretimde/bakımunda kullan.</div>' : '');

        // Hücreleri sürükle-diz (pointer: fare+dokunmatik); az hareket = dokun (popup)
        const grid = body.querySelector('.inv-grid');
        body.querySelectorAll('.inv-cell.filled').forEach(cell => makeCellDraggable(cell, grid, body));
      }

      /* Bir depo hücresini sürüklenebilir yap; eşik altı hareket = dokun→popup */
      function makeCellDraggable(cell, grid, body) {
        let sx = 0, sy = 0, dragging = false, ghost = null;
        const TH = 7;
        cell.style.touchAction = 'none';
        cell.addEventListener('pointerdown', (e) => {
          if (e.button != null && e.button !== 0) return;
          sx = e.clientX; sy = e.clientY; dragging = false;
          const onMove = (ev) => {
            const dx = ev.clientX - sx, dy = ev.clientY - sy;
            if (!dragging && Math.hypot(dx, dy) > TH) {
              dragging = true;
              cell.classList.add('inv-dragging');
              ghost = cell.cloneNode(true);
              ghost.className = 'inv-cell filled inv-ghost ' + (cell.className.match(/rar-\w+/) || [''])[0];
              ghost.style.position = 'fixed'; ghost.style.pointerEvents = 'none'; ghost.style.zIndex = 9999;
              ghost.style.width = cell.offsetWidth + 'px'; ghost.style.height = cell.offsetHeight + 'px';
              document.body.appendChild(ghost);
              B.Audio.play('tick');
            }
            if (dragging && ghost) {
              ghost.style.left = (ev.clientX - ghost.offsetWidth / 2) + 'px';
              ghost.style.top = (ev.clientY - ghost.offsetHeight / 2) + 'px';
              // hedef hücreyi vurgula
              grid.querySelectorAll('.inv-cell.inv-target').forEach(t => t.classList.remove('inv-target'));
              const tgt = cellUnder(ev.clientX, ev.clientY, grid, cell);
              if (tgt) tgt.classList.add('inv-target');
            }
          };
          const onUp = (ev) => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            if (ghost) { ghost.remove(); ghost = null; }
            cell.classList.remove('inv-dragging');
            grid.querySelectorAll('.inv-cell.inv-target').forEach(t => t.classList.remove('inv-target'));
            if (!dragging) { openItemPopup(B.Items.get(cell.dataset.id)); return; } // dokun
            const tgt = cellUnder(ev.clientX, ev.clientY, grid, cell);
            const toId = tgt ? (tgt.dataset.id || null) : null; // boş hücre → sona
            if (tgt) { B.Items.reorder(cell.dataset.id, toId); renderDepo(body); }
          };
          document.addEventListener('pointermove', onMove);
          document.addEventListener('pointerup', onUp);
        });
      }

      /* Noktadaki grid hücresi (kendisi hariç) */
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
