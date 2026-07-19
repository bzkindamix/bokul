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
      if (!B.Items.fits(id)) return { ok: false, err: 'Depon dolu! Seviye atlayınca depo büyür ya da eşya üretip kullan.' };
      if (!B.Reward.spendCoins(it.price)) return { ok: false, err: 'Altının yetmiyor! Görev ve harekâtlardan kazan.' };
      B.Items.add(id, 1);
      B.Bus.emit(B.Events.ITEM_BOUGHT || 'item-bought', { itemId: id });
      return { ok: true, item: it };
    },
  };
})(window.BOKUL = window.BOKUL || {});
