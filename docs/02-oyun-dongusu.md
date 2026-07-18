# BOKUL — Aşama 2: Oyun Döngüsü

> Durum: Onay bekliyor (2026-07-18)
> Aşama 1 (Konsept): ✅ Onaylandı

---

## 1. Döngü Katmanları

Oyun iç içe 4 döngüden oluşur. Her katman bir üsttekini besler:

```
┌─ META DÖNGÜ (günler/haftalar) ──────────────────────────┐
│  Rütbe atla → Yeni cephe/bölüm aç → Koleksiyonu büyüt   │
│  ┌─ OTURUM DÖNGÜSÜ (10-20 dk) ───────────────────────┐  │
│  │  Üsse gir → Günlük görevlere bak → 2-4 harekât     │  │
│  │  ┌─ HAREKÂT DÖNGÜSÜ (3-5 dk) ──────────────────┐   │  │
│  │  │  3-6 hedef çöz → Yıldız + XP → Sandık barı   │   │  │
│  │  │  ┌─ HEDEF DÖNGÜSÜ (30-90 sn) ────────────┐   │   │  │
│  │  │  │  KEŞİF→TAHMİN→ÇARP→ÇIKAR→İNDİR        │   │   │  │
│  │  │  │  Her adımda anlık geri bildirim + XP  │   │   │  │
│  │  │  └───────────────────────────────────────┘   │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## 2. Hedef Döngüsü (çekirdek — 30-90 saniye)

Bir "hedef" = bir bölme sorusu. Akış:

1. Baba Komutan hedefi verir (kısa replik + soru kartı animasyonla gelir)
2. Oyuncu mikro-adımları sırayla çözer; **her doğru adımda**: yeşil parıltı + "tık" sesi + **+2 XP damlası**
3. Yanlış adımda: kart hafifçe sallanır (kırmızı yok, turuncu), ipucu balonu açılır, XP kaybı YOK
4. Hedef bitince: yıldız değerlendirmesi + XP ödülü + Baba Komutan repliği

**Yıldız sistemi (hedef başına):**

| Derece | Koşul | XP |
|---|---|---|
| ⭐⭐⭐ | Hatasız | +25 XP |
| ⭐⭐ | 1-2 hata | +15 XP |
| ⭐ | 3+ hata ama tamamlandı | +10 XP |

Yıldızlar aynı zamanda **sandık barını** doldurur (bkz. §5).

## 3. Harekât Döngüsü (görev — 3-5 dakika)

- 1 harekât = **3-6 hedef** (bölüm ilerledikçe artar)
- Harekâtlar tek tip değildir; bölüm içinde pedagojik bir ritim izler
  (bkz. Veri Modeli §0): 🎓 Keşif Brifingi (kavram öğretimi, CPA) →
  🤝 Ortak Harekât (rehberli) → ⚔️ Saha Görevi (bağımsız) →
  🧠 Yeni Nesil Operasyon (zenginleştirme) → 🔄 Devriye (aralıklı tekrar) → Boss
- Harekât sonu ekranı: toplam XP, kazanılan yıldızlar, seri durumu, **+20 XP tamamlama bonusu**
- Harekât haritada bir düğümdür; tamamlanınca yol bir sonraki düğüme açılır

**Seri (streak) bonusu:**
- Art arda **hatasız hedef** seriyi büyütür: 3 seri → XP ×1.5, 5 seri → XP ×2
- Hata seriyi bozar ama **hiçbir şey kaybettirmez** — sadece çarpan sıfırlanır
- Baba Komutan seriyi körükler: "Sürü seni izliyor Komutan, üçüncü hedef de düştü!"

## 4. Oturum Döngüsü (10-20 dakika)

Tipik bir oturum akışı:

1. **Üsse giriş** — Baba Komutan karşılar (günün ilk girişinde özel replik + günlük seri bonusu)
2. **Görev panosu** — günlük görevler görünür ("Komutan, bugün 3 emir var.")
3. **2-4 harekât** oynanır
4. **Sandık açma anı** — biriken sandık varsa oturum ortasında/sonunda açılır (dopamin zirvesi)
5. **Çıkış kancası** — kapatmadan önce ekranda hep "az kalan bir şey" gösterilir:
   "Bronz sandığa 2 yıldız kaldı" / "Günlük göreve 1 hedef kaldı"

**Günlük seri (login değil, ÇALIŞMA serisi):** Üst üste günlerde en az 1 harekât bitirmek
seriyi büyütür → gün başına +%10 XP bonusu (maks +%50). Seri kırılırsa sıfırlanmaz,
**2 kademe düşer** (çocuğu cezalandırmama ilkesi).

## 5. Ödül Ekonomisi

### XP kaynakları (özet tablo)

| Kaynak | XP |
|---|---|
| Doğru mikro-adım | +2 |
| Hedef (yıldıza göre) | +10 / +15 / +25 |
| Harekât tamamlama | +20 |
| Günlük görev | +50 |
| Haftalık görev | +200 |
| Konu Boss'u zaferi | +100 |
| Ünite Boss'u zaferi | +200 |

### Sandık sistemi

| Sandık | Nasıl kazanılır | İçerik |
|---|---|---|
| 🥉 Bronz | Her 10 yıldız | 1 yaygın kozmetik veya küçük XP paketi |
| 🥈 Gümüş | Günlük görevlerin hepsi | 1-2 kozmetik, nadir şansı |
| 🥇 Altın | Level atlama | Garantili nadir kozmetik |
| 💎 Epik | Konu Boss'u zaferi | Garantili epik kozmetik + rozet parçası |
| 🏆 Efsanevi | Ünite Boss'u zaferi | Garantili efsanevi kozmetik + özel ünvan |

- Sandık açılışı tören gibidir: sallanır, ışık saçar, içindekiler tek tek fırlar
- **Kopya (duplicate) koruması:** Açılmamış kozmetik bitmeden aynı şey çıkmaz
- Kozmetik türleri: avatar parçaları, avatar çerçeveleri, ünvanlar, harita süsleri, tema renkleri

### Level ve Rütbe

- Level eğrisi JSON'da tablo olarak durur (ayarlanabilir); taslak: `XP(n) = 100 + (n-1) × 75`
- Rütbeler level bantlarına bağlı:

| Level | Rütbe |
|---|---|
| 1-3 | Çaylak Komutan |
| 4-7 | Hedef Gözcüsü |
| 8-12 | Bölme Eri |
| 13-18 | Takım Lideri |
| 19-25 | Komutan Yardımcısı |
| 26-34 | Komutan |
| 35+ | Sürünün Gururu |

Rütbe töreni tam ekran bir andır: Baba Komutan rütbeyi takar, konfeti, yeni ünvan açılır.

## 6. Görev Sistemi

**Günlük görevler (her gün 3 adet, otomatik üretilir):**
- "3 hedef tamamla" / "1 harekâtı hatasız bitir" / "5 çıkarma adımını doğru yap"
- Adaptif sistemle bağlantılı: zorlanılan mikro-beceriye yönelik görev üretilir

**Haftalık görevler (her hafta 2 adet, daha büyük):**
- "20 hedef tamamla" / "10 tane 3★ kazan" / "1 boss yen"

## 7. Boss Savaşları ve Bölüm Ritmi

**Matematik Cephesi haritası:** 2 ünite, 7 bölüm (öğretim sırası) × her bölümde **8 harekât + 1 boss**.
Boss'lar iki kademedir: her bölümün sonunda bir **Konu Boss'u**, her ünitenin sonunda ise
çok daha güçlü bir **Ünite Boss'u** bekler.

| Ünite | Bölüm | Konu | Boss | Kademe |
|---|---|---|---|---|
| 1 | 1 | Tek basamaklı bölme mantığı | Bölünmez Kaya | Konu Boss'u |
| 1 | 2 | İki basamaklı bölünen | Çifte Kule | Konu Boss'u |
| 1 | 3 | Üç basamaklı bölünen | Üç Başlı Sayı Ejderi | Konu Boss'u |
| 1 | 4 | Dört basamaklı bölünen | **BASAMAK GOLEMİ** | ⚔️ ÜNİTE BOSS'U |
| 2 | 5 | Kalanlı bölme | Kalan Canavarı | Konu Boss'u |
| 2 | 6 | Zor sorular | Gölge Komutan | Konu Boss'u |
| 2 | 7 | Karışık görevler | **BÜYÜK SINAV MAKİNESİ** | ⚔️ ÜNİTE BOSS'U |

### Konu Boss'u (zayıf — VURAMAZ)

- Boss'un can barı var; oyuncunun canı/zırhı **YOK** — boss oyuncuya saldıramaz
- Her doğru mikro-adım boss'a hasar verir; 3★ hedef = kritik vuruş animasyonu
- Hata boss'a küçük bir "kalkan" verir (1 doğru adımla kırılır) — gerilim var, ceza yok
- Süre sınırı yok; boss yenilene kadar hedefler gelmeye devam eder
- Zafer: **+100 XP + Epik sandık + konu rozeti** + yeni bölümün kapısı açılır

### Ünite Boss'u (güçlü — VURUR!)

Ünitenin final sınavıdır; daha çok canı vardır ve **karşılık verir**:

- Oyuncunun **3 plakalık bir Zırh Barı** vardır (can değil, zırh — dil bilinçli seçildi)
- **Yanlış adımda boss saldırır:** oyuncunun yanlış cevabını kapar, topa çevirip
  oyuncuya fırlatır → 1 zırh plakası kırılır ("Kendi 8'inle vuruldun Komutan!")
- **3 ardışık doğru adım 1 zırh plakasını onarır** — toparlanma her zaman mümkün
- Zırh biterse bu bir "yenilgi" değil **"geri çekilme"dir**: Baba Komutan
  "Geri çekiliyoruz Komutan! Yeniden toplan, kale hâlâ orada." der.
  Tekrar denemede boss, verilen hasarın **yarısını üzerinde taşır** (yorgun başlar) —
  her deneme ilerlemedir, emek asla tamamen boşa gitmez. XP kaybı yoktur.
- Zafer: **+200 XP + Efsanevi sandık + ünite rozeti + özel ünvan**
  (Ünite 1: "Golem Deviren", Ünite 2: "Makine Söken")

Fark bilinçli: Konu boss'ları güven inşa eder ("vurulamam, sadece öğrenirim"),
Ünite boss'ları kazanılmış ustalığı taçlandırır ("artık karşılık verene karşı bile kazanırım").

**Bölüm kilidi (nazik):** Sonraki bölüm için önceki bölümde en az **16 yıldız** (24 üzerinden)
gerekir. Eksikse Baba Komutan yönlendirir: "Önce şu iki kaleyi sağlamlaştıralım Komutan."
Eski harekâtlar tekrar oynanabilir; yıldızlar yükseltilebilir (tamamlanmışçılığı besler).

## 8. Anti-Stres Kuralları (ekonominin anayasası)

1. XP **asla eksilmez** — hiçbir hata, hiçbir başarısızlık puan silmez
2. **Süre sayacı yok** (boss dahil hiçbir yerde geri sayım baskısı yok)
3. Can/enerji sistemi yok — istediği kadar oynar
4. Hata sadece yıldız derecesini etkiler; yıldız da her zaman tekrar oynayarak yükseltilebilir
5. Günlük seri kırılınca sıfırlanmaz, 2 kademe düşer
6. Her başarısız an bir Baba Komutan cesaretlendirmesiyle kapanır
