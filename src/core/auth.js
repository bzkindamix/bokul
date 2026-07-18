/* BOKUL — Auth (Oyuncu Profilleri)
 * Çok oyunculu yerel profil sistemi: her oyuncunun kullanıcı adı + şifresi
 * ve kendi kayıt dosyası vardır. Tamamen çevrimdışı çalışır; sunucu YOKTUR.
 *
 * GÜVENLİK NOTU: Bu bir aile içi yerel profil kilididir, banka düzeyinde
 * güvenlik DEĞİLDİR. Şifreler basit bir karma (hash) ile saklanır — düz metin
 * tutulmaz — ama aynı cihaza fiziksel erişimi olan biri kayıtları görebilir.
 * Çocuk için "kim oynuyor + ilerlemem bana ait" hissini verir. */
(function (B) {
  const USERS_KEY = 'bokul.users';
  const SESSION_KEY = 'bokul.session';
  const ADMIN_KEY = 'bokul.admin';

  /* Basit, tersine çevrilemez karma (kriptografik değil) — düz metin saklamamak için */
  function hash(s) {
    let h = 5381;
    s = String(s);
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
    return (h >>> 0).toString(16);
  }

  function readUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch (e) { return {}; } }
  function writeUsers(u) { try { localStorage.setItem(USERS_KEY, JSON.stringify(u)); } catch (e) {} }
  function keyOf(name) { return String(name || '').trim().toLowerCase(); }

  let current = null; // aktif profilin anahtarı (küçük harf)

  B.Auth = {
    /* Kayıtlı profil anahtarları */
    users() { return Object.keys(readUsers()); },
    hasAny() { return B.Auth.users().length > 0; },
    exists(name) { return !!readUsers()[keyOf(name)]; },
    current() { return current; },
    displayName(key) { const u = readUsers()[key || current]; return u ? u.name : (key || ''); },
    saveKey() { return current ? 'bokul.save.' + current : null; },

    /* Profil kartında göstermek için kayıttan avatarı ve adı çek (tam yüklemeden) */
    peek(key) {
      try {
        const s = JSON.parse(localStorage.getItem('bokul.save.' + key));
        return { name: B.Auth.displayName(key), avatar: (s && s.player) ? s.player.avatar : null,
                 level: (s && s.player) ? s.player.level : 1 };
      } catch (e) { return { name: B.Auth.displayName(key), avatar: null, level: 1 }; }
    },

    register(name, pass) {
      name = String(name || '').trim();
      if (name.length < 2) return { ok: false, err: 'İsim en az 2 harf olmalı.' };
      const key = keyOf(name);
      const users = readUsers();
      if (users[key]) return { ok: false, err: 'Bu isim alınmış. Başka bir isim dene.' };
      // Çocuk profilleri şifresizdir (profile dokunarak girilir); ebeveyn PIN'i/e-postası korur.
      users[key] = { name, pass: pass ? hash(pass) : '', created: new Date().toISOString() };
      writeUsers(users);
      current = key;
      return { ok: true };
    },

    /* Profili yeniden adlandır (anahtar sabit kalır; yalnızca görünen ad + kayıttaki ad değişir) */
    renameUser(key, newName) {
      newName = String(newName || '').trim();
      if (newName.length < 2) return { ok: false, err: 'İsim en az 2 harf olmalı.' };
      const users = readUsers();
      if (!users[key]) return { ok: false, err: 'Profil bulunamadı.' };
      users[key].name = newName;
      writeUsers(users);
      try {
        const sk = 'bokul.save.' + key;
        const s = JSON.parse(localStorage.getItem(sk));
        if (s && s.player) { s.player.name = newName; localStorage.setItem(sk, JSON.stringify(s)); }
      } catch (e) {}
      return { ok: true };
    },

    /* Profili ve kaydını sil */
    deleteUser(key) {
      const users = readUsers();
      if (!users[key]) return { ok: false, err: 'Profil bulunamadı.' };
      delete users[key];
      writeUsers(users);
      try { localStorage.removeItem('bokul.save.' + key); } catch (e) {}
      try { localStorage.removeItem('bokul.save.' + key + '.corrupt'); } catch (e) {}
      if (current === key) current = null;
      if (B.Auth.remembered() === key) { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }
      return { ok: true };
    },

    /* Profile dokunarak giriş (şifresiz) — çocuk profilleri için */
    loginByKey(key) {
      if (!readUsers()[key]) return { ok: false, err: 'Profil bulunamadı.' };
      current = key;
      return { ok: true };
    },

    login(name, pass) {
      const key = keyOf(name);
      const u = readUsers()[key];
      if (!u) return { ok: false, err: 'Böyle bir oyuncu yok.' };
      if (u.pass && u.pass !== hash(pass)) return { ok: false, err: 'Şifre yanlış. Tekrar dene!' };
      current = key;
      return { ok: true };
    },

    /* "Beni hatırla": bir sonraki açılışta şifre sormadan devam */
    setRemember(on) {
      if (on && current) { try { localStorage.setItem(SESSION_KEY, current); } catch (e) {} }
      else { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }
    },
    remembered() { try { return localStorage.getItem(SESSION_KEY); } catch (e) { return null; } },
    resume(key) { if (readUsers()[key]) { current = key; return true; } return false; },

    logout() { current = null; try { localStorage.removeItem(SESSION_KEY); } catch (e) {} },

    /* ---- Ebeveyn (admin) PIN'i ---- */
    adminExists() { try { return !!localStorage.getItem(ADMIN_KEY); } catch (e) { return false; } },
    setAdminPin(pin) {
      if (String(pin || '').length < 4) return { ok: false, err: 'PIN en az 4 haneli olmalı.' };
      try { localStorage.setItem(ADMIN_KEY, JSON.stringify({ pin: hash(pin) })); } catch (e) {}
      return { ok: true };
    },
    checkAdmin(pin) {
      try { return JSON.parse(localStorage.getItem(ADMIN_KEY)).pin === hash(pin); }
      catch (e) { return false; }
    },
  };
})(window.BOKUL = window.BOKUL || {});
