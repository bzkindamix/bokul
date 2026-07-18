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

    /* Üret: malzemeleri harca, ürünü ekle (eşya) veya seviyeyi yükselt (upgrade) */
    craft(id) {
      const r = B.Craft.get(id);
      if (!r) return { ok: false, err: 'Tarif bulunamadı.' };
      if (!B.Craft.canCraft(r)) return { ok: false, err: 'Malzemen eksik.' };
      Object.keys(r.needs).forEach(k => B.Items.remove(k, r.needs[k]));
      const p = r.produces || {};
      if (p.type === 'item') B.Items.add(p.id, p.qty || 1);
      else if (p.type === 'upgrade') {
        const pl = B.State.data.player;
        pl[p.id] = (pl[p.id] || 1) + (p.qty || 1);
      }
      B.Bus.emit(B.Events.ITEM_CRAFTED, { recipeId: id });
      B.Save.saveSoon();
      return { ok: true, recipe: r };
    },
  };
})(window.BOKUL = window.BOKUL || {});
