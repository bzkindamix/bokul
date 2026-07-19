/* BOKUL — Ben / Dolap Ekranı
 * Evim'in iki bölümü tek ekranda:
 *   section 'ben'   → görünüm/tip (saç modeli, yüz, renkler, fotoğraf)
 *   section 'dolap' → kıyafet (aksesuar, çerçeve) + AL / SAT
 * Onboarding (ilk kayıt) modunda 'ben' bölümüyle açılır, "ÜSSE GİR" ile devam eder.
 * Kilitli parça altınla alınır; sahip olunan kıyafet daha ucuza satılabilir. */
(function (B) {
  const TABSETS = {
    ben: [
      { id: 'hair',  name: '💇 Saç' },
      { id: 'face',  name: '🙂 Yüz' },
      { id: 'color', name: '🎨 Renk' },
    ],
    dolap: [
      { id: 'outfit', name: '👕 Üst' },
      { id: 'bottom', name: '👖 Alt' },
      { id: 'acc',    name: '🕶️ Aksesuar' },
      { id: 'ring',   name: '⭕ Çerçeve' },
      { id: 'sell',   name: '💰 Sat' },
    ],
  };

  B.UI.registerScreen('locker', {
    enter(root, params) {
      const onboarding = !!params.onboarding;
      const section = onboarding ? 'ben' : (params.section || 'ben');
      const hud = onboarding ? null : B.UI.buildHud(root, { backTo: 'evim' });
      this._hud = hud;
      const R = B.Content.get('rewards');
      const prices = R.shopPrices;
      const sellRatio = R.sellRatio || 0.4;
      const C = B.Avatar.CATALOG;
      const TABS = TABSETS[section];
      let tab = TABS[0].id;

      if (onboarding) {
        const t = document.createElement('div');
        t.className = 'map-title';
        t.textContent = '🎨 Görünümünü ayarla, ' + (B.State.data.player.name || 'asker') + '! (Saç, göz rengi, yüz...)';
        root.appendChild(t);
      }

      const layout = document.createElement('div');
      layout.className = 'locker-layout';
      root.appendChild(layout);
      const left = document.createElement('div'); left.className = 'locker-left'; layout.appendChild(left);
      const right = document.createElement('div'); right.className = 'locker-right'; layout.appendChild(right);

      const av = () => B.Avatar.normalize(B.State.data.player.avatar);
      function commit(a) { B.State.data.player.avatar = a; B.Save.saveSoon(); render(); }

      const priceOf = part => prices[part.rarity] || 50;

      /* Sahip olunan bir parçayı sat (alış fiyatının bir kısmı geri döner) */
      function sellPart(part) {
        const price = Math.round(priceOf(part) * sellRatio);
        const inv = B.State.data.inventory;
        const key = B.Avatar.unlockKey(part);
        const i = inv.cosmetics.indexOf(key);
        if (i < 0) return;
        inv.cosmetics.splice(i, 1);
        B.State.data.player.avatar = B.Avatar.unequipCosmetic(B.State.data.player.avatar, { id: key, type: part.type });
        B.Reward.addCoins(price, 'sell');
        B.Bus.emit(B.Events.COSMETIC_SOLD, { itemId: key, coins: price });
        B.Audio.play('tick');
        B.UI.toast('💰 ' + part.name + ' satıldı: +' + price + ' Altın');
        B.Save.saveSoon();
        render();
      }

      const label = txt => { const d = document.createElement('div'); d.className = 'part-label'; d.textContent = txt; return d; };

      /* Parça kartı: önizleme = o parça takılı mini avatar (previewFn ile önizleme özelleştirilir)
       * Dolapta yalnızca SAHİP OLUNAN parçalar gösterilir → kart tıklanınca doğrudan giyilir.
       * fullPrev=true → dairesel yüz yerine tam vücut önizleme (kıyafet/alt giyim için) */
      function partCard(part, apply, isEquipped, previewFn, fullPrev) {
        const a = av(); a.usePhoto = false; apply(a, part); if (previewFn) previewFn(a);
        const card = document.createElement('button');
        card.className = 'part-card rar-' + (part.rarity || 'common') + (fullPrev ? ' part-tall' : '') + (isEquipped ? ' part-on' : '');
        card.innerHTML =
          '<span class="rar-dot"></span>' +
          '<span class="part-prev">' + (fullPrev ? B.Avatar.fullBody(a) : B.Avatar.svg(a)) + '</span>' +
          '<span class="part-name">' + (part.name || '') + '</span>';
        card.onclick = () => {
          B.Audio.play('tick');
          const cur = av(); cur.usePhoto = false; apply(cur, part);
          commit(cur);
        };
        return card;
      }

      /* Grid yalnızca sahip olunan (kilidi açık) parçaları listeler.
       * Hiç sahip olunan yoksa mağaza yönlendirmesi gösterilir. */
      function grid(parts, apply, equippedCheck, previewFn, fullPrev) {
        const owned = parts.filter(p => B.Avatar.isUnlocked(p));
        const g = document.createElement('div'); g.className = 'part-grid' + (fullPrev ? ' grid-tall' : '');
        if (!owned.length) {
          g.classList.add('part-grid-empty');
          g.innerHTML = '<div class="locker-empty">Bu kategoride henüz eşyan yok.<br><small>🛒 Mağaza\'dan alabilirsin.</small></div>';
          return g;
        }
        owned.forEach(p => g.appendChild(partCard(p, apply, equippedCheck(p), previewFn, fullPrev)));
        return g;
      }

      /* Satın-alınabilir görünüm gridi (saç modeli / saç boyası): sahip olunanlar
       * doğrudan uygulanır; kilitli olanlar bağlam-içi satın alınır (mağazada değil).
       * opts: { icon, buyTitle, buyBody, yes, gotToast } — apply(avatar,item) parçayı takar. */
      function buyGrid(items, apply, isCur, opts) {
        opts = opts || {};
        const g = document.createElement('div'); g.className = 'part-grid';
        items.forEach(it => {
          const a = av(); a.usePhoto = false; apply(a, it);
          const unlocked = B.Avatar.isUnlocked(it);
          const price = prices[it.rarity] || 50;
          const card = document.createElement('button');
          card.className = 'part-card' + (isCur(it) ? ' part-on' : '') + (unlocked ? '' : ' part-locked');
          card.innerHTML =
            '<span class="part-prev">' + B.Avatar.svg(a) + '</span>' +
            '<span class="part-name">' + (it.name || '') + '</span>' +
            (unlocked ? '' : '<span class="part-price">' + (opts.icon || '💰') + ' ' + price + '</span>');
          card.onclick = () => {
            B.Audio.play('tick');
            if (!unlocked) {
              B.UI.confirm({
                icon: opts.icon || '🛍️', title: (it.name || 'Bu') + ' ' + (opts.buyTitle || 'alınsın mı?'),
                body: '💰 ' + price + ' Altın — ' + (opts.buyBody || 'alınca kalıcı açılır.'),
                yes: opts.yes || 'Satın al', no: 'Vazgeç',
                onYes: () => {
                  if (!B.Reward.spendCoins(price)) { B.Audio.play('wrong'); B.UI.toast('💰 Altının yetmiyor!'); return; }
                  B.State.data.inventory.cosmetics.push(B.Avatar.unlockKey(it));
                  if (B.Bus && B.Events && B.Events.COSMETIC_UNLOCKED) B.Bus.emit(B.Events.COSMETIC_UNLOCKED, { itemId: B.Avatar.unlockKey(it) });
                  B.Audio.play('chest');
                  B.UI.toast((opts.icon || '✨') + ' ' + (it.name || '') + ' ' + (opts.gotToast || 'alındı!'));
                  const cur = av(); apply(cur, it); commit(cur);
                },
              });
              return;
            }
            const cur = av(); apply(cur, it); commit(cur);
          };
          g.appendChild(card);
        });
        return g;
      }

      function renderTab() {
        const a = av();
        const host = right.querySelector('.locker-parts');
        host.innerHTML = '';

        if (tab === 'hair') {
          // Saç: temel modeller ücretsiz; özel modeller ✂️ ile, özel renkler 🎨 boya ile satın alınır
          host.appendChild(label('💇 SAÇ MODELİ'));
          host.appendChild(buyGrid(B.Avatar.hairsFor(a.gender), (x, it) => { x.hair = it.id; }, it => it.id === a.hair,
            { icon: '✂️', buyTitle: 'saç modeli alınsın mı?', buyBody: 'bu modeli alınca saçını istediğin zaman böyle yapabilirsin.', yes: 'Modeli al', gotToast: 'modeli alındı! Saçın değişti.' }));
          host.appendChild(label('🎨 SAÇ RENGİ'));
          host.appendChild(buyGrid(C.hairColors, (x, it) => { x.hairColor = it.id; }, it => it.id === a.hairColor,
            { icon: '🎨', buyTitle: 'saç boyası alınsın mı?', buyBody: 'bu boyayı alınca saçını istediğin zaman bu renge boyayabilirsin.', yes: 'Boyayı al', gotToast: 'boyası alındı! Saçın boyandı.' }));
        } else if (tab === 'outfit') {
          // Üst kıyafetler cinsiyete göre süzülür — tam vücut önizleme
          host.appendChild(grid(B.Avatar.outfitsFor(a.gender), (x, p) => { x.outfit = p.id; }, p => p.id === a.outfit, null, true));
        } else if (tab === 'bottom') {
          // Alt giyim (pantolon/etek/şort…) cinsiyete göre — tam vücut önizleme
          host.appendChild(grid(B.Avatar.bottomsFor(a.gender), (x, p) => { x.bottom = p.id; }, p => p.id === a.bottom, null, true));
        } else if (tab === 'face') {
          host.appendChild(label('👁️ GÖZ ŞEKLİ'));
          host.appendChild(grid(C.eyes, (x, p) => { x.eyes = p.id; }, p => p.id === a.eyes));
          host.appendChild(label('👃 BURUN'));
          host.appendChild(grid(C.noses, (x, p) => { x.nose = p.id; }, p => p.id === a.nose));
          host.appendChild(label('👂 KULAK'));
          host.appendChild(grid(C.ears, (x, p) => { x.ear = p.id; }, p => p.id === a.ear));
          host.appendChild(label('👄 AĞIZ'));
          host.appendChild(grid(C.mouths, (x, p) => { x.mouth = p.id; }, p => p.id === a.mouth));
        } else if (tab === 'color') {
          host.appendChild(label('👁️ GÖZ RENGİ'));
          // Göz rengi kartları açık gözle önizlenir (renk görünsün diye)
          host.appendChild(grid(C.eyeColors, (x, p) => { x.eyeColor = p.id; }, p => p.id === a.eyeColor,
            ap => { if (ap.eyes === 1 || ap.eyes === 2) ap.eyes = 0; }));
          host.appendChild(label('🎨 TEN RENGİ'));
          host.appendChild(grid(C.skins.map(s => ({ ...s, name: 'Ten' })), (x, p) => { x.skin = p.id; }, p => p.id === a.skin));
        } else if (tab === 'acc') {
          host.appendChild(grid(C.accs, (x, p) => { x.acc = p.id; }, p => p.id === a.acc));
        } else if (tab === 'ring') {
          host.appendChild(grid(C.rings, (x, p) => { x.ring = p.id; }, p => p.id === a.ring));
        } else if (tab === 'sell') {
          renderSell(host);
        }

        // Giyilebilir sekmelerde (üst/alt/aksesuar/çerçeve) Mağaza'ya yönlendir.
        // Görünüm sekmeleri (saç/yüz/renk) ücretsizdir → mağaza yönlendirmesi yok.
        if (['outfit', 'bottom', 'acc', 'ring'].includes(tab) && !onboarding) {
          const shopBtn = document.createElement('button');
          shopBtn.className = 'btn locker-shop';
          shopBtn.innerHTML = '🛒 Yeni kıyafet & aksesuar → Mağaza';
          shopBtn.onclick = () => { B.Audio.play('tick'); B.UI.show('store', { tab: 'kiyafet' }); };
          host.appendChild(shopBtn);
        }
      }

      /* Satış: envanterdeki sahip olunan parçalar (katalogdan çözümlenir) */
      function renderSell(host) {
        const owned = (B.State.data.inventory.cosmetics || [])
          .map(key => B.Avatar.findByUnlock(key)).filter(Boolean);
        if (!owned.length) {
          host.innerHTML = '<div class="photo-panel"><p>Henüz satılık kıyafetin yok Komutan. Sandıklardan ve dükkândan kazan, sonra satarsın!</p></div>';
          return;
        }
        const g = document.createElement('div'); g.className = 'part-grid';
        owned.forEach(found => {
          const part = Object.assign({ type: found.type, rarity: found.rarity }, found.part);
          const a = av(); a.usePhoto = false;
          const pid = found.part.id;
          if (pid != null) a[found.type] = pid;
          const price = Math.round((prices[found.rarity] || 50) * sellRatio);
          const fullPrev = found.type === 'outfit' || found.type === 'bottom';
          const card = document.createElement('button');
          card.className = 'part-card part-sell' + (fullPrev ? ' part-tall' : '');
          card.innerHTML =
            '<span class="part-prev">' + (fullPrev ? B.Avatar.fullBody(a) : B.Avatar.svg(a)) + '</span>' +
            '<span class="part-name">' + found.name + '</span>' +
            '<span class="part-price">Sat: 💰 ' + price + '</span>';
          card.onclick = () => B.UI.confirm({
            icon: '💰', title: found.name + ' satılsın mı?',
            body: 'Bu parçayı satıp <b>+' + price + ' Altın</b> alacaksın.',
            yes: 'Sat', no: 'Vazgeç',
            onYes: () => sellPart(part),
          });
          g.appendChild(card);
        });
        host.appendChild(g);
      }

      function render() {
        const p = B.State.data.player;
        left.innerHTML =
          '<div class="locker-preview">' + B.Avatar.elFull(p.avatar, 'avatar-big') + '</div>' +
          '<div class="turn-hint">👆 Çevirmek için sürükle</div>' +
          '<div class="locker-name">' + (p.name || 'İsimsiz Asker') + '</div>' +
          '<div class="chip">💰 ' + (p.coins || 0) + ' Altın</div>' +
          (onboarding ? '<button class="btn btn-action locker-done">DEVAM ▶</button>' : '');
        const turnH = left.querySelector('.locker-preview .avatar-holder');
        if (turnH) B.Avatar.turntable(turnH); // pseudo-3D döndürme
        if (onboarding) {
          left.querySelector('.locker-done').onclick = () => {
            B.Save.saveNow();
            B.UI.show('interests', { onboarding: true }); // görünüm → ilgi alanları → hikâye
          };
        }
        renderWardrobeBar();
        renderTab();
      }

      right.innerHTML =
        '<div class="wardrobe-bar"></div>' +
        '<div class="locker-tabs">' +
        TABS.map(t => '<button class="chip tab-btn" data-tab="' + t.id + '">' + t.name + '</button>').join('') +
        '</div><div class="locker-parts"></div>';

      /* Dolap kapasitesi + altınla genişletme (bağımsız mekanik) */
      function renderWardrobeBar() {
        const bar = right.querySelector('.wardrobe-bar'); if (!bar) return;
        const used = B.Avatar.wardrobeUsed(), cap = B.Avatar.wardrobeCap(), cost = B.Avatar.wardrobeCost();
        const full = used >= cap;
        bar.innerHTML =
          '<span class="wb-title">👗 Dolap</span>' +
          '<span class="wb-cap' + (full ? ' inv-warn' : '') + '">' + used + ' / ' + cap + '</span>' +
          '<button class="chip wb-up' + ((p2().coins || 0) >= cost ? '' : ' store-poor') + '">⬆️ Genişlet · 💰 ' + cost + '</button>';
        bar.querySelector('.wb-up').onclick = () => {
          const c = B.Avatar.wardrobeCost();
          if ((p2().coins || 0) < c) { B.Audio.play('wrong'); B.UI.toast('💰 Altının yetmiyor!'); return; }
          B.UI.confirm({
            icon: '👗', title: 'Dolabı genişlet?',
            body: '💰 ' + c + ' Altın karşılığında dolabın +6 yer büyür (' + cap + ' → ' + (cap + 6) + ').',
            yes: 'Genişlet', no: 'Vazgeç',
            onYes: () => {
              const r = B.Avatar.upgradeWardrobe();
              if (!r.ok) { B.Audio.play('wrong'); B.UI.toast('💰 ' + r.err); return; }
              B.Audio.play('chest'); B.UI.toast('👗 Dolap büyüdü! Yeni kapasite: ' + r.cap);
              render();
            },
          });
        };
      }
      function p2() { return B.State.data.player; }
      right.querySelectorAll('.tab-btn').forEach(b => {
        b.onclick = () => {
          tab = b.dataset.tab;
          right.querySelectorAll('.tab-btn').forEach(x => x.classList.toggle('tab-on', x === b));
          renderTab();
        };
      });
      right.querySelector('.tab-btn').classList.add('tab-on');

      render();
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
