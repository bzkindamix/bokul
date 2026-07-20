# BOKUL — Derin Yaş Farklılaşması: Müfredat Belirlemesi (Matematik)

**Tarih:** 2026-07-20
**Kapsam:** Matematik omurgası (math-core), 1-5. sınıf
**Otorite:** MEB Türkiye Yüzyılı Maarif Modeli 2024 — İlkokul Matematik Öğretim Programı
**Kaynak:** https://tymm.meb.gov.tr/ogretim-programlari/ilkokul-matematik-dersi

---

## 1. Neden bu belge

Mevcut `curriculum.js` yalnızca 3 kaba bant (≤2 / 3-4 / 5+) uyguluyor; küçük çocuk "aynı soruyu daha az şıkla" görüyor, **yaşına ait ayrı konu görmüyor**. Ayrıca `math-core.json`'daki kazanım kodları sahte (`M.1-2.1`, `MAT.PAT`). Bu belge, farklılaşmayı **gerçek MEB öğrenme çıktılarına** ve **sınıf-bazlı konu kapılarına** oturtur.

## 2. Kod şeması (KARAR)

Güncel program: **`MAT.<sınıf>.<öğrenme alanı>.<çıktı no>`**
Öğrenme alanları (2. indeks):

| Kod | Alan |
|-----|------|
| `MAT.G.1.x` | Sayılar ve Nicelikler / Sayılar ve İşlemler |
| `MAT.G.2.x` | İşlemlerden Cebirsel Düşünmeye (4 işlem, eşitlik) |
| `MAT.G.3.x` | Nesnelerin Geometrisi (geometri + bazı ölçme) |
| `MAT.G.4.x` | Veriye Dayalı Araştırma |

> NOT: Piyasadaki bazı kaynaklar hâlâ **eski 2018** şemasını (`M.4.1.5.1`) yayınlıyor. Oyun **yalnızca 2024 `MAT.G.A.N` şemasını** kullanacak. Grade 1-2 kodları resmi kaynaktan birebir; grade 3-4-5 kodlarının tam çıktı numaraları uygulama sırasında resmi 3-4-5 programından kilitlenecek (alan eşlemesi kesin).

## 3. Sınıf × alan konu haritası

| Sınıf (yaş) | Sayılar & İşlemler | Geometri | Ölçme | Veri |
|---|---|---|---|---|
| **1 (6-7)** | 20'ye kadar sayı, ritmik sayma, 20'ye kadar +/− | temel şekil, yön/konum | tam saat, hafta, para tanıma | kategorik sınıflama |
| **2 (7-8)** | 100'e kadar, basamak, çarpmaya giriş (2·5·10) | basit simetri, örüntü | m-cm, yarım/çeyrek saat, lira-kuruş | 2 grup nesne grafiği |
| **3 (8-9)** | 1000'e kadar, çarpım tablosu, bölmeye giriş, birim kesir | simetri doğrusu, çokgen, cisim yüz/köşe | km/m/cm, kg/g, çevre | şekil grafiği → sıklık tablosu |
| **4 (9-10)** | büyük sayılar, 4 işlem, **uzun bölme**, paydası eşit kesir +/− | üçgen türleri, açı (dar/dik/geniş), alan | alan-çevre, zaman dönüşümü | sütun grafiği |
| **5 (10-11)** | milyonlar, işlem önceliği, kesir/ondalık işlem, yüzde giriş | çokgen, üçgen-dörtgen alan | dönüşümler | veri yorumlama/ortalama |

## 4. Oyun ünitesi → MEB çıktısı eşlemesi (UYGULAMA SÖZLEŞMESİ)

Her oyun bölümü şu üçlüyü taşıyacak: **MEB kodu + `minGrade` + `q.lvl`**.
`q.lvl` ↔ sınıf bağı: **1-2 → lvl 1 · 3-4 → lvl 2 · 5+ → lvl 3.**

| Oyun ünitesi/bölümü | MEB çıktısı (2024) | minGrade | q.lvl |
|---|---|---|---|
| Toplama (20'ye kadar) | `MAT.1.2.1` | 1 | 1 |
| Çıkarma (20'ye kadar) | `MAT.1.2.1` | 1 | 1 |
| Toplama-çıkarma (100'e kadar) | `MAT.2.2.1` / `MAT.2.2.3` | 2 | 1 |
| Çarpmaya giriş (2·5·10) | `MAT.2.2.4` | 2 | 1 |
| Çarpım tablosu (tam) | `MAT.3.1` (çarpma) | 3 | 2 |
| Bölmeye giriş (eşit paylaştırma) | `MAT.3.1` (bölme) | 3 | 2 |
| Birim kesir | `MAT.3.1` (kesir) | 3 | 2 |
| Büyük sayılarla 4 işlem | `MAT.4.1` | 4 | 2 |
| **Uzun bölme** (çok basamaklı) | `MAT.4.2` (bölme) | 4 | 2 |
| Kesirlerde +/− (payda eşit) | `MAT.4.1` (kesir) | 4 | 2 |
| İşlem önceliği / yüzde giriş | `MAT.5.x` | 5 | 3 |

## 5. Doldurulacak içerik boşlukları

`outcomes`'ta tanımlı ama **bölümü olmayan** konular (şu an ölü kod):
- **Geometri** (`o-geo`) → 1-4 arası şekil/simetri/açı bölümleri
- **Kesir** (`o-frac`) → 3-5 arası
- **Ölçme** (`o-meas` / `o-money`) → 1-4 arası saat/para/uzunluk
- **Örüntü** (`o-pattern`) → 1-3
- **Veri** (`o-data`) → 2-4

Her biri MC veya aritmetik tipinde, sınıf-kilitli (`minGrade`) ve `q.lvl` etiketli açılacak.

## 6. Kod değişiklik planı (onay sonrası)

1. **`math-core.json`**: `outcomes[].code` sahte kodlar → gerçek `MAT.G.A.N`; her section'a doğru `minGrade`; soru bankalarına `q.lvl`; eksik konu bölümlerini ekle.
2. **`curriculum.js`**: `ageBand` (3 bant) yerine **sınıf-çözünürlüklü** kapı: `topicUnlocked(section)` = `currentGrade() >= section.minGrade`; `q.lvl` sınıftan türetilir (`lvlForGrade(g)`); `mathCaps` korunur (üretici tavanı) ama artık minGrade ile tutarlı.
3. **QA:** her sınıf profili için (1→5) hangi bölümlerin göründüğü + üretilen soruların o sınıfa uygunluğu test edilir; regresyon (mevcut 5. sınıf akışı bozulmamalı).

## 7. Sonraki genişleme (bu belge dışı)
- İngilizce → MEB İngilizce (2-4), Bilim → Fen Bilimleri (3-4), Bakım → Hayat Bilgisi (1-3).
- AI / Felsefe: ilkokul müfredatı karşılığı yok → "karmaşıklık kademesi" olarak kalır.
