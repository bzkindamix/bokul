/* BOKUL — Giriş noktası */
(function (B) {
  // iOS Safari 'user-scalable=no'yu yok sayar → çocuklar pinch/çift-dokunuşla
  // zoom yapıp ekranı kaydırıyor. Pinch (gesture) ve çift-dokunuş zoom'unu engelle.
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev =>
    document.addEventListener(ev, e => { if (e.cancelable) e.preventDefault(); }, { passive: false }));
  // Kazara zoom olduysa yönlendirme değişiminde ölçeği sıfırla (iOS)
  window.addEventListener('orientationchange', () => {
    document.body.style.zoom = ''; window.scrollTo(0, 0);
  });

  window.addEventListener('DOMContentLoaded', async () => {
    try {
      await B.Engine.boot();
      const btn = document.getElementById('splash-start');
      btn.disabled = false;
      btn.onclick = () => B.Engine.start();
    } catch (e) {
      console.error('[BOKUL] Başlatma hatası:', e);
      const s = document.getElementById('splash');
      if (s) s.insertAdjacentHTML('beforeend',
        '<div class="splash-error">Bir şeyler ters gitti Komutan. Sayfayı yenile!<br><small>' + e.message + '</small></div>');
    }
  });
})(window.BOKUL = window.BOKUL || {});
