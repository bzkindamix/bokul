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
      let cat = 'all';
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

      /* ---- 🏪 Mağaza ---- */
      function renderShop(body) {
        babaSays('shop', '🛒', 'Burası Mağaza! Kazandığın altınla eşya alırsın; aldıkların Depom\'a gider. Ham malzemeleri (tahta, cam, metal…) buradan al, sonra 🔨 Atölye\'de birleştirip yeni şeyler ÜRET. İpucu: bir eşyanın üstüne dokun, "emin misin?" diye sorar.');
        const buyable = B.Items.catalog().filter(it => !it.craftOnly);
        const cats = B.Items.categories().filter(c => buyable.some(it => it.cat === c.id));
        const filterRow = '<div class="store-cats">' +
          '<button class="chip scat" data-c="all">Hepsi</button>' +
          cats.map(c => '<button class="chip scat" data-c="' + c.id + '">' + c.icon + ' ' + c.name + '</button>').join('') +
          '</div>';
        const items = buyable.filter(it => cat === 'all' || it.cat === cat);
        const cards = items.map(it => {
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
        body.innerHTML = filterRow + '<div class="store-grid">' + cards + '</div>';

        body.querySelectorAll('.scat').forEach(b => b.onclick = () => {
          cat = b.dataset.c;
          body.querySelectorAll('.scat').forEach(x => x.classList.toggle('tab-on', x === b));
          renderShop(body);
        });
        const active = body.querySelector('.scat[data-c="' + cat + '"]'); if (active) active.classList.add('tab-on');

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
        const filterRow = '<div class="store-cats">' +
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

      /* ---- 📦 Depom (kare-ızgara envanter, kapasite limitli, level ile büyür) ---- */
      function renderDepo(body) {
        const owned = B.Items.ownedList();
        const cap = B.Items.capacity();
        const used = owned.length;
        const overfull = used > cap;
        // Dolu hücreler (kategoriye göre sıralı) + boş hücreler kapasiteye kadar
        owned.sort((a, b) => (a.item.cat + a.item.name).localeCompare(b.item.cat + b.item.name, 'tr'));
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
          (used ? '' : '<div class="store-empty">Depon boş. Mağazadan eşya al, burada saklansın!</div>') +
          '<div class="inv-grid">' + cells + empties + '</div>' +
          (overfull ? '<div class="adm-warn">⚠️ Depo kapasiten aşıldı — seviye atla ya da eşyaları üretimde/bakımunda kullan.</div>' : '');
        // Hücreye dokun → eşya bilgisi
        body.querySelectorAll('.inv-cell.filled').forEach(c => c.onclick = () => {
          const it = B.Items.get(c.dataset.id); if (!it) return;
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
        });
      }

      shell();
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
