-- ============================================================
-- Eski Supabase (supabase-indigo-zebra) Şema Sorguları
-- Supabase Dashboard > SQL Editor'da çalıştırın
-- Sonuçları kopyalayıp karşılaştırma için kullanacağız
-- ============================================================

-- 1. Tüm public tabloları listele
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Her tablonun kolon yapısı (tablo adı, kolon, tip, nullable)
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- 3. cekim_raporlari tablosu var mı ve yapısı
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'cekim_raporlari'
ORDER BY ordinal_position;

-- 4. payment_methods kolonları
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'payment_methods'
ORDER BY ordinal_position;

-- 5. Kayıt sayıları (veri var mı?)
SELECT 
  (SELECT COUNT(*) FROM cekim_raporlari) as cekim_raporlari_count,
  (SELECT COUNT(*) FROM payment_methods) as payment_methods_count,
  (SELECT COUNT(*) FROM app_settings) as app_settings_count,
  (SELECT COUNT(*) FROM odeme_kayitlari) as odeme_kayitlari_count,
  (SELECT COUNT(*) FROM kasa_snapshots) as kasa_snapshots_count;
