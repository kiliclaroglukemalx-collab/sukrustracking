-- Payment Methods table: stores all configured payment methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  komisyon_orani NUMERIC NOT NULL DEFAULT 0,
  baslangic_bakiye NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- App Settings table: key-value store for app-level settings (video url, role, etc)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kasa Snapshots: stores hourly kasa snapshots for reporting/telegram
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

-- Create index for fast snapshot lookups by date
CREATE INDEX IF NOT EXISTS idx_kasa_snapshots_date ON public.kasa_snapshots(snapshot_date, snapshot_hour);

-- Disable RLS for now (no auth, single-user app)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasa_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow all access via anon key (single-user app, no auth)
CREATE POLICY "Allow all access to payment_methods" ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to kasa_snapshots" ON public.kasa_snapshots FOR ALL USING (true) WITH CHECK (true);
