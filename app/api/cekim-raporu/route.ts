import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BOT_API_KEY = process.env.BOT_API_KEY || "idils-bot-secret-2026";

/**
 * POST /api/cekim-raporu
 * Telegram botu çekim raporu analiz sonucunu gönderir.
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== BOT_API_KEY) {
      return NextResponse.json(
        { error: "Yetkisiz erisim" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.genel || !body.yontemler || !body.personel) {
      return NextResponse.json(
        { error: "Eksik veri: genel, yontemler, personel alanları zorunlu" },
        { status: 400 }
      );
    }

    const data = await prisma.cekimRaporu.create({
      data: {
        data: {
          genel: body.genel,
          yontemler: body.yontemler,
          personel: body.personel,
          darbogaz: body.darbogaz || [],
          red: body.red || {},
          idilNotlari: body.idilNotlari || {},
          analizZamani: body.analizZamani || new Date().toISOString(),
        },
      },
    });

    console.log(`[Cekim Raporu API] Rapor kaydedildi — ID: ${data.id}`);

    return NextResponse.json({
      success: true,
      id: String(data.id),
      createdAt: data.createdAt,
    });
  } catch (error: unknown) {
    console.error("[Cekim Raporu API] Hata:", error);
    const message = error instanceof Error ? error.message : "İşlem başarısız";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cekim-raporu
 * En son çekim raporunu döndürür.
 */
export async function GET() {
  try {
    const data = await prisma.cekimRaporu.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!data) {
      return NextResponse.json({ data: null, message: "Henüz rapor yok" });
    }

    return NextResponse.json({
      data: data.data,
      id: String(data.id),
      createdAt: data.createdAt,
    });
  } catch (error: unknown) {
    console.error("[Cekim Raporu API] GET Hata:", error);
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
