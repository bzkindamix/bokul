/* BOKUL — Onboarding Turu (Baba Komutan anlatır)
 * Çok adımlı tanıtım overlay'i: her adımda Baba + başlık + metin + İleri.
 * İlk girişte mekanikleri tanıtmak için (ebeveyn akışı, çocuk ekran turu). */
(function (B) {
  B.Tour = {
    /* steps: [{ icon, title, text }] */
    run(steps, onDone) {
      if (!steps || !steps.length) { if (onDone) onDone(); return; }
      let i = 0;
      function show() {
        const s = steps[i];
        const last = i === steps.length - 1;
        const ov = B.UI.overlay(
          '<div class="ov-baba">' + (s.icon || '🧑‍✈️') + '</div>' +
          '<div class="tour-step">Baba Komutan · ' + (i + 1) + '/' + steps.length + '</div>' +
          '<h2>' + s.title + '</h2><p class="ov-quote">' + s.text + '</p>',
          [{ label: last ? 'Anladım! ✓' : 'İleri ▶', onClick: null }].concat(
            last ? [] : [{ label: 'Geç', cls: 'btn-quiet', onClick: null }]));
        const btns = ov.querySelectorAll('.overlay-btns .btn');
        btns[0].onclick = () => { ov.remove(); i++; if (i < steps.length) show(); else if (onDone) onDone(); };
        if (btns[1]) btns[1].onclick = () => { ov.remove(); if (onDone) onDone(); }; // tümünü geç
      }
      show();
    },
  };
})(window.BOKUL = window.BOKUL || {});
