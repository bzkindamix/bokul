# BOKUL — Sürüm Notları

## v0.9 — Üç Yeni Cephe (2026-07-18)

- 🌌 DÜNYA HARİTASI: Harekât kapısı artık cephe seçim ekranına açılıyor;
  her ders bir cephe kartı (yıldız + kristal ilerlemesiyle).
- 🤖 Yapay Zekâ Cephesi: "YZ nedir?" (sınırlar, doğrulama, kişisel bilgi
  güvenliği) + "Prompt Ustalığı" (açıklık, bağlam, biçim, adım adım isteme).
- 🧼 Kişisel Bakım Cephesi: "Hijyen Harekâtı" (el yıkama, diş, mikroplar) +
  "Bakım ve Düzen" (uyku, su, kıyafet, oda düzeni).
- 🦉 Felsefe Cephesi: "Soru Sorma Sanatı" (Sokrates, iyi soru, gerekçe) +
  "Düşünce Deneyleri" (mantık hataları, adalet, empati).
- Yeni soru motoru: çoktan seçmeli plugin (karıştırılan şıklar, yanlış şık
  sönerek elenir, soruya özel ipucu) — mimarideki registry sayesinde çekirdek
  koda dokunulmadan eklendi. 60 yeni soru, 6 yeni konu boss'u.


## v0.8-karakter — Karakter Yaratma Sihirbazı (2026-07-18)

- Karakter yaratma artık oyunun İLK adımı: Cinsiyet seç (kız/erkek önizlemeli
  kartlar) → isim → görünüm detayları (Dolap) → sinematik → üs.
- Cinsiyet: başlangıç görünümünü belirler (kız: iki örgü + kirpikli gözler);
  tüm parçalar iki cinsiyete de açık, hiçbir seçenek kilitlenmez.
- YENİ: Göz rengi (6 renk: kahve, siyah, mavi, yeşil, ela, gri) — klasik göz
  artık beyaz + renkli iris + ışıltılı bebek olarak çiziliyor.
- Saç modelleri 5 → 9: at kuyruğu, iki örgü, kâkül, kirpi (kirpi kilitli/nadir).
- Saç renkleri 6 → 10 (kızıl, gümüş, mor*, turkuaz* eklendi; *kilitli).
- Ten 5 → 6 ton; ağızlara "Islık" eklendi. Renk sekmesi bölümlü: SAÇ / GÖZ.


## v0.8-hikaye — Giriş Sinematiği (2026-07-18)

- HİKÂYE: KARMAŞA, Büyük Sayı Kristali'ni parçaladı — hiçbir şey adil
  bölünemiyor (dondurmalar dahil). Boss'lar kristal parçalarını saklıyor;
  her zafer bir parçayı kurtarıyor (zafer ekranına kristal satırı eklendi).
- 5 sahnelik atlanabilir giriş sinematiği (SVG/CSS animasyon + anlatım
  mırıltısı): kristal → Karmaşa'nın saldırısı → bölünemeyen dünya →
  BOKUL üssü → "o asker SENSİN". İlk açılışta otomatik; üsten
  "🎬 Hikâyeyi izle" ile tekrar izlenebilir.
- Hikâye metinleri content/story.json'da — ileride bölüm araları eklenebilir.


## v0.7.1 — Canlı Karakterler (2026-07-18)

- Baba Komutan artık YAŞIYOR: nefes alma animasyonu, rastgele göz kırpma,
  konuşurken ağız aç/kapa + Animal Crossing tarzı sesli mırıltı (Web Audio, dosyasız).
- Boss'lara idle animasyonu (süzülme/nefes) + sahne girişiyle birleşik.
- Nano Banana (Gemini görüntü) denendi: API anahtarı ücretsiz katman olduğu için
  görüntü modeli 0 kota veriyor (429). Faturalandırma açılırsa aynı kare sistemine
  (normal/ağız açık/şaşkın/gururlu) gerçek çizim PNG'leri takılabilir.


## v0.7 — Görsel Devrim (2026-07-18)

**Hata düzeltmeleri (Onur'un testinden)**
- KRİTİK: SEÇ adımında oyuncu kilitleniyordu — artık Komutan her SEÇ adımında
  "basamaklara dokun" diye yönlendiriyor, ONAYLA parlak ve nabız atıyor,
  tek basamaklı sayılarda seçim otomatik yapılıyor.
- KRİTİK: İsim kaydedilmiyordu (overlay, buton onClick'inden ÖNCE siliniyordu) — düzeltildi.

**Yenilikler**
- Emoji karakterler gitti: Baba Komutan artık el çizimi SVG (5 yüz ifadesi,
  olaylara tepki verir: doğru→mutlu, yanlış→şaşkın, level→gururlu). 4 boss da SVG.
- Onboarding: isim → avatar oluşturma → üsse giriş. Tüm replikler artık İSİMLE hitap ediyor.
- Avatar sistemi: ten/saç/göz/ağız/aksesuar/çerçeve; SVG parça tabanlı.
- Fotoğraf avatarı: cihazdan fotoğraf seç (CİHAZDA kalır, hiçbir yere gönderilmez).
- 💰 Altın ekonomisi: soru (yıldız×2), harekât (+10), boss (+50/100), sandık (+20..150).
- DOLAP = dükkân: kilitli parçalar altınla satın alınır (50/120/250/500).
- Sandık sistemi: bronz (10★), altın (level), epik (konu boss), efsanevi (ünite boss);
  CSS 3D açılış töreni, kopya koruması.
- Görevler kapısı v0.8'e kaldı (panoda belirtiliyor).


## v0.6 — İlk Çalışan Sürüm (2026-07-18)

Aşama 8 teslimi: oynanabilir dikey dilim.

**İçerik**
- Matematik Cephesi · Ünite 1 (4 bölüm × 8 harekât + boss): Tek Basamak Keşfi,
  Çifte Kule Cephesi, Üç Başlı Vadi, Dört Basamak Zirvesi
- 3 Konu Boss'u + 1 Ünite Boss'u (Basamak Golemi — zırh/saldırı/geri çekilme mekaniği)
- ~90 Baba Komutan repliği + 5 adım × 3 kademe ipucu sistemi
- CPA öğretim senaryoları (kutu paylaştırma, basamak tablosu, koçlu bölme)

**Sistemler**
- 5 adımlı uzun bölme tahtası (Türk okul notasyonu, dokunmatik)
- XP / level / rütbe / hatasız seri çarpanı / günlük çalışma serisi
- Adaptif ustalık takibi + %80 boss kapısı + harekât/bölüm kilit zinciri
- Yıldız sistemi (3★/2★/1★), LocalStorage kayıt (şema v1, migrasyon altyapısı)
- Web Audio sentez efektleri, konfeti/XP damlası animasyonları

**Teknik**
- 23 kaynak dosya, 4 içerik paketi, sıfır bağımlılık
- `node build.js` → dist/bokul.html (118 KB, çift tıkla-oyna)
- `node tests/logic.test.js` → 4138 doğrulama, 0 hata

**Bilinen eksikler (plana uygun)**
- Sandık/dolap/görevler/başarımlar → v0.7
- Ünite 2 (kalanlı bölme, s5-s7) + istatistik ekranı + 150+ replik → v0.8
- İsim giriş alanının otomasyon aracıyla doldurulması kaydetmedi (elle yazımda sorun
  görülmedi; v0.7'de yeniden test edilecek)
