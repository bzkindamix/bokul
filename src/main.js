/* BOKUL — Giriş noktası + Sürüm Kontrolü */
(function (B) {
  B.VERSION = '0.90'; // bu sürümün etiketi (version.json ile eşleşmeli)

  // iOS Safari 'user-scalable=no'yu yok sayar → çocuklar pinch/çift-dokunuşla
  // zoom yapıp ekranı kaydırıyor. Pinch (gesture) ve çift-dokunuş zoom'unu engelle.
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev =>
    document.addEventListener(ev, e => { if (e.cancelable) e.preventDefault(); }, { passive: false }));
  window.addEventListener('orientationchange', () => {
    document.body.style.zoom = ''; window.scrollTo(0, 0);
  });

  /* Splash'a güncelleme mesajı yaz */
  function showUpdate(latest, manual) {
    const s = document.getElementById('splash');
    if (!s) return;
    const start = document.getElementById('splash-start');
    if (start) start.style.display = 'none';
    const old = s.querySelector('.splash-update');
    if (old) old.remove();
    s.insertAdjacentHTML('beforeend',
      '<div class="splash-update">🚀 <b>Yeni sürüm hazır!</b><br>' +
      (manual
        ? 'Otomatik güncelleme olmadı. <button id="upd-btn" class="btn btn-action">GÜNCELLE</button>'
        : 'Güncelleniyor…') +
      '</div>');
    if (manual) {
      const b = document.getElementById('upd-btn');
      if (b) b.onclick = () => { try { location.reload(); } catch (e) { location.href = location.pathname; } };
    }
  }

  /* Sunucudaki güncel sürümü kontrol et. Eski isek yenile (fresh dosyalar için
   * cache-bust'lı navigasyon). Çevrimdışıysa sessizce devam. Döngü koruması var.
   * Döner: true = güncel/devam et, false = yenileniyor (boot etme). */
  async function ensureLatest() {
    let latest;
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 4000); // yavaş ağda boot'u bekletme
      const res = await fetch('version.json?t=' + Date.now(), { cache: 'no-store', signal: ctrl.signal });
      clearTimeout(to);
      if (!res.ok) return true;
      latest = (await res.json()).version;
    } catch (e) { return true; } // çevrimdışı/zaman aşımı → oyunu engelleme
    if (!latest || latest === B.VERSION) {
      try { sessionStorage.removeItem('bokul.vreload'); } catch (e) {}
      return true;
    }
    // Güncel değiliz
    let already = null;
    try { already = sessionStorage.getItem('bokul.vreload'); } catch (e) {}
    if (already === latest) {
      // Bir kez yeniledik ama hâlâ eski (inatçı önbellek) → manuel buton göster
      showUpdate(latest, true);
      return false;
    }
    try { sessionStorage.setItem('bokul.vreload', latest); } catch (e) {}
    showUpdate(latest, false);
    setTimeout(() => {
      try {
        const u = new URL(location.href);
        u.searchParams.set('v', latest); // dokümanı cache-bust'la (alt kaynaklar navigasyonda tazelenir)
        location.replace(u.toString());
      } catch (e) { location.reload(); }
    }, 1000);
    return false;
  }

  window.addEventListener('DOMContentLoaded', async () => {
    // Önce sürüm kontrolü — eskiyse boot etmeden yenile
    const fresh = await ensureLatest();
    if (!fresh) return;
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
