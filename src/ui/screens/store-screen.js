/* BOKUL — Mağaza & Depom
 * 🏪 Mağaza: altınla eşya satın al (kategori süzgeçli).
 * 📦 Depom : sahip olduğun eşyalar (adetli), Evim'de saklanır.
 * Eşyalar ileride evcil hayvan craft'ında ön koşul olur. */
(function (B) {
  B.UI.registerScreen('store', {
    enter(root, params) {
      const hud = B.UI.buildHud(root, { backTo: 'evim' });
      this._hud = hud;
      let tab = (params && params.tab) || 'shop';
      if (tab === 'craft') tab = 'shop'; // craft artık kendi ekranı (atolye)
      let cat = 'all';

      const wrap = document.createElement('div');
      wrap.className = 'store-wrap';
      root.appendChild(wrap);

      function coins() { return B.State.data.player.coins || 0; }

      function shell() {
        wrap.innerHTML =
          '<div class="store-top"><div class="chip store-gold">💰 ' + coins() + ' Altın</div></div>' +
          '<div class="store-tabs">' +
            '<button class="chip stab" data-t="shop">🏪 Mağaza</button>' +
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
          return '<button class="store-card' + (isOwnedUnique ? ' store-owned' : '') + (afford || isOwnedUnique ? '' : ' store-poor') + '" data-id="' + it.id + '"' + (isOwnedUnique ? ' disabled' : '') + '>' +
            '<span class="store-ic">' + it.icon + '</span>' +
            '<span class="store-nm">' + it.name + '</span>' +
            '<span class="store-desc">' + (it.desc || '') + '</span>' +
            (owned && !it.unique ? '<span class="store-have">Depoda: ' + owned + '</span>' : '') +
            (isOwnedUnique ? '<span class="store-tag">✓ Sende var</span>'
                           : '<span class="store-price">💰 ' + it.price + '</span>') +
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

      /* ---- 📦 Depom ---- */
      function renderDepo(body) {
        const owned = B.Items.ownedList();
        if (!owned.length) {
          body.innerHTML = '<div class="store-empty">📦 Depon boş. Mağazadan eşya al, burada saklansın!<br><small>Bazı eşyalar ileride evcil hayvan sahibi olmak için gerekli olacak.</small></div>';
          return;
        }
        // Kategoriye göre grupla
        const byCat = {};
        owned.forEach(o => { (byCat[o.item.cat] = byCat[o.item.cat] || []).push(o); });
        body.innerHTML = Object.keys(byCat).map(c =>
          '<div class="depo-cat">' + B.Items.catName(c) + '</div>' +
          '<div class="store-grid">' + byCat[c].map(o =>
            '<div class="store-card depo-card">' +
              '<span class="store-ic">' + o.item.icon + '</span>' +
              '<span class="store-nm">' + o.item.name + '</span>' +
              (o.count > 1 ? '<span class="depo-count">×' + o.count + '</span>' : '') +
            '</div>').join('') +
          '</div>'
        ).join('');
      }

      shell();
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
