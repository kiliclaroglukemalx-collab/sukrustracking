import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/migrate
 * Veritabani durumunu kontrol eder (Prisma ile).
 */
export async function POST() {
  try {
    const sample = await prisma.paymentMethod.findFirst();

    const missingColumns: string[] = [];
    if (sample) {
      // Prisma schema'da tanimli alanlar otomatik mevcut
      // Eksik kolon kontrolu artik Prisma migrations ile yapilir
      return NextResponse.json({
        status: "ok",
        existingColumns: Object.keys(sample),
        missingColumns,
        message: "Prisma schema ile senkronize. Eksik kolon icin: npm run db:push",
      });
    }

    return NextResponse.json({
      status: "ok",
      message: "payment_methods bos veya tablo yok. npm run db:push ile olusturun.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
