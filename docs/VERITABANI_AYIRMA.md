# Tamamen Ayrı Veritabanı — Klon ile Bağlantı Yok

Bu proje **yerel Docker PostgreSQL** kullanır. Klonlanan sistemle hiçbir bağlantısı yoktur.

## Hızlı Kurulum

```bash
# 1. .env oluştur (yerel DB URL ile)
cp .env.example .env
# .env içinde: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sukrustracking"

# 2. Docker ile DB başlat + schema uygula + seed
pnpm db:setup
```

Bu kadar. Veritabanı tamamen sizin — klon ile paylaşım yok.

## Manuel Adımlar

```bash
# Docker PostgreSQL başlat
docker compose up -d

# Birkaç saniye bekleyin, sonra:
pnpm db:push
pnpm db:seed
```

## .env

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sukrustracking"
```

Bu URL sadece yerel Docker container'a işaret eder. Supabase veya eski klon ile ilgisi yoktur.

## Docker Yoksa: Neon (Ücretsiz)

1. [neon.tech](https://neon.tech) → Sign up → New Project
2. Connection string kopyalayın
3. `.env` içinde `DATABASE_URL` olarak yapıştırın
4. `pnpm db:push && pnpm db:seed`

Neon tamamen ayrı bir servis — klon ile bağlantı yok.
