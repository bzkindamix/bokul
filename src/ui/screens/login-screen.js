/* BOKUL — Giriş / Oyuncu Seçimi
 * Çocuklar profillerine DOKUNARAK girer (şifre yok — kilitlenme olmaz).
 * Ebeveyn konsolu e-posta hesabı (Firebase Auth: doğrulama + şifremi unuttum)
 * veya yerel PIN ile açılır. Aile kodu ile cihazlar buluta bağlanır. */
(function (B) {

  /* ---------- Görsel: kahraman amblemi (Bilgi Kristali — hikâye lore'u) ---------- */
  function hero() {
    return '<svg class="hero-svg" viewBox="0 0 120 122" width="1em" height="1em" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<radialGradient id="lg-glow" cx="50%" cy="46%" r="55%">' +
          '<stop offset="0%" stop-color="#FF4FD8" stop-opacity=".6"/>' +
          '<stop offset="65%" stop-color="#9D6BFF" stop-opacity=".14"/>' +
          '<stop offset="100%" stop-color="#9D6BFF" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<linearGradient id="lg-cry" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#8FF9E8"/><stop offset="45%" stop-color="#FF4FD8"/><stop offset="100%" stop-color="#A5329A"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<circle class="lg-halo" cx="60" cy="58" r="54" fill="url(#lg-glow)"/>' +
      '<g class="lg-orbit"><ellipse cx="60" cy="60" rx="47" ry="15" fill="none" stroke="#FF4FD8" stroke-width="2" opacity=".45"/>' +
        '<circle cx="107" cy="60" r="4" fill="#FFD52E" stroke="#120A26" stroke-width="1.6"/>' +
        '<circle cx="13" cy="60" r="2.6" fill="#3DF2D2" stroke="#120A26" stroke-width="1.3"/></g>' +
      '<g class="lg-cry">' +
        '<path d="M60 12 L38 46 L60 108 L82 46 Z" fill="url(#lg-cry)" stroke="#120A26" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M60 12 L38 46 L60 46 Z" fill="#8FF9E8" opacity=".55"/>' +
        '<path d="M60 12 L82 46 L60 46 Z" fill="#3DF2D2" opacity=".32"/>' +
        '<path d="M38 46 L60 108 L60 46 Z" fill="#FF7BE4" opacity=".22"/>' +
        '<path d="M82 46 L60 108 L60 46 Z" fill="#7A1F6C" opacity=".32"/>' +
        '<path d="M38 46 H82" stroke="#120A26" stroke-width="2"/>' +
        '<path d="M60 46 V108" stroke="#120A26" stroke-width="1.4" opacity=".45"/>' +
        '<path d="M52 22 L46 40" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>' +
      '</g>' +
      '<g class="lg-spark">' +
        '<path d="M98 26 l2 5.5 5.5 2 -5.5 2 -2 5.5 -2 -5.5 -5.5 -2 5.5 -2z" fill="#FFD52E"/>' +
        '<path d="M20 32 l1.6 4.2 4.2 1.6 -4.2 1.6 -1.6 4.2 -1.6 -4.2 -4.2 -1.6 4.2 -1.6z" fill="#3DF2D2"/>' +
        '<circle cx="30" cy="92" r="2" fill="#fff"/><circle cx="92" cy="86" r="2.3" fill="#FFD52E"/>' +
      '</g>' +
    '</svg>';
  }

  /* ---------- Görsel: animasyonlu galaksi arka planı ---------- */
  function fx() {
    const stars = [[12, 20], [80, 14], [26, 70], [90, 60], [55, 12], [70, 84], [40, 40], [18, 88], [64, 52], [86, 34]]
      .map((s, i) => '<span class="lfx-star" style="left:' + s[0] + '%;top:' + s[1] + '%;animation-delay:' + (i * 0.4) + 's"></span>').join('');
    return '<div class="login-fx" aria-hidden="true">' +
      '<span class="lfx-neb lfx-neb-1"></span><span class="lfx-neb lfx-neb-2"></span>' +
      '<span class="lfx-planet lfx-planet-1"></span><span class="lfx-planet lfx-planet-2"></span>' +
      stars + '<span class="lfx-shoot"></span>' +
    '</div>';
  }

  /* ---------- Ebeveyn: e-posta hesabı akışı ---------- */
  function parentEmailFlow() {
    const savedEmail = B.AuthCloud.email();
    const ov = B.UI.overlay(
      '<div class="ov-big">👨‍👧</div><h2>Ebeveyn Girişi</h2>' +
      '<div class="google-row">' +
        '<button class="btn google-btn" id="pe-gsignin">🔵 Google ile Giriş Yap</button>' +
        '<button class="btn google-btn google-signup" id="pe-gsignup">🟢 Google ile Kayıt Ol</button>' +
      '</div>' +
      '<div class="consent-or">— veya e-posta ile —</div>' +
      '<input id="pe-email" type="email" class="name-input" placeholder="E-posta" value="' + (savedEmail || '') + '">' +
      '<input id="pe-pass" type="password" class="name-input" placeholder="Şifre (en az 6 karakter)">' +
      '<div class="login-err" id="pe-msg"></div>',
      [{ label: 'GİRİŞ ▶', onClick: null }, { label: '📝 Formla Kayıt Ol', cls: 'btn-quiet', onClick: null }, { label: 'Şifremi unuttum', cls: 'btn-quiet', onClick: null }]);
    const btns = ov.querySelectorAll('.overlay-btns .btn');
    const emailEl = ov.querySelector('#pe-email'), passEl = ov.querySelector('#pe-pass'), msg = ov.querySelector('#pe-msg');
    function busy(t) { msg.style.color = ''; msg.textContent = t; }
    function err(t) { msg.style.color = 'var(--warn)'; msg.textContent = '⚠️ ' + t; }

    // Google giriş/kayıt: her ikisi de tek popup akışıdır (Google yeni hesabı otomatik oluşturur).
    // Onay (KVKK/sözleşme) alınmadan devam edilmez; onay verilmişse pencere görünmeden geçilir.
    function googleFlow(label) {
      B.Consent.require(async () => {
        busy(label + '… Google penceresi açılıyor');
        const r = await B.AuthCloud.googleSignIn();
        if (!r.ok) return err(r.err);
        ov.remove(); B.UI.show('admin');
      });
    }
    ov.querySelector('#pe-gsignin').onclick = () => googleFlow('Giriş yapılıyor');
    ov.querySelector('#pe-gsignup').onclick = () => googleFlow('Hesap oluşturuluyor');

    btns[0].onclick = async () => { // GİRİŞ
      busy('Giriş yapılıyor…');
      const r = await B.AuthCloud.login(emailEl.value, passEl.value);
      if (!r.ok) return err(r.err);
      ov.remove();
      if (!r.verified) B.UI.toast('📧 E-postanı doğrulaman önerilir (şifre kurtarma için).');
      B.UI.show('admin');
    };
    btns[1].onclick = () => { ov.remove(); parentRegisterForm((emailEl.value || '').trim()); }; // KAYIT OL → form
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

  /* ---------- Ebeveyn: FORMLA kayıt (Google'sız — ad/soyad/e-posta/şifre) ---------- */
  function parentRegisterForm(prefillEmail) {
    const ov = B.UI.overlay(
      '<div class="ov-big">📝</div><h2>Ebeveyn Kaydı</h2>' +
      '<p class="ov-quote">Bilgilerini gir; Baba Komutan sana rütbenle hitap etsin: <b>Binbaşı!</b></p>' +
      '<div class="reg-form">' +
        '<input id="rf-ad" class="name-input" placeholder="Adın *" maxlength="20" autocomplete="given-name">' +
        '<input id="rf-soyad" class="name-input" placeholder="Soyadın *" maxlength="24" autocomplete="family-name">' +
        '<input id="rf-email" type="email" class="name-input" placeholder="E-posta *" autocomplete="email" value="' + (prefillEmail || '') + '">' +
        '<input id="rf-pass" type="password" class="name-input" placeholder="Şifre (en az 6 karakter) *" autocomplete="new-password">' +
        '<input id="rf-pass2" type="password" class="name-input" placeholder="Şifre (tekrar) *" autocomplete="new-password">' +
      '</div>' +
      '<div class="login-err" id="rf-msg"></div>',
      [{ label: 'KAYIT OL ▶', onClick: null }, { label: 'Zaten hesabım var', cls: 'btn-quiet', onClick: null }]);
    const btns = ov.querySelectorAll('.overlay-btns .btn');
    const val = id => (ov.querySelector('#' + id).value || '').trim();
    const msg = ov.querySelector('#rf-msg');
    const err = t => { msg.style.color = 'var(--warn)'; msg.textContent = '⚠️ ' + t; };
    btns[0].onclick = () => {
      const ad = val('rf-ad'), soyad = val('rf-soyad'), email = val('rf-email');
      const p1 = ov.querySelector('#rf-pass').value, p2 = ov.querySelector('#rf-pass2').value;
      if (ad.length < 2) return err('Adını gir (en az 2 harf).');
      if (soyad.length < 2) return err('Soyadını gir (en az 2 harf).');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err('Geçerli bir e-posta gir.');
      if (p1.length < 6) return err('Şifre en az 6 karakter olmalı.');
      if (p1 !== p2) return err('Şifreler uyuşmuyor.');
      B.Consent.require(async () => { // KVKK/Sözleşme onayı olmadan kayıt yok
        msg.style.color = ''; msg.textContent = 'Hesap oluşturuluyor…';
        const r = await B.AuthCloud.register(email, p1, ad + ' ' + soyad);
        if (!r.ok) return err(r.err);
        B.Audio.play('fanfare');
        msg.style.color = 'var(--success)';
        msg.innerHTML = '✓ Hoş geldin <b>Binbaşı ' + ad + '</b>! Doğrulama e-postası gönderildi (şifre kurtarma için). Panele geçiliyor…';
        setTimeout(() => { ov.remove(); B.UI.show('admin'); }, 1500);
      });
    };
    btns[1].onclick = () => { ov.remove(); parentEmailFlow(); };
    setTimeout(() => ov.querySelector('#rf-ad').focus(), 100);
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
    // Zaten giriş yapılmışsa (Google/e-posta oturumu localStorage'da duruyor)
    // tekrar giriş isteme — doğrudan panele al. (Çıkış, panel içindeki Hesap
    // bölümünden yapılır.)
    if (B.AuthCloud && B.AuthCloud.current()) { B.UI.show('admin'); return; }
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
      '<div class="login-box"><div class="login-hero">' + hero() + '</div>' +
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
      return '<button class="login-card" data-key="' + k + '">' +
        '<span class="login-del" data-key="' + k + '" title="Bu oyuncuyu sil">✕</span>' +
        '<span class="login-av">' + av + '</span>' +
        '<span class="login-cardname">' + info.name + '</span><span class="login-lvl">Seviye ' + (info.level || 1) + '</span></button>';
    }).join('');
    cards += '<button class="login-card login-new"><span class="login-av"><span class="login-anon">➕</span></span><span class="login-cardname">Yeni Oyuncu</span></button>';
    root.innerHTML =
      '<div class="login-box login-box-wide"><div class="login-hero">' + hero() + '</div>' +
      '<h2 class="login-title">Kim oynuyor?</h2>' +
      '<p class="login-sub">Profiline dokun ve oyna!</p>' +
      '<div class="login-cards">' + cards + '</div>' +
      (keys.length ? '<button class="btn btn-quiet login-manage">🗑️ Oyuncuları düzenle</button>' : '') +
      '</div>';

    const wrap = root.querySelector('.login-cards');
    const manageBtn = root.querySelector('.login-manage');
    if (manageBtn) manageBtn.onclick = () => {
      const on = wrap.classList.toggle('login-editing');
      manageBtn.textContent = on ? '✓ Bitti' : '🗑️ Oyuncuları düzenle';
      B.Audio.play('tick');
    };

    // Kart gövdesi: düzenleme modunda giriş yapmaz (yalnız ✕ ile silinir)
    root.querySelectorAll('.login-card').forEach(c => {
      c.onclick = () => {
        if (wrap.classList.contains('login-editing') && !c.classList.contains('login-new')) return;
        B.Audio.play('tick');
        if (c.classList.contains('login-new')) return renderRegister(root, false);
        B.Auth.loginByKey(c.dataset.key);
        B.Engine.enterAs();
      };
    });

    // Kendi oyuncunu sil (yerel + bulut) — onaylı, geri alınamaz
    root.querySelectorAll('.login-del').forEach(d => d.onclick = (e) => {
      e.stopPropagation();
      const key = d.dataset.key;
      const info = B.Auth.peek(key);
      B.UI.confirm({
        icon: '🗑️', title: (info.name || 'Bu oyuncu') + ' silinsin mi?',
        body: 'Bu oyuncunun TÜM ilerlemesi (seviye, altın, rozetler, eşyalar) kalıcı silinecek. Bu işlem geri alınamaz.',
        yes: 'Kalıcı sil', no: 'Vazgeç',
        onYes: async () => {
          B.Auth.deleteUser(key);
          if (B.Cloud && B.Cloud.enabled && B.Cloud.enabled()) { try { await B.Cloud.deletePlayer(key); } catch (e) {} }
          B.Audio.play('wrong');
          B.UI.toast('🗑️ ' + (info.name || 'Oyuncu') + ' silindi');
          renderSelect(root); // listeyi tazele
        },
      });
    });
  }

  function renderRegister(root, firstEver) {
    root.innerHTML =
      '<div class="login-box"><div class="login-hero">' + hero() + '</div>' +
      '<h2 class="login-title">' + (firstEver ? 'Üsse hoş geldin!' : 'Yeni Oyuncu') + '</h2>' +
      '<p class="login-sub">Kendine bir ad seç. İlerlemen bu ada kaydolur (şifre gerekmez).</p>' +
      '<input id="reg-name" class="name-input" maxlength="14" placeholder="Adın">' +
      '<div class="login-err" id="reg-err"></div>' +
      '<button class="btn btn-action" id="reg-go">🎖️ BAŞLA</button>' +
      (firstEver ? '' : '<button class="btn btn-quiet" id="reg-back">◀ Geri</button>') + '</div>';
    const nameEl = root.querySelector('#reg-name');
    setTimeout(() => nameEl.focus(), 100);
    root.querySelector('#reg-go').onclick = () => {
      const nm = (nameEl.value || '').trim();
      if (nm.length < 2) { root.querySelector('#reg-err').textContent = '⚠️ Adın en az 2 harf olmalı.'; return; }
      B.Consent.require(() => { // KVKK/Sözleşme onayı olmadan kayıt yok
        const res = B.Auth.register(nm, '');
        if (!res.ok) { root.querySelector('#reg-err').textContent = '⚠️ ' + res.err; return; }
        B.Audio.play('fanfare');
        B.Engine.enterAs();
      });
    };
    const back = root.querySelector('#reg-back');
    if (back) back.onclick = () => renderSelect(root);
  }

  B.UI.registerScreen('login', {
    enter(root) {
      root.classList.add('login-root');
      root.innerHTML = fx() + '<div class="login-content"></div>';
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
