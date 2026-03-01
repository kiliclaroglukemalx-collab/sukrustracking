/**
 * Sukrus Tracking Telegram Bot
 * - JSON (çekim raporu) → POST /api/cekim-raporu
 * - /durum, /cekim → özet sorgular
 */

import { Bot } from "grammy";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = (process.env.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const API_KEY = process.env.BOT_API_KEY || "idils-bot-secret-2026";

if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN gerekli. .env dosyasini kontrol edin.");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

const headers = {
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
};

function fmt(n: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n);
}

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
}

// --- Dosya upload (JSON) ---
bot.on("message:document", async (ctx) => {
  const doc = ctx.message.document;
  const name = doc.file_name?.toLowerCase() ?? "";

  if (name.endsWith(".json")) {
    await ctx.reply("Cekim raporu isleniyor...");
    try {
      const file = await ctx.getFile();
      const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error("Dosya indirilemedi");
      const body = await res.json();

      if (!body.genel || !body.yontemler || !body.personel) {
        await ctx.reply("JSON'da genel, yontemler, personel alanlari zorunlu.");
        return;
      }

      const uploadRes = await fetch(`${API_BASE}/api/cekim-raporu`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const json = await uploadRes.json();

      if (!uploadRes.ok) {
        await ctx.reply(`Hata: ${json.error ?? uploadRes.statusText}`);
        return;
      }

      const g = body.genel;
      const msg = [
        "✅ Cekim raporu kaydedildi",
        "",
        `📤 Toplam cekim: ₺${fmtCompact(g.toplamBasariliCekim ?? 0)}`,
        `📋 Islem sayisi: ${g.basariliIslemSayisi ?? 0}`,
        `👥 Personel: ${Array.isArray(body.personel) ? body.personel.length : 0}`,
      ].join("\n");

      await ctx.reply(msg);
    } catch (err) {
      console.error("[Cekim JSON upload]", err);
      await ctx.reply(`Hata: ${err instanceof Error ? err.message : "Islem basarisiz"}`);
    }
    return;
  }

  await ctx.reply("Sadece JSON (.json) dosyasi gonderin — cekim raporu icin.");
});

// --- JSON paste (alternatif: metin olarak JSON yapistirma) ---
bot.hears(/^\{[\s\S]*"genel"[\s\S]*"yontemler"[\s\S]*"personel"/, async (ctx) => {
  const text = ctx.message?.text;
  if (!text) return;

  await ctx.reply("Cekim raporu (JSON) isleniyor...");

  try {
    const body = JSON.parse(text);

    if (!body.genel || !body.yontemler || !body.personel) {
      await ctx.reply("JSON'da genel, yontemler, personel alanlari zorunlu.");
      return;
    }

    const uploadRes = await fetch(`${API_BASE}/api/cekim-raporu`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const json = await uploadRes.json();

    if (!uploadRes.ok) {
      await ctx.reply(`Hata: ${json.error ?? uploadRes.statusText}`);
      return;
    }

    const g = body.genel;
    await ctx.reply(
      `✅ Cekim raporu kaydedildi\n\n📤 Toplam: ₺${fmtCompact(g.toplamBasariliCekim ?? 0)}`
    );
  } catch {
    await ctx.reply("Gecersiz JSON. genel, yontemler, personel alanlari zorunlu.");
  }
});

// --- /start ---
bot.command("start", (ctx) =>
  ctx.reply(
    "Sukrus Tracking Bot\n\n" +
      "• JSON (.json) gonder → Cekim raporu kaydedilir\n" +
      "• /durum → Cekim ozeti\n" +
      "• /cekim → Son cekim raporu\n" +
      "• /help → Yardim"
  )
);

// --- /help ---
bot.command("help", (ctx) =>
  ctx.reply(
    "Komutlar:\n" +
      "/durum - Cekim ozeti\n" +
      "/cekim - Son cekim raporu ozeti\n\n" +
      "Dosya:\n" +
      "• JSON → Cekim raporu"
  )
);

// --- /durum ---
bot.command("durum", async (ctx) => {
  await ctx.reply("Veriler aliniyor...");

  try {
    const res = await fetch(`${API_BASE}/api/cekim-raporu`, {
      headers: { "x-api-key": API_KEY },
    });
    const cekim = await res.json();

    const lines: string[] = ["📊 GUNUN OZETI", ""];

    if (cekim.data) {
      const g = cekim.data.genel;
      lines.push("📤 CEKIM RAPORU");
      lines.push(`  Toplam: ₺${fmtCompact(g?.toplamBasariliCekim ?? 0)}`);
      lines.push(`  Islem: ${g?.basariliIslemSayisi ?? 0}`);
    } else {
      lines.push("📤 Cekim raporu yok. JSON dosyasi gonderin.");
    }

    await ctx.reply(lines.join("\n"));
  } catch (err) {
    console.error("[durum]", err);
    await ctx.reply(`Hata: ${err instanceof Error ? err.message : "Veri alinamadi"}`);
  }
});

// --- /kasa (kaldirildi) ---
bot.command("kasa", (ctx) =>
  ctx.reply("Kasa ozelligi kaldirildi. /cekim ile cekim raporu ozetini gorebilirsiniz.")
);

// --- /cekim ---
bot.command("cekim", async (ctx) => {
  try {
    const res = await fetch(`${API_BASE}/api/cekim-raporu`, {
      headers: { "x-api-key": API_KEY },
    });
    const json = await res.json();

    if (!json.data) {
      await ctx.reply("Cekim raporu yok. JSON dosyasi veya rapor gonderin.");
      return;
    }

    const g = json.data.genel;
    const yontemler = json.data.yontemler ?? [];
    const personel = json.data.personel ?? [];

    const lines = [
      "📤 CEKIM RAPORU",
      "",
      `Toplam cekim: ₺${fmtCompact(g?.toplamBasariliCekim ?? 0)}`,
      `Islem sayisi: ${g?.basariliIslemSayisi ?? 0}`,
      `Yontem: ${yontemler.length}, Personel: ${personel.length}`,
    ];

    await ctx.reply(lines.join("\n"));
  } catch (err) {
    console.error("[cekim]", err);
    await ctx.reply(`Hata: ${err instanceof Error ? err.message : "Veri alinamadi"}`);
  }
});

// --- Hata yakalama ---
bot.catch((err) => {
  console.error("Bot hatasi:", err);
});

bot.start().then(() => {
  console.log("Sukrus Tracking Bot calisiyor.");
});
