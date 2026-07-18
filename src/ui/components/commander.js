/* BOKUL — Baba Komutan bileşeni (CANLI karakter)
 * - Sürekli: nefes alma (CSS) + rastgele göz kırpma (kare değişimi)
 * - Konuşurken: yazı-makinesi + ağız aç/kapa + Animal Crossing tarzı sesli mırıltı
 * - İfadeler olaylara bağlı: doğru → mutlu, yanlış → şaşkın, level → gururlu */
(function (B) {
  let typeTimer = null;   // yazı makinesi
  let talkTimer = null;   // ağız aç/kapa döngüsü
  let blinkTimer = null;  // göz kırpma zamanlayıcısı
  let exprTimer = null;   // ifade geri dönüş zamanlayıcısı

  // Tek gerçek durum: tüm .commander-face'ler bundan çizilir
  const face = { expr: 'normal', mouthOpen: false, blink: false };

  function renderFaces() {
    document.querySelectorAll('.commander-face').forEach(f => {
      f.innerHTML = B.SvgArt.commander(face.expr, { mouthOpen: face.mouthOpen, blink: face.blink });
    });
  }

  /* Rastgele aralıklarla göz kırp (2.5-5.5 sn) */
  function scheduleBlink() {
    clearTimeout(blinkTimer);
    blinkTimer = setTimeout(() => {
      face.blink = true; renderFaces();
      setTimeout(() => { face.blink = false; renderFaces(); scheduleBlink(); }, 130);
    }, 2500 + Math.random() * 3000);
  }

  /* İfadeyi kısa süreliğine değiştir, sonra normale dön */
  function express(expr, ms) {
    clearTimeout(exprTimer);
    face.expr = expr; renderFaces();
    exprTimer = setTimeout(() => { face.expr = 'normal'; renderFaces(); }, ms || 1600);
  }

  function stopTalking() {
    clearInterval(talkTimer); talkTimer = null;
    face.mouthOpen = false; renderFaces();
  }

  B.Commander = {
    mount(container, opts) {
      opts = opts || {};
      const wrap = document.createElement('div');
      wrap.className = 'commander-wrap' + (opts.compact ? ' commander-compact' : '');
      wrap.innerHTML =
        '<div class="commander-face commander-idle">' +
          B.SvgArt.commander(face.expr, face) +
        '</div>' +
        '<div class="commander-balloon"><span class="commander-text"></span></div>';
      container.appendChild(wrap);
      const textEl = wrap.querySelector('.commander-text');

      /* Konuşma: harfler akarken ağız oynar + her 3 harfte bir mırıltı sesi */
      function say(text) {
        if (!text) return;
        clearInterval(typeTimer);
        stopTalking();
        textEl.textContent = '';
        let i = 0;

        talkTimer = setInterval(() => {
          face.mouthOpen = !face.mouthOpen;
          renderFaces();
        }, 120);

        typeTimer = setInterval(() => {
          textEl.textContent = text.slice(0, ++i);
          if (i % 3 === 0 && text[i - 1] !== ' ') B.Audio.play('blip');
          if (i >= text.length) {
            clearInterval(typeTimer);
            stopTalking();
          }
        }, 26); // ağız hareketi görünsün diye biraz yavaşlatıldı
      }

      function sayFrom(pool, vars) {
        const t = B.Dialogue.pick(pool, vars);
        if (t) say(t);
        return t;
      }

      renderFaces();
      return { say, sayFrom, el: wrap };
    },

    express,

    init() {
      scheduleBlink();
      B.Bus.on(B.Events.STEP_ANSWERED, p => express(p.correct ? 'happy' : 'surprised', 1200));
      B.Bus.on(B.Events.LEVEL_UP, () => express('proud', 2500));
      B.Bus.on(B.Events.BOSS_DEFEATED, () => express('proud', 3000));
      B.Bus.on(B.Events.BOSS_ATTACKED, () => express('stern', 1800));
    },
  };
})(window.BOKUL = window.BOKUL || {});
