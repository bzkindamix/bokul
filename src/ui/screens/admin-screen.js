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
    const d = { wishes: {}, ideas: {} };
    (save.wishes || []).forEach(w => { d.wishes[w.id] = { goal: w.goal || null, note: w.note || '', status: w.status }; });
    (save.ideas || []).forEach(i => { d.ideas[i.id] = { status: i.status, note: i.note || '' }; });
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
      root.classList.add('admin-root');

      /* Bir oyuncunun değişikliğini uygun yere yaz */
      async function persist(player) {
        if (player.source === 'cloud') await B.Cloud.writeDirectives(player.key, buildDirectives(player.save));
        else writeLocal(player.key, player.save);
      }

      function findPlayer(key) { return players.find(p => p.key === key); }

      async function load() {
        const body = root.querySelector('.admin-body');
        if (body) body.innerHTML = '<div class="wish-empty">Yükleniyor…</div>';
        if (source === 'cloud') {
          const list = await B.Cloud.listPlayers();
          players = list.map(p => Object.assign({ source: 'cloud' }, p));
        } else {
          players = localPlayers();
        }
        renderBody();
      }

      function shell() {
        // Ebeveynin adı (Google profili ya da kayıt formundan) — Baba "Binbaşı X" der
        const pName = (B.AuthCloud && B.AuthCloud.firstName) ? B.AuthCloud.firstName() : '';
        // Davet kodu öncelikle e-posta hesabından (hesaba bağlı, hep aynı)
        const emailCode = (B.AuthCloud && B.AuthCloud.current()) ? B.AuthCloud.inviteCode() : '';
        if (emailCode && B.Cloud.getCode() !== emailCode) B.Cloud.setCode(emailCode);
        const code = emailCode || B.Cloud.getCode();
        const famRow = B.Cloud.configured()
          ? '<div class="adm-fam">' +
              (code
                ? '<div>🎟️ Davet Kodun: <b class="adm-code">' + code + '</b> <button class="chip adm-copy">Kopyala</button>' +
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
          '<div class="admin-tabs">' +
            (B.Cloud.configured()
              ? '<button class="chip asrc" data-s="cloud">☁️ Bulut (aile)</button><button class="chip asrc" data-s="local">📱 Bu cihaz</button>' : '') +
            '<span class="adm-sep"></span>' +
            '<button class="chip atab" data-t="players">📊 Oyuncular</button>' +
            '<button class="chip atab" data-t="perms">🔒 İzinler</button>' +
            '<button class="chip atab" data-t="wishes">🎁 İstekler</button>' +
            '<button class="chip atab" data-t="ideas">💡 Fikirler</button>' +
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
        if (source === 'cloud' && !B.Cloud.enabled()) { body.innerHTML = '<div class="wish-empty">Önce yukarıdan bir aile kodu oluştur.</div>'; return; }
        if (!players.length) {
          body.innerHTML = '<div class="wish-empty">' + (source === 'cloud'
            ? 'Bu aile kodunda henüz oyuncu yok. Çocukların cihazlarına aile kodunu girip biraz oynamalarını sağla.'
            : 'Bu cihazda kayıtlı oyuncu yok.') + '</div>';
          return;
        }
        if (tab === 'players') renderPlayers(body);
        else if (tab === 'perms') renderPerms(body);
        else if (tab === 'wishes') renderWishes(body);
        else if (tab === 'ideas') renderIdeas(body);
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
        body.innerHTML =
          '<div class="adm-hint">Kapatılan ders veya bölüm çocuğun ekranında 🔒 kilitli görünür. Bulut modunda değişiklik çocuğun cihazına bir sonraki açılışta yansır.</div>' +
          players.map(p => {
            B.Perms.ensure(p.save);
            const lessonRows = lessons.map(l => swRow('L', p.key, l.id, l.icon + ' ' + esc(l.title), B.Perms.lesson(l.id, p.save))).join('');
            const featRows = B.Perms.FEATURES.map(f => swRow('F', p.key, f.key, f.icon + ' ' + f.name, B.Perms.feature(f.key, p.save))).join('');
            return '<div class="adm-card"><div class="adm-p-head"><span class="adm-av">' + B.Avatar.el(p.save.player.avatar) + '</span><b>' + esc(p.save.player.name) + '</b></div>' +
              '<div class="adm-perm-h">📚 Dersler (Cepheler)</div>' + lessonRows +
              '<div class="adm-perm-h">🎮 Oyun Bölümleri</div>' + featRows + '</div>';
          }).join('');
        body.querySelectorAll('.adm-perm').forEach(inp => {
          inp.onchange = async () => {
            const p = findPlayer(inp.dataset.key); if (!p) return;
            const on = inp.checked;
            if (inp.dataset.kind === 'L') B.Perms.setLesson(inp.dataset.id, on, p.save);
            else B.Perms.setFeature(inp.dataset.id, on, p.save);
            await persist(p);
            B.UI.toast(on ? 'Açıldı ✓' : 'Kapatıldı 🔒');
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
        if (sh) sh.onclick = async () => {
          const txt = 'BOKUL davet kodum: ' + code + ' — Giriş ekranında "🎮 Oyuncuyum → 🎟️ Davet Kodu" ile gir.';
          try { if (navigator.share) await navigator.share({ title: 'BOKUL Davet Kodu', text: txt }); else { navigator.clipboard.writeText(txt); B.UI.toast('Panoya kopyalandı'); } } catch (e) {}
        };
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
