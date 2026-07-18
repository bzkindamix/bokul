# 🌌 BOKUL — Baba Okulu Eğitim Üssü

**BO**(Baba) + **KUL**(Okul): Çocuklar için tamamen tarayıcıda çalışan, çevrimdışı,
tek HTML dosyasına paketlenebilen eğitici oyun platformu. İlk cephe: 5. sınıf
matematik — uzun bölme.

Oyuncular öğrenci değil, üsse yeni katılan askerlerdir; onları eğiten kişi ise
komik, hafif alaycı ama asla kırıcı olmayan **Baba Komutan**'dır.

## Oynamak için

- **Hızlı yol:** `dist/bokul.html` dosyasını çift tıkla — internet gerekmez,
  kurulum gerekmez. Tablet/telefon/PC.
- **Geliştirme:** klasörde `python -m http.server 8000` → `http://localhost:8000`

## Komutlar

```bash
node build.js            # dist/bokul.html tek dosyasını üretir
node tests/logic.test.js # uzun bölme mantığının 4000+ doğrulaması
```

## Öne çıkanlar

- 🎓 **Bilfen ayarı öğretim modeli:** MEB kazanım uyumu, Somut→Görsel→Soyut (CPA),
  ustalık kapılı boss'lar (%80), aralıklı tekrar (1-3-7-14 gün)
- ⚔️ **5 adımlı uzun bölme tahtası:** Türk okul notasyonu, dokunmatik; yanlışta
  cevap asla gösterilmez, 3 kademeli ipucu verilir
- 🎭 **Canlı Baba Komutan:** SVG karakter — nefes alır, göz kırpar, konuşurken
  ağzı oynar ve sesli mırıldanır (Web Audio, sıfır ses dosyası)
- 💰 **Ekonomi:** XP, level, 7 rütbe, altın, sandıklar, avatar dükkânı
- 🧑‍🎨 **Avatar:** parça tabanlı editör + cihazda kalan fotoğraf avatarı (hiçbir
  veri dışarı gönderilmez)
- 🏗️ **Modüler mimari:** yeni ders eklemek = `content/lessons/` altına 1 JSON;
  motorlar içeriği tanımaz (EventBus + registry deseni), framework yok

## Dokümantasyon

Tasarım süreci `docs/` altında aşama aşama: konsept, oyun döngüsü, mimari,
veri modeli, dosya yapısı, UI, geliştirme planı ve sürüm notları (CHANGELOG.md).

---

Bir baba tarafından, kızı için. 🫡
