/* BOKUL — Giriş Sinematiği
 * "Ne için savaşıyoruz?" — Büyük Sayı Kristali hikâyesi.
 * Slaytlar content/story.json'dan gelir; sahneler saf SVG/CSS animasyon.
 * ATLA ile her an geçilebilir; ilk açılışta otomatik, üsten tekrar izlenebilir. */
(function (B) {

  /* ---------- Sahne görselleri (inline SVG) ---------- */
  const ART = {
    /* Parlayan Büyük Bilgi Kristali (çok yüzlü) */
    crystal:
      '<svg viewBox="0 0 200 160" class="cine-svg">' +
      '<circle cx="100" cy="80" r="64" fill="url(#g1)" opacity=".4"/>' +
      '<defs><radialGradient id="g1"><stop offset="0%" stop-color="#FFD52E"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs>' +
      '<g class="cine-float">' +
      '<path d="M100 18 L138 62 L100 142 L62 62 Z" fill="#3DF2D2" opacity=".95"/>' +
      '<path d="M100 18 L138 62 L100 80 Z" fill="#8ffce9"/>' +
      '<path d="M100 18 L62 62 L100 80 Z" fill="#5cf5db"/>' +
      '<path d="M100 80 L138 62 L100 142 Z" fill="#2fd0b5"/>' +
      '<path d="M100 80 L62 62 L100 142 Z" fill="#39e6c8"/>' +
      '<text x="100" y="74" text-anchor="middle" font-size="15" font-weight="bold" fill="#0b3a32" font-family="monospace">✦</text>' +
      '</g>' +
      '<circle cx="40" cy="30" r="2" fill="#fff" opacity=".8"/><circle cx="165" cy="45" r="2.5" fill="#fff" opacity=".6"/>' +
      '<circle cx="150" cy="120" r="2" fill="#fff" opacity=".7"/><circle cx="30" cy="110" r="1.5" fill="#fff" opacity=".5"/>' +
      '</svg>',

    /* BULANIK — sisli tembel gölge */
    villain:
      '<svg viewBox="0 0 200 160" class="cine-svg">' +
      '<g class="cine-swirl">' +
      '<path d="M100 20 Q152 34 160 82 Q150 132 100 142 Q50 132 40 82 Q48 34 100 20 Z" fill="#1a1030" opacity=".92"/>' +
      '<path d="M100 34 Q140 46 146 82 Q138 120 100 128 Q62 120 54 82 Q60 46 100 34 Z" fill="#2d1b52" opacity=".92"/>' +
      '</g>' +
      '<ellipse cx="80" cy="74" rx="9" ry="6" fill="#FF4FD8"/><ellipse cx="120" cy="74" rx="9" ry="6" fill="#FF4FD8"/>' +
      '<circle cx="80" cy="74" r="3" fill="#160F2E"/><circle cx="120" cy="74" r="3" fill="#160F2E"/>' +
      '<path d="M74 104 Q100 92 126 104" stroke="#FF4FD8" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<g class="cine-blink1"><path d="M30 120 Q45 116 60 122 Q45 126 30 120 Z" fill="#3a2b72" opacity=".7"/></g>' +
      '<g class="cine-blink2"><path d="M140 122 Q158 118 174 124 Q158 128 140 122 Z" fill="#3a2b72" opacity=".7"/></g>' +
      '</svg>',

    /* Kırılan kristal → dört alanda karmaşa (sayı, soru, mikrop, robot) */
    broken:
      '<svg viewBox="0 0 200 160" class="cine-svg">' +
      '<g class="cine-shard s1"><text x="24" y="46" font-size="30" font-family="monospace" fill="#3DF2D2" font-weight="bold">?÷</text></g>' +
      '<g class="cine-shard s2"><text x="150" y="44" font-size="30" fill="#FF4FD8" class="cine-blink1">❓</text></g>' +
      '<g class="cine-shard s3"><text x="26" y="128" font-size="30" fill="#52E88C" class="cine-blink2">🦠</text></g>' +
      '<g class="cine-shard s4"><text x="150" y="128" font-size="30" fill="#9D6BFF">🤖</text></g>' +
      '<g class="cine-tilt">' +
      '<path d="M100 55 L118 82 L100 108 L82 82 Z" fill="none" stroke="#3DF2D2" stroke-width="3" stroke-dasharray="5 5"/>' +
      '<path d="M92 70 L108 94" stroke="#FF4FD8" stroke-width="3" stroke-linecap="round"/>' +
      '</g>' +
      '<text x="100" y="150" text-anchor="middle" font-size="11" fill="#A79BC8">her yer sis...</text>' +
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

    /* Dört cephe: her biri bir kristal parçası */
    fronts:
      '<svg viewBox="0 0 200 160" class="cine-svg">' +
      '<g class="cine-float">' +
      '<g><circle cx="55" cy="55" r="26" fill="#31245F" stroke="#FFB443" stroke-width="2"/><text x="55" y="64" text-anchor="middle" font-size="26">⚔️</text></g>' +
      '<g><circle cx="145" cy="55" r="26" fill="#31245F" stroke="#9D6BFF" stroke-width="2"/><text x="145" y="64" text-anchor="middle" font-size="26">🤖</text></g>' +
      '<g><circle cx="55" cy="115" r="26" fill="#31245F" stroke="#52E88C" stroke-width="2"/><text x="55" y="124" text-anchor="middle" font-size="26">🧼</text></g>' +
      '<g><circle cx="145" cy="115" r="26" fill="#31245F" stroke="#3DF2D2" stroke-width="2"/><text x="145" y="124" text-anchor="middle" font-size="26">🦉</text></g>' +
      '</g>' +
      '<path d="M100 85 L108 78 L106 88 L100 85 Z" fill="#FFD52E" class="cine-beacon"/>' +
      '<circle cx="100" cy="85" r="6" fill="#FFD52E" class="cine-beacon"/>' +
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
        if (params.replay) return B.UI.show('home');
        B.Engine.afterIntro();   // meta.introSeen = true + kaydet + üs
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
        B.Audio.play(s.art === 'villain' || s.art === 'broken' ? 'hit' : s.art === 'hero' ? 'fanfare' : 'tick');

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
