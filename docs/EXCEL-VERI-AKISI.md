# Excel Veri Akışı

Bu doküman, hangi Excel yüklemesinin hangi raporları etkilediğini açıklar.

**Her rapor kendi verisini tutar** — bir rapora yüklenen Excel diğer raporları etkilemez.

## Veritabanı: report_data Tablosu

| report_type | Açıklama |
|-------------|----------|
| kasa | Kasa sayfası, Dashboard, Ödeme paneli |
| cekim | Çekim Performansı (Excel fallback) |
| yatirim | Yatırım Performansı |
| analiz | Finansal Analiz |
| performans | Dış Finans Çekim Performansı |
| bonus | Bonus Raporu (opsiyonel kalıcı) |

## Rapor Bazlı Excel

**Format:** Yatırım, Çekim, İşlem, Süre kolonları (excel-processor) — tüm raporlar aynı formatı kullanır.

| Rapor | Yükleme yeri | Kayıt |
|-------|--------------|------|
| **Kasa** | Kasa sayfası | report_data kasa |
| **Çekim** | Çekim sayfası | report_data cekim |
| **Yatırım** | Yatırım Performansı | report_data yatirim + kasa_snapshots |
| **Analiz** | Analiz sayfası | report_data analiz |
| **Performans** | Performans sayfası | report_data performans |

**Önemli:** Her rapora yüklediğiniz Excel sadece o raporu etkiler.

---

## Bonus Excel (Farklı Format)

**Format:** Oluşturuldu, Adı, Sonuç, operator, BTag, Hesaplama/Miktar, Toplam Ödenen (clean-bonus-analyzer)

**Yükleme yeri:** Sadece Bonus Raporu sayfası

**Nereye kaydedilir:** Sayfa yerel state (geçici)

**Etkilenen raporlar:** Sadece Bonus Raporu
