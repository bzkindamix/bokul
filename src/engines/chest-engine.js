/* BOKUL — Sandık Motoru (v0.31: 4 KATEGORİ)
 * 4 kategori, her biri FARKLI ödül tablosu:
 *   💰 altin   → bol altın
 *   👕 kiyafet → garanti kozmetik (kıyafet/saç/aksesuar)
 *   📦 esya    → craft/pet malzemeleri (eşya sistemine bağlı)
 *   💎 nadir   → yüksek nadirlikli kozmetik + büyük altın
 * Kazanma tetikleri olaylardan; içerik rewards.json.chestCats'ten. */
(function (B) {
  // Eski tip adlarını yeni kategorilere eşle (geriye dönük uyum)
  const ALIAS = { bronze: 'altin', silver: 'esya', gold: 'kiyafet', epic: 'esya', legendary: 'nadir' };
  function norm(t) { return ALIAS[t] || t; }

  function R() { return B.Content.get('rewards'); }
  function cats() { return R().chestCats || {}; }
  function meta(type) { return cats()[norm(type)] || { name: 'Sandık', icon: '🎁', color: '#FFD52E' }; }
  function ri(range) { const a = range[0], b = range[1]; return a + Math.floor(Math.random() * (b - a + 1)); }

  function inv() {
    const i = B.State.data.inventory;
    if (!i.chests) i.chests = [];
    if (i.starBank == null) i.starBank = 0;
    return i;
  }

  /* Nadirlik dağılımından açılmamış bir kozmetik çek (yoksa alta düş) */
  function rollCosmetic(dist) {
    let r = Math.random() * 100, rarity = null;
    for (const k of Object.keys(dist)) { r -= dist[k]; if (r <= 0) { rarity = k; break; } }
    if (!rarity) rarity = Object.keys(dist)[0];
    const order = ['legendary', 'epic', 'rare', 'common'];
    const owned = B.State.data.inventory.cosmetics;
    let idx = order.indexOf(rarity); if (idx < 0) idx = order.length - 1;
    for (let i = idx; i < order.length; i++) {
      const pool = (R().cosmetics || []).filter(c => c.rarity === order[i] && !owned.includes(c.id));
      if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
    }
    return null; // her şey açık
  }

  /* Eşya havuzundan rastgele adetli eşyalar */
  function rollItems(cfg) {
    const pool = (cfg.pool || []).slice();
    const n = Math.min(pool.length, ri(cfg.count || [1, 2]));
    const out = [];
    for (let i = 0; i < n && pool.length; i++) {
      const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      const qty = ri(pick.n || [1, 1]);
      const it = B.Items ? B.Items.get(pick.id) : null;
      out.push({ id: pick.id, n: qty, name: it ? it.name : pick.id, icon: it ? it.icon : '📦' });
    }
    return out;
  }

  B.Chest = {
    meta,
    queue() { return inv().chests; },

    earn(type) {
      if (B.Demo && B.Demo.isDemo()) return; // demo: sandık kazanılamaz
      type = norm(type);
      inv().chests.push(type);
      const m = meta(type);
      B.Bus.emit(B.Events.CHEST_EARNED, { chestType: type });
      B.UI.toast(m.icon + ' ' + m.name + ' kazandın!');
      B.Save.saveSoon();
    },

    /* Kategoriye göre ödül üret */
    roll(type) {
      const cfg = cats()[norm(type)] || {};
      const out = { coins: ri(cfg.coins || [20, 40]) };
      if (cfg.cosmetic) {
        const item = rollCosmetic(cfg.cosmetic);
        if (item) out.item = item; else out.xpPack = 50; // her şey açıksa teselli
      } else if (cfg.items) {
        out.items = rollItems(cfg.items);
      }
      return out;
    },

    /* Kuyruktaki ilk sandığı aç (tören ChestUI'da) */
    openNext() {
      const q = inv().chests;
      if (!q.length) return null;
      const type = norm(q.shift());
      const result = B.Chest.roll(type);
      B.Reward.addCoins(result.coins, 'chest');
      if (result.item) {
        B.State.data.inventory.cosmetics.push(result.item.id);
        B.Bus.emit(B.Events.COSMETIC_UNLOCKED, { itemId: result.item.id });
      }
      if (result.items) result.items.forEach(it => { if (B.Items) B.Items.add(it.id, it.n); });
      if (result.xpPack) B.Reward.addXp(result.xpPack, 'chest');
      B.Bus.emit(B.Events.CHEST_OPENED, { chestType: type, item: result.item || null });
      B.Save.saveSoon();
      return { type, result };
    },

    init() {
      // 💰 Altın: toplanan her N yıldız
      B.Bus.on(B.Events.QUESTION_COMPLETED, p => {
        const i = inv();
        i.starBank += p.stars;
        const every = R().chestStarEvery || 10;
        while (i.starBank >= every) { i.starBank -= every; B.Chest.earn('altin'); }
      });
      // 👕 Kıyafet: level atlama (yeni görünüm ödülü)
      B.Bus.on(B.Events.LEVEL_UP, () => B.Chest.earn('kiyafet'));
      // 📦 Eşya (konu boss'u) / 💎 Nadir (ünite boss'u)
      B.Bus.on(B.Events.BOSS_DEFEATED, p => B.Chest.earn(p.tier === 'unit' ? 'nadir' : 'esya'));
    },
  };
})(window.BOKUL = window.BOKUL || {});
