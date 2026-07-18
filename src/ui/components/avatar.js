/* BOKUL — Avatar Sistemi (v0.8: genişletilmiş)
 * SVG parça tabanlı karakter: cinsiyet, ten, saç modeli/rengi, GÖZ RENGİ,
 * göz/ağız stili, aksesuar, çerçeve. Fotoğraf modu cihazda kalır.
 * Kilitli parçalar rewards.json kozmetik id'leriyle eşleşir. */
(function (B) {

  /* ---------- Parça kataloğu (cosmeticId olmayanlar herkese açık) ---------- */
  const CATALOG = {
    skins: [
      { id: 0, color: '#FBE0C4' }, { id: 1, color: '#F7D2B0' }, { id: 2, color: '#EFBE93' },
      { id: 3, color: '#D9A06B' }, { id: 4, color: '#B57843' }, { id: 5, color: '#8C5A32' },
    ],
    hairColors: [
      { id: 0, color: '#3B2A1A', name: 'Kahve' },
      { id: 1, color: '#1C1C24', name: 'Siyah' },
      { id: 2, color: '#B7742F', name: 'Kumral' },
      { id: 3, color: '#E8C25A', name: 'Sarı' },
      { id: 4, color: '#C4472B', name: 'Kızıl' },
      { id: 5, color: '#C9C9D9', name: 'Gümüş' },
      { id: 6, color: '#3E7BFF', name: 'Gece Mavisi', cosmeticId: 'hc-blue' },
      { id: 7, color: '#9D6BFF', name: 'Mor', cosmeticId: 'hc-purple' },
      { id: 8, color: '#FF4FD8', name: 'Neon Pembe', cosmeticId: 'hc-neon' },
      { id: 9, color: '#3DF2D2', name: 'Turkuaz', cosmeticId: 'hc-teal' },
    ],
    eyeColors: [
      { id: 0, color: '#6B4423', name: 'Kahve' },
      { id: 1, color: '#23212B', name: 'Siyah' },
      { id: 2, color: '#3E7BFF', name: 'Mavi' },
      { id: 3, color: '#3E9E62', name: 'Yeşil' },
      { id: 4, color: '#9A7B3F', name: 'Ela' },
      { id: 5, color: '#8FA3C2', name: 'Gri' },
    ],
    hairs: [
      { id: 0, name: 'Kısa' },
      { id: 1, name: 'Uzun' },
      { id: 2, name: 'Topuz' },
      { id: 3, name: 'Kıvırcık', cosmeticId: 'hair-curly' },
      { id: 4, name: 'Sıfır' },
      { id: 5, name: 'At Kuyruğu' },
      { id: 6, name: 'İki Örgü' },
      { id: 7, name: 'Kâkül' },
      { id: 8, name: 'Kirpi', cosmeticId: 'hair-spiky' },
    ],
    eyes: [
      { id: 0, name: 'Klasik' }, { id: 1, name: 'Neşeli' },
      { id: 2, name: 'Yıldız Göz', cosmeticId: 'eyes-star' },
    ],
    mouths: [
      { id: 0, name: 'Gülümseme' }, { id: 1, name: 'Kocaman Gülüş' },
      { id: 2, name: 'Sırıtış', cosmeticId: 'mouth-grin' },
      { id: 3, name: 'Islık' },
    ],
    accs: [
      { id: 'none', name: 'Yok' },
      { id: 'beret', name: 'Komutan Beresi', cosmeticId: 'av-beret' },
      { id: 'glasses', name: 'Pilot Gözlüğü', cosmeticId: 'acc-glasses' },
      { id: 'headset', name: 'Uzay Kulaklığı', cosmeticId: 'acc-headset' },
      { id: 'crown', name: 'Galaksi Tacı', cosmeticId: 'acc-crown' },
    ],
    rings: [
      { id: 'none', name: 'Yok' },
      { id: 'neon', name: 'Neon Halka', cosmeticId: 'ring-neon' },
      { id: 'galaxy', name: 'Galaksi Halkası', cosmeticId: 'ring-galaxy' },
    ],
  };

  /* Eski kayıtlardan gelen avatarları yeni yapıya tamamla */
  function normalize(a) {
    a = a || {};
    return {
      gender: a.gender || null,               // 'kiz' | 'erkek' | null
      skin: a.skin ?? 2, hair: a.hair ?? 0, hairColor: a.hairColor ?? 0,
      eyeColor: a.eyeColor ?? 0,
      eyes: a.eyes ?? 0, mouth: a.mouth ?? 0, acc: a.acc || 'none', ring: a.ring || 'none',
      photo: a.photo || null, usePhoto: !!a.usePhoto,
    };
  }

  function isUnlocked(part) {
    if (!part || !part.cosmeticId) return true;
    return B.State.data.inventory.cosmetics.includes(part.cosmeticId);
  }

  /* ---------- SVG çizim parçaları ---------- */
  function hairSvg(style, color) {
    const tie = '#FFD52E'; // saç lastiği
    switch (style) {
      case 0: // kısa
        return '<path d="M24 52 Q22 20 60 16 Q98 20 96 52 L90 50 Q88 32 60 30 Q32 32 30 50 Z" fill="' + color + '"/>';
      case 1: // uzun
        return '<path d="M24 52 Q22 18 60 14 Q98 18 96 52 L98 84 Q92 90 86 84 L86 50 Q82 32 60 30 Q38 32 34 50 L34 84 Q28 90 22 84 Z" fill="' + color + '"/>';
      case 2: // topuz
        return '<circle cx="60" cy="14" r="12" fill="' + color + '"/>' +
               '<path d="M26 50 Q26 24 60 20 Q94 24 94 50 L88 48 Q86 34 60 32 Q34 34 32 48 Z" fill="' + color + '"/>';
      case 3: // kıvırcık
        return '<circle cx="34" cy="38" r="12" fill="' + color + '"/><circle cx="47" cy="26" r="13" fill="' + color + '"/>' +
               '<circle cx="62" cy="22" r="13" fill="' + color + '"/><circle cx="77" cy="27" r="13" fill="' + color + '"/>' +
               '<circle cx="88" cy="39" r="12" fill="' + color + '"/>';
      case 5: // at kuyruğu
        return '<path d="M24 52 Q22 20 60 16 Q98 20 96 52 L90 50 Q88 32 60 30 Q32 32 30 50 Z" fill="' + color + '"/>' +
               '<path d="M90 34 Q108 44 103 70 Q100 90 91 100 Q85 88 90 68 Q93 50 84 40 Z" fill="' + color + '"/>' +
               '<rect x="86" y="36" width="9" height="6" rx="3" fill="' + tie + '" transform="rotate(30 90 39)"/>';
      case 6: // iki örgü
        return '<path d="M24 52 Q22 20 60 16 Q98 20 96 52 L90 50 Q88 32 60 30 Q32 32 30 50 Z" fill="' + color + '"/>' +
               '<circle cx="26" cy="62" r="7" fill="' + color + '"/><circle cx="24" cy="76" r="6.5" fill="' + color + '"/><circle cx="23" cy="89" r="6" fill="' + color + '"/>' +
               '<circle cx="94" cy="62" r="7" fill="' + color + '"/><circle cx="96" cy="76" r="6.5" fill="' + color + '"/><circle cx="97" cy="89" r="6" fill="' + color + '"/>' +
               '<rect x="20" y="94" width="8" height="5" rx="2.5" fill="' + tie + '"/><rect x="93" y="94" width="8" height="5" rx="2.5" fill="' + tie + '"/>';
      case 7: // kâkül (perçemli)
        return '<path d="M24 52 Q22 18 60 15 Q98 18 96 52 L96 58 L88 44 L80 56 L72 42 L64 55 L56 42 L48 56 L40 44 L32 58 L24 58 Z" fill="' + color + '"/>';
      case 8: // kirpi
        return '<path d="M26 50 L30 26 L40 40 L46 16 L55 36 L62 12 L70 34 L78 16 L84 38 L92 26 L94 50 Q80 34 60 34 Q40 34 26 50 Z" fill="' + color + '"/>' +
               '<path d="M26 50 Q40 36 60 36 Q80 36 94 50 L90 52 Q75 40 60 40 Q45 40 30 52 Z" fill="' + color + '"/>';
      default: return ''; // sıfır (4)
    }
  }

  function eyesSvg(style, eyeColor, lashes) {
    // Gözler BÜYÜK ve iris BASKIN çizilir; küçük boyutlarda bile renk net görünsün.
    let s = '';
    if (style === 1) { // neşeli (gülen kapalı gözler)
      s = '<path d="M35 58 Q44 49 53 58" stroke="#2b1d10" stroke-width="4.5" fill="none" stroke-linecap="round"/>' +
          '<path d="M67 58 Q76 49 85 58" stroke="#2b1d10" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    } else if (style === 2) { // yıldız göz
      s = star(44, 57, 9, eyeColor) + star(76, 57, 9, eyeColor);
    } else { // klasik: kocaman gözler, geniş renkli iris
      s = '<ellipse cx="44" cy="57" rx="9" ry="9.5" fill="#fff" stroke="#2b1d10" stroke-width="1.2"/>' +
          '<ellipse cx="76" cy="57" rx="9" ry="9.5" fill="#fff" stroke="#2b1d10" stroke-width="1.2"/>' +
          '<circle cx="44" cy="58" r="6" fill="' + eyeColor + '"/><circle cx="76" cy="58" r="6" fill="' + eyeColor + '"/>' +
          '<circle cx="44" cy="58" r="2.6" fill="#16121c"/><circle cx="76" cy="58" r="2.6" fill="#16121c"/>' +
          '<circle cx="46.5" cy="55" r="1.9" fill="#fff"/><circle cx="78.5" cy="55" r="1.9" fill="#fff"/>';
    }
    if (lashes && style !== 2) { // kirpikler
      s += '<path d="M33 51 L29 46 M38 48 L35 42 M87 51 L91 46 M82 48 L85 42" stroke="#2b1d10" stroke-width="2.6" stroke-linecap="round"/>';
    }
    return s;
  }

  function star(cx, cy, r, fill) {
    let p = '';
    for (let i = 0; i < 10; i++) {
      const rad = (i % 2 ? r / 2 : r), a = -Math.PI / 2 + i * Math.PI / 5;
      p += (i ? 'L' : 'M') + (cx + rad * Math.cos(a)).toFixed(1) + ' ' + (cy + rad * Math.sin(a)).toFixed(1) + ' ';
    }
    return '<path d="' + p + 'Z" fill="' + fill + '"/>';
  }

  function mouthSvg(style) {
    switch (style) {
      case 1: return '<path d="M42 72 Q60 92 78 72 Z" fill="#7a3b2e"/><path d="M48 76 Q60 84 72 76 Q60 80 48 76 Z" fill="#fff"/>';
      case 2: return '<path d="M44 76 Q60 86 80 70" stroke="#7a3b2e" stroke-width="5" fill="none" stroke-linecap="round"/>';
      case 3: return '<circle cx="60" cy="77" r="5.5" fill="#7a3b2e"/><path d="M68 70 Q74 66 78 68" stroke="#c9c9d9" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>';
      default: return '<path d="M46 74 Q60 84 74 74" stroke="#7a3b2e" stroke-width="5" fill="none" stroke-linecap="round"/>';
    }
  }

  function accSvg(id) {
    switch (id) {
      case 'beret':
        return '<path d="M26 40 Q28 16 60 14 Q92 16 94 40 L90 37 Q60 26 30 37 Z" fill="#5B3FA8"/>' +
               '<circle cx="60" cy="15" r="4.5" fill="#FFD52E"/>';
      case 'glasses':
        return '<circle cx="44" cy="56" r="12" fill="none" stroke="#3DF2D2" stroke-width="4"/>' +
               '<circle cx="76" cy="56" r="12" fill="none" stroke="#3DF2D2" stroke-width="4"/>' +
               '<path d="M56 56 L64 56" stroke="#3DF2D2" stroke-width="4"/>';
      case 'headset':
        return '<path d="M28 48 Q28 18 60 18 Q92 18 92 48" stroke="#9D6BFF" stroke-width="7" fill="none" stroke-linecap="round"/>' +
               '<rect x="20" y="46" width="12" height="20" rx="6" fill="#9D6BFF"/>' +
               '<rect x="88" y="46" width="12" height="20" rx="6" fill="#9D6BFF"/>';
      case 'crown':
        return '<path d="M34 30 L40 12 L52 24 L60 8 L68 24 L80 12 L86 30 Z" fill="#FFD52E"/>' +
               '<circle cx="40" cy="14" r="3" fill="#FF4FD8"/><circle cx="60" cy="10" r="3" fill="#3DF2D2"/><circle cx="80" cy="14" r="3" fill="#FF4FD8"/>';
      default: return '';
    }
  }

  function ringSvg(id) {
    switch (id) {
      case 'neon':
        return '<circle cx="60" cy="60" r="57" fill="none" stroke="#FF4FD8" stroke-width="5"/>';
      case 'galaxy':
        return '<circle cx="60" cy="60" r="57" fill="none" stroke="#3DF2D2" stroke-width="5" stroke-dasharray="14 8"/>' +
               star(60, 6, 6, '#FFD52E');
      default: return '';
    }
  }

  /* ---------- Ana çizici ---------- */
  function svg(a) {
    a = normalize(a);
    const skin = CATALOG.skins[a.skin].color;
    const hairC = (CATALOG.hairColors[a.hairColor] || CATALOG.hairColors[0]).color;
    const eyeC = (CATALOG.eyeColors[a.eyeColor] || CATALOG.eyeColors[0]).color;
    return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="60" cy="60" r="54" fill="#31245F"/>' +
      '<ellipse cx="60" cy="64" rx="32" ry="34" fill="' + skin + '"/>' +
      '<circle cx="27" cy="64" r="6" fill="' + skin + '"/><circle cx="93" cy="64" r="6" fill="' + skin + '"/>' +
      hairSvg(a.hair, hairC) +
      eyesSvg(a.eyes, eyeC, a.gender === 'kiz') +
      '<ellipse cx="60" cy="66" rx="5" ry="6" fill="rgba(0,0,0,.12)"/>' +
      mouthSvg(a.mouth) +
      accSvg(a.acc) +
      ringSvg(a.ring) +
      '</svg>';
  }

  /* HUD/ekranlar için hazır HTML: fotoğraf modundaysa yuvarlak portre */
  function el(a, cls) {
    a = normalize(a);
    if (a.usePhoto && a.photo) {
      return '<span class="avatar-holder ' + (cls || '') + '"><img class="avatar-photo" src="' + a.photo + '" alt="avatar">' +
             '<svg viewBox="0 0 120 120" class="avatar-ring-svg">' + ringSvg(a.ring) + '</svg></span>';
    }
    return '<span class="avatar-holder ' + (cls || '') + '">' + svg(a) + '</span>';
  }

  /* Cinsiyete göre başlangıç görünümü (hepsi sonradan değiştirilebilir) */
  function preset(gender) {
    return gender === 'kiz'
      ? { gender: 'kiz', skin: 2, hair: 6, hairColor: 2, eyeColor: 0, eyes: 0, mouth: 0, acc: 'none', ring: 'none', photo: null, usePhoto: false }
      : { gender: 'erkek', skin: 2, hair: 0, hairColor: 0, eyeColor: 0, eyes: 0, mouth: 0, acc: 'none', ring: 'none', photo: null, usePhoto: false };
  }

  /* Bir kozmetik hangi avatar slotundaki hangi parça id'sine denk düşer? */
  function partIdFor(item) {
    const maps = { hair: CATALOG.hairs, hairColor: CATALOG.hairColors, eyes: CATALOG.eyes,
                   mouth: CATALOG.mouths, acc: CATALOG.accs, ring: CATALOG.rings };
    const p = (maps[item.type] || []).find(x => x.cosmeticId === item.id);
    return p ? p.id : null;
  }

  /* Satılan kozmetik takılıysa o slotu varsayılana döndür */
  function unequipCosmetic(avatar, item) {
    const a = normalize(avatar);
    const pid = partIdFor(item);
    if (pid == null) return a;
    const def = { hair: 0, hairColor: 0, eyes: 0, mouth: 0, acc: 'none', ring: 'none' };
    if (a[item.type] === pid) a[item.type] = def[item.type];
    return a;
  }

  B.Avatar = { CATALOG, normalize, svg, el, isUnlocked, preset, partIdFor, unequipCosmetic };
})(window.BOKUL = window.BOKUL || {});
