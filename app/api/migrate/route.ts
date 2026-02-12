import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = createClient();

    // Try to add missing columns by doing a test insert then delete
    // First check what columns exist by reading one row
    const { data: existing } = await supabase
      .from("payment_methods")
      .select("*")
      .limit(1);

    const sampleRow = existing?.[0];
    const missingColumns: string[] = [];

    if (sampleRow) {
      if (!("excel_kolon_adi" in sampleRow)) missingColumns.push("excel_kolon_adi");
      if (!("cekim_komisyon_orani" in sampleRow)) missingColumns.push("cekim_komisyon_orani");
    }

    // We can't ALTER TABLE via the REST API directly
    // Instead, use the Supabase SQL function if available
    // For now, report which columns are missing
    return NextResponse.json({
      status: "ok",
      existingColumns: sampleRow ? Object.keys(sampleRow) : [],
      missingColumns,
      message: missingColumns.length > 0
        ? `Missing columns: ${missingColumns.join(", ")}. Please run in Supabase SQL Editor: ${missingColumns.map(c => `ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS ${c} ${c === "excel_kolon_adi" ? "TEXT NOT NULL DEFAULT ''" : "NUMERIC NOT NULL DEFAULT 0"};`).join(" ")}`
        : "All columns present",
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
