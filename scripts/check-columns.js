const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  // Fetch all rows to see column structure
  const res = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods?select=*&limit=5`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  
  if (!res.ok) {
    console.log("ERROR:", res.status, await res.text());
    return;
  }
  
  const data = await res.json();
  console.log("Row count fetched:", data.length);
  
  if (data.length > 0) {
    console.log("Columns found:", Object.keys(data[0]));
    console.log("First row:", JSON.stringify(data[0], null, 2));
    
    // Check for missing columns
    const required = ["id", "name", "excel_kolon_adi", "komisyon_orani", "cekim_komisyon_orani", "baslangic_bakiye", "sort_order"];
    const existing = Object.keys(data[0]);
    const missing = required.filter(c => !existing.includes(c));
    
    if (missing.length > 0) {
      console.log("\nMISSING COLUMNS:", missing);
      console.log("\nRun this SQL in Supabase Dashboard:");
      for (const col of missing) {
        if (col === "excel_kolon_adi") {
          console.log(`ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS excel_kolon_adi TEXT NOT NULL DEFAULT '';`);
        } else if (col === "cekim_komisyon_orani") {
          console.log(`ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS cekim_komisyon_orani NUMERIC NOT NULL DEFAULT 0;`);
        }
      }
    } else {
      console.log("\nAll required columns exist!");
    }
  } else {
    console.log("Table is empty - cannot determine columns from empty table");
    // Try inserting a test row to see what columns are accepted
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        id: "test-col-check",
        name: "Test",
        excel_kolon_adi: "",
        komisyon_orani: 0,
        cekim_komisyon_orani: 0,
        baslangic_bakiye: 0,
        sort_order: 0,
      }),
    });
    
    if (testRes.ok) {
      const inserted = await testRes.json();
      console.log("Test insert OK, columns:", Object.keys(inserted[0]));
      // Delete the test row
      await fetch(`${SUPABASE_URL}/rest/v1/payment_methods?id=eq.test-col-check`, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      });
      console.log("Test row deleted");
    } else {
      const errText = await testRes.text();
      console.log("Test insert FAILED:", testRes.status, errText);
      if (errText.includes("excel_kolon_adi")) {
        console.log("\n-> excel_kolon_adi column is MISSING");
      }
      if (errText.includes("cekim_komisyon_orani")) {
        console.log("\n-> cekim_komisyon_orani column is MISSING");
      }
    }
  }
}

run().catch(console.error);
