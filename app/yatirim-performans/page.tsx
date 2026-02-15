"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  Check,
  Calendar,
  Wallet,
  BarChart3,
  Lock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { KasaCardData } from "@/lib/excel-processor";

/* ─── Types ─── */
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

/* ─── Helpers ─── */
const GUN_ISIMLERI: Record<number, string> = {
  0: "Pazar",
  1: "Pazartesi",
  2: "Sali",
  3: "Carsamba",
  4: "Persembe",
  5: "Cuma",
  6: "Cumartesi",
};

function fmt(v: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return fmt(v);
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}

function gunIsmi(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return GUN_ISIMLERI[d.getDay()] || "";
}

function gunKisa(iso: string): string {
  return gunIsmi(iso).slice(0, 3);
}

/* ─── Telegram text generators ─── */
function generateGunlukMetni(kasaData: KasaCardData[]): string {
  const aktif = kasaData.filter((k) => k.toplamBorc > 0 || k.toplamKredi > 0);
  if (aktif.length === 0) return "";
  const now = new Date();
  const tarih = now.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const saat = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const tY = aktif.reduce((s, k) => s + k.toplamBorc, 0);
  const tK = aktif.reduce((s, k) => s + k.komisyon, 0);
  const tC = aktif.reduce((s, k) => s + k.toplamKredi, 0);
  const tN = aktif.reduce((s, k) => s + k.netBorc, 0);
  const tR = aktif.reduce((s, k) => s + k.kalanKasa, 0);
  const lines: string[] = [];
  lines.push("📊 GUN ICI YATIRIM PERFORMANSI");
  lines.push(`📅 ${tarih} | ⏰ ${saat}`);
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");
  for (const k of aktif) {
    lines.push(`📋 ${k.odemeTuruAdi}`);
    lines.push(`   💰 Yatirim: ₺${fmt(k.toplamBorc)}`);
    if (k.komisyonOrani > 0) lines.push(`   📉 Komisyon: -₺${fmt(k.komisyon)} (%${k.komisyonOrani})`);
    if (k.toplamKredi > 0) lines.push(`   📤 Cekim: ₺${fmt(k.toplamKredi)}`);
    lines.push(`   🏦 Kalan: ₺${fmt(k.kalanKasa)}`);
    lines.push("");
  }
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(`💰 Toplam Yatirim: ₺${fmt(tY)}`);
  if (tK > 0) lines.push(`📉 Toplam Komisyon: -₺${fmt(tK)}`);
  lines.push(`💵 Net Yatirim: ₺${fmt(tN)}`);
  if (tC > 0) lines.push(`📤 Toplam Cekim: ₺${fmt(tC)}`);
  lines.push(`🏦 Toplam Kalan: ₺${fmt(tR)}`);
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  return lines.join("\n");
}

function generateHaftalikMetni(
  snapshots: KasaSnapshot[],
  weeklyMethods: { name: string; yatirim: number; komisyon: number; cekim: number }[],
): string {
  if (snapshots.length === 0) return "";
  const first = fmtDate(snapshots[0].snapshot_date);
  const last = fmtDate(snapshots[snapshots.length - 1].snapshot_date);
  const tY = snapshots.reduce((s, sn) => s + sn.total_yatirim, 0);
  const tK = snapshots.reduce((s, sn) => s + sn.total_komisyon, 0);
  const tC = snapshots.reduce((s, sn) => s + sn.total_cekim, 0);
  const lines: string[] = [];
  lines.push("📊 HAFTALIK KUMULATIF OZET");
  lines.push(`📅 ${first} - ${last}`);
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");
  for (const sn of snapshots) {
    lines.push(`📅 ${fmtDate(sn.snapshot_date)} ${gunKisa(sn.snapshot_date)}: ₺${fmt(sn.total_yatirim)}`);
  }
  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(`💰 Haftalik Toplam: ₺${fmt(tY)}`);
  if (tK > 0) lines.push(`📉 Komisyon: -₺${fmt(tK)}`);
  if (tC > 0) lines.push(`📤 Cekim: ₺${fmt(tC)}`);
  lines.push("");
  if (weeklyMethods.length > 0) {
    lines.push("📋 YONTEM BAZLI:");
    for (const m of weeklyMethods) {
      lines.push(`  ${m.name}: ₺${fmt(m.yatirim)} yat. | -₺${fmt(m.komisyon)} kom. | ₺${fmt(m.cekim)} cek.`);
    }
  }
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  return lines.join("\n");
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

/* ─────────────────────────── PAGE ─────────────────────────── */
export default function YatirimPerformansPage() {
  const { role, kasaData } = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [snapshots, setSnapshots] = useState<KasaSnapshot[]>([]);
  const [gunlukCopied, setGunlukCopied] = useState(false);
  const [haftalikCopied, setHaftalikCopied] = useState(false);

  useEffect(() => {
    setHydrated(true);
    fetch("/api/haftalik-kasa")
      .then((r) => r.json())
      .then((j) => { if (j.snapshots) setSnapshots(j.snapshots); })
      .catch(() => {});
  }, []);

  /* ─── Derived data ─── */
  const aktifKasa = useMemo(() => kasaData.filter((k) => k.toplamBorc > 0 || k.toplamKredi > 0), [kasaData]);
  const hasKasa = aktifKasa.length > 0;
  const hasSn = snapshots.length > 0;

  const totals = useMemo(() => {
    const yatirim = aktifKasa.reduce((s, k) => s + k.toplamBorc, 0);
    const komisyon = aktifKasa.reduce((s, k) => s + k.komisyon, 0);
    const net = aktifKasa.reduce((s, k) => s + k.netBorc, 0);
    const cekim = aktifKasa.reduce((s, k) => s + k.toplamKredi, 0);
    const cekimKom = aktifKasa.reduce((s, k) => s + k.cekimKomisyon, 0);
    const kalan = aktifKasa.reduce((s, k) => s + k.kalanKasa, 0);
    return { yatirim, komisyon, net, cekim, cekimKom, kalan };
  }, [aktifKasa]);

  const haftalikTopYatirim = useMemo(() => snapshots.reduce((s, sn) => s + sn.total_yatirim, 0), [snapshots]);

  const yediGunOrt = useMemo(() => {
    if (snapshots.length === 0) return new Map<string, number>();
    const acc = new Map<string, { total: number; count: number }>();
    for (const sn of snapshots) {
      for (const d of sn.details) {
        const p = acc.get(d.name) || { total: 0, count: 0 };
        acc.set(d.name, { total: p.total + d.yatirim, count: p.count + 1 });
      }
    }
    const result = new Map<string, number>();
    acc.forEach((v, k) => result.set(k, v.count > 0 ? v.total / v.count : 0));
    return result;
  }, [snapshots]);

  const weeklyMethods = useMemo(() => {
    if (snapshots.length === 0) return [];
    const acc = new Map<string, { yatirim: number; komisyon: number; cekim: number; kalan: number }>();
    for (const sn of snapshots) {
      for (const d of sn.details) {
        const p = acc.get(d.name) || { yatirim: 0, komisyon: 0, cekim: 0, kalan: 0 };
        acc.set(d.name, {
          yatirim: p.yatirim + d.yatirim,
          komisyon: p.komisyon + d.komisyon,
          cekim: p.cekim + d.cekim,
          kalan: p.kalan + d.kalan,
        });
      }
    }
    return Array.from(acc.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.yatirim - a.yatirim);
  }, [snapshots]);

  /* ─── Copy handlers ─── */
  const handleGunlukCopy = useCallback(async () => {
    const t = generateGunlukMetni(kasaData);
    if (!t) return;
    await copyText(t);
    setGunlukCopied(true);
    setTimeout(() => setGunlukCopied(false), 2500);
  }, [kasaData]);

  const handleHaftalikCopy = useCallback(async () => {
    const t = generateHaftalikMetni(snapshots, weeklyMethods);
    if (!t) return;
    await copyText(t);
    setHaftalikCopied(true);
    setTimeout(() => setHaftalikCopied(false), 2500);
  }, [snapshots, weeklyMethods]);

  /* ─── Guards ─── */
  if (!hydrated) return <div className="min-h-screen bg-black" />;

  if (role === "basic") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black">
        <Lock className="mb-4 h-8 w-8 text-neutral-600" strokeWidth={1.5} />
        <p className="mb-1 text-sm font-medium text-neutral-300">Erisim Engellendi</p>
        <p className="mb-6 text-xs text-neutral-500">Bu sayfa sadece Master kullanicilar icindir</p>
        <Link href="/" className="text-xs text-neutral-500 underline hover:text-white">Kasaya Don</Link>
      </div>
    );
  }

  const noData = !hasKasa && !hasSn;

  return (
    <div className="min-h-screen bg-black">

      {/* ━━━ HERO: Dark Section ━━━ */}
      <section className="relative overflow-hidden bg-black pb-12 pt-4">
        {/* Subtle gradient orb */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#1E5EFF]/8 blur-[120px]" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-emerald-500/6 blur-[100px]" />

        {/* Nav */}
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            <span>Kasa</span>
          </Link>
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-600">Performans</p>
        </div>

        {/* Title */}
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Yatirim Performansi
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Canli yontem bazli finansal gorunum ve haftalik karsilastirma
          </p>
        </div>

        {/* KPI Cards */}
        {hasKasa && (
          <div className="mx-auto mt-10 grid max-w-6xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Toplam Yatirim */}
            <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.05]">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E5EFF]/15">
                  <TrendingUp className="h-4 w-4 text-[#1E5EFF]" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Toplam Yatirim</span>
              </div>
              <p className="font-mono text-2xl font-bold text-white">₺{fmt(totals.yatirim)}</p>
              {hasSn && (
                <p className="mt-1 text-[10px] text-neutral-600">
                  Haftalik: ₺{fmt(haftalikTopYatirim)}
                </p>
              )}
            </div>

            {/* Toplam Komisyon */}
            <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.05]">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
                  <BarChart3 className="h-4 w-4 text-red-400" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Toplam Komisyon</span>
              </div>
              <p className="font-mono text-2xl font-bold text-red-400">-₺{fmt(totals.komisyon)}</p>
              {totals.cekimKom > 0 && (
                <p className="mt-1 text-[10px] text-neutral-600">
                  Cekim Kom.: -₺{fmt(totals.cekimKom)}
                </p>
              )}
            </div>

            {/* Net Kalan */}
            <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.05]">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                  <Wallet className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Net Kalan</span>
              </div>
              <p className="font-mono text-2xl font-bold text-emerald-400">₺{fmt(totals.kalan)}</p>
            </div>

            {/* Toplam Cekim */}
            <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.05]">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
                  <TrendingDown className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Toplam Cekim</span>
              </div>
              <p className="font-mono text-2xl font-bold text-amber-400">₺{fmt(totals.cekim)}</p>
            </div>
          </div>
        )}

        {noData && (
          <div className="mx-auto mt-16 flex max-w-6xl flex-col items-center justify-center px-6 pb-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <BarChart3 className="h-7 w-7 text-neutral-600" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-neutral-400">Henuz Veri Yok</p>
            <p className="mt-1 max-w-xs text-xs text-neutral-600">
              Excel yukleyin veya Telegram botu uzerinden veri gonderin. Veriler yuklendiginde performans burada gorunecek.
            </p>
            <Link href="/" className="mt-6 text-xs text-neutral-500 underline hover:text-white">Kasaya Don</Link>
          </div>
        )}
      </section>

      {/* ━━━ MAIN CONTENT: Light Section ━━━ */}
      {(hasKasa || hasSn) && (
        <section className="bg-[#F5F5F7] py-12">
          <div className="mx-auto max-w-6xl px-6">

            {/* Yan yana layout */}
            <div className={`grid gap-6 ${hasKasa && hasSn ? "lg:grid-cols-[1.4fr_1fr]" : ""}`}>

              {/* ── SOL: Gunluk Yontem Tablosu ── */}
              {hasKasa && (
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/5">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                    <div>
                      <h2 className="text-[15px] font-bold text-neutral-900">Gun Ici Yontem Ozeti</h2>
                      <p className="mt-0.5 text-[11px] text-neutral-400">Canli kasa verisi — anlik durum</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGunlukCopy}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-semibold transition-all ${
                        gunlukCopied
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
                      }`}
                    >
                      {gunlukCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {gunlukCopied ? "Kopyalandi" : "Telegram"}
                    </button>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50/70">
                          <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">Yontem</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400" colSpan={2}>Yatirim</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400">Komisyon</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400">Cekim</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400">Kalan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aktifKasa.map((k, i) => {
                          const avg = yediGunOrt.get(k.odemeTuruAdi);
                          const today = k.toplamBorc;
                          let pct: number | null = null;
                          let dir: "up" | "down" | "same" | null = null;
                          if (avg != null && avg > 0) {
                            pct = ((today - avg) / avg) * 100;
                            if (pct > 2) dir = "up";
                            else if (pct < -2) dir = "down";
                            else dir = "same";
                          }
                          return (
                            <tr key={k.id} className={`border-b border-neutral-50 transition-colors hover:bg-neutral-50/60 ${i % 2 !== 0 ? "bg-neutral-50/30" : ""}`}>
                              <td className="px-6 py-3.5">
                                <span className="text-[13px] font-semibold text-neutral-800">{k.odemeTuruAdi}</span>
                              </td>
                              <td className="py-3.5 pl-4 pr-0 text-right">
                                <span className="font-mono text-[13px] font-semibold text-neutral-700">₺{fmt(today)}</span>
                              </td>
                              <td className="py-3.5 pl-1.5 pr-4">
                                {dir && pct !== null ? (
                                  <span className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-bold ${
                                    dir === "up"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : dir === "down"
                                        ? "bg-red-50 text-red-500"
                                        : "bg-neutral-100 text-neutral-400"
                                  }`}>
                                    {dir === "up" && <TrendingUp className="h-3 w-3" />}
                                    {dir === "down" && <TrendingDown className="h-3 w-3" />}
                                    {dir === "same" && <Minus className="h-3 w-3" />}
                                    {pct > 0 ? "+" : ""}{pct.toFixed(0)}%
                                  </span>
                                ) : null}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                {k.komisyonOrani > 0 ? (
                                  <div className="flex flex-col items-end">
                                    <span className="font-mono text-[12px] font-semibold text-red-500">-₺{fmt(k.komisyon)}</span>
                                    <span className="text-[9px] text-neutral-400">%{k.komisyonOrani}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-neutral-300">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                {k.toplamKredi > 0 ? (
                                  <span className="font-mono text-[12px] font-semibold text-amber-600">₺{fmt(k.toplamKredi)}</span>
                                ) : (
                                  <span className="text-xs text-neutral-300">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <span className="font-mono text-[13px] font-bold text-emerald-600">₺{fmt(k.kalanKasa)}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-neutral-200 bg-neutral-50">
                          <td className="px-6 py-3.5">
                            <span className="text-[12px] font-black uppercase tracking-wider text-neutral-600">Toplam</span>
                          </td>
                          <td className="py-3.5 pl-4 pr-0 text-right font-mono text-[13px] font-black text-neutral-800" colSpan={2}>
                            ₺{fmt(totals.yatirim)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-[12px] font-black text-red-500">
                            {totals.komisyon > 0 ? `-₺${fmt(totals.komisyon)}` : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-[12px] font-black text-amber-600">
                            {totals.cekim > 0 ? `₺${fmt(totals.cekim)}` : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-[13px] font-black text-emerald-600">
                            ₺{fmt(totals.kalan)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Performance legend */}
                  {yediGunOrt.size > 0 && (
                    <div className="border-t border-neutral-100 px-6 py-3">
                      <p className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        Yuzde degisimi: bugunun yatirimi vs son {snapshots.length} gun ortalamasi
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── SAG: Haftalik Kumulatif ── */}
              {hasSn && (
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/5">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                    <div>
                      <h2 className="text-[15px] font-bold text-neutral-900">Haftalik Kumulatif</h2>
                      <p className="mt-0.5 text-[11px] text-neutral-400">Son {snapshots.length} gun — toplam gorunum</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleHaftalikCopy}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-semibold transition-all ${
                        haftalikCopied
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
                      }`}
                    >
                      {haftalikCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {haftalikCopied ? "Kopyalandi" : "Telegram"}
                    </button>
                  </div>

                  {/* Day-by-day bars */}
                  <div className="border-b border-neutral-100 px-6 py-5">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Gun Bazli Yatirimlar</p>
                    <div className="space-y-2">
                      {snapshots.map((sn) => {
                        const maxY = Math.max(...snapshots.map((s) => s.total_yatirim), 1);
                        const pct = (sn.total_yatirim / maxY) * 100;
                        return (
                          <div key={sn.snapshot_date} className="flex items-center gap-3">
                            <span className="w-16 shrink-0 text-right text-[11px] font-semibold text-neutral-500">
                              {gunKisa(sn.snapshot_date)} {fmtDate(sn.snapshot_date)}
                            </span>
                            <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-neutral-100">
                              <div
                                className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-[#1E5EFF]/20 to-[#1E5EFF]/10"
                                style={{ width: `${Math.max(pct, 3)}%` }}
                              />
                              <span className="relative z-10 flex h-full items-center pl-3 font-mono text-[11px] font-bold text-neutral-700">
                                ₺{fmtCompact(sn.total_yatirim)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Weekly total */}
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500">Haftalik Toplam</span>
                      <span className="font-mono text-[15px] font-black text-[#1E5EFF]">₺{fmt(haftalikTopYatirim)}</span>
                    </div>
                  </div>

                  {/* Method-level weekly cumulative */}
                  {weeklyMethods.length > 0 && (
                    <div className="px-6 py-5">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Yontem Bazli Haftalik</p>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neutral-100">
                            <th className="pb-2 text-left text-[9px] font-bold uppercase tracking-wider text-neutral-400">Yontem</th>
                            <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-wider text-neutral-400">Yatirim</th>
                            <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-wider text-neutral-400">Komisyon</th>
                            <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-wider text-neutral-400">Cekim</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weeklyMethods.map((m, i) => (
                            <tr key={m.name} className={`border-b border-neutral-50 ${i % 2 !== 0 ? "bg-neutral-50/40" : ""}`}>
                              <td className="py-2.5 text-[12px] font-semibold text-neutral-700">{m.name}</td>
                              <td className="py-2.5 text-right font-mono text-[12px] font-semibold text-neutral-700">₺{fmtCompact(m.yatirim)}</td>
                              <td className="py-2.5 text-right font-mono text-[12px] font-semibold text-red-500">{m.komisyon > 0 ? `-₺${fmtCompact(m.komisyon)}` : "—"}</td>
                              <td className="py-2.5 text-right font-mono text-[12px] font-semibold text-amber-600">{m.cekim > 0 ? `₺${fmtCompact(m.cekim)}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* ━━━ FOOTER: Dark Section ━━━ */}
      {(hasKasa || hasSn) && (
        <section className="bg-black py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600">Telegram Paylasim</p>
            <div className="flex gap-3">
              {hasKasa && (
                <button
                  type="button"
                  onClick={handleGunlukCopy}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
                    gunlukCopied
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-white/[0.06] text-neutral-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {gunlukCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {gunlukCopied ? "Kopyalandi!" : "Gunluk Ozet"}
                </button>
              )}
              {hasSn && (
                <button
                  type="button"
                  onClick={handleHaftalikCopy}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
                    haftalikCopied
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-white/[0.06] text-neutral-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {haftalikCopied ? <Check className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                  {haftalikCopied ? "Kopyalandi!" : "Haftalik Ozet"}
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
