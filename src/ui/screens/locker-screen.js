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
      { id: 'outfit', name: '👕 Kıyafet' },
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

      /* Katalog parçasını satın al (kilit anahtarı envantere eklenir) */
      function buyPart(part) {
        if (!B.Reward.spendCoins(priceOf(part))) { B.UI.toast('💰 Altının yetmiyor! Görev ve harekâtlardan kazan.'); return false; }
        B.State.data.inventory.cosmetics.push(B.Avatar.unlockKey(part));
        B.Bus.emit(B.Events.COSMETIC_UNLOCKED, { itemId: B.Avatar.unlockKey(part) });
        B.Audio.play('chest');
        B.UI.toast('✨ ' + part.name + ' satın alındı!');
        return true;
      }

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

      /* Parça kartı: önizleme = o parça takılı mini avatar (previewFn ile önizleme özelleştirilir) */
      function partCard(part, apply, isEquipped, previewFn) {
        const a = av(); a.usePhoto = false; apply(a, part); if (previewFn) previewFn(a);
        const unlocked = B.Avatar.isUnlocked(part);
        const card = document.createElement('button');
        card.className = 'part-card' + (isEquipped ? ' part-on' : '') + (unlocked ? '' : ' part-locked');
        card.innerHTML =
          '<span class="part-prev">' + B.Avatar.svg(a) + '</span>' +
          '<span class="part-name">' + (part.name || '') + '</span>' +
          (!unlocked ? '<span class="part-price">💰 ' + priceOf(part) + '</span>' : '');
        card.onclick = () => {
          B.Audio.play('tick');
          if (!unlocked) {
            // Satın alma onayı
            B.UI.confirm({
              icon: '👕', title: (part.name || 'Bu parça') + ' alınsın mı?',
              body: '💰 ' + priceOf(part) + ' Altın karşılığında satın alıp giyeceksin.',
              yes: 'Satın al', no: 'Vazgeç',
              onYes: () => {
                if (!buyPart(part)) return;
                const cur = av(); cur.usePhoto = false; apply(cur, part);
                commit(cur);
              },
            });
            return;
          }
          const cur = av(); cur.usePhoto = false; apply(cur, part);
          commit(cur);
        };
        return card;
      }

      function grid(parts, apply, equippedCheck, previewFn) {
        const g = document.createElement('div'); g.className = 'part-grid';
        parts.forEach(p => g.appendChild(partCard(p, apply, equippedCheck(p), previewFn)));
        return g;
      }

      function renderTab() {
        const a = av();
        const host = right.querySelector('.locker-parts');
        host.innerHTML = '';

        if (tab === 'hair') {
          // Saç: hem model hem renk aynı menüde
          host.appendChild(label('💇 SAÇ MODELİ'));
          host.appendChild(grid(B.Avatar.hairsFor(a.gender), (x, p) => { x.hair = p.id; }, p => p.id === a.hair));
          host.appendChild(label('🎨 SAÇ RENGİ'));
          host.appendChild(grid(C.hairColors, (x, p) => { x.hairColor = p.id; }, p => p.id === a.hairColor));
        } else if (tab === 'outfit') {
          // Kıyafetler cinsiyete göre süzülür
          host.appendChild(grid(B.Avatar.outfitsFor(a.gender), (x, p) => { x.outfit = p.id; }, p => p.id === a.outfit));
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
          const card = document.createElement('button');
          card.className = 'part-card part-sell';
          card.innerHTML =
            '<span class="part-prev">' + B.Avatar.svg(a) + '</span>' +
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
        renderTab();
      }

      right.innerHTML =
        '<div class="locker-tabs">' +
        TABS.map(t => '<button class="chip tab-btn" data-tab="' + t.id + '">' + t.name + '</button>').join('') +
        '</div><div class="locker-parts"></div>';
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
