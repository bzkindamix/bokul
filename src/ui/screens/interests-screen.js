/* BOKUL — İlgi Alanları (kişiselleştirme)
 * Çocuğun hobileri, sevdiği müzik/oyuncak/yiyecek/spor vb. — İSTEĞE BAĞLI.
 * Amaç: oyunu kişiselleştirmek ve ebeveynin çocuğunun neleri sevdiğini görmesi
 * (dilek/hediye fikirleri). Aile-içi kullanım; ticari profilleme için değildir. */
(function (B) {
  const CATS = [
    { id: 'hobiler',    icon: '🎨', label: 'Hobilerim',                  opts: ['Resim', 'Müzik', 'Dans', 'Lego', 'Kitap okuma', 'Video oyunu', 'Bisiklet', 'Bilim deneyleri', 'El işi', 'Doğa gezisi'] },
    { id: 'muzik',      icon: '🎵', label: 'Sevdiğim müzik türleri',      opts: ['Pop', 'Rock', 'Rap', 'Çocuk şarkıları', 'Türkü', 'Klasik', 'Elektronik'] },
    { id: 'sanatcilar', icon: '🎤', label: 'Sevdiğim sanatçılar',         opts: [] },
    { id: 'oyuncaklar', icon: '🧸', label: 'Sevdiğim oyuncaklar',         opts: ['Lego', 'Bebek', 'Araba', 'Peluş', 'Puzzle', 'Robot', 'Kart oyunu', 'Top'] },
    { id: 'kiyafetler', icon: '👕', label: 'Sevdiğim kıyafetler',         opts: ['Tişört', 'Elbise', 'Spor giyim', 'Kapüşonlu', 'Etek', 'Kot', 'Kostüm'] },
    { id: 'aburcubur',  icon: '🍫', label: 'Sevdiğim abur cuburlar',      opts: ['Çikolata', 'Cips', 'Dondurma', 'Şeker', 'Bisküvi', 'Kek', 'Kraker'] },
    { id: 'saglikli',   icon: '🥗', label: 'Sevdiğim sağlıklı yiyecekler', opts: ['Meyve', 'Sebze', 'Yoğurt', 'Yumurta', 'Balık', 'Kuruyemiş', 'Salata'] },
    { id: 'sporlar',    icon: '⚽', label: 'Sevdiğim sporlar',            opts: ['Futbol', 'Basketbol', 'Voleybol', 'Yüzme', 'Jimnastik', 'Tenis', 'Koşu', 'Bisiklet'] },
    { id: 'icecekler',  icon: '🥤', label: 'Sevdiğim içecekler',          opts: ['Su', 'Süt', 'Meyve suyu', 'Ayran', 'Limonata', 'Smoothie'] },
  ];

  B.UI.registerScreen('interests', {
    enter(root, params) {
      const onboarding = !!params.onboarding;
      const hud = onboarding ? null : B.UI.buildHud(root, { backTo: 'evim' });
      this._hud = hud;
      const P = B.State.data.player;
      if (!P.profile) P.profile = {};
      const has = id => Array.isArray(P.profile[id]) ? P.profile[id] : (P.profile[id] = []);

      const title = document.createElement('div');
      title.className = 'map-title';
      title.textContent = '🎯 İlgi Alanların — ' + (P.name || 'asker') + ' (istediğini seç, geçebilirsin)';
      root.appendChild(title);

      const scroll = document.createElement('div');
      scroll.className = 'int-scroll';
      root.appendChild(scroll);

      CATS.forEach(cat => {
        const sel = has(cat.id);
        const box = document.createElement('div');
        box.className = 'int-cat';
        box.innerHTML = '<div class="int-catlabel">' + cat.icon + ' ' + cat.label + '</div><div class="int-chips"></div>' +
          '<div class="int-add"><input class="int-input" maxlength="20" placeholder="Başka bir şey ekle..."><button class="chip int-addbtn">+ Ekle</button></div>';
        const chips = box.querySelector('.int-chips');

        function drawChips() {
          chips.innerHTML = '';
          // önce hazır seçenekler
          cat.opts.forEach(o => {
            const on = sel.includes(o);
            const c = document.createElement('button');
            c.className = 'chip int-chip' + (on ? ' int-on' : '');
            c.textContent = o;
            c.onclick = () => { toggle(o); };
            chips.appendChild(c);
          });
          // kullanıcının eklediği özel değerler (opts'ta olmayanlar)
          sel.filter(v => !cat.opts.includes(v)).forEach(v => {
            const c = document.createElement('button');
            c.className = 'chip int-chip int-on int-custom';
            c.textContent = v + ' ✕';
            c.onclick = () => { toggle(v); };
            chips.appendChild(c);
          });
        }
        function toggle(v) {
          const i = sel.indexOf(v);
          if (i >= 0) sel.splice(i, 1); else sel.push(v);
          B.Save.saveSoon();
          drawChips();
        }
        drawChips();

        const input = box.querySelector('.int-input');
        const add = () => {
          const v = (input.value || '').trim();
          if (v && !sel.includes(v)) { sel.push(v); B.Save.saveSoon(); drawChips(); }
          input.value = '';
        };
        box.querySelector('.int-addbtn').onclick = add;
        input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });

        scroll.appendChild(box);
      });

      const done = document.createElement('button');
      done.className = 'btn btn-action int-done';
      done.textContent = onboarding ? 'DEVAM ▶' : '✔ KAYDET';
      done.onclick = () => {
        B.Save.saveNow();
        if (onboarding) {
          if (!B.State.data.meta.introSeen) B.UI.show('intro', {});
          else B.UI.show('home');
        } else B.UI.show('evim');
      };
      root.appendChild(done);
    },
    exit() { if (this._hud) this._hud.dispose(); },
  });
})(window.BOKUL = window.BOKUL || {});
