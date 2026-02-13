import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Bot API Key — .env.local dosyasında BOT_API_KEY olarak tanımlı
const BOT_API_KEY = process.env.BOT_API_KEY || "idils-bot-secret-2026";

/**
 * POST /api/cekim-raporu
 *
 * Telegram botu çekim raporu analiz sonucunu ve İdil notlarını bu endpoint'e gönderir.
 * Veri Supabase'deki cekim_raporlari tablosuna kaydedilir.
 * Dashboard bu tablodan en güncel veriyi çeker.
 *
 * Body (JSON):
 * {
 *   genel: { toplamBasariliCekim, basariliIslemSayisi, toplamRedSayisi, toplamRedHacmi, sistemGenelHizi, periodBaslangic, periodBitis, degisim },
 *   yontemler: [{ name, volume, avgDuration, txCount, yukYuzdesi }],
 *   personel: [{ name, islemSayisi, ortKararDk, performans, emoji, totalVolume, hizDegisimi, oncekiDk }],
 *   darbogaz: [{ miktar, odemeSistemi, beklemeDk, aciliyet, durum }],
 *   red: { toplamRed, toplamRedHacmi, enSikNeden, enSikNedenAdet, nedenler: [{ neden, adet }] },
 *   idilNotlari: { yontem, personel, darbogaz, red },
 *   analizZamani: string,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. API Key kontrolü
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== BOT_API_KEY) {
      return NextResponse.json(
        { error: "Yetkisiz erisim" },
        { status: 401 }
      );
    }

    // 2. Body'yi parse et
    const body = await req.json();

    if (!body.genel || !body.yontemler || !body.personel) {
      return NextResponse.json(
        { error: "Eksik veri: genel, yontemler, personel alanları zorunlu" },
        { status: 400 }
      );
    }

    // 3. Supabase bağlantısı
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // 4. cekim_raporlari tablosuna kaydet
    const { data, error } = await supabase
      .from("cekim_raporlari")
      .insert({
        data: {
          genel: body.genel,
          yontemler: body.yontemler,
          personel: body.personel,
          darbogaz: body.darbogaz || [],
          red: body.red || {},
          idilNotlari: body.idilNotlari || {},
          analizZamani: body.analizZamani || new Date().toISOString(),
        },
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("[Cekim Raporu API] Supabase insert hatası:", error);
      return NextResponse.json(
        { error: `Veritabanı hatası: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`[Cekim Raporu API] ✅ Rapor kaydedildi — ID: ${data.id}, zaman: ${data.created_at}`);

    return NextResponse.json({
      success: true,
      id: data.id,
      createdAt: data.created_at,
    });
  } catch (error: any) {
    console.error("[Cekim Raporu API] Hata:", error);
    return NextResponse.json(
      { error: error.message || "İşlem başarısız" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cekim-raporu
 *
 * En son çekim raporunu döndürür. Dashboard bu endpoint'i kullanır.
 * x-api-key gerekmez — public read.
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase
      .from("cekim_raporlari")
      .select("id, data, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ data: null, message: "Henüz rapor yok" });
    }

    return NextResponse.json({
      data: data.data,
      id: data.id,
      createdAt: data.created_at,
    });
  } catch (error: any) {
    console.error("[Cekim Raporu API] GET Hata:", error);
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    );
  }
}
