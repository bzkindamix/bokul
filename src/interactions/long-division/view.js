/* BOKUL — Uzun Bölme Tahtası (görünüm)
 * Türk okul notasyonu: bölünen solda, dikey çizgi, bölen sağ üstte,
 * bölüm bölenin altında. Adımlar logic.js planından sürülür.
 *
 * API:
 *   const ctl = B.LongDivisionView.create(container, question, {
 *     prefilled: Set<stepType>,      // guided: bu adımları Komutan yapar
 *     coach: bool,                    // teach: her adımda yönerge repliği
 *     problemText: string|null,       // challenge: problem metni
 *     onAnswer(step, correct, attempt),
 *     onComplete({ mistakes }),
 *     say(text),                      // Komutan balonuna yaz
 *   });
 */
(function (B) {

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function create(container, q, opts) {
    opts = opts || {};
    const plan = q.plan;
    const D = String(q.dividend).length;
    const steps = plan.steps;

    let stepIdx = 0;
    let attempt = 0;
    let mistakes = 0;
    let buffer = '';
    let selectCount = 0;   // select adımında seçili basamak sayısı
    let destroyed = false;

    /* ---------- DOM iskeleti ---------- */
    container.innerHTML = '';
    const root = el('div', 'ld-root');

    if (opts.problemText) root.appendChild(el('div', 'ld-problem', opts.problemText));

    const boardWrap = el('div', 'ld-board');
    const left = el('div', 'ld-left');           // bölünen + işlem satırları
    const right = el('div', 'ld-right');         // bölen + bölüm

    // Bölünen satırı (tıklanabilir basamaklar)
    const dividendRow = el('div', 'ld-row ld-dividend');
    const digitEls = [];
    dividendRow.appendChild(el('span', 'ld-cell ld-sign', ''));  // kolon 0: işaret kolonu
    String(q.dividend).split('').forEach((d, i) => {
      const c = el('span', 'ld-cell ld-digit', d);
      c.dataset.idx = i;
      digitEls.push(c);
      dividendRow.appendChild(c);
    });
    left.appendChild(dividendRow);

    const workArea = el('div', 'ld-work');        // işlem satırları buraya eklenir
    left.appendChild(workArea);

    // Sağ blok: bölen, çizgi, bölüm
    right.appendChild(el('div', 'ld-divisor', String(q.divisor)));
    right.appendChild(el('div', 'ld-qline'));
    const quotientRow = el('div', 'ld-quotient');
    right.appendChild(quotientRow);

    boardWrap.appendChild(left);
    boardWrap.appendChild(right);
    root.appendChild(boardWrap);

    // Sayı pedi
    const pad = el('div', 'numpad');
    '1234567890'.split('').forEach(k => {
      const b = el('button', 'key', k);
      b.dataset.key = k;
      pad.appendChild(b);
    });
    const back = el('button', 'key key-back', '⌫'); back.dataset.key = 'back';
    const ok = el('button', 'key key-go', '✔ ONAYLA'); ok.dataset.key = 'ok';
    pad.appendChild(back); pad.appendChild(ok);
    root.appendChild(pad);
    container.appendChild(root);

    /* ---------- Yardımcılar ---------- */
    function cellRow(cls) {
      const r = el('div', 'ld-row ' + (cls || ''));
      for (let c = 0; c <= D; c++) r.appendChild(el('span', 'ld-cell'));
      workArea.appendChild(r);
      return r;
    }
    function setCell(row, col, text, cls) {
      const c = row.children[col];
      c.textContent = text;
      if (cls) c.classList.add(cls);
      return c;
    }
    // plan endCol (0 tabanlı basamak indeksi) → görüntü kolonu (+1: işaret kolonu)
    const VC = i => i + 1;

    function say(t) { if (opts.say && t) opts.say(t); }

    /* ---------- Adım durumu ---------- */
    let activeCells = [];   // buffer'ın yazıldığı hücreler (sağdan sola)
    let currentRow = null;  // multiply/subtract için aktif satır
    let remRow = null;      // son kalan satırı (bringdown buraya ekler)

    function clearActive() {
      activeCells.forEach(c => { c.classList.remove('ld-active'); c.textContent = c.dataset.keep || ''; });
      activeCells = [];
    }

    function renderBuffer() {
      // buffer'ı aktif hücrelere sağa dayalı yaz
      const chars = buffer.split('');
      for (let i = 0; i < activeCells.length; i++) {
        const ch = chars[chars.length - activeCells.length + i];
        activeCells[i].textContent = ch || '';
      }
      // taşma: buffer hücre sayısını aşarsa son hücrede birden çok karakter göster
      if (chars.length > activeCells.length && activeCells.length) {
        activeCells[activeCells.length - 1].textContent = chars.slice(chars.length - 1).join('');
      }
    }

    /* Adımı başlat: giriş hücrelerini hazırla + koçluk repliği */
    function beginStep() {
      if (destroyed) return;
      buffer = ''; attempt = 0; selectCount = 0;
      const step = steps[stepIdx];
      if (!step) return finish();

      // Tek basamaklı bölünende SEÇ adımı otomatik: seçilecek tek şey var,
      // çocuğu anlamsız bir dokunuşla oyalama (UX düzeltmesi)
      if (step.type === 'select' && digitEls.length === 1) {
        digitEls[0].classList.add('ld-select');
        setTimeout(() => commitStep(step, true), 400);
        return;
      }

      if (opts.coach) {
        const key = 'teach.coach.' + step.type;
        const line = B.Dialogue.pick(key, { divisor: q.divisor });
        if (line) say(line);
      } else if (step.type === 'select') {
        // SEÇ adımı pedle değil dokunarak oynanır — bunu HER ZAMAN söyle
        say(B.Dialogue.pick('step.select.intro', { divisor: q.divisor }) ||
            'Kaç basamak alacağız? Sayının basamaklarına DOKUN, sonra ONAYLA!');
      }

      // Guided: Komutan bu adımı kendisi yapar
      if (opts.prefilled && opts.prefilled.has(step.type)) {
        setTimeout(() => autoFill(step), 700);
        prepareCells(step, true);
        return;
      }
      prepareCells(step, false);
    }

    function prepareCells(step, ghost) {
      clearActive();
      digitEls.forEach(d => d.classList.remove('ld-select', 'ld-pulse'));

      if (step.type === 'select') {
        // Basamaklara dokunarak önek seç
        digitEls.forEach(d => d.classList.add('ld-pulse'));
        pad.classList.add('numpad-dim');
        return;
      }
      pad.classList.remove('numpad-dim');

      if (step.type === 'estimate') {
        const c = el('span', 'ld-cell ld-active', '');
        quotientRow.appendChild(c);
        activeCells = [c];
      }
      else if (step.type === 'multiply') {
        currentRow = cellRow('ld-product');
        const len = String(step.expected).length;
        const end = VC(step.endCol);
        setCell(currentRow, end - len, '−', 'ld-sign-cell'); // eksi işareti
        activeCells = [];
        for (let c = end - len + 1; c <= end; c++) {
          const cell = setCell(currentRow, c, '', null);
          cell.classList.add('ld-active');
          activeCells.push(cell);
        }
      }
      else if (step.type === 'subtract') {
        // ayraç çizgisi
        const sep = cellRow('ld-sep');
        const plen = String(step.product).length;
        const end = VC(step.endCol);
        for (let c = end - plen; c <= end; c++) setCell(sep, c, '─');
        // sonuç satırı
        remRow = cellRow('ld-rem');
        const rlen = String(step.expected).length;
        activeCells = [];
        for (let c = end - rlen + 1; c <= end; c++) {
          const cell = setCell(remRow, c, '');
          cell.classList.add('ld-active');
          activeCells.push(cell);
        }
      }
      else if (step.type === 'bringdown') {
        // İndirilecek basamak yanıp söner; dokunuş ya da ped ile
        const d = digitEls[step.digitIndex];
        d.classList.add('ld-pulse');
        const cell = setCell(remRow, VC(step.digitIndex), '');
        cell.classList.add('ld-active');
        activeCells = [cell];
      }
      if (ghost) activeCells.forEach(c => c.classList.add('ld-ghost'));
    }

    /* Guided otomatik doldurma */
    function autoFill(step) {
      if (destroyed) return;
      if (step.type === 'select') {
        for (let i = 0; i < step.expected; i++) digitEls[i].classList.add('ld-select');
        say(B.Dialogue.pick('teach.autofill.select', { n: step.expected }) || 'Bu kısmı ben aldım Komutan.');
      } else {
        buffer = String(step.expected);
        renderBuffer();
      }
      setTimeout(() => { commitStep(step, true); }, 650);
    }

    /* ---------- Doğrulama ---------- */
    function submit() {
      const step = steps[stepIdx];
      if (!step) return;
      let answer;
      if (step.type === 'select') {
        if (!selectCount) return; // henüz seçim yok
        answer = selectCount;
      } else {
        if (!buffer.length) return;
        answer = buffer;
      }
      attempt++;
      const { correct } = B.Question.validate(q, step, answer);
      if (opts.onAnswer) opts.onAnswer(step, correct, attempt);

      if (correct) { commitStep(step, false); }
      else {
        mistakes++;
        root.classList.remove('ld-shake'); void root.offsetWidth; // animasyonu tazele
        root.classList.add('ld-shake');
        const key = B.Lesson.active() ? B.Lesson.hintKey(step.type, attempt) : null;
        say(key ? B.Dialogue.hint(key, { divisor: q.divisor }) : 'Bir daha dene Komutan!');
        if (step.type === 'select') {
          digitEls.forEach(d => d.classList.remove('ld-select'));
          selectCount = 0;
        } else { buffer = ''; renderBuffer(); }
      }
    }

    /* Doğru adımı tahtaya işle ve sonrakine geç */
    function commitStep(step, wasAuto) {
      clearActiveKeep(step);
      digitEls.forEach(d => d.classList.remove('ld-pulse'));
      stepIdx++;
      setTimeout(beginStep, wasAuto ? 250 : 350);
    }

    function clearActiveKeep(step) {
      // Aktif hücrelere kesin değeri yaz, vurguyu kaldır
      const val = String(step.expected);
      if (step.type === 'select') {
        for (let i = 0; i < step.expected; i++) digitEls[i].classList.add('ld-select');
      } else {
        const chars = val.split('');
        activeCells.forEach((c, i) => {
          c.textContent = chars[i] != null ? chars[i] : '';
          c.classList.remove('ld-active', 'ld-ghost');
          c.classList.add('ld-done');
        });
      }
      activeCells = [];
    }

    function finish() {
      if (opts.onComplete) opts.onComplete({ mistakes });
    }

    /* ---------- Girdi bağlama ---------- */
    function onPad(e) {
      const b = e.target.closest('.key');
      if (!b) return;
      B.Audio.play('tick');
      const k = b.dataset.key;
      const step = steps[stepIdx];
      if (!step) return;

      if (k === 'ok') return submit();
      if (step.type === 'select') return; // seçim dokunuşla yapılır
      if (k === 'back') { buffer = buffer.slice(0, -1); renderBuffer(); return; }
      if (buffer.length < 6) { buffer += k; renderBuffer(); }
    }

    function onDigitTap(e) {
      const d = e.target.closest('.ld-digit');
      if (!d) return;
      const step = steps[stepIdx];
      if (!step) return;
      const idx = Number(d.dataset.idx);
      if (step.type === 'select') {
        B.Audio.play('tick');
        selectCount = idx + 1;
        digitEls.forEach((x, i) => x.classList.toggle('ld-select', i <= idx));
      } else if (step.type === 'bringdown') {
        B.Audio.play('tick');
        buffer = d.textContent; // dokunulan basamak cevaptır (yanlışsa yanlış sayılır)
        renderBuffer();
        submit();
      }
    }

    pad.addEventListener('click', onPad);
    dividendRow.addEventListener('click', onDigitTap);

    beginStep();

    return {
      destroy() { destroyed = true; container.innerHTML = ''; },
    };
  }

  B.LongDivisionView = { create };
})(window.BOKUL = window.BOKUL || {});
