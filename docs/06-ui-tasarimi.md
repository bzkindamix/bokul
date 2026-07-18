# BOKUL — Aşama 6: UI Tasarımı

> Durum: Onay bekliyor (2026-07-18)
> Aşama 1-5: ✅ Onaylandı
> Görsel önizleme: `docs/ui-preview.html`

---

## 1. Görsel Kimlik: "Galaksi Üssü"

10-12 yaş: çocuksu ama havalı. **Koyu mor gece** üzerinde elektrik sarısı ve
magenta neonlar — gizli bir uzay üssü atmosferi, Brawl Stars doygunluğu.
Bebek işi pastel YOK. (Not: Lacivert+camgöbeği bilinçli olarak KULLANILMAZ —
CADBİM kurumsal sitesiyle ayrışma kararı, 2026-07-18.)

### Renk Paleti (CSS token'ları — `base.css`)

| Token | Renk | Kullanım |
|---|---|---|
| `--bg-deep` | `#160F2E` | En dip zemin (galaksi gecesi, koyu mor) |
| `--bg-panel` | `#231A48` | Panel/kart zemini |
| `--bg-raised` | `#31245F` | Yükseltilmiş kart, buton zemini |
| `--ink` | `#F2EDFF` | Ana metin |
| `--ink-dim` | `#A79BC8` | İkincil metin |
| `--accent` | `#FF4FD8` | Magenta neon — vurgu, aktif durum, seçili öğe |
| `--action` | `#FF9F1C` | Ana aksiyon butonu (turuncu — "saldır" enerjisi) |
| `--xp` | `#FFD52E` | Elektrik sarısı — XP, yıldız, altın |
| `--success` | `#52E88C` | Doğru adım |
| `--warn` | `#FFB35C` | Hata durumu (KIRMIZI YOK — yumuşak turuncu) |
| `--epic` | `#9D6BFF` | Epik nadirlik, boss vurguları |
| `--legendary` | `#3DF2D2` | Efsanevi nadirlik (turkuaz ışıltı) |

Nadirlik renkleri: common `#A79BC8` · rare `#6FA8FF` · epic `--epic` · legendary `--legendary`

### Tipografi
- Harici font YOK (çevrimdışı tek dosya şartı): `system-ui` yığını,
  başlıklar `font-weight: 800` + hafif `letter-spacing`
- Bölme tahtasındaki rakamlar: `Consolas, monospace` — basamak hizası kusursuz olmalı
- Taban boyut 16px; dokunma hedefleri ≥ 48px

### Biçim Dili
- Köşe yarıçapı: kartlar 20px, butonlar 16px, çipler tam yuvarlak
- Neon kenar ışıması: aktif öğelerde `box-shadow: 0 0 12px var(--accent)`
- Butonlarda 3D "bası" hissi: alt kenarda koyu şerit, basınca 2px çöker
- Her ekran geçişi 200-250ms yumuşak kaydırma; ödül anları 400-600ms şölen

## 2. Ekran Envanteri ve Yerleşimler

### 2.1 Üs Ekranı (home)
- Üstte HUD: sol — avatar+rütbe; orta — XP barı (level çipiyle); sağ — ayarlar
- Merkezde Baba Komutan portresi + konuşma balonu (günün repliği)
- Altta 3 büyük kapı kartı: **HAREKÂT** (turuncu, en büyük — ana aksiyon),
  **GÖREVLER** (rozet sayaçlı), **DOLAP** (yeni kozmetik varsa nokta bildirimi)
- Köşede bekleyen sandık varsa sallanan sandık ikonu (dopamin kancası)

### 2.2 Harita Ekranı (map)
- Yatay kaydırmalı patika: harekât düğümleri (yıldızlı madalyonlar) →
  bölüm sonunda Konu Boss kalesi → ünite sonunda büyük Ünite Boss kalesi
- Düğüm tipleri ikonla ayrışır: 🎓 🤝 ⚔️ 🧠 🔄 🏰
- Kilitli düğüm: gri + asma kilit; sıradaki düğüm: neon nabız animasyonu
- Ustalık kapısı: boss kalesinin önünde ustalık göstergesi (%80 halkası)

### 2.3 Harekât Ekranı (mission) — oyunun kalbi
Yerleşim (tablet yatay, üç sütun):

```
┌────────────────────────────────────────────────────────┐
│ HUD: geri · hedef 2/4 ····· seri 🔥x3 ····· XP barı    │
├──────────┬────────────────────────────┬────────────────┤
│ KOMUTAN  │      BÖLME TAHTASI         │  ADIM RAYI     │
│ portre + │        ┌─────────          │  ① KEŞİF  ✔   │
│ konuşma  │   6 │ 4872                 │  ② TAHMİN ✔   │
│ balonu   │      │ 48        8?_       │  ③ ÇARP   ●   │
│ (ipucu   │      │ ──                  │  ④ ÇIKAR      │
│ burada   │      │ 07                  │  ⑤ İNDİR      │
│ çıkar)   │      │                     │                │
├──────────┴────────────────────────────┴────────────────┤
│   SAYI PEDİ:  1 2 3 4 5 6 7 8 9 0 · ⌫ · ✔ ONAYLA      │
└────────────────────────────────────────────────────────┘
```

- Aktif hücre neon çerçeveyle yanar; doğru girişte yeşil parıltı + XP damlası uçar
- Hatada tahta 150ms sallanır (turuncu), Komutan balonundan ipucu gelir
- Dikey/dar ekranda sütunlar üst üste akar (Komutan küçülüp köşeye yapışır)
- `teach` harekâtında tahta yerine CPA sahnesi gelir (sürüklenen kutular,
  basamak tablosu); aynı çerçeve, farklı içerik bileşeni

### 2.4 Boss Ekranı
- Üstte boss portresi + isim şeridi + **boss can barı** (segmentli)
- Konu Boss'u: sadece can barı; oyuncu tarafında hiçbir bar yok
- Ünite Boss'u: altta oyuncunun **3 zırh plakası** (kalkan ikonları);
  boss saldırısında plaka çatlama animasyonu + ekran hafif titreme (korkutmadan)
- Doğru adım → tahtadan boss'a enerji oku uçar, can düşer; 3★ hedef → kritik patlama
- Zafer: boss parçalanır, Efsanevi/Epik sandık sahneye düşer

### 2.5 Sandık Töreni (rewards)
- Karartılmış sahne ortasında sandık: sallanır → çatlar → ışık patlaması →
  içindekiler tek tek fırlar (nadirlik rengine göre ışıma)
- "DEVAM" butonu 1sn gecikmeli gelir (törenin tadı kaçmasın)

### 2.6 Dolap (locker)
- Sekmeler: Avatar · Çerçeve · Ünvan · Rozet · Tema
- Izgara kartlar; kilitliler siluet; "KUŞAN" butonu anında uygular
- Avatar önizlemesi solda canlı güncellenir

### 2.7 Görev Panosu (quests)
- "Bugünün Emirleri" (3 kart, ilerleme barlı) + "Haftalık Harekât" (2 büyük kart)
- Tamamlananda kart mühürlenir: "GÖREV TAMAM" damgası + ödül animasyonu

### 2.8 İstatistik (stats — ebeveyn köşesi)
- Beceri başına ustalık halkaları (keşif/tahmin/çarp/çıkar/indir)
- Toplam doğru/yanlış, en iyi seri, günlük çalışma serisi takvimi
- Sade, oyunsuz sunum — burası babanın karargâh masası

## 3. Ortak Bileşenler
- **Komutan balonu:** her yerde aynı bileşen; replik değişince yazı-makinesi efekti (hızlı)
- **XP damlası:** kazanılan noktadan HUD'daki bara uçan altın parçacık
- **Toast:** başarım/rozet bildirimi üstten süzülür, 2.5sn
- **Yıldız değerlendirme:** hedef sonunda tek tek dolan 3 yıldız + ses perdesi yükselir

## 4. Duyarlılık (Responsive) Kuralları
- Kırılımlar: ≥1024px üç sütun · 600-1023px iki sütun · <600px tek sütun dikey akış
- Tüm etkileşim dokunmatik öncelikli; fare hover'ı sadece süsleme
- `100dvh` tam ekran; tarayıcı çentik/çubuk güvenli alanları `env(safe-area-inset-*)`
- Yatay kilit YOK — her yönelimde çalışır, tahta yönelime göre yeniden akar

## 5. Erişilebilirlik ve Konfor
- Kontrast: metin/zemin ≥ 4.5:1 (koyu tema bunu kolaylaştırır)
- Hata asla kırmızı + asla ceza sesi; yumuşak "tekrar dene" tınısı
- Animasyon yoğunluğu `config.json`'dan kısılabilir (ileride "sakin mod")
- Ses açık/kapalı tek dokunuş (HUD ayar menüsünde)
