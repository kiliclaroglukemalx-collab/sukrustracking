// v0-greetings'ten klonlandi - Bonus Veri Analiz Fonksiyonlari
// Gerekli sutunlar: Olusturuldu, Kabul Tarihi, Adi, Sonuc, operator, BTag, Hesaplama/Miktar, Toplam Odenen

const COLUMN_MAPPING: Record<string, string> = {
  "Oluşturuldu": "start_date",
  Olusturuldu: "start_date",
  "oluşturuldu": "start_date",
  olusturuldu: "start_date",
  "Oluşturma Tarihi": "start_date",
  "Olusturma Tarihi": "start_date",
  start_date: "start_date",
  "Kabul Tarihi": "end_date",
  Kabul_Tarihi: "end_date",
  kabul_tarihi: "end_date",
  "Sonuç Tarihi": "end_date",
  "Sonuc Tarihi": "end_date",
  "Sonuç_Tarihi": "end_date",
  "Sonuc_Tarihi": "end_date",
  end_date: "end_date",
  Adı: "bonus_name",
  Adi: "bonus_name",
  Ad: "bonus_name",
  "Bonus Adı": "bonus_name",
  "Bonus Adi": "bonus_name",
  bonus_name: "bonus_name",
  "Sonuç": "status",
  Sonuc: "status",
  Durum: "status",
  status: "status",
  "tarafından oluşturuldu": "operator",
  "tarafindan olusturuldu": "operator",
  "Tarafından Oluşturuldu": "operator",
  "Tarafindan Olusturuldu": "operator",
  "Oluşturan": "operator",
  Olusturan: "operator",
  operator: "operator",
  BTag: "btag",
  Btag: "btag",
  btag: "btag",
  BTAG: "btag",
  "Bonus Türü": "category",
  "Bonus Turu": "category",
  Kategori: "category",
  "Müşteri Kategorisi": "category",
  "Musteri Kategorisi": "category",
  category: "category",
  Hesaplama: "bonus_value",
  "Miktar (TRY)": "bonus_value",
  "Miktar(TRY)": "bonus_value",
  Miktar_TRY: "bonus_value",
  "Gerçek Miktar": "bonus_value",
  "Gercek Miktar": "bonus_value",
  bonus_value: "bonus_value",
  "Toplam Ödenen Miktar (TRY)": "total_paid",
  "Toplam Odenen Miktar (TRY)": "total_paid",
  "Toplam Ödenen Miktar": "total_paid",
  "Toplam Odenen Miktar": "total_paid",
  "Ödenen Miktar (TRY)": "total_paid",
  "Odenen Miktar (TRY)": "total_paid",
  "Ödenen Miktar": "total_paid",
  "Odenen Miktar": "total_paid",
  total_paid: "total_paid",
  Ürün: "product",
  Urun: "product",
  ürün: "product",
  urun: "product",
  Product: "product",
  product: "product",
};

export const REQUIRED_COLUMNS = [
  "start_date",
  "bonus_name",
  "status",
  "operator",
  "btag",
  "bonus_value",
  "total_paid",
];

function getColumnValue(
  row: Record<string, unknown>,
  targetColumn: string
): unknown {
  for (const [originalName, mappedName] of Object.entries(COLUMN_MAPPING)) {
    if (mappedName === targetColumn && row[originalName] !== undefined) {
      return row[originalName];
    }
  }
  return undefined;
}

export function validateColumns(fileColumns: string[]): {
  valid: boolean;
  missing: string[];
  found: Record<string, string>;
} {
  const found: Record<string, string> = {};
  for (const fileCol of fileColumns) {
    const normalized = COLUMN_MAPPING[fileCol];
    if (normalized) found[normalized] = fileCol;
  }
  const missing = REQUIRED_COLUMNS.filter((req) => !found[req]);
  return { valid: missing.length === 0, missing, found };
}

export interface CleanBonusData {
  start_date: string;
  end_date: string;
  bonus_name: string;
  status: string;
  operator: string;
  btag: string;
  category: string;
  bonus_value: number | string;
  total_paid: number | string;
  product: string;
  [key: string]: unknown;
}

export interface ProcessedCleanData extends CleanBonusData {
  parsedStartDate: Date | null;
  parsedEndDate: Date | null;
  processingTime: number;
  hour: number;
  bonusValueNum: number;
  totalPaidNum: number;
}

export interface CleanKeyMetrics {
  totalTransactions: number;
  avgProcessingTime: number;
  totalBonusValue: number;
  totalPaid: number;
}

export interface HourlyData {
  hour: string;
  count: number;
}

export interface StatusData {
  status: string;
  count: number;
  fill: string;
}

export interface BTagAnalysis {
  btag: string;
  transactionCount: number;
  totalVolume: number;
}

export interface TopBonus {
  bonusName: string;
  transactionCount: number;
  totalPaid: number;
  totalHesaplama: number;
}

export interface CategoryData {
  category: string;
  count: number;
  fill: string;
}

export interface OperatorPerformanceExtended {
  operator: string;
  transactionCount: number;
  avgTime: number;
  totalBonusValue: number;
  fast: number;
  medium: number;
  slow: number;
}

export interface ProcessingTimeCategory {
  category: string;
  count: number;
  avgTime: number;
  percentage: number;
  fill: string;
}

export interface ProductData {
  product: string;
  count: number;
  volume: number;
  paid: number;
  fill: string;
}

export function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr || typeof dateStr !== "string" || dateStr.trim() === "")
    return null;
  const str = dateStr.trim();
  let date = new Date(str);
  if (!isNaN(date.getTime())) return date;
  const match = str.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\s+(\d{1,2}):(\d{2}):?(\d{2})?$/
  );
  if (match) {
    const [, day, month, year, hour, minute, second = "0"] = match;
    const fullYear =
      year!.length === 2 ? 2000 + parseInt(year!, 10) : parseInt(year!, 10);
    date = new Date(
      fullYear,
      parseInt(month!, 10) - 1,
      parseInt(day!, 10),
      parseInt(hour!, 10),
      parseInt(minute!, 10),
      parseInt(second!, 10)
    );
    if (!isNaN(date.getTime())) return date;
  }
  const match2 = str.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (match2) {
    const [, day, month, year] = match2;
    const fullYear =
      year!.length === 2 ? 2000 + parseInt(year!, 10) : parseInt(year!, 10);
    date = new Date(fullYear, parseInt(month!, 10) - 1, parseInt(day!, 10));
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export function normalizeData(
  rawData: Record<string, unknown>[]
): CleanBonusData[] {
  return rawData.map((row) => {
    const normalized: CleanBonusData = {
      start_date: String(getColumnValue(row, "start_date") || ""),
      end_date: String(getColumnValue(row, "end_date") || ""),
      bonus_name: String(getColumnValue(row, "bonus_name") || "Bilinmiyor"),
      status: String(getColumnValue(row, "status") || "Beklemede"),
      operator: String(getColumnValue(row, "operator") || "Bilinmiyor"),
      btag: String(getColumnValue(row, "btag") || "Belirtilmemis"),
      category: String(getColumnValue(row, "category") || "Diger"),
      bonus_value: toNumber(getColumnValue(row, "bonus_value")),
      total_paid: toNumber(getColumnValue(row, "total_paid")),
      product: String(getColumnValue(row, "product") || "Belirtilmemis"),
    };
    for (const [key, value] of Object.entries(row)) {
      if (!(key in normalized)) (normalized as Record<string, unknown>)[key] = value;
    }
    return normalized;
  });
}

export function processCleanData(
  rawData: CleanBonusData[]
): ProcessedCleanData[] {
  return rawData.map((row) => {
    const parsedStartDate = parseDate(row.start_date);
    const parsedEndDate = parseDate(row.end_date);
    let processingTime = 0;
    if (parsedStartDate && parsedEndDate) {
      processingTime = Math.round(
        (parsedEndDate.getTime() - parsedStartDate.getTime()) / 1000
      );
      if (processingTime < 0) processingTime = 0;
    }
    const hour = parsedStartDate ? parsedStartDate.getHours() : 0;
    const bonusValueNum = toNumber(row.bonus_value);
    const totalPaidNum = toNumber(row.total_paid);
    return {
      ...row,
      parsedStartDate,
      parsedEndDate,
      processingTime,
      hour,
      bonusValueNum,
      totalPaidNum,
    };
  });
}

export function calculateCleanKeyMetrics(
  data: ProcessedCleanData[]
): CleanKeyMetrics {
  const totalTransactions = data.length;
  const validTimes = data.filter((d) => d.processingTime > 0);
  const avgProcessingTime =
    validTimes.length > 0
      ? validTimes.reduce((sum, d) => sum + d.processingTime, 0) /
        validTimes.length
      : 0;
  const totalBonusValue = data.reduce((s, d) => s + d.bonusValueNum, 0);
  const totalPaid = data.reduce((s, d) => s + d.totalPaidNum, 0);
  return {
    totalTransactions,
    avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
    totalBonusValue: Math.round(totalBonusValue * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
  };
}

export function calculateCleanHourlyData(
  data: ProcessedCleanData[]
): HourlyData[] {
  const hourCounts: Record<number, number> = {};
  for (let i = 0; i < 24; i++) hourCounts[i] = 0;
  data.forEach((d) => {
    if (d.parsedStartDate) {
      const h = d.parsedStartDate.getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    }
  });
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    count: hourCounts[i] ?? 0,
  }));
}

const STATUS_COLORS: Record<string, string> = {
  Paid: "hsl(var(--chart-1))",
  paid: "hsl(var(--chart-1))",
  Ödendi: "hsl(var(--chart-1))",
  Odendi: "hsl(var(--chart-1))",
  Canceled: "hsl(var(--chart-4))",
  canceled: "hsl(var(--chart-4))",
  İptal: "hsl(var(--chart-4))",
  Iptal: "hsl(var(--chart-4))",
  Lost: "hsl(var(--chart-3))",
  lost: "hsl(var(--chart-3))",
  Kaybedildi: "hsl(var(--chart-3))",
  Pending: "hsl(var(--chart-2))",
  pending: "hsl(var(--chart-2))",
  Beklemede: "hsl(var(--chart-2))",
};

export function calculateCleanStatusData(
  data: ProcessedCleanData[]
): StatusData[] {
  const statusCounts: Record<string, number> = {};
  data.forEach((d) => {
    const status = (d.status || "Bilinmiyor").trim();
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  return Object.entries(statusCounts)
    .filter(([s]) => s !== "")
    .map(([status, count], index) => ({
      status: status || "Beklemede",
      count,
      fill: STATUS_COLORS[status] || `hsl(var(--chart-${(index % 5) + 1}))`,
    }))
    .sort((a, b) => b.count - a.count);
}

export function calculateCleanOperatorPerformance(
  data: ProcessedCleanData[]
): OperatorPerformanceExtended[] {
  const operatorMap: Record<
    string,
    {
      times: number[];
      bonusValues: number[];
      count: number;
      fast: number;
      medium: number;
      slow: number;
    }
  > = {};
  data.forEach((d) => {
    const operator = (d.operator || "Bilinmiyor").trim();
    if (!operatorMap[operator]) {
      operatorMap[operator] = {
        times: [],
        bonusValues: [],
        count: 0,
        fast: 0,
        medium: 0,
        slow: 0,
      };
    }
    operatorMap[operator].count++;
    if (d.processingTime > 0) {
      operatorMap[operator].times.push(d.processingTime);
      if (d.processingTime <= 30) operatorMap[operator].fast++;
      else if (d.processingTime <= 60) operatorMap[operator].medium++;
      else operatorMap[operator].slow++;
    }
    operatorMap[operator].bonusValues.push(d.bonusValueNum);
  });
  return Object.entries(operatorMap)
    .map(([operator, d]) => ({
      operator,
      transactionCount: d.count,
      avgTime:
        d.times.length > 0
          ? Math.round(
              (d.times.reduce((a, b) => a + b, 0) / d.times.length) * 100
            ) / 100
          : 0,
      totalBonusValue: Math.round(
        d.bonusValues.reduce((a, b) => a + b, 0) * 100
      ) / 100,
      fast: d.fast,
      medium: d.medium,
      slow: d.slow,
    }))
    .sort((a, b) => b.transactionCount - a.transactionCount);
}

export function calculateProcessingTimeCategories(
  data: ProcessedCleanData[]
): ProcessingTimeCategory[] {
  const categories = {
    Normal: { count: 0, times: [] as number[], fill: "hsl(var(--chart-1))" },
    Gecikmeli: { count: 0, times: [] as number[], fill: "hsl(var(--chart-3))" },
    Uzun: { count: 0, times: [] as number[], fill: "hsl(var(--chart-5))" },
  };
  data.forEach((d) => {
    const time = d.processingTime || 0;
    if (time <= 0) return;
    if (time <= 60) {
      categories.Normal.count++;
      categories.Normal.times.push(time);
    } else if (time <= 300) {
      categories.Gecikmeli.count++;
      categories.Gecikmeli.times.push(time);
    } else {
      categories.Uzun.count++;
      categories.Uzun.times.push(time);
    }
  });
  const total = Object.values(categories).reduce((s, c) => s + c.count, 0);
  return Object.entries(categories)
    .map(([category, d]) => ({
      category,
      count: d.count,
      avgTime:
        d.times.length > 0
          ? Math.round(d.times.reduce((a, b) => a + b, 0) / d.times.length)
          : 0,
      percentage:
        total > 0 ? Math.round((d.count / total) * 1000) / 10 : 0,
      fill: d.fill,
    }))
    .filter((c) => c.count > 0);
}

export function calculateCleanBTagAnalysis(
  data: ProcessedCleanData[]
): BTagAnalysis[] {
  const btagMap: Record<string, { count: number; volume: number }> = {};
  data.forEach((d) => {
    const btag = (d.btag || "Belirtilmemis").trim() || "Belirtilmemis";
    if (!btagMap[btag]) btagMap[btag] = { count: 0, volume: 0 };
    btagMap[btag].count++;
    btagMap[btag].volume += d.bonusValueNum;
  });
  return Object.entries(btagMap)
    .map(([btag, d]) => ({
      btag,
      transactionCount: d.count,
      totalVolume: Math.round(d.volume * 100) / 100,
    }))
    .sort((a, b) => b.transactionCount - a.transactionCount);
}

export function calculateCleanTopBonuses(
  data: ProcessedCleanData[]
): TopBonus[] {
  const bonusMap: Record<
    string,
    { count: number; paid: number; hesaplama: number }
  > = {};
  data.forEach((d) => {
    const bonusName = (d.bonus_name || "Bilinmiyor").trim();
    if (!bonusMap[bonusName])
      bonusMap[bonusName] = { count: 0, paid: 0, hesaplama: 0 };
    bonusMap[bonusName].count++;
    bonusMap[bonusName].paid += d.totalPaidNum;
    bonusMap[bonusName].hesaplama += d.bonusValueNum;
  });
  return Object.entries(bonusMap)
    .map(([bonusName, d]) => ({
      bonusName,
      transactionCount: d.count,
      totalPaid: Math.round(d.paid * 100) / 100,
      totalHesaplama: Math.round(d.hesaplama * 100) / 100,
    }))
    .sort((a, b) => b.transactionCount - a.transactionCount)
    .slice(0, 15);
}

export function calculatePaidBonuses(
  data: ProcessedCleanData[]
): TopBonus[] {
  const bonusMap: Record<
    string,
    { count: number; paid: number; hesaplama: number }
  > = {};
  data.forEach((d) => {
    if (d.totalPaidNum <= 0) return;
    const bonusName = (d.bonus_name || "Bilinmiyor").trim();
    if (!bonusMap[bonusName])
      bonusMap[bonusName] = { count: 0, paid: 0, hesaplama: 0 };
    bonusMap[bonusName].count++;
    bonusMap[bonusName].paid += d.totalPaidNum;
    bonusMap[bonusName].hesaplama += d.bonusValueNum;
  });
  return Object.entries(bonusMap)
    .map(([bonusName, d]) => ({
      bonusName,
      transactionCount: d.count,
      totalPaid: Math.round(d.paid * 100) / 100,
      totalHesaplama: Math.round(d.hesaplama * 100) / 100,
    }))
    .sort((a, b) => b.totalPaid - a.totalPaid)
    .slice(0, 10);
}

export function calculateUnpaidBonuses(
  data: ProcessedCleanData[]
): TopBonus[] {
  const bonusMap: Record<
    string,
    { count: number; paid: number; hesaplama: number }
  > = {};
  data.forEach((d) => {
    if (d.totalPaidNum > 0) return;
    const bonusName = (d.bonus_name || "Bilinmiyor").trim();
    if (!bonusMap[bonusName])
      bonusMap[bonusName] = { count: 0, paid: 0, hesaplama: 0 };
    bonusMap[bonusName].count++;
    bonusMap[bonusName].hesaplama += d.bonusValueNum;
  });
  return Object.entries(bonusMap)
    .map(([bonusName, d]) => ({
      bonusName,
      transactionCount: d.count,
      totalPaid: 0,
      totalHesaplama: Math.round(d.hesaplama * 100) / 100,
    }))
    .sort((a, b) => b.transactionCount - a.transactionCount)
    .slice(0, 10);
}

export function calculateCategoryData(
  data: ProcessedCleanData[]
): CategoryData[] {
  const categoryMap: Record<string, number> = {};
  data.forEach((d) => {
    const category = (d.category || "Diger").trim() || "Diger";
    categoryMap[category] = (categoryMap[category] || 0) + 1;
  });
  return Object.entries(categoryMap)
    .map(([category, count], index) => ({
      category,
      count,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }))
    .sort((a, b) => b.count - a.count);
}

export function calculateProductData(
  data: ProcessedCleanData[]
): ProductData[] {
  const productMap: Record<
    string,
    { count: number; volume: number; paid: number }
  > = {};
  data.forEach((d) => {
    let product = (
      (d as Record<string, unknown>).product as string || "Belirtilmemis"
    ).trim();
    if (!product || product === "undefined" || product === "null")
      product = "Belirtilmemis";
    const productLower = product.toLowerCase();
    if (
      productLower.includes("spor") ||
      productLower.includes("sport") ||
      productLower.includes("bahis")
    )
      product = "Spor";
    else if (
      productLower.includes("casino") ||
      productLower.includes("slot") ||
      productLower.includes("live")
    )
      product = "Casino";
    if (!productMap[product])
      productMap[product] = { count: 0, volume: 0, paid: 0 };
    productMap[product].count++;
    productMap[product].volume += d.bonusValueNum || 0;
    productMap[product].paid += d.totalPaidNum || 0;
  });
  const colors: Record<string, string> = {
    Spor: "hsl(var(--chart-1))",
    Casino: "hsl(var(--chart-2))",
    Belirtilmemis: "hsl(var(--chart-3))",
  };
  return Object.entries(productMap)
    .map(([product, stats], index) => ({
      product,
      count: stats.count,
      volume: Math.round(stats.volume * 100) / 100,
      paid: Math.round(stats.paid * 100) / 100,
      fill: colors[product] || `hsl(var(--chart-${(index % 5) + 1}))`,
    }))
    .sort((a, b) => b.count - a.count);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("tr-TR").format(value);
}
