/* BOKUL — EventBus
 * Modüller birbirini asla doğrudan çağırmaz; buradan konuşur (pub/sub). */
(function (B) {
  const listeners = new Map(); // eventName -> Set<fn>

  B.Bus = {
    on(event, fn) {
      if (!B._eventSet.has(event)) console.warn('[BOKUL] Bilinmeyen olay dinleniyor:', event);
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
      return () => B.Bus.off(event, fn);
    },
    off(event, fn) {
      const set = listeners.get(event);
      if (set) set.delete(fn);
    },
    emit(event, payload) {
      if (!B._eventSet.has(event)) console.warn('[BOKUL] Bilinmeyen olay yayınlanıyor:', event);
      const set = listeners.get(event);
      if (!set) return;
      // Kopya üzerinde dolaş: dinleyici kendini kaldırabilsin
      [...set].forEach(fn => {
        try { fn(payload); }
        catch (e) { console.error('[BOKUL] Olay dinleyicisi hata verdi (' + event + '):', e); }
      });
    },
  };
})(window.BOKUL = window.BOKUL || {});
