/* BOKUL — Ebeveyn E-posta Hesabı (Firebase Authentication, REST — SDK yok)
 * Ebeveyn kendi e-postasıyla kayıt olur; Firebase doğrulama ve "şifremi unuttum"
 * e-postalarını ücretsiz gönderir. Çocuklar e-postasız kalır (profillere dokunur).
 * Oturum bilgisi cihazda saklanır (bokul.parent). */
(function (B) {
  const SESS = 'bokul.parent';
  const IDT = 'https://identitytoolkit.googleapis.com/v1/accounts:';
  const TOK = 'https://securetoken.googleapis.com/v1/token';

  function key() { return B.Cloud ? B.Cloud.apiKey() : ''; }
  function available() { return !!key(); }

  function readSess() { try { return JSON.parse(localStorage.getItem(SESS)); } catch (e) { return null; } }
  function writeSess(s) { try { localStorage.setItem(SESS, JSON.stringify(s)); } catch (e) {} }

  const ERR = {
    EMAIL_EXISTS: 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.',
    INVALID_EMAIL: 'Geçersiz e-posta adresi.',
    MISSING_PASSWORD: 'Şifre gir.',
    WEAK_PASSWORD: 'Şifre en az 6 karakter olmalı.',
    EMAIL_NOT_FOUND: 'Bu e-posta kayıtlı değil.',
    INVALID_PASSWORD: 'Şifre yanlış.',
    INVALID_LOGIN_CREDENTIALS: 'E-posta veya şifre hatalı.',
    USER_DISABLED: 'Bu hesap devre dışı.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Çok fazla deneme. Biraz sonra tekrar dene.',
  };
  function trErr(msg) { return ERR[(msg || '').split(' ')[0]] || ('Bir hata oldu: ' + (msg || '')); }

  async function post(url, body) {
    const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'key=' + key(), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data.error && data.error.message) || 'HATA');
    return data;
  }

  /* idToken süresi dolduysa refresh et (1 saat) */
  async function freshToken() {
    const s = readSess();
    if (!s) return null;
    if (Date.now() < (s.expiresAt || 0) - 60000) return s.idToken;
    try {
      const r = await fetch(TOK + '?key=' + key(), {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(s.refreshToken),
      });
      const d = await r.json();
      if (d.id_token) {
        s.idToken = d.id_token; s.refreshToken = d.refresh_token;
        s.expiresAt = Date.now() + (parseInt(d.expires_in) || 3600) * 1000;
        writeSess(s);
        return s.idToken;
      }
    } catch (e) {}
    return s.idToken;
  }

  function store(d, extra) {
    const s = Object.assign({
      idToken: d.idToken, refreshToken: d.refreshToken, localId: d.localId, email: d.email,
      expiresAt: Date.now() + (parseInt(d.expiresIn) || 3600) * 1000, emailVerified: false,
    }, extra || {});
    writeSess(s);
    return s;
  }

  B.AuthCloud = {
    available,
    current() { return readSess(); },
    email() { const s = readSess(); return s ? s.email : ''; },
    isVerified() { const s = readSess(); return !!(s && s.emailVerified); },
    logout() { try { localStorage.removeItem(SESS); } catch (e) {} },

    async register(email, pass) {
      try {
        const d = await post(IDT + 'signUp', { email: (email || '').trim(), password: pass, returnSecureToken: true });
        store(d);
        await B.AuthCloud.sendVerify();
        return { ok: true, needVerify: true };
      } catch (e) { return { ok: false, err: trErr(e.message) }; }
    },

    async login(email, pass) {
      try {
        const d = await post(IDT + 'signInWithPassword', { email: (email || '').trim(), password: pass, returnSecureToken: true });
        const s = store(d);
        const v = await B.AuthCloud.refreshVerified();
        return { ok: true, verified: v };
      } catch (e) { return { ok: false, err: trErr(e.message) }; }
    },

    async sendVerify() {
      const t = await freshToken();
      if (!t) return { ok: false };
      try { await post(IDT + 'sendOobCode', { requestType: 'VERIFY_EMAIL', idToken: t }); return { ok: true }; }
      catch (e) { return { ok: false, err: trErr(e.message) }; }
    },

    async sendReset(email) {
      try { await post(IDT + 'sendOobCode', { requestType: 'PASSWORD_RESET', email: (email || '').trim() }); return { ok: true }; }
      catch (e) { return { ok: false, err: trErr(e.message) }; }
    },

    /* E-posta doğrulandı mı? (kullanıcı linke tıkladıysa) */
    async refreshVerified() {
      const t = await freshToken();
      if (!t) return false;
      try {
        const d = await post(IDT + 'lookup', { idToken: t });
        const v = !!(d.users && d.users[0] && d.users[0].emailVerified);
        const s = readSess(); if (s) { s.emailVerified = v; writeSess(s); }
        return v;
      } catch (e) { return B.AuthCloud.isVerified(); }
    },
  };
})(window.BOKUL = window.BOKUL || {});
