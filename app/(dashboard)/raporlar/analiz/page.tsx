"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  Download,
  FileDown,
  BarChart2,
  Calendar,
  Clock,
  Copy,
  Check,
  Wallet,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useStore } from "@/lib/store";
import { getReportData } from "@/lib/actions";
import type { KasaCardData } from "@/lib/excel-processor";
import { StatusBadge } from "@/components/report/status-badge";
import { KpiCard } from "@/components/report/kpi-card";
import { ChartCard } from "@/components/report/chart-card";
import { DataTable } from "@/components/report/data-table";
import { InsightList } from "@/components/report/insight-list";

/* ───────────────────── TYPES & HELPERS ───────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnalysisReport = Record<string, any>;

interface SnapshotDetail {
  name: string;
  yatirim: number;
  komisyon: number;
  komisyonOrani: number;
  netYatirim: number;
  cekim: number;
  cekimKomisyon: number;
  cekimKomisyonOrani: number;
  kalan: number;
}

interface KasaSnapshot {
  snapshot_date: string;
  total_kasa: number;
  total_yatirim: number;
  total_komisyon: number;
  total_cekim: number;
  details: SnapshotDetail[];
}

const GUN_ISIMLERI: Record<number, string> = { 0: "Paz", 1: "Pzt", 2: "Sal", 3: "Car", 4: "Per", 5: "Cum", 6: "Cmt" };

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return fmtCurrency(v);
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}

function gunIsmi(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return GUN_ISIMLERI[d.getDay()] || "";
}

function generateKasaMetni(kasaData: KasaCardData[]): string {
  const aktif = kasaData.filter((k) => k.toplamBorc > 0 || k.toplamKredi > 0);
  if (aktif.length === 0) return "";

  const now = new Date();
  const tarih = now.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const saat = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  const toplamYatirim = aktif.reduce((s, k) => s + k.toplamBorc, 0);
  const toplamKomisyon = aktif.reduce((s, k) => s + k.komisyon, 0);
  const toplamCekim = aktif.reduce((s, k) => s + k.toplamKredi, 0);
  const toplamCekimKom = aktif.reduce((s, k) => s + k.cekimKomisyon, 0);
  const toplamNet = aktif.reduce((s, k) => s + k.netBorc, 0);
  const toplamKalan = aktif.reduce((s, k) => s + k.kalanKasa, 0);

  const lines: string[] = [];
  lines.push(`📊 GUN ICI FINANSAL OZET`);
  lines.push(`📅 ${tarih} | ⏰ ${saat}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(``);

  for (const k of aktif) {
    lines.push(`📋 ${k.odemeTuruAdi}`);
    lines.push(`   💰 Yatirim: ₺${fmtCurrency(k.toplamBorc)}`);
    if (k.komisyonOrani > 0) {
      lines.push(`   📉 Komisyon: -₺${fmtCurrency(k.komisyon)} (%${k.komisyonOrani})`);
      lines.push(`   💵 Net Yatirim: ₺${fmtCurrency(k.netBorc)}`);
    }
    if (k.toplamKredi > 0) {
      lines.push(`   📤 Cekim: ₺${fmtCurrency(k.toplamKredi)}`);
      if (k.cekimKomisyonOrani > 0) {
        lines.push(`   📉 Cekim Kom.: -₺${fmtCurrency(k.cekimKomisyon)} (%${k.cekimKomisyonOrani})`);
      }
    }
    lines.push(`   🏦 Kalan: ₺${fmtCurrency(k.kalanKasa)}`);
    lines.push(``);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💰 Toplam Yatirim: ₺${fmtCurrency(toplamYatirim)}`);
  if (toplamKomisyon > 0) lines.push(`📉 Toplam Komisyon: -₺${fmtCurrency(toplamKomisyon)}`);
  lines.push(`💵 Net Yatirim: ₺${fmtCurrency(toplamNet)}`);
  if (toplamCekim > 0) {
    lines.push(`📤 Toplam Cekim: ₺${fmtCurrency(toplamCekim)}`);
    if (toplamCekimKom > 0) lines.push(`📉 Cekim Komisyon: -₺${fmtCurrency(toplamCekimKom)}`);
  }
  lines.push(`🏦 Toplam Kalan: ₺${fmtCurrency(toplamKalan)}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);

  return lines.join("\n");
}

function generateHaftalikMetni(snapshots: KasaSnapshot[], weeklyMethods: { name: string; yatirim: number; komisyon: number; cekim: number; kalan: number }[]): string {
  if (snapshots.length === 0) return "";
  const first = fmtDate(snapshots[0].snapshot_date);
  const last = fmtDate(snapshots[snapshots.length - 1].snapshot_date);
  const topYatirim = snapshots.reduce((s, sn) => s + sn.total_yatirim, 0);
  const topKomisyon = snapshots.reduce((s, sn) => s + sn.total_komisyon, 0);
  const topCekim = snapshots.reduce((s, sn) => s + sn.total_cekim, 0);

  const lines: string[] = [];
  lines.push(`📊 HAFTALIK KUMULATIF OZET`);
  lines.push(`📅 ${first} - ${last}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(``);
  for (const sn of snapshots) {
    lines.push(`📅 ${fmtDate(sn.snapshot_date)} ${gunIsmi(sn.snapshot_date)}: ₺${fmtCurrency(sn.total_yatirim)}`);
  }
  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💰 Haftalik Toplam Yatirim: ₺${fmtCurrency(topYatirim)}`);
  if (topKomisyon > 0) lines.push(`📉 Toplam Komisyon: -₺${fmtCurrency(topKomisyon)}`);
  if (topCekim > 0) lines.push(`📤 Toplam Cekim: ₺${fmtCurrency(topCekim)}`);
  lines.push(``);
  if (weeklyMethods.length > 0) {
    lines.push(`📋 YONTEM BAZLI HAFTALIK:`);
    for (const m of weeklyMethods) {
      lines.push(`  ${m.name}: ₺${fmtCurrency(m.yatirim)} yat. | -₺${fmtCurrency(m.komisyon)} kom. | ₺${fmtCurrency(m.cekim)} cek.`);
    }
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  return lines.join("\n");
}

const PIE_COLORS = ["#1E5EFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const playerColumns = [
  { key: "oyuncu", label: "Oyuncu", align: "left" as const, format: "text" as const },
  { key: "yatirim", label: "Yatirim", align: "right" as const, format: "currency" as const },
  { key: "cekim", label: "Cekim", align: "right" as const, format: "currency" as const },
  { key: "netKar", label: "Net Kar", align: "right" as const, format: "currency" as const },
  { key: "roi", label: "ROI %", align: "right" as const, format: "percent" as const },
];

const withdrawalColumns = [
  { key: "oyuncu", label: "Oyuncu", align: "left" as const, format: "text" as const },
  { key: "cekim", label: "Cekim", align: "right" as const, format: "currency" as const },
  { key: "yontem", label: "Yontem", align: "left" as const, format: "text" as const },
  { key: "islemSayisi", label: "Islem", align: "right" as const, format: "number" as const },
];

/* ───────────────────────────── COMPONENT ───────────────────────────── */

export default function AnalizPage() {
  const { role } = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [activeTab, setActiveTab] = useState<"top" | "bottom" | "withdrawal">("top");
  const [kasaCopied, setKasaCopied] = useState(false);
  const [haftalikCopied, setHaftalikCopied] = useState(false);
  const [snapshots, setSnapshots] = useState<KasaSnapshot[]>([]);
  const [reportAnalizData, setReportAnalizData] = useState<KasaCardData[]>([]);

  // Aktif yontemler (yatirim veya cekim olan)
  const aktifKasa = useMemo(() => reportAnalizData.filter((k) => k.toplamBorc > 0 || k.toplamKredi > 0), [reportAnalizData]);
  const hasKasaData = aktifKasa.length > 0;

  // Toplamlar
  const toplamlar = useMemo(() => {
    const toplamYatirim = aktifKasa.reduce((s, k) => s + k.toplamBorc, 0);
    const toplamKomisyon = aktifKasa.reduce((s, k) => s + k.komisyon, 0);
    const toplamNet = aktifKasa.reduce((s, k) => s + k.netBorc, 0);
    const toplamCekim = aktifKasa.reduce((s, k) => s + k.toplamKredi, 0);
    const toplamCekimKom = aktifKasa.reduce((s, k) => s + k.cekimKomisyon, 0);
    const toplamKalan = aktifKasa.reduce((s, k) => s + k.kalanKasa, 0);
    return { toplamYatirim, toplamKomisyon, toplamNet, toplamCekim, toplamCekimKom, toplamKalan };
  }, [aktifKasa]);

  // Haftalik: yontem bazli 7 gun ortalama yatirim (performans degisimi icin)
  const yediGunOrt = useMemo(() => {
    if (snapshots.length === 0) return new Map<string, number>();
    const methodTotals = new Map<string, { total: number; count: number }>();
    for (const sn of snapshots) {
      for (const d of sn.details) {
        const prev = methodTotals.get(d.name) || { total: 0, count: 0 };
        methodTotals.set(d.name, { total: prev.total + d.yatirim, count: prev.count + 1 });
      }
    }
    const result = new Map<string, number>();
    methodTotals.forEach((v, k) => result.set(k, v.count > 0 ? v.total / v.count : 0));
    return result;
  }, [snapshots]);

  // Haftalik: yontem bazli kumulatif toplamlar
  const weeklyMethods = useMemo(() => {
    if (snapshots.length === 0) return [];
    const acc = new Map<string, { yatirim: number; komisyon: number; cekim: number; kalan: number }>();
    for (const sn of snapshots) {
      for (const d of sn.details) {
        const prev = acc.get(d.name) || { yatirim: 0, komisyon: 0, cekim: 0, kalan: 0 };
        acc.set(d.name, {
          yatirim: prev.yatirim + d.yatirim,
          komisyon: prev.komisyon + d.komisyon,
          cekim: prev.cekim + d.cekim,
          kalan: prev.kalan + d.kalan,
        });
      }
    }
    return Array.from(acc.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.yatirim - a.yatirim);
  }, [snapshots]);

  const hasSnapshots = snapshots.length > 0;

  const handleKasaCopy = useCallback(async () => {
    const metin = generateKasaMetni(reportAnalizData);
    if (!metin) return;
    try {
      await navigator.clipboard.writeText(metin);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = metin;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setKasaCopied(true);
    setTimeout(() => setKasaCopied(false), 2500);
  }, [reportAnalizData]);

  const handleHaftalikCopy = useCallback(async () => {
    const metin = generateHaftalikMetni(snapshots, weeklyMethods);
    if (!metin) return;
    try {
      await navigator.clipboard.writeText(metin);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = metin;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setHaftalikCopied(true);
    setTimeout(() => setHaftalikCopied(false), 2500);
  }, [snapshots, weeklyMethods]);

  useEffect(() => {
    setHydrated(true);
    fetchReport();
    fetchSnapshots();
    getReportData("analiz").then((r) => {
      if (r?.processedData?.length) setReportAnalizData(r.processedData);
    });
  }, []);

  async function fetchReport() {
    try {
      setLoading(true);
      const res = await fetch("/api/analiz-raporu");
      const json = await res.json();
      if (json.data) {
        setReport(json.data);
      }
    } catch (err) {
      console.error("[AnalizPage] Veri cekme hatasi:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSnapshots() {
    // haftalik-kasa kaldirildi
  }

  if (!hydrated) return <div className="min-h-screen bg-black" />;

  if (role === "basic") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black">
        <Lock className="mb-3 h-8 w-8 text-neutral-500" strokeWidth={1.5} />
        <p className="mb-1 text-sm font-medium text-neutral-300">Erisim Engellendi</p>
        <p className="mb-4 text-xs text-neutral-500">Bu sayfa sadece Master kullanicilar icindir</p>
        <Link href="/raporlar" className="text-xs text-neutral-400 underline hover:text-white">Raporlara Don</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Sticky nav */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/90 px-5 py-3 backdrop-blur-sm">
        <Link href="/raporlar" className="flex items-center gap-2 text-xs text-neutral-400 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span>Raporlar</span>
        </Link>
        <h1 className="text-sm font-bold tracking-wide text-white">Finansal Analiz</h1>
        <div className="w-20" />
      </div>

      {/* Excel yukleme kaldirildi */}
      <div className="mx-auto max-w-[1400px] px-6 pt-6">
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-neutral-400">Bu rapor icin Excel yukleme kaldirildi.</p>
        </div>
      </div>

      {/* ── CANLI: Gunluk + Haftalik Kumulatif (Yan Yana) ── */}
      {(hasKasaData || hasSnapshots) && (
        <div className="mx-auto max-w-[1400px] px-6 pt-6">
          <div className={`grid gap-6 ${hasKasaData && hasSnapshots ? "lg:grid-cols-[3fr_2fr]" : ""}`}>

            {/* ── SOL: Gunluk Ozet (Performans Degisimi dahil) ── */}
            {hasKasaData && (
              <div className="rounded-2xl border border-white/10 bg-white">
                <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E5EFF]/10">
                      <Wallet className="h-4 w-4 text-[#1E5EFF]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">Gun Ici Ozet</h3>
                      <p className="text-[10px] text-neutral-400">Canli kasa verisi — anlik durum</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleKasaCopy}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold transition-all ${
                      kasaCopied
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                        : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                    }`}
                  >
                    {kasaCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {kasaCopied ? "Kopyalandi!" : "Telegram"}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Yontem</th>
                        <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400" colSpan={2}>Yatirim</th>
                        <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400">Komisyon</th>
                        <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400">Cekim</th>
                        <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400">Kalan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aktifKasa.map((k, i) => {
                        const avg = yediGunOrt.get(k.odemeTuruAdi);
                        const bugun = k.toplamBorc;
                        let perfPct: number | null = null;
                        let perfDir: "up" | "down" | "same" | null = null;
                        if (avg != null && avg > 0) {
                          perfPct = ((bugun - avg) / avg) * 100;
                          if (perfPct > 2) perfDir = "up";
                          else if (perfPct < -2) perfDir = "down";
                          else perfDir = "same";
                        }
                        return (
                          <tr key={k.id} className={`border-b border-neutral-100 transition-colors hover:bg-neutral-50/60 ${i % 2 === 0 ? "" : "bg-neutral-50/40"}`}>
                            <td className="px-5 py-2.5">
                              <span className="text-xs font-semibold text-neutral-800">{k.odemeTuruAdi}</span>
                            </td>
                            <td className="py-2.5 pl-3 pr-0 text-right font-mono text-xs font-semibold text-neutral-700">
                              ₺{fmtCurrency(bugun)}
                            </td>
                            {/* Performans degisimi ok + yuzde */}
                            <td className="py-2.5 pl-1 pr-3">
                              {perfDir && perfPct !== null ? (
                                <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                  perfDir === "up" ? "bg-emerald-50 text-emerald-600" : perfDir === "down" ? "bg-red-50 text-red-500" : "bg-neutral-100 text-neutral-400"
                                }`}>
                                  {perfDir === "up" && <TrendingUp className="h-3 w-3" />}
                                  {perfDir === "down" && <TrendingDown className="h-3 w-3" />}
                                  {perfDir === "same" && <Minus className="h-3 w-3" />}
                                  {perfPct > 0 ? "+" : ""}{perfPct.toFixed(0)}%
                                </span>
                              ) : (
                                <span className="text-[10px] text-neutral-200" />
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              {k.komisyonOrani > 0 ? (
                                <div className="flex flex-col items-end">
                                  <span className="font-mono text-xs font-semibold text-red-500">-₺{fmtCurrency(k.komisyon)}</span>
                                  <span className="text-[9px] text-neutral-400">%{k.komisyonOrani}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-neutral-300">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              {k.toplamKredi > 0 ? (
                                <span className="font-mono text-xs font-semibold text-amber-600">₺{fmtCurrency(k.toplamKredi)}</span>
                              ) : (
                                <span className="text-xs text-neutral-300">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-emerald-600">
                              ₺{fmtCurrency(k.kalanKasa)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-neutral-200 bg-neutral-50">
                        <td className="px-5 py-2.5"><span className="text-xs font-black uppercase tracking-wider text-neutral-700">Toplam</span></td>
                        <td className="py-2.5 pl-3 pr-0 text-right font-mono text-xs font-black text-neutral-800" colSpan={2}>₺{fmtCurrency(toplamlar.toplamYatirim)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs font-black text-red-500">{toplamlar.toplamKomisyon > 0 ? `-₺${fmtCurrency(toplamlar.toplamKomisyon)}` : "—"}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs font-black text-amber-600">{toplamlar.toplamCekim > 0 ? `₺${fmtCurrency(toplamlar.toplamCekim)}` : "—"}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs font-black text-emerald-600">₺{fmtCurrency(toplamlar.toplamKalan)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Performans degisimi aciklama */}
                {yediGunOrt.size > 0 && (
                  <div className="border-t border-neutral-200 px-5 py-2">
                    <p className="text-[10px] text-neutral-400">
                      <TrendingUp className="mr-1 inline h-3 w-3 text-emerald-500" />
                      Yatirim degisimi: bugun vs 7 gun ortalamasi
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── SAG: Haftalik Kumulatif ── */}
            {hasSnapshots && (
              <div className="rounded-2xl border border-neutral-200 bg-white">
                <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                      <Calendar className="h-4 w-4 text-violet-600" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">Haftalik Kumulatif</h3>
                      <p className="text-[10px] text-neutral-400">Son {snapshots.length} gun — toplam gorunum</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleHaftalikCopy}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold transition-all ${
                      haftalikCopied
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                        : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                    }`}
                  >
                    {haftalikCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {haftalikCopied ? "Kopyalandi!" : "Telegram"}
                  </button>
                </div>

                {/* Gun gun toplam yatirim */}
                <div className="border-b border-neutral-200 px-5 py-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Gun Bazli Yatirimlar</p>
                  <div className="space-y-1">
                    {snapshots.map((sn) => {
                      const maxYat = Math.max(...snapshots.map((s) => s.total_yatirim), 1);
                      const pct = (sn.total_yatirim / maxYat) * 100;
                      return (
                        <div key={sn.snapshot_date} className="flex items-center gap-2">
                          <span className="w-14 shrink-0 text-[10px] font-semibold text-neutral-500">
                            {gunIsmi(sn.snapshot_date)} {fmtDate(sn.snapshot_date)}
                          </span>
                          <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-neutral-100">
                            <div className="absolute inset-y-0 left-0 rounded-md bg-[#1E5EFF]/15" style={{ width: `${pct}%` }} />
                            <span className="relative z-10 flex h-full items-center pl-2 font-mono text-[10px] font-bold text-neutral-700">
                              ₺{fmtCompact(sn.total_yatirim)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Haftalik toplam */}
                  <div className="mt-2 flex items-center justify-between border-t border-dashed border-neutral-200 pt-2">
                    <span className="text-[10px] font-black uppercase text-neutral-500">Haftalik Toplam</span>
                    <span className="font-mono text-xs font-black text-[#1E5EFF]">
                      ₺{fmtCurrency(snapshots.reduce((s, sn) => s + sn.total_yatirim, 0))}
                    </span>
                  </div>
                </div>

                {/* Yontem bazli haftalik kumulatif */}
                {weeklyMethods.length > 0 && (
                  <div className="px-5 py-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Yontem Bazli Haftalik</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-neutral-200">
                            <th className="pb-2 text-[9px] font-bold uppercase text-neutral-400">Yontem</th>
                            <th className="pb-2 text-right text-[9px] font-bold uppercase text-neutral-400">Yatirim</th>
                            <th className="pb-2 text-right text-[9px] font-bold uppercase text-neutral-400">Komisyon</th>
                            <th className="pb-2 text-right text-[9px] font-bold uppercase text-neutral-400">Cekim</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weeklyMethods.map((m, i) => (
                            <tr key={m.name} className={`border-b border-neutral-200/40 ${i % 2 !== 0 ? "bg-neutral-50" : ""}`}>
                              <td className="py-2 text-[11px] font-semibold text-neutral-700">{m.name}</td>
                              <td className="py-2 text-right font-mono text-[11px] font-semibold text-neutral-700">₺{fmtCompact(m.yatirim)}</td>
                              <td className="py-2 text-right font-mono text-[11px] font-semibold text-red-500">{m.komisyon > 0 ? `-₺${fmtCompact(m.komisyon)}` : "—"}</td>
                              <td className="py-2 text-right font-mono text-[11px] font-semibold text-amber-600">{m.cekim > 0 ? `₺${fmtCompact(m.cekim)}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#1E5EFF]" />
          <p className="text-sm text-neutral-500">Analiz raporu yukleniyor...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !report && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <BarChart2 className="mb-4 h-12 w-12 text-neutral-600" strokeWidth={1} />
          <h2 className="mb-2 text-lg font-bold text-neutral-300">Henuz Analiz Raporu Uretilmedi</h2>
          <p className="max-w-md text-sm text-neutral-500">
            Telegram botu henuz bir analiz raporu gondermedi. Bot bir rapor uretip gonderdikten sonra burada canli veri gorunecektir.
          </p>
          <Link href="/raporlar" className="mt-6 rounded-xl border border-neutral-200 bg-white px-6 py-2.5 text-xs font-semibold text-neutral-500 transition-colors hover:bg-neutral-50">
            Raporlara Don
          </Link>
        </div>
      )}

      {/* Report content */}
      {!loading && report && (() => {
        const r = report;
        const ai = r.ai_content || {};
        const m = ai.dashboard_metrics || {};
        const c = ai.kpi_changes || {};
        const createdDate = r.created_at ? new Date(r.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "";
        const createdTime = r.created_at ? new Date(r.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "";

        return (
      <div className="mx-auto max-w-[1120px] px-6 py-6">

        {/* ── 1. HEADER ── */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-neutral-900">{r.title || "Analiz Raporu"}</h2>
              <span className="rounded-md bg-[#1E5EFF]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1E5EFF]">
                {r.type === "daily_financial" ? "Gunluk" : r.type || "Rapor"}
              </span>
              <StatusBadge status={r.status || "done"} />
            </div>
            <div className="flex items-center gap-4 text-[11px] text-neutral-400">
              {createdDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" strokeWidth={1.5} />{createdDate}</span>}
              {createdTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" strokeWidth={1.5} />{createdTime}</span>}
              {r.id && <span className="font-mono text-[10px] text-neutral-300">{r.id}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[11px] font-medium text-neutral-400 opacity-50">
              <FileDown className="h-3.5 w-3.5" strokeWidth={1.5} />
              Export PDF
            </button>
            <button type="button" disabled className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[11px] font-medium text-neutral-400 opacity-50">
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              JSON
            </button>
          </div>
        </div>

        {/* ── 2. EXECUTIVE SUMMARY ── */}
        {ai.executive_summary && (
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-[#1E5EFF]" strokeWidth={1.5} />
            <h3 className="text-sm font-bold text-neutral-900">Yonetici Ozeti</h3>
          </div>
          {ai.executive_summary.bullets && (
          <ul className="mb-4 flex flex-col gap-2">
            {ai.executive_summary.bullets.map((b: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1E5EFF]" />
                <span className="text-[13px] leading-relaxed text-neutral-700">{b}</span>
              </li>
            ))}
          </ul>
          )}
          {ai.executive_summary.paragraph && (
          <div className="rounded-xl bg-neutral-100 p-4">
            <p className="text-[12px] italic leading-relaxed text-neutral-500">
              {ai.executive_summary.paragraph}
            </p>
          </div>
          )}
        </div>
        )}

        {/* ── 3. KPI GRID ── */}
        {m.toplam_yatirim !== undefined && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Toplam Yatirim" value={m.toplam_yatirim} prefix="₺" change={c.toplam_yatirim} changeLabel="onceki gun" color="blue" />
          <KpiCard label="Toplam Cekim" value={m.toplam_cekim} prefix="₺" change={c.toplam_cekim} changeLabel="onceki gun" color="red" />
          <KpiCard label="Net Nakit Akisi" value={m.net_nakit_akisi} prefix="₺" change={c.net_nakit_akisi} changeLabel="onceki gun" color="green" />
          <KpiCard label="Toplam Bahis" value={m.toplam_bahis} prefix="₺" change={c.toplam_bahis} changeLabel="onceki gun" />
          <KpiCard label="Net Kar" value={m.net_kar} prefix="₺" change={c.net_kar} changeLabel="onceki gun" color="green" />
          <KpiCard label="Bonus Etkisi" value={m.bonus_etkisi} prefix="₺" change={c.bonus_etkisi} changeLabel="onceki gun" color="red" />
        </div>
        )}

        {/* ── 4. TRENDS ── */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          {ai.trends_timeline && (
          <ChartCard title="Yatirim / Cekim Zaman Serisi" subtitle="Saat bazinda hacim (TRY)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={ai.trends_timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="saat" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`₺${new Intl.NumberFormat("tr-TR").format(v)}`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="yatirim" stroke="#1E5EFF" strokeWidth={2} dot={false} name="Yatirim" />
                <Line type="monotone" dataKey="cekim" stroke="#EF4444" strokeWidth={2} dot={false} name="Cekim" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          )}

          {ai.trends_segments && (
          <ChartCard title="Segment Bazinda Net Kar" subtitle="Odeme yontemi gruplarina gore">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ai.trends_segments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="segment" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`₺${new Intl.NumberFormat("tr-TR").format(v)}`, "Net Kar"]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Bar dataKey="netKar" fill="#1E5EFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          )}
        </div>

        {/* ── 5. DISTRIBUTION & CONCENTRATION ── */}
        {(ai.distribution_histogram || ai.distribution_pie) && (
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          {ai.distribution_histogram && (
          <ChartCard title="Yatirim Dagilimi (Histogram)" subtitle="Oyuncu yatirim araliklari">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ai.distribution_histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="aralik" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} name="Oyuncu Sayisi" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          )}

          {ai.distribution_pie && (
          <ChartCard title="Kanal Dagilimi" subtitle="Yatirim hacmi payi (%)">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={ai.distribution_pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} strokeWidth={0}>
                  {ai.distribution_pie.map((_: unknown, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`%${v}`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          )}

          {ai.distribution_comment && (
          <div className="flex flex-col justify-center rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="mb-3 text-xs font-bold text-neutral-800">Dagilim Yorumu</h3>
            <p className="text-[12px] leading-relaxed text-neutral-500">
              {ai.distribution_comment}
            </p>
          </div>
          )}
        </div>
        )}

        {/* ── 6. TABLES TABS ── */}
        {(ai.top20_profit || ai.bottom20_profit || ai.top20_withdrawal) && (
        <div className="mb-6">
          <div className="mb-4 flex gap-1 rounded-xl border border-neutral-200 bg-white p-1">
            {([
              { key: "top", label: "Top 10 Net Kar" },
              { key: "bottom", label: "Bottom 10 Net Kar" },
              { key: "withdrawal", label: "Top 10 Cekim" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "top" && ai.top20_profit && (
            <DataTable columns={playerColumns} rows={ai.top20_profit} caption="En Yuksek Net Kar - Oyuncu Bazli" />
          )}
          {activeTab === "bottom" && ai.bottom20_profit && (
            <DataTable columns={playerColumns} rows={ai.bottom20_profit} caption="En Dusuk Net Kar - Oyuncu Bazli" />
          )}
          {activeTab === "withdrawal" && ai.top20_withdrawal && (
            <DataTable columns={withdrawalColumns} rows={ai.top20_withdrawal} caption="En Yuksek Cekim - Oyuncu Bazli" />
          )}
        </div>
        )}

        {/* ── 7. INSIGHTS & ACTIONS ── */}
        {ai.insights && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          {ai.insights.risks && <InsightList title="Riskler" items={ai.insights.risks} type="risk" />}
          {ai.insights.actions && <InsightList title="Onerilen Aksiyonlar" items={ai.insights.actions} type="action" />}
        </div>
        )}

        {/* ── 8. METHODOLOGY ── */}
        {ai.methodology && (
        <div className="mb-10 rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">Metodoloji / Veri Notlari</h3>
          <p className="text-[11px] leading-relaxed text-neutral-400">
            {ai.methodology}
          </p>
        </div>
        )}

      </div>
        );
      })()}
    </div>
  );
}
