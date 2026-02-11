"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useStore } from "@/lib/store";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RaporlarPage() {
  const { kasaData } = useStore();

  const toplamYatirim = kasaData.reduce((s, d) => s + d.toplamBorc, 0);
  const toplamCekim = kasaData.reduce((s, d) => s + d.toplamKredi, 0);
  const toplamKomisyon = kasaData.reduce((s, d) => s + d.komisyon, 0);
  const genelToplam = kasaData.reduce((s, d) => s + d.kalanKasa, 0);

  const sorted = [...kasaData].sort((a, b) => b.kalanKasa - a.kalanKasa);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Nav */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200 bg-white/90 px-5 py-3 backdrop-blur-sm">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span>Kasaya Don</span>
        </Link>
        <h1 className="text-sm font-bold tracking-wide text-neutral-900">
          Raporlar
        </h1>
        <div className="w-20" />
      </div>

      <div className="mx-auto max-w-3xl px-5 py-6">
        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard label="Toplam Yatirim" value={toplamYatirim} color="text-neutral-900" />
          <SummaryCard label="Toplam Komisyon" value={toplamKomisyon} color="text-amber-600" />
          <SummaryCard label="Toplam Cekim" value={toplamCekim} color="text-red-600" />
          <SummaryCard label="Genel Toplam" value={genelToplam} color="text-emerald-600" />
        </div>

        {/* Detailed Table */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">
            Yontem Bazinda Detay
          </h2>
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="grid grid-cols-[1fr_90px_90px_80px_80px_100px] gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
              {["Yontem", "Yatirim", "Cekim", "Komisyon", "%", "Kalan Kasa"].map(
                (h) => (
                  <span
                    key={h}
                    className="text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400"
                  >
                    {h}
                  </span>
                ),
              )}
            </div>
            {sorted.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_90px_90px_80px_80px_100px] items-center gap-2 border-b border-neutral-50 px-4 py-2 last:border-0 hover:bg-neutral-50/50"
              >
                <span className="text-sm font-medium text-neutral-800">
                  {row.odemeTuruAdi}
                </span>
                <span className="font-mono text-xs text-neutral-600">
                  {formatCurrency(row.toplamBorc)}
                </span>
                <span className="font-mono text-xs text-red-500">
                  {formatCurrency(row.toplamKredi)}
                </span>
                <span className="font-mono text-xs text-amber-600">
                  {formatCurrency(row.komisyon)}
                </span>
                <span className="font-mono text-xs text-neutral-400">
                  %{row.komisyonOrani}
                </span>
                <span
                  className={`flex items-center gap-1 font-mono text-xs font-bold ${
                    row.kalanKasa >= 0 ? "text-neutral-900" : "text-red-600"
                  }`}
                >
                  {row.kalanKasa > 0 ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" strokeWidth={2} />
                  ) : row.kalanKasa < 0 ? (
                    <TrendingDown className="h-3 w-3 text-red-500" strokeWidth={2} />
                  ) : (
                    <Minus className="h-3 w-3 text-neutral-300" strokeWidth={2} />
                  )}
                  {formatCurrency(row.kalanKasa)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-4">
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
        {label}
      </span>
      <span className={`font-mono text-lg font-black tabular-nums ${color}`}>
        {"₺"}{formatCurrency(value)}
      </span>
    </div>
  );
}
