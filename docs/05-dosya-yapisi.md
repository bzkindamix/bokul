# BOKUL — Aşama 5: Dosya Yapısı

> Durum: Onay bekliyor (2026-07-18)
> Aşama 1-4: ✅ Onaylandı

---

## 1. Klasör Ağacı

```
bokul/
├── index.html                  # Geliştirme girişi (modülleri ve içerikleri yükler)
├── build.js                    # Tek dosya paketleyici (Node, sıfır bağımlılık)
├── dist/
│   └── bokul.html              # ÜRÜN: çift tıkla-oyna tek dosya (build çıktısı)
│
├── docs/                       # Tasarım dokümanları (bu aşama belgeleri)
│   ├── 01-konsept.md
│   ├── 02-oyun-dongusu.md
│   ├── 03-mimari.md
│   ├── 04-veri-modeli.md
│   └── 05-dosya-yapisi.md
│
├── src/
│   ├── core/                   # ÇEKİRDEK KATMAN (oyun kurallarından habersiz)
│   │   ├── event-bus.js        #   pub/sub + olay sözlüğü doğrulama
│   │   ├── events.js           #   tüm olay adları (tek gerçek kaynak)
│   │   ├── game-state.js       #   state sahibi + action'lar
│   │   ├── game-engine.js      #   yaşam döngüsü, modül kayıt/başlatma sırası
│   │   ├── content-registry.js #   JSON yükleme (gömülü blok → fetch) + şema doğrulama
│   │   └── save-manager.js     #   LocalStorage, debounce, migrasyon zinciri
│   │
│   ├── engines/                # OYUN KATMANI (yalnızca core'a ve olaylara bağımlı)
│   │   ├── lesson-engine.js    #   cephe/ünite/bölüm/harekât akışı, kilitler, ustalık kapısı
│   │   ├── question-engine.js  #   soru üretim/doğrulama çatısı + tip registry
│   │   ├── progress-manager.js #   mikro-beceri ustalığı, adaptif ağırlık, aralıklı tekrar
│   │   ├── reward-engine.js    #   XP, level, rütbe, seri, sandık, kozmetik
│   │   ├── achievement-engine.js # bildirimsel koşul değerlendirici
│   │   ├── quest-engine.js     #   günlük/haftalık görev üretimi ve takibi
│   │   ├── dialogue-manager.js #   replik seçimi, yer tutucu, tekrar önleme
│   │   └── audio-manager.js    #   Web Audio sentez preset'leri
│   │
│   ├── interactions/           # SORU TİPİ PLUGIN'LERİ (her biri bağımsız)
│   │   ├── long-division/
│   │   │   ├── logic.js        #   üretici + adım doğrulayıcı (saf mantık, DOM yok)
│   │   │   ├── view.js         #   uzun bölme tahtası bileşeni (dokunmatik)
│   │   │   └── teach-models.js #   CPA modelleri: drag-share, tap-groups, guided-first
│   │   └── _template/          #   yeni tip eklerken kopyalanacak iskelet
│   │
│   ├── ui/                     # SUNUM KATMANI
│   │   ├── ui-manager.js       #   ekran router + ortak HUD
│   │   ├── animation-engine.js #   parçacık canvas'ı, XP damlası, geçişler
│   │   ├── components/         #   küçük paylaşılan parçalar
│   │   │   ├── commander.js    #   Baba Komutan portresi + konuşma balonu
│   │   │   ├── progress-bar.js / star-rating.js / chest.js / toast.js
│   │   └── screens/            #   her ekran bir dosya
│   │       ├── home-screen.js      # üs (ana ekran)
│   │       ├── map-screen.js       # dünya haritası / cephe → bölüm → harekât
│   │       ├── mission-screen.js   # hedef çözme (teach/guided/practice/challenge/review)
│   │       ├── boss-screen.js      # konu + ünite boss savaşları
│   │       ├── rewards-screen.js   # sandık açma töreni
│   │       ├── locker-screen.js    # dolap: avatar, kozmetik, rozet, ünvan
│   │       ├── quests-screen.js    # görev panosu
│   │       └── stats-screen.js     # ebeveyn/oyuncu istatistikleri
│   │
│   └── styles/
│       ├── base.css            #   reset, değişkenler (renk/tipografi token'ları)
│       ├── components.css
│       └── screens.css
│
└── content/                    # İÇERİK KATMANI (saf veri — kod yok)
    ├── config.json
    ├── dialogues.json
    ├── rewards.json
    ├── achievements.json
    ├── quests.json
    └── lessons/
        └── math-5-division.json
        # gelecekte: turkce-5.json, fen-5.json, ingilizce-5.json ...
```

## 2. Adlandırma Kuralları

- Dosyalar `kebab-case.js`; sınıflar `PascalCase`; olaylar `alan:eylem` (`step:answered`)
- İçerik kimlikleri kısa ve öngörülebilir: ders `math-5-division`, bölüm `s1`,
  harekât `s1m4`, boss `boss-s1`, rozet `b-ninja`, kozmetik `av-beret`
- Her `src/` dosyasının başında 3-5 satır Türkçe sorumluluk açıklaması

## 3. Geliştirme Akışı

```
# Geliştirme (çok dosyalı, canlı)
cd bokul
python -m http.server 8000     # veya herhangi bir statik sunucu
# → http://localhost:8000

# Dağıtım (tek dosya üretimi)
node build.js
# → dist/bokul.html  (tablete/telefona at, çift tıkla, oyna)
```

## 4. build.js Sözleşmesi

Sıfır bağımlılıklı, ~100 satır Node betiği:

1. `index.html`'i şablon olarak okur
2. `src/**/*.js` dosyalarını **deterministik sırayla** (core → engines →
   interactions → ui → main) tek `<script>` bloğunda birleştirir
   (ES module import/export satırları basit kurallarla soyulur; modüller
   zaten global registry desenine uygun yazılır)
3. `content/**/*.json` dosyalarını
   `<script type="application/json" id="bokul-content-<ad>">` blokları olarak gömer
4. CSS'leri tek `<style>` bloğunda birleştirir
5. `dist/bokul.html` yazar ve boyut raporu basar

ContentRegistry çalışma sırası: önce gömülü blok arar (dist modu),
yoksa `fetch('content/...')` dener (dev modu). **Aynı kod iki ortamda da çalışır.**

## 5. Neden Bu Yapı?

- **Ders eklemek:** `content/lessons/` altına 1 JSON → build → biter
- **Soru tipi eklemek:** `interactions/_template/` kopyala, 3 dosya doldur, kaydet
- **Ekran eklemek:** `screens/` altına 1 dosya + `registerScreen`
- **Denge ayarı:** yalnızca `content/*.json` — kod dokunulmaz
- Çekirdek (`core/`) bir kez olgunlaşır, sonra neredeyse hiç değişmez —
  uzun ömürlü platform hedefinin taşıyıcı kolonu budur
