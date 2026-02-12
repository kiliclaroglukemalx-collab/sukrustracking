import * as XLSX from "xlsx";

export interface PaymentMethod {
  id: string;
  name: string;
  excelKolonAdi: string; // Excel'deki kolon ismi -- eslestirme buna gore yapilir
  komisyonOrani: number;
  cekimKomisyonOrani: number;
  baslangicBakiye: number;
}

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
  cekimKomisyon: number;
  cekimKomisyonOrani: number;
  netBorc: number;
  kalanKasa: number;
  baslangicBakiye: number;
}

// Default payment methods with commission rates and starting balances
export const DEFAULT_METHODS: PaymentMethod[] = [
  { id: "m-0", name: "Nakit", excelKolonAdi: "", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-1", name: "Kredi Karti", excelKolonAdi: "", komisyonOrani: 1.79, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-2", name: "Banka Karti", excelKolonAdi: "", komisyonOrani: 0.95, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-3", name: "Havale/EFT", excelKolonAdi: "", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-4", name: "Yemek Karti", excelKolonAdi: "", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-5", name: "Online Odeme", excelKolonAdi: "", komisyonOrani: 2.5, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-6", name: "Multinet", excelKolonAdi: "", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-7", name: "Sodexo", excelKolonAdi: "", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-8", name: "Ticket", excelKolonAdi: "", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-9", name: "Metropol", excelKolonAdi: "", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-10", name: "Setcard", excelKolonAdi: "", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-11", name: "iyzico", excelKolonAdi: "", komisyonOrani: 2.99, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-12", name: "PayPal", excelKolonAdi: "", komisyonOrani: 3.4, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-13", name: "Param", excelKolonAdi: "", komisyonOrani: 2.79, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-14", name: "Paycell", excelKolonAdi: "", komisyonOrani: 2.5, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-15", name: "Hopi", excelKolonAdi: "", komisyonOrani: 3.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-16", name: "Tosla", excelKolonAdi: "", komisyonOrani: 2.5, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-17", name: "Papara", excelKolonAdi: "", komisyonOrani: 1.5, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-18", name: "Cuzdan", excelKolonAdi: "", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-19", name: "Acik Hesap", excelKolonAdi: "", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-20", name: "Fis/Cek", excelKolonAdi: "", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-21", name: "Garanti Pay", excelKolonAdi: "", komisyonOrani: 2.2, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-22", name: "QR Odeme", excelKolonAdi: "", komisyonOrani: 1.8, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-23", name: "Puan", excelKolonAdi: "", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
];

/**
 * Excel'deki yontem adini sisteme eslestirir.
 * Oncelik sirasi:
 *   1. excelKolonAdi tam eslesme (kullanici tarafindan girilen)
 *   2. name tam eslesme
 *   3. name partial (icerir) eslesme
 * Eslesen yoksa null doner.
 */
function findMethodForExcel(
  odemeTuru: string,
  methods: PaymentMethod[],
): PaymentMethod | null {
  const lower = odemeTuru.toLowerCase().trim();

  // 1. excelKolonAdi ile tam eslesme (en oncelikli)
  const byExcelName = methods.find(
    (m) => m.excelKolonAdi && m.excelKolonAdi.toLowerCase().trim() === lower,
  );
  if (byExcelName) return byExcelName;

  // 2. name ile tam eslesme
  const byName = methods.find(
    (m) => m.name.toLowerCase().trim() === lower,
  );
  if (byName) return byName;

  // 3. name ile partial eslesme (fallback)
  const byPartial = methods.find(
    (m) =>
      lower.includes(m.name.toLowerCase().trim()) ||
      m.name.toLowerCase().trim().includes(lower),
  );
  if (byPartial) return byPartial;

  return null;
}

export function processExcelData(
  rows: PaymentRow[],
  methods: PaymentMethod[],
): KasaCardData[] {
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
    const matched = findMethodForExcel(odemeTuru, methods);
    const komisyonOrani = matched?.komisyonOrani ?? 0;
    const cekimKomisyonOrani = matched?.cekimKomisyonOrani ?? 0;
    const baslangicBakiye = matched?.baslangicBakiye ?? 0;
    const komisyon = totals.borc * (komisyonOrani / 100);
    const cekimKomisyon = totals.kredi * (cekimKomisyonOrani / 100);
    const netBorc = totals.borc - komisyon;
    const kalanKasa = baslangicBakiye + netBorc - totals.kredi - cekimKomisyon;

    results.push({
      id: `kasa-${index++}`,
      odemeTuruAdi: odemeTuru,
      toplamBorc: totals.borc,
      toplamKredi: totals.kredi,
      komisyon,
      komisyonOrani,
      cekimKomisyon,
      cekimKomisyonOrani,
      netBorc,
      kalanKasa,
      baslangicBakiye,
    });
  }

  return results.sort((a, b) => b.kalanKasa - a.kalanKasa);
}

/**
 * Finds a column value by checking multiple possible header names.
 * Uses case-insensitive + normalized matching to handle Turkish chars and
 * slight naming differences across different Excel exports.
 */
function findColumn(
  row: Record<string, unknown>,
  candidates: string[],
): unknown | undefined {
  // First try exact match
  for (const c of candidates) {
    if (row[c] !== undefined) return row[c];
  }
  // Then try case-insensitive + whitespace-normalized match against all keys
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[\s_\-]+/g, "")
      .replace(/[iİıI]/g, "i")
      .replace(/[öÖ]/g, "o")
      .replace(/[üÜ]/g, "u")
      .replace(/[şŞ]/g, "s")
      .replace(/[çÇ]/g, "c")
      .replace(/[ğĞ]/g, "g");

  const normalizedCandidates = candidates.map(normalize);
  for (const key of Object.keys(row)) {
    const nKey = normalize(key);
    if (normalizedCandidates.includes(nKey)) return row[key];
  }
  return undefined;
}

export function parseExcelFile(buffer: ArrayBuffer): PaymentRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData =
    XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

  if (jsonData.length > 0) {
    console.log("[v0] Excel columns detected:", Object.keys(jsonData[0]));
    console.log("[v0] First row sample:", jsonData[0]);
    console.log("[v0] Total rows:", jsonData.length);
  }

  const odemeTuruCandidates = [
    "Odeme Turu Adi",
    "Ödeme Türü Adı",
    "OdemeTuruAdi",
    "Odeme Turu",
    "Ödeme Türü",
    "odeme_turu_adi",
    "ODEME TURU ADI",
    "Odeme turu adi",
    "OdemeTuru",
  ];

  const borcCandidates = [
    "Borc",
    "Borç",
    "borc",
    "BORC",
    "Borc Tutari",
    "Borç Tutarı",
    "borc_tutari",
  ];

  const krediCandidates = [
    "Kredi",
    "kredi",
    "KREDI",
    "Kredi Tutari",
    "Kredi Tutarı",
    "kredi_tutari",
  ];

  const rows = jsonData.map((row) => {
    const odemeTuruAdi = String(findColumn(row, odemeTuruCandidates) ?? "");
    const borc = Number(findColumn(row, borcCandidates) ?? 0);
    const kredi = Number(findColumn(row, krediCandidates) ?? 0);

    return { odemeTuruAdi, borc, kredi };
  });

  console.log("[v0] Parsed payment rows:", rows.length);
  if (rows.length > 0) {
    console.log("[v0] First parsed row:", rows[0]);
    const nonEmpty = rows.filter((r) => r.odemeTuruAdi.trim() !== "");
    console.log("[v0] Non-empty odemeTuruAdi rows:", nonEmpty.length);
  }

  return rows;
}

export function generateDemoData(methods: PaymentMethod[]): KasaCardData[] {
  const demoRowsMap: Record<string, { borc: number; kredi: number }> = {
    "Nakit": { borc: 45200, kredi: 12300 },
    "Kredi Karti": { borc: 128750, kredi: 35600 },
    "Banka Karti": { borc: 67400, kredi: 18200 },
    "Havale/EFT": { borc: 89100, kredi: 42500 },
    "Yemek Karti": { borc: 23400, kredi: 5600 },
    "Online Odeme": { borc: 56300, kredi: 15800 },
    "Multinet": { borc: 18700, kredi: 4200 },
    "Sodexo": { borc: 22100, kredi: 6100 },
    "Ticket": { borc: 15300, kredi: 3800 },
    "Metropol": { borc: 9800, kredi: 2100 },
    "Setcard": { borc: 12600, kredi: 3400 },
    "iyzico": { borc: 34500, kredi: 9700 },
    "PayPal": { borc: 8200, kredi: 1900 },
    "Param": { borc: 19400, kredi: 5200 },
    "Paycell": { borc: 11300, kredi: 2800 },
    "Hopi": { borc: 7600, kredi: 1500 },
    "Tosla": { borc: 6400, kredi: 1200 },
    "Papara": { borc: 28900, kredi: 7300 },
    "Cuzdan": { borc: 4100, kredi: 800 },
    "Acik Hesap": { borc: 52000, kredi: 31000 },
    "Fis/Cek": { borc: 37800, kredi: 14600 },
    "Garanti Pay": { borc: 14200, kredi: 3900 },
    "QR Odeme": { borc: 5600, kredi: 1100 },
    "Puan": { borc: 3200, kredi: 700 },
  };

  // Build rows based on the current methods list so added/removed methods are reflected
  const demoRows: PaymentRow[] = methods.map((m) => {
    const data = demoRowsMap[m.name] || { borc: 0, kredi: 0 };
    return { odemeTuruAdi: m.name, borc: data.borc, kredi: data.kredi };
  });

  return processExcelData(demoRows, methods);
}
