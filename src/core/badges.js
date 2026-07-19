/* BOKUL — Rozet (nişan) sistemi
 * Her ünite/konu boss'unu yenince bir rozet kazanılır. Rozet kaydı inventory.badges'e
 * yazılır (kazanma anı/tören için), AMA görüntüleme kaynağı sectionProgress.bossDefeated'tir
 * (geriye dönük çalışır — eski oyuncular da bitirdikleri bölümlerin rozetini görür). */
(function (B) {
  function invBadges() {
    const inv = B.State.data.inventory;
    if (!inv.badges) inv.badges = [];
    return inv.badges;
  }

  /* Tüm cephelerin (oyuncuya görünür) boss'larından rozet kataloğu */
  function catalog() {
    const out = [];
    const lessons = (B.Lesson && B.Lesson.forPlayer) ? B.Lesson.forPlayer() : (B.Lesson.all ? B.Lesson.all() : []);
    lessons.forEach(l => (l.units || []).forEach(u => (u.sections || []).forEach(s => {
      const bo = s.boss;
      if (!bo) return;
      out.push({
        id: (bo.rewards && bo.rewards.badge) || bo.id,
        name: bo.name || 'Nişan', icon: bo.icon || '🎖️', tier: bo.tier || 'topic',
        lesson: l.title || '', lessonId: l.id, section: s.title || '', sectionId: s.id,
      });
    })));
    return out;
  }

  /* Bu rozet kazanıldı mı? (boss yenildi mi — otoriter kaynak) */
  function earned(rec) {
    try { return !!B.State.sectionProgress(rec.lessonId, rec.sectionId).bossDefeated; }
    catch (e) { return false; }
  }

  function has(id) { return invBadges().some(b => b.id === id); }

  /* Rozeti kayda geçir (kazanma anı) — bir kez; görüntüleme yine bossDefeated'e dayanır */
  function grant(rec) {
    if (!rec || !rec.id || has(rec.id)) return false;
    invBadges().push({
      id: rec.id, name: rec.name || 'Nişan', icon: rec.icon || '🎖️', tier: rec.tier || 'topic',
      lesson: rec.lesson || '', section: rec.section || '', ts: Date.now(),
    });
    if (B.Bus && B.Events && B.Events.BADGE_EARNED) B.Bus.emit(B.Events.BADGE_EARNED, { id: rec.id, name: rec.name });
    if (B.Save) B.Save.saveSoon();
    return true;
  }

  /* Kazanılmış rozetler (katalogdan, boss yenilmiş olanlar) */
  function ownedList() { return catalog().filter(earned); }
  function stats() { const c = catalog(); return { earned: c.filter(earned).length, total: c.length }; }

  B.Badges = { catalog, earned, has, grant, ownedList, stats };
})(window.BOKUL = window.BOKUL || {});
