// Excel processing and kasa calculation engine
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
  const matchedMethodIds = new Set<string>();
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

    // Display name: use Ayarlar method name if matched, otherwise raw Excel name
    const displayName = matched ? matched.name : odemeTuru;
    // Track which methods got matched so we can add unmatched ones later
    if (matched) matchedMethodIds.add(matched.id);

    results.push({
      id: `kasa-${index++}`,
      odemeTuruAdi: displayName,
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

  // Add methods from Ayarlar that had no Excel data (show with baslangicBakiye)
  for (const m of methods) {
    if (!matchedMethodIds.has(m.id)) {
      // Only add if the method has a non-zero baslangicBakiye
      if (m.baslangicBakiye !== 0) {
        results.push({
          id: `kasa-${index++}`,
          odemeTuruAdi: m.name,
          toplamBorc: 0,
          toplamKredi: 0,
          komisyon: 0,
          komisyonOrani: m.komisyonOrani,
          cekimKomisyon: 0,
          cekimKomisyonOrani: m.cekimKomisyonOrani,
          netBorc: 0,
          kalanKasa: m.baslangicBakiye,
          baslangicBakiye: m.baslangicBakiye,
        });
      }
    }
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

  return rows;
}

/**
 * Excel yuklenmeden once sadece baslangic bakiyeleri gosterir.
 * Borc, kredi, komisyon hepsi 0 olur.
 */
export function generateInitialData(methods: PaymentMethod[]): KasaCardData[] {
  return methods
    .filter((m) => m.baslangicBakiye !== 0)
    .map((m, i) => ({
      id: `kasa-${i}`,
      odemeTuruAdi: m.name,
      toplamBorc: 0,
      toplamKredi: 0,
      komisyon: 0,
      komisyonOrani: m.komisyonOrani,
      cekimKomisyon: 0,
      cekimKomisyonOrani: m.cekimKomisyonOrani,
      netBorc: 0,
      kalanKasa: m.baslangicBakiye,
      baslangicBakiye: m.baslangicBakiye,
    }))
    .sort((a, b) => b.kalanKasa - a.kalanKasa);
}
