/* BOKUL — Giriş / Oyuncu Seçimi
 * Çocuklar profillerine DOKUNARAK girer (şifre yok — kilitlenme olmaz).
 * Ebeveyn konsolu e-posta hesabı (Firebase Auth: doğrulama + şifremi unuttum)
 * veya yerel PIN ile açılır. Aile kodu ile cihazlar buluta bağlanır. */
(function (B) {

  /* ---------- Ebeveyn: e-posta hesabı akışı ---------- */
  function parentEmailFlow() {
    const savedEmail = B.AuthCloud.email();
    const ov = B.UI.overlay(
      '<div class="ov-big">📧</div><h2>Ebeveyn E-posta Girişi</h2>' +
      '<p class="ov-quote">Kendi e-postanla giriş yap. İlk kez mi? "Kayıt ol"a bas — doğrulama e-postası gönderilir.</p>' +
      '<input id="pe-email" type="email" class="name-input" placeholder="E-posta" value="' + (savedEmail || '') + '">' +
      '<input id="pe-pass" type="password" class="name-input" placeholder="Şifre (en az 6 karakter)">' +
      '<div class="login-err" id="pe-msg"></div>',
      [{ label: 'GİRİŞ ▶', onClick: null }, { label: 'Kayıt ol', cls: 'btn-quiet', onClick: null }, { label: 'Şifremi unuttum', cls: 'btn-quiet', onClick: null }]);
    const btns = ov.querySelectorAll('.overlay-btns .btn');
    const emailEl = ov.querySelector('#pe-email'), passEl = ov.querySelector('#pe-pass'), msg = ov.querySelector('#pe-msg');
    function busy(t) { msg.style.color = ''; msg.textContent = t; }
    function err(t) { msg.style.color = 'var(--warn)'; msg.textContent = '⚠️ ' + t; }

    btns[0].onclick = async () => { // GİRİŞ
      busy('Giriş yapılıyor…');
      const r = await B.AuthCloud.login(emailEl.value, passEl.value);
      if (!r.ok) return err(r.err);
      ov.remove();
      if (!r.verified) B.UI.toast('📧 E-postanı doğrulaman önerilir (şifre kurtarma için).');
      B.UI.show('admin');
    };
    btns[1].onclick = async () => { // KAYIT OL
      busy('Hesap oluşturuluyor…');
      const r = await B.AuthCloud.register(emailEl.value, passEl.value);
      if (!r.ok) return err(r.err);
      msg.style.color = 'var(--success)';
      msg.innerHTML = '✓ Doğrulama e-postası gönderildi! Gelen kutunu (ve spam) kontrol et, linke tıkla, sonra "GİRİŞ"e bas.';
    };
    btns[2].onclick = async () => { // ŞİFREMİ UNUTTUM
      if (!emailEl.value.trim()) return err('Önce e-posta adresini yaz.');
      busy('Sıfırlama e-postası gönderiliyor…');
      const r = await B.AuthCloud.sendReset(emailEl.value);
      if (!r.ok) return err(r.err);
      msg.style.color = 'var(--success)';
      msg.textContent = '✓ Şifre sıfırlama e-postası gönderildi. E-postandaki linkten yeni şifre belirle.';
    };
    setTimeout(() => emailEl.focus(), 100);
  }

  /* ---------- Ebeveyn: yerel PIN akışı (çevrimdışı) ---------- */
  function parentPinFlow() {
    if (!B.Auth.adminExists()) {
      const ov = B.UI.overlay(
        '<div class="ov-big">👨‍👧</div><h2>Ebeveyn PIN\'i Oluştur</h2>' +
        '<p class="ov-quote">Çevrimdışı erişim için bir PIN belirle (çocuklar bilmesin).</p>' +
        '<input id="pin-new" type="password" class="name-input" placeholder="En az 4 hane"><div class="login-err" id="pin-err"></div>',
        [{ label: 'OLUŞTUR ▶', onClick: null }]);
      ov.querySelector('.overlay-btns .btn').onclick = () => {
        const r = B.Auth.setAdminPin(ov.querySelector('#pin-new').value);
        if (!r.ok) { ov.querySelector('#pin-err').textContent = r.err; return; }
        ov.remove(); B.UI.show('admin');
      };
    } else {
      const ov = B.UI.overlay(
        '<div class="ov-big">🔒</div><h2>Ebeveyn PIN</h2>' +
        '<input id="pin-in" type="password" class="name-input" placeholder="PIN"><div class="login-err" id="pin-err"></div>',
        [{ label: 'GİR ▶', onClick: null }]);
      const input = ov.querySelector('#pin-in');
      function go() {
        if (!B.Auth.checkAdmin(input.value)) { ov.querySelector('#pin-err').textContent = '⚠️ PIN yanlış.'; input.value = ''; return; }
        ov.remove(); B.UI.show('admin');
      }
      ov.querySelector('.overlay-btns .btn').onclick = go;
      input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      setTimeout(() => input.focus(), 100);
    }
  }

  /* Ebeveyn erişimi: e-posta mı PIN mi? */
  function openParent() {
    const emailOpt = B.AuthCloud && B.AuthCloud.available();
    const ov = B.UI.overlay(
      '<div class="ov-big">👨‍👧</div><h2>Ebeveyn Konsolu</h2>' +
      '<p class="ov-quote">Nasıl gireceksin?</p>',
      (emailOpt ? [{ label: '📧 E-posta ile', onClick: null }, { label: '🔑 PIN ile', cls: 'btn-quiet', onClick: null }]
                : [{ label: '🔑 PIN ile', onClick: null }]));
    const btns = ov.querySelectorAll('.overlay-btns .btn');
    if (emailOpt) {
      btns[0].onclick = () => { ov.remove(); parentEmailFlow(); };
      btns[1].onclick = () => { ov.remove(); parentPinFlow(); };
    } else {
      btns[0].onclick = () => { ov.remove(); parentPinFlow(); };
    }
  }

  /* Bu cihaz için davet kodu (ebeveynin hesabından gelen kod) */
  function openFamilyCode() {
    const cur = B.Cloud.getCode();
    const ov = B.UI.overlay(
      '<div class="ov-big">🎟️</div><h2>Davet Kodu</h2>' +
      '<p class="ov-quote">Ebeveyninin verdiği davet kodunu gir. İlerlemen buluta bu aileye kaydolur.</p>' +
      '<input id="fam-in" class="name-input" maxlength="14" placeholder="Davet kodu" value="' + (cur || '') + '" style="text-transform:uppercase">' +
      '<div class="login-err" id="fam-msg">' + (cur ? '✓ Bağlı: ' + cur : '') + '</div>',
      [{ label: 'KAYDET', onClick: null }, { label: 'Bağlantıyı kaldır', cls: 'btn-quiet', onClick: () => { B.Cloud.setCode(''); B.UI.toast('Bağlantı kaldırıldı'); } }]);
    const btn = ov.querySelector('.overlay-btns .btn');
    btn.onclick = () => {
      const v = (ov.querySelector('#fam-in').value || '').trim().toUpperCase();
      if (v.length < 6) { ov.querySelector('#fam-msg').textContent = '⚠️ Kod en az 6 karakter.'; return; }
      B.Cloud.setCode(v); ov.remove(); B.UI.toast('🎟️ Aileye bağlandın: ' + v);
    };
  }

  /* İlk açılış: Ebeveyn mi Oyuncu mu? */
  function renderWelcome(root) {
    root.innerHTML =
      '<div class="login-box"><div class="login-logo">🌌</div>' +
      '<h2 class="login-title">BOKUL Eğitim Üssü</h2>' +
      '<p class="login-sub">Kim kuruyor?</p>' +
      '<div class="welcome-choices">' +
        '<button class="btn welcome-card wc-parent">👨‍👧<br>EBEVEYNİM<small>E-posta ile hesap aç, çocuklarımı davet et</small></button>' +
        '<button class="btn welcome-card wc-kid">🎮<br>OYUNCUYUM<small>Davet kodum var / hemen oyna</small></button>' +
      '</div></div>';
    root.querySelector('.wc-parent').onclick = () => { B.Audio.play('tick'); parentEmailFlow(); };
    root.querySelector('.wc-kid').onclick = () => { B.Audio.play('tick'); renderInvite(root); };
  }

  /* Oyuncu: davet kodu (varsa) → profil oluştur */
  function renderInvite(root) {
    root.innerHTML =
      '<div class="login-box"><div class="login-logo">🎟️</div>' +
      '<h2 class="login-title">Davet Kodu</h2>' +
      '<p class="login-sub">Ebeveyninin verdiği davet kodunu gir (ilerlemen ailene kaydolsun). Kodun yoksa "Kodsuz oyna".</p>' +
      '<input id="inv-code" class="name-input" maxlength="14" placeholder="Davet kodu" style="text-transform:uppercase">' +
      '<div class="login-err" id="inv-err"></div>' +
      '<button class="btn btn-action" id="inv-go">KATIL ▶</button>' +
      '<button class="btn btn-quiet" id="inv-skip">Kodsuz oyna</button>' +
      '<button class="btn btn-quiet" id="inv-back">◀ Geri</button></div>';
    setTimeout(() => root.querySelector('#inv-code').focus(), 100);
    root.querySelector('#inv-go').onclick = () => {
      const v = (root.querySelector('#inv-code').value || '').trim().toUpperCase();
      if (v.length < 6) { root.querySelector('#inv-err').textContent = '⚠️ Kod en az 6 karakter (ya da "Kodsuz oyna").'; return; }
      B.Cloud.setCode(v); B.UI.toast('🎟️ Aileye bağlandın: ' + v);
      renderRegister(root, false);
    };
    root.querySelector('#inv-skip').onclick = () => renderRegister(root, false);
    root.querySelector('#inv-back').onclick = () => renderWelcome(root);
  }

  /* ---------- Çocuk profilleri: dokun ve gir ---------- */
  function renderSelect(root) {
    const keys = B.Auth.users();
    let cards = keys.map(k => {
      const info = B.Auth.peek(k);
      const av = info.avatar ? B.Avatar.el(info.avatar) : '<span class="login-anon">🧑</span>';
      return '<button class="login-card" data-key="' + k + '"><span class="login-av">' + av + '</span>' +
        '<span class="login-cardname">' + info.name + '</span><span class="login-lvl">Seviye ' + (info.level || 1) + '</span></button>';
    }).join('');
    cards += '<button class="login-card login-new"><span class="login-av"><span class="login-anon">➕</span></span><span class="login-cardname">Yeni Oyuncu</span></button>';
    root.innerHTML =
      '<div class="login-box login-box-wide"><div class="login-logo">🌌</div>' +
      '<h2 class="login-title">Kim oynuyor?</h2>' +
      '<p class="login-sub">Profiline dokun ve oyna!</p>' +
      '<div class="login-cards">' + cards + '</div></div>';
    root.querySelectorAll('.login-card').forEach(c => {
      c.onclick = () => {
        B.Audio.play('tick');
        if (c.classList.contains('login-new')) return renderRegister(root, false);
        B.Auth.loginByKey(c.dataset.key);
        B.Engine.enterAs();
      };
    });
  }

  function renderRegister(root, firstEver) {
    root.innerHTML =
      '<div class="login-box"><div class="login-logo">🌌</div>' +
      '<h2 class="login-title">' + (firstEver ? 'Üsse hoş geldin!' : 'Yeni Oyuncu') + '</h2>' +
      '<p class="login-sub">Kendine bir ad seç. İlerlemen bu ada kaydolur (şifre gerekmez).</p>' +
      '<input id="reg-name" class="name-input" maxlength="14" placeholder="Adın">' +
      '<div class="login-err" id="reg-err"></div>' +
      '<button class="btn btn-action" id="reg-go">🎖️ BAŞLA</button>' +
      (firstEver ? '' : '<button class="btn btn-quiet" id="reg-back">◀ Geri</button>') + '</div>';
    const nameEl = root.querySelector('#reg-name');
    setTimeout(() => nameEl.focus(), 100);
    root.querySelector('#reg-go').onclick = () => {
      const res = B.Auth.register(nameEl.value, '');
      if (!res.ok) { root.querySelector('#reg-err').textContent = '⚠️ ' + res.err; return; }
      B.Audio.play('fanfare');
      B.Engine.enterAs();
    };
    const back = root.querySelector('#reg-back');
    if (back) back.onclick = () => renderSelect(root);
  }

  B.UI.registerScreen('login', {
    enter(root) {
      root.classList.add('login-root');
      root.innerHTML = '<div class="login-content"></div>';
      const content = root.querySelector('.login-content');

      const foot = document.createElement('div');
      foot.className = 'login-foot';
      foot.innerHTML =
        '<button class="chip login-parent">👨‍👧 Ebeveyn</button>' +
        (B.Cloud.configured() ? '<button class="chip login-fam">🎟️ Davet Kodu' + (B.Cloud.getCode() ? ' ✓' : '') + '</button>' : '');
      root.appendChild(foot);
      foot.querySelector('.login-parent').onclick = openParent;
      const fam = foot.querySelector('.login-fam');
      if (fam) fam.onclick = openFamilyCode;

      // İlk açılış (hiç profil, hesap veya kod yok) → Ebeveyn/Oyuncu seçimi
      const fresh = !B.Auth.hasAny() && !(B.AuthCloud && B.AuthCloud.current()) && !B.Cloud.getCode();
      if (fresh) renderWelcome(content);
      else if (!B.Auth.hasAny()) renderInvite(content);
      else renderSelect(content);
    },
    exit() {},
  });
})(window.BOKUL = window.BOKUL || {});
