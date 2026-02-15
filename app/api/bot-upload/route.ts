import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseExcelFile, processExcelData } from "@/lib/excel-processor";
import type { PaymentMethod } from "@/lib/excel-processor";
import { DEFAULT_METHODS } from "@/lib/excel-processor";

// Bot API Key — .env dosyasina BOT_API_KEY olarak ekle
const BOT_API_KEY = process.env.BOT_API_KEY || "idils-bot-secret-2026";

/**
 * POST /api/bot-upload
 * 
 * Telegram botu bu endpoint'e Excel dosyasi gonderir.
 * Server-side olarak islenir ve sonuc Supabase'e kaydedilir.
 * Dashboard otomatik olarak bu veriyi yukler.
 * 
 * Headers:
 *   x-api-key: BOT_API_KEY
 * 
 * Body: FormData
 *   file: Excel dosyasi (.xlsx, .xls, .csv)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. API Key kontrolu
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== BOT_API_KEY) {
      return NextResponse.json(
        { error: "Yetkisiz erisim" },
        { status: 401 }
      );
    }

    // 2. Dosyayi al
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "Dosya bulunamadi" },
        { status: 400 }
      );
    }

    // 3. Excel'i isle (ayni logic: parseExcelFile + processExcelData)
    const buffer = await file.arrayBuffer();
    const rows = parseExcelFile(buffer);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Excel dosyasi bos veya okunamadi" },
        { status: 400 }
      );
    }

    // 4. Supabase'den mevcut payment methods'u al
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    let methods: PaymentMethod[] = DEFAULT_METHODS;
    
    const { data: methodsData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "methods_json")
      .single();
    
    if (methodsData?.value) {
      try {
        const parsed = JSON.parse(methodsData.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          methods = parsed;
        }
      } catch { /* use defaults */ }
    }

    // 5. Kasa verisini hesapla
    const kasaData = processExcelData(rows, methods);
    
    // Ozet bilgiler
    const totalKasa = kasaData.reduce((sum, k) => sum + k.kalanKasa, 0);
    const totalYatirim = kasaData.reduce((sum, k) => sum + k.toplamBorc, 0);
    const totalCekim = kasaData.reduce((sum, k) => sum + k.toplamKredi, 0);
    const totalKomisyon = kasaData.reduce((sum, k) => sum + k.komisyon, 0);

    // 6. Supabase'e kaydet (dashboard bunu okuyacak)
    const now = new Date().toISOString();

    await supabase
      .from("app_settings")
      .upsert(
        { key: "bot_kasa_data", value: JSON.stringify(kasaData) },
        { onConflict: "key" },
      );

    await supabase
      .from("app_settings")
      .upsert(
        { key: "bot_raw_rows", value: JSON.stringify(rows) },
        { onConflict: "key" },
      );

    await supabase
      .from("app_settings")
      .upsert(
        { key: "bot_last_upload", value: now },
        { onConflict: "key" },
      );

    // 7. Gunluk snapshot kaydet (haftalik kumulatif icin)
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const snapshotDetails = kasaData.map((k) => ({
      name: k.odemeTuruAdi,
      yatirim: k.toplamBorc,
      komisyon: k.komisyon,
      komisyonOrani: k.komisyonOrani,
      netYatirim: k.netBorc,
      cekim: k.toplamKredi,
      cekimKomisyon: k.cekimKomisyon,
      cekimKomisyonOrani: k.cekimKomisyonOrani,
      kalan: k.kalanKasa,
      baslangicBakiye: k.baslangicBakiye,
    }));

    // Oncekileri sil, sonra ekle (unique index olmadan guvenli)
    await supabase
      .from("kasa_snapshots")
      .delete()
      .eq("snapshot_hour", "daily")
      .eq("snapshot_date", today);

    await supabase
      .from("kasa_snapshots")
      .insert({
        snapshot_hour: "daily",
        snapshot_date: today,
        total_kasa: totalKasa,
        total_yatirim: totalYatirim,
        total_komisyon: totalKomisyon,
        total_cekim: totalCekim,
        details: snapshotDetails,
      });

    console.log(`[Bot Upload] Excel islendi: ${rows.length} satir, ${kasaData.length} yontem, toplam kasa: ${totalKasa.toLocaleString("tr-TR")}`);

    return NextResponse.json({
      success: true,
      summary: {
        totalKasa,
        totalYatirim,
        totalCekim,
        totalKomisyon,
        yontemSayisi: kasaData.length,
        satirSayisi: rows.length,
        yuklenmeTarihi: now,
      },
    });

  } catch (error: any) {
    console.error("[Bot Upload] Hata:", error);
    return NextResponse.json(
      { error: error.message || "Islem basarisiz" },
      { status: 500 }
    );
  }
}

// GET: Mevcut kasa verisini sorgula (opsiyonel)
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== BOT_API_KEY) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["bot_kasa_data", "bot_last_upload"]);

  const result: Record<string, any> = {};
  for (const row of data || []) {
    if (row.key === "bot_kasa_data") {
      try { result.kasaData = JSON.parse(row.value); } catch { result.kasaData = null; }
    } else if (row.key === "bot_last_upload") {
      result.lastUpload = row.value;
    }
  }

  return NextResponse.json(result);
}
