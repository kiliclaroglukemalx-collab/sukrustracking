"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Lock,
  Activity,
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
} from "recharts";
import { useStore } from "@/lib/store";

/* ─────────── helpers ─────────── */
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

/* ─────────── league colors ─────────── */
const LEAGUE_COLORS = [
  { bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-500" },
  { bg: "bg-neutral-50", text: "text-neutral-600", badge: "bg-neutral-400" },
  { bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-400" },
];

/* ─────────── mock data (ileride bot API'den gelecek) ─────────── */
const MOCK_CEKIM_DATA = [
  { name: "X HAVALE", volume: 977730, avgDuration: 2.5, txCount: 1500 },
  { name: "BIGPAYSS HAVALE", volume: 387818, avgDuration: 8.5, txCount: 800 },
  { name: "KRIPTOPAY", volume: 207632, avgDuration: 4.5, txCount: 600 },
  { name: "MASTER HAVALE", volume: 97000, avgDuration: 9.8, txCount: 200 },
];

/* ─────────── scatter tooltip ─────────── */
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
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 shadow-lg">
      <p className="mb-1.5 text-xs font-bold text-neutral-800">{d.name}</p>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-neutral-500">
          Hacim:{" "}
          <span className="font-semibold text-neutral-800">
            ₺{formatCurrency(d.volume)}
          </span>
        </span>
        <span className="text-[11px] text-neutral-500">
          Ort. Sure:{" "}
          <span className="font-semibold text-neutral-800">
            {d.avgDuration} dk
          </span>
        </span>
        <span className="text-[11px] text-neutral-500">
          Islem Adedi:{" "}
          <span className="font-semibold text-neutral-800">{d.txCount}</span>
        </span>
      </div>
    </div>
  );
}

/* ─────────── MAIN PAGE ─────────── */
export default function CekimRaporuPage() {
  const { role } = useStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  /* derived values for scatter chart */
  const scatterData = MOCK_CEKIM_DATA;
  const maxVolume = useMemo(
    () => Math.max(...scatterData.map((d) => d.volume)),
    [scatterData],
  );
  const maxDuration = useMemo(
    () => Math.max(...scatterData.map((d) => d.avgDuration)),
    [scatterData],
  );
  const maxTxCount = useMemo(
    () => Math.max(...scatterData.map((d) => d.txCount)),
    [scatterData],
  );

  /* quadrant boundaries */
  const midX = maxDuration / 2;
  const midY = maxVolume / 2;
  const xMax = maxDuration * 1.15;
  const yMax = maxVolume * 1.15;

  /* league sort: volume descending */
  const leagueSorted = useMemo(
    () => [...scatterData].sort((a, b) => b.volume - a.volume),
    [scatterData],
  );
  const leagueMax = leagueSorted.length > 0 ? leagueSorted[0].volume : 1;

  if (!hydrated) {
    return <div className="min-h-screen bg-neutral-50" />;
  }

  if (role === "basic") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50">
        <Lock className="mb-3 h-8 w-8 text-neutral-300" strokeWidth={1.5} />
        <p className="mb-1 text-sm font-medium text-neutral-600">
          Erisim Engellendi
        </p>
        <p className="mb-4 text-xs text-neutral-400">
          Bu sayfa sadece Master kullanicilar icindir
        </p>
        <Link
          href="/"
          className="text-xs text-neutral-500 underline hover:text-neutral-800"
        >
          Kasaya Don
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ── Top Nav ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200 bg-white/90 px-5 py-3 backdrop-blur-sm">
        <Link
          href="/raporlar"
          className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span>Raporlar</span>
        </Link>
        <h1 className="text-sm font-bold tracking-wide text-neutral-900">
          Cekim Performansi
        </h1>
        <div className="w-20" />
      </div>

      <div className="mx-auto max-w-4xl px-5 py-6">
        {/* ═══════════════════════════════════════════
            SECTION 1 — LIG TABLOSU
        ═══════════════════════════════════════════ */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-neutral-800">
              Cekim Yontemleri Siralaması
            </h2>
          </div>
          <p className="mb-4 text-xs text-neutral-400">
            Yontemler toplam cekim hacmine gore siralanmistir
          </p>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {leagueSorted.map((item, index) => {
              const pct = (item.volume / leagueMax) * 100;
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
                  key={item.name}
                  className={`flex items-center gap-3 border-b border-neutral-50 px-4 py-2.5 last:border-0 ${
                    index < 3 ? leagueStyle.bg : "hover:bg-neutral-50/50"
                  }`}
                >
                  {/* Rank badge */}
                  <div
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${leagueStyle.badge}`}
                  >
                    {index + 1}
                  </div>

                  {/* Medal */}
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

                  {/* Name */}
                  <span
                    className={`w-36 flex-shrink-0 text-xs font-semibold ${
                      index < 3 ? leagueStyle.text : "text-neutral-700"
                    }`}
                  >
                    {item.name}
                  </span>

                  {/* Progress bar */}
                  <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-neutral-900 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Volume */}
                  <span className="w-28 text-right font-mono text-xs font-bold tabular-nums text-neutral-800">
                    ₺{formatCurrency(item.volume)}
                  </span>

                  {/* Stats */}
                  <div className="flex w-24 flex-shrink-0 items-center justify-end gap-2">
                    <span className="text-[10px] text-neutral-400">
                      {item.txCount} islem
                    </span>
                    {item.avgDuration <= midX ? (
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
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION 2 — HIZ-HACİM MATRİSİ (Scatter)
        ═══════════════════════════════════════════ */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-neutral-800">
              Yontem Hiz-Hacim Matrisi
            </h2>
          </div>
          <p className="mb-4 text-xs text-neutral-400">
            Kabarcik boyutu islem adedini, konum ise hiz ve hacim iliskisini
            gosterir
          </p>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-5">
            {/* Quadrant legend */}
            <div className="mb-4 flex flex-wrap gap-3">
              {[
                {
                  color: "bg-emerald-400",
                  label: "Yildizlar",
                  desc: "Yuksek Hacim, Hizli",
                },
                {
                  color: "bg-red-400",
                  label: "Darbogazlar",
                  desc: "Yuksek Hacim, Yavas",
                },
                {
                  color: "bg-emerald-300",
                  label: "Potansiyel",
                  desc: "Dusuk Hacim, Hizli",
                },
                {
                  color: "bg-red-300",
                  label: "Verimsiz",
                  desc: "Dusuk Hacim, Yavas",
                },
              ].map((q) => (
                <div key={q.label} className="flex items-center gap-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-sm ${q.color} opacity-40`}
                  />
                  <span className="text-[10px] font-medium text-neutral-600">
                    {q.label}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    ({q.desc})
                  </span>
                </div>
              ))}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                margin={{ top: 20, right: 30, bottom: 30, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

                {/* Quadrant backgrounds */}
                {/* Sol Ust — Yildizlar (Yuksek Hacim, Hizli) */}
                <ReferenceArea
                  x1={0}
                  x2={midX}
                  y1={midY}
                  y2={yMax}
                  fill="#10B981"
                  fillOpacity={0.06}
                  ifOverflow="extendDomain"
                />
                {/* Sag Ust — Darbogazlar (Yuksek Hacim, Yavas) */}
                <ReferenceArea
                  x1={midX}
                  x2={xMax}
                  y1={midY}
                  y2={yMax}
                  fill="#EF4444"
                  fillOpacity={0.06}
                  ifOverflow="extendDomain"
                />
                {/* Sol Alt — Potansiyel (Dusuk Hacim, Hizli) */}
                <ReferenceArea
                  x1={0}
                  x2={midX}
                  y1={0}
                  y2={midY}
                  fill="#10B981"
                  fillOpacity={0.03}
                  ifOverflow="extendDomain"
                />
                {/* Sag Alt — Verimsiz (Dusuk Hacim, Yavas) */}
                <ReferenceArea
                  x1={midX}
                  x2={xMax}
                  y1={0}
                  y2={midY}
                  fill="#EF4444"
                  fillOpacity={0.03}
                  ifOverflow="extendDomain"
                />

                <XAxis
                  type="number"
                  dataKey="avgDuration"
                  domain={[0, xMax]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v: number) => `${v}dk`}
                >
                  <Label
                    value="Ortalama Islem Suresi (Dk)"
                    position="bottom"
                    offset={10}
                    style={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="volume"
                  domain={[0, yMax]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v: number) => `₺${formatCompact(v)}`}
                >
                  <Label
                    value="Toplam Hacim (₺)"
                    angle={-90}
                    position="insideLeft"
                    offset={-5}
                    style={{ fontSize: 11, fill: "#94a3b8", textAnchor: "middle" }}
                  />
                </YAxis>
                <ZAxis
                  type="number"
                  dataKey="txCount"
                  range={[200, 1200]}
                  domain={[0, maxTxCount]}
                />

                <Tooltip
                  content={<MatrixTooltip />}
                  cursor={{ strokeDasharray: "3 3", stroke: "#CBD5E1" }}
                />

                <Scatter
                  data={scatterData}
                  fill="#1E5EFF"
                  fillOpacity={0.7}
                  stroke="#1E5EFF"
                  strokeWidth={1}
                />
              </ScatterChart>
            </ResponsiveContainer>

            {/* Summary strip */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 md:grid-cols-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                  Toplam Hacim
                </p>
                <p className="text-sm font-bold text-neutral-800">
                  ₺
                  {formatCurrency(
                    scatterData.reduce((s, d) => s + d.volume, 0),
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                  Ort. Sure
                </p>
                <p className="text-sm font-bold text-neutral-800">
                  {(
                    scatterData.reduce((s, d) => s + d.avgDuration, 0) /
                    scatterData.length
                  ).toFixed(1)}{" "}
                  dk
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                  Toplam Islem
                </p>
                <p className="text-sm font-bold text-neutral-800">
                  {formatCurrency(
                    scatterData.reduce((s, d) => s + d.txCount, 0),
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                  Yontem Sayisi
                </p>
                <p className="text-sm font-bold text-neutral-800">
                  {scatterData.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
