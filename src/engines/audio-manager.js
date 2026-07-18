/* BOKUL — AudioManager
 * Harici ses dosyası YOK: tüm efektler Web Audio API ile sentezlenir.
 * Olayları dinler; kimse "ses çal" demez. */
(function (B) {
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* Tek nota: tip, frekans, süre, ses düzeyi, gecikme */
  function tone(type, freq, dur, vol, delay) {
    if (!enabled) return;
    try {
      const a = ac(), t = a.currentTime + (delay || 0);
      const o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(a.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { /* ses yoksa oyun devam */ }
  }

  const sfx = {
    tick:    () => tone('square', 720, 0.06, 0.05),
    correct: () => { tone('sine', 660, 0.12, 0.14); tone('sine', 880, 0.16, 0.12, 0.07); },
    wrong:   () => tone('triangle', 220, 0.25, 0.12),               // yumuşak, cezasız
    star:    (n) => tone('sine', 780 + n * 160, 0.22, 0.16, n * 0.18), // yıldız başına perde yükselir
    fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone('sine', f, 0.3, 0.16, i * 0.12)),
    hit:     () => { tone('sawtooth', 160, 0.15, 0.14); tone('square', 90, 0.2, 0.1, 0.03); },
    shield:  () => tone('triangle', 340, 0.18, 0.1),
    chest:   () => [440, 554, 659].forEach((f, i) => tone('sine', f, 0.25, 0.14, i * 0.1)),
    blip:    () => tone('square', 260 + Math.random() * 220, 0.045, 0.05), // Komutan mırıltısı
  };

  B.Audio = {
    unlock() { ac(); },                             // ilk kullanıcı dokunuşunda çağrılır
    setEnabled(v) { enabled = v; },
    isEnabled() { return enabled; },
    play(name, arg) { if (sfx[name]) sfx[name](arg); },

    init() {
      enabled = B.Save.settings.get().sound !== false;
      const E = B.Events;
      B.Bus.on(E.STEP_ANSWERED, p => sfx[p.correct ? 'correct' : 'wrong']());
      B.Bus.on(E.QUESTION_COMPLETED, p => { for (let i = 0; i < p.stars; i++) sfx.star(i); });
      B.Bus.on(E.LEVEL_UP, () => sfx.fanfare());
      B.Bus.on(E.BOSS_DAMAGED, () => sfx.hit());
      B.Bus.on(E.BOSS_ATTACKED, () => sfx.shield());
      B.Bus.on(E.BOSS_DEFEATED, () => sfx.fanfare());
    },
  };
})(window.BOKUL = window.BOKUL || {});
