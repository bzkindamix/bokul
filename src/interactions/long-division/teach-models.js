/* BOKUL — Öğretim Modelleri (CPA: Somut → Görsel → Soyut)
 * teach harekâtlarının senaryo oynatıcısı. Senaryo adımları ders paketindeki
 * teachScripts'ten gelir; buradaki motor sadece oynatır.
 *
 * Adım türleri:
 *   { say: "..." }                        → Komutan konuşur, DEVAM ile geçilir
 *   { deal: { total, groups } }           → somut: kutuları takımlara paylaştır
 *   { pv:   { number, divisor } }         → görsel: basamak (onluk/birlik) tablosu
 *   { ask:  "...", expect: n }            → mini soru (küçük ped ile)
 *   { guided: { dividend, divisor } }     → soyut: koçlu ilk uzun bölme
 */
(function (B) {

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function run(container, scriptSteps, api) {
    let i = -1;
    let cleanup = null;

    function next() {
      if (cleanup) { cleanup(); cleanup = null; }
      i++;
      const s = scriptSteps[i];
      if (!s) return api.onComplete();
      container.innerHTML = '';

      if (s.say) return doSay(s);
      if (s.deal) return doDeal(s.deal);
      if (s.pv) return doPv(s.pv);
      if (s.ask) return doAsk(s);
      if (s.guided) return doGuided(s.guided);
      next(); // bilinmeyen adım atlanır
    }

    /* --- Komutan anlatımı --- */
    function doSay(s) {
      api.say(s.say);
      const btn = el('button', 'btn btn-action teach-next', 'DEVAM ▶');
      btn.onclick = () => { B.Audio.play('tick'); next(); };
      container.appendChild(el('div', 'teach-stage teach-say', '🫡'));
      container.appendChild(btn);
    }

    /* --- SOMUT: kutu paylaştırma ---
     * Kural: bir takıma, en az kutusu olan takımdan fazlası verilemez (eşit paylaşım öğretisi) */
    function doDeal(cfg) {
      api.say(B.Dialogue.pick('teach.deal.intro', { total: cfg.total, groups: cfg.groups }) ||
              cfg.total + ' kutuyu ' + cfg.groups + ' takıma EŞİT paylaştır. Takımlara dokun!');
      const stage = el('div', 'teach-stage');
      const supply = el('div', 'deal-supply');
      let left = cfg.total;
      const counts = new Array(cfg.groups).fill(0);
      const supplyLabel = el('div', 'deal-count', '📦 × ' + left);
      supply.appendChild(supplyLabel);
      stage.appendChild(supply);

      const groupsRow = el('div', 'deal-groups');
      const groupEls = [];
      for (let g = 0; g < cfg.groups; g++) {
        const box = el('div', 'deal-group');
        box.appendChild(el('div', 'deal-group-title', 'Takım ' + (g + 1)));
        const crates = el('div', 'deal-crates');
        box.appendChild(crates);
        box.onclick = () => {
          if (!left) return;
          const min = Math.min(...counts);
          if (counts[g] > min) { // eşitlik bozuluyor → nazik uyarı
            B.Audio.play('wrong');
            api.say(B.Dialogue.pick('teach.deal.unfair') || 'Eşit paylaştır Komutan — önce az olan takıma!');
            return;
          }
          counts[g]++; left--;
          B.Audio.play('tick');
          crates.appendChild(el('span', 'deal-crate', '📦'));
          supplyLabel.textContent = '📦 × ' + left;
          if (!left) {
            B.Audio.play('correct');
            api.say(B.Dialogue.pick('teach.deal.done', { each: counts[0] }) ||
                    'Paylaştırma tamam! Her takıma ' + counts[0] + ' kutu düştü. İşte BÖLME budur.');
            setTimeout(next, 1600);
          }
        };
        groupEls.push(box);
        groupsRow.appendChild(box);
      }
      stage.appendChild(groupsRow);
      container.appendChild(stage);
    }

    /* --- GÖRSEL: basamak tablosu --- */
    function doPv(cfg) {
      const tens = Math.floor(cfg.number / 10), ones = cfg.number % 10;
      const stage = el('div', 'teach-stage');
      const table = el('div', 'pv-table');
      const colT = el('div', 'pv-col');
      colT.appendChild(el('div', 'pv-title', 'ONLUKLAR'));
      const tRow = el('div', 'pv-blocks');
      for (let i = 0; i < tens; i++) tRow.appendChild(el('span', 'pv-ten', '10'));
      colT.appendChild(tRow);
      const colO = el('div', 'pv-col');
      colO.appendChild(el('div', 'pv-title', 'BİRLİKLER'));
      const oRow = el('div', 'pv-blocks');
      for (let i = 0; i < ones; i++) oRow.appendChild(el('span', 'pv-one', '1'));
      colO.appendChild(oRow);
      table.appendChild(colT); table.appendChild(colO);
      stage.appendChild(el('div', 'pv-number', cfg.number + ' ÷ ' + cfg.divisor));
      stage.appendChild(table);
      container.appendChild(stage);
      const btn = el('button', 'btn btn-action teach-next', 'DEVAM ▶');
      btn.onclick = () => { B.Audio.play('tick'); next(); };
      container.appendChild(btn);
    }

    /* --- Mini soru (küçük ped) --- */
    function doAsk(s) {
      api.say(s.ask);
      const stage = el('div', 'teach-stage');
      const display = el('div', 'ask-display', '?');
      stage.appendChild(display);
      const pad = el('div', 'numpad numpad-mini');
      let buf = '';
      '1234567890'.split('').forEach(k => {
        const b = el('button', 'key', k);
        b.onclick = () => { B.Audio.play('tick'); if (buf.length < 4) { buf += k; display.textContent = buf; } };
        pad.appendChild(b);
      });
      const back = el('button', 'key key-back', '⌫');
      back.onclick = () => { buf = buf.slice(0, -1); display.textContent = buf || '?'; };
      const ok = el('button', 'key key-go', '✔');
      ok.onclick = () => {
        if (!buf) return;
        if (Number(buf) === s.expect) {
          B.Audio.play('correct');
          api.say(B.Dialogue.pick('correct'));
          setTimeout(next, 1100);
        } else {
          B.Audio.play('wrong');
          buf = ''; display.textContent = '?';
          api.say(B.Dialogue.pick('wrong.soft'));
        }
      };
      pad.appendChild(back); pad.appendChild(ok);
      stage.appendChild(pad);
      container.appendChild(stage);
    }

    /* --- SOYUT: koçlu ilk uzun bölme --- */
    function doGuided(cfg) {
      const q = {
        dividend: cfg.dividend, divisor: cfg.divisor,
        plan: B.LongDivision.computePlan(cfg.dividend, cfg.divisor),
        _type: 'long-division',
      };
      const view = B.LongDivisionView.create(container, q, {
        coach: true,
        say: api.say,
        onAnswer(step, correct, attempt) {
          B.Bus.emit(B.Events.STEP_ANSWERED, { stepType: step.type, correct, attempt, value: null });
        },
        onComplete() {
          api.say(B.Dialogue.pick('teach.guided.done') || 'İlk uzun bölmeni bitirdin Komutan! Artık hazırsın.');
          setTimeout(next, 1600);
        },
      });
      cleanup = () => view.destroy();
    }

    next();
    return { destroy() { if (cleanup) cleanup(); container.innerHTML = ''; } };
  }

  B.TeachModels = { run };
})(window.BOKUL = window.BOKUL || {});
