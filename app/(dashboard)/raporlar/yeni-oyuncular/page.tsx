"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  Users,
  ClipboardPaste,
  AlertCircle,
  TrendingUp,
  Tag,
  Calendar,
  Lightbulb,
  FileText,
  Trash2,
  Save,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { KpiCard } from "@/components/report/kpi-card";
import {
  parseTextTable,
  analyzeData,
  deserializeParsedRows,
  formatTRY,
  formatPercent,
  type AnalysisResult,
  type ParsedRow,
} from "@/lib/yeni-oyuncular-analyzer";
import {
  getYeniOyuncularDaily,
  saveYeniOyuncularDaily,
  deleteYeniOyuncularDay,
} from "@/lib/actions";

type TabMode = "gun-ekle" | "tek-analiz" | "aylik-sunum";

function toYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toYYYYMM(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function AnalysisResultView({
  result,
  onClear,
  clearLabel = "Yeni Analiz Icin Temizle",
}: {
  result: AnalysisResult;
  onClear?: () => void;
  clearLabel?: string;
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-white/10 bg-white p-6 shadow-lg">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-800">
          <TrendingUp className="h-4 w-4 text-violet-500" />
          KPI&apos;lar
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label: "Toplam Oyuncu",
              value: result.kpis.toplamOyuncu,
              description: "Analiz edilen toplam benzersiz oyuncu sayısı.",
            },
            {
              label: "Para Yatiran Oyuncu",
              value: result.kpis.paraYatiranOyuncu,
              description: "En az 1 para yatırma işlemi yapan oyuncu sayısı.",
            },
            {
              label: "Conversion",
              value: `%${result.kpis.conversion.toFixed(2)}`,
              description: "Yatıran / Oyuncu oranı",
            },
            {
              label: "Toplam Tutar (TRY)",
              value: result.kpis.toplamTutar,
              prefix: "₺" as const,
              color: "green" as const,
              description: "Para yatıran oyuncuların toplam yatırım tutarı.",
            },
            {
              label: "ARPPU",
              value: result.kpis.arppu.toFixed(2),
              prefix: "₺" as const,
              color: "blue" as const,
              description: "Sadece para yatıran oyuncu başına ortalama gelir.",
            },
            {
              label: "Ort. Txn",
              value: result.kpis.avgTxnPerPayer.toFixed(2),
              description: "Para yatıran oyuncu başına ortalama işlem sayısı.",
            },
          ].map((item, i) => (
            <div key={i} className="flex min-w-[140px] flex-col gap-2">
              <KpiCard
                label={item.label}
                value={item.value}
                prefix={"prefix" in item ? item.prefix : undefined}
                color={"color" in item ? item.color : undefined}
              />
              <div className="min-h-[3rem] rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[11px] leading-snug text-neutral-600 shadow-sm transition-colors hover:bg-neutral-100">
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white p-6 shadow-lg">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-800">
          <Tag className="h-4 w-4 text-violet-500" />
          BTag (Market) Kirilimi
        </h3>
        {result.btagWarnings.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {result.btagWarnings.map((w, i) => (
              <div
                key={i}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
              >
                {w}
              </div>
            ))}
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100">
                <th className="px-4 py-2 text-left font-semibold text-neutral-800">BTag</th>
                <th className="px-4 py-2 text-right font-semibold text-neutral-800">Oyuncu</th>
                <th className="px-4 py-2 text-right font-semibold text-neutral-800">Yatiran</th>
                <th className="px-4 py-2 text-right font-semibold text-neutral-800">Conversion</th>
                <th className="px-4 py-2 text-right font-semibold text-neutral-800">Tutar</th>
                <th className="px-4 py-2 text-right font-semibold text-neutral-800">ARPPU</th>
                <th className="px-4 py-2 text-right font-semibold text-neutral-800">Ort. Txn</th>
              </tr>
            </thead>
            <tbody>
              {result.btagRows.map((r, i) => (
                <tr key={i} className="border-b border-neutral-200 bg-white hover:bg-neutral-50">
                  <td className="px-4 py-2 font-medium text-neutral-800">{r.btag}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{r.totalPlayers}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{r.payingPlayers}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{formatPercent(r.conversion)}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{formatTRY(r.totalAmountTry)}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{formatTRY(r.arppu)}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{r.avgTxnPerPayer.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white p-6 shadow-lg">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-800">
          <Calendar className="h-4 w-4 text-violet-500" />
          Yeni Kayit Davranisi (Kayit Gunu Cohort&apos;u)
        </h3>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100">
                <th className="px-4 py-2 text-left font-semibold text-neutral-800">Tarih</th>
                <th className="px-4 py-2 text-right font-semibold text-neutral-800">Yeni</th>
                <th className="px-4 py-2 text-right font-semibold text-neutral-800">Yatiran</th>
                <th className="px-4 py-2 text-right font-semibold text-neutral-800">Conv.</th>
                <th className="px-4 py-2 text-right font-semibold text-neutral-800">0 islem</th>
                <th className="px-4 py-2 text-right font-semibold text-neutral-800">1 islem</th>
                <th className="px-4 py-2 text-right font-semibold text-neutral-800">2-3</th>
                <th className="px-4 py-2 text-right font-semibold text-neutral-800">4+</th>
              </tr>
            </thead>
            <tbody>
              {result.cohortRows.map((r, i) => (
                <tr key={i} className="border-b border-neutral-200 bg-white hover:bg-neutral-50">
                  <td className="px-4 py-2 font-medium text-neutral-800">{r.date}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{r.newPlayers}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{r.payers}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{formatPercent(r.conversion)}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{r.txn0}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{r.txn1}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{r.txn2_3}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{r.txn4Plus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {result.firstDeposit.hasData && (
        <section className="rounded-xl border border-white/10 bg-white p-6 shadow-lg">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-800">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            Ilk Para Yatirma Analizi
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-[10px] font-medium uppercase text-neutral-500">Ayni Gun Yatirim Orani</p>
              <p className="text-xl font-bold text-violet-600">{formatPercent(result.firstDeposit.sameDayDepositRate)}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-[10px] font-medium uppercase text-neutral-500">Ort. Gecikme (gun)</p>
              <p className="text-xl font-bold text-neutral-800">{result.firstDeposit.avgDelayDays.toFixed(1)}</p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-md shadow-neutral-300/30">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-amber-800">
          <Lightbulb className="h-4 w-4 text-amber-600" />
          Aksiyon Onerileri
        </h3>
        <ul className="list-inside list-disc space-y-2 text-sm text-amber-900">
          {result.actionRecommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-violet-200 bg-violet-50/50 p-6 shadow-md shadow-neutral-300/30">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-violet-800">
          <FileText className="h-4 w-4 text-violet-600" />
          Executive Summary
        </h3>
        <ol className="list-inside list-decimal space-y-2 text-sm text-violet-900">
          {result.executiveSummary.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
}

export default function YeniOyuncularPage() {
  const { role } = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<TabMode>("gun-ekle");

  // Tek analiz
  const [pastedText, setPastedText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  // Gün ekle
  const [selectedDate, setSelectedDate] = useState(() => toYYYYMMDD(new Date()));
  const [dailyPastedText, setDailyPastedText] = useState("");
  const [dailyResult, setDailyResult] = useState<AnalysisResult | null>(null);
  const [dailyRows, setDailyRows] = useState<ParsedRow[] | null>(null);
  const [dailyError, setDailyError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedDays, setSavedDays] = useState<Record<string, { rawText: string; rows: unknown[] }>>({});
  const [loadingDays, setLoadingDays] = useState(true);

  // Aylık sunum
  const [selectedMonth, setSelectedMonth] = useState(() => toYYYYMM(new Date()));
  const [monthlyResult, setMonthlyResult] = useState<AnalysisResult | null>(null);
  const [monthlyError, setMonthlyError] = useState("");

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (tab === "gun-ekle" || tab === "aylik-sunum") {
      setLoadingDays(true);
      getYeniOyuncularDaily().then((data) => {
        setSavedDays(data);
        setLoadingDays(false);
      });
    }
  }, [tab]);

  useEffect(() => {
    if (tab !== "aylik-sunum") return;
    setMonthlyResult(null);
    setMonthlyError("");
    const dates = Object.keys(savedDays).filter((d) => d.startsWith(selectedMonth));
    if (dates.length === 0) {
      setMonthlyError("Bu ay icin kayitli gun yok. Once Gun Ekle bolumunden veri ekleyin.");
      return;
    }
    const allRows: ParsedRow[] = [];
    const seen = new Set<string>();
    for (const d of dates.sort()) {
      const entry = savedDays[d];
      if (!entry?.rows) continue;
      const rows = deserializeParsedRows(entry.rows);
      for (const r of rows) {
        const key = r.playerId || JSON.stringify(r.raw);
        if (!seen.has(key)) {
          seen.add(key);
          allRows.push(r);
        }
      }
    }
    if (allRows.length === 0) {
      setMonthlyError("Bu ay icin gecerli veri bulunamadi.");
      return;
    }
    const analysis = analyzeData(allRows);
    analysis.quality = {
      rowCount: allRows.length,
      uniquePlayers: allRows.length,
      missingColumns: [],
      parseErrors: 0,
      dateParseFailed: 0,
      invalidValues: 0,
    };
    setMonthlyResult(analysis);
  }, [tab, selectedMonth, savedDays]);

  const handleAnalyze = () => {
    setError("");
    setResult(null);
    if (!pastedText.trim()) {
      setError("Lutfen admin panelinden kopyaladiginiz tabloyu yapistirin.");
      return;
    }
    try {
      const { rows, quality: q, usedPositionBasedMapping } = parseTextTable(pastedText);
      if (rows.length === 0) {
        setError("Tablodan veri cikarilamadi. Tab veya boslukla ayrilmis satirlar oldugundan emin olun.");
        return;
      }
      const analysis = analyzeData(rows);
      analysis.quality = q;
      analysis.usedPositionBasedMapping = usedPositionBasedMapping;
      setResult(analysis);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Veri islenirken hata olustu.";
      setError(`Veri islenirken hata olustu. ${msg}`);
    }
  };

  const handleDailyAnalyze = () => {
    setDailyError("");
    setDailyResult(null);
    setDailyRows(null);
    if (!dailyPastedText.trim()) {
      setDailyError("Lutfen admin panelinden kopyaladiginiz tabloyu yapistirin.");
      return;
    }
    try {
      const { rows, quality: q, usedPositionBasedMapping } = parseTextTable(dailyPastedText);
      if (rows.length === 0) {
        setDailyError("Tablodan veri cikarilamadi.");
        return;
      }
      const analysis = analyzeData(rows);
      analysis.quality = q;
      analysis.usedPositionBasedMapping = usedPositionBasedMapping;
      setDailyResult(analysis);
      setDailyRows(rows);
    } catch (err) {
      console.error(err);
      setDailyError("Veri islenirken hata olustu.");
    }
  };

  const handleDailySave = async () => {
    if (!dailyRows || dailyRows.length === 0) return;
    setSaving(true);
    await saveYeniOyuncularDaily(selectedDate, dailyPastedText, dailyRows);
    const data = await getYeniOyuncularDaily();
    setSavedDays(data);
    setDailyPastedText("");
    setDailyResult(null);
    setDailyRows(null);
    setSaving(false);
  };

  const handleDeleteDay = async (date: string) => {
    await deleteYeniOyuncularDay(date);
    setSavedDays(await getYeniOyuncularDaily());
    if (tab === "aylik-sunum" && date.startsWith(selectedMonth)) {
      setMonthlyResult(null);
    }
  };

  const handleClear = () => {
    setPastedText("");
    setResult(null);
    setError("");
  };

  if (!hydrated) {
    return <div className="min-h-screen bg-black" />;
  }

  if (role === "basic") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black">
        <Lock className="mb-3 h-8 w-8 text-neutral-500" strokeWidth={1.5} />
        <p className="mb-1 text-sm font-medium text-neutral-300">Erisim Engellendi</p>
        <p className="mb-4 text-xs text-neutral-500">Bu sayfa sadece Master kullanicilar icindir</p>
        <Link href="/raporlar" className="text-xs text-neutral-400 underline hover:text-white">
          Raporlara Don
        </Link>
      </div>
    );
  }

  const tabs: { id: TabMode; label: string; icon: React.ReactNode }[] = [
    { id: "gun-ekle", label: "Gun Ekle", icon: <CalendarDays className="h-4 w-4" /> },
    { id: "tek-analiz", label: "Tek Analiz", icon: <ClipboardPaste className="h-4 w-4" /> },
    { id: "aylik-sunum", label: "Aylik Sunum", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/90 px-5 py-3 backdrop-blur-sm">
        <Link href="/raporlar" className="flex items-center gap-2 text-xs text-neutral-400 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span>Raporlar</span>
        </Link>
        <h1 className="text-sm font-bold tracking-wide text-white">Yeni Oyuncular</h1>
        {result && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-[10px] font-medium text-neutral-400 transition-colors hover:bg-white/10 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" strokeWidth={1.5} />
            Temizle
          </button>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-5 py-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
            <Users className="h-6 w-6 text-violet-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Yeni Oyuncular Analizi</h2>
            <p className="text-xs text-neutral-500">
              Gun gun veri ekleyin, tek seferlik analiz yapin veya aylik kumulatif sunumu goruntuleyin.
            </p>
          </div>
        </div>

        <div className="mb-6 flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id ? "bg-violet-600 text-white" : "text-neutral-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === "gun-ekle" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-white p-6 shadow-lg">
              <label className="mb-2 block text-sm font-medium text-neutral-700">Tarih</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mb-4 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <label className="mb-2 block text-sm font-medium text-neutral-700">Tablo Verisi</label>
              <textarea
                value={dailyPastedText}
                onChange={(e) => setDailyPastedText(e.target.value)}
                placeholder="Admin panelinden tabloyu kopyalayip yapistirin..."
                className="h-40 w-full resize-y rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {dailyError && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {dailyError}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleDailyAnalyze}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                >
                  <ClipboardPaste className="h-4 w-4" strokeWidth={1.5} />
                  Analiz Et
                </button>
                {dailyResult && dailyRows && (
                  <button
                    type="button"
                    onClick={handleDailySave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" strokeWidth={1.5} />
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                )}
              </div>
            </div>

            {dailyResult && dailyRows && (
              <>
                <p className="text-xs text-neutral-400">
                  {selectedDate} icin {dailyRows.length} satir. Kaydettikten sonra Aylik Sunum bolumunde kumulatif goruntulenecek.
                </p>
                <AnalysisResultView result={dailyResult} />
              </>
            )}

            {!dailyResult && (
              <div className="rounded-xl border border-white/10 bg-white p-6 shadow-lg">
                <h3 className="mb-3 text-sm font-bold text-neutral-800">Kayitli Gunler</h3>
                {loadingDays ? (
                  <p className="text-xs text-neutral-500">Yukleniyor...</p>
                ) : Object.keys(savedDays).length === 0 ? (
                  <p className="text-xs text-neutral-500">Henuz kayitli gun yok.</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.keys(savedDays)
                      .sort()
                      .reverse()
                      .map((d) => (
                        <li key={d} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2">
                          <span className="text-sm font-medium text-neutral-800">{d}</span>
                          <span className="text-xs text-neutral-500">{savedDays[d].rows?.length ?? 0} satir</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteDay(d)}
                            className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-red-100 hover:text-red-600"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "tek-analiz" && (
          <>
            {!result ? (
              <div className="mb-8 rounded-xl border border-white/10 bg-white p-6 shadow-lg">
                <label className="mb-2 block text-sm font-medium text-neutral-700">Tablo Verisi</label>
                <p className="mb-2 text-xs text-neutral-500">
                  Kolon basliklari opsiyoneldir. Kaydetmeden tek seferlik analiz yapilir.
                </p>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Admin panelinden tabloyu kopyalayip buraya yapistirin..."
                  className="h-48 w-full resize-y rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  rows={10}
                />
                {error && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAnalyze}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                >
                  <ClipboardPaste className="h-4 w-4" strokeWidth={1.5} />
                  Analiz Et
                </button>
              </div>
            ) : (
              <AnalysisResultView result={result} onClear={handleClear} />
            )}
          </>
        )}

        {tab === "aylik-sunum" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-white p-6 shadow-lg">
              <label className="mb-2 block text-sm font-medium text-neutral-700">Ay Secin</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {monthlyError && !monthlyResult && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {monthlyError}
              </div>
            )}

            {monthlyResult && (
              <>
                <p className="text-sm text-neutral-400">
                  {selectedMonth} icin {Object.keys(savedDays).filter((d) => d.startsWith(selectedMonth)).length} gunun kumulatif analizi.
                </p>
                <AnalysisResultView result={monthlyResult} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
