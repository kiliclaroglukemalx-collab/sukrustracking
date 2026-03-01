# Veritabanı Kurulumu (Prisma)

## 0. Veritabanı — Klon ile Ayrı

Bu proje **yerel Docker PostgreSQL** kullanır (`docker-compose.yml`). Klon ile bağlantı yok. Kurulum: **docs/VERITABANI_AYIRMA.md** veya `pnpm db:setup`

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

### Mevcut SQL scriptleri ile tablolar varsa

Tablolar zaten `scripts/001_create_tables.sql` ile oluşturulduysa:

```bash
# Schema'yı mevcut DB'den çek (introspect)
npx prisma db pull

# Migration'ı "uygulandı" olarak işaretle
npx prisma migrate resolve --applied "migration_name"
```

## 4. Seed (Varsayılan Ödeme Yöntemleri)

```bash
npm run db:seed
```

`payment_methods` tablosu boşsa varsayılan yöntemleri ekler.

## 5. Prisma Studio (Görsel DB Yönetimi)

```bash
npm run db:studio
```

Tarayıcıda `http://localhost:5555` açılır.

## 6. Klon Verilerini Temizleme

Klonlanan projeden gelen eski verileri (bonus, kasa, yatırım performansı) siler.

```bash
# Terminalde proje klasöründe olmalısınız (cd sukrustracking)
npm run db:clear-cloned
```

## Komutlar Özeti

| Komut | Açıklama |
|-------|----------|
| `npm run db:generate` | Prisma Client oluştur |
| `npm run db:push` | Schema'yı DB'ye senkronize et |
| `npm run db:migrate` | Migration oluştur ve uygula |
| `npm run db:seed` | Seed verilerini yükle |
| `npm run db:studio` | Prisma Studio aç |
| `npm run db:clear-cloned` | Klon verilerini temizle (proje klasöründe çalıştırın) |
