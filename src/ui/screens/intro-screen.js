/* BOKUL — Giriş Sinematiği
 * "Ne için savaşıyoruz?" — Büyük Sayı Kristali hikâyesi.
 * Slaytlar content/story.json'dan gelir; sahneler saf SVG/CSS animasyon.
 * ATLA ile her an geçilebilir; ilk açılışta otomatik, üsten tekrar izlenebilir. */
(function (B) {

  /* ---------- Sahne görselleri (inline SVG) ---------- */
  const ART = {
    /* Parlayan Büyük Sayı Kristali */
    crystal:
      '<svg viewBox="0 0 200 160" class="cine-svg">' +
      '<circle cx="100" cy="80" r="60" fill="url(#g1)" opacity=".35"/>' +
      '<defs><radialGradient id="g1"><stop offset="0%" stop-color="#3DF2D2"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs>' +
      '<g class="cine-float">' +
      '<path d="M100 20 L135 60 L100 140 L65 60 Z" fill="#3DF2D2" opacity=".9"/>' +
      '<path d="M100 20 L135 60 L100 75 Z" fill="#8ffce9"/>' +
      '<path d="M100 20 L65 60 L100 75 Z" fill="#5cf5db"/>' +
      '<text x="100" y="66" text-anchor="middle" font-size="20" font-weight="bold" fill="#0b3a32" font-family="monospace">÷</text>' +
      '</g>' +
      '<circle cx="40" cy="30" r="2" fill="#fff" opacity=".8"/><circle cx="165" cy="45" r="2.5" fill="#fff" opacity=".6"/>' +
      '<circle cx="150" cy="120" r="2" fill="#fff" opacity=".7"/><circle cx="30" cy="110" r="1.5" fill="#fff" opacity=".5"/>' +
      '</svg>',

    /* KARMAŞA gölgesi + parçalanan kristal */
    chaos:
      '<svg viewBox="0 0 200 160" class="cine-svg">' +
      '<g class="cine-swirl">' +
      '<path d="M100 15 Q150 30 160 80 Q150 130 100 145 Q50 130 40 80 Q50 30 100 15 Z" fill="#1a1030" opacity=".9"/>' +
      '<path d="M100 30 Q140 42 148 80 Q140 118 100 130 Q60 118 52 80 Q60 42 100 30 Z" fill="#2d1b52" opacity=".9"/>' +
      '</g>' +
      '<circle cx="82" cy="70" r="7" fill="#FF4FD8"/><circle cx="118" cy="70" r="7" fill="#FF4FD8"/>' +
      '<path d="M78 100 Q100 88 122 100" stroke="#FF4FD8" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<g class="cine-shard s1"><path d="M30 40 L45 50 L32 62 Z" fill="#3DF2D2"/></g>' +
      '<g class="cine-shard s2"><path d="M165 35 L178 48 L160 55 Z" fill="#3DF2D2"/></g>' +
      '<g class="cine-shard s3"><path d="M25 115 L40 108 L38 126 Z" fill="#3DF2D2"/></g>' +
      '<g class="cine-shard s4"><path d="M170 110 L182 122 L162 128 Z" fill="#3DF2D2"/></g>' +
      '</svg>',

    /* Paylaşılamayan dondurma — kırık adalet */
    broken:
      '<svg viewBox="0 0 200 160" class="cine-svg">' +
      '<g class="cine-tilt">' +
      '<path d="M85 90 L100 145 L115 90 Z" fill="#D9A06B"/>' +
      '<path d="M85 90 L100 145 L115 90 Z" fill="none" stroke="#b57843" stroke-width="2"/>' +
      '<circle cx="88" cy="72" r="17" fill="#FF9AD5"/>' +
      '<circle cx="112" cy="72" r="17" fill="#8ffce9"/>' +
      '<path d="M100 52 L100 92" stroke="#160F2E" stroke-width="5" stroke-linecap="round" stroke-dasharray="6 5"/>' +
      '</g>' +
      '<text x="52" y="55" font-size="26" class="cine-blink1">❓</text>' +
      '<text x="132" y="45" font-size="26" class="cine-blink2">❗</text>' +
      '</svg>',

    /* BOKUL üssü + Komutan (SvgArt'tan) */
    base:
      '<svg viewBox="0 0 200 160" class="cine-svg">' +
      '<path d="M30 130 Q100 55 170 130 Z" fill="#31245F"/>' +
      '<path d="M45 130 Q100 70 155 130 Z" fill="#3F2E7E"/>' +
      '<rect x="92" y="60" width="16" height="26" rx="4" fill="#4A3690"/>' +
      '<circle cx="100" cy="52" r="10" fill="#FF4FD8" class="cine-beacon"/>' +
      '<rect x="20" y="128" width="160" height="8" rx="4" fill="#231A48"/>' +
      '<text x="100" y="122" text-anchor="middle" font-size="16" font-weight="bold" fill="#FFD52E" letter-spacing="4">BOKUL</text>' +
      '</svg>',

    /* Kahraman: parlayan yeni asker */
    hero:
      '<svg viewBox="0 0 200 160" class="cine-svg">' +
      '<circle cx="100" cy="80" r="55" fill="url(#g2)" opacity=".45" class="cine-beacon"/>' +
      '<defs><radialGradient id="g2"><stop offset="0%" stop-color="#FFD52E"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs>' +
      '<g class="cine-float">' +
      '<circle cx="100" cy="62" r="24" fill="#EFBE93"/>' +
      '<path d="M76 60 Q78 38 100 36 Q122 38 124 60 L120 57 Q100 48 80 57 Z" fill="#5B3FA8"/>' +
      '<circle cx="100" cy="37" r="4" fill="#FFD52E"/>' +
      '<circle cx="92" cy="62" r="3.5" fill="#2b1d10"/><circle cx="108" cy="62" r="3.5" fill="#2b1d10"/>' +
      '<path d="M92 72 Q100 79 108 72" stroke="#7a3b2e" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M74 120 Q100 100 126 120 L126 145 L74 145 Z" fill="#31245F"/>' +
      '</g>' +
      '<text x="35" y="40" font-size="18" class="cine-blink1">✨</text>' +
      '<text x="155" y="120" font-size="18" class="cine-blink2">✨</text>' +
      '</svg>',
  };

  B.UI.registerScreen('intro', {
    enter(root, params) {
      const slides = (B.Content.get('story') || {}).intro || [];
      let idx = -1;
      let typeTimer = null;
      const self = this;

      root.classList.add('cine-root');
      root.innerHTML =
        '<div class="cine-stage"></div>' +
        '<p class="cine-text"></p>' +
        '<div class="cine-controls">' +
          '<div class="cine-dots">' + slides.map(() => '<i></i>').join('') + '</div>' +
          '<button class="btn btn-quiet cine-skip">ATLA ▸▸</button>' +
          '<button class="btn btn-action cine-next">DEVAM ▶</button>' +
        '</div>';

      const stage = root.querySelector('.cine-stage');
      const textEl = root.querySelector('.cine-text');
      const nextBtn = root.querySelector('.cine-next');
      const dots = root.querySelectorAll('.cine-dots i');

      function finish() {
        clearInterval(typeTimer);
        B.Save.settings.set({ introSeen: true });
        if (params.replay) return B.UI.show('home');
        B.Engine.afterIntro();
      }

      function show(i) {
        clearInterval(typeTimer);
        idx = i;
        if (idx >= slides.length) return finish();
        const s = slides[idx];
        dots.forEach((d, k) => d.classList.toggle('on', k <= idx));
        stage.innerHTML = ART[s.art] || '';
        stage.classList.remove('cine-in'); void stage.offsetWidth;
        stage.classList.add('cine-in');
        B.Audio.play(s.art === 'chaos' ? 'hit' : s.art === 'hero' ? 'fanfare' : 'tick');

        // Yazı-makinesi anlatım + mırıltı
        textEl.textContent = '';
        let c = 0;
        typeTimer = setInterval(() => {
          textEl.textContent = s.text.slice(0, ++c);
          if (c % 4 === 0) B.Audio.play('blip');
          if (c >= s.text.length) clearInterval(typeTimer);
        }, 22);

        nextBtn.textContent = idx === slides.length - 1 ? '⚔️ GÖREVE HAZIRIM!' : 'DEVAM ▶';
      }

      nextBtn.onclick = () => {
        // Yazı hâlâ akıyorsa önce tamamla, ikinci dokunuşta ilerle
        if (textEl.textContent.length < slides[idx].text.length) {
          clearInterval(typeTimer);
          textEl.textContent = slides[idx].text;
          return;
        }
        show(idx + 1);
      };
      root.querySelector('.cine-skip').onclick = finish;

      show(0);
      this._cleanup = () => clearInterval(typeTimer);
    },
    exit() { if (this._cleanup) this._cleanup(); },
  });
})(window.BOKUL = window.BOKUL || {});
