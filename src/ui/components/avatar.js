/* BOKUL — Avatar Sistemi
 * SVG parça tabanlı karakter: ten, saç, göz, ağız, aksesuar, çerçeve.
 * Fotoğraf modu: cihazdan seçilen fotoğraf CİHAZDA kalır (localStorage),
 * hiçbir yere yüklenmez — çocuk gizliliği önceliklidir.
 * Kilitli parçalar rewards.json kozmetik id'leriyle eşleşir (sandıktan çıkar). */
(function (B) {

  /* ---------- Parça kataloğu ----------
   * cosmeticId olmayan parçalar herkese açıktır. */
  const CATALOG = {
    skins: [
      { id: 0, color: '#F7D2B0' }, { id: 1, color: '#EFBE93' }, { id: 2, color: '#D9A06B' },
      { id: 3, color: '#B57843' }, { id: 4, color: '#8C5A32' },
    ],
    hairColors: [
      { id: 0, color: '#3B2A1A', name: 'Kahve' }, { id: 1, color: '#1C1C24', name: 'Siyah' },
      { id: 2, color: '#B7742F', name: 'Kumral' }, { id: 3, color: '#E8C25A', name: 'Sarı' },
      { id: 4, color: '#3E7BFF', name: 'Gece Mavisi', cosmeticId: 'hc-blue' },
      { id: 5, color: '#FF4FD8', name: 'Neon Pembe', cosmeticId: 'hc-neon' },
    ],
    hairs: [
      { id: 0, name: 'Kısa' }, { id: 1, name: 'Uzun' }, { id: 2, name: 'Topuz' },
      { id: 3, name: 'Kıvırcık', cosmeticId: 'hair-curly' }, { id: 4, name: 'Sıfır' },
    ],
    eyes: [
      { id: 0, name: 'Klasik' }, { id: 1, name: 'Neşeli' },
      { id: 2, name: 'Yıldız Göz', cosmeticId: 'eyes-star' },
    ],
    mouths: [
      { id: 0, name: 'Gülümseme' }, { id: 1, name: 'Kocaman Gülüş' },
      { id: 2, name: 'Sırıtış', cosmeticId: 'mouth-grin' },
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
      skin: a.skin ?? 1, hair: a.hair ?? 0, hairColor: a.hairColor ?? 0,
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
      default: return ''; // sıfır (kel)
    }
  }

  function eyesSvg(style) {
    switch (style) {
      case 1: // neşeli
        return '<path d="M38 56 Q44 50 50 56" stroke="#2b1d10" stroke-width="4" fill="none" stroke-linecap="round"/>' +
               '<path d="M70 56 Q76 50 82 56" stroke="#2b1d10" stroke-width="4" fill="none" stroke-linecap="round"/>';
      case 2: // yıldız göz
        return star(44, 55, 7, '#FFD52E') + star(76, 55, 7, '#FFD52E');
      default:
        return '<circle cx="44" cy="56" r="5" fill="#2b1d10"/><circle cx="76" cy="56" r="5" fill="#2b1d10"/>' +
               '<circle cx="46" cy="54" r="1.6" fill="#fff"/><circle cx="78" cy="54" r="1.6" fill="#fff"/>';
    }
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
      case 1: // kocaman gülüş
        return '<path d="M42 72 Q60 92 78 72 Z" fill="#7a3b2e"/><path d="M48 76 Q60 84 72 76 Q60 80 48 76 Z" fill="#fff"/>';
      case 2: // sırıtış
        return '<path d="M44 76 Q60 86 80 70" stroke="#7a3b2e" stroke-width="5" fill="none" stroke-linecap="round"/>';
      default:
        return '<path d="M46 74 Q60 84 74 74" stroke="#7a3b2e" stroke-width="5" fill="none" stroke-linecap="round"/>';
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
    const hairC = CATALOG.hairColors[a.hairColor].color;
    return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="60" cy="60" r="54" fill="#31245F"/>' +
      '<ellipse cx="60" cy="64" rx="32" ry="34" fill="' + skin + '"/>' +
      '<circle cx="27" cy="64" r="6" fill="' + skin + '"/><circle cx="93" cy="64" r="6" fill="' + skin + '"/>' +
      hairSvg(a.hair, hairC) +
      eyesSvg(a.eyes) +
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

  B.Avatar = { CATALOG, normalize, svg, el, isUnlocked };
})(window.BOKUL = window.BOKUL || {});
