/* BOKUL — ContentRegistry
 * JSON içerik paketlerini yükler: önce sayfaya gömülü blok (dist/tek dosya modu),
 * yoksa fetch (geliştirme modu). Hafif şema doğrulaması yapar. */
(function (B) {
  const store = new Map(); // ad -> veri

  /* İçerik adı → gömülü blok id'si: lessons/math-5-division → bokul-content-lessons-math-5-division */
  function embedId(name) { return 'bokul-content-' + name.replace(/\//g, '-'); }

  /* Zorunlu alan kontrolü — hatalı paket oyunu kırmasın, atlansın */
  const validators = {
    'config':    d => ['starThresholds', 'adaptive', 'unitBoss'].every(k => k in d),
    'dialogues': d => d.pools && typeof d.pools === 'object',
    'rewards':   d => d.xp && d.levels && Array.isArray(d.ranks),
    'lesson':    d => d.id && Array.isArray(d.units) && Array.isArray(d.skills),
  };

  B.Content = {
    async load(name) {
      if (store.has(name)) return store.get(name);
      let data = null;
      const el = document.getElementById(embedId(name));
      if (el) {
        data = JSON.parse(el.textContent);
      } else {
        const res = await fetch('content/' + name + '.json');
        if (!res.ok) throw new Error('İçerik yüklenemedi: ' + name);
        data = await res.json();
      }
      const kind = name.startsWith('lessons/') ? 'lesson' : name;
      const check = validators[kind];
      if (check && !check(data)) {
        console.error('[BOKUL] İçerik paketi şemaya uymuyor, atlanıyor: ' + name);
        return null;
      }
      store.set(name, data);
      return data;
    },

    async loadAll(names) {
      for (const n of names) await B.Content.load(n); // sıralı: hata ayıklaması kolay
    },

    get(name) { return store.get(name) || null; },
  };
})(window.BOKUL = window.BOKUL || {});
