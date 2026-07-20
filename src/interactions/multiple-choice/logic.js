/* BOKUL — Çoktan Seçmeli Soru Tipi (mantık — DOM YOK)
 * Soru bankası tabanlı dersler için (Yapay Zekâ, Kişisel Bakım, Felsefe...).
 * Bank öğesi: { q, options: [...], correct: <doğru seçeneğin indeksi>,
 *               skill: "beceri-adı", hint: "yanlışta gösterilecek ipucu" } */
(function (B) {

  /* params: { pool: [bankItem...] }. TEKRAR ÖNLEME artık QuestionEngine'in kalıcı
   * "görülen soru defteri"yle yapılır: motor variants() ile tüm adayları alır ve
   * EN AZ gösterilen soruyu seçer (kayda yazılır → reload/oturum sonrası da korunur).
   * Eski modül-içi "torba" kaldırıldı (reload'da sıfırlanıyor, havuz bitince tekrar
   * ediyordu). generate() yalnızca variants boş kaldığında yedek yoldur. */

  /* Havuzdaki her banka öğesini bir soru adayına çevir (motor en az göründeni seçer) */
  function variants(params) {
    return (params.pool || []).map(item => ({ item, params }));
  }
  function generate(params) {
    const pool = params.pool || [];
    if (!pool.length) throw new Error('Çoktan seçmeli havuz boş!');
    const item = pool[Math.floor(Math.random() * pool.length)];
    return { item, params };
  }

  const impl = {
    generate,
    variants,
    /* Tekrar defteri imzası: soru metni (aynı soru tekrar sorulmasın) */
    sig(q) { return 'mc|' + ((q.item && q.item.q) ? q.item.q : ''); },
    /* Tek mikro-adım: cevap seçimi. skill, ustalık takibine gider. */
    getSteps(q) { return [{ type: q.item.skill || 'answer', expected: q.item.correct }]; },
    validateStep(q, step, answer) { return { correct: Number(answer) === q.item.correct }; },
  };

  if (B && B.Question) B.Question.registerType('multiple-choice', impl);
  if (typeof module !== 'undefined' && module.exports) module.exports = { generate, variants, impl };
})(typeof window !== 'undefined' ? (window.BOKUL = window.BOKUL || {}) : null);
