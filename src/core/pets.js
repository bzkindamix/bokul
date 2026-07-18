/* BOKUL — Evcil Hayvanlar
 * Ön koşul (craft'lanmış/satın alınmış eşyalar) sağlanınca hayvan sahiplenilir;
 * sahiplenme ön koşul eşyalarını HARCAR (o hayvanın kurulumuna adanır).
 * Her hayvan zamanla acıkır (tokluk) ve üzülür (mutluluk); bakımla düzelir.
 * Her tür farklı bakım aksiyonlarına sahiptir (besle/gezdir/oynat/şarkı...).
 * Durum: B.State.data.pets = [ { uid, type, name, tokluk, mutluluk, lastTick, cooldowns:{}, adoptedAt } ] */
(function (B) {
  function data() { return B.Content.get('pets') || { pets: [], decayPerHour: { tokluk: 6, mutluluk: 4 } }; }
  function list() { const s = B.State.data; if (!s.pets) s.pets = []; return s.pets; }
  function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }
  function now() { return Date.now(); }
  let uidSeq = 0;

  /* Zaman geçtikçe stat düşür (çürüme); okuma/bakım öncesi çağrılır */
  function refresh(pet) {
    const d = data().decayPerHour || { tokluk: 6, mutluluk: 4 };
    const t = now();
    const h = (t - (pet.lastTick || t)) / 3600000;
    if (h > 0) {
      pet.tokluk = clamp((pet.tokluk == null ? 100 : pet.tokluk) - h * d.tokluk);
      pet.mutluluk = clamp((pet.mutluluk == null ? 100 : pet.mutluluk) - h * d.mutluluk);
      pet.lastTick = t;
    }
    return pet;
  }

  B.Pets = {
    ensure() { list(); },
    intro() { return data().intro || ''; },
    types() { return data().pets || []; },
    typeDef(typeId) { return (data().pets || []).find(p => p.id === typeId) || null; },

    adopted() { return list().map(refresh); },
    get(uid) { const p = list().find(x => x.uid === uid); return p ? refresh(p) : null; },
    hasType(typeId) { return list().some(p => p.type === typeId); },

    /* Ön koşulda eksik eşyalar: [{item,name,icon,have,need}] */
    missingPrereq(typeId) {
      const def = B.Pets.typeDef(typeId); if (!def) return [];
      const out = [];
      (def.prereq || []).forEach(r => {
        const have = B.Items.count(r.item);
        if (have < r.n) {
          const it = B.Items.get(r.item) || { name: r.item, icon: '❔' };
          out.push({ item: r.item, name: it.name, icon: it.icon, have, need: r.n });
        }
      });
      return out;
    },
    canAdopt(typeId) { return !B.Pets.hasType(typeId) && B.Pets.missingPrereq(typeId).length === 0; },

    /* Sahiplen: ön koşulları HARCA, hayvanı ekle */
    adopt(typeId, name) {
      const def = B.Pets.typeDef(typeId);
      if (!def) return { ok: false, err: 'Tür bulunamadı.' };
      if (B.Pets.hasType(typeId)) return { ok: false, err: 'Bu türden zaten var.' };
      if (B.Pets.missingPrereq(typeId).length) return { ok: false, err: 'Ön koşul eşyaların eksik.' };
      (def.prereq || []).forEach(r => B.Items.remove(r.item, r.n)); // kurulum harcanır
      const pet = {
        uid: 'p' + now().toString(36) + (uidSeq++), type: typeId,
        name: (name || def.name).trim().slice(0, 14) || def.name,
        tokluk: 100, mutluluk: 100, lastTick: now(), cooldowns: {}, adoptedAt: new Date().toISOString(),
      };
      list().push(pet);
      B.Bus.emit(B.Events.PET_ADOPTED, { petId: pet.uid, type: typeId });
      B.Save.saveSoon();
      return { ok: true, pet, def };
    },

    /* Bir bakım aksiyonu kaç saat sonra tekrar yapılabilir (0 = şimdi) */
    cooldownLeft(pet, action) {
      if (!action.cooldownH) return 0;
      const last = (pet.cooldowns || {})[action.id] || 0;
      const left = (last + action.cooldownH * 3600000) - now();
      return left > 0 ? left : 0;
    },

    /* Bakım aksiyonu uygula */
    care(uid, actionId) {
      const pet = B.Pets.get(uid); if (!pet) return { ok: false, err: 'Hayvan yok.' };
      const def = B.Pets.typeDef(pet.type); if (!def) return { ok: false, err: 'Tür yok.' };
      const act = (def.care || []).find(a => a.id === actionId);
      if (!act) return { ok: false, err: 'Aksiyon yok.' };
      if (B.Pets.cooldownLeft(pet, act) > 0) return { ok: false, err: 'Biraz bekle, sonra tekrar yap.' };
      // İşe yarar mı? İlgili statlar zaten doluysa malzeme boşa harcanmasın
      if (act.restore) {
        const useful = Object.keys(act.restore).some(s => act.restore[s] > 0 && (pet[s] || 0) < 100);
        if (!useful) return { ok: false, err: (pet.name || 'O') + ' zaten gayet iyi — şimdi gerek yok.' };
      }
      // Malzeme gerekiyor mu?
      if (act.consume) {
        for (const k in act.consume) if (!B.Items.have(k, act.consume[k])) {
          const it = B.Items.get(k) || { name: k };
          return { ok: false, err: it.name + ' yok — Mağaza\'dan al.' };
        }
        for (const k in act.consume) B.Items.remove(k, act.consume[k]);
      }
      // Stat düzelt
      if (act.restore) for (const s in act.restore) pet[s] = clamp((pet[s] || 0) + act.restore[s]);
      if (act.cooldownH) { pet.cooldowns = pet.cooldowns || {}; pet.cooldowns[actionId] = now(); }
      // Ödül
      if (act.xp) B.Reward.addXp(act.xp, 'pet');
      if (act.coin) B.Reward.addCoins(act.coin, 'pet');
      B.Bus.emit(B.Events.PET_CARED, { petId: uid, action: actionId });
      B.Save.saveSoon();
      return { ok: true, pet, act };
    },

    /* Ortalama duruma göre ruh hali emojisi */
    mood(pet) {
      const avg = ((pet.tokluk || 0) + (pet.mutluluk || 0)) / 2;
      return avg >= 75 ? '😀' : avg >= 50 ? '🙂' : avg >= 25 ? '😐' : '😢';
    },
  };
})(window.BOKUL = window.BOKUL || {});
