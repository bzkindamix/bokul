/* BOKUL — Aritmetik Görünüm: "a op b = [?]" + sayı pedi (tek cevap). */
(function (B) {
  const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function create(container, q, opts) {
    opts = opts || {};
    let buffer = '', attempt = 0, mistakes = 0, done = false;
    const step = B.Question.steps(q)[0];

    container.innerHTML = '';
    const root = el('div', 'ar-root');
    root.innerHTML =
      '<div class="ar-expr"><span>' + q.a + '</span><span class="ar-op">' + (SYM[q.op] || '?') +
      '</span><span>' + q.b + '</span><span class="ar-eq">=</span><span class="ar-box" id="ar-box">?</span></div>';

    const pad = el('div', 'numpad');
    '1234567890'.split('').forEach(k => { const b = el('button', 'key', k); b.dataset.key = k; pad.appendChild(b); });
    const back = el('button', 'key key-back', '⌫'); back.dataset.key = 'back';
    const ok = el('button', 'key key-go', '✔ ONAYLA'); ok.dataset.key = 'ok';
    pad.appendChild(back); pad.appendChild(ok);
    root.appendChild(pad);
    container.appendChild(root);
    const box = root.querySelector('#ar-box');

    function render() { box.textContent = buffer || '?'; box.classList.add('ld-active'); }

    function submit() {
      if (!buffer.length || done) return;
      attempt++;
      const { correct } = B.Question.validate(q, step, buffer);
      if (opts.onAnswer) opts.onAnswer(step, correct, attempt);
      if (correct) {
        done = true; box.classList.remove('ld-active'); box.classList.add('ok');
        setTimeout(() => { if (opts.onComplete) opts.onComplete({ mistakes }); }, 500);
      } else {
        mistakes++;
        root.classList.remove('ld-shake'); void root.offsetWidth; root.classList.add('ld-shake');
        if (opts.say) opts.say(B.Dialogue.pick('wrong.soft'));
        buffer = ''; render();
      }
    }

    pad.addEventListener('click', e => {
      const b = e.target.closest('.key');
      if (!b || done) return;
      B.Audio.play('tick');
      const k = b.dataset.key;
      if (k === 'ok') return submit();
      if (k === 'back') { buffer = buffer.slice(0, -1); render(); return; }
      if (buffer.length < 5) { buffer += k; render(); }
    });

    render();
    return { destroy() { done = true; container.innerHTML = ''; } };
  }

  B.ArithmeticView = { create };
  B.Question.registerView('arithmetic', create);
})(window.BOKUL = window.BOKUL || {});
