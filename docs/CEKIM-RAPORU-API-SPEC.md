# Çekim Raporu API Spesifikasyonu

Bot'unuzun Günün Çekim Performansı sayfasına veri göndermesi için bu API'yi kullanması gerekir.

## Endpoint

```
POST https://[SITENIZ]/api/cekim-raporu
```

## Headers

| Header     | Değer                                      |
|-----------|---------------------------------------------|
| Content-Type | application/json                         |
| x-api-key | `BOT_API_KEY` (.env'deki değer, varsayılan: `idils-bot-secret-2026`) |

## Zorunlu Alanlar

API şu 3 alanı **zorunlu** bekliyor: `genel`, `yontemler`, `personel`

## JSON Şeması

```json
{
  "genel": {
    "toplamBasariliCekim": 7396812,
    "basariliIslemSayisi": 1250,
    "toplamRedSayisi": 45,
    "toplamRedHacmi": 125000,
    "sistemGenelHizi": 5.2,
    "periodBaslangic": "26.02.2026 00:00",
    "periodBitis": "26.02.2026 23:59",
    "degisim": {
      "oncekiToplam": 6800000,
      "fark": 596812
    }
  },
  "yontemler": [
    {
      "name": "JEST HAVALE",
      "volume": 1592583,
      "avgDuration": 4.5,
      "txCount": 320,
      "yukYuzdesi": 21.5
    }
  ],
  "personel": [
    {
      "name": "Berkan",
      "islemSayisi": 85,
      "ortKararDk": 4.2,
      "performans": "basarili",
      "emoji": "🚀",
      "totalVolume": 450000,
      "hizDegisimi": "hizlandi",
      "oncekiDk": 5.1
    }
  ],
  "darbogaz": [],
  "red": {},
  "idilNotlari": {},
  "analizZamani": "2026-02-26T15:00:00.000Z"
}
```

## Alan Açıklamaları

### genel (zorunlu)
| Alan | Tip | Açıklama |
|------|-----|----------|
| toplamBasariliCekim | number | Toplam başarılı çekim hacmi (TL) |
| basariliIslemSayisi | number | Toplam işlem adedi |
| toplamRedSayisi | number | Reddedilen işlem sayısı |
| toplamRedHacmi | number | Red hacmi (TL) |
| sistemGenelHizi | number | Ortalama işlem süresi (dk) |
| periodBaslangic | string | Dönem başlangıç (örn: "26.02.2026 00:00") |
| periodBitis | string | Dönem bitiş |
| degisim.oncekiToplam | number | Önceki periyot toplamı |
| degisim.fark | number | Fark (artış/azalış) |

### yontemler (zorunlu)
| Alan | Tip | Açıklama |
|------|-----|----------|
| name | string | Ödeme yöntemi adı |
| volume | number | Toplam hacim (TL) |
| avgDuration | number | Ortalama işlem süresi (dk) |
| txCount | number | İşlem adedi |
| yukYuzdesi | number | Yük yüzdesi (0-100) |

### personel (zorunlu)
| Alan | Tip | Açıklama |
|------|-----|----------|
| name | string | Personel adı |
| islemSayisi | number | İşlem adedi |
| ortKararDk | number | Ortalama karar süresi (dk) |
| performans | string | `"basarili"` \| `"yeterli"` \| `"hizlanmali"` |
| emoji | string | Gösterilecek emoji |
| totalVolume | number | Toplam hacim (TL) |
| hizDegisimi | string \| null | `"hizlandi"` \| `"dustu"` \| `"ayni"` \| null |
| oncekiDk | number \| null | Önceki ortalama süre (dk) |

### darbogaz (opsiyonel, varsayılan: [])
| Alan | Tip | Açıklama |
|------|-----|----------|
| miktar | number | Bekleyen tutar (TL) |
| odemeSistemi | string | Ödeme sistemi adı |
| beklemeDk | number | Bekleme süresi (dk) |
| aciliyet | string | `"kirmizi"` \| `"sari"` \| `"yesil"` |
| durum | string | Örn: "Karar Bekliyor" |

### red (opsiyonel, varsayılan: {})
| Alan | Tip | Açıklama |
|------|-----|----------|
| toplamRed | number | Toplam red sayısı |
| toplamRedHacmi | number | Red hacmi (TL) |
| enSikNeden | string | En sık red nedeni |
| enSikNedenAdet | number | En sık nedenin adedi |
| nedenler | array | `[{ neden: string, adet: number }]` |

### idilNotlari (opsiyonel)
| Alan | Tip | Açıklama |
|------|-----|----------|
| yontem | string | Yöntem notu |
| personel | string | Personel notu |
| darbogaz | string | Darboğaz notu |
| red | string | Red notu |

## Örnek cURL

```bash
curl -X POST "https://your-site.com/api/cekim-raporu" \
  -H "Content-Type: application/json" \
  -H "x-api-key: idils-bot-secret-2026" \
  -d '{
    "genel": {
      "toplamBasariliCekim": 1000000,
      "basariliIslemSayisi": 50,
      "toplamRedSayisi": 2,
      "toplamRedHacmi": 5000,
      "sistemGenelHizi": 5.0,
      "periodBaslangic": "26.02.2026",
      "periodBitis": "26.02.2026",
      "degisim": { "oncekiToplam": 900000, "fark": 100000 }
    },
    "yontemler": [
      { "name": "HAVALE", "volume": 500000, "avgDuration": 4, "txCount": 25, "yukYuzdesi": 50 }
    ],
    "personel": [
      { "name": "Test", "islemSayisi": 25, "ortKararDk": 4, "performans": "basarili", "emoji": "✅", "totalVolume": 500000, "hizDegisimi": null, "oncekiDk": null }
    ]
  }'
```

## Başarılı Yanıt

```json
{
  "success": true,
  "id": "uuid",
  "createdAt": "2026-02-26T15:00:00.000Z"
}
```

## Hata Yanıtları

- **401**: Geçersiz veya eksik `x-api-key`
- **400**: Eksik veri — `genel`, `yontemler` veya `personel` alanları zorunlu
