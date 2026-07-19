/* BOKUL — Çarşı (Mağaza)
 * Dükkan kartları: her satıcı ayrı bir dükkan (Demirci / Robotçu / Marangoz /
 * Pet Shop / Terzi) + Barınak (dost sahiplen → pets). Bir dükkana girince
 * SADECE o dükkanın ürünleri gösterilir; sekme YOK. Depom ve Atölye artık
 * Evim'de kendi kapılarında (v0.85 yeniden yapılanması). */
(function (B) {
  function esc(s) { return String(s == null ? '' : s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }
  B.UI.registerScreen('store', {
    enter(root, params) {
      const hud = B.UI.buildHud(root, { backTo: 'evim' });
      this._hud = hud;
      let view = (params && params.vendor) || 'carsi'; // 'carsi' | vendorId
      let kcat = 'all'; // Terzi (kıyafet) tür süzgeci

      const wrap = document.createElement('div');
      wrap.className = 'store-wrap';
      root.appendChild(wrap);

      function coins() { return B.State.data.player.coins || 0; }

      function shell() {
        const back = view === 'carsi' ? '' : '<button class="chip store-back">◀ Çarşı</button>';
        wrap.innerHTML =
          '<div class="store-top">' + back +
            '<div class="chip store-gold">💰 ' + coins() + ' Altın</div></div>' +
          '<div class="store-body"></div>';
        const bk = wrap.querySelector('.store-back');
        if (bk) bk.onclick = () => { B.Audio.play('tick'); view = 'carsi'; shell(); };
        const body = wrap.querySelector('.store-body');
        if (view === 'carsi') renderCarsi(body);
        else if (view === 'terzi') renderKiyafet(body);
        else renderVendor(body, view);
      }

      function babaSays(key, icon, text) {
        const seen = B.Save.settings.get();
        if (seen['tut_' + key]) return;
        B.Save.settings.set({ ['tut_' + key]: true });
        B.UI.overlay('<div class="ov-baba">' + (icon || '🧑‍✈️') + '</div><h2>Baba Komutan</h2>' +
          '<p class="ov-quote">' + text + '</p>', [{ label: 'Anlaşıldı!', onClick: null }]);
      }

      function vendorBanner(v) {
        if (!v) return '';
        return '<div class="vendor-banner" style="--vc:' + v.color + '">' +
          '<div class="vendor-face">' + v.icon + '</div>' +
          '<div class="vendor-info">' +
            '<div class="vendor-name">' + esc(v.name) + '</div>' +
            '<div class="vendor-say">💬 ' + esc(B.Vendors.say(v.id)) + '</div>' +
          '</div></div>';
      }

      /* ---- 🏙️ Çarşı: dükkan kartları ---- */
      function renderCarsi(body) {
        babaSays('carsi', '🏙️', 'Burası Çarşı! Her dükkanın kendi ustası var: 🔨 Demirci ham madde, 🤖 Robotçu teknoloji, 🪚 Marangoz oda eşyası, 🐾 Pet Shop evcil malzemesi, ✂️ Terzi kıyafet satar. 🏠 Barınak\'tan ise dost ÜCRETSİZ sahiplenirsin. Aldığın eşyalar Depom\'a gider.');
        const vendors = B.Vendors.all();
        const cards = vendors.map(v =>
          '<button class="shop-card" data-v="' + v.id + '" style="--vc:' + v.color + '">' +
            '<span class="shop-face">' + v.icon + '</span>' +
            '<span class="shop-name">' + esc(v.name) + '</span>' +
            '<span class="shop-tag">' + esc(v.tagline || '') + '</span>' +
          '</button>').join('');
        // Barınak (sahiplenme) — satıcı değil, özel kart
        const barinak =
          '<button class="shop-card shop-barinak" data-go="pets" style="--vc:#8E7CC3">' +
            '<span class="shop-face">🏠</span>' +
            '<span class="shop-name">Barınak</span>' +
            '<span class="shop-tag">Dostunu ÜCRETSİZ sahiplen</span>' +
          '</button>';
        body.innerHTML = '<div class="shop-grid">' + cards + barinak + '</div>';
        body.querySelectorAll('.shop-card[data-v]').forEach(c => c.onclick = () => {
          B.Audio.play('tick'); view = c.dataset.v; shell();
        });
        const bar = body.querySelector('.shop-card[data-go="pets"]');
        if (bar) bar.onclick = () => { B.Audio.play('tick'); B.UI.show('pets', {}); };
      }

      /* ---- 🛒 Tek dükkan: satıcının ürünleri (sekme yok) ---- */
      function renderVendor(body, vendorId) {
        const vendor = B.Vendors.get(vendorId);
        if (!vendor) { view = 'carsi'; shell(); return; }
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
                           : '<div class="store-empty">Bu dükkanda şimdilik bir şey yok.</div>';
        body.innerHTML = vendorBanner(vendor) + grid;

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
                shell();
              },
            });
          };
        });
      }

      /* ---- ✂️ Terzi: kıyafet & kozmetik (sahip OLMADIĞIN her şey) ---- */
      function renderKiyafet(body) {
        babaSays('kiyafet', '✂️', 'Terzi Moda\'dasın! Sahip olmadığın tüm kıyafet, saç, aksesuar burada. Altınla al → Dolabına gider → Görünüşüm\'den giyersin.');
        const gender = (B.State.data.player.avatar || {}).gender;
        const prices = B.Content.get('rewards').shopPrices;
        const priceOf = p => prices[p.rarity] || 50;
        const all = B.Avatar.cosmeticCatalog().filter(c => B.Avatar.genderOk(c.part, gender) && !B.Avatar.isUnlocked(c.part));
        const terziBanner = vendorBanner(B.Vendors.get('terzi'));
        if (!all.length) {
          body.innerHTML = terziBanner + '<div class="store-empty">👑 Harika Komutan! Tüm kıyafet ve kozmetikler artık senin. Dolabından giyebilirsin.</div>';
          return;
        }
        const types = [];
        all.forEach(c => { if (!types.some(t => t.id === c.type)) types.push({ id: c.type, label: c.typeLabel }); });
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

        body.querySelectorAll('.kcat').forEach(b => b.onclick = () => { kcat = b.dataset.c; renderKiyafet(body); });
        const active = body.querySelector('.kcat[data-c="' + kcat + '"]'); if (active) active.classList.add('tab-on');

        body.querySelectorAll('.cos-card[data-id]').forEach(el => el.onclick = () => {
          const c = all.find(x => x.type === el.dataset.type && x.id === el.dataset.id);
          if (!c) return;
          const price = priceOf(c.part);
          if (coins() < price) { B.Audio.play('wrong'); B.UI.toast('💰 Altının yetmiyor! Görev ve harekâtlardan kazan.'); return; }
          if (B.Avatar.wardrobeFull && B.Avatar.wardrobeFull()) { B.Audio.play('wrong'); B.UI.toast('👗 Dolabın dolu! Dolap\'tan "Genişlet" ile büyüt ya da eşya sat.'); return; }
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
              shell();
            },
          });
        });
      }

      shell();
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
