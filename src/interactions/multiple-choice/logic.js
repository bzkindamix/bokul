/* BOKUL — Çoktan Seçmeli Soru Tipi (mantık — DOM YOK)
 * Soru bankası tabanlı dersler için (Yapay Zekâ, Kişisel Bakım, Felsefe...).
 * Bank öğesi: { q, options: [...], correct: <doğru seçeneğin indeksi>,
 *               skill: "beceri-adı", hint: "yanlışta gösterilecek ipucu" } */
(function (B) {

  /* params: { pool: [bankItem...] } — havuzdan rastgele soru seçer.
   * Aynı sorunun art arda gelmemesi için son seçilenler hatırlanır. */
  const recent = [];
  function generate(params) {
    const pool = params.pool || [];
    if (!pool.length) throw new Error('Çoktan seçmeli havuz boş!');
    let item, guard = 30;
    do { item = pool[Math.floor(Math.random() * pool.length)]; }
    while (recent.includes(item.q) && --guard);
    recent.push(item.q);
    if (recent.length > Math.min(6, pool.length - 1)) recent.shift();
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
