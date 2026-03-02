# Veritabanı Kurulumu (Prisma)

Bu proje **yerel Docker PostgreSQL** kullanır (`docker-compose.yml`). Kurulum: **docs/VERITABANI_AYIRMA.md** veya `pnpm db:setup`

## 1. Ortam Değişkenleri

`.env` dosyası oluşturun (`.env.example` dosyasını kopyalayın):

```bash
cp .env.example .env
```

**DATABASE_URL** — Herhangi bir PostgreSQL veritabanı:

- **Supabase**: Dashboard → Project Settings → Database → Connection string (URI)
- **Neon**: Dashboard → Connection string
- **Railway**: PostgreSQL servisi → Connect → Connection URL
- **Local**: `postgresql://user:password@localhost:5432/dbname`

Örnek:
```
postgresql://USER:PASSWORD@HOST:5432/postgres
```

## 2. Build Notu

`DATABASE_URL` build sırasında da gereklidir (Vercel vb.). Geçerli bir PostgreSQL connection string kullanın; build sırasında gerçek bağlantı yapılmaz.

## 3. İlk Kurulum

### Tablolar henüz yoksa

```bash
npm run db:push
```

Schema'yı veritabanına uygular (migration dosyası oluşturmaz).

### Migration ile (önerilen)

```bash
npm run db:migrate
```

İlk migration oluşturulur ve uygulanır.

## 4. Seed (Varsayılan Ödeme Yöntemleri)

```bash
npm run db:seed
```

`payment_methods` tablosu boşsa varsayılan yöntemleri ekler.

## 5. Eski DB'den Veri Taşıma (Tek Seferlik)

Eski Supabase/veritabanından faydalı verileri taşımak için:

```bash
# .env'e OLD_DATABASE_URL ekleyin (eski DB connection string)
# Sonra:
pnpm db:migrate-from-old
```

Taşınan: `payment_methods`, `app_settings`, `cekim_raporlari`. Migration sonrası `.env`'den `OLD_DATABASE_URL` silebilirsiniz.

## 6. Prisma Studio (Görsel DB Yönetimi)

```bash
npm run db:studio
```

Tarayıcıda `http://localhost:5555` açılır.

## 7. Verileri Temizleme

Mevcut veritabanındaki rapor/çekim verilerini siler:

```bash
pnpm db:clear-cloned
```

## Komutlar Özeti

| Komut | Açıklama |
|-------|----------|
| `pnpm db:generate` | Prisma Client oluştur |
| `pnpm db:push` | Schema'yı DB'ye senkronize et |
| `pnpm db:migrate` | Migration oluştur ve uygula |
| `pnpm db:seed` | Seed verilerini yükle |
| `pnpm db:studio` | Prisma Studio aç |
| `pnpm db:migrate-from-old` | Eski DB'den veri taşı (tek seferlik) |
| `pnpm db:clear-cloned` | Rapor/çekim verilerini temizle |
