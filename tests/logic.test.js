/* BOKUL — Uzun bölme mantığı testleri (Node: node tests/logic.test.js)
 * En riskli iki aile yoğun test edilir:
 *  1) bölüm ortasında 0 çıkan işlemler (örn. 4218÷6 = 703)
 *  2) ilk basamağı bölenden küçük bölünenler (örn. 435÷5) */
const { computePlan, generate } = require('../src/interactions/long-division/logic.js');

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; }
  else { fail++; console.log('  ✘ ' + name + (extra ? ' → ' + extra : '')); }
}

/* Plan doğrulaması: adımları sırayla "çözen" simülatör */
function verifyPlan(dividend, divisor) {
  const plan = computePlan(dividend, divisor);
  const expectedQ = Math.floor(dividend / divisor);
  const expectedR = dividend % divisor;
  check(dividend + '÷' + divisor + ' bölüm', plan.quotient === expectedQ,
    'beklenen ' + expectedQ + ', gelen ' + plan.quotient);
  check(dividend + '÷' + divisor + ' kalan', plan.remainder === expectedR,
    'beklenen ' + expectedR + ', gelen ' + plan.remainder);

  // Adım tutarlılığı: her subtract sonucu bölenden küçük olmalı (kale kuralı)
  plan.steps.filter(s => s.type === 'subtract').forEach(s => {
    check(dividend + '÷' + divisor + ' kale kuralı', s.expected < divisor,
      'kalan ' + s.expected + ' ≥ bölen ' + divisor);
  });

  // select: önek gerçekten bölenden küçük olmayan EN KISA önek mi?
  const sel = plan.steps[0];
  const prefix = Number(String(dividend).slice(0, sel.expected));
  check(dividend + '÷' + divisor + ' select yeterli', prefix >= divisor || sel.expected === String(dividend).length);
  if (sel.expected > 1) {
    const shorter = Number(String(dividend).slice(0, sel.expected - 1));
    check(dividend + '÷' + divisor + ' select en kısa', shorter < divisor);
  }
  return plan;
}

console.log('— El ile seçilmiş vakalar —');
verifyPlan(4872, 6);   // klasik örnek: 812
verifyPlan(4218, 6);   // bölüm ortasında 0: 703
verifyPlan(4200, 6);   // sonda çift 0: 700
verifyPlan(435, 5);    // ilk basamak yetersiz: 87
verifyPlan(1000, 8);   // 125
verifyPlan(9, 3);      // tek basamak: 3
verifyPlan(84, 4);     // teach örneği: 21
verifyPlan(96, 6);     // teach örneği: 16
verifyPlan(1001, 7);   // ortada 0'lar: 143
verifyPlan(2005, 5);   // 401
verifyPlan(6013, 7);   // kalanlı: 859 kalan 0? 7*859=6013 → tam
verifyPlan(6014, 7);   // kalanlı: 859 kalan 1
verifyPlan(9999, 9);   // 1111
verifyPlan(1234, 9);   // kalanlı: 137 kalan 1

console.log('— Rastgele tarama (500 vaka) —');
for (let i = 0; i < 500; i++) {
  const divisor = 2 + Math.floor(Math.random() * 8);
  const dividend = divisor + Math.floor(Math.random() * 9990);
  verifyPlan(dividend, divisor);
}

console.log('— Üretici testleri —');
for (let i = 0; i < 200; i++) {
  const q = generate({ divisorRange: [2, 9], dividendDigits: [1, 4], remainder: false }, Math.random());
  check('üretici kalansız', q.dividend % q.divisor === 0, q.dividend + '÷' + q.divisor);
  check('üretici geçerli', q.dividend >= q.divisor);
}
for (let i = 0; i < 200; i++) {
  const q = generate({ divisorRange: [2, 9], dividendDigits: [2, 4], remainder: true }, Math.random());
  check('üretici kalanlı', q.dividend % q.divisor !== 0, q.dividend + '÷' + q.divisor);
}

console.log('\nSONUÇ: ' + pass + ' geçti, ' + fail + ' kaldı.');
process.exit(fail ? 1 : 0);
