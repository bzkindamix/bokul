/* BOKUL — ProgressManager (Adaptif Sistem)
 * Mikro-beceri başına kayan pencereli ustalık takibi.
 * Soru üreticiler zorluğu buradan sorar; boss kapısı ustalığa bakar. */
(function (B) {
  function cfg() { return (B.Content.get('config') || {}).adaptive || { window: 20, weakThreshold: 0.6, strongThreshold: 0.85 }; }

  B.Progress = {
    /* step:answered olayından beceri kaydı — sadece İLK deneme sayılır
     * (ipucu sonrası düzeltmeler ustalık sayılmaz ama ceza da değildir) */
    record(skill, correct) {
      const per = B.State.data.stats.perSkill;
      if (!per[skill]) per[skill] = [];
      per[skill].push(correct ? 1 : 0);
      if (per[skill].length > cfg().window) per[skill].shift();
    },

    /* 0..1 ustalık: son N denemenin doğruluk oranı (deneme azsa temkinli) */
    mastery(skill) {
      const arr = B.State.data.stats.perSkill[skill] || [];
      if (!arr.length) return 0;
      const ratio = arr.reduce((a, b) => a + b, 0) / arr.length;
      const confidence = Math.min(1, arr.length / 8); // az veriyle şişme olmasın
      return ratio * confidence;
    },

    /* Ders becerilerinin ortalama ustalığı (boss kapısı bunu kullanır) */
    overallMastery(skills) {
      if (!skills || !skills.length) return 0;
      return skills.reduce((t, s) => t + B.Progress.mastery(s), 0) / skills.length;
    },

    /* En zayıf beceri (görev üretimi ve ipucu vurgusu için) */
    weakestSkill(skills) {
      let weakest = skills[0], min = Infinity;
      skills.forEach(s => { const m = B.Progress.mastery(s); if (m < min) { min = m; weakest = s; } });
      return weakest;
    },

    /* Üreticiye zorluk çarpanı: usta ise 1 (tam parametre), zayıfsa 0 (kolay uç) */
    difficultyBias(skills) {
      const m = B.Progress.overallMastery(skills);
      const c = cfg();
      if (m >= c.strongThreshold) return 1;
      if (m <= c.weakThreshold) return 0;
      return (m - c.weakThreshold) / (c.strongThreshold - c.weakThreshold);
    },

    init() {
      B.Bus.on(B.Events.STEP_ANSWERED, p => {
        if (p.attempt === 1) B.Progress.record(p.stepType, p.correct);
        const st = B.State.data.stats;
        if (p.correct) st.correct++; else st.wrong++;
      });
    },
  };
})(window.BOKUL = window.BOKUL || {});
