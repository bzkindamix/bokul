# BOKUL — Sürüm Notları

## v0.14 — 3D Avatar, Ekonomi, Yaş/Sınıf ve İngilizce (2026-07-18)

- 🧊 3D AVATAR: Avatarlara derinlik gölgelendirmesi (radial gradyanlar: zemin,
  yüz ışığı sol-üst, gölge sağ-alt, kenar ışığı). Büyük önizlemeler hafifçe
  3D eğilip süzülüyor (perspective + rotateY animasyonu). Kıyafet değişikliği
  avatarda anında görünüyor.
- 💰 KIYAFET EKONOMİSİ: Başta yalnızca 3 kıyafet ücretsiz (her cinsiyet ~2-3
  görür); kalan ~60+ kıyafet ve tüm premium parçalar altınla alınır. Katalog
  tabanlı fiyat/alım/satım (rewards.json'a bağımlı değil).
- 🎓 YAŞ & SINIF: Karakter yaratımında "Kaç yaşındasın?" ve "Kaçıncı sınıfı
  bitirdin?" sorulur. Matematik zorluğu bitirilen sınıfa göre ayarlanır
  (ör. 2. sınıf → 2 basamaklı bölme; 5.+ → 4 basamaklı). Dünya haritasında
  math cephesinde seviye notu, ebeveyn konsolunda yaş/sınıf görünür.
- 🌍 İNGİLİZCE CEPHESİ: Yeni ders (5. cephe). "İlk Kelimeler" (selamlaşma,
  renkler, sayılar, hayvanlar) ve "Günlük İngilizce" (cümleler, aile, ifadeler).
  24 soru, 2 boss (Sessiz Kelime Canavarı, Karışık Cümle Ejderi).


## v0.13 — Ebeveyn Konsolu ve Dilek Kutusu (2026-07-18)

- 👨‍👧 EBEVEYN KONSOLU: Giriş ekranında "👨‍👧 Ebeveyn" → ebeveyn PIN'i (ilk
  kullanımda oluşturulur, çocuklar bilmez). Üç sekme:
  - 📊 Oyuncular: her çocuğun seviye, XP, altın, doğru/yanlış, isabet %,
    en iyi seri, son oynama ve her cephede yıldız/boss ilerlemesi.
  - 🎁 İstekler: çocukların ödül isteklerini görür; her isteğe oyun-içi HEDEF
    atar (X hedef / X seviye / X yıldız / X boss), ilerlemeyi izler, "Ödülü
    verdim" ile kapatır, not bırakır.
  - 💡 Fikirler: çocukların oyun fikirlerini görür, durum + not verir.
- 🎁 DİLEK KUTUSU (çocuk): Üste "🎁 Dilek Kutusu" → gerçek ödül ister
  (oyuncak vb.) veya oyuna fikir gönderir. İstek durumunu görür: bekliyor /
  hedef verildi (ilerleme barlı) / 🎉 HAK ETTİN. Hedefe ulaşınca oyun otomatik
  algılar, çocuğa müjde verir; ebeveyn gerçek ödülü verir.
- Tüm veriler cihazda, her çocuğun kendi kaydında; konsol tüm kayıtları okur.


## v0.12 — Kıyafetler Göründü + Bol Çeşit + Cinsiyet Filtresi (2026-07-18)

- 👕 KIYAFET HATASI DÜZELDİ: Avatarlar sadece kafadan ibaretti. Artık omuz +
  gövde çiziliyor ve kıyafet GÖRÜNÜYOR (badge'in alt kısmında). Her yerde
  (HUD, kartlar, önizleme) geçerli. clipPath ile temiz kırpma.
- 🧥 74 KIYAFET: 11 biçim (tişört, kapüşonlu, ceket, çizgili, V-yaka, elbise,
  bluz, askılı, forma, gömlek, yelek) × 6 renk = 66 ücretsiz, + 8 premium
  (zırh, üniforma, uzay giysisi, robot zırhı, filozof cübbesi, kahraman
  pelerini, balo elbisesi, şık takım). Dolap'a "👕 Kıyafet" sekmesi eklendi.
- 💇 17 SAÇ MODELİ: 9→17 (mohawk, afro, bob, uzun dalgalı, yan ayrık,
  yüksek topuz, undercut, iki topuz eklendi).
- 🚻 CİNSİYET FİLTRESİ: Oyun başında seçilen cinsiyete göre saç ve kıyafet
  seçenekleri süzülür (unisex + o cinsiyete özel). Kız ~55 kıyafet/13 saç,
  erkek ~55 kıyafet/9 saç görür.


## v0.11 — Yeni Hikâye, Görünür Gözler ve Oyuncu Profilleri (2026-07-18)

- 📖 YEPYENİ HİKÂYE: Sadece bölmeyi değil TÜM cepheleri kapsıyor. "Büyük Bilgi
  Kristali"ni tembel gölge BULANIK parçaladı; parçalar Sayı, Yapay Zekâ, Bakım
  ve Felsefe cephelerinde canavarlarda saklı. Sinematik yeni sahnelerle
  (kristal, Bulanık, dört cephe...) baştan yazıldı.
- 👁️ GÖZ HATASI DÜZELDİ: İris çok inceydi, göz rengi görünmüyordu. Gözler
  büyütüldü, iris baskın (r6) yapıldı — göz rengi artık tüm boyutlarda net.
  HUD, kartlar, önizlemeler dahil her yerde.
- 🔐 OYUNCU PROFİLLERİ: Kullanıcı adı + şifre ile giriş. Her oyuncunun kendi
  kaydı; ilerleme profile yazılır, sonraki girişte hatırlanır. "Beni hatırla"
  ile şifresiz otomatik devam, "Çıkış" ile oyuncu değiştirme. Şifreler karma
  (hash) ile saklanır — düz metin değil. (Not: yerel aile profili, banka
  güvenliği değil.) Eski tek kayıt ilk profile otomatik taşınır.


## v0.10 — Evim, Görevler, Satış ve Alaycı Baba (2026-07-18)

- 🏠 DOLAP → EVİM: Ana kapı artık "Evim" hub'ına açılıyor; içinde iki bölüm:
  🧍 BEN (görünüm/tip ayarı) ve 👕 DOLAP (kıyafet: al · sat · giy).
- 💰 SATIŞ: Sahip olunan kıyafetler Dolap'ın "Sat" sekmesinden satılabilir —
  alış fiyatının %40'ı geri döner. Takılı bir parça satılırsa slot otomatik
  varsayılana döner.
- 📋 GÖREVLER AKTİF: Günün Emirleri panosu çalışıyor. Her gün 3 görev
  (hedef/3 yıldız/harekât/doğru cevap), ilerleme barı, biten göreve TOPLA
  butonu (XP + altın), üçünü de toplayınca Gümüş Sandık. Ana kapıda bekleyen
  görev rozeti.
- 😏 HİKÂYECİ BABA: Boss girişleri artık uzun, anlatıcı hikâyeler; savaş
  sırasında Baba düşmanla dalga geçiyor ("akıl fakiri", "ebleh", "gerzo",
  "ödlek" — hep düşmana yönelik, asla çocuğa değil). Yeni boss.taunt havuzu.
- Yeni quest-engine + evim/quests ekranları; mimariye dokunmadan eklendi.


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
