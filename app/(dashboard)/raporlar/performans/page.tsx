"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Lock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { getReportData } from "@/lib/actions";
import type { KasaCardData } from "@/lib/excel-processor";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const LEAGUE_COLORS = [
  { bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-500" },
  { bg: "bg-neutral-50", text: "text-neutral-600", badge: "bg-neutral-400" },
  { bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-400" },
];

export default function PerformansPage() {
  const { role } = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [reportPerformansData, setReportPerformansData] = useState<KasaCardData[]>([]);

  useEffect(() => {
    setHydrated(true);
    getReportData("performans").then((r) => {
      if (r?.processedData?.length) setReportPerformansData(r.processedData);
    });
  }, []);

  const leagueSorted = [...reportPerformansData].sort(
    (a, b) => b.toplamBorc - a.toplamBorc,
  );
  const maxYatirim = leagueSorted.length > 0 ? leagueSorted[0].toplamBorc : 1;

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
      {/* Top Nav */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/90 px-5 py-3 backdrop-blur-sm">
        <Link
          href="/raporlar"
          className="flex items-center gap-2 text-xs text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span>Raporlar</span>
        </Link>
        <h1 className="text-sm font-bold tracking-wide text-white">
          Dis Finans Cekim Performansi
        </h1>
        <div className="w-20" />
      </div>

      <div className="mx-auto max-w-4xl px-5 py-6">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" strokeWidth={1.5} />
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-neutral-200">
            Dis Finans Cekim Performansi
          </h2>
        </div>
        <p className="mb-4 text-xs text-neutral-500">
          Yontemler aldiklari cekim miktarina gore siralanmistir
        </p>

        <div className="mb-6 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-neutral-400">Bu rapor icin Excel yukleme kaldirildi. Veri baska kaynaktan gelecek.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-white">
          {leagueSorted.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm font-medium text-neutral-600">Henuz veri yok</p>
              <p className="mt-1 text-xs text-neutral-500">
                Yukaridan Excel yukleyin. Gerekli kolonlar: Odeme Turu / Yontem, Borc / Yatirim, Kredi / Cekim
              </p>
            </div>
          ) : (
          leagueSorted.map((item, index) => {
            const pct = (item.toplamBorc / maxYatirim) * 100;
            const leagueStyle =
              index < 3
                ? LEAGUE_COLORS[index]
                : {
                    bg: "bg-white",
                    text: "text-neutral-500",
                    badge: "bg-neutral-300",
                  };

            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 border-b border-neutral-100 px-4 py-2.5 last:border-0 ${index < 3 ? leagueStyle.bg : "hover:bg-neutral-50/50"}`}
              >
                <div
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${leagueStyle.badge}`}
                >
                  {index + 1}
                </div>

                <div className="w-5 flex-shrink-0">
                  {index === 0 && (
                    <Medal
                      className="h-4 w-4 text-amber-500"
                      strokeWidth={2}
                    />
                  )}
                  {index === 1 && (
                    <Medal
                      className="h-4 w-4 text-neutral-400"
                      strokeWidth={2}
                    />
                  )}
                  {index === 2 && (
                    <Medal
                      className="h-4 w-4 text-orange-400"
                      strokeWidth={2}
                    />
                  )}
                </div>

                <span
                  className={`w-28 flex-shrink-0 text-xs font-semibold ${index < 3 ? leagueStyle.text : "text-neutral-700"}`}
                >
                  {item.odemeTuruAdi}
                </span>

                <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-neutral-900 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span className="w-24 text-right font-mono text-xs font-bold tabular-nums text-neutral-800">
                  {"₺"}
                  {formatCurrency(item.toplamBorc)}
                </span>

                <div className="w-5 flex-shrink-0">
                  {item.kalanKasa > 0 ? (
                    <TrendingUp
                      className="h-3.5 w-3.5 text-emerald-500"
                      strokeWidth={2}
                    />
                  ) : (
                    <TrendingDown
                      className="h-3.5 w-3.5 text-red-400"
                      strokeWidth={2}
                    />
                  )}
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>
    </div>
  );
}
