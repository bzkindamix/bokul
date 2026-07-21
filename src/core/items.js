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

  /* YUVA eşyaları: hayvanın "evi" (kafes/akvaryum/kulübe/yuva/teraryum...). Bunlar
   * sahiplenmede HARCANMAZ (hayvan içinde yaşar) ve ODAYA KONULABİLİR (room item).
   * Sarf malzemeleri (kum/mama/tasma/talaş/lamba/tırmalama) ise sahiplenmede harcanır. */
  const HABITATS = ['kafes', 'akvaryum', 'kopek_kulubesi', 'kus_yuvasi', 'hamster_kafesi',
                    'tavsan_yuvasi', 'teraryum', 'buyuk_kafes', 'kirpi_yuvasi', 'kedi_evi'];

  B.Items = {
    ensure() { inv(); },
    catalog() { return data().items; },
    categories() { return data().categories; },
    /* Yuva mı? (sahiplenmede korunur + odaya konulabilir) */
    isHabitat(id) { return HABITATS.indexOf(id) >= 0; },
    /* Odaya yerleştirilebilir mi? ('oda' kategorisi VEYA yuva eşyası) */
    isRoomItem(id) { const it = B.Items.get(id); return !!it && (it.cat === 'oda' || B.Items.isHabitat(id)); },
    get(id) {
      const it = data().items.find(x => x.id === id);
      if (it) return it;
      // Blueprint'ler de depoda "item" gibi durur (satılabilir, öğrenilebilir; satın ALINAMAZ)
      if (B.Blueprints) {
        const bp = B.Blueprints.get(id);
        if (bp) return { id: bp.id, name: bp.name + ' Taslağı', icon: bp.icon, rarity: 'legendary', cat: 'blueprint', desc: bp.desc, price: bp.price, blueprint: true, unique: true };
      }
      return null;
    },
    catName(cat) { if (cat === 'blueprint') return 'Taslak'; const c = data().categories.find(x => x.id === cat); return c ? c.name : cat; },
    /* Enderlik sırası (sıralama için): efsanevi en üstte */
    rarRank(r) { return { common: 0, rare: 1, epic: 2, legendary: 3 }[r || 'common'] || 0; },

    count(id) { return inv()[id] || 0; },
    have(id, n) { return (inv()[id] || 0) >= (n || 1); },
    total() { return Object.values(inv()).reduce((t, n) => t + n, 0); },

    /* ---- Depo kapasitesi (BAĞIMSIZ mekanik: altınla ya da Depo Rafı üreterek büyür) ----
     * Her farklı eşya = 1 slot (aynı eşya adetlenir, yeni slot açmaz).
     * Kapasite = 16 + depoLevel*4. depoLevel: (a) Depom'da altınla "Yükselt",
     * (b) Atölye'de "Depo Rafı" üret — ikisi de depoLevel'ı artırır. Oyuncu SEVİYESİNDEN bağımsız. */
    depoLevel() { return (B.State.data.player && B.State.data.player.depoLevel) || 0; },
    capacity() { return 16 + B.Items.depoLevel() * 4; },
    /* Depo yükseltme TAVANI = karakter seviyesi. Her karakter seviyesi 1 depo
     * yükseltme hakkı açar; tavana gelince önce seviye atlamak gerekir. */
    maxDepoLevel() { return (B.State.data.player && B.State.data.player.level) || 1; },
    canUpgradeDepo() { return B.Items.depoLevel() < B.Items.maxDepoLevel(); },

    /* İki yükseltme yolu (v0.92 dengesi — "satın al ya da topla"):
     *  1) ALTIN — maliyet = ham madde paketinin ADİL DEĞERİ (aşağıdaki depoUpgradeCost).
     *  2) HAM MADDE toplayarak — altını HİÇ harcamaz (emek = indirim).
     * Böylece altınla yapmak toplamaktan HEP pahalıdır ve arbitraj açığı yoktur.
     * (NOT: eski v0.90 "%30 ucuz" /0.7 çarpanı v0.92'de KALDIRILDI — artık eşit fiyat, indirim emekle gelir.) */
    depoMaterials() {
      const L = B.Items.depoLevel();
      return { tahta: 8 + L * 6, metal: 5 + L * 4, cam: 4 + L * 3, vida: 10 + L * 8, boya: 3 + L * 2 };
    },
    depoMaterialsValue() {
      const m = B.Items.depoMaterials(); let v = 0;
      for (const k in m) { const it = B.Items.get(k); v += (it ? (it.price || 0) : 0) * m[k]; }
      return v;
    },
    /* ALTIN maliyeti = ham madde paketinin ADİL DEĞERİ. Yani "satın al ya da topla":
     * altınla yapmak = malzemeyi satın almak (aynı fiyat), malzemeyi OYUNLA TOPLAMAK ise
     * altını hiç harcamaz (emek = indirim). Böylece altınla yapmak toplamaktan HEP pahalı
     * kalır ve "ucuza malzeme alıp altın yolunu delme" açığı kapanır. */
    depoUpgradeCost() { return B.Items.depoMaterialsValue(); },
    depoMaterialsMissing() {
      const m = B.Items.depoMaterials(); const out = [];
      for (const k in m) { const have = B.Items.count(k); if (have < m[k]) { const it = B.Items.get(k) || { name: k, icon: '❔' }; out.push({ id: k, name: it.name, icon: it.icon, have, need: m[k] }); } }
      return out;
    },
    upgradeDepo() { // ALTIN yolu (pahalı)
      if (!B.Items.canUpgradeDepo()) return { ok: false, err: 'Depo bu karakter seviyesi için maks. — önce seviye atla!', maxed: true };
      const cost = B.Items.depoUpgradeCost();
      if ((B.State.data.player.coins || 0) < cost) return { ok: false, err: 'Altının yetmiyor! Görev ve harekâtlardan kazan.' };
      if (!B.Reward.spendCoins(cost)) return { ok: false, err: 'Altının yetmiyor!' };
      const p = B.State.data.player; p.depoLevel = (p.depoLevel || 0) + 1;
      B.Save.saveSoon();
      return { ok: true, level: p.depoLevel, cap: B.Items.capacity() };
    },
    upgradeDepoWithMaterials() { // HAM MADDE yolu (%30 ucuz)
      if (!B.Items.canUpgradeDepo()) return { ok: false, err: 'Depo bu karakter seviyesi için maks. — önce seviye atla!', maxed: true };
      const missing = B.Items.depoMaterialsMissing();
      if (missing.length) return { ok: false, err: 'Ham maddelerin eksik.', missing };
      const m = B.Items.depoMaterials();
      for (const k in m) B.Items.remove(k, m[k]);
      const p = B.State.data.player; p.depoLevel = (p.depoLevel || 0) + 1;
      B.Save.saveSoon();
      return { ok: true, level: p.depoLevel, cap: B.Items.capacity() };
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
    /* Depoyu sırala + baştan sıkıştır (boşlukları kapatır). key: 'name'|'rarity'|'cat' */
    sortSlots(key) {
      const owned = B.Items.ownedList();
      const nm = (o) => (o.item.name || '').toLocaleLowerCase('tr');
      const cmp = {
        name: (a, b) => nm(a).localeCompare(nm(b), 'tr'),
        rarity: (a, b) => B.Items.rarRank(b.item.rarity) - B.Items.rarRank(a.item.rarity) || nm(a).localeCompare(nm(b), 'tr'),
        cat: (a, b) => (a.item.cat || '').localeCompare(b.item.cat || '', 'tr') || nm(a).localeCompare(nm(b), 'tr'),
      }[key] || (() => 0);
      owned.sort(cmp);
      const slots = B.Items.slotArray();
      for (let i = 0; i < slots.length; i++) slots[i] = null;
      owned.forEach((o, i) => { if (i < slots.length) slots[i] = o.item.id; });
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
    /* Bir eşyanın SATIŞ değeri (tek kaynak — hem sell hem UI kullanır).
     * Fiyatlı eşya → alışın %40'ı. Fiyatsız (craft ürünü / junk) → hurda ya da NADİRLİK değeri.
     * Böylece "epik akvaryum 1 altın" çelişkisi kalkar; değerler craft maliyetinin çok altında
     * kaldığı için arbitraj (craftla-sat-kâr) yine imkansız. */
    sellValue(idOrItem) {
      const it = (idOrItem && typeof idOrItem === 'object') ? idOrItem : B.Items.get(idOrItem);
      if (!it) return 1;
      const RV = { common: 5, rare: 20, epic: 50, legendary: 100 };
      const base = it.price ? Math.round(it.price * 0.4) : (it.scrap || RV[it.rarity] || 1);
      return Math.max(1, base);
    },
    sell(id) {
      const it = B.Items.get(id);
      if (!it || B.Items.count(id) <= 0) return { ok: false, err: 'Bu eşya sende yok.' };
      const price = B.Items.sellValue(it);
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
