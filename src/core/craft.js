/* BOKUL — Craft (Atölye)
 * Ham malzeme → parça → büyük eşya → ev/depo geliştirme zinciri.
 * Bir üretim birden fazla adet malzeme isteyebilir. Ürettiğin parçalar
 * başka tariflerde malzeme olur (kademeli craft). Öğretici: her tarifin
 * bir "teach" açıklaması vardır; Baba Komutan örnekle anlatır. */
(function (B) {
  function data() { return B.Content.get('recipes') || { recipes: [], tiers: [] }; }

  B.Craft = {
    intro() { return data().intro || ''; },
    tiers() { return data().tiers || []; },
    recipes() { return data().recipes || []; },
    get(id) { return data().recipes.find(r => r.id === id) || null; },

    /* NADİRLİK KURALI: craft edilen çıktı, ham maddelerinden BİR ÜST nadirlik seviyesine çıkar.
     * Tek kaynak = tarif girdileri (elle etiket sürüklemesi yok). Zincir boyunca yayılır
     * (ham madde common → panel rare → akvaryum epic → …), fixpoint ile birkaç geçişte oturur.
     * Boot'ta bir kez çağrılır; item.rarity (görsel tier) + outfit kozmetik rarity güncellenir. */
    applyCraftRarities() {
      const ORDER = ['common', 'rare', 'epic', 'legendary'];
      const rank = r => { const i = ORDER.indexOf(r || 'common'); return i < 0 ? 0 : i; };
      const recs = B.Craft.recipes();
      const rarOf = id => { // girdinin güncel nadirliği (item ya da outfit kozmetiği)
        const it = B.Items.get(id);
        if (it && it.rarity) return it.rarity;
        return 'common';
      };
      for (let pass = 0; pass < 8; pass++) {
        let changed = false;
        recs.forEach(r => {
          const p = r.produces || {};
          let maxIn = 0;
          Object.keys(r.needs || {}).forEach(k => { maxIn = Math.max(maxIn, rank(rarOf(k))); });
          const target = ORDER[Math.min(maxIn + 1, ORDER.length - 1)]; // girdilerin bir üstü
          if (p.type === 'item') {
            const out = B.Items.get(p.id);
            if (out && out.rarity !== target) { out.rarity = target; changed = true; }
          } else if (p.type === 'cosmetic' && B.Avatar && B.Avatar.setOutfitRarity) {
            B.Avatar.setOutfitRarity(p.id, target);
          }
        });
        if (!changed) break;
      }
    },

    /* Bu tarif için eksik malzemeler: [{ id, name, icon, have, need }] */
    missing(r) {
      const out = [];
      Object.keys(r.needs || {}).forEach(k => {
        const need = r.needs[k], have = B.Items.count(k);
        if (have < need) {
          const it = B.Items.get(k) || { name: k, icon: '❔' };
          out.push({ id: k, name: it.name, icon: it.icon, have, need });
        }
      });
      return out;
    },
    canCraft(r) { return B.Craft.missing(r).length === 0; },

    /* Sürükle-bırak: tezgaha konan grup {itemId:adet} hangi tarife TAM uyar?
     * (aynı malzemeler + aynı adetler). Yoksa null. */
    match(group) {
      const keys = Object.keys(group || {}).filter(k => group[k] > 0);
      if (!keys.length) return null;
      return (data().recipes || []).find(r => {
        const nk = Object.keys(r.needs || {});
        if (nk.length !== keys.length) return false;
        return nk.every(k => (group[k] || 0) === r.needs[k]);
      }) || null;
    },

    /* Üret: malzemeleri harca, ürünü ekle (eşya) veya seviyeyi yükselt (upgrade) */
    /* Bu tarif için blueprint öğrenilmiş mi? (yoksa blueprint = serbest) */
    unlocked(r) { return !B.Blueprints || B.Blueprints.recipeUnlocked(r.id); },
    /* Tarifi açan blueprint (öğrenilmemişse kilit göstermek için) */
    lockedBy(r) {
      if (!B.Blueprints) return null;
      const bp = B.Blueprints.forRecipe(r.id);
      return (bp && !B.Blueprints.isLearned(bp.id)) ? bp : null;
    },

    craft(id) {
      const r = B.Craft.get(id);
      if (!r) return { ok: false, err: 'Tarif bulunamadı.' };
      const bp = B.Craft.lockedBy(r);
      if (bp) return { ok: false, err: '🔒 Önce "' + bp.name + '" tarifini öğren — 🎓 Hobi Kursları\'ndan geç ya da 💎 nadir sandıktan düşer.', locked: true, bp };
      if (!B.Craft.canCraft(r)) return { ok: false, err: 'Malzemen eksik.' };
      const p = r.produces || {};
      // Depo Rafı üretimi de depo tavanına (karakter seviyesi) tabi
      if (p.type === 'upgrade' && p.id === 'depoLevel' && B.Items.canUpgradeDepo && !B.Items.canUpgradeDepo()) {
        return { ok: false, err: 'Depo bu karakter seviyesi için maks. — önce seviye atla!', maxed: true };
      }
      // Kıyafet craft'ı bir KOZMETİK açar → dolap doluysa (kapasite) engelle (malzeme harcanmadan)
      if (p.type === 'cosmetic') {
        const cos0 = B.State.data.inventory.cosmetics || [];
        if (cos0.indexOf(p.id) >= 0) return { ok: false, err: 'Bu kıyafet zaten dolabında.', owned: true };
        if (B.Avatar && B.Avatar.wardrobeFull && B.Avatar.wardrobeFull()) {
          return { ok: false, err: 'Dolabın dolu — önce genişlet ya da bir kıyafet sat.', wardrobeFull: true };
        }
      }
      Object.keys(r.needs).forEach(k => B.Items.remove(k, r.needs[k]));
      if (p.type === 'item') B.Items.add(p.id, p.qty || 1);
      else if (p.type === 'upgrade') {
        const pl = B.State.data.player;
        const base = (p.id === 'depoLevel') ? 0 : 1; // depoLevel 0'dan başlar (coin yoluyla tutarlı)
        pl[p.id] = (pl[p.id] || base) + (p.qty || 1);
      } else if (p.type === 'cosmetic') { // kıyafet: dolaba (kozmetik) ekle
        const cos = B.State.data.inventory.cosmetics = B.State.data.inventory.cosmetics || [];
        if (cos.indexOf(p.id) < 0) cos.push(p.id);
        B.Bus.emit(B.Events.COSMETIC_UNLOCKED, { itemId: p.id });
      }
      B.Bus.emit(B.Events.ITEM_CRAFTED, { recipeId: id });
      B.Save.saveSoon();
      return { ok: true, recipe: r };
    },
  };
})(window.BOKUL = window.BOKUL || {});
