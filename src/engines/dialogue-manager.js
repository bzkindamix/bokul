/* BOKUL — DialogueManager
 * Baba Komutan'ın repliklerini bağlama göre seçer.
 * Yer tutucu doldurma + tekrar önleme burada. */
(function (B) {
  const recent = new Map(); // havuz adı -> son seçilen indexler

  function fill(text, vars) {
    return text.replace(/\{(\w+)\}/g, (m, k) => {
      if (vars && vars[k] != null) return vars[k];
      if (k === 'playerName' || k === 'name') return B.State.data.player.name || 'Komutan';
      return m;
    });
  }

  B.Dialogue = {
    /* Havuzdan tekrar etmeyen rastgele replik seç */
    pick(poolName, vars) {
      const pools = (B.Content.get('dialogues') || {}).pools || {};
      const pool = pools[poolName];
      if (!pool) return null;
      if (typeof pool === 'string') return fill(pool, vars);   // tekil ipucu metinleri
      if (!pool.length) return null;

      const memory = recent.get(poolName) || [];
      const banned = new Set(memory.slice(-Math.min(pool.length - 1, 3))); // son 3 tekrar etmesin
      let idx, guard = 20;
      do { idx = Math.floor(Math.random() * pool.length); } while (banned.has(idx) && --guard);
      memory.push(idx);
      recent.set(poolName, memory.slice(-6));
      return fill(pool[idx], vars);
    },

    /* İpucu anahtarı → metin (ders paketindeki hints haritasından gelen anahtarlar) */
    hint(key, vars) { return B.Dialogue.pick(key, vars) || 'Bir daha dene Komutan!'; },
  };
})(window.BOKUL = window.BOKUL || {});
