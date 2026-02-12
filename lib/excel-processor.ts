import * as XLSX from "xlsx";

export interface PaymentMethod {
  id: string;
  name: string;
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
  { id: "m-0", name: "Nakit", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-1", name: "Kredi Karti", komisyonOrani: 1.79, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-2", name: "Banka Karti", komisyonOrani: 0.95, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-3", name: "Havale/EFT", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-4", name: "Yemek Karti", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-5", name: "Online Odeme", komisyonOrani: 2.5, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-6", name: "Multinet", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-7", name: "Sodexo", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-8", name: "Ticket", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-9", name: "Metropol", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-10", name: "Setcard", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-11", name: "iyzico", komisyonOrani: 2.99, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-12", name: "PayPal", komisyonOrani: 3.4, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-13", name: "Param", komisyonOrani: 2.79, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-14", name: "Paycell", komisyonOrani: 2.5, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-15", name: "Hopi", komisyonOrani: 3.0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-16", name: "Tosla", komisyonOrani: 2.5, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-17", name: "Papara", komisyonOrani: 1.5, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-18", name: "Cuzdan", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-19", name: "Acik Hesap", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-20", name: "Fis/Cek", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-21", name: "Garanti Pay", komisyonOrani: 2.2, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-22", name: "QR Odeme", komisyonOrani: 1.8, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
  { id: "m-23", name: "Puan", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0 },
];

function getKomisyonOrani(
  odemeTuru: string,
  methods: PaymentMethod[],
): number {
  const exact = methods.find(
    (m) => m.name.toLowerCase() === odemeTuru.toLowerCase(),
  );
  if (exact) return exact.komisyonOrani;

  const lower = odemeTuru.toLowerCase();
  const partial = methods.find(
    (m) =>
      lower.includes(m.name.toLowerCase()) ||
      m.name.toLowerCase().includes(lower),
  );
  if (partial) return partial.komisyonOrani;

  return 0;
}

function getCekimKomisyonOrani(
  odemeTuru: string,
  methods: PaymentMethod[],
): number {
  const exact = methods.find(
    (m) => m.name.toLowerCase() === odemeTuru.toLowerCase(),
  );
  if (exact) return exact.cekimKomisyonOrani;

  const lower = odemeTuru.toLowerCase();
  const partial = methods.find(
    (m) =>
      lower.includes(m.name.toLowerCase()) ||
      m.name.toLowerCase().includes(lower),
  );
  if (partial) return partial.cekimKomisyonOrani;

  return 0;
}

function getBaslangicBakiye(
  odemeTuru: string,
  methods: PaymentMethod[],
): number {
  const exact = methods.find(
    (m) => m.name.toLowerCase() === odemeTuru.toLowerCase(),
  );
  if (exact) return exact.baslangicBakiye;

  const lower = odemeTuru.toLowerCase();
  const partial = methods.find(
    (m) =>
      lower.includes(m.name.toLowerCase()) ||
      m.name.toLowerCase().includes(lower),
  );
  if (partial) return partial.baslangicBakiye;

  return 0;
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
    const komisyonOrani = getKomisyonOrani(odemeTuru, methods);
    const cekimKomisyonOrani = getCekimKomisyonOrani(odemeTuru, methods);
    const baslangicBakiye = getBaslangicBakiye(odemeTuru, methods);
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

export function parseExcelFile(buffer: ArrayBuffer): PaymentRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData =
    XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

  return jsonData.map((row) => {
    const odemeTuruAdi =
      (row["Odeme Turu Adi"] as string) ||
      (row["OdemeTuruAdi"] as string) ||
      (row["Odeme Turu"] as string) ||
      (row["odeme_turu_adi"] as string) ||
      "";

    const borc = Number(
      row["Borc"] || row["borc"] || row["BORC"] || 0,
    );

    const kredi = Number(
      row["Kredi"] || row["kredi"] || row["KREDI"] || 0,
    );

    return { odemeTuruAdi, borc, kredi };
  });
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
