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
} from "lucide-react";
import { useStore } from "@/lib/store";
import { KpiCard } from "@/components/report/kpi-card";
import {
  parseTextTable,
  analyzeData,
  formatTRY,
  formatPercent,
  type AnalysisResult,
} from "@/lib/yeni-oyuncular-analyzer";

export default function YeniOyuncularPage() {
  const { role } = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setHydrated(true);
  }, []);

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
        <p className="mb-1 text-sm font-medium text-neutral-300">
          Erisim Engellendi
        </p>
        <p className="mb-4 text-xs text-neutral-500">
          Bu sayfa sadece Master kullanicilar icindir
        </p>
        <Link
          href="/raporlar"
          className="text-xs text-neutral-400 underline hover:text-white"
        >
          Raporlara Don
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/90 px-5 py-3 backdrop-blur-sm">
        <Link
          href="/raporlar"
          className="flex items-center gap-2 text-xs text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span>Raporlar</span>
        </Link>
        <h1 className="text-sm font-bold tracking-wide text-white">
          Yeni Oyuncular
        </h1>
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
            <h2 className="text-base font-bold text-white">
              Yeni Oyuncular Analizi
            </h2>
            <p className="text-xs text-neutral-500">
              Admin panelinden kopyaladiginiz tabloyu yapistirin. KPI&apos;lar,
              BTag kirilimi ve aksiyon onerileri uretilir.
            </p>
          </div>
        </div>

        {!result ? (
          <div className="mb-8 rounded-xl border border-white/10 bg-white p-6 shadow-lg">
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Tablo Verisi (Tab veya coklu boslukla ayrilmis)
            </label>
            <p className="mb-2 text-xs text-neutral-500">
              Kolon basliklari opsiyoneldir. Header yoksa sabit kolon sirasina gore okunur (1.Oyuncu Kimligi, 5.Olusturuldu, 6.Para Yatirma Sayisi, 9.Para Yatirma Miktari TRY, 13.BTag).
            </p>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Admin panelinden tabloyu (baslikli veya basliksiz) kopyalayip buraya yapistirin..."
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
          <div className="space-y-8">
            {/* 1. KPI Kartlari */}
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
                    description: "Sadece para yatıran oyuncu başına ortalama gelir. Formül: Toplam Tutar / Yatıran Oyuncu",
                  },
                  {
                    label: "Ort. Txn",
                    value: result.kpis.avgTxnPerPayer.toFixed(2),
                    description: "Para yatıran oyuncu başına ortalama işlem sayısı. Formül: Toplam Para Yatırma Sayısı / Yatıran Oyuncu",
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

            {/* 3. BTag Kirilimi */}
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
                      <th className="px-4 py-2 text-left font-semibold text-neutral-800">
                        BTag
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-800">
                        Oyuncu
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-800">
                        Yatiran
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-800">
                        Conversion
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-800">
                        Tutar
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-800">
                        ARPPU
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-800">
                        Ort. Txn
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.btagRows.map((r, i) => (
                      <tr
                        key={i}
                        className="border-b border-neutral-200 bg-white hover:bg-neutral-50"
                      >
                        <td className="px-4 py-2 font-medium text-neutral-800">
                          {r.btag}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-800">
                          {r.totalPlayers}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-800">
                          {r.payingPlayers}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-800">
                          {formatPercent(r.conversion)}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-800">
                          {formatTRY(r.totalAmountTry)}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-800">
                          {formatTRY(r.arppu)}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-800">
                          {r.avgTxnPerPayer.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.btagRows.length >= 2 && (
                <p className="mt-3 text-xs text-neutral-600">
                  En iyi:{" "}
                  <strong>{result.btagRows[0].btag}</strong> (
                  {formatPercent(result.btagRows[0].conversion)}). En dusuk
                  performansli:{" "}
                  <strong>
                    {
                      result.btagRows.filter((b) => b.totalPlayers >= 10).pop()
                        ?.btag
                    }
                  </strong>
                  .
                </p>
              )}
            </section>

            {/* 4. Yeni Kayit Davranisi */}
            <section className="rounded-xl border border-white/10 bg-white p-6 shadow-lg">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-800">
                <Calendar className="h-4 w-4 text-violet-500" />
                Yeni Kayit Davranisi (Kayit Gunu Cohort&apos;u)
              </h3>
              <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-100">
                      <th className="px-4 py-2 text-left font-semibold text-neutral-800">
                        Tarih
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-800">
                        Yeni
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-800">
                        Yatiran
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-800">
                        Conv.
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-800">
                        0 islem
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-800">
                        1 islem
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-800">
                        2-3
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-800">
                        4+
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.cohortRows.map((r, i) => (
                      <tr
                        key={i}
                        className="border-b border-neutral-200 bg-white hover:bg-neutral-50"
                      >
                        <td className="px-4 py-2 font-medium text-neutral-800">
                          {r.date}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-800">
                          {r.newPlayers}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-800">
                          {r.payers}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-800">
                          {formatPercent(r.conversion)}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-800">
                          {r.txn0}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-800">
                          {r.txn1}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-800">
                          {r.txn2_3}
                        </td>
                        <td className="px-4 py-2 text-right text-neutral-800">
                          {r.txn4Plus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. Ilk Para Yatirma Tarihi */}
            {result.firstDeposit.hasData && (
              <section className="rounded-xl border border-white/10 bg-white p-6 shadow-lg">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-800">
                  <TrendingUp className="h-4 w-4 text-violet-500" />
                  Ilk Para Yatirma Analizi
                </h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-neutral-200 bg-white p-4">
                    <p className="text-[10px] font-medium uppercase text-neutral-500">
                      Ayni Gun Yatirim Orani
                    </p>
                    <p className="text-xl font-bold text-violet-600">
                      {formatPercent(result.firstDeposit.sameDayDepositRate)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-4">
                    <p className="text-[10px] font-medium uppercase text-neutral-500">
                      Ort. Gecikme (gun)
                    </p>
                    <p className="text-xl font-bold text-neutral-800">
                      {result.firstDeposit.avgDelayDays.toFixed(1)}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 6. Aksiyon Onerileri */}
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

            {/* Executive Summary */}
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

            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              Yeni Analiz Icin Temizle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
