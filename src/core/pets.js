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

  function capCfg() { return data().capture || { afterHours: 24, freeAt: 50 }; }

  /* Zaman geçtikçe stat düşür (çürüme); okuma/bakım öncesi çağrılır.
   * Kaçırılmışsa çürüme DURUR (Bulanık'ta donmuş). Uzun süre ihmal edilirse
   * (statlar dipte + afterHours bakımsız) Bulanık kaçırır. */
  function refresh(pet) {
    const t = now();
    if (pet.captured) { pet.lastTick = t; return pet; } // donmuş
    const d = data().decayPerHour || { tokluk: 6, mutluluk: 4 };
    const h = (t - (pet.lastTick || t)) / 3600000;
    if (h > 0) {
      pet.tokluk = clamp((pet.tokluk == null ? 100 : pet.tokluk) - h * d.tokluk);
      pet.mutluluk = clamp((pet.mutluluk == null ? 100 : pet.mutluluk) - h * d.mutluluk);
      pet.lastTick = t;
    }
    // İhmal → kaçırma: statlar dipte VE afterHours boyunca bakım yapılmadı
    if (pet.tokluk <= 2 && pet.mutluluk <= 2) {
      const since = t - (pet.lastCared || pet.adoptedTs || pet.lastTick || t);
      if (since >= (capCfg().afterHours || 24) * 3600000) {
        pet.captured = true; pet.capturedAt = t;
        B.Bus.emit(B.Events.PET_CAPTURED, { petId: pet.uid, type: pet.type });
        B.Save.saveSoon();
      }
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
    // Sahiplenme için: (1) BAKIM KURSU geçilmiş olmalı (taslak öğrenilmiş) — "önce bakmayı öğren";
    // (2) yuva + sarf malzemeleri hazır olmalı. Sarf malzemeleri (kum/mama/tasma...) HARCANIR;
    // yuva (kafes/akvaryum/kulübe...) KORUNUR ve odaya konulabilir.
    courseReady(typeId) { return !B.Blueprints || !B.Blueprints.forPet || !B.Blueprints.forPet(typeId) || B.Blueprints.petUnlocked(typeId); },
    canAdopt(typeId) { return !B.Pets.hasType(typeId) && B.Pets.courseReady(typeId) && B.Pets.missingPrereq(typeId).length === 0; },

    /* Sahiplen: bakım kursu + ön koşulları doğrula → sarf malzemelerini harca (yuva korunur) → hayvanı ekle */
    adopt(typeId, name) {
      const def = B.Pets.typeDef(typeId);
      if (!def) return { ok: false, err: 'Tür bulunamadı.' };
      if (B.Pets.hasType(typeId)) return { ok: false, err: 'Bu türden zaten var.' };
      if (!B.Pets.courseReady(typeId)) {
        const bp = B.Blueprints.forPet(typeId);
        return { ok: false, err: '🎓 Önce «' + (bp ? bp.name : (def.name + ' Bakımı')) + '» kursunu geç (Hobi Kursları).', needCourse: true };
      }
      const missing = B.Pets.missingPrereq(typeId);
      if (missing.length) return { ok: false, err: 'Önce eksik ön koşulları tamamla: ' + missing.map(m => m.name).join(', ') };
      // Ön koşulları tüket: yuva eşyaları KORUNUR (hayvanın evi, odaya konulur), sarf malzemeleri harcanır.
      (def.prereq || []).forEach(r => { if (!B.Items.isHabitat(r.item)) B.Items.remove(r.item, r.n); });
      const pet = {
        uid: 'p' + now().toString(36) + (uidSeq++), type: typeId,
        name: (name || def.name).trim().slice(0, 14) || def.name,
        tokluk: 100, mutluluk: 100, lastTick: now(), lastCared: now(), captured: false,
        cooldowns: {}, adoptedAt: new Date().toISOString(), adoptedTs: now(),
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
      pet.lastCared = now(); // ihmal sayacını sıfırla
      // Kaçırılmışsa: bakım = KURTARMA. Ortalama freeAt'e ulaşınca serbest kalır.
      let rescued = false;
      if (pet.captured) {
        const avg = ((pet.tokluk || 0) + (pet.mutluluk || 0)) / 2;
        if (avg >= (capCfg().freeAt || 50)) {
          pet.captured = false; delete pet.capturedAt; rescued = true;
          B.Bus.emit(B.Events.PET_RESCUED, { petId: uid });
        }
      }
      // Ödül
      if (act.xp) B.Reward.addXp(act.xp, 'pet');
      if (act.coin) B.Reward.addCoins(act.coin, 'pet');
      B.Bus.emit(B.Events.PET_CARED, { petId: uid, action: actionId });
      B.Save.saveSoon();
      return { ok: true, pet, act, rescued };
    },

    villain() { return data().villain || 'Bulanık'; },
    isCaptured(pet) { return !!(pet && pet.captured); },

    /* Ruh hali emojisi (kaçırılmışsa karanlık) */
    mood(pet) {
      if (pet && pet.captured) return '😈';
      const avg = ((pet.tokluk || 0) + (pet.mutluluk || 0)) / 2;
      return avg >= 75 ? '😀' : avg >= 50 ? '🙂' : avg >= 25 ? '😐' : '😢';
    },
  };
})(window.BOKUL = window.BOKUL || {});
