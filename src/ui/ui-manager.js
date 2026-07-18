/* BOKUL — UIManager
 * Ekran yönlendirici + ortak HUD + tören katmanları (overlay/toast).
 * Ekranlar registerScreen ile kaydolur: { enter(root, params), exit() } */
(function (B) {
  const screens = new Map();
  let current = null;
  let currentName = '';

  B.UI = {
    registerScreen(name, impl) { screens.set(name, impl); },

    show(name, params) {
      const next = screens.get(name);
      if (!next) { console.error('[BOKUL] Kayıtsız ekran:', name); return; }
      if (current && current.exit) current.exit();
      const app = document.getElementById('app');
      app.innerHTML = '';
      const root = document.createElement('div');
      root.className = 'screen screen-' + name;
      app.appendChild(root);
      current = next; currentName = name;
      next.enter(root, params || {});
      B.Bus.emit(B.Events.SCREEN_CHANGED, { name });
    },

    currentScreen() { return currentName; },

    /* ---- Ortak HUD (üst şerit) ---- */
    buildHud(root, opts) {
      opts = opts || {};
      const p = B.State.data.player;
      const rank = B.Reward.rankFor(p.level);
      const hud = document.createElement('div');
      hud.className = 'hud';
      hud.innerHTML =
        (opts.backTo ? '<button class="chip hud-back">◀</button>' : '<div class="hud-avatar">' + B.Avatar.el(p.avatar) + '</div>') +
        '<div class="chip hud-rank">' + rank.icon + ' ' + rank.title + '</div>' +
        '<div class="hud-xpbar"><span class="hud-lvl">' + p.level + '</span><i></i></div>' +
        '<div class="chip hud-coins">💰 ' + (p.coins || 0) + '</div>' +
        (opts.extra || '') +
        '<button class="chip hud-sound">' + (B.Audio.isEnabled() ? '🔊' : '🔇') + '</button>';
      root.appendChild(hud);

      const fill = hud.querySelector('.hud-xpbar i');
      function refresh() {
        const pl = B.State.data.player;
        fill.style.width = Math.min(100, Math.round(pl.xp / B.Reward.xpNeeded() * 100)) + '%';
        hud.querySelector('.hud-lvl').textContent = pl.level;
        const r = B.Reward.rankFor(pl.level);
        hud.querySelector('.hud-rank').textContent = r.icon + ' ' + r.title;
      }
      refresh();
      const offXp = B.Bus.on(B.Events.XP_GAINED, refresh);
      const offLvl = B.Bus.on(B.Events.LEVEL_UP, refresh);
      const offCoin = B.Bus.on(B.Events.COINS_CHANGED, p2 => {
        const c = hud.querySelector('.hud-coins');
        if (c) c.textContent = '💰 ' + p2.total;
      });

      if (opts.backTo) hud.querySelector('.hud-back').onclick = () => B.UI.show(opts.backTo, opts.backParams);
      hud.querySelector('.hud-sound').onclick = (e) => {
        const on = !B.Audio.isEnabled();
        B.Audio.setEnabled(on);
        B.Save.settings.set({ sound: on });
        e.target.textContent = on ? '🔊' : '🔇';
      };
      return { refresh, dispose() { offXp(); offLvl(); offCoin(); } };
    },

    /* ---- Tören katmanı: level-up, zafer, geri çekilme ---- */
    overlay(html, buttons) {
      const ov = document.createElement('div');
      ov.className = 'overlay';
      const card = document.createElement('div');
      card.className = 'overlay-card';
      card.innerHTML = html;
      const btnRow = document.createElement('div');
      btnRow.className = 'overlay-btns';
      (buttons || []).forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'btn ' + (b.cls || 'btn-action');
        btn.textContent = b.label;
        // ÖNEMLİ: önce onClick, sonra kaldır — onClick overlay içindeki
        // form alanlarını (ör. isim inputu) okuyabilmeli
        btn.onclick = () => { if (b.onClick) b.onClick(); ov.remove(); };
        btnRow.appendChild(btn);
      });
      card.appendChild(btnRow);
      ov.appendChild(card);
      document.body.appendChild(ov);
      return ov;
    },

    toast(text) {
      const t = document.createElement('div');
      t.className = 'toast';
      t.textContent = text;
      document.body.appendChild(t);
      setTimeout(() => t.classList.add('toast-show'), 20);
      setTimeout(() => { t.classList.remove('toast-show'); setTimeout(() => t.remove(), 400); }, 2600);
    },

    /* Level-up törenini merkezi bağla */
    init() {
      B.Bus.on(B.Events.LEVEL_UP, p => {
        const rankHtml = p.newRank
          ? '<div class="ov-rank">' + p.newRank.icon + '</div><div class="ov-ranktitle">Yeni rütbe: ' + p.newRank.title + '!</div>'
          : '';
        B.UI.overlay(
          '<div class="ov-big">⬆️</div><h2>LEVEL ' + p.newLevel + '!</h2>' + rankHtml +
          '<p class="ov-quote">' + (B.Dialogue.pick('levelup') || '') + '</p>',
          [{ label: 'DEVAM ▶' }]
        );
      });
    },
  };
})(window.BOKUL = window.BOKUL || {});
