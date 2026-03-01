"use server";

import { prisma } from "@/lib/prisma";
import type { PaymentMethod } from "@/lib/excel-processor";
import type { KasaCardData } from "@/lib/excel-processor";

// --- App Settings ---
export async function getSetting(key: string): Promise<string | null> {
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key },
    });
    return row?.value ?? null;
  } catch {
    return null;
  }
}

export async function saveSetting(key: string, value: string): Promise<void> {
  try {
    await prisma.appSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  } catch {
    /* silent */
  }
}

// --- Methods (app_settings.methods_json) ---
export async function getMethods(): Promise<PaymentMethod[] | null> {
  try {
    const val = await getSetting("methods_json");
    if (!val) return null;
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function syncMethods(methods: PaymentMethod[]): Promise<void> {
  try {
    await saveSetting("methods_json", JSON.stringify(methods));
  } catch {
    /* silent */
  }
}

// --- Rapor Bazlı Veri (her rapor kendi verisini tutar) ---
export type ReportType = "cekim" | "yatirim" | "analiz" | "performans" | "bonus";

export async function getReportData(
  reportType: ReportType
): Promise<{ rawRows: unknown[]; processedData: KasaCardData[] } | null> {
  try {
    const row = await prisma.reportData.findUnique({
      where: { reportType },
    });
    if (!row) return null;
    const rawRows = Array.isArray(row.rawRows) ? row.rawRows : [];
    const processedData = Array.isArray(row.processedData) ? (row.processedData as KasaCardData[]) : [];
    return { rawRows, processedData };
  } catch {
    return null;
  }
}

export async function saveReportData(
  reportType: ReportType,
  rawRows: unknown[],
  processedData: KasaCardData[]
): Promise<void> {
  try {
    await prisma.reportData.upsert({
      where: { reportType },
      create: {
        reportType,
        rawRows: rawRows as object,
        processedData: processedData as object,
      },
      update: {
        rawRows: rawRows as object,
        processedData: processedData as object,
      },
    });
  } catch {
    /* silent */
  }
}

// --- Ödemeler ---
export type IslemTipi = "odeme-yap" | "odeme-al" | "transfer";

export interface OdemeKaydiInput {
  id: string;
  no: string;
  tarih: string;
  islemTipi: IslemTipi;
  yontem: string;
  yontemId?: string;
  hedefYontem?: string;
  hedefYontemId?: string;
  tutar: number;
  dovizCinsi: string;
  kur?: number;
  tutarTL: number;
  gonderen: string;
  alici: string;
  aciklama: string;
  txKodu?: string;
}

export async function getOdemeler(): Promise<OdemeKaydiInput[]> {
  try {
    const rows = await prisma.odemeKaydi.findMany({
      orderBy: { tarih: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      no: r.no,
      tarih: r.tarih.toISOString(),
      islemTipi: r.islemTipi as IslemTipi,
      yontem: r.yontem,
      yontemId: r.yontemId ?? undefined,
      hedefYontem: r.hedefYontem ?? undefined,
      hedefYontemId: r.hedefYontemId ?? undefined,
      tutar: Number(r.tutar),
      dovizCinsi: r.dovizCinsi,
      kur: r.kur ? Number(r.kur) : undefined,
      tutarTL: Number(r.tutarTl),
      gonderen: r.gonderen ?? "",
      alici: r.alici ?? "",
      aciklama: r.aciklama ?? "",
      txKodu: r.txKodu ?? undefined,
    }));
  } catch {
    return [];
  }
}

export async function createOdeme(odeme: OdemeKaydiInput): Promise<void> {
  try {
    await prisma.odemeKaydi.create({
      data: {
        id: odeme.id,
        no: odeme.no,
        tarih: new Date(odeme.tarih),
        islemTipi: odeme.islemTipi,
        yontem: odeme.yontem,
        yontemId: odeme.yontemId ?? null,
        hedefYontem: odeme.hedefYontem ?? null,
        hedefYontemId: odeme.hedefYontemId ?? null,
        tutar: odeme.tutar,
        dovizCinsi: odeme.dovizCinsi,
        kur: odeme.kur ?? null,
        tutarTl: odeme.tutarTL,
        gonderen: odeme.gonderen,
        alici: odeme.alici,
        aciklama: odeme.aciklama,
        txKodu: odeme.txKodu ?? null,
      },
    });
  } catch {
    /* silent */
  }
}

export async function deleteOdeme(id: string): Promise<void> {
  try {
    await prisma.odemeKaydi.delete({
      where: { id },
    });
  } catch {
    /* silent */
  }
}

