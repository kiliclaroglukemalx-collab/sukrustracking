-- Seed default payment methods (only if table is empty)
INSERT INTO payment_methods (id, name, komisyon_orani, baslangic_bakiye, sort_order)
SELECT id, name, komisyon_orani, baslangic_bakiye, sort_order FROM (VALUES
  ('nakit', 'Nakit', 0, 0, 0),
  ('kredi-karti', 'Kredi Karti', 1.79, 0, 1),
  ('banka-karti', 'Banka Karti', 0.95, 0, 2),
  ('havale-eft', 'Havale/EFT', 0, 0, 3),
  ('yemek-karti', 'Yemek Karti', 5.0, 0, 4),
  ('online-odeme', 'Online Odeme', 2.5, 0, 5),
  ('multinet', 'Multinet', 5.0, 0, 6),
  ('sodexo', 'Sodexo', 5.0, 0, 7),
  ('ticket', 'Ticket', 5.0, 0, 8),
  ('metropol', 'Metropol', 5.0, 0, 9),
  ('setcard', 'Setcard', 5.0, 0, 10),
  ('iyzico', 'iyzico', 2.99, 0, 11),
  ('paypal', 'PayPal', 3.4, 0, 12),
  ('param', 'Param', 2.79, 0, 13),
  ('paycell', 'Paycell', 2.5, 0, 14),
  ('hopi', 'Hopi', 3.0, 0, 15),
  ('tosla', 'Tosla', 2.5, 0, 16),
  ('papara', 'Papara', 1.5, 0, 17),
  ('cuzdan', 'Cuzdan', 0, 0, 18),
  ('acik-hesap', 'Acik Hesap', 0, 0, 19),
  ('fis-cek', 'Fis/Cek', 0, 0, 20),
  ('garanti-pay', 'Garanti Pay', 2.2, 0, 21),
  ('qr-odeme', 'QR Odeme', 1.8, 0, 22),
  ('puan', 'Puan', 0, 0, 23)
) AS t(id, name, komisyon_orani, baslangic_bakiye, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM payment_methods LIMIT 1);
