/* BOKUL — Dilek Kutusu (çocuk tarafı)
 * Çocuk gerçek ödül ister (🎁) veya oyuna fikir verir (💡).
 * İstek durumunu görür: bekliyor / hedef verildi / HAK EDİLDİ. */
(function (B) {
  const WISH_STATUS = {
    pending:  { label: '⏳ Baba görecek', cls: '' },
    assigned: { label: '🎯 Hedef verildi', cls: 'wish-assigned' },
    earned:   { label: '🎉 HAK ETTİN!',   cls: 'wish-earned' },
    granted:  { label: '✅ Ödül verildi',  cls: 'wish-granted' },
  };
  const IDEA_STATUS = {
    new:       '💡 Yeni',
    sent:      '📤 Gönderiliyor…',
    delivered: '🚀 Geliştiricide!',
    queued:    '⏳ Çevrimdışı — bağlanınca gider',
    seen:      '👀 Görüldü',
    planned:   '🛠️ Yapılacak',
    done:      '✅ Eklendi',
  };

  B.UI.registerScreen('wishes', {
    enter(root) {
      const hud = B.UI.buildHud(root, { backTo: 'home' });
      this._hud = hud;

      const wrap = document.createElement('div');
      wrap.className = 'wishes-wrap';
      root.appendChild(wrap);

      function render() {
        wrap.innerHTML =
          '<div class="wish-col">' +
            '<h3 class="wish-h">🎁 Ödül İsteklerim</h3>' +
            '<p class="wish-hint">Gerçek hayattan ne istersin? (oyuncak, kitap, gezme...) Baba görecek. Verdiği görevleri bitirince ödülü senin!</p>' +
            '<div class="wish-add"><input id="wish-input" class="name-input" maxlength="60" placeholder="Örn: Lego uzay seti"><button class="btn btn-action" id="wish-go">İSTE</button></div>' +
            '<div id="wish-list"></div>' +
          '</div>' +
          '<div class="wish-col">' +
            '<h3 class="wish-h">💡 Oyun Fikirlerim</h3>' +
            '<p class="wish-hint">Oyuna ne eklensin istersin? Fikrini yaz — <b>doğrudan oyunu yapan geliştiricilere</b> gider! 🚀</p>' +
            '<div class="wish-add"><input id="idea-input" class="name-input" maxlength="80" placeholder="Örn: Uzay cephesi olsun"><button class="btn btn-action" id="idea-go">GÖNDER</button></div>' +
            '<div id="idea-list"></div>' +
          '</div>';

        // Ödül istekleri
        const wl = wrap.querySelector('#wish-list');
        const wishes = B.Wish.myWishes();
        wl.innerHTML = wishes.length ? '' : '<div class="wish-empty">Henüz istek yok. Yukarıdan ekle!</div>';
        wishes.slice().reverse().forEach(w => {
          const st = WISH_STATUS[w.status] || WISH_STATUS.pending;
          let prog = '';
          if (w.goal) {
            const pr = B.Wish.progress(B.State.data, w);
            const m = B.Wish.METRICS[w.goal.metric];
            prog = '<div class="wish-goal">' + m.icon + ' ' + m.name + ': ' + pr.cur + '/' + pr.target +
                   '<div class="quest-bar"><i style="width:' + pr.pct + '%"></i></div></div>';
          }
          wl.insertAdjacentHTML('beforeend',
            '<div class="wish-card ' + st.cls + '"><div class="wish-top"><b>' + w.text + '</b>' +
            '<span class="wish-badge">' + st.label + '</span></div>' + prog +
            (w.note ? '<div class="wish-note">📝 Baba: ' + w.note + '</div>' : '') + '</div>');
        });

        // Fikirler
        const il = wrap.querySelector('#idea-list');
        const ideas = B.Wish.myIdeas();
        il.innerHTML = ideas.length ? '' : '<div class="wish-empty">Henüz fikir yok. Hayal et!</div>';
        ideas.slice().reverse().forEach(i => {
          il.insertAdjacentHTML('beforeend',
            '<div class="wish-card"><div class="wish-top"><b>' + i.text + '</b>' +
            '<span class="wish-badge">' + (IDEA_STATUS[i.status] || IDEA_STATUS.new) + '</span></div></div>');
        });

        wrap.querySelector('#wish-go').onclick = () => {
          const el = wrap.querySelector('#wish-input');
          if (el.value.trim()) { B.Wish.addWish(el.value); B.Audio.play('chest'); render(); }
        };
        wrap.querySelector('#idea-go').onclick = () => {
          const el = wrap.querySelector('#idea-input');
          const v = el.value.trim();
          if (!v) return;
          B.Audio.play('correct');
          Promise.resolve(B.Wish.addIdea(v)).then(r => {
            B.UI.toast(r && r.sent ? '🚀 Fikrin geliştiricilere ulaştı! Teşekkürler!' : '💡 Fikrin kaydedildi — bağlanınca geliştiricilere gidecek.');
            render();
          });
          el.value = ''; render();
        };
      }
      render();
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
