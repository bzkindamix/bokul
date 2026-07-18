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

  B.Curriculum = {
    mathCaps,
    currentGrade,

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
