/* BOKUL — Giriş noktası */
(function (B) {
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
