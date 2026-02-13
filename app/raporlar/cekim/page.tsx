"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Lock,
  Activity,
  Zap,
  Clock,
  Hash,
  BarChart3,
  Users,
  Timer,
  DollarSign,
} from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  ReferenceArea,
  Label,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useStore } from "@/lib/store";

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

function getSpeedLabel(avgDuration: number, midX: number): { label: string; color: string; bg: string } {
  if (avgDuration <= midX * 0.8) return { label: "Hizli", color: "text-emerald-400", bg: "bg-emerald-400/10" };
  if (avgDuration >= midX * 1.4) return { label: "Yavas", color: "text-red-400", bg: "bg-red-400/10" };
  return { label: "Normal", color: "text-amber-400", bg: "bg-amber-400/10" };
}

/* ═══════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════ */
const MOCK_CEKIM_DATA = [
  { name: "X HAVALE", volume: 977730, avgDuration: 2.5, txCount: 1500 },
  { name: "BIGPAYSS HAVALE", volume: 387818, avgDuration: 8.5, txCount: 800 },
  { name: "KRIPTOPAY", volume: 207632, avgDuration: 4.5, txCount: 600 },
  { name: "MASTER HAVALE", volume: 97000, avgDuration: 9.8, txCount: 200 },
];

const MOCK_PERSONEL_DATA = [
  { name: "Mavi", processedCount: 45, avgProcessTime: 2.1, totalVolume: 450000 },
  { name: "Gunes", processedCount: 38, avgProcessTime: 3.5, totalVolume: 320000 },
  { name: "Tolga", processedCount: 52, avgProcessTime: 1.8, totalVolume: 580000 },
  { name: "Mira", processedCount: 28, avgProcessTime: 4.2, totalVolume: 190000 },
];

/* ═══════════════════════════════════════════════════════
   LEAGUE TABLE COLORS
   ═══════════════════════════════════════════════════════ */
const LEAGUE_COLORS = [
  { bg: "bg-amber-50/80", text: "text-amber-700", badge: "bg-gradient-to-br from-amber-400 to-amber-600", ring: "ring-amber-200" },
  { bg: "bg-slate-50/80", text: "text-slate-600", badge: "bg-gradient-to-br from-slate-300 to-slate-500", ring: "ring-slate-200" },
  { bg: "bg-orange-50/80", text: "text-orange-700", badge: "bg-gradient-to-br from-orange-300 to-orange-500", ring: "ring-orange-200" },
];

/* ═══════════════════════════════════════════════════════
   DARK SCATTER TOOLTIP
   ═══════════════════════════════════════════════════════ */
interface ScatterPayload {
  name: string;
  volume: number;
  avgDuration: number;
  txCount: number;
}

function MatrixTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ScatterPayload }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
      <p className="mb-2 text-xs font-bold text-white">{d.name}</p>
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-slate-400">
          Hacim{" "}
          <span className="font-semibold text-cyan-400">
            ₺{formatCurrency(d.volume)}
          </span>
        </span>
        <span className="text-[11px] text-slate-400">
          Ort. Sure{" "}
          <span className="font-semibold text-white">
            {d.avgDuration} dk
          </span>
        </span>
        <span className="text-[11px] text-slate-400">
          Islem Adedi{" "}
          <span className="font-semibold text-white">{d.txCount}</span>
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PERSONEL BAR TOOLTIP
   ═══════════════════════════════════════════════════════ */
interface PersonelPayload {
  name: string;
  processedCount: number;
  avgProcessTime: number;
  totalVolume: number;
}

function PersonelTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PersonelPayload }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
      <p className="mb-2 text-xs font-bold text-white">{d.name}</p>
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-slate-400">
          Islem Sayisi{" "}
          <span className="font-semibold text-cyan-400">{d.processedCount}</span>
        </span>
        <span className="text-[11px] text-slate-400">
          Ort. Sure{" "}
          <span className="font-semibold text-white">{d.avgProcessTime} dk</span>
        </span>
        <span className="text-[11px] text-slate-400">
          Toplam Hacim{" "}
          <span className="font-semibold text-emerald-400">₺{formatCurrency(d.totalVolume)}</span>
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function CekimRaporuPage() {
  const { role } = useStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  /* ── derived values ── */
  const scatterData = MOCK_CEKIM_DATA;
  const totalVolume = useMemo(() => scatterData.reduce((s, d) => s + d.volume, 0), [scatterData]);
  const avgDuration = useMemo(() => scatterData.reduce((s, d) => s + d.avgDuration, 0) / scatterData.length, [scatterData]);
  const totalTx = useMemo(() => scatterData.reduce((s, d) => s + d.txCount, 0), [scatterData]);

  const maxVolume = useMemo(() => Math.max(...scatterData.map((d) => d.volume)), [scatterData]);
  const maxDuration = useMemo(() => Math.max(...scatterData.map((d) => d.avgDuration)), [scatterData]);
  const maxTxCount = useMemo(() => Math.max(...scatterData.map((d) => d.txCount)), [scatterData]);

  const midX = maxDuration / 2;
  const midY = maxVolume / 2;
  const xMax = maxDuration * 1.15;
  const yMax = maxVolume * 1.15;

  const leagueSorted = useMemo(() => [...scatterData].sort((a, b) => b.volume - a.volume), [scatterData]);
  const leagueMax = leagueSorted.length > 0 ? leagueSorted[0].volume : 1;

  /* ── personel derived ── */
  const personelSorted = useMemo(() => [...MOCK_PERSONEL_DATA].sort((a, b) => b.totalVolume - a.totalVolume), []);
  const personelMaxVolume = useMemo(() => Math.max(...MOCK_PERSONEL_DATA.map((p) => p.totalVolume)), []);
  const personelMaxCount = useMemo(() => Math.max(...MOCK_PERSONEL_DATA.map((p) => p.processedCount)), []);

  if (!hydrated) {
    return <div className="min-h-screen bg-neutral-950" />;
  }

  if (role === "basic") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950">
        <Lock className="mb-3 h-8 w-8 text-neutral-600" strokeWidth={1.5} />
        <p className="mb-1 text-sm font-medium text-neutral-300">Erisim Engellendi</p>
        <p className="mb-4 text-xs text-neutral-500">Bu sayfa sadece Master kullanicilar icindir</p>
        <Link href="/" className="text-xs text-neutral-500 underline hover:text-white">Kasaya Don</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          STICKY NAV (translucent dark)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link
            href="/raporlar"
            className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            <span>Raporlar</span>
          </Link>
          <h1 className="text-sm font-semibold tracking-wide text-white/90">
            Cekim Performansi
          </h1>
          <div className="w-20" />
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — HERO KPI (Dark)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-neutral-950 pb-16 pt-12">
        {/* Subtle gradient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/[0.04] blur-[120px]" />
          <div className="absolute right-1/4 top-10 h-[400px] w-[400px] rounded-full bg-blue-500/[0.03] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          {/* Section label */}
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
              Cekim Analizi
            </p>
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              Gunun Cekim Performansi
            </h2>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {/* KPI 1 — Toplam Hacim */}
            <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-cyan-500/20 hover:bg-white/[0.04]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/[0.05] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                  <DollarSign className="h-5 w-5 text-cyan-400" strokeWidth={1.5} />
                </div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-500">
                  Toplam Cekim Hacmi
                </p>
                <p className="font-mono text-3xl font-black tracking-tight text-white md:text-4xl">
                  ₺{formatCompact(totalVolume)}
                </p>
                <p className="mt-2 text-[11px] text-neutral-500">
                  {formatCurrency(totalVolume)} TL
                </p>
              </div>
            </div>

            {/* KPI 2 — Ort. Sure */}
            <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-blue-500/20 hover:bg-white/[0.04]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/[0.05] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-400" strokeWidth={1.5} />
                </div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-500">
                  Ortalama Islem Suresi
                </p>
                <p className="font-mono text-3xl font-black tracking-tight text-white md:text-4xl">
                  {avgDuration.toFixed(1)}
                  <span className="ml-1 text-lg font-medium text-neutral-500">dk</span>
                </p>
                <p className="mt-2 text-[11px] text-neutral-500">
                  4 yontem ortalamasi
                </p>
              </div>
            </div>

            {/* KPI 3 — Islem Adedi */}
            <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-emerald-500/20 hover:bg-white/[0.04]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/[0.05] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Hash className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
                </div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-500">
                  Toplam Islem Adedi
                </p>
                <p className="font-mono text-3xl font-black tracking-tight text-white md:text-4xl">
                  {formatCurrency(totalTx)}
                </p>
                <p className="mt-2 text-[11px] text-neutral-500">
                  Tum yontemler toplami
                </p>
              </div>
            </div>

            {/* KPI 4 — Yontem Sayisi */}
            <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-violet-500/20 hover:bg-white/[0.04]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/[0.05] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                  <BarChart3 className="h-5 w-5 text-violet-400" strokeWidth={1.5} />
                </div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-500">
                  Aktif Yontem Sayisi
                </p>
                <p className="font-mono text-3xl font-black tracking-tight text-white md:text-4xl">
                  {scatterData.length}
                </p>
                <p className="mt-2 text-[11px] text-neutral-500">
                  Aktif cekim kanali
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — LIG TABLOSU (Light)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-neutral-50 py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5">
              <Trophy className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-700">
                Siralama
              </span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-neutral-900 md:text-2xl">
              Cekim Yontemleri Siralaması
            </h2>
            <p className="text-sm text-neutral-400">
              Yontemler toplam cekim hacmine gore siralanmistir
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
            {leagueSorted.map((item, index) => {
              const pct = (item.volume / leagueMax) * 100;
              const speed = getSpeedLabel(item.avgDuration, midX);
              const leagueStyle =
                index < 3
                  ? LEAGUE_COLORS[index]
                  : { bg: "bg-white", text: "text-neutral-600", badge: "bg-neutral-300", ring: "ring-transparent" };

              return (
                <div
                  key={item.name}
                  className={`group flex items-center gap-3 border-b border-neutral-100 px-5 py-3.5 transition-all last:border-0 md:gap-4 md:px-6 md:py-4 ${
                    index < 3
                      ? `${leagueStyle.bg} hover:brightness-[0.98]`
                      : "hover:bg-neutral-50"
                  }`}
                >
                  {/* Rank badge */}
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${leagueStyle.badge}`}
                  >
                    {index + 1}
                  </div>

                  {/* Medal */}
                  <div className="w-5 flex-shrink-0">
                    {index === 0 && <Medal className="h-4 w-4 text-amber-500" strokeWidth={2} />}
                    {index === 1 && <Medal className="h-4 w-4 text-neutral-400" strokeWidth={2} />}
                    {index === 2 && <Medal className="h-4 w-4 text-orange-400" strokeWidth={2} />}
                  </div>

                  {/* Name */}
                  <span className={`w-36 flex-shrink-0 text-xs font-bold ${index < 3 ? leagueStyle.text : "text-neutral-700"}`}>
                    {item.name}
                  </span>

                  {/* Progress bar with gradient */}
                  <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: item.avgDuration <= midX
                          ? "linear-gradient(90deg, #10B981, #34D399)"
                          : item.avgDuration >= midX * 1.4
                          ? "linear-gradient(90deg, #EF4444, #F87171)"
                          : "linear-gradient(90deg, #F59E0B, #FBBF24)",
                      }}
                    />
                  </div>

                  {/* Volume */}
                  <span className="w-28 text-right font-mono text-xs font-bold tabular-nums text-neutral-800">
                    ₺{formatCurrency(item.volume)}
                  </span>

                  {/* Speed + Stats */}
                  <div className="hidden flex-shrink-0 items-center gap-2 md:flex">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${speed.bg} ${speed.color}`}>
                      {speed.label}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {item.avgDuration}dk
                    </span>
                    <span className="text-[10px] text-neutral-300">·</span>
                    <span className="text-[10px] text-neutral-400">
                      {item.txCount} islem
                    </span>
                  </div>

                  {/* Trend icon */}
                  <div className="w-5 flex-shrink-0">
                    {item.avgDuration <= midX ? (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-red-400" strokeWidth={2} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3 — HIZ-HACIM MATRISI (Dark)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-slate-950 py-12 md:py-16">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.03] blur-[150px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5">
              <Activity className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-400">
                Matris
              </span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-white md:text-2xl">
              Yontem Hiz-Hacim Matrisi
            </h2>
            <p className="text-sm text-slate-500">
              Kabarcik boyutu islem adedini, konum ise hiz ve hacim iliskisini gosterir
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 md:p-6">
            {/* Quadrant legend */}
            <div className="mb-5 flex flex-wrap justify-center gap-4">
              {[
                { color: "bg-emerald-400", label: "Yildizlar", desc: "Yuksek Hacim, Hizli" },
                { color: "bg-red-400", label: "Darbogazlar", desc: "Yuksek Hacim, Yavas" },
                { color: "bg-emerald-400/50", label: "Potansiyel", desc: "Dusuk Hacim, Hizli" },
                { color: "bg-red-400/50", label: "Verimsiz", desc: "Dusuk Hacim, Yavas" },
              ].map((q) => (
                <div key={q.label} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-sm ${q.color} opacity-60`} />
                  <span className="text-[10px] font-medium text-slate-300">{q.label}</span>
                  <span className="text-[10px] text-slate-600">({q.desc})</span>
                </div>
              ))}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={420}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

                {/* Quadrant backgrounds */}
                <ReferenceArea x1={0} x2={midX} y1={midY} y2={yMax} fill="#10B981" fillOpacity={0.06} ifOverflow="extendDomain" />
                <ReferenceArea x1={midX} x2={xMax} y1={midY} y2={yMax} fill="#EF4444" fillOpacity={0.06} ifOverflow="extendDomain" />
                <ReferenceArea x1={0} x2={midX} y1={0} y2={midY} fill="#10B981" fillOpacity={0.03} ifOverflow="extendDomain" />
                <ReferenceArea x1={midX} x2={xMax} y1={0} y2={midY} fill="#EF4444" fillOpacity={0.03} ifOverflow="extendDomain" />

                <XAxis
                  type="number"
                  dataKey="avgDuration"
                  domain={[0, xMax]}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(v: number) => `${v}dk`}
                  stroke="rgba(255,255,255,0.08)"
                >
                  <Label value="Ortalama Islem Suresi (Dk)" position="bottom" offset={10} style={{ fontSize: 11, fill: "#64748b" }} />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="volume"
                  domain={[0, yMax]}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(v: number) => `₺${formatCompact(v)}`}
                  stroke="rgba(255,255,255,0.08)"
                >
                  <Label value="Toplam Hacim (₺)" angle={-90} position="insideLeft" offset={-5} style={{ fontSize: 11, fill: "#64748b", textAnchor: "middle" }} />
                </YAxis>
                <ZAxis type="number" dataKey="txCount" range={[300, 1400]} domain={[0, maxTxCount]} />

                <Tooltip content={<MatrixTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" }} />

                <Scatter data={scatterData} fill="#22D3EE" fillOpacity={0.8} stroke="#06B6D4" strokeWidth={2}>
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — YONTEM OZET KARTLARI (Light)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5">
              <Zap className="h-4 w-4 text-blue-500" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-700">
                Ozet
              </span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-neutral-900 md:text-2xl">
              Yontem Bazinda Ozet
            </h2>
            <p className="text-sm text-neutral-400">
              Her cekim yonteminin performans ozetini bir bakista gorun
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {leagueSorted.map((item, index) => {
              const speed = getSpeedLabel(item.avgDuration, midX);
              return (
                <div
                  key={item.name}
                  className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg"
                >
                  {/* Rank indicator */}
                  <div className="absolute right-4 top-4 font-mono text-5xl font-black text-neutral-100 transition-colors group-hover:text-neutral-200">
                    {index + 1}
                  </div>

                  <div className="relative">
                    <p className="mb-4 text-xs font-bold text-neutral-800">
                      {item.name}
                    </p>
                    <p className="mb-1 font-mono text-2xl font-black tracking-tight text-neutral-900">
                      ₺{formatCompact(item.volume)}
                    </p>
                    <p className="mb-4 text-[11px] text-neutral-400">
                      {formatCurrency(item.volume)} TL toplam hacim
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${speed.bg} ${speed.color}`}>
                        {speed.label}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {item.avgDuration} dk ort.
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-1 border-t border-neutral-100 pt-3">
                      <Hash className="h-3 w-3 text-neutral-300" strokeWidth={1.5} />
                      <span className="text-[11px] font-medium text-neutral-500">
                        {formatCurrency(item.txCount)} islem
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 5 — PERSONEL PERFORMANSI (Dark)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-neutral-950 py-12 md:py-16">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-1/4 top-0 h-[400px] w-[400px] rounded-full bg-violet-500/[0.03] blur-[120px]" />
          <div className="absolute left-1/3 bottom-0 h-[300px] w-[300px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5">
              <Users className="h-4 w-4 text-violet-400" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-violet-400">
                Ekip
              </span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-white md:text-2xl">
              Personel Cekim Isleme Performansi
            </h2>
            <p className="text-sm text-slate-500">
              Kim en hizli isliyor, kim en cok hacim ceviriyor
            </p>
          </div>

          {/* Personel cards grid */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {personelSorted.map((person, index) => {
              const volumePct = (person.totalVolume / personelMaxVolume) * 100;
              const countPct = (person.processedCount / personelMaxCount) * 100;
              const isTopVolume = index === 0;
              const isTopSpeed = person.avgProcessTime === Math.min(...MOCK_PERSONEL_DATA.map((p) => p.avgProcessTime));

              return (
                <div
                  key={person.name}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  {/* Glow on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="relative">
                    {/* Name + badges */}
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-sm font-bold text-white">
                        {person.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{person.name}</p>
                        <div className="flex gap-1">
                          {isTopVolume && (
                            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-400">
                              #1 Hacim
                            </span>
                          )}
                          {isTopSpeed && (
                            <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase text-cyan-400">
                              En Hizli
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Volume */}
                    <div className="mb-3">
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        Toplam Hacim
                      </p>
                      <p className="font-mono text-xl font-black text-white">
                        ₺{formatCompact(person.totalVolume)}
                      </p>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400 transition-all duration-700"
                          style={{ width: `${volumePct}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-slate-500">
                          Islem
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono text-lg font-bold text-white">{person.processedCount}</span>
                          <span className="text-[10px] text-slate-500">adet</span>
                        </div>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-emerald-400/60 transition-all duration-700"
                            style={{ width: `${countPct}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-slate-500">
                          Ort. Sure
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono text-lg font-bold text-white">{person.avgProcessTime}</span>
                          <span className="text-[10px] text-slate-500">dk</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          {person.avgProcessTime <= 2.5 ? (
                            <Zap className="h-3 w-3 text-cyan-400" strokeWidth={2} />
                          ) : (
                            <Timer className="h-3 w-3 text-amber-400" strokeWidth={2} />
                          )}
                          <span className={`text-[9px] font-medium ${person.avgProcessTime <= 2.5 ? "text-cyan-400" : "text-amber-400"}`}>
                            {person.avgProcessTime <= 2.5 ? "Hizli" : "Normal"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Personel bar chart */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 md:p-6">
            <h3 className="mb-4 text-center text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
              Personel Hacim Karsilastirmasi
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={personelSorted} margin={{ top: 10, right: 20, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.06)" />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v: number) => `₺${formatCompact(v)}`} stroke="rgba(255,255,255,0.06)" />
                <Tooltip content={<PersonelTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="totalVolume" radius={[8, 8, 0, 0]} name="Toplam Hacim">
                  {personelSorted.map((_, i) => {
                    const colors = ["#8B5CF6", "#6366F1", "#818CF8", "#A78BFA"];
                    return <Cell key={i} fill={colors[i % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Bottom spacer */}
      <div className="h-8 bg-neutral-950" />
    </div>
  );
}
