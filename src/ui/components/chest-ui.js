/* BOKUL — Sandık Açılış Töreni (CSS 3D)
 * Karartılmış sahne → sallanan 3D sandık → dokun → kapak açılır,
 * ışık patlar, ödül kartı dönerek gelir. */
(function (B) {
  const RARITY = {
    common:    { name: 'Yaygın',   color: '#A79BC8' },
    rare:      { name: 'Nadir',    color: '#6FA8FF' },
    epic:      { name: 'Epik',     color: '#9D6BFF' },
    legendary: { name: 'Efsanevi', color: '#3DF2D2' },
  };

  /* Kuyruktaki sandıkları sırayla aç; bitince onDone */
  function openCeremony(onDone) {
    if (!B.Chest.queue().length) { if (onDone) onDone(); return; }
    const meta = B.Chest.meta(B.Chest.queue()[0]);

    const ov = document.createElement('div');
    ov.className = 'overlay chest-overlay';
    ov.innerHTML =
      '<div class="chest-scene">' +
        '<div class="chest-title">' + meta.name + '</div>' +
        '<div class="chest3d chest-shake">' +
          '<div class="chest-lid"></div>' +
          '<div class="chest-body">' + meta.icon + '</div>' +
          '<div class="chest-glow"></div>' +
        '</div>' +
        '<div class="chest-hint">Açmak için dokun!</div>' +
      '</div>';
    document.body.appendChild(ov);

    const chestEl = ov.querySelector('.chest3d');
    let opened = false;

    chestEl.parentElement.onclick = () => {
      if (opened) return;
      opened = true;
      const { result } = B.Chest.openNext();
      B.Audio.play('chest');
      chestEl.classList.remove('chest-shake');
      chestEl.classList.add('chest-open');

      setTimeout(() => {
        B.Anim.confetti(40);
        let cardHtml;
        if (result.item) {
          const rar = RARITY[result.item.rarity] || RARITY.common;
          cardHtml =
            '<div class="loot-card" style="--rar:' + rar.color + '">' +
              '<div class="loot-rarity">' + rar.name.toUpperCase() + '</div>' +
              '<div class="loot-art">' + lootArt(result.item) + '</div>' +
              '<div class="loot-name">' + result.item.name + '</div>' +
            '</div>';
        } else {
          cardHtml =
            '<div class="loot-card" style="--rar:#FFD52E">' +
              '<div class="loot-rarity">XP PAKETİ</div>' +
              '<div class="loot-art loot-xp">+50 XP</div>' +
            '</div>';
        }
        const scene = ov.querySelector('.chest-scene');
        scene.insertAdjacentHTML('beforeend',
          cardHtml + '<div class="loot-coins">+' + result.coins + ' 💰 Altın</div>');
        ov.querySelector('.chest-hint').textContent = '';

        setTimeout(() => {
          const btn = document.createElement('button');
          btn.className = 'btn btn-action';
          btn.textContent = B.Chest.queue().length ? ('SIRADAKİ SANDIK (' + B.Chest.queue().length + ') ▶') : 'DEVAM ▶';
          btn.onclick = () => { ov.remove(); openCeremony(onDone); };
          scene.appendChild(btn);
        }, 700);
      }, 550);
    };
  }

  /* Ödül kartındaki görsel: avatar parçasıysa o parçayla mini avatar önizlemesi */
  function lootArt(item) {
    const a = B.Avatar.normalize(B.State.data.player.avatar);
    a.usePhoto = false;
    const C = B.Avatar.CATALOG;
    const bind = {
      hair:      () => { const p = C.hairs.find(x => x.cosmeticId === item.id); if (p) a.hair = p.id; },
      hairColor: () => { const p = C.hairColors.find(x => x.cosmeticId === item.id); if (p) a.hairColor = p.id; },
      eyes:      () => { const p = C.eyes.find(x => x.cosmeticId === item.id); if (p) a.eyes = p.id; },
      mouth:     () => { const p = C.mouths.find(x => x.cosmeticId === item.id); if (p) a.mouth = p.id; },
      acc:       () => { const p = C.accs.find(x => x.cosmeticId === item.id); if (p) a.acc = p.id; },
      ring:      () => { const p = C.rings.find(x => x.cosmeticId === item.id); if (p) a.ring = p.id; },
    };
    if (bind[item.type]) { bind[item.type](); return B.Avatar.svg(a); }
    if (item.type === 'title') return '<div class="loot-title-art">🎖️</div>';
    return '<div class="loot-title-art">✨</div>';
  }

  B.ChestUI = { openCeremony };
})(window.BOKUL = window.BOKUL || {});
