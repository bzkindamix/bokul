/* BOKUL — Satıcılar (Mağaza karakterleri)
 * Mağaza eşya tipine göre satıcı gruplarına ayrılır. Her satıcının kendi
 * karakteri (ikon+renk), sattığı kategoriler ve 60 repliği vardır (espri /
 * ters/naz / ipucu karışık). Store açıldıkça satıcı bir replik "söyler".
 * İçerik: content/vendors.json → { vendors:[{id,name,icon,color,tagline,cats,lines[]}], catVendor:{cat:vendorId} } */
(function (B) {
  function data() { return B.Content.get('vendors') || { vendors: [], catVendor: {} }; }
  let sayCount = 0; // her çağrıda değişsin diye artan sayaç (Math.random yerine deterministik döngü)

  B.Vendors = {
    all() { return data().vendors || []; },
    get(id) { return (data().vendors || []).find(v => v.id === id) || null; },
    /* Bir kategoriyi hangi satıcı satar? */
    forCat(cat) {
      const id = (data().catVendor || {})[cat];
      return id ? B.Vendors.get(id) : null;
    },
    /* Satıcının sattığı kategoriler (store sekmesi filtresi için) */
    cats(id) { const v = B.Vendors.get(id); return v ? (v.cats || []) : []; },
    /* Satıcı bir replik söyler — her çağrıda sıradaki satıra döner (tekdüze değil). */
    say(id) {
      const v = B.Vendors.get(id);
      if (!v || !v.lines || !v.lines.length) return '';
      const i = (sayCount++) % v.lines.length;
      // sayaç + vendor id uzunluğu ile hafif kaydır ki her satıcı farklı yerden başlasın
      const off = (v.id.length * 7) % v.lines.length;
      return v.lines[(i + off) % v.lines.length];
    },
  };
})(window.BOKUL = window.BOKUL || {});
