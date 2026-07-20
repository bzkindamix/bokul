/* BOKUL — Uzun Bölme Mantığı (saf — DOM YOK, test edilebilir)
 * Bir bölme işlemini 5 tip mikro-adıma çözümler:
 *   select   → ilk çalışma sayısı için kaç basamak alınacağı
 *   estimate → bölüm rakamı tahmini
 *   multiply → tahmin × bölen
 *   subtract → fark (kale kuralı: fark < bölen)
 *   bringdown→ sonraki basamağı indir
 * computePlan() tüm adım listesini ve beklenen cevapları üretir. */
(function (B) {

  /* İşlem planını çıkar: her adım { type, expected, ... } */
  function computePlan(dividend, divisor) {
    const digits = String(dividend).split('').map(Number);
    const steps = [];

    // İlk çalışma sayısı: bölenden küçük olmayan en kısa önek
    let idx = 0, current = 0;
    do { current = current * 10 + digits[idx]; idx++; }
    while (current < divisor && idx < digits.length);
    steps.push({ type: 'select', expected: idx });

    const qDigits = [];
    // İterasyon bilgileri görünüm katmanı için saklanır (kolon hizalama)
    while (true) {
      const q = Math.floor(current / divisor);
      qDigits.push(q);
      const endCol = idx - 1; // çalışma sayısının son basamağının kolonu
      steps.push({ type: 'estimate', expected: q, endCol });
      const p = q * divisor;
      steps.push({ type: 'multiply', expected: p, endCol, working: current });
      const r = current - p;
      steps.push({ type: 'subtract', expected: r, endCol, working: current, product: p });
      if (idx < digits.length) {
        steps.push({ type: 'bringdown', expected: digits[idx], digitIndex: idx, endCol });
        current = r * 10 + digits[idx];
        idx++;
      } else {
        return {
          dividend, divisor, steps,
          quotient: Number(qDigits.join('')),
          remainder: r,
        };
      }
    }
  }

  /* Rastgele soru üretici.
   * params: { divisorRange:[a,b], dividendDigits:n|[min,max], remainder:bool, context? }
   * bias 0..1: adaptif zorluk — 0 kolay uç, 1 zor uç */
  function generate(params, bias) {
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const dr = params.divisorRange || [2, 9];
    // bias yüksekse bölen aralığın üst ucuna kayar
    const divisor = rnd(dr[0], Math.max(dr[0], Math.round(dr[0] + (dr[1] - dr[0]) * (0.4 + 0.6 * bias))));

    let dd = params.dividendDigits || 2;
    if (Array.isArray(dd)) dd = rnd(dd[0], Math.max(dd[0], Math.round(dd[0] + (dd[1] - dd[0]) * bias)));

    let dividend;
    if (params.remainder) {
      // Kalanlı: uygun basamakta, tam bölünmeyen sayı bul
      let guard = 200;
      do {
        dividend = rnd(Math.pow(10, dd - 1), Math.pow(10, dd) - 1);
      } while ((dividend % divisor === 0 || dividend < divisor) && --guard);
    } else {
      // Kalansız: bölümü kur, çarparak bölüneni üret (basamak sayısı tutana dek)
      let guard = 200;
      do {
        const qMin = Math.ceil(Math.pow(10, dd - 1) / divisor);
        const qMax = Math.floor((Math.pow(10, dd) - 1) / divisor);
        const q = rnd(Math.max(1, qMin), Math.max(1, qMax));
        dividend = q * divisor;
      } while ((String(dividend).length !== dd || dividend < divisor) && --guard);
    }

    const plan = computePlan(dividend, divisor);
    return { dividend, divisor, plan, params };
  }

  const impl = {
    generate,
    /* Tekrar defteri imzası: aynı bölünen/bölen ikilisi tekrar etmesin */
    sig(q) { return 'ld|' + q.dividend + '|' + q.divisor; },
    getSteps(q) { return q.plan.steps; },
    validateStep(q, step, answer) {
      const val = Number(answer);
      if (step.type === 'select') return { correct: val === step.expected };
      return { correct: val === step.expected };
    },
  };

  // Tarayıcıda plugin olarak kaydol; Node'da (test) modül olarak dışa aç
  if (B && B.Question) B.Question.registerType('long-division', impl);
  if (B) B.LongDivision = { computePlan, generate, impl };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { computePlan, generate, impl };
  }
})(typeof window !== 'undefined' ? (window.BOKUL = window.BOKUL || {}) : null);
