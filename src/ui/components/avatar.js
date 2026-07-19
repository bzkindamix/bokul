/* BOKUL — Avatar Sistemi (v0.12: gövde + kıyafet, bol çeşit, cinsiyet filtresi)
 * SVG parça tabanlı karakter: cinsiyet, ten, saç (17 model), göz rengi+stili,
 * ağız, KIYAFET (60+), aksesuar, çerçeve. Kıyafet artık omuz/gövdede GÖRÜNÜR.
 * Parçalar cinsiyete göre etiketlidir; editörde oyuncunun cinsiyetine göre süzülür.
 * Kilitli parçalar rewards.json kozmetik id'leriyle eşleşir. */
(function (B) {

  let uid = 0; // benzersiz clipPath id sayacı (birden çok avatar aynı sayfada olabilir)

  /* ---------- Renk paletleri (kıyafet üretimi için) ---------- */
  const PAL = [
    { id: 'mavi',     n: 'Mavi',      c1: '#3E7BFF', c2: '#2a55b5' },
    { id: 'kirmizi',  n: 'Kırmızı',   c1: '#E8443B', c2: '#b12f28' },
    { id: 'yesil',    n: 'Yeşil',     c1: '#3E9E62', c2: '#2c7247' },
    { id: 'mor',      n: 'Mor',       c1: '#9D6BFF', c2: '#6f45c9' },
    { id: 'turuncu',  n: 'Turuncu',   c1: '#FF9F1C', c2: '#cc7a08' },
    { id: 'pembe',    n: 'Pembe',     c1: '#FF7FC4', c2: '#d95a9f' },
  ];
  /* Kıyafet biçimleri: id, ad, cinsiyet */
  const SHAPES_UNI = [
    ['tee', 'Tişört'], ['atlet', 'Atlet'], ['hoodie', 'Kapüşonlu'], ['jacket', 'Ceket'],
    ['stripes', 'Çizgili'], ['vneck', 'V-Yaka'],
    ['kazak', 'Kazak'], ['tulum', 'Tulum'], ['kapmont', 'Mont'], // v0.29 yeni kıyafetler
  ];
  const SHAPES_KIZ = [['elbise', 'Elbise'], ['bluz', 'Bluz'], ['kolsuz', 'Askılı']];
  const SHAPES_ERK = [['forma', 'Forma'], ['gomlek', 'Gömlek'], ['yelek', 'Yelek']];

  /* ---------- ALT GİYİM (pantolon/etek/şort…) — v0.65 ----------
   * Ayrı slot: üst (outfit) ile bağımsız seçilir. Tam vücutta çizilir.
   * Tek-parça üstler (elbise/balo/tulum/cübbe) alt giyimi gizler. */
  const BOT_COL = [
    { id: 'lacivert', n: 'Lacivert',  c1: '#2B3A67', c2: '#1D2748' },
    { id: 'siyah',    n: 'Siyah',     c1: '#2A2740', c2: '#191728' },
    { id: 'gri',      n: 'Gri',       c1: '#6B6B7D', c2: '#4D4D5C' },
    { id: 'kot',      n: 'Kot',       c1: '#3E6B9E', c2: '#2C4D73' },
    { id: 'bej',      n: 'Bej',       c1: '#C9A96A', c2: '#A88A4E' },
    { id: 'pembe',    n: 'Pembe',     c1: '#FF7FC4', c2: '#D95A9F' },
    { id: 'mor',      n: 'Mor',       c1: '#9D6BFF', c2: '#6F45C9' },
  ];
  const BOT_SHAPES = [
    ['pantolon',  'Pantolon',   'both'],
    ['sort',      'Şort',       'both'],
    ['kapri',     'Kapri',      'both'],
    ['esofman',   'Eşofman',    'both'],
    ['etek',      'Etek',       'kiz'],
    ['etek_uzun', 'Uzun Etek',  'kiz'],
  ];
  const FREE_BOTTOMS = new Set(['pantolon-lacivert', 'etek-pembe', 'sort-kot']);
  function buildBottoms() {
    const out = [];
    BOT_SHAPES.forEach(([shape, label, gender]) =>
      BOT_COL.forEach(col => {
        const id = shape + '-' + col.id;
        const b = { id, name: col.n + ' ' + label, shape, c1: col.c1, c2: col.c2, gender };
        if (FREE_BOTTOMS.has(id)) b.free = true;
        else { b.cosmeticId = id; b.rarity = 'common'; }
        out.push(b);
      }));
    return out;
  }
  const BOTTOMS = buildBottoms();
  const BOTTOM_BY_ID = {};
  BOTTOMS.forEach(b => { BOTTOM_BY_ID[b.id] = b; });
  const DEFAULT_BOTTOM = 'pantolon-lacivert';
  // Alt giyimi gizleyen tek-parça üstler
  const LONG_TOP = /elbise|balo|tulum|cubbe/;
  // Kolsuz üstler (tam vücutta kollar ten rengi)
  const SLEEVELESS = /atlet|kolsuz|balo/;

  // Başlangıçta yalnızca birkaç kıyafet ÜCRETSİZ; gerisi altınla alınır.
  const FREE_OUTFITS = new Set(['tee-mavi', 'elbise-pembe', 'forma-mavi']);

  function buildOutfits() {
    const out = [];
    const add = (shapes, gender) => shapes.forEach(([shape, label]) =>
      PAL.forEach(p => {
        const id = shape + '-' + p.id;
        const o = { id, name: p.n + ' ' + label, shape, c1: p.c1, c2: p.c2, gender };
        if (FREE_OUTFITS.has(id)) o.free = true;           // ücretsiz başlangıç
        else { o.cosmeticId = id; o.rarity = 'common'; }   // kilitli, satın alınır
        out.push(o);
      }));
    add(SHAPES_UNI, 'both');   // 5×6 = 30
    add(SHAPES_KIZ, 'kiz');    // 3×6 = 18
    add(SHAPES_ERK, 'erkek');  // 3×6 = 18
    // Premium (kilitli) özel kıyafetler — kozmetik id'leri rewards.json'da
    out.push(
      { id: 'zirh',     name: 'Şövalye Zırhı',    shape: 'zirh',     c1: '#9aa3b2', c2: '#3DF2D2', gender: 'both',  rarity: 'epic',      cosmeticId: 'of-zirh' },
      { id: 'uniforma', name: 'Komutan Üniforması', shape: 'uniforma', c1: '#31245F', c2: '#FFD52E', gender: 'both',  rarity: 'rare',      cosmeticId: 'of-uniforma' },
      { id: 'uzay',     name: 'Uzay Giysisi',     shape: 'uzay',     c1: '#e8ecf5', c2: '#3DF2D2', gender: 'both',  rarity: 'epic',      cosmeticId: 'of-uzay' },
      { id: 'robot',    name: 'Robot Zırhı',      shape: 'robot',    c1: '#5b6b86', c2: '#FF4FD8', gender: 'both',  rarity: 'epic',      cosmeticId: 'of-robot' },
      { id: 'cubbe',    name: 'Filozof Cübbesi',  shape: 'cubbe',    c1: '#4A3690', c2: '#FFD52E', gender: 'both',  rarity: 'rare',      cosmeticId: 'of-cubbe' },
      { id: 'pelerin',  name: 'Kahraman Pelerini', shape: 'pelerin',  c1: '#E8443B', c2: '#FFD52E', gender: 'both',  rarity: 'legendary', cosmeticId: 'of-pelerin' },
      { id: 'balo',     name: 'Balo Elbisesi',    shape: 'balo',     c1: '#FF7FC4', c2: '#FFD52E', gender: 'kiz',   rarity: 'epic',      cosmeticId: 'of-balo' },
      { id: 'takim',    name: 'Şık Takım',        shape: 'takim',    c1: '#231A48', c2: '#3DF2D2', gender: 'erkek', rarity: 'rare',      cosmeticId: 'of-takim' },
      { id: 'ninja',    name: 'Ninja Kıyafeti',   shape: 'ninja',    c1: '#2A2740', c2: '#FF4FD8', gender: 'both',  rarity: 'epic',      cosmeticId: 'of-ninja' }
    );
    return out;
  }

  const OUTFITS = buildOutfits();
  const OUTFIT_BY_ID = {};
  OUTFITS.forEach(o => { OUTFIT_BY_ID[o.id] = o; });
  const DEFAULT_OUTFIT = 'tee-mavi';

  /* ---------- Katalog ---------- */
  const CATALOG = {
    skins: [
      { id: 0, color: '#FBE0C4' }, { id: 1, color: '#F7D2B0' }, { id: 2, color: '#EFBE93' },
      { id: 3, color: '#D9A06B' }, { id: 4, color: '#B57843' }, { id: 5, color: '#8C5A32' },
    ],
    hairColors: [
      { id: 0, color: '#3B2A1A', name: 'Kahve' }, { id: 1, color: '#1C1C24', name: 'Siyah' },
      { id: 2, color: '#B7742F', name: 'Kumral' }, { id: 3, color: '#E8C25A', name: 'Sarı' },
      { id: 4, color: '#C4472B', name: 'Kızıl' },  { id: 5, color: '#C9C9D9', name: 'Gümüş' },
      // Özel renkler: saç boyasıyla açılır (Görünüşüm'deki boya reyonundan alınır, mağazada değil)
      { id: 6, color: '#3E7BFF', name: 'Gece Mavisi', cosmeticId: 'hc-blue', rarity: 'rare', dye: true },
      { id: 7, color: '#9D6BFF', name: 'Mor', cosmeticId: 'hc-purple', rarity: 'rare', dye: true },
      { id: 8, color: '#FF4FD8', name: 'Neon Pembe', cosmeticId: 'hc-neon', rarity: 'epic', dye: true },
      { id: 9, color: '#3DF2D2', name: 'Turkuaz', cosmeticId: 'hc-teal', rarity: 'epic', dye: true },
    ],
    eyeColors: [
      { id: 0, color: '#6B4423', name: 'Kahve' }, { id: 1, color: '#23212B', name: 'Siyah' },
      { id: 2, color: '#3E7BFF', name: 'Mavi' },   { id: 3, color: '#3E9E62', name: 'Yeşil' },
      { id: 4, color: '#9A7B3F', name: 'Ela' },    { id: 5, color: '#8FA3C2', name: 'Gri' },
    ],
    hairs: [
      { id: 0,  name: 'Kısa',        gender: 'both' },
      { id: 1,  name: 'Uzun',        gender: 'kiz' },
      { id: 2,  name: 'Topuz',       gender: 'kiz' },
      { id: 3,  name: 'Kıvırcık',    gender: 'both' },
      { id: 4,  name: 'Sıfır',       gender: 'erkek' },
      { id: 5,  name: 'At Kuyruğu',  gender: 'kiz' },
      { id: 6,  name: 'İki Örgü',    gender: 'kiz' },
      { id: 7,  name: 'Kâkül',       gender: 'both' },
      { id: 8,  name: 'Kirpi',       gender: 'erkek' },
      { id: 9,  name: 'Mohawk',      gender: 'erkek' },
      { id: 10, name: 'Afro',        gender: 'both' },
      { id: 11, name: 'Bob',         gender: 'kiz' },
      { id: 12, name: 'Uzun Dalgalı', gender: 'kiz' },
      { id: 13, name: 'Yan Ayrık',   gender: 'both' },
      { id: 14, name: 'Yüksek Topuz', gender: 'kiz' },
      { id: 15, name: 'Undercut',    gender: 'erkek' },
      { id: 16, name: 'İki Topuz',   gender: 'kiz' },
    ],
    eyes: [
      { id: 0, name: 'Klasik' }, { id: 3, name: 'Badem' }, { id: 4, name: 'Kocaman' },
      { id: 5, name: 'Sakin' }, { id: 1, name: 'Neşeli' },
      { id: 2, name: 'Yıldız Göz' },
    ],
    noses: [
      { id: 0, name: 'Küçük' }, { id: 1, name: 'Yuvarlak' }, { id: 2, name: 'Sivri' },
      { id: 3, name: 'Geniş' }, { id: 4, name: 'Minik' },
    ],
    ears: [
      { id: 0, name: 'Yuvarlak' }, { id: 1, name: 'Küçük' }, { id: 2, name: 'Sivri' }, { id: 3, name: 'Geniş' },
    ],
    mouths: [
      { id: 0, name: 'Gülümseme' }, { id: 1, name: 'Kocaman Gülüş' },
      { id: 2, name: 'Sırıtış' }, { id: 3, name: 'Islık' },
    ],
    outfits: OUTFITS,
    bottoms: BOTTOMS,
    accs: [
      { id: 'none', name: 'Yok' },
      { id: 'beret', name: 'Komutan Beresi', cosmeticId: 'av-beret', rarity: 'common' },
      { id: 'glasses', name: 'Pilot Gözlüğü', cosmeticId: 'acc-glasses', rarity: 'rare' },
      { id: 'headset', name: 'Uzay Kulaklığı', cosmeticId: 'acc-headset', rarity: 'epic' },
      { id: 'crown', name: 'Galaksi Tacı', cosmeticId: 'acc-crown', rarity: 'legendary' },
    ],
    rings: [
      { id: 'none', name: 'Yok' },
      { id: 'neon', name: 'Neon Halka', cosmeticId: 'ring-neon', rarity: 'epic' },
      { id: 'galaxy', name: 'Galaksi Halkası', cosmeticId: 'ring-galaxy', rarity: 'legendary' },
    ],
  };

  function normalize(a) {
    a = a || {};
    return {
      gender: a.gender || null,
      skin: a.skin ?? 2, hair: a.hair ?? 0, hairColor: a.hairColor ?? 0, eyeColor: a.eyeColor ?? 0,
      eyes: a.eyes ?? 0, mouth: a.mouth ?? 0, nose: a.nose ?? 0, ear: a.ear ?? 0,
      outfit: OUTFIT_BY_ID[a.outfit] ? a.outfit : DEFAULT_OUTFIT,
      bottom: BOTTOM_BY_ID[a.bottom] ? a.bottom : DEFAULT_BOTTOM,
      acc: a.acc || 'none', ring: a.ring || 'none',
      // Fotoğraf özelliği KVKK gereği kaldırıldı — avatar her zaman çizimdir.
      photo: null, usePhoto: false,
    };
  }

  function isUnlocked(part) {
    if (!part || !part.cosmeticId) return true;
    return B.State.data.inventory.cosmetics.includes(part.cosmeticId);
  }

  /* Cinsiyet süzgeci: 'both' herkese, gendered sadece o cinsiyete */
  function genderOk(part, gender) {
    if (!part.gender || part.gender === 'both') return true;
    return part.gender === gender;
  }
  function hairsFor(gender) { return CATALOG.hairs.filter(h => genderOk(h, gender)); }
  function outfitsFor(gender) { return CATALOG.outfits.filter(o => genderOk(o, gender)); }
  function bottomsFor(gender) { return CATALOG.bottoms.filter(b => genderOk(b, gender)); }

  /* ---------- KIYAFET / GÖVDE ---------- */
  function outfitSvg(id, skin) {
    const o = OUTFIT_BY_ID[id] || OUTFIT_BY_ID[DEFAULT_OUTFIT];
    const c1 = o.c1, c2 = o.c2, shape = o.shape;
    // Omuz/gövde tabanı (badge dairesiyle kırpılır)
    let s = '';
    if (shape === 'pelerin') // pelerin omuzların ARKASINDA
      s += '<path d="M8 120 Q30 96 60 98 Q90 96 112 120 Z" fill="' + c1 + '" opacity=".95"/>';
    s += '<path d="M14 120 Q18 99 44 96 L76 96 Q102 99 106 120 Z" fill="' + c1 + '"/>';
    // Boyun (ten)
    s += '<path d="M53 86 L53 97 Q60 101 67 97 L67 86 Z" fill="' + skin + '"/>';
    // Biçime göre yaka / amblem
    s += detail(shape, c1, c2, skin);
    return s;
  }

  function detail(shape, c1, c2, skin) {
    switch (shape) {
      case 'tee':      return collar(c2);
      case 'atlet':    return '<path d="M48 96 L52 116 M72 96 L68 116" stroke="' + c2 + '" stroke-width="4.5" stroke-linecap="round"/>' + // ince askılar
                              '<path d="M50 97 Q60 107 70 97" fill="none" stroke="' + c2 + '" stroke-width="3" stroke-linecap="round"/>'; // yaka oyuğu
      case 'stripes':  return collar(c2) + '<path d="M20 106 H100 M18 112 H102" stroke="' + c2 + '" stroke-width="4"/>';
      case 'vneck':    return '<path d="M50 97 L60 108 L70 97" fill="none" stroke="' + c2 + '" stroke-width="3.5" stroke-linecap="round"/>';
      case 'hoodie':   return '<path d="M44 97 Q60 90 76 97 L74 104 Q60 99 46 104 Z" fill="' + c2 + '"/>' +
                              '<path d="M56 101 L55 114 M64 101 L65 114" stroke="' + c2 + '" stroke-width="3" stroke-linecap="round"/>';
      case 'jacket':   return '<path d="M45 97 L60 120 L60 100 Z" fill="' + c2 + '"/><path d="M75 97 L60 120 L60 100 Z" fill="' + c2 + '"/>' +
                              '<path d="M57 98 L63 98 L60 108 Z" fill="' + skin + '"/>';
      case 'elbise':   return '<path d="M48 96 Q60 106 72 96" fill="none" stroke="' + c2 + '" stroke-width="3"/>' +
                              '<circle cx="60" cy="103" r="3.5" fill="' + c2 + '"/>';
      case 'bluz':     return '<path d="M46 97 Q52 104 60 98 Q68 104 74 97" fill="none" stroke="' + c2 + '" stroke-width="3.5"/>';
      case 'kolsuz':   return '<path d="M50 96 L54 118 M70 96 L66 118" stroke="' + c2 + '" stroke-width="4" stroke-linecap="round"/>' +
                              '<path d="M52 97 Q60 104 68 97" fill="none" stroke="' + c2 + '" stroke-width="3"/>';
      case 'forma':    return collar(c2) + '<text x="60" y="116" text-anchor="middle" font-size="12" font-weight="bold" fill="' + c2 + '" font-family="monospace">10</text>';
      case 'gomlek':   return '<path d="M52 96 L60 104 L68 96" fill="none" stroke="' + c2 + '" stroke-width="3"/>' +
                              '<circle cx="60" cy="110" r="1.8" fill="' + c2 + '"/><circle cx="60" cy="117" r="1.8" fill="' + c2 + '"/>';
      case 'yelek':    return '<path d="M46 97 L54 120 L54 100 Z" fill="' + c2 + '"/><path d="M74 97 L66 120 L66 100 Z" fill="' + c2 + '"/>';
      case 'zirh':     return '<path d="M40 100 Q60 96 80 100 L78 110 Q60 106 42 110 Z" fill="' + c2 + '" opacity=".8"/>' +
                              '<path d="M60 99 L60 118" stroke="' + c2 + '" stroke-width="2"/><circle cx="60" cy="107" r="3.5" fill="#FFD52E"/>';
      case 'uniforma': return collar(c2) + '<rect x="34" y="100" width="8" height="6" rx="2" fill="' + c2 + '"/><rect x="78" y="100" width="8" height="6" rx="2" fill="' + c2 + '"/>' +
                              star(60, 110, 5, c2) + '<circle cx="52" cy="116" r="1.6" fill="' + c2 + '"/><circle cx="68" cy="116" r="1.6" fill="' + c2 + '"/>';
      case 'uzay':     return '<path d="M42 98 Q60 94 78 98 L78 103 Q60 99 42 103 Z" fill="' + c2 + '"/>' +
                              '<circle cx="52" cy="112" r="2.4" fill="#52E88C"/><circle cx="60" cy="112" r="2.4" fill="#FFD52E"/><circle cx="68" cy="112" r="2.4" fill="#FF4FD8"/>';
      case 'robot':    return '<path d="M44 102 H76 M50 108 H70" stroke="' + c2 + '" stroke-width="2"/><circle cx="60" cy="106" r="4" fill="' + c2 + '"/><circle cx="60" cy="106" r="1.8" fill="#fff"/>';
      case 'cubbe':    return '<path d="M46 97 L60 108 L74 97 L70 120 L50 120 Z" fill="' + c2 + '" opacity=".55"/>' +
                              '<path d="M46 97 L60 108 L74 97" fill="none" stroke="' + c2 + '" stroke-width="2.5"/>';
      case 'pelerin':  return '<path d="M46 98 Q60 92 74 98 L72 104 Q60 100 48 104 Z" fill="' + c2 + '"/>' + star(60, 112, 5, c2);
      case 'balo':     return '<path d="M46 97 Q60 92 74 97 L74 102 Q60 98 46 102 Z" fill="' + c2 + '" opacity=".8"/>' +
                              '<circle cx="60" cy="107" r="3" fill="' + c2 + '"/><path d="M40 116 Q60 110 80 116" stroke="' + c2 + '" stroke-width="2" fill="none"/>';
      case 'takim':    return '<path d="M50 96 L60 106 L70 96" fill="none" stroke="' + c2 + '" stroke-width="3"/>' +
                              '<path d="M57 98 L63 98 L60 116 Z" fill="' + c2 + '"/>';
      case 'kazak':    return '<path d="M46 96 Q60 103 74 96" fill="none" stroke="' + c2 + '" stroke-width="4.5" stroke-linecap="round"/>' +
                              '<path d="M22 108 H98 M22 114 H98" stroke="' + c2 + '" stroke-width="2" opacity=".55"/>';
      case 'tulum':    return '<path d="M50 96 L52 120 M70 96 L68 120" stroke="' + c2 + '" stroke-width="5" stroke-linecap="round"/>' +
                              '<rect x="53" y="105" width="14" height="10" rx="2.5" fill="' + c2 + '"/><circle cx="60" cy="110" r="1.7" fill="#FFD52E"/>';
      case 'kapmont':  return collar(c2) + '<path d="M60 98 L60 120" stroke="' + c2 + '" stroke-width="3"/>' +
                              '<rect x="43" y="109" width="10" height="8" rx="2" fill="' + c2 + '" opacity=".8"/><rect x="67" y="109" width="10" height="8" rx="2" fill="' + c2 + '" opacity=".8"/>';
      case 'ninja':    return '<path d="M40 100 Q60 96 80 100 L78 108 Q60 104 42 108 Z" fill="' + c2 + '"/>' +
                              '<path d="M50 113 H70" stroke="' + c2 + '" stroke-width="3" stroke-linecap="round"/>' + star(60, 101, 3, '#FFD52E');
      default:         return collar(c2);
    }
  }
  function collar(c) { return '<path d="M49 96 Q60 104 71 96" fill="none" stroke="' + c + '" stroke-width="3.5" stroke-linecap="round"/>'; }

  /* ---------- SAÇ ---------- */
  function hairSvg(style, color) {
    const tie = '#FFD52E';
    switch (style) {
      case 0: return '<path d="M24 52 Q22 20 60 16 Q98 20 96 52 L90 50 Q88 32 60 30 Q32 32 30 50 Z" fill="' + color + '"/>';
      case 1: return '<path d="M24 52 Q22 18 60 14 Q98 18 96 52 L98 84 Q92 90 86 84 L86 50 Q82 32 60 30 Q38 32 34 50 L34 84 Q28 90 22 84 Z" fill="' + color + '"/>';
      case 2: return '<circle cx="60" cy="14" r="12" fill="' + color + '"/><path d="M26 50 Q26 24 60 20 Q94 24 94 50 L88 48 Q86 34 60 32 Q34 34 32 48 Z" fill="' + color + '"/>';
      case 3: return '<circle cx="34" cy="38" r="12" fill="' + color + '"/><circle cx="47" cy="26" r="13" fill="' + color + '"/><circle cx="62" cy="22" r="13" fill="' + color + '"/><circle cx="77" cy="27" r="13" fill="' + color + '"/><circle cx="88" cy="39" r="12" fill="' + color + '"/>';
      case 5: return '<path d="M24 52 Q22 20 60 16 Q98 20 96 52 L90 50 Q88 32 60 30 Q32 32 30 50 Z" fill="' + color + '"/><path d="M90 34 Q108 44 103 70 Q100 90 91 100 Q85 88 90 68 Q93 50 84 40 Z" fill="' + color + '"/><rect x="86" y="36" width="9" height="6" rx="3" fill="' + tie + '" transform="rotate(30 90 39)"/>';
      case 6: return '<path d="M24 52 Q22 20 60 16 Q98 20 96 52 L90 50 Q88 32 60 30 Q32 32 30 50 Z" fill="' + color + '"/><circle cx="26" cy="62" r="7" fill="' + color + '"/><circle cx="24" cy="76" r="6.5" fill="' + color + '"/><circle cx="23" cy="89" r="6" fill="' + color + '"/><circle cx="94" cy="62" r="7" fill="' + color + '"/><circle cx="96" cy="76" r="6.5" fill="' + color + '"/><circle cx="97" cy="89" r="6" fill="' + color + '"/><rect x="20" y="94" width="8" height="5" rx="2.5" fill="' + tie + '"/><rect x="93" y="94" width="8" height="5" rx="2.5" fill="' + tie + '"/>';
      case 7: return '<path d="M24 52 Q22 18 60 15 Q98 18 96 52 L96 58 L88 44 L80 56 L72 42 L64 55 L56 42 L48 56 L40 44 L32 58 L24 58 Z" fill="' + color + '"/>';
      case 8: return '<path d="M26 50 L30 26 L40 40 L46 16 L55 36 L62 12 L70 34 L78 16 L84 38 L92 26 L94 50 Q80 34 60 34 Q40 34 26 50 Z" fill="' + color + '"/><path d="M26 50 Q40 36 60 36 Q80 36 94 50 L90 52 Q75 40 60 40 Q45 40 30 52 Z" fill="' + color + '"/>';
      case 9: return '<path d="M52 12 Q60 8 68 12 L66 50 L54 50 Z" fill="' + color + '"/><path d="M34 50 Q40 42 54 42 L54 50 Z" fill="' + color + '"/><path d="M86 50 Q80 42 66 42 L66 50 Z" fill="' + color + '"/>';
      case 10: return '<circle cx="60" cy="34" r="30" fill="' + color + '"/><path d="M30 50 Q30 40 40 40 L80 40 Q90 40 90 50 L86 50 Q86 44 60 44 Q34 44 34 50 Z" fill="' + color + '"/>';
      case 11: return '<path d="M22 56 Q20 18 60 15 Q100 18 98 56 L94 66 Q92 44 60 32 Q28 44 26 66 Z" fill="' + color + '"/>';
      case 12: return '<path d="M22 54 Q20 16 60 13 Q100 16 98 54 Q102 78 92 96 Q88 82 90 60 Q84 34 60 30 Q36 34 30 60 Q32 82 28 96 Q18 78 22 54 Z" fill="' + color + '"/>';
      case 13: return '<path d="M24 52 Q22 18 60 15 Q98 18 96 52 L90 50 Q88 30 46 30 Q40 40 36 50 Z" fill="' + color + '"/>';
      case 14: return '<ellipse cx="60" cy="12" rx="14" ry="10" fill="' + color + '"/><rect x="53" y="18" width="14" height="8" rx="3" fill="' + tie + '"/><path d="M28 50 Q28 26 60 24 Q92 26 92 50 L86 48 Q84 34 60 34 Q36 34 34 48 Z" fill="' + color + '"/>';
      case 15: return '<path d="M28 46 Q30 22 60 20 Q90 22 92 46 L86 46 Q84 34 60 34 Q36 34 34 46 Z" fill="' + color + '"/>';
      case 16: return '<circle cx="30" cy="30" r="11" fill="' + color + '"/><circle cx="90" cy="30" r="11" fill="' + color + '"/><path d="M26 50 Q26 24 60 20 Q94 24 94 50 L88 48 Q86 34 60 32 Q34 34 32 48 Z" fill="' + color + '"/>';
      default: return ''; // 4 sıfır
    }
  }

  /* ---------- GÖZ ---------- */
  // Açık göz: beyaz + iris(göz rengi) + göz bebeği + parıltı. rx/ry ile şekil değişir.
  function openEye(cx, cy, rx, ry, eyeColor) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#fff" stroke="#2b1d10" stroke-width="1.2"/>' +
      '<circle cx="' + cx + '" cy="' + (cy + 1) + '" r="' + (Math.min(rx, ry) * 0.66).toFixed(1) + '" fill="' + eyeColor + '"/>' +
      '<circle cx="' + cx + '" cy="' + (cy + 1) + '" r="' + (Math.min(rx, ry) * 0.29).toFixed(1) + '" fill="#16121c"/>' +
      '<circle cx="' + (cx + 2.5) + '" cy="' + (cy - 2) + '" r="1.9" fill="#fff"/>';
  }
  function eyesSvg(style, eyeColor, lashes) {
    let s = '';
    if (style === 1) { // Neşeli (kapalı, gülen)
      s = '<path d="M35 58 Q44 49 53 58" stroke="#2b1d10" stroke-width="4.5" fill="none" stroke-linecap="round"/>' +
          '<path d="M67 58 Q76 49 85 58" stroke="#2b1d10" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    } else if (style === 2) { // Yıldız göz
      s = star(44, 57, 9, eyeColor) + star(76, 57, 9, eyeColor);
    } else if (style === 3) { // Badem (yatay oval)
      s = openEye(44, 57, 10, 7.5, eyeColor) + openEye(76, 57, 10, 7.5, eyeColor);
    } else if (style === 4) { // Kocaman (büyük yuvarlak)
      s = openEye(44, 57, 11, 11.5, eyeColor) + openEye(76, 57, 11, 11.5, eyeColor);
    } else if (style === 5) { // Sakin (yarı kapaklı ama açık)
      s = openEye(44, 58, 9, 8, eyeColor) + openEye(76, 58, 9, 8, eyeColor) +
          '<path d="M35 52 Q44 49 53 52 M67 52 Q76 49 85 52" stroke="#2b1d10" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>';
    } else { // 0 Klasik (varsayılan açık)
      s = openEye(44, 57, 9, 9.5, eyeColor) + openEye(76, 57, 9, 9.5, eyeColor);
    }
    if (lashes && style !== 2) {
      s += '<path d="M33 51 L29 46 M38 48 L35 42 M87 51 L91 46 M82 48 L85 42" stroke="#2b1d10" stroke-width="2.6" stroke-linecap="round"/>';
    }
    return s;
  }

  /* ---------- BURUN ---------- */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const cl = v => Math.max(0, Math.min(255, v));
    const r = cl((n >> 16) + amt), g = cl(((n >> 8) & 255) + amt), b = cl((n & 255) + amt);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function noseSvg(style, skin) {
    const sh = shade(skin, -26);
    switch (style) {
      case 1: return '<ellipse cx="60" cy="69" rx="5.5" ry="5" fill="' + sh + '" opacity=".45"/>'; // yuvarlak
      case 2: return '<path d="M60 61 L55.5 71 Q60 74 64.5 71 Z" fill="' + sh + '" opacity=".4"/>'; // sivri
      case 3: return '<ellipse cx="60" cy="70" rx="8" ry="4.5" fill="' + sh + '" opacity=".4"/>'; // geniş
      case 4: return '<circle cx="60" cy="69" r="2.4" fill="' + sh + '" opacity=".5"/>'; // minik
      default: return '<path d="M58 62 Q56.5 70 60 72 Q63.5 70 62 62" fill="none" stroke="' + sh + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>'; // küçük çizgi
    }
  }

  /* ---------- KULAK ---------- */
  function earSvg(style, skin) {
    const sh = shade(skin, -22);
    switch (style) {
      case 1: return '<circle cx="29" cy="64" r="4.5" fill="' + skin + '"/><circle cx="91" cy="64" r="4.5" fill="' + skin + '"/>'; // küçük
      case 2: return '<path d="M28 56 L22 66 L32 65 Z" fill="' + skin + '" stroke="' + sh + '" stroke-width="1"/>' +
                     '<path d="M92 56 L98 66 L88 65 Z" fill="' + skin + '" stroke="' + sh + '" stroke-width="1"/>'; // sivri (elf)
      case 3: return '<ellipse cx="25" cy="64" rx="7.5" ry="9.5" fill="' + skin + '"/><ellipse cx="95" cy="64" rx="7.5" ry="9.5" fill="' + skin + '"/>'; // geniş
      default: return '<circle cx="27" cy="64" r="6" fill="' + skin + '"/><circle cx="93" cy="64" r="6" fill="' + skin + '"/>'; // yuvarlak
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
      case 1: return '<path d="M42 72 Q60 92 78 72 Z" fill="#7a3b2e"/><path d="M48 76 Q60 84 72 76 Q60 80 48 76 Z" fill="#fff"/>';
      case 2: return '<path d="M44 76 Q60 86 80 70" stroke="#7a3b2e" stroke-width="5" fill="none" stroke-linecap="round"/>';
      case 3: return '<circle cx="60" cy="77" r="5.5" fill="#7a3b2e"/><path d="M68 70 Q74 66 78 68" stroke="#c9c9d9" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>';
      default: return '<path d="M46 74 Q60 84 74 74" stroke="#7a3b2e" stroke-width="5" fill="none" stroke-linecap="round"/>';
    }
  }

  function accSvg(id) {
    switch (id) {
      case 'beret': return '<path d="M26 40 Q28 16 60 14 Q92 16 94 40 L90 37 Q60 26 30 37 Z" fill="#5B3FA8"/><circle cx="60" cy="15" r="4.5" fill="#FFD52E"/>';
      case 'glasses': return '<circle cx="44" cy="57" r="12" fill="none" stroke="#3DF2D2" stroke-width="4"/><circle cx="76" cy="57" r="12" fill="none" stroke="#3DF2D2" stroke-width="4"/><path d="M56 57 L64 57" stroke="#3DF2D2" stroke-width="4"/>';
      case 'headset': return '<path d="M28 48 Q28 18 60 18 Q92 18 92 48" stroke="#9D6BFF" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="20" y="46" width="12" height="20" rx="6" fill="#9D6BFF"/><rect x="88" y="46" width="12" height="20" rx="6" fill="#9D6BFF"/>';
      case 'crown': return '<path d="M34 30 L40 12 L52 24 L60 8 L68 24 L80 12 L86 30 Z" fill="#FFD52E"/><circle cx="40" cy="14" r="3" fill="#FF4FD8"/><circle cx="60" cy="10" r="3" fill="#3DF2D2"/><circle cx="80" cy="14" r="3" fill="#FF4FD8"/>';
      default: return '';
    }
  }

  function ringSvg(id) {
    switch (id) {
      case 'neon': return '<circle cx="60" cy="60" r="57" fill="none" stroke="#FF4FD8" stroke-width="5"/>';
      case 'galaxy': return '<circle cx="60" cy="60" r="57" fill="none" stroke="#3DF2D2" stroke-width="5" stroke-dasharray="14 8"/>' + star(60, 6, 6, '#FFD52E');
      default: return '';
    }
  }

  /* ---------- Ana çizici ---------- */
  function svg(a) {
    a = normalize(a);
    const skin = CATALOG.skins[a.skin].color;
    const hairC = (CATALOG.hairColors[a.hairColor] || CATALOG.hairColors[0]).color;
    const eyeC = (CATALOG.eyeColors[a.eyeColor] || CATALOG.eyeColors[0]).color;
    const id = 'bkc' + (uid++);
    // 3D hissi: derinlikli zemin gradyanı + yüz ışığı (sol-üst) + gölge (sağ-alt)
    const defs = '<defs>' +
      '<clipPath id="c' + id + '"><circle cx="60" cy="60" r="54"/></clipPath>' +
      '<radialGradient id="bg' + id + '" cx="38%" cy="30%" r="80%"><stop offset="0%" stop-color="#3d2d74"/><stop offset="100%" stop-color="#211838"/></radialGradient>' +
      '<radialGradient id="hl' + id + '" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity="0.4"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sh' + id + '" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#000" stop-opacity="0.32"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '</defs>';
    return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' + defs +
      '<circle cx="60" cy="60" r="54" fill="url(#bg' + id + ')"/>' +
      '<g clip-path="url(#c' + id + ')">' +
        // arka gölge (derinlik) — figürün arkasında
        '<ellipse cx="78" cy="88" rx="46" ry="42" fill="url(#sh' + id + ')"/>' +
        outfitSvg(a.outfit, skin) +
        earSvg(a.ear, skin) + // kulaklar yüzün arkasında (dışarı taşar)
        '<ellipse cx="60" cy="64" rx="32" ry="34" fill="' + skin + '"/>' +
        hairSvg(a.hair, hairC) +
        eyesSvg(a.eyes, eyeC, a.gender === 'kiz') +
        noseSvg(a.nose, skin) +
        mouthSvg(a.mouth) +
        accSvg(a.acc) +
        // yüz ışığı (yumuşak parlaklık, sol-üst) — hacim hissi
        '<ellipse cx="45" cy="50" rx="20" ry="22" fill="url(#hl' + id + ')" opacity="0.7"/>' +
        // alt gölge (çene/gövde) — hacim hissi
        '<ellipse cx="72" cy="82" rx="34" ry="30" fill="url(#sh' + id + ')"/>' +
      '</g>' +
      // kenar ışığı (rim) — badge parlaklığı
      '<circle cx="60" cy="60" r="52.5" fill="none" stroke="#fff" stroke-opacity="0.14" stroke-width="2"/>' +
      ringSvg(a.ring) +
      '</svg>';
  }

  function el(a, cls) {
    a = normalize(a);
    return '<span class="avatar-holder ' + (cls || '') + '">' + svg(a) + '</span>';
  }

  /* ---------- TAM VÜCUT (ayakta figür) — büyük önizlemeler için ---------- */
  function fullBody(a) {
    a = normalize(a);
    const skin = CATALOG.skins[a.skin].color;
    const hairC = (CATALOG.hairColors[a.hairColor] || CATALOG.hairColors[0]).color;
    const eyeC = (CATALOG.eyeColors[a.eyeColor] || CATALOG.eyeColors[0]).color;
    const o = OUTFIT_BY_ID[a.outfit] || OUTFIT_BY_ID[DEFAULT_OUTFIT];
    const shirt = o.c1, accent = o.c2;
    const longTop = LONG_TOP.test(o.shape || '');   // elbise/tulum/cübbe → alt gizli
    const sleeveless = SLEEVELESS.test(o.shape || ''); // kollar ten rengi
    const shoe = '#20182f';
    const id = 'bkf' + (uid++);
    const defs = '<defs>' +
      '<radialGradient id="fb' + id + '" cx="40%" cy="26%" r="85%"><stop offset="0%" stop-color="#3d2d74"/><stop offset="100%" stop-color="#1b1330"/></radialGradient>' +
      '</defs>';
    // Kafa grubu: mevcut yüz çizimleri (native 0-120 koordinat), ölçekle+üste taşı
    const head =
      '<g transform="translate(10.8,2) scale(0.82)">' +
        earSvg(a.ear, skin) +
        '<ellipse cx="60" cy="64" rx="30" ry="32" fill="' + skin + '"/>' +
        hairSvg(a.hair, hairC) +
        eyesSvg(a.eyes, eyeC, a.gender === 'kiz') +
        noseSvg(a.nose, skin) +
        mouthSvg(a.mouth) +
        accSvg(a.acc) +
      '</g>';
    // Alt gövde: uzun üst → çıplak baldır+ayak; değilse ten bacak + alt giyim garment
    const lower = longTop
      ? '<rect x="49" y="182" width="8" height="18" rx="4" fill="' + skin + '"/>' +
        '<rect x="63" y="182" width="8" height="18" rx="4" fill="' + skin + '"/>'
      : '<rect x="48" y="150" width="9.5" height="50" rx="4.75" fill="' + skin + '"/>' +
        '<rect x="62.5" y="150" width="9.5" height="50" rx="4.75" fill="' + skin + '"/>' +
        bottomFull(a.bottom);
    // Üst gövde
    const torso = longTop
      ? '<path d="M40 94 Q60 86 80 94 L92 200 Q60 210 28 200 Z" fill="' + shirt + '"/>' +
        '<path d="M40 94 Q60 88 80 94 L82 118 Q60 124 38 118 Z" fill="' + accent + '" opacity=".55"/>'
      : '<path d="M40 94 Q60 86 80 94 L83 150 Q60 156 37 150 Z" fill="' + shirt + '"/>' +
        '<path d="M49 95 Q60 92 71 95 L70 100 Q60 103 50 100 Z" fill="' + accent + '"/>'; // yaka
    const armC = sleeveless ? skin : shirt; // kolsuz üstlerde kollar ten rengi
    return '<svg viewBox="0 0 120 214" xmlns="http://www.w3.org/2000/svg">' + defs +
      '<rect x="0" y="0" width="120" height="214" rx="16" fill="url(#fb' + id + ')"/>' +
      '<ellipse cx="60" cy="207" rx="30" ry="6" fill="rgba(0,0,0,.32)"/>' + // yer gölgesi
      lower +
      '<ellipse cx="52" cy="200" rx="9" ry="5" fill="' + shoe + '"/>' + // ayakkabılar
      '<ellipse cx="68" cy="200" rx="9" ry="5" fill="' + shoe + '"/>' +
      torso +
      '<rect x="29" y="96" width="9" height="46" rx="4.5" fill="' + armC + '"/>' + // sol kol
      '<rect x="82" y="96" width="9" height="46" rx="4.5" fill="' + armC + '"/>' + // sağ kol
      '<circle cx="33.5" cy="145" r="5" fill="' + skin + '"/>' + // eller
      '<circle cx="86.5" cy="145" r="5" fill="' + skin + '"/>' +
      '<rect x="54" y="80" width="12" height="16" fill="' + skin + '"/>' + // boyun
      head +
      '</svg>';
  }

  /* Alt giyim garment'i (tam vücut koordinatları; ten bacaklar zaten çizili) */
  function bottomFull(bid) {
    const b = BOTTOM_BY_ID[bid] || BOTTOM_BY_ID[DEFAULT_BOTTOM];
    const c = b.c1, c2 = b.c2, s = b.shape;
    const waist = '<rect x="45" y="147" width="30" height="8" rx="4" fill="' + c2 + '"/>';
    const legs = (h) => '<rect x="47" y="150" width="11.5" height="' + h + '" rx="5.5" fill="' + c + '"/>' +
                        '<rect x="61.5" y="150" width="11.5" height="' + h + '" rx="5.5" fill="' + c + '"/>';
    switch (s) {
      case 'sort':      return waist + legs(24);
      case 'kapri':     return waist + legs(40);
      case 'esofman':   return waist + legs(50) +
                               '<rect x="47.5" y="150" width="2" height="50" fill="' + c2 + '" opacity=".6"/>' + // yan şerit
                               '<rect x="70.5" y="150" width="2" height="50" fill="' + c2 + '" opacity=".6"/>' +
                               '<rect x="47" y="194" width="11.5" height="4" fill="' + c2 + '"/>' + // paça lastiği
                               '<rect x="61.5" y="194" width="11.5" height="4" fill="' + c2 + '"/>';
      case 'etek':      return '<path d="M44 149 Q60 145 76 149 L86 181 Q60 190 34 181 Z" fill="' + c + '"/>' +
                               '<path d="M44 149 Q60 145 76 149 L74 157 Q60 161 46 157 Z" fill="' + c2 + '" opacity=".5"/>';
      case 'etek_uzun': return '<path d="M44 149 Q60 145 76 149 L90 199 Q60 207 30 199 Z" fill="' + c + '"/>' +
                               '<path d="M44 149 Q60 145 76 149 L74 157 Q60 161 46 157 Z" fill="' + c2 + '" opacity=".5"/>';
      default:          return waist + legs(50); // pantolon
    }
  }
  function elFull(a, cls) {
    a = normalize(a);
    return '<span class="avatar-holder avatar-full ' + (cls || '') + '">' + fullBody(a) + '</span>';
  }

  function preset(gender) {
    const base = { gender, skin: 2, hairColor: 0, eyeColor: 0, eyes: 0, mouth: 0, acc: 'none', ring: 'none' };
    return gender === 'kiz'
      ? Object.assign(base, { hair: 6, outfit: 'elbise-pembe' })
      : Object.assign(base, { hair: 0, outfit: 'tee-mavi' });
  }

  /* Kozmetik id → avatar slotundaki parça id'si */
  function partIdFor(item) {
    const maps = { hair: CATALOG.hairs, hairColor: CATALOG.hairColors, eyes: CATALOG.eyes,
                   mouth: CATALOG.mouths, outfit: CATALOG.outfits, bottom: CATALOG.bottoms, acc: CATALOG.accs, ring: CATALOG.rings };
    const p = (maps[item.type] || []).find(x => x.cosmeticId === item.id);
    return p ? p.id : null;
  }

  function unequipCosmetic(avatar, item) {
    const a = normalize(avatar);
    const pid = partIdFor(item);
    if (pid == null) return a;
    const def = { hair: 0, hairColor: 0, eyes: 0, mouth: 0, outfit: DEFAULT_OUTFIT, bottom: DEFAULT_BOTTOM, acc: 'none', ring: 'none' };
    if (a[item.type] === pid) a[item.type] = def[item.type];
    return a;
  }

  /* Bir parçanın kilit anahtarı ve satın alınabilirliği */
  function unlockKey(part) { return part.cosmeticId || part.id; }
  function isGated(part) { return !part.free && !!(part.cosmeticId || part.rarity); }

  /* Satın alınabilir kozmetikler (kilitli GİYİLEBİLİR parçalar) — Mağaza + sandık havuzu için.
   * Görünüm (saç/göz rengi, saç modeli, yüz) ÜCRETSİZDİR; burada YER ALMAZ.
   * type = avatar slotu, id = kilit anahtarı, typeLabel = kullanıcıya görünen grup adı. */
  function cosmeticCatalog() {
    const groups = [
      ['outfit', 'Üst',      CATALOG.outfits],
      ['bottom', 'Alt',      CATALOG.bottoms],
      ['acc',    'Aksesuar', CATALOG.accs],
      ['ring',   'Çerçeve',  CATALOG.rings],
    ];
    const out = [];
    groups.forEach(([type, typeLabel, list]) => list.forEach(p => {
      if (isGated(p)) out.push({ type, typeLabel, part: p, id: unlockKey(p), name: p.name, rarity: p.rarity || 'common', gender: p.gender || 'both' });
    }));
    return out;
  }

  /* Envanterdeki bir id'ye karşılık gelen katalog parçasını bul (satış için) */
  function findByUnlock(key) {
    const groups = [['hair', CATALOG.hairs], ['hairColor', CATALOG.hairColors], ['eyes', CATALOG.eyes],
                    ['mouth', CATALOG.mouths], ['outfit', CATALOG.outfits], ['bottom', CATALOG.bottoms], ['acc', CATALOG.accs], ['ring', CATALOG.rings]];
    for (const [type, list] of groups) {
      const p = list.find(x => isGated(x) && unlockKey(x) === key);
      if (p) return { type, part: p, name: p.name, rarity: p.rarity || 'common' };
    }
    return null;
  }

  /* ---------- Pseudo-3D: parmakla döndürülebilir turntable ----------
   * 2B SVG'yi 3B uzayda (perspektif + rotateY/rotateX) döndürür. Sürükle→çevir,
   * bırak→yumuşak yaylanarak merkeze döner, boştayken hafif sallanır.
   * Gerçek WebGL değil ama "3D karakter" hissini verir. */
  function turntable(holder) {
    if (!holder) return null;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
    holder.classList.add('av-turn');
    let ry = -5, rx = 3, dragging = false, sx = 0, sy = 0, sry = 0, srx = 0, lastMove = Date.now(), t = 0, raf = null;
    const clamp = (v, m) => Math.max(-m, Math.min(m, v));
    function apply() { holder.style.transform = 'perspective(560px) rotateY(' + ry.toFixed(1) + 'deg) rotateX(' + rx.toFixed(1) + 'deg)'; }
    function pt(e) { return e.touches && e.touches[0] ? e.touches[0] : e; }
    function move(e) {
      if (!dragging) return;
      const p = pt(e);
      ry = clamp(sry + (p.clientX - sx) * 0.55, 60);
      rx = clamp(srx - (p.clientY - sy) * 0.28, 20);
      lastMove = Date.now(); apply();
      if (e.cancelable) e.preventDefault();
    }
    function up() {
      if (!dragging) return; dragging = false;
      holder.classList.add('av-spring'); ry = -5; rx = 3; apply();
      lastMove = Date.now();
      setTimeout(() => holder.classList.remove('av-spring'), 520);
      window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up);
    }
    function down(e) {
      dragging = true; holder.classList.remove('av-spring');
      const p = pt(e); sx = p.clientX; sy = p.clientY; sry = ry; srx = rx; lastMove = Date.now();
      window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
      window.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', up);
      if (e.cancelable) e.preventDefault();
    }
    holder.addEventListener('mousedown', down);
    holder.addEventListener('touchstart', down, { passive: false });
    function idle() {
      if (!holder.isConnected) { cancelAnimationFrame(raf); return; } // ekran değişince dur
      if (!dragging && Date.now() - lastMove > 1500) { t += 0.02; ry = Math.sin(t) * 8 - 2; rx = Math.cos(t * 0.8) * 3; apply(); }
      raf = requestAnimationFrame(idle);
    }
    apply(); idle();
    return { dispose() { cancelAnimationFrame(raf); up(); } };
  }

  B.Avatar = { CATALOG, normalize, svg, el, fullBody, elFull, isUnlocked, preset, partIdFor, unequipCosmetic,
               genderOk, hairsFor, outfitsFor, bottomsFor, unlockKey, isGated, findByUnlock, cosmeticCatalog, turntable };
})(window.BOKUL = window.BOKUL || {});
