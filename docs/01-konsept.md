# BOKUL — Aşama 1: Oyun Konsepti

> **BO**·**KUL** = **B**aba **O**kul → "Baba Okulu Eğitim Üssü"
> Durum: Onay bekliyor (2026-07-18)

---

## 1. Vizyon Cümlesi

**"Ders çalışmak" hissi vermeden matematik öğreten, babanın komutasındaki bir eğitim üssü.**
Çocuk oyunu kapattığında "bir görev daha yapayım" demeli; yanlış yapmak asla ceza değil,
bir sonraki saldırının istihbaratı olmalı.

---

## 2. Oyun Fantezisi (Player Fantasy)

Oyuncu bir öğrenci değildir. Oyuncu, **BOKUL Eğitim Üssü'ne yeni katılmış bir "Çaylak Komutan"dır.**

- Üs, dağların arasında gizli, renkli, yüksek teknolojili bir eğitim kampıdır.
- Her ders bir **"Harekât"**, her konu bir **"Cephe"**, her soru bir **"Hedef"tir.**
- Matematik soruları düşman değildir; **fethedilecek kalelerdir.** Uzun bölme, kale kapısını
  adım adım açan bir şifre çözme operasyonudur.
- Amaç: Rütbe atlayarak "Çaylak Komutan"dan **"Sürünün Gururu"** rütbesine yükselmek.

## 3. Baş Karakter: BABA KOMUTAN

Üssün kurucusu ve tek eğitmeni. Oyunun kalbi bu karakterdir.

| Özellik | Oyundaki karşılığı |
|---|---|
| Komik, hafif alaycı | Her doğru/yanlış cevaba, her ekran geçişine JSON'dan gelen kısa replikler |
| Disiplinli | Görevler "emir" formatında verilir: "Komutan, 3 hedef bekliyor." |
| Güven veren | Yanlış cevapta asla azarlamaz; taktik verir: "Yanlış yaptın ama savaş bitmedi." |
| Sürünün Lideri | Level atlama törenlerinde rütbeyi bizzat o takar |

**Replik sistemi konsepti:** Baba Komutan'ın yüzlerce kısa repliği `dialogues.json`
dosyasında, bağlama göre kategorilenmiş olarak durur:

- `greeting` — üsse giriş ("Hoş geldin Komutan, kalemin dolu mu?")
- `correct` — doğru adım ("Bu bölme işlemi senden daha inatçı çıkamadı.")
- `wrong_soft` — ilk hata ("Küçük bir sapma. Nişanı tazele.")
- `wrong_retry` — tekrar hata ("Tekrar saldır Komutan!")
- `hint` — ipucu ("Çarpım biraz büyük olmuş. Bir küçüğünü dene.")
- `streak` — seri ("Sürü seninle gurur duyuyor.")
- `levelup` — rütbe töreni
- `boss_intro` / `boss_win` — boss savaşı
- `idle` — oyuncu duraklarsa ("Kalemi sağlam tut, beyin birazdan fazla mesai yapacak.")
- `reward` — sandık/rozet ("Bu soruyu da geçersen akşam dondurma lobisine giriş izni var.")

Kural: **Hiçbir replik kırıcı, aşağılayıcı veya moral bozucu olamaz.** Alay her zaman
soruya veya duruma yöneliktir, asla çocuğa değil.

## 4. Pedagojik Konsept (İlk Ders: Uzun Bölme)

**Hedef cevabı buldurmak değil, algoritmanın mantığını içselleştirmek.**

Uzun bölme 5 mikro-adıma bölünür ve her adım ayrı doğrulanır:

1. **KEŞİF** — Bölünenin kaç basamağını ele alacağını seç ("İlk basamak yeterli mi?")
2. **TAHMİN** — Bölüm rakamını tahmin et
3. **ÇARP** — Tahmini bölenle çarp
4. **ÇIKAR** — Farkı bul (fark bölenden küçük olmalı — oyun bunu "kale kuralı" olarak öğretir)
5. **İNDİR** — Sonraki basamağı aşağı indir, döngü başa döner

Hata felsefesi:
- Yanlış adımda **cevap asla gösterilmez.**
- 1. hata → yumuşak ipucu ("Bölünen sayıya tekrar bak.")
- 2. hata → yönlendirici ipucu ("Çarpım biraz büyük olmuş. Bir küçüğünü dene.")
- 3. hata → adımın mantığını hatırlatan mini görsel açıklama
- Hata XP kaybettirmez; sadece o hedefin "yıldız" derecesini etkiler (3★ hatasız, 2★ az hatalı, 1★ tamamlandı).

**Adaptif öğrenme konsepti:** Sistem her mikro-adımın (tahmin, çarpma, çıkarma, indirme)
hata oranını ayrı izler. Oyuncu hangi adımda zorlanıyorsa o beceriyi çalıştıran hedefler
daha sık gelir; ustalaştıkça sayılar büyür ve süre baskısı olmadan zorluk artar.
Çocuk bunu asla bir "seviye testi" olarak hissetmez — sadece görevler değişir.

## 5. Oyun Hissi (Feel Pillars)

Brawl Stars + Minecraft'tan alınan **his** (kopya değil):

1. **Anında ödül** — her doğru adımda parıltı, ses "tık"ı, XP damlası (Brawl Stars'ın anlık geri bildirimi)
2. **Sürekli bir sonraki şey** — hep açılmak üzere olan bir sandık, dolmak üzere olan bir bar
3. **Kişiselleştirme gururu** — avatar, ünvan, kozmetikler (Minecraft'ın "benim dünyam" hissi)
4. **Kısa oturum, tam tatmin** — bir görev 3-5 dakika; tablet başında 15 dakikada anlamlı ilerleme
5. **Stressiz zorluk** — süre sayacı yok (boss savaşları hariç, orada da cömert), can sistemi yok

## 6. Hedef Kitle ve Ton

- **Birincil:** 10-12 yaş (5. sınıf), tablet + bilgisayar, dokunmatik öncelikli
- **Görsel ton:** Canlı, doygun renkler; yumuşak ama keskin hatlı "askeri kamp + neon" karışımı.
  Bebek işi değil — Brawl Stars'ın "çocuksu ama havalı" çizgisi.
- **Dil:** Tamamen Türkçe, kısa cümleler, komutan jargonu ("Harekât", "Hedef", "Rütbe", "Sürü")

## 7. Uzun Vadeli Konsept: BOKUL Platformu

BOKUL bir matematik oyunu değil, **ders-bağımsız bir eğitim üssü çatısıdır:**

- Her ders bir **"Cephe"** olarak dünya haritasına eklenir (Matematik Cephesi, Türkçe Cephesi, Fen Cephesi...)
- Bir cephe = bir JSON ders paketi (`lesson.json`): konular, soru üreticileri/soru bankası, ipuçları, rozetler
- Çekirdek motorlar (XP, sandık, rozet, diyalog, adaptif sistem) **ders içeriğinden tamamen bağımsızdır**
- Yeni ders eklemek = yeni JSON paketi eklemek. Kod değişmez.

## 8. Başarı Kriteri

Oyun şu üç cümleyi duyuruyorsa konsept çalışıyor demektir:

1. "Bir görev daha yapabilir miyim?" (bağlılık)
2. "Baba, bak hatasız çözdüm!" (öğrenme gururu)
3. "Bölerken önce kaç basamak alacağıma bakıyorum." (mantığın içselleşmesi)
