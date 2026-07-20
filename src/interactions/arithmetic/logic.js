/* BOKUL — Aritmetik Soru Tipi (toplama, çıkarma, çarpma, basit bölme)
 * Tek cevaplı işlemler. Küçük sınıflar için MEB kademesine uygun.
 * params: { op:'+'|'-'|'*'|'/', a:[min,max], b:[min,max], q:[min,max] }
 * bias 0..1: adaptif zorluk (üst aralığa yaklaştırır) */
(function (B) {
  const SKILL = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'div' };

  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function rng(r, bias) {
    if (!Array.isArray(r)) return r;
    const hi = Math.round(r[0] + (r[1] - r[0]) * (0.45 + 0.55 * (bias || 0)));
    return rnd(r[0], Math.max(r[0], hi));
  }

  function generate(params, bias) {
    const op = params.op || '+';
    let a, b, answer;
    if (op === '+') { a = rng(params.a || [1, 20], bias); b = rng(params.b || [1, 20], bias); answer = a + b; }
    else if (op === '-') { a = rng(params.a || [2, 20], bias); b = rnd(0, a); answer = a - b; }
    else if (op === '*') { a = rng(params.a || [1, 10], bias); b = rng(params.b || [1, 10], bias); answer = a * b; }
    else { // '/' — tam bölünen (paylaştırma): a = b × q
      b = rng(params.b || [2, 5], bias);
      const q = rng(params.q || [1, 10], bias);
      a = b * q; answer = q;
    }
    return { a, b, op, answer };
  }

  const impl = {
    generate,
    /* Tekrar defteri imzası: işlem + iki terim (aynı işlem aynı sayılarla tekrar etmesin) */
    sig(q) { return 'ar|' + q.op + '|' + q.a + '|' + q.b; },
    getSteps(q) { return [{ type: SKILL[q.op] || 'add', expected: q.answer }]; },
    validateStep(q, step, ans) { return { correct: Number(ans) === q.answer }; },
  };

  if (B && B.Question) B.Question.registerType('arithmetic', impl);
  if (typeof module !== 'undefined' && module.exports) module.exports = { generate, impl };
})(typeof window !== 'undefined' ? (window.BOKUL = window.BOKUL || {}) : null);
