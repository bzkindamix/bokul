/* BOKUL — Çoktan Seçmeli Soru Tipi (mantık — DOM YOK)
 * Soru bankası tabanlı dersler için (Yapay Zekâ, Kişisel Bakım, Felsefe...).
 * Bank öğesi: { q, options: [...], correct: <doğru seçeneğin indeksi>,
 *               skill: "beceri-adı", hint: "yanlışta gösterilecek ipucu" } */
(function (B) {

  /* params: { pool: [bankItem...] } — "karıştırılmış torba": havuz karıştırılır ve
   * sırayla tüketilir; TÜM banka bitmeden aynı soru TEKRAR gelmez (ünitenin farklı
   * adımları boyunca tekrar önlenir). Torba bitince yeniden karışır. Her havuzun
   * kendi torbası vardır (imza = uzunluk + ilk sorunun başı). */
  const bags = new Map();
  function sig(pool) { return pool.length + '|' + ((pool[0] && pool[0].q) ? pool[0].q.slice(0, 16) : ''); }
  function shuffled(n) {
    const a = []; for (let i = 0; i < n; i++) a.push(i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function generate(params) {
    const pool = params.pool || [];
    if (!pool.length) throw new Error('Çoktan seçmeli havuz boş!');
    const key = sig(pool);
    let bag = bags.get(key);
    if (!bag || bag.pos >= bag.order.length || bag.order.length !== pool.length) {
      bag = { order: shuffled(pool.length), pos: 0 };
      bags.set(key, bag);
    }
    const item = pool[bag.order[bag.pos++]] || pool[Math.floor(Math.random() * pool.length)];
    return { item, params };
  }

  const impl = {
    generate,
    /* Tek mikro-adım: cevap seçimi. skill, ustalık takibine gider. */
    getSteps(q) { return [{ type: q.item.skill || 'answer', expected: q.item.correct }]; },
    validateStep(q, step, answer) { return { correct: Number(answer) === q.item.correct }; },
  };

  if (B && B.Question) B.Question.registerType('multiple-choice', impl);
  if (typeof module !== 'undefined' && module.exports) module.exports = { generate, impl };
})(typeof window !== 'undefined' ? (window.BOKUL = window.BOKUL || {}) : null);
