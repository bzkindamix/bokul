/* BOKUL — Demo / Anonim Kullanıcı Kısıtlaması
 * Davet kodu OLMADAN ("Kodsuz oyna") giren kullanıcı DEMO'dur: sınırlı deneme.
 * Aile koduna bağlanınca (ebeveynden kod alınca) tam sürüme geçer.
 * Demo kısıtları:
 *   - Altın kazanamaz (ekonomi kapalı)
 *   - Sandık kazanamaz
 *   - Her dersten yalnızca İLK bölüm (1 ünite 1 konu) oynanır
 *   - Mağaza, Evcil Hayvan, Günlük Ödül kapalı (ekonomiye bağlı) */
(function (B) {
  const LOCKED = ['store', 'pets']; // demo'da kapalı oyun bölümleri

  B.Demo = {
    /* Aile koduna bağlı DEĞİLSE demo. Kod girilince (bağlanınca) tam sürüm. */
    isDemo() { return !(B.Cloud && B.Cloud.getCode()); },
    sectionLimit: 1,          // ders başına açık bölüm sayısı
    featureLocked(f) { return B.Demo.isDemo() && LOCKED.indexOf(f) >= 0; },
  };
})(window.BOKUL = window.BOKUL || {});
