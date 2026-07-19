/* BOKUL — Eşya Sistemi (Mağaza + Depo)
 * Çocuk altınla "gerçek dünya" eşyaları alır (konsol, tablet, akvaryum malzemesi…)
 * ve bunları Evim'deki Depom'da saklar. Bazı eşyalar tekildir (unique), bazıları
 * (evcil hayvan malzemeleri) adetlidir ve ileride craft'ta kullanılır.
 * Envanter: B.State.data.inventory.items = { itemId: adet } */
(function (B) {
  function inv() {
    const i = B.State.data.inventory;
    if (!i.items) i.items = {};
    return i.items;
  }
  function data() { return B.Content.get('items') || { categories: [], items: [] }; }

  B.Items = {
    ensure() { inv(); },
    catalog() { return data().items; },
    categories() { return data().categories; },
    get(id) { return data().items.find(x => x.id === id) || null; },
    catName(cat) { const c = data().categories.find(x => x.id === cat); return c ? c.name : cat; },

    count(id) { return inv()[id] || 0; },
    have(id, n) { return (inv()[id] || 0) >= (n || 1); },
    total() { return Object.values(inv()).reduce((t, n) => t + n, 0); },

    /* ---- Depo kapasitesi (level atladıkça artar) ----
     * Her farklı eşya = 1 slot (aynı eşya adetlenir, yeni slot açmaz).
     * Kapasite oyuncu seviyesiyle büyür: 16 + (seviye-1)*2. */
    capacity() {
      const lvl = (B.State.data.player && B.State.data.player.level) || 1;
      return 16 + (lvl - 1) * 2;
    },
    slotsUsed() { const m = inv(); return Object.keys(m).filter(k => m[k] > 0).length; },
    isFull() { return B.Items.slotsUsed() >= B.Items.capacity(); },
    /* Bu eşya depoya SIĞAR mı? (var olan eşya adetlenir → hep sığar; yeni eşya slot ister) */
    fits(id) { return B.Items.count(id) > 0 || !B.Items.isFull(); },
    ownedList() {
      const m = inv();
      return Object.keys(m).filter(k => m[k] > 0)
        .map(k => ({ item: B.Items.get(k), count: m[k] }))
        .filter(x => x.item);
    },

    /* ---- Konumsal depo yerleşimi (Arc Raiders gibi: boşluklu, kalıcı) ----
     * inventory.slots[i] = itemId (boş hücre = null). Her farklı eşya TAM bir
     * hücrede durur (aynı eşya adetlenir); oyuncu istediği hücreye, aralarında
     * BOŞLUK bırakarak koyabilir. Çıkıp girince eşya en son bıraktığı hücrede kalır. */
    slotArray() {
      const i = B.State.data.inventory;
      if (!Array.isArray(i.slots)) i.slots = [];
      return i.slots;
    },
    /* Slot'ları sahip olunan eşyalarla uyumla: artık olmayanları temizle,
     * henüz yerleşmemiş (yeni alınan) eşyaları ilk BOŞ hücreye koy. Konumları korur. */
    syncSlots() {
      const invItems = inv();
      const slots = B.Items.slotArray();
      const cap = B.Items.capacity();
      const ownedIds = Object.keys(invItems).filter(k => invItems[k] > 0);
      const ownedSet = {}; ownedIds.forEach(id => { ownedSet[id] = true; });
      while (slots.length < cap) slots.push(null);
      // kapasite küçüldüyse taşan eşyaları topla; sahip olunmayanları temizle
      const overflow = [];
      for (let i = 0; i < slots.length; i++) {
        if (i >= cap && slots[i]) { overflow.push(slots[i]); slots[i] = null; }
        else if (slots[i] && !ownedSet[slots[i]]) slots[i] = null;
      }
      if (slots.length > cap) slots.length = cap;
      const placed = {}; slots.forEach(id => { if (id) placed[id] = true; });
      const toPlace = ownedIds.filter(id => !placed[id]);
      overflow.forEach(id => { if (ownedSet[id] && !placed[id] && toPlace.indexOf(id) < 0) toPlace.push(id); });
      toPlace.forEach(id => {
        let idx = slots.indexOf(null);
        if (idx < 0) { if (slots.length < cap) { idx = slots.length; slots.push(null); } else return; }
        slots[idx] = id; placed[id] = true;
      });
      return slots;
    },
    /* i. hücredeki eşya {item,count} ya da null */
    cellItem(i) {
      const id = B.Items.slotArray()[i];
      if (!id) return null;
      const it = B.Items.get(id); if (!it) return null;
      return { item: it, count: B.Items.count(id) };
    },
    /* from ve to hücrelerini takas et (to boşsa taşı) — konumsal sürükle-bırak */
    moveSlot(from, to) {
      const slots = B.Items.slotArray();
      if (from === to || from < 0 || to < 0 || from >= slots.length || to >= slots.length) return;
      const a = slots[from] || null, b = slots[to] || null;
      slots[to] = a; slots[from] = b;
      B.Save.saveSoon();
    },

    /* ---- Günlük stok (her eşyanın günlük satın alma limiti; gün bitince yenilenir) ---- */
    stockMax(id) { const it = B.Items.get(id); if (!it) return 0; return { common: 8, rare: 5, epic: 3, legendary: 2 }[it.rarity || 'common'] || 5; },
    dailyBox() {
      const d = B.State.data, today = new Date().toISOString().slice(0, 10);
      if (!d.shopDaily || d.shopDaily.date !== today) d.shopDaily = { date: today, bought: {} };
      return d.shopDaily;
    },
    stockLeft(id) { return Math.max(0, B.Items.stockMax(id) - (B.Items.dailyBox().bought[id] || 0)); },

    /* Satış: eşyayı %60 ucuza sat (alış fiyatının %40'ı geri döner) */
    sell(id) {
      const it = B.Items.get(id);
      if (!it || B.Items.count(id) <= 0) return { ok: false, err: 'Bu eşya sende yok.' };
      const price = Math.max(1, Math.round((it.price || 0) * 0.4));
      B.Items.remove(id, 1);
      if (B.Reward && B.Reward.addCoins) B.Reward.addCoins(price, 'sell');
      B.Save.saveSoon();
      return { ok: true, item: it, coins: price };
    },

    /* Craft ve ödül sistemleri için düşük seviye ekle/çıkar */
    add(id, n) { const m = inv(); m[id] = (m[id] || 0) + (n || 1); B.Save.saveSoon(); },
    remove(id, n) {
      const m = inv(); m[id] = Math.max(0, (m[id] || 0) - (n || 1));
      if (!m[id]) delete m[id]; B.Save.saveSoon();
    },

    /* Mağazadan satın al */
    buy(id) {
      const it = B.Items.get(id);
      if (!it) return { ok: false, err: 'Eşya bulunamadı.' };
      if (it.unique && B.Items.count(id) > 0) return { ok: false, err: 'Bu eşya zaten sende var.' };
      if (!it.unique && B.Items.stockLeft(id) <= 0) return { ok: false, err: 'Bugünkü stok bitti! Yarın tazelenir.' };
      if (!B.Items.fits(id)) return { ok: false, err: 'Depon dolu! Seviye atlayınca depo büyür ya da eşya üretip kullan.' };
      if (!B.Reward.spendCoins(it.price)) return { ok: false, err: 'Altının yetmiyor! Görev ve harekâtlardan kazan.' };
      B.Items.add(id, 1);
      if (!it.unique) { const b = B.Items.dailyBox(); b.bought[id] = (b.bought[id] || 0) + 1; }
      B.Bus.emit(B.Events.ITEM_BOUGHT || 'item-bought', { itemId: id });
      return { ok: true, item: it };
    },
  };
})(window.BOKUL = window.BOKUL || {});
