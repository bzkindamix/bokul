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

  /* Hesaba bağlı, deterministik DAVET KODU (uid'den türer; hep aynı) */
  function deriveCode(uid) {
    const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let h1 = 5381, h2 = 52711;
    for (let i = 0; i < uid.length; i++) { const c = uid.charCodeAt(i); h1 = ((h1 << 5) + h1) ^ c; h2 = (h2 * 33 ^ c) >>> 0; }
    h1 = h1 >>> 0; h2 = h2 >>> 0;
    let s = '', a = h1, b = h2;
    for (let i = 0; i < 4; i++) { s += abc[a % abc.length]; a = Math.floor(a / abc.length); }
    for (let i = 0; i < 4; i++) { s += abc[b % abc.length]; b = Math.floor(b / abc.length); }
    return s;
  }
  /* Giriş yapan ebeveynin bu cihazını kendi ailesine bağla */
  function linkFamily() {
    const s = readSess();
    if (s && s.localId && B.Cloud) B.Cloud.setCode(deriveCode(s.localId));
  }

  B.AuthCloud = {
    available,
    current() { return readSess(); },
    email() { const s = readSess(); return s ? s.email : ''; },
    name() { const s = readSess(); return s && s.name ? s.name : ''; },
    firstName() { const n = B.AuthCloud.name(); return (n || '').trim().split(/\s+/)[0] || ''; },
    isVerified() { const s = readSess(); return !!(s && s.emailVerified); },
    inviteCode() { const s = readSess(); return s && s.localId ? deriveCode(s.localId) : ''; },
    logout() { try { localStorage.removeItem(SESS); } catch (e) {} },

    async register(email, pass, name) {
      try {
        const d = await post(IDT + 'signUp', { email: (email || '').trim(), password: pass, returnSecureToken: true });
        store(d, { name: (name || '').trim() });
        linkFamily(); // davet kodu = bu hesap
        if (name) await B.AuthCloud.setDisplayName(name); // Firebase profiline de yaz
        await B.AuthCloud.sendVerify();
        return { ok: true, needVerify: true };
      } catch (e) { return { ok: false, err: trErr(e.message) }; }
    },

    /* Ebeveynin görünen adını (ad soyad) Firebase profiline ve yerel oturuma yaz */
    async setDisplayName(name) {
      const t = await freshToken();
      if (!t || !name) return { ok: false };
      try {
        await post(IDT + 'update', { idToken: t, displayName: (name || '').trim(), returnSecureToken: false });
        const s = readSess(); if (s) { s.name = (name || '').trim(); writeSess(s); }
        return { ok: true };
      } catch (e) { return { ok: false }; }
    },

    async login(email, pass) {
      try {
        const d = await post(IDT + 'signInWithPassword', { email: (email || '').trim(), password: pass, returnSecureToken: true });
        store(d);
        linkFamily(); // davet kodu = bu hesap
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

    /* Ebeveyn hesabını Firebase'den kalıcı sil (yalnızca kullanıcının kendi isteğiyle) */
    async deleteAccount() {
      const t = await freshToken();
      if (!t) return { ok: false, err: 'Oturum bulunamadı.' };
      try {
        await post(IDT + 'delete', { idToken: t });
        B.AuthCloud.logout();
        return { ok: true };
      } catch (e) {
        const m = e.message || '';
        if (/CREDENTIAL_TOO_OLD|LOGIN_AGAIN|TOKEN_EXPIRED/i.test(m))
          return { ok: false, err: 'Güvenlik için önce çıkış yapıp tekrar giriş yap, sonra sil.' };
        return { ok: false, err: trErr(m) };
      }
    },

    /* Google ile giriş (Firebase Web SDK popup; talep anında yüklenir) */
    async googleSignIn() {
      try {
        const appMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
        const authMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
        const app = appMod.initializeApp({
          apiKey: key(), authDomain: B.Cloud.projectId() + '.firebaseapp.com', projectId: B.Cloud.projectId(),
        }, 'bokul-google');
        const auth = authMod.getAuth(app);
        const res = await authMod.signInWithPopup(auth, new authMod.GoogleAuthProvider());
        const u = res.user;
        const idToken = await u.getIdToken();
        writeSess({ idToken, refreshToken: u.refreshToken, localId: u.uid, email: u.email,
          name: u.displayName || '', // Google profil adı (Binbaşı hitabı için)
          emailVerified: !!u.emailVerified, expiresAt: Date.now() + 3600000 });
        linkFamily();
        return { ok: true };
      } catch (e) {
        const c = e && (e.code || e.message) || '';
        if (/popup-closed|cancelled/i.test(c)) return { ok: false, err: 'Google penceresi kapatıldı.' };
        return { ok: false, err: 'Google girişi olmadı: ' + c };
      }
    },

    /* E-posta doğrulandı mı? (kullanıcı linke tıkladıysa) */
    async refreshVerified() {
      const t = await freshToken();
      if (!t) return false;
      try {
        const d = await post(IDT + 'lookup', { idToken: t });
        const u = d.users && d.users[0];
        const v = !!(u && u.emailVerified);
        const s = readSess(); if (s) { s.emailVerified = v; if (u && u.displayName) s.name = u.displayName; writeSess(s); }
        return v;
      } catch (e) { return B.AuthCloud.isVerified(); }
    },
  };
})(window.BOKUL = window.BOKUL || {});
