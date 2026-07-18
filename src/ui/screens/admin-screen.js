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
    return d;
  }
  function xpNeeded(level) { const L = B.Content.get('rewards').levels; return L.base + (level - 1) * L.perLevel; }
  function esc(s) { return String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }

  B.UI.registerScreen('admin', {
    enter(root) {
      let tab = 'players';
      let source = B.Cloud.enabled() ? 'cloud' : 'local';
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
        const code = B.Cloud.getCode();
        const famRow = B.Cloud.configured()
          ? '<div class="adm-fam">' +
              (code
                ? '<div>☁️ Aile Kodu: <b class="adm-code">' + code + '</b> <button class="chip adm-copy">Kopyala</button>' +
                  '<div class="adm-fam-hint">Bu kodu çocukların cihazlarında giriş ekranı → "Aile Kodu" bölümüne bir kez gir.</div></div>'
                : '<button class="chip adm-gencode">☁️ Aile kodu oluştur</button>' +
                  '<span class="adm-fam-hint"> — çocukların cihazlarını bağlamak için</span>') +
            '</div>'
          : '';
        root.innerHTML =
          '<div class="admin-head">' +
            '<button class="chip admin-back">◀ Çıkış</button>' +
            '<b>👨‍👧 Ebeveyn Konsolu</b>' +
            '<button class="chip admin-pin">🔑 PIN</button>' +
          '</div>' +
          famRow +
          '<div class="admin-tabs">' +
            (B.Cloud.configured()
              ? '<button class="chip asrc" data-s="cloud">☁️ Bulut (aile)</button><button class="chip asrc" data-s="local">📱 Bu cihaz</button>' : '') +
            '<span class="adm-sep"></span>' +
            '<button class="chip atab" data-t="players">📊 Oyuncular</button>' +
            '<button class="chip atab" data-t="wishes">🎁 İstekler</button>' +
            '<button class="chip atab" data-t="ideas">💡 Fikirler</button>' +
            '<button class="chip adm-refresh">🔄</button>' +
          '</div>' +
          '<div class="admin-body"></div>';
        root.querySelector('.admin-back').onclick = () => B.UI.show('login');
        root.querySelector('.admin-pin').onclick = changePin;
        root.querySelector('.admin-refresh').onclick = load;
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
        if (source === 'cloud' && !B.Cloud.enabled()) { body.innerHTML = '<div class="wish-empty">Önce yukarıdan bir aile kodu oluştur.</div>'; return; }
        if (!players.length) {
          body.innerHTML = '<div class="wish-empty">' + (source === 'cloud'
            ? 'Bu aile kodunda henüz oyuncu yok. Çocukların cihazlarına aile kodunu girip biraz oynamalarını sağla.'
            : 'Bu cihazda kayıtlı oyuncu yok.') + '</div>';
          return;
        }
        if (tab === 'players') renderPlayers(body);
        else if (tab === 'wishes') renderWishes(body);
        else renderIdeas(body);
      }

      /* ---- 📊 Oyuncular ---- */
      function renderPlayers(body) {
        const lessons = B.Lesson.all();
        body.innerHTML = players.map(p => {
          const s = p.save, pl = s.player, st = s.stats || {};
          const acc = (st.correct + st.wrong) ? Math.round(st.correct / (st.correct + st.wrong) * 100) : 0;
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
              '<div><b>' + esc(pl.name) + '</b><div class="adm-rank">' + rank.icon + ' ' + rank.title + ' · Sv.' + pl.level +
                (pl.age ? ' · 🎂 ' + pl.age : '') + (pl.grade != null ? ' · 🎓 ' + (pl.grade === 0 ? 'okul öncesi' : pl.grade + '. sınıf') : '') + '</div></div></div>' +
            '<div class="hud-xpbar adm-xp"><i style="width:' + xpPct + '%"></i></div>' +
            '<div class="adm-stats"><span>💰 ' + (pl.coins || 0) + '</span><span>✅ ' + (st.correct || 0) + '</span><span>❌ ' + (st.wrong || 0) +
              '</span><span>🎯 %' + acc + '</span><span>🔥 en iyi ' + ((s.streaks && s.streaks.best) || 0) + '</span><span>📅 ' + last + '</span></div>' +
            '<div class="adm-lessons">' + lessonRows + '</div></div>';
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
