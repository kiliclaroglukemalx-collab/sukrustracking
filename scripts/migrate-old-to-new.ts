/**
 * Eski Supabase → Yeni veritabanı migration
 *
 * .env'de:
 *   OLD_DATABASE_URL = eski Supabase (kaynak)
 *   DATABASE_URL     = yeni veritabanı (hedef)
 *
 * Çalıştırma: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-old-to-new.ts
 */

import "dotenv/config";
import pg from "pg";
import { randomUUID } from "crypto";

const OLD_URL = process.env.OLD_DATABASE_URL;
const NEW_URL = process.env.DATABASE_URL;

if (!OLD_URL || !NEW_URL) {
  console.error("HATA: .env'de OLD_DATABASE_URL ve DATABASE_URL tanımlı olmalı.");
  process.exit(1);
}

async function main() {
  const oldClient = new pg.Client({ connectionString: OLD_URL });
  const newClient = new pg.Client({ connectionString: NEW_URL });

  await oldClient.connect();
  await newClient.connect();

  try {
    // Hedef tablolar var mı?
    const tables = await newClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('payment_methods','app_settings','kasa_snapshots','cekim_raporlari')
    `);
    if (tables.rows.length < 4) {
      console.error("HATA: Hedef veritabanında gerekli tablolar yok. Önce çalıştırın: npm run db:push");
      process.exit(1);
    }

    // payment_methods'a cekim_komisyon_orani ekle (eski şemada yok)
    await newClient.query(`
      ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS cekim_komisyon_orani NUMERIC NOT NULL DEFAULT 0
    `);

    // cekim_raporlari id tipi (uuid mi bigint mi?)
    const cekimIdType = await newClient.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'cekim_raporlari' AND column_name = 'id'
    `);
    const cekimHasUuid = cekimIdType.rows[0]?.data_type === "uuid";

    console.log("Kaynak: OLD_DATABASE_URL");
    console.log("Hedef:  DATABASE_URL");
    console.log(`cekim_raporlari id: ${cekimHasUuid ? "uuid" : "bigint"}\n`);

    // 1. payment_methods (cekim_komisyon_orani = 0)
    console.log("\n--- payment_methods ---");
    const pmRows = await oldClient.query(
      `SELECT id, name, komisyon_orani, baslangic_bakiye, sort_order, created_at, updated_at FROM payment_methods`
    );
    let pmCount = 0;
    for (const r of pmRows.rows) {
      await newClient.query(
        `INSERT INTO payment_methods (id, name, komisyon_orani, cekim_komisyon_orani, baslangic_bakiye, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, 0, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           komisyon_orani = EXCLUDED.komisyon_orani,
           baslangic_bakiye = EXCLUDED.baslangic_bakiye,
           sort_order = EXCLUDED.sort_order,
           updated_at = EXCLUDED.updated_at`,
        [r.id, r.name, r.komisyon_orani, r.baslangic_bakiye, r.sort_order, r.created_at, r.updated_at]
      );
      pmCount++;
    }
    console.log(`  ✓ ${pmCount} kayıt`);

    // 2. app_settings
    console.log("\n--- app_settings ---");
    const asRows = await oldClient.query(`SELECT key, value, updated_at FROM app_settings`);
    let asCount = 0;
    for (const r of asRows.rows) {
      await newClient.query(
        `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
        [r.key, r.value, r.updated_at]
      );
      asCount++;
    }
    console.log(`  ✓ ${asCount} kayıt`);

    // 3. kasa_snapshots
    console.log("\n--- kasa_snapshots ---");
    const ksRows = await oldClient.query(
      `SELECT id, snapshot_hour, snapshot_date, total_kasa, total_yatirim, total_komisyon, total_cekim, details, created_at FROM kasa_snapshots`
    );
    let ksCount = 0;
    for (const r of ksRows.rows) {
      await newClient.query(
        `INSERT INTO kasa_snapshots (id, snapshot_hour, snapshot_date, total_kasa, total_yatirim, total_komisyon, total_cekim, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
         ON CONFLICT (id) DO UPDATE SET
           total_kasa = EXCLUDED.total_kasa,
           total_yatirim = EXCLUDED.total_yatirim,
           total_komisyon = EXCLUDED.total_komisyon,
           total_cekim = EXCLUDED.total_cekim,
           details = EXCLUDED.details`,
        [r.id, r.snapshot_hour, r.snapshot_date, r.total_kasa, r.total_yatirim, r.total_komisyon, r.total_cekim, JSON.stringify(r.details), r.created_at]
      );
      ksCount++;
    }
    console.log(`  ✓ ${ksCount} kayıt`);

    // 4. cekim_raporlari (id: bigint → uuid, sadece hedef uuid ise)
    console.log("\n--- cekim_raporlari ---");
    if (cekimHasUuid) {
      const crRows = await oldClient.query(`SELECT id, data, created_at FROM cekim_raporlari ORDER BY created_at ASC NULLS LAST`);
      let crCount = 0;
      for (const r of crRows.rows) {
        const newId = randomUUID();
        const createdAt = r.created_at || new Date();
        await newClient.query(
          `INSERT INTO cekim_raporlari (id, data, created_at) VALUES ($1, $2::jsonb, $3)`,
          [newId, typeof r.data === "string" ? r.data : JSON.stringify(r.data), createdAt]
        );
        crCount++;
      }
      console.log(`  ✓ ${crCount} kayıt (id bigint→uuid dönüştürüldü)`);
    } else {
      console.log(`  ⊘ Atlanıyor (veri zaten mevcut, id bigint)`);
    }

    console.log("\n✅ Migration tamamlandı!");
  } catch (e) {
    console.error("Hata:", e);
    throw e;
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
