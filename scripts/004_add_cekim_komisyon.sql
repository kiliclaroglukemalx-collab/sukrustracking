-- Add cekim_komisyon_orani column to payment_methods
ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS cekim_komisyon_orani NUMERIC NOT NULL DEFAULT 0;
