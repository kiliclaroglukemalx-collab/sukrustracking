# Sukrus Tracking Telegram Bot

Kasa Excel yükleme, çekim raporu gönderme ve özet sorgular için Telegram botu.

## Kurulum

1. [@BotFather](https://t.me/BotFather) ile yeni bot oluştur, token al
2. `telegram-bot/.env` oluştur:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
API_BASE_URL=http://localhost:3000
BOT_API_KEY=idils-bot-secret-2026
```

3. Bağımlılıkları yükle ve çalıştır:

```bash
pnpm bot:install
pnpm bot
```

Veya doğrudan:

```bash
cd telegram-bot && pnpm install && pnpm dev
```

## Özellikler

| Komut / İşlem | Açıklama |
|---------------|----------|
| JSON (.json) gönder | Çekim raporu → `/api/cekim-raporu` |
| JSON metin yapıştır | Aynı (genel, yontemler, personel zorunlu) |
| `/durum` | Çekim özeti |
| `/cekim` | Son çekim raporu özeti |
| `/start`, `/help` | Yardım |

## Gereksinimler

- Next.js uygulaması çalışıyor olmalı (`pnpm dev`)
- `BOT_API_KEY` ana proje `.env` ile aynı olmalı

---

## Railway ile Deploy

1. **Railway** projesi oluştur, GitHub repo'yu bağla
2. **Settings** → **Root Directory** → `telegram-bot` yaz
3. **Variables** sekmesinde ekle:

| Değişken | Değer |
|----------|-------|
| `TELEGRAM_BOT_TOKEN` | BotFather token |
| `API_BASE_URL` | Next.js URL (örn. `https://sukrustracking.vercel.app`) |
| `BOT_API_KEY` | Ana proje ile aynı |

4. **Deploy** — Railway otomatik build + start çalıştırır

> **Not:** Next.js uygulaması Vercel'de veya başka yerde deploy edilmiş olmalı. `API_BASE_URL` bu adresi göstermeli.
