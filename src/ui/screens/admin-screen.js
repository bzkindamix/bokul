/* BOKUL — Ebeveyn Konsolu (Admin)
 * İki kaynak: 📱 Bu cihaz (yerel kayıtlar) ve ☁️ Bulut (aile kodundaki tüm çocuklar).
 * Bulut modunda ilerleme uzaktan okunur; dilek hedefleri "directives" olarak yazılır. */
(function (B) {

  function localPlayers() {
    return B.Auth.users().map(key => {
      let save = null;
      try { save = JSON.parse(localStorage.getItem('bokul.save.' + key)); } catch (e) {}
      return { key, name: B.Auth.displayName(key), save, source: 'local' };
    }).filter(p => p.save);
  }
  function writeLocal(key, save) {
    try { localStorage.setItem('bokul.save.' + key, JSON.stringify(save)); } catch (e) {}
    if (B.Auth.current() === key) B.State.data = save;
  }
  /* Kaydın dilek/fikir durumlarını directives paketine çevir (bulut için) */
  function buildDirectives(save) {
    const d = { wishes: {} };
    (save.wishes || []).forEach(w => { d.wishes[w.id] = { goal: w.goal || null, note: w.note || '', status: w.status }; });
    // Oyun fikirleri artık geliştiriciye gidiyor (v0.58) — ebeveyn directive'i yok.
    d.perms = save.perms || { lessons: {}, features: {} }; // ders/özellik kilitleri (uzaktan)
    return d;
  }
  const PROFILE_META = {
    hobiler: '🎨 Hobiler', muzik: '🎵 Müzik', sanatcilar: '🎤 Sanatçılar', oyuncaklar: '🧸 Oyuncaklar',
    kiyafetler: '👕 Kıyafetler', aburcubur: '🍫 Abur cubur', saglikli: '🥗 Sağlıklı', sporlar: '⚽ Spor', icecekler: '🥤 İçecek',
  };
  function profileHtml(profile) {
    if (!profile) return '';
    const rows = Object.keys(PROFILE_META)
      .filter(k => Array.isArray(profile[k]) && profile[k].length)
      .map(k => '<div class="adm-int"><b>' + PROFILE_META[k] + ':</b> ' + esc(profile[k].join(', ')) + '</div>');
    return rows.length ? '<div class="adm-ints"><div class="adm-int-h">🎯 İlgi Alanları</div>' + rows.join('') + '</div>' : '';
  }
  function xpNeeded(level) { const L = B.Content.get('rewards').levels; return L.base + (level - 1) * L.perLevel; }
  function esc(s) { return String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }

  B.UI.registerScreen('admin', {
    enter(root) {
      let tab = 'players';
      // Ebeveyn (Google/e-posta) giriş yaptıysa bulutu varsayıla — davet kodu
      // shell()'de set edildiğinden, kaynağı baştan 'cloud' seçmek güvenli.
      let source = (B.Cloud.enabled() || (B.AuthCloud && B.AuthCloud.current())) ? 'cloud' : 'local';
      let players = [];
      let famRole = 'admin'; // bulut ailesindeki rolüm: admin/parent/pending/none (yerelde admin sayılır)
      root.classList.add('admin-root');

      /* Bulut ailesine bağlan (kodu ilk kuran ADMIN; sonra bağlananlar 'pending') + rolü çöz */
      async function ensureFamily() {
        if (source !== 'cloud' || !B.Cloud.enabled() || !(B.AuthCloud && B.AuthCloud.current()) || !B.Family) { famRole = 'admin'; return; }
        const s = B.AuthCloud.current();
        try { await B.Family.claimOrJoin(s.localId, B.AuthCloud.name() || B.AuthCloud.firstName() || ''); } catch (e) {}
        famRole = B.Family.myRole();
      }
      /* İzin/değişiklik yapabilir miyim? Yerelde her zaman; bulutta admin ya da onaylı ebeveyn. */
      function canEdit() { return !(source === 'cloud' && B.Cloud.enabled() && B.Family) || B.Family.canManagePerms(); }

      /* Bir oyuncunun değişikliğini uygun yere yaz */
      async function persist(player) {
        if (!canEdit()) { B.UI.toast('🔒 İzin yetkisi admin ebeveynde. Seni onaylaması gerekiyor.'); return; }
        if (player.source === 'cloud') await B.Cloud.writeDirectives(player.key, buildDirectives(player.save));
        else writeLocal(player.key, player.save);
      }

      function findPlayer(key) { return players.find(p => p.key === key); }

      async function load() {
        const body = root.querySelector('.admin-body');
        if (body) body.innerHTML = '<div class="wish-empty">Yükleniyor…</div>';
        await ensureFamily();
        if (source === 'cloud') {
          const list = await B.Cloud.listPlayers();
          players = list.map(p => Object.assign({ source: 'cloud' }, p));
        } else {
          players = localPlayers();
        }
        // Rol satırını (varsa) tazele
        const rr = root.querySelector('.adm-rolebar'); if (rr) rr.outerHTML = roleBarHtml();
        const pt = root.querySelector('.atab[data-t="parents"] .par-badge'); if (pt) pt.textContent = B.Family && B.Family.pendingCount() ? B.Family.pendingCount() : '';
        renderBody();
      }

      function shell() {
        // Ebeveynin adı (Google profili ya da kayıt formundan) — Baba "Binbaşı X" der
        const pName = (B.AuthCloud && B.AuthCloud.firstName) ? B.AuthCloud.firstName() : '';
        // Etkin aile kodu: bağlanılan aile (eş/ikinci ebeveyn) ya da kendi ailesi
        const emailCode = (B.AuthCloud && B.AuthCloud.familyCode) ? B.AuthCloud.familyCode() : ((B.AuthCloud && B.AuthCloud.current()) ? B.AuthCloud.inviteCode() : '');
        if (emailCode && B.Cloud.getCode() !== emailCode) B.Cloud.setCode(emailCode);
        const code = emailCode || B.Cloud.getCode();
        const famRow = B.Cloud.configured()
          ? '<div class="adm-fam">' +
              (code
                ? '<div>🎟️ Davet Kodun: <b class="adm-code">' + code + '</b> <button class="chip adm-copy">Kopyala</button> <button class="chip adm-send">📤 Çocuğa Gönder</button>' +
                  '<div class="adm-fam-hint">Bu kodu çocuklarının cihazında giriş ekranı → "🎮 Oyuncuyum" / "🎟️ Davet Kodu" bölümüne gir. Sonra "☁️ Bulut (aile)" sekmesinden hepsini görürsün.</div></div>'
                : '<button class="chip adm-gencode">🎟️ Davet kodu oluştur</button>' +
                  '<span class="adm-fam-hint"> — çocukların cihazlarını bağlamak için (veya e-posta ile giriş yap, kod otomatik gelsin)</span>') +
            '</div>'
          : '';
        root.innerHTML =
          '<div class="admin-head">' +
            '<button class="chip admin-back">◀ Çıkış</button>' +
            '<b>👨‍👧 ' + (pName ? 'Binbaşı ' + pName : 'Ebeveyn Konsolu') + '</b>' +
            '<button class="chip admin-help" title="Nasıl çalışır?">❓</button>' +
            '<button class="chip admin-pin">🔑 PIN</button>' +
          '</div>' +
          famRow +
          roleBarHtml() +
          '<div class="admin-tabs">' +
            (B.Cloud.configured()
              ? '<button class="chip asrc" data-s="cloud">☁️ Bulut (aile)</button><button class="chip asrc" data-s="local">📱 Bu cihaz</button>' : '') +
            '<span class="adm-sep"></span>' +
            '<button class="chip atab" data-t="players">📊 Oyuncular</button>' +
            '<button class="chip atab" data-t="report">📈 Karne</button>' +
            '<button class="chip atab" data-t="perms">🔒 İzinler</button>' +
            '<button class="chip atab" data-t="wishes">🎁 İstekler</button>' +
            (B.Cloud.configured() ? '<button class="chip atab" data-t="parents">👪 Ebeveynler<span class="par-badge"></span></button>' : '') +
            '<button class="chip atab" data-t="account">⚙️ Hesap</button>' +
            '<button class="chip adm-refresh">🔄</button>' +
          '</div>' +
          '<div class="admin-body"></div>';
        root.querySelector('.admin-back').onclick = () => B.UI.show('login');
        root.querySelector('.admin-pin').onclick = changePin;
        root.querySelector('.adm-refresh').onclick = load;
        const helpBtn = root.querySelector('.admin-help');
        if (helpBtn) helpBtn.onclick = parentTour;
        // İlk ziyarette otomatik anlat
        const seen = B.Save.settings.get();
        if (!seen.tour_parent) { B.Save.settings.set({ tour_parent: true }); setTimeout(parentTour, 400); }
        root.querySelectorAll('.atab').forEach(b => b.onclick = () => {
          tab = b.dataset.t;
          root.querySelectorAll('.atab').forEach(x => x.classList.toggle('tab-on', x === b));
          renderBody();
        });
        root.querySelectorAll('.asrc').forEach(b => b.onclick = () => {
          source = b.dataset.s;
          root.querySelectorAll('.asrc').forEach(x => x.classList.toggle('tab-on', x === b));
          load();
        });
        const cp = root.querySelector('.adm-copy');
        if (cp) cp.onclick = () => { try { navigator.clipboard.writeText(code); B.UI.toast('Kod kopyalandı'); } catch (e) {} };
        const sendBtn = root.querySelector('.adm-send');
        if (sendBtn) sendBtn.onclick = () => shareInvite(code);
        const gc = root.querySelector('.adm-gencode');
        if (gc) gc.onclick = () => { B.Cloud.setCode(B.Cloud.genCode()); source = 'cloud'; shell(); load(); };

        const activeTab = root.querySelector('.atab[data-t="' + tab + '"]'); if (activeTab) activeTab.classList.add('tab-on');
        const activeSrc = root.querySelector('.asrc[data-s="' + source + '"]'); if (activeSrc) activeSrc.classList.add('tab-on');
        load();
      }

      function renderBody() {
        const body = root.querySelector('.admin-body');
        if (!body) return;
        if (tab === 'account') return renderAccount(body); // ebeveyn ayarları — oyuncu gerekmez
        if (tab === 'parents') return renderParents(body); // ebeveyn yönetimi — oyuncu gerekmez
        if (source === 'cloud' && !B.Cloud.enabled()) { body.innerHTML = '<div class="wish-empty">Önce yukarıdan bir aile kodu oluştur.</div>'; return; }
        if (!players.length) {
          body.innerHTML = '<div class="wish-empty">' + (source === 'cloud'
            ? 'Bu aile kodunda henüz oyuncu yok. Çocukların cihazlarına aile kodunu girip biraz oynamalarını sağla.'
            : 'Bu cihazda kayıtlı oyuncu yok.') + '</div>';
          return;
        }
        if (tab === 'players') renderPlayers(body);
        else if (tab === 'report') renderReport(body);
        else if (tab === 'perms') renderPerms(body);
        else if (tab === 'wishes') renderWishes(body);
        else renderAccount(body);
      }

      /* ---- 📊 Oyuncular ---- */
      function renderPlayers(body) {
        const lessons = B.Lesson.all();
        body.innerHTML = players.map(p => {
          const s = p.save, pl = s.player, st = s.stats || {};
          const acc = (st.correct + st.wrong) ? Math.round(st.correct / (st.correct + st.wrong) * 100) : 0;
          const firstTry = st.questionsDone ? Math.round((st.firstTryCorrect || 0) / st.questionsDone * 100) : 0;
          const avgSec = st.questionsDone ? Math.round((st.timeSumMs || 0) / st.questionsDone / 1000) : 0;
          const rank = B.Reward.rankFor(pl.level);
          const xpPct = Math.min(100, Math.round((pl.xp || 0) / xpNeeded(pl.level) * 100));
          const lessonRows = lessons.map(les => {
            let earned = 0, max = 0, bd = 0, bt = 0;
            les.units.forEach(u => u.sections.forEach(sec => {
              max += sec.missions.length * 3; bt++;
              const sp = (s.progress.lessons[les.id] || { sections: {} }).sections[sec.id];
              if (sp) { earned += Object.values(sp.missions || {}).reduce((t, m) => t + (m.stars || 0), 0); if (sp.bossDefeated) bd++; }
            }));
            return '<div class="adm-lesson"><span>' + les.icon + ' ' + esc(les.title) + '</span><span>⭐ ' + earned + '/' + max + ' · 🏰 ' + bd + '/' + bt + '</span></div>';
          }).join('');
          const last = s.meta && s.meta.lastPlayedAt ? new Date(s.meta.lastPlayedAt).toLocaleDateString('tr-TR') : '—';
          return '<div class="adm-card">' +
            '<div class="adm-p-head"><span class="adm-av">' + B.Avatar.el(pl.avatar) + '</span>' +
              '<div class="adm-p-id"><b>' + esc(pl.name) + '</b><div class="adm-rank">' + rank.icon + ' ' + rank.title + ' · Sv.' + pl.level +
                (pl.age ? ' · 🎂 ' + pl.age : '') + (pl.grade != null ? ' · 🎓 ' + (pl.grade === 0 ? 'okul öncesi' : pl.grade + '. sınıf') : '') + '</div></div>' +
              '<button class="chip adm-del" data-key="' + p.key + '" title="Bu oyuncuyu sil">🗑️</button></div>' +
            '<div class="hud-xpbar adm-xp"><i style="width:' + xpPct + '%"></i></div>' +
            '<div class="adm-stats"><span>💰 ' + (pl.coins || 0) + '</span><span>✅ ' + (st.correct || 0) + '</span><span>❌ ' + (st.wrong || 0) +
              '</span><span>🎯 %' + acc + '</span><span>🔥 en iyi ' + ((s.streaks && s.streaks.best) || 0) + '</span><span>📅 ' + last + '</span></div>' +
            '<div class="adm-stats adm-stats2"><span title="İlk denemede doğru bilme oranı — düşükse tahmin ediyor olabilir">🥇 İlk deneme: %' + firstTry + ' (' + (st.questionsDone || 0) + ' soru)</span>' +
              '<span title="Soru başına ortalama yanıt süresi">⏱️ ~' + avgSec + ' sn/soru</span></div>' +
            '<div class="adm-lessons">' + lessonRows + '</div>' +
            profileHtml(pl.profile) + '</div>';
        }).join('');

        // Oyuncu silme (eski/silinmiş kayıtları temizle) — hem yerel hem bulut
        body.querySelectorAll('.adm-del').forEach(btn => btn.onclick = () => {
          if (!canEdit()) { B.UI.toast('🔒 Silme yetkisi admin ebeveynde.'); return; }
          const key = btn.dataset.key;
          const pp = findPlayer(key);
          const nm = pp && pp.save && pp.save.player ? pp.save.player.name : key;
          B.UI.confirm({
            icon: '🗑️', title: nm + ' silinsin mi?',
            body: (source === 'cloud' ? 'Buluttaki kaydı' : 'Bu cihazdaki kaydı') + ' kalıcı silinecek.',
            yes: 'Sil', no: 'Vazgeç',
            onYes: async () => {
              if (source === 'cloud') { await B.Cloud.deletePlayer(key); }
              else { B.Auth.deleteUser(key); if (B.Cloud.enabled()) await B.Cloud.deletePlayer(key); }
              B.UI.toast('Silindi 🗑️'); load();
            },
          });
        });
      }

      /* Bulut ailesindeki rolümü açıklayan üst şerit */
      function roleBarHtml() {
        if (source !== 'cloud' || !B.Cloud.enabled() || !B.Family) return '<div class="adm-rolebar" style="display:none"></div>';
        if (famRole === 'admin') return '<div class="adm-rolebar role-admin">👑 Bu ailenin ADMIN ebeveynisin — izinleri yalnızca sen yönetirsin.</div>';
        if (famRole === 'parent') return '<div class="adm-rolebar role-parent">✅ Onaylı ebeveynsin — çocukları görür, izin düzenleyebilirsin.</div>';
        if (famRole === 'pending') return '<div class="adm-rolebar role-pending">⏳ Admin ebeveynin onayını bekliyorsun — onaylanana kadar sadece görüntülersin.</div>';
        return '<div class="adm-rolebar" style="display:none"></div>';
      }

      /* ---- 👪 Ebeveynler (çok ebeveyn · tek admin) ---- */
      async function renderParents(body) {
        if (!B.Cloud.configured()) { body.innerHTML = '<div class="wish-empty">Bulut yapılandırılmamış.</div>'; return; }
        body.innerHTML = '<div class="wish-empty">Yükleniyor…</div>';
        const code = (B.AuthCloud && B.AuthCloud.familyCode) ? B.AuthCloud.familyCode() : B.Cloud.getCode();
        const joinBox =
          '<div class="adm-joinbox"><div class="adm-join-h">👥 Başka bir aileye bağlan</div>' +
          '<div class="adm-fam-hint">Eşinin/ikinci ebeveynin aile kodunu gir — o ailenin ebeveyni olmak için başvurursun; admin onaylar.</div>' +
          '<div class="adm-join-row"><input class="adm-join-code" maxlength="12" placeholder="AİLE KODU"><button class="chip adm-join-go">Bağlan</button></div>' +
          (B.AuthCloud.isJoined() ? '<button class="chip adm-join-leave">↩︎ Kendi aileme dön</button>' : '') +
          '</div>';
        function wireJoin() {
          const go = body.querySelector('.adm-join-go');
          if (go) go.onclick = () => {
            const c = (body.querySelector('.adm-join-code').value || '').trim().toUpperCase();
            if (c.length < 4) { B.UI.toast('Geçerli bir aile kodu gir'); return; }
            B.AuthCloud.joinFamily(c); B.UI.toast('Aileye bağlanılıyor…'); source = 'cloud'; shell();
          };
          const lv = body.querySelector('.adm-join-leave');
          if (lv) lv.onclick = () => { B.AuthCloud.leaveJoinedFamily(); B.UI.toast('Kendi ailene dönüldü'); shell(); };
        }
        if (!code || !(B.AuthCloud && B.AuthCloud.current())) {
          body.innerHTML = '<div class="adm-card"><div class="wish-empty">Ebeveyn yönetimi için e-posta/Google ile giriş yapıp bir aile kodun olmalı.</div></div>' + joinBox;
          wireJoin(); return;
        }
        await B.Family.claimOrJoin(B.AuthCloud.current().localId, B.AuthCloud.name() || '');
        await B.Family.fetchMeta(code);
        famRole = B.Family.myRole();
        const admin = B.Family.isAdmin();
        const rows = B.Family.parentList().map(p => {
          const roleLabel = { admin: '👑 Admin', parent: '✅ Ebeveyn', pending: '⏳ Onay bekliyor' }[p.role] || p.role;
          const name = esc(p.name || 'Ebeveyn') + (p.self ? ' (sen)' : '');
          let ctl = '';
          if (admin && !p.self && p.role !== 'admin') {
            ctl += (p.role === 'pending')
              ? '<button class="chip par-approve" data-uid="' + p.uid + '">Onayla</button>'
              : '<button class="chip par-demote" data-uid="' + p.uid + '">Onayı kaldır</button>';
            ctl += '<button class="chip par-remove" data-uid="' + p.uid + '">🗑️</button>';
          }
          return '<div class="adm-parent"><span class="par-name">' + name + '</span><span class="par-role role-' + p.role + '">' + roleLabel + '</span>' + ctl + '</div>';
        }).join('');
        body.innerHTML = roleBarHtml() +
          '<div class="adm-card"><div class="adm-parents-h">👪 Ailedeki Ebeveynler <b class="adm-code2">' + esc(code) + '</b></div>' +
          (admin ? '<div class="adm-fam-hint">Aile kodunu bilen yeni ebeveynler burada "onay bekliyor" görünür. Yalnızca onayladıkların izin düzenleyebilir.</div>' : '') +
          (rows || '<div class="wish-empty">Henüz ebeveyn yok.</div>') + '</div>' + joinBox;
        body.querySelectorAll('.par-approve').forEach(b => b.onclick = async () => { await B.Family.setRole(b.dataset.uid, 'parent'); B.UI.toast('Onaylandı ✅'); renderParents(body); });
        body.querySelectorAll('.par-demote').forEach(b => b.onclick = async () => { await B.Family.setRole(b.dataset.uid, 'pending'); renderParents(body); });
        body.querySelectorAll('.par-remove').forEach(b => b.onclick = () => B.UI.confirm({
          icon: '🗑️', title: 'Ebeveyn çıkarılsın mı?', body: 'Bu ebeveyn aileden çıkarılacak.', yes: 'Çıkar', no: 'Vazgeç',
          onYes: async () => { await B.Family.removeParent(b.dataset.uid); B.UI.toast('Çıkarıldı'); renderParents(body); },
        }));
        wireJoin();
      }

      /* ---- 📈 Karne (ebeveyn özeti: zayıf/güçlü konu raporu, istatistikli) ---- */
      function renderReport(body) {
        const th = ((B.Content.get('config') || {}).adaptive) || { weakThreshold: 0.6, strongThreshold: 0.85 };
        const lessons = B.Lesson.all();
        // Her ders için beceri (skill) listesi — soru bankalarından toplanır
        const lessonSkills = lessons.map(l => {
          const set = {};
          l.units.forEach(u => u.sections.forEach(sec => (sec.bank || []).forEach(q => { if (q.skill) set[q.skill] = 1; })));
          return { lesson: l, skills: Object.keys(set) };
        });
        const mastery = (per, sk) => {
          const arr = (per && per[sk]) || [];
          if (!arr.length) return null; // veri yok = başlanmadı
          return (arr.reduce((a, b) => a + b, 0) / arr.length) * Math.min(1, arr.length / 8);
        };
        body.innerHTML =
          '<div class="adm-hint">Karne, çocuğun ilk-deneme doğruluk verisine dayanır. Konu barı: 💪 iyi · 🟡 orta · ⚠️ zayıf · ⚪ başlanmadı. Zayıf konularda tekrar önerilir.</div>' +
          players.map(p => {
            const s = p.save, st = s.stats || {}, per = st.perSkill || {};
            const acc = (st.correct + st.wrong) ? Math.round(st.correct / (st.correct + st.wrong) * 100) : 0;
            const firstTry = st.questionsDone ? Math.round((st.firstTryCorrect || 0) / st.questionsDone * 100) : 0;
            const rows = lessonSkills.map(ls => {
              const vals = ls.skills.map(sk => mastery(per, sk)).filter(v => v !== null);
              const m = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
              let cls, label, pct = 0;
              if (m === null) { cls = 'rep-none'; label = '⚪ Başlanmadı'; }
              else { pct = Math.round(m * 100);
                if (m >= th.strongThreshold) { cls = 'rep-strong'; label = '💪 İyi'; }
                else if (m < th.weakThreshold) { cls = 'rep-weak'; label = '⚠️ Zayıf'; }
                else { cls = 'rep-mid'; label = '🟡 Orta'; }
              }
              return { title: ls.lesson.title, icon: ls.lesson.icon, m: m, pct: pct, cls: cls, label: label };
            });
            const withData = rows.filter(r => r.m !== null);
            const strong = withData.slice().sort((a, b) => b.m - a.m)[0];
            const weak = withData.slice().sort((a, b) => a.m - b.m)[0];
            const verdict = withData.length
              ? '<div class="rep-verdict">' +
                  (strong ? '<span class="rv-strong">💪 En güçlü: ' + esc(strong.title) + ' (%' + strong.pct + ')</span>' : '') +
                  (weak && weak !== strong ? '<span class="rv-weak">⚠️ Desteklenmeli: ' + esc(weak.title) + ' (%' + weak.pct + ')</span>' : '') +
                '</div>'
              : '<div class="rep-verdict rep-empty2">Henüz yeterli veri yok — çocuk biraz oynayınca konu karnesi oluşur.</div>';
            return '<div class="adm-card rep-card">' +
              '<div class="adm-p-head"><span class="adm-av">' + B.Avatar.el(s.player.avatar) + '</span>' +
                '<div class="adm-p-id"><b>' + esc(s.player.name) + '</b>' +
                  '<div class="rep-stats">🎯 Doğruluk %' + acc + ' · 🥇 İlk deneme %' + firstTry + ' · ✅ ' + (st.questionsDone || 0) + ' soru</div></div></div>' +
              '<div class="rep-topics">' + rows.map(r =>
                '<div class="rep-topic ' + r.cls + '"><span class="rt-name">' + r.icon + ' ' + esc(r.title) + '</span>' +
                  '<span class="rt-bar"><i style="width:' + r.pct + '%"></i></span>' +
                  '<span class="rt-badge">' + r.label + (r.m !== null ? ' %' + r.pct : '') + '</span></div>'
              ).join('') + '</div>' + verdict + '</div>';
          }).join('');
      }

      /* ---- 🎁 İstekler ---- */
      function renderWishes(body) {
        const metricOpts = Object.keys(B.Wish.METRICS).map(m =>
          '<option value="' + m + '">' + B.Wish.METRICS[m].icon + ' ' + B.Wish.METRICS[m].name + '</option>').join('');
        let any = false;
        body.innerHTML = players.map(p => {
          const wishes = (p.save.wishes || []);
          if (!wishes.length) return '';
          any = true;
          return '<div class="adm-card"><div class="adm-p-head"><span class="adm-av">' + B.Avatar.el(p.save.player.avatar) + '</span><b>' + esc(p.save.player.name) + '</b></div>' +
            wishes.slice().reverse().map(w => {
              const pr = w.goal ? B.Wish.progress(p.save, w) : null;
              const progHtml = pr ? '<div class="quest-bar"><i style="width:' + pr.pct + '%"></i><span class="quest-count">' + pr.cur + '/' + pr.target + '</span></div>' : '';
              const badge = { pending: '⏳ Yeni', assigned: '🎯 Hedefli', earned: '🎉 Hak etti!', granted: '✅ Verildi' }[w.status] || w.status;
              return '<div class="adm-wish" data-key="' + p.key + '" data-id="' + w.id + '">' +
                '<div class="wish-top"><b>' + esc(w.text) + '</b><span class="wish-badge">' + badge + '</span></div>' + progHtml +
                '<div class="adm-wish-ctl"><select class="adm-metric">' + metricOpts + '</select>' +
                '<input class="adm-target" type="number" min="1" value="' + (w.goal ? w.goal.target : 10) + '">' +
                '<button class="chip adm-assign">🎯 Hedef ata</button><button class="chip adm-grant">✅ Ödülü verdim</button></div>' +
                '<input class="adm-note name-input" placeholder="Çocuğa not" value="' + esc(w.note) + '"></div>';
            }).join('') + '</div>';
        }).join('');
        if (!any) body.innerHTML = '<div class="wish-empty">Henüz istek yok.</div>';

        body.querySelectorAll('.adm-wish').forEach(el => {
          const p = findPlayer(el.dataset.key); if (!p) return;
          const w = p.save.wishes.find(x => x.id === el.dataset.id);
          if (w && w.goal) el.querySelector('.adm-metric').value = w.goal.metric;
          el.querySelector('.adm-assign').onclick = async () => {
            w.goal = { metric: el.querySelector('.adm-metric').value, target: Math.max(1, parseInt(el.querySelector('.adm-target').value) || 10) };
            w.note = el.querySelector('.adm-note').value;
            if (w.status === 'pending' || w.status === 'assigned')
              w.status = B.Wish.value(p.save, w.goal.metric) >= w.goal.target ? 'earned' : 'assigned';
            await persist(p); renderBody(); B.UI.toast('Hedef atandı 🎯');
          };
          el.querySelector('.adm-grant').onclick = async () => {
            w.status = 'granted'; w.note = el.querySelector('.adm-note').value;
            await persist(p); renderBody(); B.UI.toast('Ödül verildi olarak işaretlendi ✅');
          };
        });
      }

      /* ---- 💡 Fikirler ---- */
      function renderIdeas(body) {
        const opts = { new: 'Yeni', seen: 'Gördüm', planned: 'Yapılacak', done: 'Eklendi' };
        let any = false;
        body.innerHTML = players.map(p => {
          const ideas = (p.save.ideas || []);
          if (!ideas.length) return '';
          any = true;
          return '<div class="adm-card"><div class="adm-p-head"><span class="adm-av">' + B.Avatar.el(p.save.player.avatar) + '</span><b>' + esc(p.save.player.name) + '</b></div>' +
            ideas.slice().reverse().map(i => {
              const o = Object.keys(opts).map(k => '<option value="' + k + '"' + (i.status === k ? ' selected' : '') + '>' + opts[k] + '</option>').join('');
              return '<div class="adm-wish" data-key="' + p.key + '" data-id="' + i.id + '"><div class="wish-top"><b>💡 ' + esc(i.text) + '</b></div>' +
                '<div class="adm-wish-ctl"><select class="adm-istatus">' + o + '</select><button class="chip adm-isave">💾 Kaydet</button></div>' +
                '<input class="adm-inote name-input" placeholder="Çocuğa not" value="' + esc(i.note) + '"></div>';
            }).join('') + '</div>';
        }).join('');
        if (!any) body.innerHTML = '<div class="wish-empty">Henüz fikir yok.</div>';

        body.querySelectorAll('.adm-wish').forEach(el => {
          el.querySelector('.adm-isave').onclick = async () => {
            const p = findPlayer(el.dataset.key); if (!p) return;
            const idea = p.save.ideas.find(x => x.id === el.dataset.id);
            idea.status = el.querySelector('.adm-istatus').value;
            idea.note = el.querySelector('.adm-inote').value;
            await persist(p); B.UI.toast('Kaydedildi 💾');
          };
        });
      }

      /* ---- 🔒 İzinler (ders + özellik kilitleri) ---- */
      function swRow(kind, key, id, label, on) {
        return '<label class="adm-perm-row"><span class="adm-perm-lbl">' + label + '</span>' +
          '<span class="adm-switch"><input type="checkbox" class="adm-perm" data-kind="' + kind + '" data-key="' + key + '" data-id="' + esc(id) + '"' + (on ? ' checked' : '') + '><span class="adm-slider"></span></span></label>';
      }
      function renderPerms(body) {
        const lessons = B.Lesson.all();
        const locked = !canEdit();
        body.innerHTML =
          (locked ? '<div class="adm-rolebar role-pending">🔒 İzinleri yalnızca admin ebeveyn (ya da onayladığı ebeveyn) düzenleyebilir. Sen görüntüleme modundasın.</div>' : '') +
          '<div class="adm-hint">Kapatılan ders veya bölüm çocuğun ekranında 🔒 kilitli görünür. Bulut modunda değişiklik çocuğun cihazına bir sonraki açılışta yansır.</div>' +
          players.map(p => {
            B.Perms.ensure(p.save);
            const lessonRows = lessons.map(l => swRow('L', p.key, l.id, l.icon + ' ' + esc(l.title), B.Perms.lesson(l.id, p.save))).join('');
            const featRows = B.Perms.FEATURES.map(f => swRow('F', p.key, f.key, f.icon + ' ' + f.name, B.Perms.feature(f.key, p.save))).join('');
            // Uyarı: evcil hayvan açık ama mağaza kapalıysa çocuk mama alamaz → hayvan aç kalır
            const petStoreWarn = (B.Perms.feature('pets', p.save) && !B.Perms.feature('store', p.save))
              ? '<div class="adm-warn">⚠️ Evcil hayvan açık ama Eşya Mağazası kapalı — çocuk mama alamaz, hayvan aç kalabilir. İkisini birlikte açık tutman önerilir.</div>' : '';
            return '<div class="adm-card"><div class="adm-p-head"><span class="adm-av">' + B.Avatar.el(p.save.player.avatar) + '</span><b>' + esc(p.save.player.name) + '</b></div>' +
              '<div class="adm-perm-h">📚 Dersler (Cepheler)</div>' + lessonRows +
              '<div class="adm-perm-h">🎮 Oyun Bölümleri</div>' + featRows + petStoreWarn + '</div>';
          }).join('');
        if (locked) body.querySelectorAll('.adm-perm').forEach(inp => { inp.disabled = true; });
        body.querySelectorAll('.adm-perm').forEach(inp => {
          inp.onchange = async () => {
            if (!canEdit()) { B.UI.toast('🔒 İzin yetkisi admin ebeveynde.'); load(); return; }
            const p = findPlayer(inp.dataset.key); if (!p) return;
            const on = inp.checked;
            if (inp.dataset.kind === 'L') B.Perms.setLesson(inp.dataset.id, on, p.save);
            else B.Perms.setFeature(inp.dataset.id, on, p.save);
            await persist(p);
            B.UI.toast(on ? 'Açıldı ✓' : 'Kapatıldı 🔒');
            if (inp.dataset.kind === 'F' && (inp.dataset.id === 'pets' || inp.dataset.id === 'store')) renderPerms(body); // pet/mağaza uyarısını tazele
          };
        });
      }

      /* ---- ⚙️ Hesap (ebeveyn ayarları — farklı menüler) ---- */
      function renderAccount(body) {
        const hasEmail = !!(B.AuthCloud && B.AuthCloud.current());
        const email = hasEmail ? B.AuthCloud.email() : '';
        const items = [];
        if (hasEmail) items.push({ ic: '👤', tt: 'Hesap Bilgileri', sub: email, fn: accountInfo });
        items.push({ ic: '👨‍👧', tt: 'Çocuk Profilleri', sub: B.Auth.users().length + ' profil · ekle, adlandır, sil', fn: manageProfiles });
        if (B.Cloud.configured()) items.push({ ic: '🎟️', tt: 'Aile & Davet Kodu', sub: 'Kodu paylaş, bağlantıyı yönet', fn: familyMenu });
        items.push({ ic: '🔒', tt: 'Gizlilik & KVKK', sub: 'Metinleri gör, rızayı yönet', fn: privacyMenu });
        items.push({ ic: '🔑', tt: 'Çevrimdışı PIN', sub: B.Auth.adminExists() ? 'PIN değiştir' : 'PIN belirle', fn: changePin });
        items.push({ ic: '🔊', tt: 'Uygulama', sub: 'Ses ayarı', fn: appPrefs });
        body.innerHTML = '<div class="acc-menu">' + items.map((it, i) =>
          '<button class="acc-item" data-i="' + i + '"><span class="acc-ic">' + it.ic + '</span>' +
          '<span class="acc-tt"><b>' + it.tt + '</b><small>' + esc(it.sub) + '</small></span><span class="acc-go">▶</span></button>'
        ).join('') + '</div>';
        body.querySelectorAll('.acc-item').forEach(b => b.onclick = () => items[+b.dataset.i].fn());
      }

      function accountInfo() {
        const verified = B.AuthCloud.isVerified();
        const ov = B.UI.overlay(
          '<div class="ov-big">👤</div><h2>Hesap Bilgileri</h2>' +
          '<div class="acc-info">' +
          (B.AuthCloud.name() ? '<div><b>Ad Soyad:</b> ' + esc(B.AuthCloud.name()) + ' <span class="acc-rank">🎖️ Binbaşı</span></div>' : '') +
          '<div><b>E-posta:</b> ' + esc(B.AuthCloud.email()) + '</div>' +
          '<div><b>Durum:</b> ' + (verified ? '✅ Doğrulanmış' : '⚠️ Doğrulanmamış') + '</div></div>' +
          '<div class="acc-actions">' +
            (verified ? '' : '<button class="btn btn-quiet" id="ai-verify">📧 E-postamı doğrula</button>') +
            '<button class="btn btn-quiet" id="ai-pass">🔑 Şifremi değiştir</button>' +
            '<button class="btn btn-quiet" id="ai-out">🚪 Çıkış yap</button>' +
            '<button class="btn btn-danger" id="ai-del">🗑️ Hesabı sil</button>' +
          '</div><div class="login-err" id="ai-msg"></div>',
          [{ label: 'Kapat', cls: 'btn-quiet', onClick: null }]);
        const msg = ov.querySelector('#ai-msg');
        const ok = t => { msg.style.color = 'var(--success)'; msg.textContent = t; };
        const bad = t => { msg.style.color = 'var(--warn)'; msg.textContent = '⚠️ ' + t; };
        const vb = ov.querySelector('#ai-verify');
        if (vb) vb.onclick = async () => { const r = await B.AuthCloud.sendVerify(); r.ok ? ok('Doğrulama e-postası gönderildi.') : bad(r.err || 'Olmadı.'); };
        ov.querySelector('#ai-pass').onclick = async () => { const r = await B.AuthCloud.sendReset(B.AuthCloud.email()); r.ok ? ok('Şifre sıfırlama e-postası gönderildi.') : bad(r.err || 'Olmadı.'); };
        ov.querySelector('#ai-out').onclick = () => { B.AuthCloud.logout(); ov.remove(); B.UI.toast('Çıkış yapıldı'); B.UI.show('login'); };
        ov.querySelector('#ai-del').onclick = () => {
          const c = B.UI.overlay('<div class="ov-big">⚠️</div><h2>Hesabı Sil</h2><p class="ov-quote">Ebeveyn hesabın Firebase\'den kalıcı silinecek. Çocuk profilleri ve ilerlemeleri bu cihazda kalır. Emin misin?</p>',
            [{ label: 'Evet, sil', cls: 'btn-danger', onClick: null }, { label: 'Vazgeç', cls: 'btn-quiet', onClick: () => c.remove() }]);
          c.querySelectorAll('.overlay-btns .btn')[0].onclick = async () => {
            const r = await B.AuthCloud.deleteAccount();
            c.remove();
            if (!r.ok) return bad(r.err || 'Silinemedi.');
            ov.remove(); B.UI.toast('Hesap silindi'); B.UI.show('login');
          };
        };
      }

      function manageProfiles() {
        const rows = B.Auth.users().map(k => {
          const nm = B.Auth.displayName(k);
          return '<div class="acc-prof" data-k="' + k + '"><span class="acc-prof-nm">🧒 ' + esc(nm) + '</span>' +
            '<span class="acc-prof-ctl"><button class="chip acc-ren">✏️ Adlandır</button><button class="chip acc-del">🗑️ Sil</button></span></div>';
        }).join('') || '<div class="wish-empty">Bu cihazda profil yok.</div>';
        const ov = B.UI.overlay('<div class="ov-big">👨‍👧</div><h2>Çocuk Profilleri</h2><div class="acc-profs">' + rows + '</div>',
          [{ label: 'Kapat', cls: 'btn-quiet', onClick: null }]);
        ov.querySelectorAll('.acc-prof').forEach(row => {
          const k = row.dataset.k;
          row.querySelector('.acc-ren').onclick = () => {
            const r2 = B.UI.overlay('<div class="ov-big">✏️</div><h2>Yeni Ad</h2><input id="rn" class="name-input" maxlength="14" value="' + esc(B.Auth.displayName(k)) + '"><div class="login-err" id="rn-e"></div>',
              [{ label: 'KAYDET', onClick: null }, { label: 'Vazgeç', cls: 'btn-quiet', onClick: () => r2.remove() }]);
            r2.querySelectorAll('.overlay-btns .btn')[0].onclick = () => {
              const res = B.Auth.renameUser(k, r2.querySelector('#rn').value);
              if (!res.ok) { r2.querySelector('#rn-e').textContent = '⚠️ ' + res.err; return; }
              r2.remove(); ov.remove(); B.UI.toast('Ad güncellendi ✏️'); manageProfiles();
            };
          };
          row.querySelector('.acc-del').onclick = () => {
            const d = B.UI.overlay('<div class="ov-big">⚠️</div><h2>Profili Sil</h2><p class="ov-quote">"' + esc(B.Auth.displayName(k)) + '" profili ve tüm ilerlemesi bu cihazdan silinecek. Emin misin?</p>',
              [{ label: 'Evet, sil', cls: 'btn-danger', onClick: null }, { label: 'Vazgeç', cls: 'btn-quiet', onClick: () => d.remove() }]);
            d.querySelectorAll('.overlay-btns .btn')[0].onclick = async () => {
              B.Auth.deleteUser(k);
              if (B.Cloud.enabled()) await B.Cloud.deletePlayer(k); // bulut kaydını da temizle
              d.remove(); ov.remove(); B.UI.toast('Profil silindi 🗑️');
              load();
              manageProfiles();
            };
          };
        });
      }

      /* Davet kodunu + oyun giriş linkini çocuğun cihazına gönder (iMessage/SMS, WhatsApp, yerel paylaşım) */
      function shareInvite(code) {
        code = code || ((B.AuthCloud && B.AuthCloud.current()) ? B.AuthCloud.inviteCode() : B.Cloud.getCode());
        if (!code) { B.UI.toast('Önce davet kodu oluştur.'); return; }
        // Oyun linki: yayındaki genel URL (localhost/dev ise sabit üsse yönlendir)
        const here = location.origin + location.pathname;
        const link = /localhost|127\.0\.0\.1|^file:/.test(location.href) ? 'https://bzkindamix.github.io/bokul/dist/bokul.html' : here;
        const msg = '🎮 BOKUL Eğitim Üssü\'ne davetlisin!\n\n' +
          '1) Oyunu aç:\n' + link + '\n\n' +
          '2) "🎮 Oyuncuyum" → "🎟️ Davet Kodu" bölümüne şu kodu gir:\n👉 ' + code + '\n\n' +
          'Hadi göreve başla, asker! 🚀';
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const ov = B.UI.overlay(
          '<div class="ov-big">📤</div><h2>Çocuğuna Gönder</h2>' +
          '<p class="ov-quote">Davet kodunu ve oyun bağlantısını çocuğunun cihazına ilet. O, linke dokunup kodu girecek — ailene bağlanacak.</p>' +
          '<div class="share-preview">' + esc(msg) + '</div>' +
          '<div class="share-btns">' +
            '<button class="btn share-main" id="sh-native">📤 Paylaş (Mesaj · WhatsApp · AirDrop…)</button>' +
            '<button class="btn btn-quiet" id="sh-sms">💬 ' + (isIOS ? 'iMessage / Mesaj' : 'SMS') + '</button>' +
            '<button class="btn btn-quiet" id="sh-wa">🟢 WhatsApp</button>' +
            '<button class="btn btn-quiet" id="sh-copy">📋 Metni Kopyala</button>' +
          '</div>',
          [{ label: 'Kapat', cls: 'btn-quiet', onClick: null }]);
        ov.querySelector('.overlay-btns .btn').onclick = () => ov.remove();
        const nb = ov.querySelector('#sh-native');
        if (navigator.share) nb.onclick = async () => { try { await navigator.share({ title: 'BOKUL daveti', text: msg }); } catch (e) {} };
        else nb.style.display = 'none';
        ov.querySelector('#sh-sms').onclick = () => { location.href = 'sms:' + (isIOS ? '&' : '?') + 'body=' + encodeURIComponent(msg); };
        ov.querySelector('#sh-wa').onclick = () => { window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank'); };
        ov.querySelector('#sh-copy').onclick = async () => { try { await navigator.clipboard.writeText(msg); B.UI.toast('📋 Mesaj kopyalandı'); } catch (e) {} };
      }

      function familyMenu() {
        const code = (B.AuthCloud && B.AuthCloud.current()) ? B.AuthCloud.inviteCode() : B.Cloud.getCode();
        const ov = B.UI.overlay('<div class="ov-big">🎟️</div><h2>Aile & Davet Kodu</h2>' +
          (code ? '<div class="acc-info"><b>Davet Kodun:</b> <span class="adm-code">' + code + '</span></div>' : '<p class="ov-quote">Henüz kod yok. E-posta ile giriş yaparsan otomatik gelir.</p>') +
          '<div class="acc-actions">' +
            (code ? '<button class="btn btn-quiet" id="fm-copy">📋 Kopyala</button><button class="btn btn-quiet" id="fm-share">📤 Paylaş</button>' : '') +
            (B.Cloud.getCode() ? '<button class="btn btn-quiet" id="fm-unlink">🔌 Bağlantıyı kaldır</button>' : '') +
          '</div>',
          [{ label: 'Kapat', cls: 'btn-quiet', onClick: null }]);
        const cp = ov.querySelector('#fm-copy');
        if (cp) cp.onclick = () => { try { navigator.clipboard.writeText(code); B.UI.toast('Kod kopyalandı'); } catch (e) {} };
        const sh = ov.querySelector('#fm-share');
        if (sh) sh.onclick = () => { ov.remove(); shareInvite(code); };
        const ul = ov.querySelector('#fm-unlink');
        if (ul) ul.onclick = () => { B.Cloud.setCode(''); ov.remove(); B.UI.toast('Bağlantı kaldırıldı'); };
      }

      function privacyMenu() {
        const info = B.Consent.info();
        const when = info && info.ts ? new Date(info.ts).toLocaleString('tr-TR') : null;
        const ov = B.UI.overlay('<div class="ov-big">🔒</div><h2>Gizlilik & KVKK</h2>' +
          '<div class="acc-info">' + (when ? '✅ Onay verildi: ' + when + ' (v' + (info.version || 1) + ')' : '⚠️ Henüz onay kaydı yok.') + '</div>' +
          '<div class="acc-actions">' +
            '<button class="btn btn-quiet" id="pv-kvkk">📄 KVKK Aydınlatma Metni</button>' +
            '<button class="btn btn-quiet" id="pv-terms">📜 Kullanıcı Sözleşmesi</button>' +
            (when ? '<button class="btn btn-danger" id="pv-wd">↩️ Rızayı geri çek</button>' : '') +
          '</div>',
          [{ label: 'Kapat', cls: 'btn-quiet', onClick: null }]);
        function viewLegal(which) {
          const L = B.Content.get('legal') || {};
          const v = B.UI.overlay('<div class="legal-view">' + (which === 'terms' ? L.terms : L.kvkk) + '</div>', [{ label: 'Kapat', cls: 'btn-quiet', onClick: null }]);
          const box = v.querySelector('.legal-view'); if (box) box.scrollTop = 0;
        }
        ov.querySelector('#pv-kvkk').onclick = () => viewLegal('kvkk');
        ov.querySelector('#pv-terms').onclick = () => viewLegal('terms');
        const wd = ov.querySelector('#pv-wd');
        if (wd) wd.onclick = () => { B.Consent.withdraw(); ov.remove(); B.UI.toast('Rıza geri çekildi. Sonraki kayıt yeniden onay ister.'); };
      }

      function appPrefs() {
        const on = B.Save.settings.get().sound !== false;
        const ov = B.UI.overlay('<div class="ov-big">🔊</div><h2>Uygulama Ayarları</h2>' +
          '<label class="adm-perm-row"><span class="adm-perm-lbl">🔊 Ses efektleri</span>' +
          '<span class="adm-switch"><input type="checkbox" id="ap-sound"' + (on ? ' checked' : '') + '><span class="adm-slider"></span></span></label>',
          [{ label: 'Kapat', cls: 'btn-quiet', onClick: null }]);
        ov.querySelector('#ap-sound').onchange = e => {
          const v = e.target.checked;
          B.Save.settings.set({ sound: v });
          if (B.Audio && B.Audio.setEnabled) B.Audio.setEnabled(v);
          B.UI.toast(v ? 'Ses açık 🔊' : 'Ses kapalı 🔇');
        };
      }

      function parentTour() {
        if (!B.Tour) return;
        const code = (B.AuthCloud && B.AuthCloud.current()) ? B.AuthCloud.inviteCode() : B.Cloud.getCode();
        const pName = (B.AuthCloud && B.AuthCloud.firstName) ? B.AuthCloud.firstName() : '';
        const selam = pName ? 'Hoş geldin Binbaşı ' + pName + '!' : 'Hoş geldin Komutan Baba!';
        B.Tour.run([
          { icon: '🧑‍✈️', title: selam, text: 'Ben Baba Komutan. Bu panel senin' + (pName ? ', Binbaşı ' + pName : '') + ' — çocuklarının nasıl öğrendiğini buradan takip edersin. Kısaca nasıl işlediğini anlatayım.' },
          { icon: '🔑', title: '1) Kaydoldun', text: 'Google ya da e-postanla giriş yaptın. Bu tek seferlik — bir daha sormaz, seni hep hatırlar.' },
          { icon: '🎟️', title: '2) Davet Kodun', text: 'Yukarıda "Davet Kodun" yazıyor' + (code ? ': <b>' + code + '</b>' : '') + '. Bu ailene özel koddur. "Kopyala" ile al.' },
          { icon: '📲', title: '3) Çocuğuna İlet', text: 'Çocuğunun cihazında oyunu aç → "🎮 Oyuncuyum → 🎟️ Davet Kodu" → bu kodu gir. Böylece çocuk ailene bağlanır ve tam sürüm açılır.' },
          { icon: '☁️', title: '4) Takip Et', text: '"☁️ Bulut (aile)" sekmesinden çocuklarının ilerlemesini görürsün. "🎁 İstekler" ile hedef ver, "🔒 İzinler" ile dersleri/bölümleri aç-kapa. Hadi başlayalım!' },
        ]);
      }

      function changePin() {
        const ov = B.UI.overlay('<div class="ov-big">🔑</div><h2>Yeni Ebeveyn PIN\'i</h2><input id="new-pin" type="password" class="name-input" placeholder="En az 4 hane"><div class="login-err" id="pin-err"></div>',
          [{ label: 'KAYDET', onClick: null }]);
        ov.querySelector('.overlay-btns .btn').onclick = () => {
          const res = B.Auth.setAdminPin(ov.querySelector('#new-pin').value);
          if (!res.ok) { ov.querySelector('#pin-err').textContent = res.err; return; }
          ov.remove(); B.UI.toast('PIN güncellendi 🔑');
        };
      }

      shell();
    },
    exit() {},
  });
})(window.BOKUL = window.BOKUL || {});
