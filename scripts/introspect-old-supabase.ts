/**
 * Eski Supabase (supabase-indigo-zebra) şemasını çeker.
 * .env'e OLD_DATABASE_URL ekleyin (Supabase: Project Settings > Database > Connection string URI)
 *
 * Çalıştırma: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/introspect-old-supabase.ts
 */

import "dotenv/config";
import pg from "pg";

const OLD_URL = process.env.OLD_DATABASE_URL;
if (!OLD_URL) {
  console.error("HATA: .env dosyasına OLD_DATABASE_URL ekleyin.");
  console.error("Supabase: Project Settings > Database > Connection string (URI)");
  process.exit(1);
}

async function main() {
  const client = new pg.Client({ connectionString: OLD_URL });
  await client.connect();

  try {
    // 1. Tablolar
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log("\n=== TABLOLAR ===\n", tables.rows.map((r) => r.table_name).join(", "));

    // 2. Kolon yapıları
    const cols = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position
    `);
    console.log("\n=== KOLON YAPILARI ===\n");
    let lastTable = "";
    for (const r of cols.rows) {
      if (r.table_name !== lastTable) {
        lastTable = r.table_name;
        console.log(`\n--- ${r.table_name} ---`);
      }
      console.log(`  ${r.column_name}: ${r.data_type} ${r.is_nullable === "NO" ? "NOT NULL" : ""}`);
    }

    // 3. Kayıt sayıları
    const tableNames = tables.rows.map((r) => r.table_name);
    console.log("\n=== KAYIT SAYILARI ===\n");
    for (const t of tableNames) {
      try {
        const count = await client.query(`SELECT COUNT(*) as c FROM "${t}"`);
        console.log(`${t}: ${count.rows[0].c}`);
      } catch {
        console.log(`${t}: (sorgu hatası)`);
      }
    }

    // 4. cekim_raporlari örnek (varsa)
    if (tableNames.includes("cekim_raporlari")) {
      const sample = await client.query(
        `SELECT * FROM cekim_raporlari LIMIT 1`
      );
      if (sample.rows[0]) {
        console.log("\n=== CEKIM_RAPORLARI ÖRNEK ===\n");
        const row = sample.rows[0] as Record<string, unknown>;
        for (const [k, v] of Object.entries(row)) {
          const str = typeof v === "object" ? JSON.stringify(v).slice(0, 300) + "..." : String(v);
          console.log(`  ${k}: ${str}`);
        }
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("Bağlantı hatası:", e.message);
  process.exit(1);
});
