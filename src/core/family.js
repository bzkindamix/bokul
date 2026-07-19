/* BOKUL — Aile & Ebeveyn Rolleri (çok ebeveyn, TEK admin)
 * Bir aile = bir aile kodu. Meta: families/{code}/meta/family
 *   { admin: <uid>, adminName, parents: { <uid>: { name, role, ts } } }
 * Roller:
 *   admin   — aileyi kuran (kod sahibi). Tam yetki: izinler + ebeveyn yönetimi.
 *   parent  — admin'in ONAYLADIĞI ebeveyn. Çocukları görür + izin düzenleyebilir.
 *   pending — kodla bağlandı ama admin onayı bekliyor. Sadece görüntüler.
 * Aile kodunu bilmek admin yapmaz: yeni bağlanan HERKES 'pending' başlar; yetkiyi admin verir.
 * NOT: Firestore kuralları açık (public apiKey) olduğundan bu ÜRÜN-DÜZEYİ bir kapıdır;
 *      kriptografik güvenlik için ileride Firestore Security Rules (request.auth) gerekir. */
(function (B) {
  function base() {
    return 'https://firestore.googleapis.com/v1/projects/' + B.Cloud.projectId() + '/databases/(default)/documents';
  }
  function metaUrl(code) { return base() + '/families/' + encodeURIComponent(code) + '/meta/family'; }
  function sv(s) { return { stringValue: String(s == null ? '' : s) }; }

  async function req(url, opts) {
    const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'key=' + B.Cloud.apiKey(), opts);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('FS ' + r.status);
    return r.status === 200 ? r.json() : null;
  }

  let meta = null; // önbellek: { admin, adminName, parents }

  function parseMeta(doc) {
    if (!doc || !doc.fields) return null;
    const f = doc.fields;
    let parents = {};
    try { parents = JSON.parse((f.parents && f.parents.stringValue) || '{}'); } catch (e) {}
    return { admin: (f.admin && f.admin.stringValue) || '', adminName: (f.adminName && f.adminName.stringValue) || '', parents: parents };
  }

  async function fetchMeta(code) {
    code = code || B.Cloud.getCode();
    if (!code || !B.Cloud.configured()) return null;
    try { meta = parseMeta(await req(metaUrl(code), { method: 'GET' })); return meta; }
    catch (e) { return meta; }
  }

  async function writeMeta(code, m) {
    const body = { fields: { admin: sv(m.admin), adminName: sv(m.adminName), parents: sv(JSON.stringify(m.parents || {})) } };
    await req(metaUrl(code) + '?updateMask.fieldPaths=admin&updateMask.fieldPaths=adminName&updateMask.fieldPaths=parents', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    meta = m;
  }

  /* Kod sahibi/giren ebeveyni aileye bağla:
   *   meta yoksa → bu ebeveyn ADMIN olur (aileyi kurar).
   *   admin bu ebeveynse → admin kaydını doğrula.
   *   farklı admin varsa → 'pending' üye olarak eklenir (admin onaylayana dek). */
  async function claimOrJoin(uid, name, code) {
    code = code || B.Cloud.getCode();
    if (!code || !uid || !B.Cloud.configured()) return null;
    let m = await fetchMeta(code);
    if (!m || !m.admin) {
      m = { admin: uid, adminName: name || '', parents: {} };
      m.parents[uid] = { name: name || '', role: 'admin', ts: Date.now() };
      await writeMeta(code, m);
      return m;
    }
    if (m.admin === uid) {
      if (!m.parents[uid] || m.parents[uid].role !== 'admin') {
        m.parents[uid] = { name: name || m.adminName, role: 'admin', ts: Date.now() };
        await writeMeta(code, m);
      }
      return m;
    }
    if (!m.parents[uid]) {
      m.parents[uid] = { name: name || '', role: 'pending', ts: Date.now() };
      await writeMeta(code, m);
    }
    return m;
  }

  function current() { const s = B.AuthCloud && B.AuthCloud.current(); return s ? s.localId : null; }
  function roleOf(uid) {
    if (!meta) return 'none';
    if (meta.admin === uid) return 'admin';
    const p = meta.parents && meta.parents[uid];
    return p ? p.role : 'none';
  }
  function myRole() { return roleOf(current()); }
  function isAdmin() { return myRole() === 'admin'; }
  /* İzin düzenleyebilir mi? admin ya da onaylı ebeveyn. pending/none HAYIR. */
  function canManagePerms() { const r = myRole(); return r === 'admin' || r === 'parent'; }

  async function setRole(uid, role) {
    if (!isAdmin() || uid === meta.admin || !meta.parents[uid]) return false;
    meta.parents[uid].role = role;
    await writeMeta(B.Cloud.getCode(), meta);
    return true;
  }
  async function removeParent(uid) {
    if (!isAdmin() || uid === meta.admin || !meta.parents[uid]) return false;
    delete meta.parents[uid];
    await writeMeta(B.Cloud.getCode(), meta);
    return true;
  }
  function parentList() {
    if (!meta) return [];
    return Object.keys(meta.parents || {}).map(uid => ({
      uid, name: meta.parents[uid].name || '', role: meta.parents[uid].role, self: uid === current(),
    })).sort((a, b) => (a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : 0));
  }

  B.Family = {
    fetchMeta, claimOrJoin, roleOf, myRole, isAdmin, canManagePerms,
    setRole, removeParent, parentList,
    meta: () => meta, adminName: () => (meta ? meta.adminName : ''),
    pendingCount: () => (meta ? Object.values(meta.parents || {}).filter(p => p.role === 'pending').length : 0),
  };
})(window.BOKUL = window.BOKUL || {});
