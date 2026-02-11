-- Seed default payment methods (only if table is empty)
INSERT INTO payment_methods (name, komisyon_orani, baslangic_bakiye, sort_order)
SELECT name, komisyon_orani, baslangic_bakiye, sort_order FROM (VALUES
  ('Nakit', 0, 0, 0),
  ('Kredi Karti', 1.79, 0, 1),
  ('Banka Karti', 0.95, 0, 2),
  ('Havale/EFT', 0, 0, 3),
  ('Yemek Karti', 5.0, 0, 4),
  ('Online Odeme', 2.5, 0, 5),
  ('Multinet', 5.0, 0, 6),
  ('Sodexo', 5.0, 0, 7),
  ('Ticket', 5.0, 0, 8),
  ('Metropol', 5.0, 0, 9),
  ('Setcard', 5.0, 0, 10),
  ('iyzico', 2.99, 0, 11),
  ('PayPal', 3.4, 0, 12),
  ('Param', 2.79, 0, 13),
  ('Paycell', 2.5, 0, 14),
  ('Hopi', 3.0, 0, 15),
  ('Tosla', 2.5, 0, 16),
  ('Papara', 1.5, 0, 17),
  ('Cuzdan', 0, 0, 18),
  ('Acik Hesap', 0, 0, 19),
  ('Fis/Cek', 0, 0, 20),
  ('Garanti Pay', 2.2, 0, 21),
  ('QR Odeme', 1.8, 0, 22),
  ('Puan', 0, 0, 23)
) AS t(name, komisyon_orani, baslangic_bakiye, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM payment_methods LIMIT 1);
