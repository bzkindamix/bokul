# BOKUL — Aşama 4: Veri Modeli

> Durum: Onay bekliyor (2026-07-18)
> Aşama 1-3: ✅ Onaylandı

Tüm içerik 6 JSON ailesinde yaşar. Motorlar yalnızca bu şemaları tanır.

---

## 0. Öğretim Modeli (Pedagojik Standart)

BOKUL'un ders tasarımı, Türkiye'nin seçkin özel okullarının (Bilfen ayarında)
zenginleştirilmiş müfredat anlayışı ile dünyada kanıtlanmış üç yöntemin birleşimidir:

1. **MEB kazanım uyumu + zenginleştirme (Bilfen tarzı):** Her bölüm resmi
   kazanım koduna bağlanır (örn. `M.5.1.2.6` — doğal sayılarda bölme). Kazanım
   MEB seviyesinde ÖĞRETİLİR, ama Bilfen tarzında bir üst seviyede PEKİŞTİRİLİR:
   yeni nesil sorular, gerçek hayat problemleri, analiz gerektiren hedefler.
2. **Somut → Görsel → Soyut (Singapur Matematiği, CPA):** Yeni kavram önce
   somut modelle (onluk bloklar, paylaştırma animasyonu), sonra görsel modelle
   (basamak tablosu, çizim), en son soyut algoritmayla (rakamlarla uzun bölme)
   verilir. Çocuk "neden"i görmeden "nasıl"a geçmez.
3. **Ustalık öğrenmesi (Khan Academy tarzı):** Kazanımda %80 ustalığa ulaşmadan
   boss kapısı açılmaz; ama bu bir duvar gibi değil, Baba Komutan'ın "önce şu
   kaleyi sağlamlaştıralım" yönlendirmesi gibi hissettirilir.
4. **Aralıklı tekrar (spaced repetition):** Öğrenilen kazanımlar 1-3-7 gün
   aralıklarla `review` harekâtları olarak haritaya geri döner; unutma eğrisi kırılır.

### Bölüm içi harekât dizilimi (8 harekât + boss, ritim standardı)

| # | Tip | Adı (oyun dilinde) | İçerik |
|---|---|---|---|
| 1 | `teach` | 🎓 Keşif Brifingi | CPA sıralı interaktif kavram anlatımı — Baba Komutan öğretir, çocuk her adımda dokunarak katılır |
| 2-3 | `guided` | 🤝 Ortak Harekât | Yarı çözülmüş hedefler; kritik adımı çocuk tamamlar, iskelet giderek azalır (scaffolding) |
| 4-6 | `practice` | ⚔️ Saha Görevi | Bağımsız tam çözüm (mevcut hedef döngüsü) |
| 7 | `challenge` | 🧠 Yeni Nesil Operasyon | Gerçek hayat problemi / çeldiricili / analiz sorusu — Bilfen zorluğu |
| 8 | `review` | 🔄 Devriye | Önceki kazanımlardan karışık tekrar (aralıklı tekrar sistemi doldurur) |
| 🏰 | `boss` | Boss Savaşı | Kazanım ustalığı ≥ %80 ise açılır |

Bu dizilim şablondur; ders paketi isterse farklı dizebilir (motor `type` alanını okur).

---

## 1. Ders Paketi — `content/lessons/<dersId>.json`

Bir "Cephe"nin tamamı. Yeni ders eklemek = bu şemada yeni bir dosya.

```jsonc
{
  "id": "math-5-division",
  "schema": 1,                      // ders paketi şema versiyonu
  "title": "Matematik Cephesi",
  "subtitle": "Uzun Bölme Harekâtı",
  "icon": "⚔️",
  "theme": "galaxy-base",           // UI tema anahtarı (Galaksi Üssü)
  "interactionType": "long-division", // varsayılan soru tipi plugin'i

  "outcomes": [                        // MEB kazanım bağları (bölümler bunlara işaret eder)
    { "id": "o1", "code": "M.5.1.2.5", "text": "Bölme işleminde bölüm ile kalanı tahmin eder." },
    { "id": "o2", "code": "M.5.1.2.6", "text": "Dört basamaklı sayıları iki basamaklı sayılara böler." }
  ],

  "units": [
    {
      "id": "u1",
      "title": "Ünite 1: Bölme Temelleri",
      "sections": [
        {
          "id": "s1",
          "title": "Tek Basamak Keşfi",
          "outcomeIds": ["o1"],
          "unlock": { "starsRequired": 0 },     // ilk bölüm hep açık
          "missions": [
            {
              "id": "s1m1",
              "type": "teach",                   // 🎓 Keşif Brifingi (CPA sıralı)
              "title": "Keşif Brifingi: Paylaştırma",
              "segments": [
                { "model": "concrete",  "script": "teach.division.concrete",
                  "interaction": "drag-share" },      // 12 kutuyu 3 birliğe sürükleyerek paylaştır
                { "model": "pictorial", "script": "teach.division.pictorial",
                  "interaction": "tap-groups" },      // basamak tablosunda grupla
                { "model": "abstract",  "script": "teach.division.abstract",
                  "interaction": "guided-first" }     // ilk soyut işlemi birlikte yaz
              ]
            },
            {
              "id": "s1m2",
              "type": "guided",                  // 🤝 Ortak Harekât (scaffolding)
              "title": "Ortak Harekât",
              "targetCount": 3,
              "scaffold": { "prefilledSteps": ["select", "estimate"], "fadeOut": true },
              "generator": { "divisorRange": [2, 5], "dividendDigits": 1, "remainder": false }
            },
            {
              "id": "s1m4",
              "type": "practice",                // ⚔️ Saha Görevi (bağımsız çözüm)
              "title": "İlk Devriye",
              "targetCount": 3,
              "generator": { "divisorRange": [2, 5], "dividendDigits": 1, "remainder": false }
            },
            {
              "id": "s1m7",
              "type": "challenge",               // 🧠 Yeni Nesil Operasyon
              "title": "Yeni Nesil Operasyon",
              "targetCount": 2,
              "generator": { "divisorRange": [2, 6], "dividendDigits": 2,
                             "context": "word-problem" },
              "problemTemplates": [              // gerçek hayat bağlamları
                "Komutan {name}, {dividend} kutu malzemeyi {divisor} takıma eşit dağıtacak...",
                "{dividend} askerlik erzak, günde {divisor} asker doyuruyorsa..."
              ]
            },
            {
              "id": "s1m8",
              "type": "review",                  // 🔄 Devriye (aralıklı tekrar doldurur)
              "title": "Devriye",
              "targetCount": 4,
              "source": "spaced-repetition"      // içerik ProgressManager'dan gelir
            }
            // ... diğer harekâtlar (§0'daki 8'li ritim)
          ],
          "boss": {
            "id": "boss-s1",
            "tier": "topic",                     // topic | unit
            "name": "Bölünmez Kaya",
            "icon": "🪨",
            "hp": 60,                            // toplam hasar ihtiyacı
            "unlock": { "masteryRequired": 0.8 },// kazanım ustalığı %80 → kapı açılır
            "generator": { "divisorRange": [2, 6], "dividendDigits": 1 },
            "rewards": { "xp": 100, "chest": "epic", "badge": "b-s1" }
          }
        }
        // ... s2, s3
        // s4'ün boss'u: { "tier": "unit", "name": "Basamak Golemi",
        //                "armor": 3, "hp": 150, "regroupHpCarry": 0.5,
        //                "rewards": { "xp": 200, "chest": "legendary",
        //                             "badge": "b-u1", "title": "t-golem" } }
      ]
    }
    // ... u2
  ],

  "hints": {                        // adım+deneme bazlı ipucu anahtarları
    "estimate": {
      "1": ["hint.estimate.soft.1", "hint.estimate.soft.2"],
      "2": ["hint.estimate.guide.1"],
      "3": ["hint.estimate.explain"]   // mini görsel açıklama tetikler
    },
    "multiply":  { "1": ["hint.multiply.soft.1"], "2": ["hint.multiply.guide.1"], "3": ["hint.multiply.explain"] },
    "subtract":  { "1": ["hint.subtract.soft.1"], "2": ["hint.subtract.guide.1"], "3": ["hint.subtract.explain"] },
    "bringdown": { "1": ["hint.bringdown.soft.1"], "2": ["hint.bringdown.guide.1"], "3": ["hint.bringdown.explain"] },
    "select":    { "1": ["hint.select.soft.1"],   "2": ["hint.select.guide.1"],   "3": ["hint.select.explain"] }
  },

  "skills": ["select", "estimate", "multiply", "subtract", "bringdown"]
  // ProgressManager'ın izleyeceği mikro-beceriler
}
```

**Not — soru bankası yerine üretici:** Matematikte sorular `generator` parametreleriyle
sonsuz üretilir (ezber imkânsız). Türkçe gibi derslerde aynı alana
`"bank": [ {question...}, ... ]` konur; QuestionEngine ikisini de destekler.

## 2. Replikler — `content/dialogues.json`

```jsonc
{
  "schema": 1,
  "speaker": { "name": "Baba Komutan", "avatar": "commander" },
  "pools": {
    "greeting":      ["Hoş geldin Komutan, kalemin dolu mu?", "Üs seni bekliyordu Komutan.", ...],
    "greeting.firstOfDay": ["Günün ilk harekâtı! Sürü uyanıyor.", ...],
    "correct":       ["Komutan, matematik senden kaçamaz.", "Bu bölme işlemi senden daha inatçı çıkamadı.", ...],
    "correct.streak3": ["Üçüncü hedef de düştü. Sürü seni izliyor!", ...],
    "wrong.soft":    ["Küçük bir sapma. Nişanı tazele.", "Yanlış yaptın ama savaş bitmedi.", ...],
    "wrong.retry":   ["Tekrar saldır Komutan!", ...],
    "idle":          ["Kalemi sağlam tut, beyin birazdan fazla mesai yapacak.", ...],
    "levelup":       ["Sürünün lideri olarak bu rütbeyi onaylıyorum!", ...],
    "levelup.denied.joke": ["Sürünün lideri olarak buna henüz onay veremiyorum. Ama çok az kaldı!", ...],
    "boss.intro.topic": ["Karşında {bossName}. Sakin ol, o sana vuramaz bile.", ...],
    "boss.intro.unit":  ["Dikkat Komutan! {bossName} karşılık verir. Zırhını kontrol et!", ...],
    "boss.playerHit":   ["Kendi {wrongAnswer}'inle vuruldun Komutan! Zırh dayanıyor.", ...],
    "boss.retreat":     ["Geri çekiliyoruz Komutan! Yeniden toplan, kale hâlâ orada.", ...],
    "boss.win":         ["Kale düştü! Bu akşam dondurma lobisine giriş izni var.", ...],
    "reward":        ["Sandık senin Komutan. Açarken gözlerini kırpma.", ...],
    "hint.estimate.soft.1":  "Bölünen sayıya tekrar bak.",
    "hint.estimate.guide.1": "Çarpım biraz büyük olmuş. Bir küçüğünü dene.",
    "hint.select.soft.1":    "İlk basamak yeterli mi?",
    "hint.subtract.soft.1":  "Harika gidiyordun, sadece küçük bir hata.",
    // ... her ipucu anahtarı tek metin, havuzlar dizi
  }
}
```

- `{bossName}`, `{wrongAnswer}`, `{playerName}` gibi yer tutucular DialogueManager'da doldurulur
- **Öğretim senaryoları** (`teach.division.concrete` gibi anahtarlar) ders paketinin
  `teachScripts` bölümünde yaşar: Baba Komutan'ın anlatım cümleleri + her cümleye
  eşlik eden görsel aksiyon adımı (`{ "say": "...", "action": "highlight-tens" }`).
  Böylece kavram anlatımı da tamamen veridir; motor sadece oynatır.
- **Tekrar önleme:** her havuzda son N replik tekrar seçilmez (N = havuz boyutuna göre)
- Hedef hacim: ilk sürümde ~150 replik, zamanla yüzlerce (sadece bu dosya büyür)

## 3. Ödül Ekonomisi — `content/rewards.json`

```jsonc
{
  "schema": 1,
  "xp": {
    "perStep": 2,
    "perQuestionByStars": { "1": 10, "2": 15, "3": 25 },
    "missionBonus": 20,
    "dailyQuest": 50, "weeklyQuest": 200,
    "bossTopic": 100, "bossUnit": 200,
    "streakMultipliers": { "3": 1.5, "5": 2.0 },
    "dailyStreakBonusPerDay": 0.10, "dailyStreakBonusMax": 0.50
  },
  "levels": { "base": 100, "perLevel": 75 },       // XP(n) = base + (n-1)*perLevel
  "ranks": [
    { "minLevel": 1,  "id": "rank1", "title": "Çaylak Komutan",     "icon": "🐣" },
    { "minLevel": 4,  "id": "rank2", "title": "Hedef Gözcüsü",      "icon": "🔭" },
    { "minLevel": 8,  "id": "rank3", "title": "Bölme Eri",          "icon": "🎖️" },
    { "minLevel": 13, "id": "rank4", "title": "Takım Lideri",       "icon": "⭐" },
    { "minLevel": 19, "id": "rank5", "title": "Komutan Yardımcısı", "icon": "🌟" },
    { "minLevel": 26, "id": "rank6", "title": "Komutan",            "icon": "👑" },
    { "minLevel": 35, "id": "rank7", "title": "Sürünün Gururu",     "icon": "🦁" }
  ],
  "chests": {
    "bronze":    { "trigger": "stars",      "every": 10, "drops": { "common": 80, "rare": 15, "xpPack": 5 } },
    "silver":    { "trigger": "dailyAll",               "drops": { "common": 50, "rare": 45, "epic": 5 } },
    "gold":      { "trigger": "levelup",                "drops": { "rare": 70, "epic": 30 } },
    "epic":      { "trigger": "bossTopic",              "drops": { "epic": 100 } },
    "legendary": { "trigger": "bossUnit",               "drops": { "legendary": 100 } }
  },
  "cosmetics": [
    { "id": "av-beret",   "type": "avatarPart", "slot": "hat",   "rarity": "common",    "name": "Komutan Beresi" },
    { "id": "fr-neon",    "type": "frame",                        "rarity": "rare",      "name": "Neon Çerçeve" },
    { "id": "th-night",   "type": "theme",                        "rarity": "epic",      "name": "Gece Harekâtı Teması" },
    { "id": "t-golem",    "type": "title",                        "rarity": "legendary", "name": "Golem Deviren" }
    // ... koleksiyon buradan büyür
  ]
}
```

## 4. Başarımlar — `content/achievements.json`

Koşullar bildirimseldir; AchievementEngine olay sayaçlarıyla değerlendirir:

```jsonc
{
  "schema": 1,
  "achievements": [
    { "id": "b-first",   "name": "İlk Bölmeci",          "icon": "🔰",
      "condition": { "event": "question:completed", "count": 1 } },
    { "id": "b-master",  "name": "Bölme Ustası",         "icon": "🛠️",
      "condition": { "event": "question:completed", "count": 100, "filter": { "stars": 3 } } },
    { "id": "b-monster", "name": "Matematik Canavarı",   "icon": "👾",
      "condition": { "stat": "stats.correct", "gte": 500 } },
    { "id": "b-ninja",   "name": "Uzun Bölme Ninja'sı",  "icon": "🥷",
      "condition": { "event": "mission:completed", "count": 10, "filter": { "flawless": true } } },
    { "id": "b-aide",    "name": "Komutan Yardımcısı",   "icon": "🎗️",
      "condition": { "stat": "player.level", "gte": 19 } },
    { "id": "b-pride",   "name": "Sürünün Gururu",       "icon": "🦁",
      "condition": { "stat": "player.level", "gte": 35 } }
  ]
}
```

## 5. Görev Şablonları — `content/quests.json`

Günlük/haftalık görevler şablonlardan üretilir; `skillBias: true` olanlar
ProgressManager'ın zayıf beceri profiline göre seçilir:

```jsonc
{
  "schema": 1,
  "daily": [
    { "id": "d-targets",  "text": "{n} hedef tamamla",             "n": [3, 5],  "track": "question:completed" },
    { "id": "d-flawless", "text": "1 harekâtı hatasız bitir",      "track": "mission:completed", "filter": { "flawless": true } },
    { "id": "d-skill",    "text": "{n} {skillName} adımını doğru yap", "n": [5, 8],
      "track": "step:answered", "filter": { "correct": true }, "skillBias": true }
  ],
  "weekly": [
    { "id": "w-targets", "text": "{n} hedef tamamla",  "n": [20, 30], "track": "question:completed" },
    { "id": "w-stars",   "text": "{n} tane 3★ kazan",  "n": [10, 15], "track": "question:completed", "filter": { "stars": 3 } },
    { "id": "w-boss",    "text": "1 boss yen",          "track": "boss:defeated" }
  ]
}
```

## 6. Kayıt Formatı — LocalStorage `bokul.save.v1`

Aşama 3 §7'deki GameState birebir serileştirilir. Ek kurallar:

- `meta.schemaVersion` — SaveManager migrasyon zinciri (`migrations[from] = fn`)
- Tarihler ISO string (`"2026-07-18"`), gün karşılaştırmaları yerel saatle
- `stats.perSkill` kayan pencere: beceri başına son 20 sonucun dizisi `[1,0,1,1,...]`
- Ayrı anahtar `bokul.settings` : `{ sound: true, volume: 0.8, playerName }`
- Bozuk kayıt algılanırsa: yedek anahtara kopyala (`bokul.save.corrupt`), temiz başlat,
  oyuncuya nazik mesaj — **asla sessizce silme**

## 7. Genel Ayar — `content/config.json`

```jsonc
{
  "schema": 1,
  "starThresholds": { "three": 0, "two": 2 },   // hata sayısı sınırları (3★: 0 hata, 2★: ≤2)
  "hintEscalation": [1, 2, 3],                  // kaçıncı hatada hangi ipucu seviyesi
  "adaptive": {
    "window": 20,                                // kayan pencere boyu
    "weakThreshold": 0.6,                        // ustalık altı → daha sık hedeflenir
    "strongThreshold": 0.85                      // üstü → parametreler zorlaşır
  },
  "mastery": {
    "bossGate": 0.8,                             // boss kapısı için kazanım ustalığı
    "reviewIntervalsDays": [1, 3, 7, 14]         // aralıklı tekrar takvimi
  },
  "unitBoss": { "armor": 3, "repairStreak": 3, "regroupHpCarry": 0.5 },
  "sectionUnlockStars": 16,
  "autoSaveDebounceMs": 2000,
  "idleDialogueSeconds": 25
}
```

---

## Şema Doğrulama

ContentRegistry her paketi yüklerken hafif bir doğrulayıcıdan geçirir
(zorunlu alanlar + tip kontrolü, bağımlılıksız ~50 satır). Hatalı içerik
oyunu kırmaz; konsola anlaşılır Türkçe hata basar ve o paket atlanır.
Böylece ileride el ile JSON düzenlerken yapılan yazım hataları güvenle yakalanır.
