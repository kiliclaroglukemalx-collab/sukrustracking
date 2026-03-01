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
  /** Islem sayisi (Excel'de yoksa satir = 1 islem kabul edilir) */
  islemSayisi: number;
  /** Ortalama islem suresi (dk) — cekim performans raporu icin */
  sure: number;
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
  /** Cekim performans raporu: toplam islem adedi */
  toplamIslem: number;
  /** Cekim performans raporu: ortalama islem suresi (dk) */
  ortalamaSure: number;
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
/**
 * Normalize: kucuk harf, bosluk/alt cizgi/tire kaldir, Turkce karakterleri cevir
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s_\-]+/g, "")
    .replace(/[iİıI]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g");
}

function findMethodForExcel(
  odemeTuru: string,
  methods: PaymentMethod[],
): PaymentMethod | null {
  const lower = odemeTuru.toLowerCase().trim();
  const norm = normalize(odemeTuru);

  // 1. excelKolonAdi ile tam eslesme (en oncelikli)
  const byExcelExact = methods.find(
    (m) => m.excelKolonAdi && m.excelKolonAdi.toLowerCase().trim() === lower,
  );
  if (byExcelExact) return byExcelExact;

  // 2. excelKolonAdi ile normalize eslesme (alt cizgi/bosluk farklari)
  const byExcelNorm = methods.find(
    (m) => m.excelKolonAdi && normalize(m.excelKolonAdi) === norm,
  );
  if (byExcelNorm) return byExcelNorm;

  // 3. name ile tam eslesme
  const byName = methods.find(
    (m) => m.name.toLowerCase().trim() === lower,
  );
  if (byName) return byName;

  // 4. name ile normalize eslesme
  const byNameNorm = methods.find(
    (m) => normalize(m.name) === norm,
  );
  if (byNameNorm) return byNameNorm;

  // 5. name veya excelKolonAdi ile partial eslesme (fallback)
  const byPartial = methods.find(
    (m) => {
      const mNorm = normalize(m.name);
      const eNorm = m.excelKolonAdi ? normalize(m.excelKolonAdi) : "";
      return (
        (mNorm.length > 3 && (norm.includes(mNorm) || mNorm.includes(norm))) ||
        (eNorm.length > 3 && (norm.includes(eNorm) || eNorm.includes(norm)))
      );
    },
  );
  if (byPartial) return byPartial;

  return null;
}

export function processExcelData(
  rows: PaymentRow[],
  methods: PaymentMethod[],
): KasaCardData[] {
  const grouped = new Map<string, { borc: number; kredi: number; islemSayisi: number; sureSum: number; sureCount: number }>();

  for (const row of rows) {
    const key = row.odemeTuruAdi.trim();
    if (!key) continue;
    const existing = grouped.get(key) || { borc: 0, kredi: 0, islemSayisi: 0, sureSum: 0, sureCount: 0 };
    existing.borc += row.borc || 0;
    existing.kredi += row.kredi || 0;
    const n = row.islemSayisi > 0 ? row.islemSayisi : 1;
    existing.islemSayisi += n;
    if (row.sure > 0) {
      existing.sureSum += row.sure * n;
      existing.sureCount += n;
    }
    grouped.set(key, existing);
  }

  const results: KasaCardData[] = [];
  const matchedMethodIds = new Set<string>();
  let index = 0;

  for (const [odemeTuru, totals] of grouped.entries()) {
    const matched = findMethodForExcel(odemeTuru, methods);
    const displayName = matched ? matched.name : odemeTuru;
    const komisyonOrani = matched ? matched.komisyonOrani : 0;
    const cekimKomisyonOrani = matched ? matched.cekimKomisyonOrani : 0;
    const baslangicBakiye = matched ? matched.baslangicBakiye : 0;

    if (matched) matchedMethodIds.add(matched.id);

    const komisyon = totals.borc * (komisyonOrani / 100);
    const cekimKomisyon = totals.kredi * (cekimKomisyonOrani / 100);
    const netBorc = totals.borc - komisyon;
    const kalanKasa = baslangicBakiye + netBorc - totals.kredi - cekimKomisyon;
    const ortalamaSure = totals.sureCount > 0 ? totals.sureSum / totals.sureCount : 0;

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
      toplamIslem: totals.islemSayisi,
      ortalamaSure,
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
          toplamIslem: 0,
          ortalamaSure: 0,
        });
      }
    }
  }

  return results.sort((a, b) => b.kalanKasa - a.kalanKasa);
}

/**
 * Normalize string for column matching: lowercase, remove spaces, Turkish chars
 */
function normalizeCol(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[\s_\-\.]+/g, "")
    .replace(/[iİıI]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g");
}

/**
 * Finds a column value by checking multiple possible header names.
 * Uses case-insensitive + normalized matching. Also supports "contains" for
 * headers like "Cekim Hacmi" matching "Cekim" or "Hacim".
 */
function findColumn(
  row: Record<string, unknown>,
  candidates: string[],
): unknown | undefined {
  for (const c of candidates) {
    if (row[c] !== undefined) return row[c];
  }
  const normalizedCandidates = candidates.map(normalizeCol);
  for (const key of Object.keys(row)) {
    const nKey = normalizeCol(key);
    if (normalizedCandidates.includes(nKey)) return row[key];
    // Contains: "Cekim Hacmi" matches "Cekim" or "Hacim"
    for (const nc of normalizedCandidates) {
      if (nc.length >= 3 && (nKey.includes(nc) || nc.includes(nKey)))
        return row[key];
    }
  }
  return undefined;
}

/**
 * Find column index in header row (array of cell values).
 * Returns -1 if not found.
 */
function findColumnIndex(
  headerCells: unknown[],
  candidates: string[],
): number {
  const normalizedCandidates = candidates.map(normalizeCol);
  for (let i = 0; i < headerCells.length; i++) {
    const cell = String(headerCells[i] ?? "").trim();
    if (!cell) continue;
    const n = normalizeCol(cell);
    if (normalizedCandidates.includes(n)) return i;
    for (const nc of normalizedCandidates) {
      if (nc.length >= 3 && (n.includes(nc) || nc.includes(n)))
        return i;
    }
  }
  return -1;
}

/**
 * Detect header row: first row that contains known column names (yontem, borc, kredi).
 */
function detectHeaderRow(rawRows: unknown[][]): number {
  const yontemWords = ["yontem", "odeme", "odemetur", "odemeturu"];
  const sayiWords = ["borc", "kredi", "cekim", "yatirim", "hacim", "tutar"];
  for (let r = 0; r < Math.min(10, rawRows.length); r++) {
    const row = rawRows[r] ?? [];
    let yontemFound = false;
    let sayiFound = false;
    for (const cell of row) {
      const n = normalizeCol(String(cell ?? ""));
      if (yontemWords.some((w) => n.includes(w) || w.includes(n))) yontemFound = true;
      if (sayiWords.some((w) => n.includes(w) || w.includes(n))) sayiFound = true;
    }
    if (yontemFound && sayiFound) return r;
  }
  return 0;
}

/** Turkce/US sayi formatlarini parse eder: "1.234,56" veya "1,234.56" */
function parseNumber(val: unknown): number {
  if (val == null || val === "") return 0;
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  const s = String(val).trim();
  if (!s) return 0;
  // Turkce: 1.234,56 -> . binlik, , ondalik
  const trMatch = s.match(/^([\d\s.]+)[,](\d+)$/);
  if (trMatch) {
    const intPart = trMatch[1].replace(/\s/g, "").replace(/\./g, "");
    return parseFloat(intPart + "." + trMatch[2]) || 0;
  }
  // US: 1,234.56 -> , binlik, . ondalik
  const usMatch = s.match(/^([\d\s,]+)[.](\d+)$/);
  if (usMatch) {
    const intPart = usMatch[1].replace(/\s/g, "").replace(/,/g, "");
    return parseFloat(intPart + "." + usMatch[2]) || 0;
  }
  // Sadece sayi + bosluk/nokta/virgul
  const cleaned = s.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

const ODEME_TURU_CANDIDATES = [
  "Odeme Turu Adi", "Ödeme Türü Adı", "OdemeTuruAdi", "Odeme Turu", "Ödeme Türü",
  "Yontem", "Yöntem", "Yontem Adi", "Yöntem Adı", "Odeme Yontemi", "Ödeme Yöntemi",
  "odeme_turu_adi", "ODEME TURU ADI", "Odeme turu adi", "OdemeTuru",
  "Odeme Sistemi", "Ödeme Sistemi", "Kanallar", "Kanal",
];

const BORC_CANDIDATES = [
  "Borc", "Borç", "borc", "BORC", "Borc Tutari", "Borç Tutarı", "borc_tutari",
  "Yatirim", "Yatırım", "Giris", "Giriş", "Toplam Yatirim", "Toplam Yatırım",
  "Giris Tutari", "Giriş Tutarı",
];

const KREDI_CANDIDATES = [
  "Kredi", "kredi", "KREDI", "Kredi Tutari", "Kredi Tutarı", "kredi_tutari",
  "Cekim", "Çekim", "Cikis", "Çıkış", "Hacim", "hacim", "Toplam Cekim",
  "Toplam Çekim", "Cekim Hacmi", "Çekim Hacmi", "Cikis Tutari", "Çıkış Tutarı",
  "Toplam Hacim", "Tutar",
];

const ISLEM_CANDIDATES = [
  "Islem", "İşlem", "islem", "Islem Sayisi", "İşlem Sayısı", "Adet", "adet",
  "TxCount", "Islem Adedi", "İşlem Adedi", "Islem Sayisi", "Toplam Islem",
];

const SURE_CANDIDATES = [
  "Sure", "Süre", "sure", "Ortalama Sure", "Ortalama Süre", "Sure (dk)", "Süre (dk)",
  "Ort. Sure", "AvgDuration", "Karar Suresi", "Karar Süresi", "Ort. Islem Suresi",
  "Ortalama Islem Suresi", "Ortalama İşlem Süresi", "dk", "Dakika",
];

export function parseExcelFile(buffer: ArrayBuffer): PaymentRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 });
  if (!rawRows.length) return [];

  const headerRowIndex = detectHeaderRow(rawRows);
  const headerRow = (rawRows[headerRowIndex] ?? []) as unknown[];
  const dataRows = rawRows.slice(headerRowIndex + 1) as unknown[][];

  const idxYontem = findColumnIndex(headerRow, ODEME_TURU_CANDIDATES);
  const idxBorc = findColumnIndex(headerRow, BORC_CANDIDATES);
  const idxKredi = findColumnIndex(headerRow, KREDI_CANDIDATES);
  const idxIslem = findColumnIndex(headerRow, ISLEM_CANDIDATES);
  const idxSure = findColumnIndex(headerRow, SURE_CANDIDATES);

  const useIndexMap = idxYontem >= 0 && (idxBorc >= 0 || idxKredi >= 0);

  const rows: PaymentRow[] = [];
  for (const row of dataRows) {
    const arr = Array.isArray(row) ? row : [];
    let odemeTuruAdi = "";
    let borc = 0;
    let kredi = 0;
    let islemSayisi = 1;
    let sure = 0;

    if (useIndexMap) {
      odemeTuruAdi = String(arr[idxYontem] ?? "").trim();
      borc = idxBorc >= 0 ? parseNumber(arr[idxBorc]) : 0;
      kredi = idxKredi >= 0 ? parseNumber(arr[idxKredi]) : 0;
      islemSayisi = idxIslem >= 0 ? Math.max(1, Math.round(parseNumber(arr[idxIslem]))) : 1;
      sure = idxSure >= 0 ? parseNumber(arr[idxSure]) : 0;
    } else {
      const rowObj: Record<string, unknown> = {};
      headerRow.forEach((h, i) => {
        const key = String(h ?? `__col${i}`).trim() || `__col${i}`;
        rowObj[key] = arr[i];
      });
      odemeTuruAdi = String(findColumn(rowObj, ODEME_TURU_CANDIDATES) ?? "").trim();
      borc = parseNumber(findColumn(rowObj, BORC_CANDIDATES));
      kredi = parseNumber(findColumn(rowObj, KREDI_CANDIDATES));
      islemSayisi = Math.max(1, Math.round(parseNumber(findColumn(rowObj, ISLEM_CANDIDATES))));
      sure = parseNumber(findColumn(rowObj, SURE_CANDIDATES));
    }

    if (!odemeTuruAdi && arr.length >= 2) {
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        if (typeof v === "string" && v.trim()) {
          odemeTuruAdi = v.trim();
          borc = i + 1 < arr.length ? parseNumber(arr[i + 1]) : 0;
          kredi = i + 2 < arr.length ? parseNumber(arr[i + 2]) : 0;
          islemSayisi = i + 3 < arr.length ? Math.max(1, Math.round(parseNumber(arr[i + 3]))) : 1;
          sure = i + 4 < arr.length ? parseNumber(arr[i + 4]) : 0;
          break;
        }
      }
    }

    if (odemeTuruAdi) {
      rows.push({ odemeTuruAdi, borc, kredi, islemSayisi, sure });
    }
  }

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
      toplamIslem: 0,
      ortalamaSure: 0,
    }))
    .sort((a, b) => b.kalanKasa - a.kalanKasa);
}
