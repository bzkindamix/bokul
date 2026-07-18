/* BOKUL — GameState
 * Tüm oyun durumunun tek sahibi. Motorlar state.data'yı okur;
 * değişiklikler motor metodlarıyla yapılır ve olaylarla duyurulur. */
(function (B) {
  const SCHEMA_VERSION = 1;

  function freshState() {
    return {
      meta: {
        schemaVersion: SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
        lastPlayedAt: new Date().toISOString(),
        introSeen: false,          // giriş sinematiği bu profilde izlendi mi
      },
      player: { name: '', xp: 0, level: 1, rank: 'rank1', title: '', coins: 0,
                avatar: { skin: 1, hair: 0, hairColor: 0, eyes: 0, mouth: 0, acc: 'none', ring: 'none', photo: null, usePhoto: false } },
      streaks: { current: 0, best: 0, dailyDays: 0, lastPlayDate: '' },
      stats: { correct: 0, wrong: 0, perSkill: {} }, // perSkill: { estimate: [1,0,1,...] } son 20 sonuç
      progress: { lessons: {} }, // lessons[dersId].sections[sectionId] = { missions:{id:{stars}}, bossDefeated, bossHpCarry }
      inventory: { cosmetics: [], badges: [], titles: [] },
      quests: { daily: [], weekly: [], lastDailyReset: '', lastWeeklyReset: '' },
    };
  }

  B.State = {
    data: freshState(),
    SCHEMA_VERSION,
    fresh: freshState,

    /* Bir dersin bölüm kaydını getir (yoksa oluştur) */
    sectionProgress(lessonId, sectionId) {
      const lessons = this.data.progress.lessons;
      if (!lessons[lessonId]) lessons[lessonId] = { sections: {} };
      const secs = lessons[lessonId].sections;
      if (!secs[sectionId]) secs[sectionId] = { missions: {}, bossDefeated: false, bossHpCarry: 0 };
      return secs[sectionId];
    },

    /* Bölümün toplam yıldızı */
    sectionStars(lessonId, sectionId) {
      const sec = this.sectionProgress(lessonId, sectionId);
      return Object.values(sec.missions).reduce((t, m) => t + (m.stars || 0), 0);
    },

    touch() { this.data.meta.lastPlayedAt = new Date().toISOString(); },
  };
})(window.BOKUL = window.BOKUL || {});
