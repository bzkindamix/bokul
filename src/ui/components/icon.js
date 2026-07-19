/* BOKUL — Özel İkon Seti (stil kılavuzu)
 * Emoji yerine el çizimi inline SVG ikonlar — tek dosya şartına uygun, keskin, temaya duyarlı.
 * Kural (style bible): 24px grid, kalın yuvarlak kontur (#120A26), tek dolgu + tek highlight,
 * galaksi paleti, işleve göre tek vurgu rengi. B.Icon('coin') → <svg> string.
 * Öncelik seti: EKONOMİ (coin/xp/rank/streak) + KAPILAR (sword/home/shop/quests) + pet/chest. */
(function (B) {
  const OUTLINE = '#120A26';

  // Her ikon: 24x24 viewBox içeriği. Renkler galaksi paletinden sabit (tutarlı "set" kimliği).
  const ART = {
    // --- EKONOMİ ---
    coin:
      '<circle cx="12" cy="12" r="9" fill="#FFD52E" stroke="' + OUTLINE + '" stroke-width="1.8"/>' +
      '<circle cx="12" cy="12" r="5.6" fill="none" stroke="#B8890A" stroke-width="1.4"/>' +
      '<path d="M12 8.4l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" fill="#B8890A"/>' +
      '<circle cx="8.7" cy="8.4" r="1.5" fill="#FFF7CC" opacity=".8"/>',
    xp:
      '<path d="M12 3l2.5 5.6 6.1.6-4.6 4 1.4 6-5.4-3.2-5.4 3.2 1.4-6-4.6-4 6.1-.6z" fill="#FFD52E" stroke="' + OUTLINE + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<circle cx="9.5" cy="8.5" r="1.4" fill="#FFF7CC" opacity=".85"/>',
    rank:
      '<path d="M7 3h10l-1.2 6.2a4 4 0 01-7.6 0z" fill="#9D6BFF" stroke="' + OUTLINE + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M12 13v4M9.5 21h5l-.7-4h-3.6z" fill="#FF4FD8" stroke="' + OUTLINE + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<circle cx="12" cy="8" r="2.3" fill="#FFD52E" stroke="' + OUTLINE + '" stroke-width="1.2"/>',
    streak:
      '<path d="M13 2c1 3-1 4-2.2 5.6C9 9.7 8 11.2 8 13.5A6 6 0 0018 14c0-3-1.8-4.8-2.6-6 .6 1.8-.2 2.8-1 3.2.4-2.6-1-4.8-1.4-9.2z" fill="#FF9F1C" stroke="' + OUTLINE + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M11.6 13.2c0-1.4.8-2.2 1.4-3 .4 1 1 1.6 1 2.8a2.4 2.4 0 01-4.8.2c0-.7.3-1.3.7-1.8.1.9.8 1.4 1.7 1.6z" fill="#FFD52E"/>',
    // --- KAPILAR ---
    sword:
      '<path d="M18.5 3.5L9 13l2 2 9.5-9.5V3.5z" fill="#FF4FD8" stroke="' + OUTLINE + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M7.8 12.2l4 4-1.4 1.4-1-.6-2 2-1.8-1.8 2-2-.6-1z" fill="#C0B3E0" stroke="' + OUTLINE + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M14.5 16.5l4 4M16 15l4 4" stroke="' + OUTLINE + '" stroke-width="1.8" stroke-linecap="round"/>',
    home:
      '<path d="M4 11l8-6.5 8 6.5" fill="none" stroke="' + OUTLINE + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M6 10.2V19h12v-8.8L12 5.4z" fill="#FF4FD8" stroke="' + OUTLINE + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<rect x="10.2" y="13" width="3.6" height="6" rx=".8" fill="#2A1F55"/>' +
      '<path d="M7 9.4L12 5.5" stroke="#FF9FEC" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>',
    shop:
      '<path d="M4.5 8.5L6 5h12l1.5 3.5z" fill="#FFD52E" stroke="' + OUTLINE + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M5.5 8.5V19h13V8.5" fill="#FF4FD8" stroke="' + OUTLINE + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<rect x="9.2" y="12.5" width="5.6" height="6.5" rx=".8" fill="#2A1F55"/>' +
      '<circle cx="8" cy="8.5" r="1.2" fill="#FFF7CC" opacity=".7"/>',
    quests:
      '<rect x="5" y="4" width="14" height="17" rx="2.4" fill="#3DF2D2" stroke="' + OUTLINE + '" stroke-width="1.6"/>' +
      '<rect x="9" y="2.6" width="6" height="3.4" rx="1.4" fill="#2A1F55" stroke="' + OUTLINE + '" stroke-width="1.4"/>' +
      '<path d="M8.2 10.5l1.6 1.6 2.6-2.6M8.2 15.5l1.6 1.6 2.6-2.6" fill="none" stroke="' + OUTLINE + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M13.5 11h3M13.5 16h3" stroke="' + OUTLINE + '" stroke-width="1.6" stroke-linecap="round"/>',
    // --- EK ---
    paw:
      '<ellipse cx="12" cy="16" rx="4.4" ry="3.6" fill="#52E88C" stroke="' + OUTLINE + '" stroke-width="1.6"/>' +
      '<circle cx="6.6" cy="11" r="2" fill="#52E88C" stroke="' + OUTLINE + '" stroke-width="1.4"/>' +
      '<circle cx="10" cy="8" r="2" fill="#52E88C" stroke="' + OUTLINE + '" stroke-width="1.4"/>' +
      '<circle cx="14" cy="8" r="2" fill="#52E88C" stroke="' + OUTLINE + '" stroke-width="1.4"/>' +
      '<circle cx="17.4" cy="11" r="2" fill="#52E88C" stroke="' + OUTLINE + '" stroke-width="1.4"/>',
    chest:
      '<path d="M4 9.5A2 2 0 016 7.5h12a2 2 0 012 2V11H4z" fill="#FF9F1C" stroke="' + OUTLINE + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<rect x="4" y="11" width="16" height="8" rx="1.4" fill="#FF4FD8" stroke="' + OUTLINE + '" stroke-width="1.6"/>' +
      '<rect x="10.6" y="12.5" width="2.8" height="4" rx="1.2" fill="#FFD52E" stroke="' + OUTLINE + '" stroke-width="1.2"/>' +
      '<path d="M4 11h16" stroke="' + OUTLINE + '" stroke-width="1.4"/>',
    heart:
      '<path d="M12 20S3.5 14.5 3.5 8.8A4.3 4.3 0 0112 6a4.3 4.3 0 018.5 2.8C20.5 14.5 12 20 12 20z" fill="#FF4FD8" stroke="' + OUTLINE + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M7 8.6a3 3 0 012.6-2.2" stroke="#FFB3F0" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".8"/>',
    lock:
      '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.2" fill="#6E619A" stroke="' + OUTLINE + '" stroke-width="1.6"/>' +
      '<path d="M8 10.5V8a4 4 0 018 0v2.5" fill="none" stroke="' + OUTLINE + '" stroke-width="1.8" stroke-linecap="round"/>' +
      '<circle cx="12" cy="14.5" r="1.6" fill="#2A1F55"/><rect x="11.2" y="15" width="1.6" height="3" rx=".8" fill="#2A1F55"/>',
    check:
      '<circle cx="12" cy="12" r="9" fill="#52E88C" stroke="' + OUTLINE + '" stroke-width="1.6"/>' +
      '<path d="M7.5 12.4l3 3 6-6.4" fill="none" stroke="' + OUTLINE + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  function svg(name, cls) {
    const art = ART[name];
    if (!art) return '';
    return '<svg class="icn ' + (cls || '') + '" viewBox="0 0 24 24" width="1em" height="1em" ' +
      'aria-hidden="true" focusable="false" style="display:inline-block;vertical-align:-.15em">' + art + '</svg>';
  }

  const Icon = function (name, cls) { return svg(name, cls); };
  Icon.get = svg;
  Icon.has = function (name) { return !!ART[name]; };
  Icon.names = function () { return Object.keys(ART); };

  B.Icon = Icon;
})(window.BOKUL = window.BOKUL || {});
