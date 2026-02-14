"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  DollarSign,
  Hash,
  TrendingUp,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { IslemTipi, OdemeKaydi } from "@/lib/store";

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function islemLabel(tip: IslemTipi): string {
  switch (tip) {
    case "odeme-yap": return "Odeme Yapildi";
    case "odeme-al": return "Odeme Alindi";
    case "transfer": return "Transfer";
  }
}

function islemIcon(tip: IslemTipi) {
  switch (tip) {
    case "odeme-yap": return <ArrowUpRight className="h-3.5 w-3.5 text-red-400" strokeWidth={2} />;
    case "odeme-al": return <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />;
    case "transfer": return <ArrowLeftRight className="h-3.5 w-3.5 text-blue-400" strokeWidth={2} />;
  }
}

const AY_ISIMLERI = [
  "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
  "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik",
];

const GUN_ISIMLERI = ["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseOdemeDate(iso: string): Date {
  return new Date(iso);
}

/* ═══════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════ */
export default function OdemeGecmisPage() {
  const { odemeler } = useStore();
  const [hydrated, setHydrated] = useState(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-based
  const [selectedDate, setSelectedDate] = useState<string | null>(dateKey(now));

  useEffect(() => { setHydrated(true); }, []);

  /* ── group odemeler by date ── */
  const byDate = useMemo(() => {
    const map: Record<string, OdemeKaydi[]> = {};
    for (const o of odemeler) {
      const dk = dateKey(parseOdemeDate(o.tarih));
      if (!map[dk]) map[dk] = [];
      map[dk].push(o);
    }
    return map;
  }, [odemeler]);

  /* ── daily totals for badges ── */
  const dailyTotals = useMemo(() => {
    const map: Record<string, { giris: number; cikis: number; count: number }> = {};
    for (const [dk, list] of Object.entries(byDate)) {
      let giris = 0, cikis = 0;
      for (const o of list) {
        if (o.islemTipi === "odeme-al") giris += o.tutarTL;
        else if (o.islemTipi === "odeme-yap") cikis += o.tutarTL;
      }
      map[dk] = { giris, cikis, count: list.length };
    }
    return map;
  }, [byDate]);

  /* ── calendar grid ── */
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
  const startDow = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const todayKey = dateKey(now);

  /* ── selected day's odemeler ── */
  const selectedOdemeler = selectedDate ? (byDate[selectedDate] || []) : [];

  /* ── month summary ── */
  const monthSummary = useMemo(() => {
    let toplamGiris = 0, toplamCikis = 0, toplamIslem = 0;
    for (const o of odemeler) {
      const d = parseOdemeDate(o.tarih);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        toplamIslem++;
        if (o.islemTipi === "odeme-al") toplamGiris += o.tutarTL;
        else if (o.islemTipi === "odeme-yap") toplamCikis += o.tutarTL;
      }
    }
    return { toplamGiris, toplamCikis, toplamIslem, net: toplamGiris - toplamCikis };
  }, [odemeler, viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
    setSelectedDate(null);
  };

  if (!hydrated) return <div className="min-h-screen bg-neutral-950" />;

  return (
    <div className="min-h-screen bg-neutral-950">

      {/* ━━━ STICKY NAV ━━━ */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /><span>Kasa</span>
          </Link>
          <h1 className="text-sm font-semibold tracking-wide text-white/90">Odeme Gecmisi</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* ━━━ MONTH SUMMARY KPIs ━━━ */}
      <section className="bg-neutral-950 pb-6 pt-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <ArrowDownLeft className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Giris</p>
              <p className="font-mono text-lg font-black text-emerald-400">₺{formatCompact(monthSummary.toplamGiris)}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                <ArrowUpRight className="h-4 w-4 text-red-400" strokeWidth={1.5} />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Cikis</p>
              <p className="font-mono text-lg font-black text-red-400">₺{formatCompact(monthSummary.toplamCikis)}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                <TrendingUp className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Net</p>
              <p className={`font-mono text-lg font-black ${monthSummary.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {monthSummary.net >= 0 ? "+" : ""}₺{formatCompact(Math.abs(monthSummary.net))}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <Hash className="h-4 w-4 text-violet-400" strokeWidth={1.5} />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Islem</p>
              <p className="font-mono text-lg font-black text-white">{monthSummary.toplamIslem}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ CALENDAR ━━━ */}
      <section className="bg-neutral-950 pb-4 pt-2">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 md:p-6">
            {/* Month nav */}
            <div className="mb-5 flex items-center justify-between">
              <button onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white">
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
                <span className="text-sm font-bold text-white">{AY_ISIMLERI[viewMonth]} {viewYear}</span>
              </div>
              <button onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white">
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {/* Day headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {GUN_ISIMLERI.map((g) => (
                <div key={g} className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-500">{g}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;

                const dk = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const daily = dailyTotals[dk];
                const isToday = dk === todayKey;
                const isSelected = dk === selectedDate;
                const hasData = !!daily;

                return (
                  <button
                    key={dk}
                    onClick={() => setSelectedDate(isSelected ? null : dk)}
                    className={`relative flex flex-col items-center justify-start rounded-xl p-1 transition-all ${
                      isSelected
                        ? "bg-cyan-500/20 ring-1 ring-cyan-400/40"
                        : isToday
                        ? "bg-white/[0.04] ring-1 ring-white/[0.08]"
                        : hasData
                        ? "bg-white/[0.02] hover:bg-white/[0.05]"
                        : "hover:bg-white/[0.02]"
                    }`}
                    style={{ minHeight: 56 }}
                  >
                    {/* Day number */}
                    <span className={`text-xs font-bold ${
                      isSelected ? "text-cyan-400" : isToday ? "text-white" : hasData ? "text-neutral-200" : "text-neutral-600"
                    }`}>
                      {day}
                    </span>

                    {/* Activity indicator */}
                    {hasData && (
                      <div className="mt-0.5 flex flex-col items-center gap-0.5">
                        <span className="text-[8px] font-bold text-emerald-400">{daily.count}</span>
                        {daily.cikis > 0 && (
                          <div className="h-1 w-4 rounded-full bg-red-400/60" />
                        )}
                        {daily.giris > 0 && (
                          <div className="h-1 w-4 rounded-full bg-emerald-400/60" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ SELECTED DAY TRANSACTIONS ━━━ */}
      <section className="bg-neutral-950 pb-12 pt-2">
        <div className="mx-auto max-w-4xl px-4">
          {selectedDate ? (
            <>
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-1 rounded-full bg-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("tr-TR", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </h3>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-neutral-400">
                  {selectedOdemeler.length} islem
                </span>
              </div>

              {selectedOdemeler.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-12">
                  <DollarSign className="mb-2 h-8 w-8 text-neutral-700" strokeWidth={1} />
                  <p className="text-xs text-neutral-500">Bu gunde islem yapilmamis</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Day summary */}
                  {(() => {
                    const dayTotal = dailyTotals[selectedDate];
                    if (!dayTotal) return null;
                    return (
                      <div className="mb-2 flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500">Gun Toplami</p>
                          <div className="flex items-center gap-3">
                            {dayTotal.giris > 0 && (
                              <span className="font-mono text-sm font-bold text-emerald-400">+₺{formatCurrency(dayTotal.giris)}</span>
                            )}
                            {dayTotal.cikis > 0 && (
                              <span className="font-mono text-sm font-bold text-red-400">-₺{formatCurrency(dayTotal.cikis)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Transaction list */}
                  {selectedOdemeler.map((o) => {
                    const saat = new Date(o.tarih).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div
                        key={o.id}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
                      >
                        {/* Icon */}
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                          o.islemTipi === "odeme-al" ? "bg-emerald-500/10" : o.islemTipi === "odeme-yap" ? "bg-red-500/10" : "bg-blue-500/10"
                        }`}>
                          {islemIcon(o.islemTipi)}
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{islemLabel(o.islemTipi)}</span>
                            <span className="font-mono text-[10px] text-neutral-600">{o.no}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-neutral-400">{o.yontem}{o.hedefYontem ? ` → ${o.hedefYontem}` : ""}</span>
                            <span className="text-[10px] text-neutral-600">·</span>
                            <span className="text-[10px] text-neutral-500">{saat}</span>
                          </div>
                          {o.aciklama && <p className="mt-0.5 text-[10px] italic text-neutral-500">{o.aciklama}</p>}
                        </div>

                        {/* Amount */}
                        <div className="flex-shrink-0 text-right">
                          <p className={`font-mono text-sm font-bold ${
                            o.islemTipi === "odeme-al" ? "text-emerald-400" : o.islemTipi === "odeme-yap" ? "text-red-400" : "text-blue-400"
                          }`}>
                            {o.islemTipi === "odeme-al" ? "+" : o.islemTipi === "odeme-yap" ? "-" : ""}₺{formatCurrency(o.tutarTL)}
                          </p>
                          {o.dovizCinsi !== "TRY" && o.kur && (
                            <p className="text-[9px] text-neutral-500">{formatCurrency(o.tutar)} {o.dovizCinsi}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] py-12">
              <Calendar className="mb-2 h-8 w-8 text-neutral-700" strokeWidth={1} />
              <p className="text-xs text-neutral-500">Takvimden bir gun secin</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
