/* BOKUL — Curriculum (Yaş / Sınıf Uyarlaması)
 * Onboarding'de sorulan "kaç yaşındasın / kaçıncı sınıfı bitirdin" bilgisine göre
 * içeriği (özellikle matematik zorluğunu) çocuğun seviyesine göre ayarlar. */
(function (B) {

  /* Bitirilen sınıfa göre matematik üretici tavanları */
  function mathCaps(grade) {
    grade = grade == null ? 5 : grade;
    if (grade <= 2) return { maxDigits: 2, maxDivisor: 5 };
    if (grade === 3) return { maxDigits: 3, maxDivisor: 6 };
    if (grade === 4) return { maxDigits: 3, maxDivisor: 9 };
    return { maxDigits: 4, maxDivisor: 9 }; // 5 ve üzeri
  }

  /* Çocuğun ŞU AN bulunduğu sınıf (bitirdiği + 1). Bilinmiyorsa hepsi açık. */
  function currentGrade() {
    const g = B.State.data.player.grade;
    if (g == null) return 6;
    return g === 0 ? 1 : g + 1;
  }

  /* Yaş/zorluk bandı: 1=küçük (6-8/≤2. sınıf), 2=orta (9-10/3-4), 3=büyük (11+/5+).
   * Matematik dışı dersler bu banda göre uyarlanır (küçüklere daha az şık = kolay).
   * Bilinmiyorsa 3 (en geniş) — hiçbir şey kısıtlanmaz. */
  function ageBand() {
    const p = B.State.data.player || {};
    if (p.grade != null) return p.grade <= 2 ? 1 : p.grade <= 4 ? 2 : 3;
    if (p.age != null) return p.age <= 8 ? 1 : p.age <= 10 ? 2 : 3;
    return 3;
  }

  /* Çocuğun BULUNDUĞU sınıfa göre hedef soru zorluğu (q.lvl 1/2/3).
   * 3 kaba bant yerine SINIF-ÇÖZÜNÜRLÜKLÜ: 1. ve 2., 3. ve 4. sınıf artık aynı
   * hedefe çökmez — her sınıf kendi zorluk karışımını görür (MEB kademesi).
   *   1 → lvl 1   ·   2 → lvl 1-2   ·   3 → lvl 2   ·   4 → lvl 2-3   ·   5+ → lvl 3
   * İkinci değer, birincil hedef yetmezse genişleme yönünü belirtir. */
  function lvlTargetForGrade() {
    const p = B.State.data.player || {};
    // Sınıf/yaş BİLİNMİYORSA kısıtlama yok (ageBand ile tutarlı) — primary 0 → ageFilter tüm
    // seviyelere düşer. (Aksi halde currentGrade null→6 idi ve çocuk yalnız EN ZOR soruları görürdü.)
    if (p.grade == null && p.age == null) return { primary: 0, spread: [1, 2, 3] };
    const g = currentGrade(); // bulunduğu sınıf (bitirdiği + 1)
    if (g <= 1) return { primary: 1, spread: [1] };
    if (g === 2) return { primary: 1, spread: [1, 2] };
    if (g === 3) return { primary: 2, spread: [2, 1] };
    if (g === 4) return { primary: 2, spread: [2, 3] };
    return { primary: 3, spread: [3, 2] }; // 5 ve üzeri
  }

  /* Havuz genişliği: birincil zorluk + KOMŞU zorluklar (yalnız uzak uç dışlanır).
   *   1→[1,2]  2→[1,2,3]  3→[2,3]  (bilinmiyorsa hepsi)
   * Bu KRİTİK: tek lvl'e daraltmak havuzu 5'e düşürüp aynı soruların tekrarına yol açıyordu.
   * Geniş havuz + "görülen soru defteri" (QuestionEngine) = konu başına çok daha fazla farklı soru. */
  function allowedLvls() {
    const p = lvlTargetForGrade().primary;
    return { 0: [1, 2, 3], 1: [1, 2], 2: [1, 2, 3], 3: [2, 3] }[p] || [1, 2, 3];
  }

  /* Soru bankasını çocuğun SINIFINA göre süz — GENİŞ havuz (birincil + komşu zorluklar).
   * Yaş ayrımı yalnız uzak ucu dışlar (1. sınıf en zoru görmez, 5. sınıf en kolayı görmez);
   * geri kalanı tekrar önlemek için havuzda tutulur. Hiçbir bölüm boş kalmaz. */
  function ageFilter(bank) {
    if (!Array.isArray(bank) || bank.length < 5) return bank || [];
    const lvl = q => q.lvl || 1;
    const allow = allowedLvls();
    let sel = bank.filter(q => allow.indexOf(lvl(q)) >= 0);
    if (sel.length < 4) sel = bank; // son çare: hepsi
    return sel;
  }

  B.Curriculum = {
    mathCaps,
    currentGrade,
    ageBand,
    ageFilter,

    /* Bölüm çocuğun sınıfına uygun mu? (section.minGrade) */
    gradeOk(section) {
      return !section || !section.minGrade || currentGrade() >= section.minGrade;
    },

    /* Soru tipine göre üreticiyi uyarla (uzun bölme sınıfa göre kısıtlanır) */
    forType(itype, gen) {
      return itype === 'long-division' ? B.Curriculum.forMath(gen) : gen;
    },

    /* Uzun bölme üreticisini sınıfa göre kısıtla (çok küçükler zorlanmasın) */
    forMath(gen) {
      if (!gen) return gen;
      const caps = mathCaps(B.State.data.player.grade);
      const g = Object.assign({}, gen);
      if (Array.isArray(g.dividendDigits))
        g.dividendDigits = [Math.min(g.dividendDigits[0], caps.maxDigits), Math.min(g.dividendDigits[1], caps.maxDigits)];
      else if (typeof g.dividendDigits === 'number')
        g.dividendDigits = Math.min(g.dividendDigits, caps.maxDigits);
      if (Array.isArray(g.divisorRange))
        g.divisorRange = [g.divisorRange[0], Math.min(g.divisorRange[1], caps.maxDivisor)];
      return g;
    },

    /* Etkin ders matematikse üreticiyi uyarlar, değilse dokunmaz */
    adjust(lesson, gen) {
      return (lesson && lesson.interactionType === 'long-division') ? B.Curriculum.forMath(gen) : gen;
    },

    gradeLabel() {
      const gr = B.State.data.player.grade;
      if (gr == null) return '';
      return gr === 0 ? 'okul öncesi' : (gr + '. sınıfı bitirmiş');
    },
  };
})(window.BOKUL = window.BOKUL || {});
