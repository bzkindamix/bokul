/* BOKUL — Odam (oda editörü)
 * Sahip olunan 'oda' eşyalarını odaya sürükleyerek yerleştir; duvar rengi/kağıdı ve
 * zemin seç. Başlangıçta gelen hurda eşyaları hurdaya satılabilir (yerine güzel eşya al). */
(function (B) {
  const WALLS = [
    '#2A1F55', '#3a2470', '#1E3A5F', '#5B3FA8', '#7A2E5E', '#2E5E4E',
    'linear-gradient(180deg,#3a2470,#241850)',
    'repeating-linear-gradient(90deg,#2A1F55 0 22px,#31245F 22px 44px)',
    'radial-gradient(circle at 30% 20%, #4a2e8a, #241850)',
  ];
  const FLOORS = ['#4A3690', '#6B4423', '#3E3060', '#8C5A32', '#2E4E5E', '#5A4A2E', '#7A2E5E'];

  // Eşya görsel boyutu (px) — gerçek dünyadaki orana yakın (mobilya büyük, küçük eşya küçük)
  const ITEM_SIZE = {
    koltuk: 48, masa: 44, kitaplik: 46, tv: 48, sehpa: 32, lego: 36, saksi: 34, robot: 40,
    konsol: 30, tablet: 26, telefon: 24, kulaklik: 26, vr: 30, dizustu: 32, drone: 32, hali: 54,
    eski_sandalye: 40, kirik_dolap: 46, yirtik_hali: 52, bos_kutu: 36,
    poster: 46, poster_uzay: 46, lamba: 38,
    pencere: 44, tablo: 40, ahsap_raf: 48, yatak: 56, vitrin: 13,
  };
  // Duvara asılanlar (poster, pencere, tablo, tavan lambası/disko) — gerisi yere oturur
  const WALL_ITEMS = ['poster', 'poster_uzay', 'lamba', 'pencere', 'tablo'];
  const sizeOf = id => ITEM_SIZE[id] || 46;
  const isWall = id => WALL_ITEMS.indexOf(id) >= 0;
  // Yerleşim bölgeleri (%): yer eşyaları tabanı zeminde, duvar eşyaları duvarda
  const clampY = (id, y) => isWall(id) ? Math.max(6, Math.min(58, y)) : Math.max(68, Math.min(95, y));

  B.UI.registerScreen('room', {
    enter(root) {
      const hud = B.UI.buildHud(root, { backTo: 'evim' });
      this._hud = hud;
      const p = B.State.data.player;
      const room = p.room = p.room || { wall: 0, floor: 0, placed: [] };
      if (!Array.isArray(room.placed)) room.placed = [];
      // Eski yerleşimleri mantıklı bölgeye oturt (yer eşyası zeminde, duvar eşyası duvarda)
      room.placed.forEach(pp => { pp.y = clampY(pp.id, pp.y); });
      let tab = 'items';
      let selected = -1; // seçili eşya (büyült/küçült için)

      const save = () => B.Save.saveSoon();
      const itemDef = id => B.Items.get(id) || { icon: '📦', name: id };
      const ownedRoom = () => { const inv = B.State.data.inventory.items || {}; return B.Items.catalog().filter(it => B.Items.isRoomItem(it.id) && (inv[it.id] || 0) > 0); };
      const isPlaced = id => room.placed.some(pp => pp.id === id);

      const wrap = document.createElement('div'); wrap.className = 'room-wrap'; root.appendChild(wrap);
      wrap.innerHTML =
        '<div class="room-view"><div class="room-wall"></div><div class="room-floor"></div>' +
          '<div class="room-items"></div><div class="room-hint2">👆 Sürükle · dokun→seç (büyült/küçült)</div></div>' +
        '<div class="room-toolbar" hidden></div>' +
        '<div class="room-tabs">' +
          '<button class="chip rtab" data-t="items">🛋️ Eşyalarım</button>' +
          '<button class="chip rtab" data-t="wall">🖼️ Duvar</button>' +
          '<button class="chip rtab" data-t="floor">▦ Zemin</button>' +
        '</div><div class="room-panel"></div>';
      const view = wrap.querySelector('.room-view');
      const wallEl = wrap.querySelector('.room-wall');
      const floorEl = wrap.querySelector('.room-floor');
      const itemsEl = wrap.querySelector('.room-items');
      const panel = wrap.querySelector('.room-panel');
      const toolbar = wrap.querySelector('.room-toolbar');

      function applyRoom() {
        wallEl.style.background = WALLS[room.wall] || WALLS[0];
        floorEl.style.background = FLOORS[room.floor] || FLOORS[0];
      }

      // Başarı vitrini: kazanılan rozetleri sergiler (özel iç render)
      function vitrinInner() {
        const owned = (B.Badges ? B.Badges.ownedList() : []);
        const cells = owned.slice(0, 9).map(b => '<span class="vit-b" title="' + (b.name || '') + '">' + b.icon + '</span>').join('');
        return '<span class="obj-shadow"></span><span class="vit-box"><span class="vit-cap">🏆 Başarılarım</span>' +
          '<span class="vit-grid">' + (cells || '<span class="vit-empty">Rozet yok — boss yen!</span>') + '</span></span>';
      }
      function renderPlaced() {
        itemsEl.innerHTML = room.placed.map((pp, i) => {
          const wall = isWall(pp.id);
          const fs = Math.round(sizeOf(pp.id) * (pp.s || 1)); // kişisel ölçek
          const inner = pp.id === 'vitrin' ? vitrinInner()
            : (wall ? '' : '<span class="obj-shadow"></span>') + '<span class="obj-em">' + itemDef(pp.id).icon + '</span>';
          return '<button class="room-obj ' + (wall ? 'obj-wall' : 'obj-floor') + (pp.id === 'vitrin' ? ' obj-vitrin' : '') + (selected === i ? ' obj-selected' : '') + '" data-i="' + i + '" ' +
            'style="left:' + pp.x + '%;top:' + pp.y + '%;font-size:' + fs + 'px">' + inner + '</button>';
        }).join('');
        itemsEl.querySelectorAll('.room-obj').forEach(attachDrag);
        renderToolbar();
      }

      /* Seçili eşya için büyült/küçült/kaldır araç çubuğu */
      function renderToolbar() {
        if (selected < 0 || !room.placed[selected]) { toolbar.hidden = true; toolbar.innerHTML = ''; return; }
        const pp = room.placed[selected];
        const pct = Math.round((pp.s || 1) * 100);
        toolbar.hidden = false;
        toolbar.innerHTML =
          '<span class="rtb-name">' + itemDef(pp.id).icon + ' ' + itemDef(pp.id).name + '</span>' +
          '<div class="rtb-btns">' +
            '<button class="chip rtb-small">🔍➖ Küçült</button>' +
            '<span class="rtb-pct">' + pct + '%</span>' +
            '<button class="chip rtb-big">🔍➕ Büyült</button>' +
            '<button class="chip rtb-del">🗑️ Kaldır</button>' +
            '<button class="chip rtb-close">✕</button>' +
          '</div>';
        toolbar.querySelector('.rtb-small').onclick = () => resize(-0.15);
        toolbar.querySelector('.rtb-big').onclick = () => resize(0.15);
        toolbar.querySelector('.rtb-del').onclick = () => removeFromRoom(selected);
        toolbar.querySelector('.rtb-close').onclick = () => { selected = -1; renderPlaced(); };
      }

      function resize(delta) {
        const pp = room.placed[selected]; if (!pp) return;
        pp.s = Math.max(0.5, Math.min(2.4, (pp.s || 1) + delta));
        B.Audio.play('tick'); save(); renderPlaced();
      }

      function selectObj(i) { selected = (selected === i ? -1 : i); renderPlaced(); }

      function attachDrag(el) {
        const i = +el.dataset.i;
        el.addEventListener('pointerdown', e => {
          e.preventDefault();
          let moved = false;
          el.setPointerCapture(e.pointerId); el.classList.add('dragging');
          const rect = view.getBoundingClientRect();
          const id = room.placed[i].id;
          const move = ev => {
            moved = true;
            let x = (ev.clientX - rect.left) / rect.width * 100;
            let y = (ev.clientY - rect.top) / rect.height * 100;
            x = Math.max(6, Math.min(94, x)); y = clampY(id, y); // yer/duvar bölgesine sınırla
            room.placed[i].x = Math.round(x); room.placed[i].y = Math.round(y);
            el.style.left = x + '%'; el.style.top = y + '%';
          };
          const up = () => {
            el.classList.remove('dragging');
            el.removeEventListener('pointermove', move);
            el.removeEventListener('pointerup', up);
            if (moved) { selected = i; save(); renderToolbar(); } else selectObj(i); // sürükle→seçili kalsın, dokun→seç
          };
          el.addEventListener('pointermove', move);
          el.addEventListener('pointerup', up);
        });
      }

      function removeFromRoom(i) {
        const pp = room.placed[i]; if (!pp) return;
        B.UI.confirm({
          icon: '🛋️', title: itemDef(pp.id).name + ' kaldırılsın mı?',
          body: 'Eşya Depom\'da kalır; sadece odadan kaldırılır.', yes: 'Kaldır', no: 'Vazgeç',
          onYes: () => { room.placed.splice(i, 1); selected = -1; save(); renderPlaced(); renderPanel(); },
        });
      }

      function placeInRoom(id) {
        if (isPlaced(id)) return;
        room.placed.push({ id: id, x: 50, y: isWall(id) ? 26 : 86 }); // duvar eşyası duvarda, yer eşyası zeminde
        B.Audio.play('tick'); save(); renderPlaced(); renderPanel();
      }

      function sellJunk(it) {
        const scrap = it.scrap || 10;
        B.UI.confirm({
          icon: '💰', title: it.name + ' hurdaya satılsın mı?',
          body: 'Bu eski eşyayı satıp <b>+' + scrap + ' Altın</b> alırsın; eşya kaybolur.', yes: 'Hurdaya Sat', no: 'Vazgeç',
          onYes: () => {
            B.Items.remove(it.id, 1);
            const idx = room.placed.findIndex(pp => pp.id === it.id); if (idx >= 0) room.placed.splice(idx, 1);
            B.Reward.addCoins(scrap, 'scrap'); B.Audio.play('tick'); B.UI.toast('💰 +' + scrap + ' Altın (hurda)');
            save(); renderPlaced(); renderPanel();
          },
        });
      }

      function renderPanel() {
        if (tab === 'items') {
          const owned = ownedRoom();
          if (!owned.length) { panel.innerHTML = '<div class="dash-empty">Henüz oda eşyan yok. 🏪 Mağaza → 🛋️ Odam kategorisinden al, sonra buradan yerleştir!</div>'; return; }
          panel.innerHTML = '<div class="room-shelf-grid">' + owned.map(it => {
            const placed = isPlaced(it.id);
            return '<div class="room-shelf' + (placed ? ' shelf-on' : '') + (it.junk ? ' shelf-junk' : '') + '">' +
              '<button class="shelf-item" data-id="' + it.id + '"><span class="shelf-ic">' + it.icon + '</span>' +
                '<span class="shelf-nm">' + it.name + '</span>' +
                '<span class="shelf-act">' + (placed ? '✓ Odada (kaldır)' : '➕ Yerleştir') + '</span></button>' +
              (it.junk ? '<button class="chip shelf-sell" data-sell="' + it.id + '">💰 Hurda +' + (it.scrap || 10) + '</button>' : '') +
            '</div>';
          }).join('') + '</div>';
          panel.querySelectorAll('.shelf-item').forEach(b => b.onclick = () => {
            const id = b.dataset.id;
            if (isPlaced(id)) removeFromRoom(room.placed.findIndex(pp => pp.id === id));
            else placeInRoom(id);
          });
          panel.querySelectorAll('.shelf-sell').forEach(b => b.onclick = () => sellJunk(itemDef(b.dataset.sell)));
        } else if (tab === 'wall') {
          panel.innerHTML = '<div class="room-swatch-grid">' + WALLS.map((w, i) =>
            '<button class="room-swatch' + (i === room.wall ? ' sw-on' : '') + '" data-w="' + i + '" style="background:' + w + '"></button>').join('') + '</div>';
          panel.querySelectorAll('.room-swatch').forEach(b => b.onclick = () => { room.wall = +b.dataset.w; save(); applyRoom(); renderPanel(); B.Audio.play('tick'); });
        } else if (tab === 'floor') {
          panel.innerHTML = '<div class="room-swatch-grid">' + FLOORS.map((f, i) =>
            '<button class="room-swatch' + (i === room.floor ? ' sw-on' : '') + '" data-f="' + i + '" style="background:' + f + '"></button>').join('') + '</div>';
          panel.querySelectorAll('.room-swatch').forEach(b => b.onclick = () => { room.floor = +b.dataset.f; save(); applyRoom(); renderPanel(); B.Audio.play('tick'); });
        }
      }

      wrap.querySelectorAll('.rtab').forEach(b => b.onclick = () => {
        tab = b.dataset.t;
        wrap.querySelectorAll('.rtab').forEach(x => x.classList.toggle('rtab-on', x === b));
        renderPanel();
      });
      wrap.querySelector('.rtab').classList.add('rtab-on');
      applyRoom(); renderPlaced(); renderPanel();
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
