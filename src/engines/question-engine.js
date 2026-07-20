/* BOKUL — QuestionEngine
 * Soru tipi plugin çatısı. Her tip registerType ile kaydolur:
 *   { generate(params, bias), getSteps(q), validateStep(q, step, answer) }
 * Motor tiplerin içini bilmez — Open/Closed. */
(function (B) {
  const types = new Map();
  const views = new Map(); // tip adı -> görünüm oluşturucu (container, q, opts) => ctl

  /* ---------- GÖRÜLEN SORU DEFTERİ (kalıcı, oyuncu-bazlı) ----------
   * "1 soru çocuğun karşısına sadece 1 kez çıksın" kuralı. Her sorunun kararlı
   * imzası (tip.sig(q)) kaç kez gösterildiğini sayar; seçimde EN AZ gösterilen
   * aday tercih edilir. Böylece tüm banka/üretim uzayı tükenmeden hiçbir soru
   * tekrar etmez. Defter B.State.data.stats.qSeen'de tutulur → KAYDA yazılır,
   * reload/oturum değişse de korunur (eski torba modül-içiydi, reload'da sıfırlanıyordu). */
  const SEEN_CAP = 4000; // defter şişmesin: aşınca en çok görülenler unutulur
  function ledger() {
    const s = B.State && B.State.data && B.State.data.stats;
    if (!s) return null;
    if (!s.qSeen || typeof s.qSeen !== 'object') s.qSeen = {};
    return s.qSeen;
  }
  function seenCount(sig) { const l = ledger(); return (l && sig) ? (l[sig] || 0) : 0; }
  function markSeen(sig) {
    const l = ledger(); if (!l || !sig) return;
    l[sig] = (l[sig] || 0) + 1;
    const keys = Object.keys(l);
    if (keys.length > SEEN_CAP) {
      // en çok görülen ~%25'i unut (bunlar zaten en çok çıkmış → tekrar uygunları)
      keys.sort((a, b) => l[b] - l[a]);
      keys.slice(0, Math.floor(SEEN_CAP * 0.25)).forEach(k => delete l[k]);
    }
  }
  /* Adaylar arasından en az görüleni seç (eşitlikte rastgele) */
  function leastSeen(cands, sigOf) {
    let best = [], bestC = Infinity;
    for (const c of cands) {
      const sc = seenCount(sigOf(c));
      if (sc < bestC) { bestC = sc; best = [c]; }
      else if (sc === bestC) best.push(c);
    }
    return best[Math.floor(Math.random() * best.length)];
  }

  B.Question = {
    registerType(name, impl) {
      ['generate', 'getSteps', 'validateStep'].forEach(k => {
        if (typeof impl[k] !== 'function') throw new Error('Soru tipi eksik metod: ' + name + '.' + k);
      });
      // Opsiyonel: sig(q)->imza · variants(params,bias)->aday q listesi (banka tipleri)
      types.set(name, impl);
    },

    registerView(name, createFn) { views.set(name, createFn); },
    view(name) {
      const v = views.get(name);
      if (!v) throw new Error('Kayıtsız soru görünümü: ' + name);
      return v;
    },

    type(name) {
      const t = types.get(name);
      if (!t) throw new Error('Kayıtsız soru tipi: ' + name);
      return t;
    },

    /* Bir sorunun kararlı imzası (defter anahtarı). Tip sig tanımlamamışsa null. */
    sigOf(typeName, q) {
      const t = types.get(typeName);
      return (t && typeof t.sig === 'function') ? t.sig(q) : null;
    },

    /* Üret: adaptif zorluk ProgressManager'dan; TEKRAR ÖNLEME defterle uygulanır.
     * - Banka tipleri (impl.variants var): tüm adaylar arasından en az görüleni seç.
     * - Üretici tipleri: birkaç kez üret, en az görüleni al (taze bulunca erken çık). */
    generate(typeName, params, skills) {
      const impl = B.Question.type(typeName);
      const bias = skills ? B.Progress.difficultyBias(skills) : 0.5;
      const sigOf = q => B.Question.sigOf(typeName, q);
      let q;

      if (typeof impl.variants === 'function') {
        const cands = impl.variants(params || {}, bias) || [];
        q = cands.length ? leastSeen(cands, sigOf) : impl.generate(params || {}, bias);
      } else {
        const TRIES = 14;
        let bestQ = null, bestC = Infinity;
        for (let i = 0; i < TRIES; i++) {
          const cand = impl.generate(params || {}, bias);
          const sc = seenCount(sigOf(cand));
          if (sc < bestC) { bestC = sc; bestQ = cand; }
          if (bestC === 0) break; // hiç görülmemiş: yeterli
        }
        q = bestQ || impl.generate(params || {}, bias);
      }

      q._type = typeName;
      markSeen(sigOf(q));
      return q;
    },

    /* Test/araç: defteri sıfırla */
    resetSeen() { const l = ledger(); if (l) Object.keys(l).forEach(k => delete l[k]); },

    steps(q) { return B.Question.type(q._type).getSteps(q); },
    validate(q, step, answer) { return B.Question.type(q._type).validateStep(q, step, answer); },
  };
})(window.BOKUL = window.BOKUL || {});
