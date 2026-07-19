/* BOKUL — Çoktan Seçmeli Görünüm (TEK DENEME)
 * İlk cevap kesindir — rastgele/brute-force basma engellenir. Yanlışsa doğru
 * cevap yeşil işaretlenir ve Baba nedenini söyler (öğrenme anı), soru biter.
 * Aynı konu ileride aralıklı tekrarla geri gelir. */
(function (B) {

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function create(container, q, opts) {
    opts = opts || {};
    const item = q.item;
    const step = B.Question.steps(q)[0];
    let done = false;

    container.innerHTML = '';
    const root = el('div', 'mc-root');
    root.appendChild(el('div', 'mc-question', item.q));

    // Yaşa göre uyarla: küçük yaşlarda (band 1) daha az şık = daha kolay
    // (doğru cevap + 2 çeldirici). Orta/büyük yaşta tüm şıklar.
    let idxs = item.options.map((_, i) => i);
    const band = (B.Curriculum && B.Curriculum.ageBand) ? B.Curriculum.ageBand() : 3;
    if (band === 1 && idxs.length > 3) {
      const wrong = idxs.filter(i => i !== item.correct).sort(() => Math.random() - 0.5).slice(0, 2);
      idxs = [item.correct, ...wrong];
    }
    // Seçenekleri karıştır ama orijinal indeksleri koru
    const order = idxs.sort(() => Math.random() - 0.5);
    const grid = el('div', 'mc-options');
    order.forEach(origIdx => {
      const btn = el('button', 'mc-opt', item.options[origIdx]);
      btn.dataset.orig = origIdx;
      btn.onclick = () => {
        if (done) return;
        done = true;
        const { correct } = B.Question.validate(q, step, origIdx);
        if (opts.onAnswer) opts.onAnswer(step, correct, 1);
        // Tüm şıkları kilitle; doğruyu yeşil göster (öğrenme anı)
        grid.querySelectorAll('.mc-opt').forEach(b => { b.disabled = true; });
        const rightBtn = grid.querySelector('.mc-opt[data-orig="' + item.correct + '"]');
        if (rightBtn) rightBtn.classList.add('mc-right');
        if (correct) {
          if (opts.say) opts.say(B.Dialogue.pick('correct'));
          setTimeout(() => { if (opts.onComplete) opts.onComplete({ mistakes: 0 }); }, 650);
        } else {
          btn.classList.add('mc-wrong');
          root.classList.remove('ld-shake'); void root.offsetWidth;
          root.classList.add('ld-shake');
          if (opts.say) opts.say('Doğrusu: "' + item.options[item.correct] + '". ' + (item.hint || ''));
          setTimeout(() => { if (opts.onComplete) opts.onComplete({ mistakes: 1 }); }, 2200);
        }
      };
      grid.appendChild(btn);
    });
    root.appendChild(grid);
    container.appendChild(root);

    return { destroy() { done = true; container.innerHTML = ''; } };
  }

  B.MultipleChoiceView = { create };
  B.Question.registerView('multiple-choice', create);
})(window.BOKUL = window.BOKUL || {});
