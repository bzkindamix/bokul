/* BOKUL — LessonEngine
 * Ders paketini (cephe) yorumlar: ünite → bölüm → harekât → boss akışı,
 * kilit kuralları ve ustalık kapısı. İçeriğin ANLAMINI bilmez. */
(function (B) {
  let lesson = null;       // aktif ders paketi
  const registry = [];     // yüklü tüm dersler (cepheler)

  function cfg() { return B.Content.get('config') || {}; }

  B.Lesson = {
    register(lessonData) { if (lessonData) registry.push(lessonData); },
    all() { return registry; },
    setActive(lessonData) { lesson = lessonData; },
    active() { return lesson; },

    sections() {
      const out = [];
      lesson.units.forEach(u => u.sections.forEach(s => out.push({ unit: u, section: s })));
      return out;
    },

    findSection(sectionId) {
      return B.Lesson.sections().find(x => x.section.id === sectionId) || null;
    },

    findMission(sectionId, missionId) {
      const s = B.Lesson.findSection(sectionId);
      return s ? s.section.missions.find(m => m.id === missionId) : null;
    },

    /* Üretici çözümleme: { pool: "sX" } gibi bölüm referanslarını
     * o bölümün soru bankasına çevirir (çoktan seçmeli dersler için). */
    resolveGenerator(sectionId, gen) {
      if (!gen || typeof gen.pool !== 'string') return gen;
      const ref = B.Lesson.findSection(gen.pool) || B.Lesson.findSection(sectionId);
      return { pool: (ref && ref.section.bank) || [] };
    },

    /* ---- Kilit kuralları ---- */

    /* Bölüm çocuğun sınıf seviyesine uygun mu? (değilse haritada "X. sınıfta açılır") */
    gradeLocked(sectionId) {
      const f = B.Lesson.findSection(sectionId);
      return !!(f && B.Curriculum && !B.Curriculum.gradeOk(f.section));
    },

    /* Bölüm açık mı? Sınıf uygun + önceki bölüm tamamlanmış olmalı */
    isSectionUnlocked(sectionId) {
      if (B.Lesson.gradeLocked(sectionId)) return false; // sınıf kilidi
      const list = B.Lesson.sections();
      const idx = list.findIndex(x => x.section.id === sectionId);
      if (idx <= 0) return true;
      const prev = list[idx - 1].section;
      const need = (list[idx].section.unlock || {}).starsRequired ?? (cfg().sectionUnlockStars || 16);
      const prevProg = B.State.sectionProgress(lesson.id, prev.id);
      return prevProg.bossDefeated && B.State.sectionStars(lesson.id, prev.id) >= need;
    },

    /* Harekât oynanabilir mi? Kendinden önceki harekât tamamlanmış olmalı (tekrar hep serbest) */
    isMissionUnlocked(sectionId, missionId) {
      if (!B.Lesson.isSectionUnlocked(sectionId)) return false;
      const sec = B.Lesson.findSection(sectionId).section;
      const idx = sec.missions.findIndex(m => m.id === missionId);
      if (idx <= 0) return true;
      const prevId = sec.missions[idx - 1].id;
      return !!B.State.sectionProgress(lesson.id, sectionId).missions[prevId];
    },

    /* Boss kapısı: tüm harekâtlar bitmiş + kazanım ustalığı yeterli */
    bossGate(sectionId) {
      const sec = B.Lesson.findSection(sectionId).section;
      const prog = B.State.sectionProgress(lesson.id, sectionId);
      const missionsDone = sec.missions.every(m => prog.missions[m.id]);
      const need = (sec.boss.unlock || {}).masteryRequired ?? (cfg().mastery || {}).bossGate ?? 0.8;
      const mastery = B.Progress.overallMastery(lesson.skills);
      return { missionsDone, mastery, need, open: missionsDone && mastery >= need };
    },

    /* ---- Tamamlama kayıtları ---- */

    completeMission(sectionId, missionId, stars) {
      const prog = B.State.sectionProgress(lesson.id, sectionId);
      const prev = prog.missions[missionId];
      // Yıldız sadece yükselir, asla düşmez (tekrar oynama tamamlamacılığı besler)
      prog.missions[missionId] = { stars: Math.max(stars, prev ? prev.stars : 0) };
    },

    defeatBoss(sectionId) {
      const prog = B.State.sectionProgress(lesson.id, sectionId);
      prog.bossDefeated = true;
      prog.bossHpCarry = 0;
      const list = B.Lesson.sections();
      const idx = list.findIndex(x => x.section.id === sectionId);
      const next = list[idx + 1];
      if (next && B.Lesson.isSectionUnlocked(next.section.id)) {
        B.Bus.emit(B.Events.SECTION_UNLOCKED, { sectionId: next.section.id });
      }
    },

    /* Review harekâtı için: bu bölüme kadarki AYNI soru tipindeki üreticiler.
     * (Aritmetik ile uzun bölme karışmasın.) */
    reviewGenerators(sectionId) {
      const list = B.Lesson.sections();
      const idx = list.findIndex(x => x.section.id === sectionId);
      const curSec = idx >= 0 ? list[idx].section : null;
      const typeOf = sec => sec.interactionType || (lesson || {}).interactionType;
      const curType = curSec ? typeOf(curSec) : null;
      const gens = [];
      list.slice(0, idx + 1).forEach(x => {
        if (typeOf(x.section) !== curType) return; // yalnızca aynı tip
        x.section.missions.forEach(m => {
          if (m.generator && (m.type === 'practice' || m.type === 'guided')) {
            gens.push(B.Lesson.resolveGenerator(x.section.id, m.generator));
          }
        });
      });
      if (gens.length) return gens;
      // Yedek: tipe uygun basit varsayılan
      return [curType === 'arithmetic' ? { op: '+', a: [1, 10], b: [1, 10] } : { divisorRange: [2, 5], dividendDigits: 1 }];
    },

    /* Harekâtın ipucu anahtarını getir: hints[stepType][hataSeviyesi] → rastgele anahtar */
    hintKey(stepType, level) {
      const h = (lesson.hints || {})[stepType];
      if (!h) return null;
      const lv = Math.min(level, 3);
      const keys = h[String(lv)] || h['1'] || [];
      return keys[Math.floor(Math.random() * keys.length)] || null;
    },
  };
})(window.BOKUL = window.BOKUL || {});
