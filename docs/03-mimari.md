# BOKUL — Aşama 3: Yazılım Mimarisi

> Durum: Onay bekliyor (2026-07-18)
> Aşama 1 (Konsept): ✅ · Aşama 2 (Döngü): ✅

---

## 1. Mimari İlkeler

1. **Veri güdümlü (data-driven):** Tüm içerik (dersler, sorular, replikler, ödüller,
   boss'lar, rütbeler) veridir. Motorlar içeriği tanımaz; sadece yorumlar.
2. **Olay güdümlü (event-driven):** Modüller birbirini doğrudan çağırmaz;
   merkezi **EventBus** üzerinden konuşur. "XP ver" diye emir verilmez;
   "adım doğru cevaplandı" diye olay yayınlanır, ilgilenen herkes dinler.
3. **Açık/Kapalı (Open-Closed):** Yeni ders, soru tipi, ödül veya ekran eklemek
   mevcut kodu değiştirmez; kayıt (registry) mekanizmasıyla eklenir.
4. **Tek yönlü veri akışı:** Girdi → Motor → State değişimi → Olay → UI güncellenir.
   UI asla state'i doğrudan değiştirmez.
5. **Tek dosya çalışabilirlik:** Geliştirme çok dosyalı ve düzenlidir; basit bir
   build betiği her şeyi tek `bokul.html` içine gömer (bkz. §6).

## 2. Katman Diyagramı

```
┌─────────────────────────────────────────────────────────────┐
│  SUNUM KATMANI                                              │
│  UIManager (ekran yöneticisi) · AnimationEngine · HUD       │
├─────────────────────────────────────────────────────────────┤
│  OYUN KATMANI (motorlar — birbirini tanımaz)                │
│  LessonEngine · QuestionEngine · RewardEngine               │
│  AchievementEngine · ProgressManager (adaptif)              │
│  DialogueManager · AudioManager                             │
├─────────────────────────────────────────────────────────────┤
│  ÇEKİRDEK KATMAN                                            │
│  GameEngine (yaşam döngüsü) · EventBus · GameState          │
│  SaveManager · ContentRegistry (JSON yükleyici)             │
├─────────────────────────────────────────────────────────────┤
│  İÇERİK KATMANI (kod değil, saf veri)                       │
│  lessons/*.json · dialogues.json · rewards.json             │
│  achievements.json · config.json                            │
└─────────────────────────────────────────────────────────────┘
```

Bağımlılık kuralı: **Ok her zaman aşağı bakar.** Motorlar çekirdeği bilir,
çekirdek motorları bilmez. İçerik hiçbir şeyi bilmez.

## 3. Modül Sorumlulukları

| Modül | Tek sorumluluğu | Bilmediği şey |
|---|---|---|
| **GameEngine** | Başlatma sırası, ana yaşam döngüsü, modül kaydı | Oyun kuralları |
| **EventBus** | `on / off / emit` — tip güvenli olay sözlüğüyle pub/sub | Kimlerin dinlediği |
| **GameState** | Tüm oyun durumunun tek sahibi; sadece action'larla değişir | UI, ses, animasyon |
| **ContentRegistry** | JSON içerik paketlerini yükler, doğrular (şema), sunar | İçeriğin anlamı |
| **SaveManager** | State ↔ LocalStorage; şema versiyonu + migrasyon | Neyin neden kaydedildiği |
| **LessonEngine** | Ders paketini yorumlar: bölüm/harekât/hedef sıralaması, kilitler | Soru tipleri |
| **QuestionEngine** | Soru üretimi + adım doğrulama; soru tipleri **plugin** olarak kayıtlı | Ödüller, UI |
| **ProgressManager** | Mikro-beceri istatistikleri, adaptif zorluk/seçim ağırlıkları | Soruların içeriği |
| **RewardEngine** | XP, level, seri, sandık, kozmetik ekonomisi | Soruların doğruluğu |
| **AchievementEngine** | Rozet/başarım koşullarını olaylardan izler | Ödül dağıtımı (Reward'a olay atar) |
| **DialogueManager** | Bağlama göre Baba Komutan repliği seçer; tekrar önleme | Oyun kuralları |
| **AudioManager** | Web Audio API sentez efektleri (preset kütüphanesi) | Ne zaman çalınacağı (olay dinler) |
| **AnimationEngine** | Parçacıklar (canvas), sayı uçuşları, ekran geçiş yardımcıları | Oyun durumu |
| **UIManager** | Ekran yönlendirici (router) + ekran bileşenleri + HUD | İş mantığı |

## 4. Olay Sözlüğü (çekirdek sözleşme)

Modüller arası tüm iletişim bu isimli olaylarla olur (tam liste `events.js`'de sabit olarak):

```
// Soru akışı
question:started        { questionId, lessonId, type }
step:answered           { stepType, correct, attempt, value }
step:hint               { stepType, hintLevel }
question:completed      { stars, mistakes, durationMs }

// Ödül akışı
xp:gained               { amount, source }
level:up                { newLevel, newRank? }
streak:changed          { count, multiplier }
chest:earned            { chestType }
chest:opened            { chestType, items[] }
cosmetic:unlocked       { itemId }

// İlerleme
mission:completed       { missionId, stars, xp }
section:unlocked        { sectionId }
boss:damaged            { amount, remaining }
boss:attacked           { armorLeft }          // sadece Ünite Boss'u
boss:defeated           { bossId, tier }
achievement:unlocked    { achievementId }
quest:progress          { questId, current, target }
quest:completed         { questId }

// Sistem
game:saved / game:loaded / screen:changed
```

**Örnek zincir** — oyuncu çarpma adımını doğru yapar:
`QuestionEngine` doğrular → `step:answered {correct:true}` yayınlar →
`RewardEngine` +2 XP verir (`xp:gained`) → `AudioManager` "tık" çalar →
`AnimationEngine` XP damlası uçurur → `DialogueManager` (bazen) kısa replik gösterir →
`ProgressManager` "çarpma" becerisinin istatistiğini günceller.
**Hiçbiri diğerini çağırmadı.** Yeni bir tepki eklemek = yeni bir dinleyici eklemek.

## 5. Genişleme Noktaları (Open-Closed pratikte)

### a) Yeni ders eklemek (kod değişmez)
`content/lessons/turkce-5.json` eklenir → ContentRegistry yükler → LessonEngine
haritaya yeni Cephe olarak koyar. Ders paketi kendi soru tipi adlarını,
ipuçlarını, rozetlerini ve boss'larını içerir.

### b) Yeni soru tipi eklemek (tek plugin dosyası)
Soru tipleri QuestionEngine'e kayıtlı plugin'lerdir:

```js
// interactions/long-division.js
QuestionEngine.registerType('long-division', {
  generate(params, skillProfile) { /* soru üret (adaptif ağırlıklarla) */ },
  getSteps(question)             { /* KEŞİF..İNDİR adım listesi */ },
  validateStep(question, step, answer) { /* {correct, hintKey} */ },
});
```

Matematik dışı dersler için `multiple-choice`, `fill-blank`, `match-pairs` gibi
tipler aynı arayüzle eklenir. **LessonEngine ve UI değişmez** — her tipin kendi
küçük görünüm bileşeni vardır ve tip adıyla eşleşir.

### c) Yeni ekran eklemek
Ekranlar UIManager'a kayıtlı bileşenlerdir: `UIManager.registerScreen('map', MapScreen)`.

## 6. Çok Dosyalı Geliştirme → Tek Dosya Dağıtım

- **Geliştirme:** ES modülleri (`<script type="module">`), ayrı JSON dosyaları,
  yerel sunucuyla çalışır. Okunabilirlik ve bakım için ideal.
- **Dağıtım:** `build.js` (Node, bağımlılıksız) tüm JS'i sıralı birleştirir,
  JSON'ları `<script type="application/json" id="content-...">` blokları olarak
  gömer ve tek `bokul.html` üretir. Bu dosya **file:// ile çift tıklayınca çalışır**
  (fetch gerekmez; ContentRegistry önce gömülü blokları arar, yoksa fetch dener).
- Böylece hem "tek HTML dosyası" şartı sağlanır hem profesyonel dosya yapısı korunur.

## 7. State ve Kayıt Stratejisi

```js
GameState = {
  meta:    { schemaVersion, createdAt, lastPlayedAt },
  player:  { name, xp, level, rank, title, avatar: {...} },
  streaks: { current, best, dailyDays, lastPlayDate },
  stats:   { correct, wrong, perSkill: { estimate: {ok, fail}, multiply: {...}, ... } },
  progress:{ lessons: { 'math-5-division': { sections: { s1: { stars, missions: {...}, bossDefeated } } } } },
  inventory:{ cosmetics: [], badges: [], titles: [] },
  quests:  { daily: [...], weekly: [...], lastDailyReset, lastWeeklyReset },
}
```

- SaveManager **debounce'lu otomatik kayıt** yapar (her önemli olaydan sonra, en geç 2 sn)
- `schemaVersion` + migrasyon zinciri: gelecekte alan eklemek eski kayıtları bozmaz
- Kayıt anahtarı: `bokul.save.v1` (+ `bokul.settings`)

## 8. Adaptif Sistem Mimarisi (ProgressManager)

- Her mikro-beceri için basit bir **ustalık skoru** tutulur: `mastery = ok / (ok + fail)`
  üzeri kayan pencere (son 20 deneme) — eski hatalar sonsuza dek ceza olmaz.
- QuestionEngine soru üretirken ProgressManager'dan **ağırlık profili** ister:
  düşük ustalıklı beceriler daha sık hedeflenir; yüksek ustalıkta parametreler
  büyür (daha büyük bölünen, daha zor tahmin aralığı).
- Günlük görev üretici de aynı profili kullanır ("5 çıkarma adımını doğru yap"
  görevi, çıkarma ustalığı düşükse gelir).
- Tamamen deterministik ve şeffaf: `config.json`'daki eşiklerle ayarlanabilir.

## 9. SOLID Karşılıkları (özet)

- **S** — her modül tek iş (tablo §3); replik seçimi ile ses çalma ayrı modüllerde
- **O** — soru tipleri/ekranlar/dersler registry ile eklenir, çekirdek kapalı
- **L** — tüm soru tipleri aynı `InteractionType` arayüzünü doldurur, birbirinin yerine geçer
- **I** — motorlar EventBus'ın yalnızca `on/emit`'ini görür; dar arayüzler
- **D** — motorlar somut modüllere değil olaylara ve registry soyutlamalarına bağımlı
