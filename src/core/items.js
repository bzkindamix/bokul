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

    /* ---- Depo özel dizilişi (oyuncu hücreleri sürükleyip diler) ----
     * inventory.order = [itemId,...] oyuncunun seçtiği sıra. Sırada olmayan
     * (yeni alınan) eşyalar kategori+ad ile sona eklenir. */
    orderList() { const i = B.State.data.inventory; if (!i.order) i.order = []; return i.order; },
    orderedOwned() {
      const owned = B.Items.ownedList();
      const byId = {}; owned.forEach(o => { byId[o.item.id] = o; });
      const out = [];
      B.Items.orderList().forEach(id => { if (byId[id]) { out.push(byId[id]); delete byId[id]; } });
      Object.values(byId)
        .sort((a, b) => (a.item.cat + a.item.name).localeCompare(b.item.cat + b.item.name, 'tr'))
        .forEach(o => out.push(o));
      return out;
    },
    /* fromId eşyasını toId'nin yerine taşı (toId yoksa sona) */
    reorder(fromId, toId) {
      const ids = B.Items.orderedOwned().map(o => o.item.id);
      const from = ids.indexOf(fromId); if (from < 0) return;
      ids.splice(from, 1);
      let to = toId ? ids.indexOf(toId) : ids.length;
      if (to < 0) to = ids.length;
      ids.splice(to, 0, fromId);
      B.State.data.inventory.order = ids;
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
