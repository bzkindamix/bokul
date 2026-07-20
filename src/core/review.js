/* BOKUL — Aralıklı Tekrar (Spaced Repetition)
 * Eğitim biliminin kanıtlı yöntemi: bir beceri öğrenildikten sonra GİDEREK AÇILAN
 * aralıklarla (varsayılan 1-3-7-14 gün) tekrar karşına çıkar → kalıcı hafıza.
 *
 * Her beceri (ders adımı / MC banka skill'i) için bir "tekrar takvimi" tutulur:
 *   { stage, due, last }  (due = YEREL gün numarası; o güne gelince vadesi dolar)
 * Doğru cevap → bir üst aralığa geç (uzar); yanlış → başa dön (yakında tekrar).
 *
 * "Devriye" (spaced-repetition) harekâtları, VADESİ GELEN becerileri hedefler
 * (lesson-engine.reviewGenerators + B.Review.pick). Böylece "rastgele tekrar"
 * değil, tam zamanında "akıllı tekrar" olur.
 *
 * Durum: B.State.data.stats.review = { [skill]: {stage,due,last} } → kayda yazılır. */
(function (B) {
  /* YEREL takvim gün numarası (saat dilimi güvenli; reward-engine ile aynı taban) */
  function dayNum() {
    const d = new Date();
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  }
  function intervals() {
    const m = (B.Content.get('config') || {}).mastery || {};
    const iv = m.reviewIntervalsDays;
    return (Array.isArray(iv) && iv.length) ? iv : [1, 3, 7, 14];
  }
  function sched() {
    const s = B.State.data.stats;
    if (!s.review || typeof s.review !== 'object') s.review = {};
    return s.review;
  }

  B.Review = {
    /* Bir beceri cevaplandı: takvimi güncelle (doğru→aralık uzar, yanlış→başa döner) */
    note(skill, correct) {
      if (!skill) return;
      const iv = intervals(), today = dayNum(), m = sched();
      const rec = m[skill] || { stage: -1, due: today, last: today };
      rec.stage = correct ? Math.min(rec.stage + 1, iv.length - 1) : 0;
      rec.due = today + iv[Math.max(0, rec.stage)];
      rec.last = today;
      m[skill] = rec;
    },

    /* Bu beceri bugün tekrar edilmeli mi? (takvimde var VE vadesi gelmiş) */
    isDue(skill) { const r = sched()[skill]; return !!r && r.due <= dayNum(); },

    /* Vadesi gelen beceriler (en çok gecikmiş önce) */
    dueSkills() {
      const m = sched(), today = dayNum();
      return Object.keys(m).filter(s => m[s].due <= today).sort((a, b) => m[a].due - m[b].due);
    },
    dueCount() { return B.Review.dueSkills().length; },

    /* Sıradaki bir beceri ne zaman? (dashboard/bilgi için; yoksa null) */
    nextDueIn() {
      const m = sched(), today = dayNum();
      const dues = Object.keys(m).map(s => m[s].due);
      if (!dues.length) return null;
      return Math.max(0, Math.min.apply(null, dues) - today); // 0 = bugün
    },

    /* Tekrar havuzundan (annotated [{gen,skills}]) VADESİ GELENİ seç; yoksa rastgele */
    pick(list) {
      if (!list || !list.length) return null;
      const due = list.filter(e => (e.skills || []).some(s => B.Review.isDue(s)));
      const pool = due.length ? due : list;
      return pool[Math.floor(Math.random() * pool.length)].gen;
    },

    init() {
      // Ustalık kaydıyla aynı sinyal: her ilk-deneme cevabı beceri takvimini günceller.
      B.Bus.on(B.Events.STEP_ANSWERED, p => { if (p && p.attempt === 1) B.Review.note(p.stepType, p.correct); });
    },
  };
})(window.BOKUL = window.BOKUL || {});
