import * as XLSX from "xlsx";

export interface PaymentRow {
  odemeTuruAdi: string;
  borc: number;
  kredi: number;
}

export interface KasaCardData {
  id: string;
  odemeTuruAdi: string;
  toplamBorc: number;
  toplamKredi: number;
  komisyon: number;
  komisyonOrani: number;
  netBorc: number;
  kalanKasa: number;
}

// Default commission rates per payment type (percentage)
const KOMISYON_ORANLARI: Record<string, number> = {
  "Nakit": 0,
  "Kredi Kartı": 1.79,
  "Banka Kartı": 0.95,
  "Havale/EFT": 0,
  "Yemek Kartı": 5.0,
  "Online Ödeme": 2.5,
  "Multinet": 5.0,
  "Sodexo": 5.0,
  "Ticket": 5.0,
  "Metropol": 5.0,
  "Setcard": 5.0,
};

function getKomisyonOrani(odemeTuru: string): number {
  // Check exact match first, then case-insensitive partial match
  if (KOMISYON_ORANLARI[odemeTuru] !== undefined) {
    return KOMISYON_ORANLARI[odemeTuru];
  }

  const lowerTuru = odemeTuru.toLowerCase();
  for (const [key, value] of Object.entries(KOMISYON_ORANLARI)) {
    if (lowerTuru.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerTuru)) {
      return value;
    }
  }

  return 0; // Default: no commission
}

export function processExcelData(rows: PaymentRow[]): KasaCardData[] {
  // Group by payment type
  const grouped = new Map<string, { borc: number; kredi: number }>();

  for (const row of rows) {
    const key = row.odemeTuruAdi.trim();
    if (!key) continue;

    const existing = grouped.get(key) || { borc: 0, kredi: 0 };
    existing.borc += row.borc || 0;
    existing.kredi += row.kredi || 0;
    grouped.set(key, existing);
  }

  const results: KasaCardData[] = [];
  let index = 0;

  for (const [odemeTuru, totals] of grouped.entries()) {
    const komisyonOrani = getKomisyonOrani(odemeTuru);
    const komisyon = totals.borc * (komisyonOrani / 100);
    const netBorc = totals.borc - komisyon;
    const kalanKasa = netBorc - totals.kredi;

    results.push({
      id: `kasa-${index++}`,
      odemeTuruAdi: odemeTuru,
      toplamBorc: totals.borc,
      toplamKredi: totals.kredi,
      komisyon,
      komisyonOrani,
      netBorc,
      kalanKasa,
    });
  }

  return results.sort((a, b) => b.kalanKasa - a.kalanKasa);
}

export function parseExcelFile(buffer: ArrayBuffer): PaymentRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

  return jsonData.map((row) => {
    // Try multiple column name variations
    const odemeTuruAdi =
      (row["Ödeme Türü Adı"] as string) ||
      (row["Odeme Turu Adi"] as string) ||
      (row["OdemeTuruAdi"] as string) ||
      (row["Ödeme Türü"] as string) ||
      (row["odeme_turu_adi"] as string) ||
      "";

    const borc =
      Number(row["Borç"] || row["Borc"] || row["borc"] || row["BORÇ"] || 0);

    const kredi =
      Number(row["Kredi"] || row["kredi"] || row["KREDİ"] || row["KREDI"] || 0);

    return { odemeTuruAdi, borc, kredi };
  });
}

// Generate demo data for initial view
export function generateDemoData(): KasaCardData[] {
  const demoRows: PaymentRow[] = [
    { odemeTuruAdi: "Nakit", borc: 45200, kredi: 12300 },
    { odemeTuruAdi: "Kredi Kartı", borc: 128750, kredi: 35600 },
    { odemeTuruAdi: "Banka Kartı", borc: 67400, kredi: 18200 },
    { odemeTuruAdi: "Havale/EFT", borc: 89100, kredi: 42500 },
    { odemeTuruAdi: "Yemek Kartı", borc: 23400, kredi: 5600 },
    { odemeTuruAdi: "Online Ödeme", borc: 56300, kredi: 15800 },
  ];

  return processExcelData(demoRows);
}
