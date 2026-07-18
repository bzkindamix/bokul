/* BOKUL — Sandık Motoru
 * Kazanma tetikleri olaylardan; içerik rewards.json'dan.
 * Kopya koruması: açılmamış kozmetik bitmeden aynı şey çıkmaz;
 * her şey açıldıysa XP paketi düşer. */
(function (B) {
  const TYPE_META = {
    bronze:    { name: 'Bronz Sandık',    icon: '🥉' },
    silver:    { name: 'Gümüş Sandık',    icon: '🥈' },
    gold:      { name: 'Altın Sandık',    icon: '🥇' },
    epic:      { name: 'Epik Sandık',     icon: '💎' },
    legendary: { name: 'Efsanevi Sandık', icon: '🏆' },
  };

  function R() { return B.Content.get('rewards'); }

  function inv() {
    const i = B.State.data.inventory;
    if (!i.chests) i.chests = [];
    if (i.starBank == null) i.starBank = 0;
    return i;
  }

  B.Chest = {
    meta(type) { return TYPE_META[type]; },
    queue() { return inv().chests; },

    earn(type) {
      inv().chests.push(type);
      B.Bus.emit(B.Events.CHEST_EARNED, { chestType: type });
      B.UI.toast(TYPE_META[type].icon + ' ' + TYPE_META[type].name + ' kazandın!');
      B.Save.saveSoon();
    },

    /* Nadirlik çek: drops yüzdelerinden; o nadirlikte açılmamış kozmetik yoksa alta düş */
    roll(type) {
      const drops = R().chests[type].drops;
      let r = Math.random() * 100, rarity = 'common';
      for (const k of Object.keys(drops)) { r -= drops[k]; if (r <= 0) { rarity = k; break; } }
      if (rarity === 'xpPack') return { xpPack: 50 };

      const order = ['legendary', 'epic', 'rare', 'common'];
      const owned = B.State.data.inventory.cosmetics;
      let idx = order.indexOf(rarity);
      if (idx < 0) idx = 3;
      for (let i = idx; i < order.length; i++) {
        const pool = R().cosmetics.filter(c => c.rarity === order[i] && !owned.includes(c.id));
        if (pool.length) return { item: pool[Math.floor(Math.random() * pool.length)] };
      }
      // her nadirlikte de her şey açık → tatlı teselli
      return { xpPack: 50 };
    },

    /* Kuyruktaki ilk sandığı aç, sonucu döndür (tören ChestUI'da) */
    openNext() {
      const q = inv().chests;
      if (!q.length) return null;
      const type = q.shift();
      const result = B.Chest.roll(type);
      // Her sandıktan taban altın da çıkar (dükkân ekonomisini besler)
      const baseCoins = { bronze: 20, silver: 30, gold: 50, epic: 80, legendary: 150 }[type] || 20;
      result.coins = baseCoins;
      B.Reward.addCoins(baseCoins, 'chest');
      if (result.item) {
        B.State.data.inventory.cosmetics.push(result.item.id);
        B.Bus.emit(B.Events.COSMETIC_UNLOCKED, { itemId: result.item.id });
      } else {
        B.Reward.addXp(result.xpPack, 'chest');
      }
      B.Bus.emit(B.Events.CHEST_OPENED, { chestType: type, item: result.item || null });
      B.Save.saveSoon();
      return { type, result };
    },

    init() {
      // Bronz: toplanan her 10 yıldız
      B.Bus.on(B.Events.QUESTION_COMPLETED, p => {
        const i = inv();
        i.starBank += p.stars;
        const every = R().chests.bronze.every || 10;
        while (i.starBank >= every) { i.starBank -= every; B.Chest.earn('bronze'); }
      });
      // Altın: level atlama
      B.Bus.on(B.Events.LEVEL_UP, () => B.Chest.earn('gold'));
      // Epik/Efsanevi: boss zaferleri
      B.Bus.on(B.Events.BOSS_DEFEATED, p => B.Chest.earn(p.tier === 'unit' ? 'legendary' : 'epic'));
      // Gümüş: günlük görevler v0.8'de — tetik orada bağlanacak
    },
  };
})(window.BOKUL = window.BOKUL || {});
