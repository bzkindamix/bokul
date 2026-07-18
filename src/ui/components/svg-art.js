/* BOKUL — SVG Sanat Kütüphanesi
 * Emoji yerine el çizimi vektör karakterler: Baba Komutan (5 ifade) ve boss'lar.
 * Tümü inline SVG string üretir — dosya yok, tek dosya şartına uygun. */
(function (B) {

  /* ---------- BABA KOMUTAN ----------
   * İfadeler: normal | happy | surprised | proud | stern
   * opts: { mouthOpen: bool (konuşma karesi), blink: bool (göz kırpma karesi) } */
  function commander(expr, opts) {
    expr = expr || 'normal';
    opts = opts || {};

    // Kaşlar: ifadeye göre eğim
    const brows = {
      normal:    '<rect x="30" y="42" width="20" height="5" rx="2.5" fill="#4a3320" transform="rotate(-4 40 44)"/><rect x="70" y="42" width="20" height="5" rx="2.5" fill="#4a3320" transform="rotate(4 80 44)"/>',
      happy:     '<rect x="30" y="40" width="20" height="5" rx="2.5" fill="#4a3320" transform="rotate(-10 40 42)"/><rect x="70" y="40" width="20" height="5" rx="2.5" fill="#4a3320" transform="rotate(10 80 42)"/>',
      surprised: '<rect x="30" y="36" width="20" height="5" rx="2.5" fill="#4a3320"/><rect x="70" y="36" width="20" height="5" rx="2.5" fill="#4a3320"/>',
      proud:     '<rect x="30" y="41" width="20" height="5" rx="2.5" fill="#4a3320" transform="rotate(-8 40 43)"/><rect x="70" y="41" width="20" height="5" rx="2.5" fill="#4a3320" transform="rotate(8 80 43)"/>',
      stern:     '<rect x="30" y="44" width="20" height="6" rx="3" fill="#4a3320" transform="rotate(8 40 47)"/><rect x="70" y="44" width="20" height="6" rx="3" fill="#4a3320" transform="rotate(-8 80 47)"/>',
    }[expr];

    // Gözler
    const eyesMap = {
      normal:    '<circle cx="42" cy="54" r="4.5" fill="#2b1d10"/><circle cx="78" cy="54" r="4.5" fill="#2b1d10"/>',
      happy:     '<path d="M36 55 Q42 49 48 55" stroke="#2b1d10" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M72 55 Q78 49 84 55" stroke="#2b1d10" stroke-width="4" fill="none" stroke-linecap="round"/>',
      surprised: '<circle cx="42" cy="55" r="6.5" fill="#fff"/><circle cx="42" cy="55" r="3.5" fill="#2b1d10"/><circle cx="78" cy="55" r="6.5" fill="#fff"/><circle cx="78" cy="55" r="3.5" fill="#2b1d10"/>',
      proud:     '<path d="M36 54 Q42 50 48 54" stroke="#2b1d10" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M72 54 Q78 50 84 54" stroke="#2b1d10" stroke-width="4" fill="none" stroke-linecap="round"/>',
      stern:     '<circle cx="42" cy="55" r="4" fill="#2b1d10"/><circle cx="78" cy="55" r="4" fill="#2b1d10"/>',
    };
    // Göz kırpma karesi her ifadeyi ezer
    const eyes = opts.blink
      ? '<path d="M36 55 Q42 58 48 55" stroke="#2b1d10" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M72 55 Q78 58 84 55" stroke="#2b1d10" stroke-width="4" fill="none" stroke-linecap="round"/>'
      : eyesMap[expr];

    // Ağız (bıyığın altında)
    const mouthMap = {
      normal:    '<path d="M52 86 Q60 90 68 86" stroke="#7a3b2e" stroke-width="4" fill="none" stroke-linecap="round"/>',
      happy:     '<path d="M48 84 Q60 96 72 84" stroke="#7a3b2e" stroke-width="4" fill="none" stroke-linecap="round"/>',
      surprised: '<ellipse cx="60" cy="88" rx="7" ry="9" fill="#7a3b2e"/>',
      proud:     '<path d="M48 85 Q60 94 72 85" stroke="#7a3b2e" stroke-width="4" fill="none" stroke-linecap="round"/>',
      stern:     '<path d="M52 89 Q60 86 68 89" stroke="#7a3b2e" stroke-width="4" fill="none" stroke-linecap="round"/>',
    };
    // Konuşma karesi: ağız açık (bıyık hafif yukarı oynar — canlılık hissi)
    const mouth = opts.mouthOpen
      ? '<ellipse cx="60" cy="88" rx="8" ry="7" fill="#5e2b20"/><ellipse cx="60" cy="91" rx="4.5" ry="3" fill="#c96a5a"/>'
      : mouthMap[expr];

    return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
      // yüz
      '<ellipse cx="60" cy="62" rx="36" ry="38" fill="#EFBE93"/>' +
      '<ellipse cx="60" cy="62" rx="36" ry="38" fill="none" stroke="#c98f5f" stroke-width="2"/>' +
      // kulaklar
      '<circle cx="23" cy="62" r="7" fill="#EFBE93" stroke="#c98f5f" stroke-width="2"/>' +
      '<circle cx="97" cy="62" r="7" fill="#EFBE93" stroke="#c98f5f" stroke-width="2"/>' +
      // bere (mor, altın yıldızlı)
      '<path d="M20 44 Q22 16 60 14 Q98 16 100 44 L96 40 Q60 28 24 40 Z" fill="#5B3FA8"/>' +
      '<path d="M22 42 Q60 28 98 42 L98 47 Q60 34 22 47 Z" fill="#4A3690"/>' +
      '<circle cx="60" cy="15" r="5" fill="#FFD52E"/>' +
      '<path d="M78 20 l3.5 6.5 7 .8 -5 5 1.3 7 -6.8 -3.5 -6.8 3.5 1.3 -7 -5 -5 7 -.8 Z" fill="#FFD52E"/>' +
      brows + eyes +
      // burun
      '<ellipse cx="60" cy="67" rx="6" ry="7" fill="#DFA672"/>' +
      // POS BIYIK — karakterin imzası
      '<path d="M60 76 Q45 70 34 76 Q36 86 48 85 Q56 84 60 79 Q64 84 72 85 Q84 86 86 76 Q75 70 60 76 Z" fill="#4a3320"/>' +
      mouth +
      // yaka (üniforma)
      '<path d="M32 96 Q60 108 88 96 L88 120 L32 120 Z" fill="#31245F"/>' +
      '<rect x="54" y="100" width="12" height="8" rx="2" fill="#FFD52E"/>' +
      '</svg>';
  }

  /* ---------- BOSS'LAR ---------- */
  const bosses = {
    /* Bölünmez Kaya — asık suratlı granit */
    'boss-s1': '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M18 96 L26 40 Q34 18 60 16 Q88 18 94 42 L102 96 Q80 108 60 106 Q38 108 18 96 Z" fill="#7d8496"/>' +
      '<path d="M30 50 L44 44 M78 40 L92 52 M50 100 L58 88" stroke="#5a6070" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M30 58 L52 62 M90 58 L68 62" stroke="#3a3f4c" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="46" cy="70" r="6" fill="#1c1f28"/><circle cx="74" cy="70" r="6" fill="#1c1f28"/>' +
      '<path d="M44 90 Q60 82 76 90" stroke="#3a3f4c" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '</svg>',

    /* Çifte Kule — ikiz sinirli kuleler */
    'boss-s2': '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="18" y="30" width="34" height="80" rx="6" fill="#8A6FD1"/>' +
      '<rect x="68" y="30" width="34" height="80" rx="6" fill="#7157B8"/>' +
      '<path d="M18 30 L24 18 L30 30 L36 18 L42 30 L48 18 L52 30 Z" fill="#8A6FD1"/>' +
      '<path d="M68 30 L74 18 L80 30 L86 18 L92 30 L98 18 L102 30 Z" fill="#7157B8"/>' +
      '<circle cx="30" cy="56" r="5" fill="#1c1f28"/><circle cx="42" cy="56" r="5" fill="#1c1f28"/>' +
      '<circle cx="80" cy="56" r="5" fill="#1c1f28"/><circle cx="92" cy="56" r="5" fill="#1c1f28"/>' +
      '<path d="M28 74 Q36 68 44 74" stroke="#2d2350" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M78 74 Q86 80 94 74" stroke="#241c40" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<rect x="24" y="88" width="10" height="14" rx="2" fill="#4A3690"/><rect x="86" y="88" width="10" height="14" rx="2" fill="#3a2b72"/>' +
      '</svg>',

    /* Üç Başlı Sayı Ejderi */
    'boss-s3': '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M30 112 Q20 84 34 66 M60 112 Q56 88 60 62 M90 112 Q100 84 86 66" stroke="#3E9E62" stroke-width="14" fill="none" stroke-linecap="round"/>' +
      '<circle cx="32" cy="56" r="16" fill="#52C97E"/><circle cx="60" cy="46" r="19" fill="#42B26C"/><circle cx="88" cy="56" r="16" fill="#52C97E"/>' +
      '<path d="M24 42 L28 32 L33 41 M52 30 L58 18 L64 30 M80 42 L84 32 L89 41" stroke="#FFD52E" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<circle cx="27" cy="54" r="3.5" fill="#12240c"/><circle cx="37" cy="54" r="3.5" fill="#12240c"/>' +
      '<circle cx="54" cy="44" r="4" fill="#12240c"/><circle cx="66" cy="44" r="4" fill="#12240c"/>' +
      '<circle cx="83" cy="54" r="3.5" fill="#12240c"/><circle cx="93" cy="54" r="3.5" fill="#12240c"/>' +
      '<path d="M26 64 Q32 68 38 64 M53 56 Q60 62 67 56 M82 64 Q88 68 94 64" stroke="#12240c" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</svg>',

    /* Basamak Golemi — sayı bloklarından dev (ÜNİTE BOSS'U) */
    'boss-s4': '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="30" y="54" width="60" height="56" rx="8" fill="#6B7385"/>' +
      '<rect x="14" y="60" width="16" height="34" rx="5" fill="#7d8496"/><rect x="90" y="60" width="16" height="34" rx="5" fill="#7d8496"/>' +
      '<rect x="24" y="14" width="72" height="44" rx="10" fill="#7d8496"/>' +
      '<rect x="38" y="64" width="18" height="18" rx="4" fill="#31245F"/><text x="47" y="78" font-size="14" font-weight="bold" fill="#3DF2D2" text-anchor="middle" font-family="monospace">4</text>' +
      '<rect x="64" y="64" width="18" height="18" rx="4" fill="#31245F"/><text x="73" y="78" font-size="14" font-weight="bold" fill="#3DF2D2" text-anchor="middle" font-family="monospace">8</text>' +
      '<rect x="51" y="86" width="18" height="18" rx="4" fill="#31245F"/><text x="60" y="100" font-size="14" font-weight="bold" fill="#3DF2D2" text-anchor="middle" font-family="monospace">7</text>' +
      '<rect x="34" y="24" width="14" height="10" rx="3" fill="#2b3040"/><rect x="72" y="24" width="14" height="10" rx="3" fill="#2b3040"/>' +
      '<circle cx="41" cy="29" r="4" fill="#3DF2D2"/><circle cx="79" cy="29" r="4" fill="#3DF2D2"/>' +
      '<path d="M42 46 L54 42 L66 46 L78 42" stroke="#2b3040" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '</svg>',
  };

  /* Bilinmeyen boss'lar için null döner; ekran ikon emojisine düşer */
  function boss(id) {
    return bosses[id] || null;
  }

  B.SvgArt = { commander, boss };
})(window.BOKUL = window.BOKUL || {});
