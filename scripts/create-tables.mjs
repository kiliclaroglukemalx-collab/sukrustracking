// Create tables in Supabase using the REST API (postgrest rpc)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const sql = `
-- Payment Methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  excel_kolon_adi TEXT NOT NULL DEFAULT '',
  komisyon_orani NUMERIC NOT NULL DEFAULT 0,
  cekim_komisyon_orani NUMERIC NOT NULL DEFAULT 0,
  baslangic_bakiye NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add new columns if table already exists (safe to run multiple times)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_methods' AND column_name='excel_kolon_adi') THEN
    ALTER TABLE public.payment_methods ADD COLUMN excel_kolon_adi TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_methods' AND column_name='cekim_komisyon_orani') THEN
    ALTER TABLE public.payment_methods ADD COLUMN cekim_komisyon_orani NUMERIC NOT NULL DEFAULT 0;
  END IF;
END $$;

-- App Settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kasa Snapshots
CREATE TABLE IF NOT EXISTS public.kasa_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_hour TEXT NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_kasa NUMERIC NOT NULL DEFAULT 0,
  total_yatirim NUMERIC NOT NULL DEFAULT 0,
  total_komisyon NUMERIC NOT NULL DEFAULT 0,
  total_cekim NUMERIC NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kasa_snapshots_date ON public.kasa_snapshots(snapshot_date, snapshot_hour);

-- RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasa_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent with DROP IF EXISTS)
DROP POLICY IF EXISTS "Allow all access to payment_methods" ON public.payment_methods;
CREATE POLICY "Allow all access to payment_methods" ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to app_settings" ON public.app_settings;
CREATE POLICY "Allow all access to app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to kasa_snapshots" ON public.kasa_snapshots;
CREATE POLICY "Allow all access to kasa_snapshots" ON public.kasa_snapshots FOR ALL USING (true) WITH CHECK (true);
`;

async function run() {
  console.log("Running migration against:", SUPABASE_URL);
  
  // Use Supabase's rpc endpoint to execute raw SQL
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    // rpc/exec_sql may not exist, try using the SQL editor API directly
    console.log("rpc/exec_sql not available, trying pg_net approach...");
    
    // Alternative: use supabase management API or just test direct table access
    // Let's try creating via individual REST calls to check if tables exist
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods?select=id&limit=1`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    
    if (testRes.status === 404 || testRes.status === 400) {
      console.error("Tables don't exist yet. Please run this SQL in the Supabase Dashboard SQL Editor:");
      console.log("\n" + sql + "\n");
      console.log("Go to: " + SUPABASE_URL.replace('.supabase.co', '') + " -> SQL Editor -> New Query -> Paste & Run");
    } else if (testRes.ok) {
      console.log("payment_methods table already exists!");
      const data = await testRes.json();
      console.log("Current rows:", data.length);
    } else {
      const errText = await testRes.text();
      console.error("Error checking table:", testRes.status, errText);
    }
  } else {
    console.log("Migration executed successfully!");
    const data = await res.json();
    console.log("Result:", data);
  }
}

run().catch(console.error);
