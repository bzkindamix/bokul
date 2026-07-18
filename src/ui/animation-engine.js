/* BOKUL — AnimationEngine
 * XP damlası, konfeti ve küçük şölenler. Olayları dinler, kimse çağırmaz. */
(function (B) {

  /* Ekranda bir noktadan XP barına uçan altın çip */
  function xpDrop(amount) {
    const bar = document.querySelector('.hud-xpbar');
    const chip = document.createElement('div');
    chip.className = 'fx-xp';
    chip.textContent = '+' + amount + ' XP';
    document.body.appendChild(chip);
    const startX = window.innerWidth / 2, startY = window.innerHeight * 0.45;
    chip.style.left = startX + 'px'; chip.style.top = startY + 'px';
    requestAnimationFrame(() => {
      let tx = startX, ty = 60;
      if (bar) { const r = bar.getBoundingClientRect(); tx = r.left + r.width / 2; ty = r.top; }
      chip.style.transform = 'translate(' + (tx - startX) + 'px,' + (ty - startY) + 'px) scale(.6)';
      chip.style.opacity = '0';
    });
    setTimeout(() => chip.remove(), 900);
  }

  /* Basit konfeti patlaması (level-up, boss zaferi) */
  function confetti(n) {
    const colors = ['#FF4FD8', '#FFD52E', '#52E88C', '#9D6BFF', '#3DF2D2', '#FF9F1C'];
    for (let i = 0; i < (n || 40); i++) {
      const p = document.createElement('div');
      p.className = 'fx-confetti';
      p.style.background = colors[i % colors.length];
      p.style.left = (35 + Math.random() * 30) + 'vw';
      p.style.setProperty('--dx', (Math.random() * 60 - 30) + 'vw');
      p.style.setProperty('--dr', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDelay = (Math.random() * 0.3) + 's';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 2200);
    }
  }

  /* Tüm ekranı bir an aydınlatan zafer parlaması */
  function flash() {
    const f = document.createElement('div');
    f.className = 'fx-flash';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 700);
  }

  /* Boss'a vurunca yukarı süzülen hasar sayısı (savaş hissi) */
  function damageFloat(amount, el) {
    const d = document.createElement('div');
    d.className = 'fx-dmg';
    d.textContent = '-' + amount;
    document.body.appendChild(d);
    const r = el ? el.getBoundingClientRect() : { left: window.innerWidth / 2 - 20, top: window.innerHeight * 0.28, width: 40 };
    d.style.left = (r.left + r.width / 2 + (Math.random() * 40 - 20)) + 'px';
    d.style.top = (r.top + 24) + 'px';
    requestAnimationFrame(() => { d.style.transform = 'translateY(-46px)'; d.style.opacity = '0'; });
    setTimeout(() => d.remove(), 850);
  }

  B.Anim = {
    xpDrop, confetti, flash, damageFloat,
    init() {
      B.Bus.on(B.Events.XP_GAINED, p => { if (p.source !== 'step') xpDrop(p.amount); });
      B.Bus.on(B.Events.LEVEL_UP, () => confetti(60));
      B.Bus.on(B.Events.BOSS_DEFEATED, () => { confetti(130); flash(); });
    },
  };
})(window.BOKUL = window.BOKUL || {});
