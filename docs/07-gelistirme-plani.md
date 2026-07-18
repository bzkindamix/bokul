# BOKUL — Aşama 7: Geliştirme Planı

> Durum: Onay bekliyor (2026-07-18)
> Aşama 1-6: ✅ Onaylandı

---

## 1. Strateji: Dikey Dilim Önce

Her şeyi yüzeysel yapmak yerine, **Bölüm 1'i uçtan uca eksiksiz** yapan bir
"dikey dilim" hedeflenir. Kızın ilk oynadığı gün gerçek oyun deneyimi yaşamalı;
yarım özellik ormanı değil. Sonraki sürümler dilimi genişletir.

## 2. Sürüm Yol Haritası

### 🔧 v0.1 — Çekirdek İskelet (görünmez temel)
- `core/` tamamı: EventBus + olay sözlüğü, GameState + action'lar,
  ContentRegistry (gömülü blok + fetch), SaveManager (debounce + migrasyon)
- UIManager ekran router'ı + boş Üs ekranı kabuğu
- `build.js` çalışır: `dist/bokul.html` üretir (boş oyun bile tek dosya açılır)
- ✅ Bitti kriteri: konsol temiz, state kaydolup geri yükleniyor, build açılıyor

### 🔢 v0.2 — Bölme Tahtası (oyunun kalbi)
- `interactions/long-division/logic.js`: üretici + 5 adımlı doğrulayıcı (saf, DOM'suz)
- `view.js`: dokunmatik tahta + sayı pedi + adım rayı
- İpucu kademesi (1→2→3), hata animasyonu (sallanma, turuncu)
- AudioManager v1: tık/doğru/yanlış/tamamlandı tınıları
- ✅ Bitti kriteri: 4872÷6 baştan sona adım adım, yanlışta cevap sızdırmadan çözülüyor

### 🏆 v0.3 — Ödül Döngüsü (his katmanı)
- RewardEngine: XP, level, rütbe, seri çarpanı, yıldız hesabı
- AnimationEngine: XP damlası, yıldız töreni, level-up ekranı
- DialogueManager + `dialogues.json` v1 (~60 replik)
- ✅ Bitti kriteri: hedef bitince "Brawl Stars hissi" — parıltı, ses, bar dolması

### 🗺️ v0.4 — Harita ve Ders Akışı
- LessonEngine: `math-5-division.json`'ı okur; ünite→bölüm→harekât→kilit zinciri
- Harita ekranı (patika, düğüm tipleri, yıldız rozetleri, nabız animasyonu)
- practice + guided (scaffold) harekât tipleri
- ✅ Bitti kriteri: Bölüm 1'in 8 harekâtı haritadan sırayla oynanıyor, ilerleme kayıtlı

### 🎓 v0.5 — Öğretim Sistemi (Bilfen katmanı)
- teach harekâtı: CPA segmentleri (drag-share, tap-groups, guided-first)
- challenge: problem şablonlu yeni nesil sorular
- ProgressManager: beceri ustalığı, adaptif ağırlık, %80 boss kapısı
- review harekâtı + aralıklı tekrar zamanlayıcısı
- ✅ Bitti kriteri: hiç bölme bilmeyen biri Keşif Brifingi'nden boss kapısına ulaşabiliyor

### 🏰 v0.6 — Boss Savaşları
- Konu Boss'u (can barı, kalkan mekaniği) + Ünite Boss'u (zırh, saldırı, geri çekilme)
- Boss ekranı: enerji ışını, kritik vuruş, zafer sahnesi
- ✅ Bitti kriteri: Bölünmez Kaya yenilebiliyor, Basamak Golemi vurabiliyor

▶ **AŞAMA 8 TESLİMİ (v0.6 sonu) = İLK ÇALIŞAN SÜRÜM:**
Bölüm 1 uçtan uca (teach→boss), XP/level/seri/yıldız, ~60 replik, ses, kayıt,
tek dosya `bokul.html`. Kızın oynayabilir!

### 🎁 v0.7 — Meta Sistemler
- Sandık sistemi + açılış töreni; Dolap (avatar/kozmetik/ünvan/rozet)
- AchievementEngine + `achievements.json`; QuestEngine (günlük/haftalık) + görev panosu
- Günlük çalışma serisi bonusu
- ✅ Bitti kriteri: oyun döngüsü diyagramındaki her kutu canlı

### 📚 v0.8 — İçerik Tamamlama
- 7 bölümün tamamının harekât ve boss tanımları (`math-5-division.json` dolu)
- `dialogues.json` 150+ replik; problem şablonları zenginleşir
- İstatistik ekranı (ebeveyn köşesi)
- ✅ Bitti kriteri: müfredat sırasının tamamı oynanabilir

### ✨ v1.0 — Cila ve Teslim
- Animasyon/ses cilası, responsive tarama (tablet dikey/yatay, telefon, PC)
- Uç durum testi (bozuk kayıt, sıfırdan başlatma, gece yarısı görev sıfırlama)
- Performans: 60fps hedefi, parçacık bütçesi
- ✅ Bitti kriteri: "bir bölüm daha" testi — gerçek oyuncu (kızın) bırakamıyor 🙂

## 3. Sürüm Başına Çalışma Düzeni

Her sürümde sıra: **motor → içerik → görsel → ses → test**. Her sürüm sonunda:
1. `node build.js` → tek dosya üretilir ve gerçek tablette denenir
2. Kayıt uyumluluğu kontrol edilir (eski save yeni sürümde açılmalı)
3. `docs/CHANGELOG.md`'ye sürüm notu düşülür

## 4. Test Yaklaşımı

- `logic.js` saf fonksiyon olduğundan tarayıcı konsolunda çalışan mini test
  koşucusu (`tests.html`): bölme adım doğrulayıcısına 50+ vaka
  (kalanlı/kalansız, bölüm ortasında 0, ilk basamak yetersiz...)
- Uzun bölmede en riskli mantık: **bölüm rakamının 0 olduğu ara adımlar**
  (örn. 4218÷6) ve **ilk basamağın bölenden küçük olduğu** durumlar — test
  vakalarının yarısı bu iki aileden
- Adaptif sistem: sahte profille deterministik doğrulama

## 5. Riskler ve Önlemler

| Risk | Önlem |
|---|---|
| Uzun bölme UI'ı dokunmatikte hantal kalır | v0.2'de gerçek tablette erken deneme; hücreler ≥48px |
| Tek dosya build kırılgan olur | v0.1'den itibaren HER sürümde build test edilir (sona bırakılmaz) |
| Teach segmentleri kapsam şişirir | v1'de 3 sabit etkileşim modeliyle sınırla (drag-share, tap-groups, guided-first) |
| Replik yazımı gecikir | Her sürümde +30 replik kuralı; yazım kod işinden ayrı yürür |
| Çocuk testi geç kalır | v0.6 (ilk çalışan sürüm) doğrudan hedef kullanıcıya oynatılır; geri bildirim v0.7+ planını şekillendirir |
