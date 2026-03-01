/**
 * Klonlanan projeden gelen verileri temizler.
 *
 * Bonus raporu, kasa ve yatırım performansı sayfalarındaki hatalı rakamlar
 * eski/klon veritabanından geliyorsa bu script ile temizlenir.
 *
 * Temizlenen veriler:
 *   - app_settings: bot_raw_rows, bot_kasa_data, bot_last_upload (kasa verisi)
 *   - app_settings: manuel_girisler (yatırım performansı manuel girişler)
 *   - cekim_raporlari: tüm kayıtlar (Personel Bonus Skoru)
 *   - kasa_snapshots: tüm kayıtlar (Yatırım Performansı aylık rapor)
 *
 * Çalıştırma (proje klasöründe):
 *   npm run db:clear-cloned
 *
 * Not: Terminalde proje kök dizininde (sukrustracking/) olmalısınız.
 */

import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Klon verileri temizleniyor...\n");

  // 1. report_data — tüm rapor verileri
  const reportDeleted = await prisma.reportData.deleteMany({});
  console.log(`  ✓ report_data: ${reportDeleted.count} kayıt silindi`);

  // 2. app_settings — eski bot verileri ve manuel girişler
  const keysToDelete = [
    "bot_raw_rows",
    "bot_kasa_data",
    "bot_last_upload",
    "manuel_girisler",
  ];
  for (const key of keysToDelete) {
    const deleted = await prisma.appSetting.deleteMany({ where: { key } });
    if (deleted.count > 0) {
      console.log(`  ✓ app_settings.${key} silindi`);
    }
  }

  // 3. cekim_raporlari (Personel Bonus Skoru)
  const cekimDeleted = await prisma.cekimRaporu.deleteMany({});
  console.log(`  ✓ cekim_raporlari: ${cekimDeleted.count} kayıt silindi`);

  console.log("\n✅ Klon verileri temizlendi.");
  console.log("\nSonraki adımlar:");
  console.log("  - Bonus raporu: Telegram botu cekim raporu göndersin");
  console.log("  - Yatırım Performansı: Excel ile günlük/geçmiş veri yükleyin");
}

main()
  .catch((e) => {
    console.error("Hata:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
