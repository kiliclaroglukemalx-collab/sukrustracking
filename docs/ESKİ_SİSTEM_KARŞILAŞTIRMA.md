# Eski Sistem (idilsdashboard-w8) vs Mevcut Sistem (sukrustracking) Karşılaştırması

Bu doküman, eski sistemin (`_old_system` — idilsdashboard-w8) ve mevcut sistemin (sukrustracking) çekim performans raporu açısından farklarını özetler.

---

## 0. Veritabanı Şema Karşılaştırması (Supabase-indigo-zebra introspect)

Eski Supabase (supabase-indigo-zebra) şeması `scripts/introspect-old-supabase.ts` ile çekildi.

| Tablo | Eski Sistem | Mevcut Sistem (Prisma) |
|-------|-------------|------------------------|
| app_settings | ✅ Var | ✅ Var |
| cekim_raporlari | ✅ Var (28 kayıt) | ✅ Var |
| kasa_snapshots | ✅ Var (12 kayıt) | ✅ Var |
| payment_methods | ✅ Var (21 kayıt) | ✅ Var |
| odeme_kayitlari | ❌ **Yok** | ✅ Var |

### cekim_raporlari farkları

| Alan | Eski | Mevcut |
|------|------|--------|
| id | `bigint` (serial) | `uuid` |
| data | `jsonb` | `json` |
| created_at | `timestamptz` (nullable) | `timestamptz` (NOT NULL) |

### payment_methods farkları

| Alan | Eski | Mevcut |
|------|------|--------|
| cekim_komisyon_orani | ❌ **Yok** | ✅ Var |
| Diğer kolonlar | Aynı | Aynı |

### Eski sistemde olmayan tablo

- **odeme_kayitlari** — Mevcut sistemde ödeme kayıtları için kullanılıyor; eski sistemde bu tablo yoktu.

---

## 1. Veri Kaynağı ve Veri Akışı

### Eski Sistem

```
Telegram Bot → POST /api/cekim-raporu → Supabase (cekim_raporlari)
                                              ↓
Dashboard ← GET /api/cekim-raporu ←───────────┘
```

- **Çekim raporu:** Sadece Telegram botundan gelen API verisi
- **Excel:** Kasa için kullanılır (hamburger menü, yatırım performansı). Çekim raporu sayfasında Excel yok
- **Boş durum:** "Telegram botu henüz bir çekim raporu göndermedi" — bot yoksa rapor yok

### Mevcut Sistem

```
Telegram Bot (YOK)     API (CekimRaporu DB)
       |                    |
       v                    v
Kasa Excel Upload ──► Kasa Fallback (kasaData → kasaFallbackYontemler)
       |                    |
       v                    v
   Store (kasaData) ──► Çekim Sayfası (hasData = API || kasaFallback)
```

- **Çekim raporu:** API + Kasa Excel fallback
- **Excel:** Çekim sayfasında KasaExcelUpload ile yüklenebilir
- **Boş durum:** Excel yoksa "Henüz veri yok" — Excel yükleyerek rapor gösterilebilir

---

## 2. Dosya ve Bileşen Karşılaştırması

| Bileşen | Eski Sistem | Mevcut Sistem |
|---------|-------------|---------------|
| `app/raporlar/cekim/page.tsx` | `app/(dashboard)/raporlar/cekim/page.tsx` |
| `useStore()` | `role` | `role`, `kasaData` |
| `hasData` | `genelData !== null && yontemData.length > 0` | `(genelData !== null && yontemData.length > 0) \|\| hasKasaFallback` |
| Excel fallback | Yok | `kasaFallbackYontemler` |
| KasaExcelUpload | Yok | Var |
| API route | `app/api/cekim-raporu/route.ts` | `app/api/cekim-raporu/route.ts` |
| Veritabanı | Supabase `cekim_raporlari` | Prisma `CekimRaporu` |
| `lib/excel-processor.ts` | PaymentRow: odemeTuruAdi, borc, kredi | + islemSayisi, sure; KasaCardData: + toplamIslem, ortalamaSure |

---

## 3. Veri Yapısı Farkları

### Excel / Kasa Verisi

| Alan | Eski | Mevcut |
|------|------|--------|
| PaymentRow | odemeTuruAdi, borc, kredi | + islemSayisi, sure |
| KasaCardData | toplamBorc, toplamKredi, ... | + toplamIslem, ortalamaSure |
| parseExcelFile | İşlem, Süre kolonları yok | İşlem, Süre kolonları desteklenir |

### Çekim Raporu API Verisi (her iki sistemde aynı)

- `genel`: toplamBasariliCekim, basariliIslemSayisi, toplamRedSayisi, toplamRedHacmi, sistemGenelHizi, periodBaslangic, periodBitis, degisim
- `yontemler`: name, volume, avgDuration, txCount, yukYuzdesi
- `personel`: name, islemSayisi, ortKararDk, performans, emoji, totalVolume, hizDegisimi, oncekiDk
- `darbogaz`: miktar, odemeSistemi, beklemeDk, aciliyet, durum
- `red`: toplamRed, toplamRedHacmi, enSikNeden, enSikNedenAdet, nedenler
- `idilNotlari`: yontem, personel, darbogaz, red

---

## 4. UI Bölümleri ve Veri Kaynağı

| Bölüm | Eski Sistem | Mevcut Sistem (API) | Mevcut Sistem (Excel Fallback) |
|-------|--------------|----------------------|--------------------------------|
| Genel KPI (6 kart) | genel | genel | kasaFallbackYontemler'den hesaplanan |
| Yöntem Sıralaması | yontemler | yontemler | kasaFallbackYontemler |
| Hız-Hacim Matrisi | yontemler | yontemler | kasaFallbackYontemler |
| Personel Karnesi | personel | personel | Gösterilmez (veri yok) |
| Darboğaz | darbogaz | darbogaz | Gösterilmez (veri yok) |
| Red Analizi | red | red | Gösterilmez (veri yok) |
| Yöntem Özet Kartları | yontemler | yontemler | kasaFallbackYontemler |
| İdil Notları | idilNotlari | idilNotlari | Gösterilmez (veri yok) |

---

## 5. Önemli Farklar Özeti

1. **Eski sistemde Excel fallback yok:** Çekim raporu tamamen Telegram botuna bağlıdır. Bot veri göndermezse rapor boş kalır.

2. **Mevcut sistemde Excel fallback var:** Kasa Excel yüklenerek yöntem bazlı çekim özeti gösterilebilir. Ancak personel, red, darboğaz için veri yok.

3. **Veritabanı:** Eski = Supabase; Mevcut = Prisma (muhtemelen Supabase veya PostgreSQL).

4. **Excel formatı:** Mevcut sistem İşlem ve Süre kolonlarını destekler; eski sistemde bu kolonlar yok.

5. **Boş durum:** Eski: "Telegram botu henüz bir çekim raporu göndermedi"; Mevcut: "Henüz veri yok" + Excel yükleme alanı.

---

## 6. Eksik Veriler (Excel Fallback ile)

Excel ile sadece yöntem bazlı veri sağlanır. Aşağıdakiler Excel'den gelmez:

- **Personel:** Berkan Risk, Arya Risk vb. — İşlem süresi performansı
- **Red:** Toplam red, red hacmi, red nedenleri dağılımı
- **Darboğaz:** Bekleyen işlemler

Bu verilerin gösterilmesi için:

- A) Telegram botunun yeniden devreye alınması
- B) Excel formatının genişletilmesi (personel, red, darboğaz için ek sheet/kolonlar)
- C) Ayrı bir veri kaynağından (API, manuel giriş) bu verilerin alınması

---

## 7. Klasör Yapısı

```
_old_system/                    sukrustracking/
├── app/                        ├── app/
│   ├── raporlar/               │   └── (dashboard)/
│   │   └── cekim/page.tsx      │       └── raporlar/
│   └── api/                    │           └── cekim/page.tsx
│       ├── cekim-raporu/       │       └── api/
│       └── bot-upload/         │           ├── cekim-raporu/
├── lib/                        │           └── bot-upload/
│   ├── store.tsx               ├── lib/
│   └── excel-processor.ts      │   ├── store.tsx
└── components/                 │   └── excel-processor.ts
    └── excel-uploader.tsx      └── components/
                                └── kasa-excel-upload.tsx
```

---

*Bu doküman `_old_system` (idilsdashboard-w8) clone edildikten sonra oluşturulmuştur.*
