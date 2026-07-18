/* BOKUL — Soru Süresi (geri sayım çubuğu)
 * Cömert ve nazik: süre dolunca cezalandırmaz, sadece o soruyu geçer.
 * B.Timer.create(host, saniye, onTimeout) → { stop() } */
(function (B) {
  B.Timer = {
    create(host, seconds, onTimeout) {
      const el = document.createElement('div');
      el.className = 'qtimer';
      el.innerHTML = '<span class="qtimer-icon">⏱️</span><div class="qtimer-bar"><i></i></div><span class="qtimer-num"></span>';
      host.appendChild(el);
      const bar = el.querySelector('i'), num = el.querySelector('.qtimer-num');
      const total = Math.max(1, seconds) * 10; // desisaniye
      let left = total, stopped = false;
      function render() {
        const pct = Math.max(0, left / total * 100);
        bar.style.width = pct + '%';
        num.textContent = Math.ceil(left / 10);
        el.classList.toggle('qtimer-low', pct < 34);
      }
      render();
      const iv = setInterval(() => {
        if (stopped) return;
        left--;
        render();
        if (left <= 0) { clearInterval(iv); stopped = true; if (onTimeout) onTimeout(); }
      }, 100);
      return { stop() { stopped = true; clearInterval(iv); if (el.parentNode) el.remove(); } };
    },
  };
})(window.BOKUL = window.BOKUL || {});
