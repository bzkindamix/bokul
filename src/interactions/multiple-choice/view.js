/* BOKUL — Çoktan Seçmeli Görünüm
 * Soru kartı + karıştırılmış seçenek butonları. Yanlış seçenek sönerek
 * devre dışı kalır (cevap asla söylenmez, eleyerek öğrenme); Komutan
 * sorunun kendi ipucunu verir. */
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
    let attempt = 0, mistakes = 0, done = false;

    container.innerHTML = '';
    const root = el('div', 'mc-root');
    root.appendChild(el('div', 'mc-question', item.q));

    // Seçenekleri karıştır ama orijinal indeksleri koru
    const order = item.options.map((_, i) => i).sort(() => Math.random() - 0.5);
    const grid = el('div', 'mc-options');
    order.forEach(origIdx => {
      const btn = el('button', 'mc-opt', item.options[origIdx]);
      btn.onclick = () => {
        if (done || btn.disabled) return;
        attempt++;
        const { correct } = B.Question.validate(q, step, origIdx);
        if (opts.onAnswer) opts.onAnswer(step, correct, attempt);
        if (correct) {
          done = true;
          btn.classList.add('mc-right');
          setTimeout(() => { if (opts.onComplete) opts.onComplete({ mistakes }); }, 650);
        } else {
          mistakes++;
          btn.disabled = true;
          btn.classList.add('mc-wrong');
          root.classList.remove('ld-shake'); void root.offsetWidth;
          root.classList.add('ld-shake');
          if (opts.say) opts.say(item.hint || B.Dialogue.pick('wrong.soft'));
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
