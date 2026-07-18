/* BOKUL — KVKK / Sözleşme Onayı
 * Kayıt işleminden ÖNCE zorunlu onay. Onaylamayan kayıt olamaz.
 * Onay cihazda saklanır (bokul.consent); metin sürümü değişirse yeniden istenir. */
(function (B) {
  const KEY = 'bokul.consent';
  function legal() { return B.Content.get('legal') || { version: 1, kvkk: '', terms: '', items: [] }; }

  B.Consent = {
    accepted() {
      try { const c = JSON.parse(localStorage.getItem(KEY)); return !!(c && c.version === legal().version); }
      catch (e) { return false; }
    },
    store() {
      try { localStorage.setItem(KEY, JSON.stringify({ version: legal().version, ts: new Date().toISOString() })); } catch (e) {}
    },
    /* Onay varsa hemen devam; yoksa metni göster, onayda çalıştır */
    require(onAccepted) {
      if (B.Consent.accepted()) return onAccepted();
      B.Consent.show(onAccepted);
    },
    show(onAccepted) {
      const L = legal();
      const ov = document.createElement('div');
      ov.className = 'overlay consent-ov';
      ov.innerHTML =
        '<div class="consent-card">' +
          '<h2>📋 Onay Gerekli</h2>' +
          '<p class="consent-lead">Devam etmek için aşağıdaki metinleri okuyup onaylaman gerekir.</p>' +
          '<div class="consent-tabs"><button class="chip ctab ctab-on" data-t="kvkk">📄 KVKK Aydınlatma</button>' +
          '<button class="chip ctab" data-t="terms">📜 Kullanıcı Sözleşmesi</button></div>' +
          '<div class="consent-body"></div>' +
          '<div class="consent-checks">' +
            (L.items || []).map((it, i) => '<label class="consent-check"><input type="checkbox" data-i="' + i + '"><span>' + it + '</span></label>').join('') +
          '</div>' +
          '<div class="consent-btns"><button class="btn btn-quiet consent-reject">Reddet</button>' +
          '<button class="btn btn-action consent-accept" disabled>✓ KABUL ET VE DEVAM ET</button></div>' +
        '</div>';
      document.body.appendChild(ov);
      const body = ov.querySelector('.consent-body');
      function render(t) { body.innerHTML = (t === 'terms' ? L.terms : L.kvkk); body.scrollTop = 0; }
      render('kvkk');
      ov.querySelectorAll('.ctab').forEach(b => b.onclick = () => {
        ov.querySelectorAll('.ctab').forEach(x => x.classList.toggle('ctab-on', x === b));
        render(b.dataset.t);
      });
      const checks = ov.querySelectorAll('.consent-check input');
      const accept = ov.querySelector('.consent-accept');
      checks.forEach(c => c.onchange = () => { accept.disabled = !Array.prototype.every.call(checks, x => x.checked); });
      accept.onclick = () => { B.Consent.store(); ov.remove(); onAccepted(); };
      ov.querySelector('.consent-reject').onclick = () => { ov.remove(); B.UI.toast('Onaylamadan kayıt olunamaz.'); };
    },
  };
})(window.BOKUL = window.BOKUL || {});
