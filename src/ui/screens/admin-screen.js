/* BOKUL — Ebeveyn Konsolu (Admin)
 * Tüm oyuncuların gelişimini gösterir; dilekleri (gerçek ödül istekleri) ve
 * oyun fikirlerini yönetir. Ebeveyn PIN'i ile korunur (bkz. login parent).
 * Tüm veriler cihazda; her oyuncunun kendi kaydından okunur/yazılır. */
(function (B) {

  function allPlayers() {
    return B.Auth.users().map(key => {
      let save = null;
      try { save = JSON.parse(localStorage.getItem('bokul.save.' + key)); } catch (e) {}
      return { key, name: B.Auth.displayName(key), save };
    }).filter(p => p.save);
  }
  function writeSave(key, save) {
    try { localStorage.setItem('bokul.save.' + key, JSON.stringify(save)); } catch (e) {}
    if (B.Auth.current() === key) B.State.data = save; // aktif oyuncuysa belleği de güncelle
  }
  function xpNeeded(level) { const L = B.Content.get('rewards').levels; return L.base + (level - 1) * L.perLevel; }
  function esc(s) { return String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }

  B.UI.registerScreen('admin', {
    enter(root) {
      let tab = 'players';
      root.classList.add('admin-root');

      function shell() {
        root.innerHTML =
          '<div class="admin-head">' +
            '<button class="chip admin-back">◀ Çıkış</button>' +
            '<b>👨‍👧 Ebeveyn Konsolu</b>' +
            '<button class="chip admin-pin">🔑 PIN değiştir</button>' +
          '</div>' +
          '<div class="admin-tabs">' +
            '<button class="chip atab" data-t="players">📊 Oyuncular</button>' +
            '<button class="chip atab" data-t="wishes">🎁 İstekler</button>' +
            '<button class="chip atab" data-t="ideas">💡 Fikirler</button>' +
          '</div>' +
          '<div class="admin-body"></div>';
        root.querySelector('.admin-back').onclick = () => B.UI.show('login');
        root.querySelector('.admin-pin').onclick = changePin;
        root.querySelectorAll('.atab').forEach(b => b.onclick = () => {
          tab = b.dataset.t;
          root.querySelectorAll('.atab').forEach(x => x.classList.toggle('tab-on', x === b));
          renderBody();
        });
        root.querySelector('.atab[data-t="' + tab + '"]').classList.add('tab-on');
        renderBody();
      }

      function renderBody() {
        const body = root.querySelector('.admin-body');
        const players = allPlayers();
        if (!players.length) { body.innerHTML = '<div class="wish-empty">Henüz kayıtlı oyuncu yok.</div>'; return; }
        if (tab === 'players') renderPlayers(body, players);
        else if (tab === 'wishes') renderWishes(body, players);
        else renderIdeas(body, players);
      }

      /* ---- 📊 Oyuncular ---- */
      function renderPlayers(body, players) {
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
            return '<div class="adm-lesson"><span>' + les.icon + ' ' + esc(les.title) + '</span>' +
              '<span>⭐ ' + earned + '/' + max + ' · 🏰 ' + bd + '/' + bt + '</span></div>';
          }).join('');
          const last = s.meta && s.meta.lastPlayedAt ? new Date(s.meta.lastPlayedAt).toLocaleDateString('tr-TR') : '—';
          return '<div class="adm-card">' +
            '<div class="adm-p-head">' +
              '<span class="adm-av">' + B.Avatar.el(pl.avatar) + '</span>' +
              '<div><b>' + esc(pl.name) + '</b><div class="adm-rank">' + rank.icon + ' ' + rank.title + ' · Sv.' + pl.level +
                (pl.age ? ' · 🎂 ' + pl.age : '') + (pl.grade != null ? ' · 🎓 ' + (pl.grade === 0 ? 'okul öncesi' : pl.grade + '. sınıf') : '') + '</div></div>' +
            '</div>' +
            '<div class="hud-xpbar adm-xp"><i style="width:' + xpPct + '%"></i></div>' +
            '<div class="adm-stats">' +
              '<span>💰 ' + (pl.coins || 0) + '</span>' +
              '<span>✅ ' + (st.correct || 0) + '</span>' +
              '<span>❌ ' + (st.wrong || 0) + '</span>' +
              '<span>🎯 %' + acc + '</span>' +
              '<span>🔥 en iyi ' + ((s.streaks && s.streaks.best) || 0) + '</span>' +
              '<span>📅 ' + last + '</span>' +
            '</div>' +
            '<div class="adm-lessons">' + lessonRows + '</div>' +
          '</div>';
        }).join('');
      }

      /* ---- 🎁 İstekler ---- */
      function renderWishes(body, players) {
        const metricOpts = Object.keys(B.Wish.METRICS).map(m =>
          '<option value="' + m + '">' + B.Wish.METRICS[m].icon + ' ' + B.Wish.METRICS[m].name + '</option>').join('');
        let any = false;
        body.innerHTML = players.map(p => {
          const wishes = (p.save.wishes || []);
          if (!wishes.length) return '';
          any = true;
          return '<div class="adm-card"><div class="adm-p-head"><span class="adm-av">' + B.Avatar.el(p.save.player.avatar) +
            '</span><b>' + esc(p.save.player.name) + '</b></div>' +
            wishes.slice().reverse().map(w => {
              const pr = w.goal ? B.Wish.progress(p.save, w) : null;
              const progHtml = pr ? '<div class="quest-bar"><i style="width:' + pr.pct + '%"></i><span class="quest-count">' + pr.cur + '/' + pr.target + '</span></div>' : '';
              const statusBadge = { pending: '⏳ Yeni', assigned: '🎯 Hedefli', earned: '🎉 Hak etti!', granted: '✅ Verildi' }[w.status] || w.status;
              return '<div class="adm-wish" data-key="' + p.key + '" data-id="' + w.id + '">' +
                '<div class="wish-top"><b>' + esc(w.text) + '</b><span class="wish-badge">' + statusBadge + '</span></div>' +
                progHtml +
                '<div class="adm-wish-ctl">' +
                  '<select class="adm-metric">' + metricOpts + '</select>' +
                  '<input class="adm-target" type="number" min="1" value="' + (w.goal ? w.goal.target : 10) + '" placeholder="hedef">' +
                  '<button class="chip adm-assign">🎯 Hedef ata</button>' +
                  '<button class="chip adm-grant">✅ Ödülü verdim</button>' +
                '</div>' +
                '<input class="adm-note name-input" placeholder="Çocuğa not (örn: bunu bitirince alırız)" value="' + esc(w.note) + '">' +
              '</div>';
            }).join('') + '</div>';
        }).join('');
        if (!any) body.innerHTML = '<div class="wish-empty">Henüz istek yok. Çocuklar Dilek Kutusu\'ndan ekleyebilir.</div>';

        body.querySelectorAll('.adm-wish').forEach(el => {
          const key = el.dataset.key, id = el.dataset.id;
          const metricSel = el.querySelector('.adm-metric');
          const wish = allPlayers().find(p => p.key === key).save.wishes.find(w => w.id === id);
          if (wish && wish.goal) metricSel.value = wish.goal.metric;
          el.querySelector('.adm-assign').onclick = () => {
            const players2 = allPlayers(); const p = players2.find(x => x.key === key);
            const w = p.save.wishes.find(w => w.id === id);
            w.goal = { metric: metricSel.value, target: Math.max(1, parseInt(el.querySelector('.adm-target').value) || 10) };
            if (w.status === 'pending' || w.status === 'assigned') {
              w.status = B.Wish.value(p.save, w.goal.metric) >= w.goal.target ? 'earned' : 'assigned';
            }
            w.note = el.querySelector('.adm-note').value;
            writeSave(key, p.save); renderBody();
          };
          el.querySelector('.adm-grant').onclick = () => {
            const players2 = allPlayers(); const p = players2.find(x => x.key === key);
            const w = p.save.wishes.find(w => w.id === id);
            w.status = 'granted'; w.note = el.querySelector('.adm-note').value;
            writeSave(key, p.save); renderBody();
          };
        });
      }

      /* ---- 💡 Fikirler ---- */
      function renderIdeas(body, players) {
        const statusOpts = { new: 'Yeni', seen: 'Gördüm', planned: 'Yapılacak', done: 'Eklendi' };
        let any = false;
        body.innerHTML = players.map(p => {
          const ideas = (p.save.ideas || []);
          if (!ideas.length) return '';
          any = true;
          return '<div class="adm-card"><div class="adm-p-head"><span class="adm-av">' + B.Avatar.el(p.save.player.avatar) +
            '</span><b>' + esc(p.save.player.name) + '</b></div>' +
            ideas.slice().reverse().map(i => {
              const opts = Object.keys(statusOpts).map(k => '<option value="' + k + '"' + (i.status === k ? ' selected' : '') + '>' + statusOpts[k] + '</option>').join('');
              return '<div class="adm-wish" data-key="' + p.key + '" data-id="' + i.id + '">' +
                '<div class="wish-top"><b>💡 ' + esc(i.text) + '</b></div>' +
                '<div class="adm-wish-ctl"><select class="adm-istatus">' + opts + '</select>' +
                '<button class="chip adm-isave">💾 Kaydet</button></div>' +
                '<input class="adm-inote name-input" placeholder="Çocuğa not" value="' + esc(i.note) + '"></div>';
            }).join('') + '</div>';
        }).join('');
        if (!any) body.innerHTML = '<div class="wish-empty">Henüz fikir yok. Çocuklar Dilek Kutusu\'ndan gönderebilir.</div>';

        body.querySelectorAll('.adm-wish').forEach(el => {
          el.querySelector('.adm-isave').onclick = () => {
            const key = el.dataset.key, id = el.dataset.id;
            const p = allPlayers().find(x => x.key === key);
            const idea = p.save.ideas.find(x => x.id === id);
            idea.status = el.querySelector('.adm-istatus').value;
            idea.note = el.querySelector('.adm-inote').value;
            writeSave(key, p.save);
            B.UI.toast('Kaydedildi 💾');
          };
        });
      }

      function changePin() {
        const ov = B.UI.overlay('<div class="ov-big">🔑</div><h2>Yeni Ebeveyn PIN\'i</h2>' +
          '<input id="new-pin" type="password" class="name-input" placeholder="En az 4 hane">' +
          '<div class="login-err" id="pin-err"></div>',
          [{ label: 'KAYDET', onClick: null }]);
        const btn = ov.querySelector('.overlay-btns .btn');
        btn.onclick = () => {
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
