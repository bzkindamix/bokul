/* BOKUL — Giriş / Oyuncu Seçimi
 * Profil seç + şifre, ya da yeni oyuncu oluştur (kullanıcı adı + şifre).
 * "Beni hatırla" ile sonraki açılışta şifre sorulmadan devam edilir. */
(function (B) {

  function overlayLogin(key) {
    const name = B.Auth.displayName(key);
    const ov = B.UI.overlay(
      '<div class="ov-big">🔐</div><h2>' + name + '</h2>' +
      '<p class="ov-quote">Şifreni gir Komutan.</p>' +
      '<input id="login-pass" type="password" class="name-input" placeholder="Şifre...">' +
      '<label class="login-remember"><input type="checkbox" id="login-remember" checked> Beni hatırla</label>' +
      '<div class="login-err" id="login-err"></div>',
      [{
        label: 'GİRİŞ ▶',
        onClick: null, // aşağıda elle bağlanır (hata durumunda overlay kapanmasın)
      }]
    );
    // Varsayılan buton overlay'i kapatır; biz kendi kontrolümüzü koyuyoruz
    const card = ov.querySelector('.overlay-card');
    const btn = card.querySelector('.overlay-btns .btn');
    const input = ov.querySelector('#login-pass');
    const err = ov.querySelector('#login-err');
    setTimeout(() => input.focus(), 100);
    function submit() {
      const res = B.Auth.login(name, input.value);
      if (!res.ok) { err.textContent = '⚠️ ' + res.err; input.value = ''; input.focus(); return; }
      B.Auth.setRemember(ov.querySelector('#login-remember').checked);
      ov.remove();
      B.Engine.enterAs();
    }
    btn.onclick = submit;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  }

  function renderRegister(root, firstEver) {
    root.innerHTML =
      '<div class="login-box">' +
        '<div class="login-logo">🌌</div>' +
        '<h2 class="login-title">' + (firstEver ? 'Üsse hoş geldin!' : 'Yeni Oyuncu') + '</h2>' +
        '<p class="login-sub">Kendine bir kullanıcı adı ve şifre seç. İlerlemen bu isme kaydolur.</p>' +
        '<input id="reg-name" class="name-input" maxlength="14" placeholder="Kullanıcı adı">' +
        '<input id="reg-pass" type="password" class="name-input" maxlength="20" placeholder="Şifre (en az 3 karakter)">' +
        '<label class="login-remember"><input type="checkbox" id="reg-remember" checked> Beni hatırla</label>' +
        '<div class="login-err" id="reg-err"></div>' +
        '<button class="btn btn-action" id="reg-go">🎖️ OYUNCU OLUŞTUR</button>' +
        (firstEver ? '' : '<button class="btn btn-quiet" id="reg-back">◀ Geri</button>') +
      '</div>';
    const nameEl = root.querySelector('#reg-name');
    const passEl = root.querySelector('#reg-pass');
    const err = root.querySelector('#reg-err');
    setTimeout(() => nameEl.focus(), 100);
    root.querySelector('#reg-go').onclick = () => {
      const res = B.Auth.register(nameEl.value, passEl.value);
      if (!res.ok) { err.textContent = '⚠️ ' + res.err; return; }
      B.Auth.setRemember(root.querySelector('#reg-remember').checked);
      B.Audio.play('fanfare');
      B.Engine.enterAs();
    };
    const back = root.querySelector('#reg-back');
    if (back) back.onclick = () => renderSelect(root);
  }

  function renderSelect(root) {
    const keys = B.Auth.users();
    let cards = keys.map(k => {
      const info = B.Auth.peek(k);
      const av = info.avatar ? B.Avatar.el(info.avatar) : '<span class="login-anon">🧑</span>';
      return '<button class="login-card" data-key="' + k + '">' +
        '<span class="login-av">' + av + '</span>' +
        '<span class="login-cardname">' + info.name + '</span>' +
        '<span class="login-lvl">Seviye ' + (info.level || 1) + '</span></button>';
    }).join('');
    cards += '<button class="login-card login-new"><span class="login-av"><span class="login-anon">➕</span></span>' +
             '<span class="login-cardname">Yeni Oyuncu</span></button>';

    root.innerHTML =
      '<div class="login-box login-box-wide">' +
        '<div class="login-logo">🌌</div>' +
        '<h2 class="login-title">Kim oynuyor?</h2>' +
        '<div class="login-cards">' + cards + '</div>' +
      '</div>';
    root.querySelectorAll('.login-card').forEach(c => {
      c.onclick = () => {
        B.Audio.play('tick');
        if (c.classList.contains('login-new')) renderRegister(root, false);
        else overlayLogin(c.dataset.key);
      };
    });
  }

  B.UI.registerScreen('login', {
    enter(root) {
      root.classList.add('login-root');
      if (!B.Auth.hasAny()) renderRegister(root, true);
      else renderSelect(root);
    },
    exit() {},
  });
})(window.BOKUL = window.BOKUL || {});
