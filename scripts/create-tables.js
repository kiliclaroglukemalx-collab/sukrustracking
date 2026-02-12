const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

async function run() {
  console.log("Checking Supabase connection:", SUPABASE_URL);

  // Test if payment_methods table exists
  const testRes = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods?select=id&limit=1`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (testRes.ok) {
    const data = await testRes.json();
    console.log("payment_methods table EXISTS. Current rows:", data.length);
  } else {
    console.log("payment_methods table NOT FOUND (status:", testRes.status, ")");
    console.log("\nPlease run this SQL in Supabase Dashboard -> SQL Editor -> New Query:\n");
    console.log(`
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

DROP POLICY IF EXISTS "Allow all access to payment_methods" ON public.payment_methods;
CREATE POLICY "Allow all access to payment_methods" ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to app_settings" ON public.app_settings;
CREATE POLICY "Allow all access to app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to kasa_snapshots" ON public.kasa_snapshots;
CREATE POLICY "Allow all access to kasa_snapshots" ON public.kasa_snapshots FOR ALL USING (true) WITH CHECK (true);
    `);
  }

  // Also test app_settings
  const settingsRes = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?select=key&limit=1`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  console.log("app_settings:", settingsRes.ok ? "EXISTS" : "NOT FOUND");

  // Also test kasa_snapshots
  const snapshotsRes = await fetch(`${SUPABASE_URL}/rest/v1/kasa_snapshots?select=id&limit=1`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  console.log("kasa_snapshots:", snapshotsRes.ok ? "EXISTS" : "NOT FOUND");
}

run().catch(console.error);
