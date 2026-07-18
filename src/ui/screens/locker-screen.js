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
      { id: 'photo', name: '📷 Fotoğraf' },
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

      function buy(item) {
        const price = prices[item.rarity] || 50;
        if (!B.Reward.spendCoins(price)) { B.UI.toast('💰 Altının yetmiyor! Görev ve harekâtlardan kazan.'); return false; }
        B.State.data.inventory.cosmetics.push(item.id);
        B.Bus.emit(B.Events.COSMETIC_UNLOCKED, { itemId: item.id });
        B.Audio.play('chest');
        B.UI.toast('✨ ' + item.name + ' satın alındı!');
        return true;
      }

      function sell(item) {
        const price = Math.round((prices[item.rarity] || 50) * sellRatio);
        const inv = B.State.data.inventory;
        const i = inv.cosmetics.indexOf(item.id);
        if (i < 0) return;
        inv.cosmetics.splice(i, 1);
        // Takılıysa slotu varsayılana döndür
        B.State.data.player.avatar = B.Avatar.unequipCosmetic(B.State.data.player.avatar, item);
        B.Reward.addCoins(price, 'sell');
        B.Bus.emit(B.Events.COSMETIC_SOLD, { itemId: item.id, coins: price });
        B.Audio.play('tick');
        B.UI.toast('💰 ' + item.name + ' satıldı: +' + price + ' Altın');
        B.Save.saveSoon();
        render();
      }

      /* Parça kartı: önizleme = o parça takılı mini avatar */
      function partCard(part, apply, isEquipped) {
        const a = av(); a.usePhoto = false; apply(a, part);
        const cosmetic = part.cosmeticId ? R.cosmetics.find(c => c.id === part.cosmeticId) : null;
        const unlocked = B.Avatar.isUnlocked(part);
        const card = document.createElement('button');
        card.className = 'part-card' + (isEquipped ? ' part-on' : '') + (unlocked ? '' : ' part-locked');
        card.innerHTML =
          '<span class="part-prev">' + B.Avatar.svg(a) + '</span>' +
          '<span class="part-name">' + (part.name || '') + '</span>' +
          (!unlocked && cosmetic ? '<span class="part-price">💰 ' + (prices[cosmetic.rarity] || 50) + '</span>' : '');
        card.onclick = () => {
          B.Audio.play('tick');
          if (!unlocked) { if (!buy(cosmetic)) return; }
          const cur = av(); cur.usePhoto = false; apply(cur, part);
          commit(cur);
        };
        return card;
      }

      function grid(parts, apply, equippedCheck) {
        const g = document.createElement('div'); g.className = 'part-grid';
        parts.forEach(p => g.appendChild(partCard(p, apply, equippedCheck(p))));
        return g;
      }

      function renderTab() {
        const a = av();
        const host = right.querySelector('.locker-parts');
        host.innerHTML = '';

        if (tab === 'hair') {
          // Saç modelleri oyuncunun cinsiyetine göre süzülür
          host.appendChild(grid(B.Avatar.hairsFor(a.gender), (x, p) => { x.hair = p.id; }, p => p.id === a.hair));
        } else if (tab === 'outfit') {
          // Kıyafetler cinsiyete göre süzülür
          host.appendChild(grid(B.Avatar.outfitsFor(a.gender), (x, p) => { x.outfit = p.id; }, p => p.id === a.outfit));
        } else if (tab === 'face') {
          host.appendChild(grid(C.eyes, (x, p) => { x.eyes = p.id; }, p => p.id === a.eyes));
          host.appendChild(grid(C.mouths, (x, p) => { x.mouth = p.id; }, p => p.id === a.mouth));
          host.appendChild(grid(C.skins.map(s => ({ ...s, name: 'Ten' })), (x, p) => { x.skin = p.id; }, p => p.id === a.skin));
        } else if (tab === 'color') {
          const l1 = document.createElement('div'); l1.className = 'part-label'; l1.textContent = '💇 SAÇ RENGİ'; host.appendChild(l1);
          host.appendChild(grid(C.hairColors, (x, p) => { x.hairColor = p.id; }, p => p.id === a.hairColor));
          const l2 = document.createElement('div'); l2.className = 'part-label'; l2.textContent = '👁️ GÖZ RENGİ'; host.appendChild(l2);
          host.appendChild(grid(C.eyeColors, (x, p) => { x.eyeColor = p.id; }, p => p.id === a.eyeColor));
        } else if (tab === 'acc') {
          host.appendChild(grid(C.accs, (x, p) => { x.acc = p.id; }, p => p.id === a.acc));
        } else if (tab === 'ring') {
          host.appendChild(grid(C.rings, (x, p) => { x.ring = p.id; }, p => p.id === a.ring));
        } else if (tab === 'sell') {
          renderSell(host);
        } else if (tab === 'photo') {
          renderPhoto(host, a);
        }
      }

      /* Satış: sahip olunan giyilebilir kozmetikler (ünvan hariç) */
      function renderSell(host) {
        const owned = R.cosmetics.filter(c =>
          c.type !== 'title' && B.State.data.inventory.cosmetics.includes(c.id));
        if (!owned.length) {
          host.innerHTML = '<div class="photo-panel"><p>Henüz satılık kıyafetin yok Komutan. Sandıklardan ve dükkândan kazan, sonra satarsın!</p></div>';
          return;
        }
        const g = document.createElement('div'); g.className = 'part-grid';
        owned.forEach(item => {
          const pid = B.Avatar.partIdFor(item);
          const a = av(); a.usePhoto = false; if (pid != null) a[item.type] = pid;
          const price = Math.round((prices[item.rarity] || 50) * sellRatio);
          const card = document.createElement('button');
          card.className = 'part-card part-sell';
          card.innerHTML =
            '<span class="part-prev">' + B.Avatar.svg(a) + '</span>' +
            '<span class="part-name">' + item.name + '</span>' +
            '<span class="part-price">Sat: 💰 ' + price + '</span>';
          card.onclick = () => sell(item);
          g.appendChild(card);
        });
        host.appendChild(g);
      }

      function renderPhoto(host, a) {
        host.innerHTML =
          '<div class="photo-panel">' +
            '<p>Fotoğrafın <b>sadece bu cihazda</b> kalır, hiçbir yere gönderilmez. 📵</p>' +
            '<input type="file" id="photo-input" accept="image/*" class="photo-input">' +
            '<div class="photo-btns">' +
              '<button class="btn btn-action" id="photo-pick">📷 Fotoğraf Seç</button>' +
              (a.photo ? '<button class="btn btn-quiet" id="photo-toggle">' + (a.usePhoto ? '🎨 Çizim avatara dön' : '🖼️ Fotoğrafı avatar yap') + '</button>' : '') +
              (a.photo ? '<button class="btn btn-quiet" id="photo-remove">🗑️ Fotoğrafı sil</button>' : '') +
            '</div>' +
          '</div>';
        const input = host.querySelector('#photo-input');
        host.querySelector('#photo-pick').onclick = () => input.click();
        input.onchange = () => {
          const file = input.files && input.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const img = new Image();
            img.onload = () => {
              const cv = document.createElement('canvas');
              cv.width = cv.height = 160;
              const s = Math.min(img.width, img.height);
              cv.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 160, 160);
              const cur = av();
              cur.photo = cv.toDataURL('image/jpeg', 0.82);
              cur.usePhoto = true;
              commit(cur);
              B.UI.toast('📷 Fotoğraf avatarın oldu!');
            };
            img.src = reader.result;
          };
          reader.readAsDataURL(file);
        };
        const tg = host.querySelector('#photo-toggle');
        if (tg) tg.onclick = () => { const cur = av(); cur.usePhoto = !cur.usePhoto; commit(cur); };
        const rm = host.querySelector('#photo-remove');
        if (rm) rm.onclick = () => { const cur = av(); cur.photo = null; cur.usePhoto = false; commit(cur); };
      }

      function render() {
        const p = B.State.data.player;
        left.innerHTML =
          '<div class="locker-preview">' + B.Avatar.el(p.avatar, 'avatar-big') + '</div>' +
          '<div class="locker-name">' + (p.name || 'İsimsiz Asker') + '</div>' +
          '<div class="chip">💰 ' + (p.coins || 0) + ' Altın</div>' +
          (onboarding ? '<button class="btn btn-action locker-done">DEVAM ▶</button>' : '');
        if (onboarding) {
          left.querySelector('.locker-done').onclick = () => {
            B.Save.saveNow();
            if (!B.State.data.meta.introSeen) B.UI.show('intro', {});
            else B.UI.show('home');
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
