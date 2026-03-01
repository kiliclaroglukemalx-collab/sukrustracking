/**
 * Yeni Oyuncular Analiz Modülü
 * Admin panelinden kopyalanan tablo metnini parse edip analiz üretir.
 * Kolon isimleri yoksa sabit kolon sırasına göre pozisyon bazlı map kullanılır.
 */

// Sabit kolon sırası (0-indexed) - header yoksa veya parse edilemezse kullanılır
// 1.Oyuncu Kimliği 2.Giriş 3.Ad 4.Para birimi 5.Oluşturuldu 6.Para Yatırma Sayısı
// 7.Para Yatırma Miktarı 8.Ortalama... 9.Para Yatırma Miktarı in (TRY) 10.Ortalama... in (TRY)
// 11.İlk Para Yatırma Tarihi 12.Son... 13.BTag
const FIXED_COL_INDEX = {
  playerId: 0,
  created: 4,        // 5. kolon
  depositCount: 5,   // 6. kolon
  depositAmount: 8,  // 9. kolon (Para Yatırma Miktarı in TRY)
  firstDepositDate: 10, // 11. kolon
  btag: 12,          // 13. kolon
} as const;

// Kolon eşleştirme (header varsa yakın eşleşme)
const COL_ALIASES: Record<string, string[]> = {
  player_id: ["Oyuncu Kimliği", "Oyuncu ID", "Player ID", "player_id", "id"],
  created: [
    "Oluşturuldu",
    "Olusturuldu",
    "Kayıt Tarihi",
    "Kayit Tarihi",
    "created",
    "registration_date",
  ],
  deposit_count: [
    "Para Yatırma Sayısı",
    "Para Yatirma Sayisi",
    "deposit_count",
    "Yatırım Sayısı",
  ],
  deposit_amount: [
    "Para Yatırma Miktarı in (TRY)",
    "Para Yatırma Miktarı (TRY)",
    "Para Yatirma Miktari in (TRY)",
    "deposit_amount",
    "Toplam Yatırım",
  ],
  btag: ["BTag", "btag", "Market", "market", "Kanal"],
  first_deposit_date: [
    "İlk Para Yatırma Tarihi",
    "Ilk Para Yatirma Tarihi",
    "first_deposit_date",
  ],
};

function findColumnIndex(headers: string[], aliases: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const a = alias.toLowerCase();
    const idx = lower.findIndex((h) => h.includes(a) || a.includes(h));
    if (idx >= 0) return idx;
  }
  return -1;
}

/** İlk satırın veri mi header mı olduğunu tespit et. İlk kolonda büyük sayısal ID (örn 3882xxxx) varsa veri. */
function looksLikeDataRow(cells: string[]): boolean {
  const first = (cells[0] ?? "").trim();
  if (!first) return false;
  // 6+ haneli sayı veya 3882xxxx gibi pattern -> Oyuncu Kimliği = veri
  if (/^\d{6,}$/.test(first)) return true;
  if (/^38\d{6,}$/.test(first)) return true;
  // Tarih formatı (ilk kolon) -> muhtemelen veri (bazı exportlarda sıra farklı olabilir)
  if (/^\d{4}-\d{2}-\d{2}/.test(first) || /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(first))
    return true;
  // Header kelimeleri varsa header
  const headerWords = ["oyuncu", "olusturuldu", "btag", "para yatirma", "giriş", "giris"];
  const firstLower = first.toLowerCase();
  if (headerWords.some((w) => firstLower.includes(w))) return false;
  return false;
}

function parseNumber(val: string): number {
  if (!val || typeof val !== "string") return 0;
  const cleaned = val
    .replace(/[₺TRY\s]/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseDate(val: string): Date | null {
  if (!val || typeof val !== "string") return null;
  const s = val.trim();
  // YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  // YY-MM-DD (ornegin 23-02-26 -> 2023-02-26)
  m = s.match(/^(\d{2})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const y = parseInt(m[1]) < 50 ? 2000 + parseInt(m[1]) : 1900 + parseInt(m[1]);
    const d = new Date(y, parseInt(m[2]) - 1, parseInt(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  // DD-MM-YYYY, DD.MM.YYYY
  m = s.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
    const d = new Date(y, parseInt(m[2]) - 1, parseInt(m[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export interface ParsedRow {
  playerId: string;
  created: Date | null;
  depositCount: number;
  depositAmount: number;
  btag: string;
  firstDepositDate: Date | null;
  dateParseFailed: boolean;
  raw: Record<string, string>;
}

export interface DataQualitySummary {
  rowCount: number;
  uniquePlayers: number;
  missingColumns: string[];
  parseErrors: number;
  dateParseFailed: number;
  invalidValues: number;
}

export interface KPIMetrics {
  toplamOyuncu: number;
  paraYatiranOyuncu: number;
  conversion: number;
  toplamTutar: number;
  arppu: number;
  avgTxnPerPayer: number;
}

export interface BTagRow {
  btag: string;
  totalPlayers: number;
  payingPlayers: number;
  conversion: number;
  totalAmountTry: number;
  arppu: number;
  avgTxnPerPayer: number;
}

export interface RegistrationCohortRow {
  date: string;
  newPlayers: number;
  payers: number;
  conversion: number;
  avgTxnPerNewPlayer: number;
  avgTxnPerNewPayer: number;
  txn0: number;
  txn1: number;
  txn2_3: number;
  txn4Plus: number;
}

export interface FirstDepositMetrics {
  sameDayDepositRate: number;
  avgDelayDays: number;
  hasData: boolean;
}

export interface AnalysisResult {
  quality: DataQualitySummary;
  kpis: KPIMetrics;
  btagRows: BTagRow[];
  btagWarnings: string[];
  cohortRows: RegistrationCohortRow[];
  firstDeposit: FirstDepositMetrics;
  actionRecommendations: string[];
  executiveSummary: string[];
  usedPositionBasedMapping?: boolean;
}

export function parseTextTable(text: string): {
  rows: ParsedRow[];
  headers: string[];
  quality: DataQualitySummary;
  usedPositionBasedMapping: boolean;
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 1) {
    return {
      rows: [],
      headers: [],
      quality: {
        rowCount: 0,
        uniquePlayers: 0,
        missingColumns: ["Oluşturuldu", "Para Yatırma Sayısı", "Para Yatırma Miktarı", "BTag"],
        parseErrors: 0,
        dateParseFailed: 0,
        invalidValues: 0,
      },
      usedPositionBasedMapping: false,
    };
  }

  let sep: string | RegExp = lines[0].includes("\t") ? "\t" : /\s{2,}/;
  let firstRowCells = lines[0].split(sep).map((c) => c.trim());
  // Admin panelinden kopyalanan veri bazen tek boslukla ayrilir; 2+ boslukla az kolon gelirse tek bosluk dene
  if (firstRowCells.length < 6 && /^\d{6,}\s/.test(lines[0].trim())) {
    sep = /\s+/;
    firstRowCells = lines[0].split(sep).map((c) => c.trim());
  }
  const colCount = firstRowCells.length;

  // İlk satır veri mi header mı?
  const firstRowIsData = looksLikeDataRow(firstRowCells);

  type ColMap = { playerId: number; created: number; depositCount: number; depositAmount: number; btag: number; firstDepositDate: number };
  let colMap: ColMap;
  let rawHeaders: string[];
  let dataStartIndex: number;
  let usedPositionBasedMapping = false;

  if (firstRowIsData) {
    // Header yok, tüm satırlar veri. Pozisyon bazlı map. Eksik kolon varsa -1.
    usedPositionBasedMapping = true;
    rawHeaders = [
      "Oyuncu Kimliği", "Giriş", "Ad", "Para birimi", "Oluşturuldu",
      "Para Yatırma Sayısı", "Para Yatırma Miktarı", "Ortalama Para Yatırma Miktarı",
      "Para Yatırma Miktarı in (TRY)", "Ortalama Para Yatırma Miktarı in (TRY)",
      "İlk Para Yatırma Tarihi", "Son Para Yatırma Tarihi", "BTag",
    ];
    const depAmountIdx = colCount > 8 ? 8 : colCount > 6 ? 6 : -1;
    const btagIdx = colCount >= 13 ? 12 : colCount >= 12 ? 11 : -1;
    colMap = {
      playerId: colCount > 0 ? 0 : -1,
      created: colCount > 4 ? 4 : -1,
      depositCount: colCount > 5 ? 5 : -1,
      depositAmount: depAmountIdx,
      btag: btagIdx,
      firstDepositDate: colCount > 10 ? 10 : -1,
    };
    dataStartIndex = 0;
  } else {
    // İlk satır header. Önce isimle eşleştir, bulunamazsa pozisyon kullan.
    rawHeaders = firstRowCells;
    const byName = {
      playerId: findColumnIndex(rawHeaders, COL_ALIASES.player_id),
      created: findColumnIndex(rawHeaders, COL_ALIASES.created),
      depositCount: findColumnIndex(rawHeaders, COL_ALIASES.deposit_count),
      depositAmount: findColumnIndex(rawHeaders, COL_ALIASES.deposit_amount),
      btag: findColumnIndex(rawHeaders, COL_ALIASES.btag),
      firstDepositDate: findColumnIndex(rawHeaders, COL_ALIASES.first_deposit_date),
    };
    // Kritik kolonlar bulunamadıysa pozisyon bazlı kullan (kolon sayısı yeterliyse)
    const needPosition =
      byName.created < 0 || byName.depositCount < 0 || byName.depositAmount < 0 || byName.btag < 0;
    if (needPosition && colCount >= 6) {
      usedPositionBasedMapping = true;
      // Pozisyon bazlı: eksik kolon varsa -1, yoksa index kullan. Fazla kolon ignore.
      const depAmountIdx =
        colCount > 8 ? FIXED_COL_INDEX.depositAmount : colCount > 6 ? 6 : -1;
      colMap = {
        playerId: byName.playerId >= 0 ? byName.playerId : (colCount > 0 ? 0 : -1),
        created: byName.created >= 0 ? byName.created : (colCount > 4 ? 4 : -1),
        depositCount: byName.depositCount >= 0 ? byName.depositCount : (colCount > 5 ? 5 : -1),
        depositAmount: byName.depositAmount >= 0 ? byName.depositAmount : depAmountIdx,
        btag: byName.btag >= 0 ? byName.btag : (colCount >= 13 ? 12 : colCount >= 12 ? 11 : -1),
        firstDepositDate: byName.firstDepositDate >= 0 ? byName.firstDepositDate : (colCount > 10 ? 10 : -1),
      };
    } else {
      colMap = {
        playerId: byName.playerId,
        created: byName.created,
        depositCount: byName.depositCount,
        depositAmount: byName.depositAmount,
        btag: byName.btag,
        firstDepositDate: byName.firstDepositDate,
      };
    }
    dataStartIndex = 1;
  }

  const missingColumns: string[] = [];
  if (colMap.created < 0 || (usedPositionBasedMapping && colCount <= 4)) missingColumns.push("Oluşturuldu");
  if (colMap.depositCount < 0 || (usedPositionBasedMapping && colCount <= 5)) missingColumns.push("Para Yatırma Sayısı");
  if (colMap.depositAmount < 0 || (usedPositionBasedMapping && colCount <= 8)) missingColumns.push("Para Yatırma Miktarı");
  if (colMap.btag < 0 || (usedPositionBasedMapping && colCount <= 12)) missingColumns.push("BTag");

  const rows: ParsedRow[] = [];
  let dateParseFailed = 0;
  let invalidValues = 0;

  for (let i = dataStartIndex; i < lines.length; i++) {
    const cells = lines[i].split(sep).map((c) => c.trim());
    const raw: Record<string, string> = {};
    rawHeaders.forEach((h, idx) => {
      raw[h] = cells[idx] ?? "";
    });

    const safe = (idx: number) => (idx >= 0 && idx < cells.length ? cells[idx] : "");
    const createdVal = safe(colMap.created);
    const created = parseDate(createdVal);
    const dateFailed = colMap.created >= 0 && createdVal && !created;
    if (dateFailed) dateParseFailed++;

    const depositCount = parseNumber(colMap.depositCount >= 0 ? safe(colMap.depositCount) : "0");
    const depositAmount = parseNumber(colMap.depositAmount >= 0 ? safe(colMap.depositAmount) : "0");
    if (depositCount < 0 || depositAmount < 0) invalidValues++;

    const firstDepositDate = colMap.firstDepositDate >= 0
      ? parseDate(safe(colMap.firstDepositDate))
      : null;

    const btagVal =
      colMap.btag >= 0 ? String(safe(colMap.btag)).trim() || "UNKNOWN" : "UNKNOWN";

    rows.push({
      playerId: colMap.playerId >= 0 ? String(safe(colMap.playerId)).trim() : "",
      created,
      depositCount: Math.max(0, depositCount),
      depositAmount: Math.max(0, depositAmount),
      btag: btagVal,
      firstDepositDate: firstDepositDate ?? null,
      dateParseFailed: dateFailed,
      raw,
    });
  }

  const uniquePlayers = new Set(
    rows.map((r) => (r.playerId || JSON.stringify(r.raw)) as string)
  ).size;

  return {
    rows,
    headers: rawHeaders,
    quality: {
      rowCount: rows.length,
      uniquePlayers,
      missingColumns,
      parseErrors: 0,
      dateParseFailed,
      invalidValues,
    },
    usedPositionBasedMapping,
  };
}

export function analyzeData(rows: ParsedRow[]): AnalysisResult {
  const payers = rows.filter((r) => r.depositCount > 0);
  const totalPlayers = rows.length;
  const payingCount = payers.length;
  const totalTutar = payers.reduce((s, r) => s + r.depositAmount, 0);
  const totalTxn = payers.reduce((s, r) => s + r.depositCount, 0);

  const kpis: KPIMetrics = {
    toplamOyuncu: totalPlayers,
    paraYatiranOyuncu: payingCount,
    conversion: totalPlayers > 0 ? (payingCount / totalPlayers) * 100 : 0,
    toplamTutar: totalTutar,
    arppu: payingCount > 0 ? totalTutar / payingCount : 0,
    avgTxnPerPayer: payingCount > 0 ? totalTxn / payingCount : 0,
  };

  const btagMap = new Map<string, { rows: ParsedRow[]; payers: ParsedRow[] }>();
  rows.forEach((r) => {
    const key = r.btag || "UNKNOWN";
    if (!btagMap.has(key)) btagMap.set(key, { rows: [], payers: [] });
    btagMap.get(key)!.rows.push(r);
    if (r.depositCount > 0) btagMap.get(key)!.payers.push(r);
  });

  const btagRows: BTagRow[] = [];
  const btagWarnings: string[] = [];
  btagMap.forEach((data, btag) => {
    const total = data.rows.length;
    const pay = data.payers.length;
    const amt = data.payers.reduce((s, r) => s + r.depositAmount, 0);
    const txn = data.payers.reduce((s, r) => s + r.depositCount, 0);
    if (total < 10) btagWarnings.push(`BTag "${btag}" 10'dan az oyuncu içeriyor (${total})`);
    btagRows.push({
      btag,
      totalPlayers: total,
      payingPlayers: pay,
      conversion: total > 0 ? (pay / total) * 100 : 0,
      totalAmountTry: amt,
      arppu: pay > 0 ? amt / pay : 0,
      avgTxnPerPayer: pay > 0 ? txn / pay : 0,
    });
  });
  btagRows.sort((a, b) => b.totalPlayers - a.totalPlayers);

  const cohortMap = new Map<
    string,
    { rows: ParsedRow[]; payers: ParsedRow[]; txns: number[] }
  >();
  rows.forEach((r) => {
    const key = r.created
      ? r.created.toISOString().slice(0, 10)
      : "date_parse_failed";
    if (!cohortMap.has(key))
      cohortMap.set(key, { rows: [], payers: [], txns: [] });
    cohortMap.get(key)!.rows.push(r);
    if (r.depositCount > 0) cohortMap.get(key)!.payers.push(r);
    cohortMap.get(key)!.txns.push(r.depositCount);
  });

  const cohortRows: RegistrationCohortRow[] = [];
  cohortMap.forEach((data, date) => {
    if (date === "date_parse_failed") return;
    const total = data.rows.length;
    const pay = data.payers.length;
    const txn0 = data.txns.filter((t) => t === 0).length;
    const txn1 = data.txns.filter((t) => t === 1).length;
    const txn2_3 = data.txns.filter((t) => t >= 2 && t <= 3).length;
    const txn4Plus = data.txns.filter((t) => t >= 4).length;
    const totalTxn = data.txns.reduce((a, b) => a + b, 0);
    cohortRows.push({
      date,
      newPlayers: total,
      payers: pay,
      conversion: total > 0 ? (pay / total) * 100 : 0,
      avgTxnPerNewPlayer: total > 0 ? totalTxn / total : 0,
      avgTxnPerNewPayer: pay > 0 ? totalTxn / pay : 0,
      txn0,
      txn1,
      txn2_3,
      txn4Plus,
    });
  });
  cohortRows.sort((a, b) => a.date.localeCompare(b.date));

  let sameDayRate = 0;
  let avgDelayDays = 0;
  const hasFirstDeposit = rows.some((r) => r.firstDepositDate && r.created);
  if (hasFirstDeposit) {
    const delays: number[] = [];
    let sameDay = 0;
    rows.forEach((r) => {
      if (r.firstDepositDate && r.created && r.depositCount > 0) {
        const d =
          (r.firstDepositDate.getTime() - r.created.getTime()) /
          (1000 * 60 * 60 * 24);
        delays.push(d);
        if (d < 1) sameDay++;
      }
    });
    sameDayRate =
      delays.length > 0 ? (sameDay / delays.length) * 100 : 0;
    avgDelayDays =
      delays.length > 0
        ? delays.reduce((a, b) => a + b, 0) / delays.length
        : 0;
  }

  const actionRecommendations: string[] = [];
  if (kpis.conversion < 20)
    actionRecommendations.push(
      "Dönüşüm oranı düşük: Kayıt sonrası teşvik (bonus, hoş geldin kampanyası) ve onboarding sürecini güçlendirin."
    );
  if (kpis.arppu < 500 && payingCount > 0)
    actionRecommendations.push(
      "ARPPU düşük: Yüksek değerli oyunculara özel paketler ve VIP programları değerlendirin."
    );
  const bestBtag = btagRows[0];
  const worstBtag = btagRows.filter((b) => b.totalPlayers >= 10).pop();
  if (bestBtag && worstBtag && bestBtag.conversion - worstBtag.conversion > 15)
    actionRecommendations.push(
      `Kanal farkı belirgin: En iyi BTag "${bestBtag.btag}" (${bestBtag.conversion.toFixed(1)}%), en düşük "${worstBtag.btag}" (${worstBtag.conversion.toFixed(1)}%). Düşük performanslı kanalları optimize edin veya bütçeyi iyi performanslı kanallara kaydırın.`
    );
  if (sameDayRate < 30 && hasFirstDeposit)
    actionRecommendations.push(
      "Aynı gün yatırım oranı düşük: Kayıt anında teşvik (ilk yatırım bonusu) artırılabilir."
    );
  if (avgDelayDays > 3 && hasFirstDeposit)
    actionRecommendations.push(
      "İlk yatırım gecikmesi yüksek: Retargeting ve e-posta/SMS hatırlatmaları ile erken yatırımı teşvik edin."
    );
  if (actionRecommendations.length === 0)
    actionRecommendations.push("Genel performans iyi görünüyor. Mevcut kampanyaları sürdürün ve A/B testleri ile iyileştirme fırsatlarını değerlendirin.");

  const executiveSummary: string[] = [];
  executiveSummary.push(
    `Toplam ${kpis.toplamOyuncu} yeni oyuncu analiz edildi, ${kpis.paraYatiranOyuncu} para yatırdı (dönüşüm: %${kpis.conversion.toFixed(1)}).`
  );
  executiveSummary.push(
    `Toplam yatırım tutarı ₺${kpis.toplamTutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}. ARPPU: ₺${kpis.arppu.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}.`
  );
  if (btagRows.length > 0)
    executiveSummary.push(
      `En yüksek oyuncu sayısı "${btagRows[0].btag}" kanalında (${btagRows[0].totalPlayers} oyuncu).`
    );
  if (cohortRows.length > 0)
    executiveSummary.push(
      `${cohortRows.length} kayıt günü cohort'u analiz edildi.`
    );
  if (hasFirstDeposit)
    executiveSummary.push(
      `Aynı gün yatırım oranı %${sameDayRate.toFixed(1)}, ortalama ilk yatırım gecikmesi ${avgDelayDays.toFixed(1)} gün.`
    );
  executiveSummary.push(
    `${actionRecommendations.length} aksiyon önerisi raporun sonunda listelenmiştir.`
  );

  return {
    quality: {
      rowCount: rows.length,
      uniquePlayers: new Set(rows.map((r) => r.playerId || JSON.stringify(r.raw))).size,
      missingColumns: [],
      parseErrors: 0,
      dateParseFailed: rows.filter((r) => r.dateParseFailed).length,
      invalidValues: 0,
    },
    kpis,
    btagRows,
    btagWarnings,
    cohortRows,
    firstDeposit: {
      sameDayDepositRate: sameDayRate,
      avgDelayDays,
      hasData: hasFirstDeposit,
    },
    actionRecommendations,
    executiveSummary,
  };
}

export function formatTRY(n: number): string {
  return `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(n: number): string {
  return `%${n.toFixed(2)}`;
}
