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
  function tiers() { return R().chestTiers || [{ min: 1, name: '', frame: '#FFD52E', coinMult: 1, itemBonus: 0, rarityBoost: 0 }]; }
  // Sandık girişini normalize et: eski kayıtlar string, yenileri { type, tier }
  function entryOf(e) { return (typeof e === 'string') ? { type: norm(e), tier: 0 } : { type: norm(e && e.type), tier: (e && e.tier) || 0 }; }
  function meta(x) { const t = (typeof x === 'string') ? norm(x) : norm(x && x.type); return cats()[t] || { name: 'Sandık', icon: '🎁', color: '#FFD52E' }; }
  function tierMeta(x) { const tier = (x && typeof x === 'object') ? (x.tier || 0) : 0; return tiers()[tier] || tiers()[0]; }
  // Oyuncunun seviyesine göre sandık kademesi (aşama ilerledikçe daha iyi sandık)
  function tierIdx() {
    const lvl = (B.State.data.player && B.State.data.player.level) || 1;
    let idx = 0; tiers().forEach((t, i) => { if (lvl >= (t.min || 1)) idx = i; });
    return idx;
  }
  // Nadirlik dağılımını yükselt (üst kademede daha iyi kozmetik şansı)
  function boostDist(dist, boost) {
    if (!boost) return dist;
    const d = Object.assign({}, dist);
    let take = Math.min(d.common || 0, boost);
    if (take > 0) { d.common -= take; }
    else { take = Math.min(d.rare || 0, boost); d.rare = (d.rare || 0) - take; }
    if (take > 0) { d.epic = (d.epic || 0) + take * 0.7; d.legendary = (d.legendary || 0) + take * 0.3; }
    return d;
  }
  function ri(range) { const a = range[0], b = range[1]; return a + Math.floor(Math.random() * (b - a + 1)); }

  function inv() {
    const i = B.State.data.inventory;
    if (!i.chests) i.chests = [];
    if (i.starBank == null) i.starBank = 0;
    return i;
  }

  /* Nadirlik dağılımından açılmamış bir kozmetik çek (yoksa alta düş).
   * Kaynak: B.Avatar.cosmeticCatalog() — kilitli GİYİLEBİLİR parçalar (görünüm hariç,
   * çünkü saç/göz rengi vb. artık ücretsiz). Cinsiyete uygun olanlardan seçilir. */
  function rollCosmetic(dist) {
    let r = Math.random() * 100, rarity = null;
    for (const k of Object.keys(dist)) { r -= dist[k]; if (r <= 0) { rarity = k; break; } }
    if (!rarity) rarity = Object.keys(dist)[0];
    const order = ['legendary', 'epic', 'rare', 'common'];
    const owned = B.State.data.inventory.cosmetics;
    const gender = (B.State.data.player.avatar || {}).gender;
    const cat = (B.Avatar && B.Avatar.cosmeticCatalog) ? B.Avatar.cosmeticCatalog() : [];
    let idx = order.indexOf(rarity); if (idx < 0) idx = order.length - 1;
    for (let i = idx; i < order.length; i++) {
      const pool = cat.filter(c => c.rarity === order[i] && !owned.includes(c.id) && B.Avatar.genderOk(c.part, gender));
      if (pool.length) { const p = pool[Math.floor(Math.random() * pool.length)]; return { id: p.id, type: p.type, rarity: p.rarity, name: p.name }; }
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
    meta, tierMeta,
    queue() { return inv().chests; },

    earn(type) {
      if (B.Demo && B.Demo.isDemo()) return; // demo: sandık kazanılamaz
      type = norm(type);
      const tier = tierIdx();
      inv().chests.push({ type: type, tier: tier });
      const m = meta(type), tm = tiers()[tier] || {};
      B.Bus.emit(B.Events.CHEST_EARNED, { chestType: type, tier: tier });
      B.UI.toast((tm.name ? tm.name + ' ' : '') + m.icon + ' ' + m.name + ' kazandın!');
      B.Save.saveSoon();
    },

    /* Kategoriye + kademeye göre ödül üret (üst kademe = daha çok altın/eşya/nadirlik) */
    roll(type, tier) {
      const t = tiers()[tier || 0] || tiers()[0] || { coinMult: 1, itemBonus: 0, rarityBoost: 0 };
      const cfg = cats()[norm(type)] || {};
      const out = { coins: Math.round(ri(cfg.coins || [20, 40]) * (t.coinMult || 1)), tier: tier || 0 };
      if (cfg.cosmetic) {
        const item = rollCosmetic(boostDist(cfg.cosmetic, t.rarityBoost || 0));
        if (item) out.item = item; else out.xpPack = 50 + (tier || 0) * 30; // her şey açıksa teselli (kademeyle artar)
      } else if (cfg.items) {
        const c = cfg.items.count || [1, 2];
        const boosted = Object.assign({}, cfg.items, { count: [c[0], (c[1] || c[0]) + (t.itemBonus || 0)] });
        out.items = rollItems(boosted);
      }
      // 📐 Nadir sandık: blueprint'ler SATIN ALINAMAZ — buradan (ve hobi kurslarından) düşer.
      if (norm(type) === 'nadir' && B.Blueprints) {
        const avail = B.Blueprints.all().filter(b => !B.Blueprints.isLearned(b.id) && (!B.Items || B.Items.count(b.id) === 0));
        if (avail.length && Math.random() < 0.4) out.blueprint = avail[Math.floor(Math.random() * avail.length)].id;
      }
      return out;
    },

    /* Kuyruktaki ilk sandığı aç (tören ChestUI'da) */
    openNext() {
      const q = inv().chests;
      if (!q.length) return null;
      const e = entryOf(q.shift());
      const type = e.type, tier = e.tier;
      const result = B.Chest.roll(type, tier);
      B.Reward.addCoins(result.coins, 'chest');
      if (result.item) {
        B.State.data.inventory.cosmetics.push(result.item.id);
        B.Bus.emit(B.Events.COSMETIC_UNLOCKED, { itemId: result.item.id });
      }
      if (result.items) result.items.forEach(it => { if (B.Items) B.Items.add(it.id, it.n); });
      if (result.blueprint && B.Items) B.Items.add(result.blueprint, 1); // depoya düşer, oyuncu "Öğren" ile açar
      if (result.xpPack) B.Reward.addXp(result.xpPack, 'chest');
      B.Bus.emit(B.Events.CHEST_OPENED, { chestType: type, tier: tier, item: result.item || null });
      B.Save.saveSoon();
      return { type, tier, tierMeta: tierMeta({ tier: tier }), result };
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
