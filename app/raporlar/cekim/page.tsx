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
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  MessageSquareText,
  ShieldAlert,
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
  LabelList,
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
  if (avgDuration <= midX * 0.8) return { label: "Hizli", color: "text-emerald-700", bg: "bg-emerald-100" };
  if (avgDuration >= midX * 1.4) return { label: "Yavas", color: "text-red-700", bg: "bg-red-100" };
  return { label: "Normal", color: "text-amber-700", bg: "bg-amber-100" };
}

/* ═══════════════════════════════════════════════════════
   MOCK DATA — Bot rapor yapısının birebir karşılığı
   ═══════════════════════════════════════════════════════ */

// Bölüm 1: Genel Finansal Tablo
const MOCK_GENEL = {
  toplamBasariliCekim: 1670180,
  basariliIslemSayisi: 3100,
  toplamRedSayisi: 145,
  toplamRedHacmi: 287500,
  sistemGenelHizi: 6.3,
  periodBaslangic: "00:00",
  periodBitis: "17:00",
  degisim: { oncekiToplam: 1450000, fark: 220180 },
};

// Bölüm 2: Yöntem Yükü & Risk
const MOCK_YONTEM = [
  { name: "X HAVALE", volume: 977730, avgDuration: 2.5, txCount: 1500, yukYuzdesi: 58.5 },
  { name: "BIGPAYSS HAVALE", volume: 387818, avgDuration: 8.5, txCount: 800, yukYuzdesi: 23.2 },
  { name: "KRIPTOPAY", volume: 207632, avgDuration: 4.5, txCount: 600, yukYuzdesi: 12.4 },
  { name: "MASTER HAVALE", volume: 97000, avgDuration: 9.8, txCount: 200, yukYuzdesi: 5.8 },
];

// Bölüm 3: Personel Karnesi
const MOCK_PERSONEL = [
  { name: "Tolga", islemSayisi: 52, ortKararDk: 1.8, performans: "basarili" as const, emoji: "✅", totalVolume: 580000, hizDegisimi: "hizlandi" as const, oncekiDk: 2.3 },
  { name: "Mavi", islemSayisi: 45, ortKararDk: 3.2, performans: "basarili" as const, emoji: "✅", totalVolume: 450000, hizDegisimi: "ayni" as const, oncekiDk: 3.1 },
  { name: "Gunes", islemSayisi: 38, ortKararDk: 6.5, performans: "yeterli" as const, emoji: "⚠️", totalVolume: 320000, hizDegisimi: "dustu" as const, oncekiDk: 5.2 },
  { name: "Mira", islemSayisi: 28, ortKararDk: 9.2, performans: "hizlanmali" as const, emoji: "🔴", totalVolume: 190000, hizDegisimi: null, oncekiDk: null },
];

// Bölüm 4: Darboğaz
const MOCK_DARBOGAZ = [
  { miktar: 45000, odemeSistemi: "BIGPAYSS HAVALE", beklemeDk: 47, aciliyet: "kirmizi" as const, durum: "Karar Bekliyor" },
  { miktar: 32000, odemeSistemi: "MASTER HAVALE", beklemeDk: 35, aciliyet: "kirmizi" as const, durum: "Odeme Bekliyor" },
  { miktar: 18500, odemeSistemi: "KRIPTOPAY", beklemeDk: 22, aciliyet: "sari" as const, durum: "Odeme Bekliyor" },
  { miktar: 12000, odemeSistemi: "X HAVALE", beklemeDk: 8, aciliyet: "yesil" as const, durum: "Karar Bekliyor" },
];

// Bölüm 5: Red Analizi
const MOCK_RED = {
  toplamRed: 145,
  toplamRedHacmi: 287500,
  enSikNeden: "Yetersiz Bakiye",
  enSikNedenAdet: 67,
  nedenler: [
    { neden: "Yetersiz Bakiye", adet: 67 },
    { neden: "Zaman Asimi", adet: 34 },
    { neden: "Teknik Hata", adet: 22 },
    { neden: "Kullanici Iptali", adet: 15 },
    { neden: "Limit Asimi", adet: 7 },
  ],
};

// İdil'in AI Yorumları
const MOCK_IDIL = {
  yontem: "X HAVALE yuku %58'e ulasti, tek gateway'e bu kadar bagimlilik riskli. BIGPAYSS ve KRIPTOPAY'a yuk dagitimi yapilmali.",
  personel: "Tolga bugun yildiz performans sergiliyor, 1.8 dk ortalamayla en atik isimiz. Gunes biraz yavaslamisb onceki 5.2'den 6.5'e dustu — dikkat. Mira'nin 9.2 dk ortalamasi kabul edilemez, acil hizlanmali.",
  darbogaz: "BIGPAYSS HAVALE'de 47 dakikadir bekleyen ₺45.000'lik islem var. Bu gateway'de sistemsel bir sorun olabilir, teknik ekiple kontrol edilmeli.",
  red: "Retlerin %46'si Yetersiz Bakiye kaynakli. Musterilere islem oncesi bakiye kontrolu hatirlatmasi yapilmali. Zaman Asimi retleri de %23 ile yuksek — gateway timeout sureleri gozden gecirilmeli.",
};

/* ═══════════════════════════════════════════════════════
   LEAGUE TABLE COLORS
   ═══════════════════════════════════════════════════════ */
const LEAGUE_COLORS = [
  { bg: "bg-amber-50/80", text: "text-amber-700", badge: "bg-gradient-to-br from-amber-400 to-amber-600" },
  { bg: "bg-slate-50/80", text: "text-slate-600", badge: "bg-gradient-to-br from-slate-300 to-slate-500" },
  { bg: "bg-orange-50/80", text: "text-orange-700", badge: "bg-gradient-to-br from-orange-300 to-orange-500" },
];

const ACILIYET_MAP = {
  kirmizi: { dot: "bg-red-500", bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
  sari: { dot: "bg-amber-500", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  yesil: { dot: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
};

const PERF_MAP = {
  basarili: { label: "Basarili", color: "text-emerald-400", bg: "bg-emerald-400/15" },
  yeterli: { label: "Yeterli", color: "text-amber-400", bg: "bg-amber-400/15" },
  hizlanmali: { label: "Hizlanmali", color: "text-red-400", bg: "bg-red-400/15" },
};

/* ═══════════════════════════════════════════════════════
   İDİL YORUM KUTULARI
   ═══════════════════════════════════════════════════════ */
function IdilNoteLight({ text, title = "Idil'in Notu" }: { text: string; title?: string }) {
  return (
    <div className="mt-8 flex gap-0 overflow-hidden rounded-2xl border border-blue-200/60 bg-blue-50/50">
      <div className="w-1.5 flex-shrink-0 bg-blue-400" />
      <div className="px-5 py-4">
        <div className="mb-2 flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-blue-500" strokeWidth={1.5} />
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600">{title}</span>
        </div>
        <p className="text-[13px] italic leading-relaxed text-neutral-600">{text}</p>
      </div>
    </div>
  );
}

function IdilNoteDark({ text, title = "Idil'in Notu" }: { text: string; title?: string }) {
  return (
    <div className="mt-8 flex gap-0 overflow-hidden rounded-2xl border border-cyan-500/20 bg-white/[0.03]">
      <div className="w-1.5 flex-shrink-0 bg-cyan-400" />
      <div className="px-5 py-4">
        <div className="mb-2 flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-400">{title}</span>
        </div>
        <p className="text-[13px] italic leading-relaxed text-slate-300">{text}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TOOLTIPS
   ═══════════════════════════════════════════════════════ */
interface ScatterPayload { name: string; volume: number; avgDuration: number; txCount: number; }

function MatrixTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterPayload }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
      <p className="mb-2 text-xs font-bold text-white">{d.name}</p>
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-slate-400">Hacim <span className="font-semibold text-cyan-400">₺{formatCurrency(d.volume)}</span></span>
        <span className="text-[11px] text-slate-400">Ort. Sure <span className="font-semibold text-white">{d.avgDuration} dk</span></span>
        <span className="text-[11px] text-slate-400">Islem <span className="font-semibold text-white">{d.txCount}</span></span>
      </div>
    </div>
  );
}

interface RedPayload { neden: string; adet: number; }

function RedTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: RedPayload }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
      <p className="mb-1 text-xs font-bold text-white">{d.neden}</p>
      <span className="text-[11px] text-slate-400">Adet <span className="font-bold text-red-400">{d.adet}</span></span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function CekimRaporuPage() {
  const { role } = useStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  /* ── derived ── */
  const scatterData = MOCK_YONTEM;
  const totalVolume = MOCK_GENEL.toplamBasariliCekim;
  const avgDuration = MOCK_GENEL.sistemGenelHizi;
  const totalTx = MOCK_GENEL.basariliIslemSayisi;

  const maxVolume = useMemo(() => Math.max(...scatterData.map((d) => d.volume)), [scatterData]);
  const maxDuration = useMemo(() => Math.max(...scatterData.map((d) => d.avgDuration)), [scatterData]);
  const maxTxCount = useMemo(() => Math.max(...scatterData.map((d) => d.txCount)), [scatterData]);

  const midX = maxDuration / 2;
  const midY = maxVolume / 2;
  const xMax = maxDuration * 1.15;
  const yMax = maxVolume * 1.15;

  const leagueSorted = useMemo(() => [...scatterData].sort((a, b) => b.volume - a.volume), [scatterData]);
  const leagueMax = leagueSorted.length > 0 ? leagueSorted[0].volume : 1;

  const personelSorted = useMemo(() => [...MOCK_PERSONEL].sort((a, b) => b.totalVolume - a.totalVolume), []);
  const personelMaxVolume = useMemo(() => Math.max(...MOCK_PERSONEL.map((p) => p.totalVolume)), []);
  const personelMaxCount = useMemo(() => Math.max(...MOCK_PERSONEL.map((p) => p.islemSayisi)), []);

  const redMaxAdet = useMemo(() => Math.max(...MOCK_RED.nedenler.map((n) => n.adet)), []);

  if (!hydrated) return <div className="min-h-screen bg-neutral-950" />;

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

      {/* ━━━ STICKY NAV ━━━ */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/raporlar" className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /><span>Raporlar</span>
          </Link>
          <h1 className="text-sm font-semibold tracking-wide text-white/90">Cekim Performansi</h1>
          <span className="text-[10px] text-neutral-600">{MOCK_GENEL.periodBaslangic} – {MOCK_GENEL.periodBitis}</span>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — HERO KPI (Dark) — 6 KPI
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-neutral-950 pb-16 pt-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/[0.04] blur-[120px]" />
          <div className="absolute right-1/4 top-10 h-[400px] w-[400px] rounded-full bg-blue-500/[0.03] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Genel Finansal Tablo</p>
            <h2 className="text-2xl font-bold text-white md:text-3xl">Gunun Cekim Performansi</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-3">
            {/* KPI 1 — Toplam Hacim */}
            <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-cyan-500/20 hover:bg-white/[0.04]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/[0.05] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10">
                  <DollarSign className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
                </div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">Toplam Basarili Cekim</p>
                <p className="font-mono text-2xl font-black tracking-tight text-white md:text-3xl">₺{formatCompact(totalVolume)}</p>
                <p className="mt-1.5 text-xs text-neutral-400">{formatCurrency(totalVolume)} TL · {MOCK_GENEL.basariliIslemSayisi} islem</p>
              </div>
            </div>

            {/* KPI 2 — Ort. Sure */}
            <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-blue-500/20 hover:bg-white/[0.04]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/[0.05] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                  <Clock className="h-4 w-4 text-blue-400" strokeWidth={1.5} />
                </div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">Ortalama Islem Suresi</p>
                <p className="font-mono text-2xl font-black tracking-tight text-white md:text-3xl">{avgDuration.toFixed(1)}<span className="ml-1 text-base font-semibold text-neutral-400">dk</span></p>
                <p className="mt-1.5 text-xs text-neutral-400">{scatterData.length} yontem ortalamasi</p>
              </div>
            </div>

            {/* KPI 3 — Islem Adedi */}
            <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-emerald-500/20 hover:bg-white/[0.04]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/[0.05] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Hash className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
                </div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">Toplam Islem Adedi</p>
                <p className="font-mono text-2xl font-black tracking-tight text-white md:text-3xl">{formatCurrency(totalTx)}</p>
                <p className="mt-1.5 text-xs text-neutral-400">Tum yontemler toplami</p>
              </div>
            </div>

            {/* KPI 4 — Aktif Yontem */}
            <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-violet-500/20 hover:bg-white/[0.04]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/[0.05] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                  <BarChart3 className="h-4 w-4 text-violet-400" strokeWidth={1.5} />
                </div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">Aktif Yontem Sayisi</p>
                <p className="font-mono text-2xl font-black tracking-tight text-white md:text-3xl">{scatterData.length}</p>
                <p className="mt-1.5 text-xs text-neutral-400">Aktif cekim kanali</p>
              </div>
            </div>

            {/* KPI 5 — Red Hacmi */}
            <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-red-500/20 hover:bg-white/[0.04]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/[0.05] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
                  <XCircle className="h-4 w-4 text-red-400" strokeWidth={1.5} />
                </div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">Red Hacmi</p>
                <p className="font-mono text-2xl font-black tracking-tight text-red-400 md:text-3xl">₺{formatCompact(MOCK_GENEL.toplamRedHacmi)}</p>
                <p className="mt-1.5 text-xs text-neutral-400">{MOCK_GENEL.toplamRedSayisi} reddedilen islem</p>
              </div>
            </div>

            {/* KPI 6 — Degisim */}
            <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-emerald-500/20 hover:bg-white/[0.04]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/[0.05] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
                </div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">Onceki Periyottan Degisim</p>
                <p className="font-mono text-2xl font-black tracking-tight text-emerald-400 md:text-3xl">+₺{formatCompact(MOCK_GENEL.degisim.fark)}</p>
                <p className="mt-1.5 text-xs text-neutral-400">Onceki: ₺{formatCurrency(MOCK_GENEL.degisim.oncekiToplam)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — YONTEM SIRALAMASI (Light) + İdil Notu
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-neutral-50 py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5">
              <Trophy className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-700">Yontem Yuku & Risk</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-neutral-900 md:text-2xl">Cekim Yontemleri Siralaması</h2>
            <p className="text-sm text-neutral-500">Yontemler toplam cekim hacmine gore siralanmistir</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
            {leagueSorted.map((item, index) => {
              const pct = (item.volume / leagueMax) * 100;
              const speed = getSpeedLabel(item.avgDuration, midX);
              const ls = index < 3 ? LEAGUE_COLORS[index] : { bg: "bg-white", text: "text-neutral-600", badge: "bg-neutral-300" };

              return (
                <div key={item.name} className={`group flex items-center gap-3 border-b border-neutral-100 px-5 py-3.5 transition-all last:border-0 md:gap-4 md:px-6 md:py-4 ${index < 3 ? `${ls.bg} hover:brightness-[0.98]` : "hover:bg-neutral-50"}`}>
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${ls.badge}`}>{index + 1}</div>
                  <div className="w-5 flex-shrink-0">
                    {index === 0 && <Medal className="h-4 w-4 text-amber-500" strokeWidth={2} />}
                    {index === 1 && <Medal className="h-4 w-4 text-neutral-400" strokeWidth={2} />}
                    {index === 2 && <Medal className="h-4 w-4 text-orange-400" strokeWidth={2} />}
                  </div>
                  <span className={`w-36 flex-shrink-0 text-xs font-bold ${index < 3 ? ls.text : "text-neutral-700"}`}>{item.name}</span>

                  <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: item.avgDuration <= midX ? "linear-gradient(90deg, #10B981, #34D399)" : item.avgDuration >= midX * 1.4 ? "linear-gradient(90deg, #EF4444, #F87171)" : "linear-gradient(90deg, #F59E0B, #FBBF24)" }} />
                  </div>

                  <span className="w-24 text-right font-mono text-xs font-bold tabular-nums text-neutral-800">₺{formatCurrency(item.volume)}</span>

                  {/* Yuk yuzdesi badge */}
                  <span className="hidden w-14 flex-shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-center text-[10px] font-bold text-neutral-600 md:inline-block">
                    %{item.yukYuzdesi}
                  </span>

                  <div className="hidden flex-shrink-0 items-center gap-2 md:flex">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${speed.bg} ${speed.color}`}>{speed.label}</span>
                    <span className="text-[11px] font-medium text-neutral-600">{item.avgDuration}dk</span>
                    <span className="text-[11px] text-neutral-300">·</span>
                    <span className="text-[11px] font-medium text-neutral-600">{item.txCount} islem</span>
                  </div>

                  <div className="w-5 flex-shrink-0">
                    {item.avgDuration <= midX ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" strokeWidth={2} />}
                  </div>
                </div>
              );
            })}
          </div>

          <IdilNoteLight text={MOCK_IDIL.yontem} />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3 — HIZ-HACIM MATRISI (Dark)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-slate-900 py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.06] blur-[150px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.05] px-4 py-1.5">
              <Activity className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-300">Matris</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-white md:text-2xl">Yontem Hiz-Hacim Matrisi</h2>
            <p className="text-sm text-slate-400">Kabarcik boyutu islem adedini, konum ise hiz ve hacim iliskisini gosterir</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-slate-800/60 p-4 md:p-6">
            <div className="mb-5 flex flex-wrap justify-center gap-4">
              {[
                { color: "bg-emerald-400", label: "Yildizlar", desc: "Yuksek Hacim, Hizli" },
                { color: "bg-red-400", label: "Darbogazlar", desc: "Yuksek Hacim, Yavas" },
                { color: "bg-emerald-300", label: "Potansiyel", desc: "Dusuk Hacim, Hizli" },
                { color: "bg-red-300", label: "Verimsiz", desc: "Dusuk Hacim, Yavas" },
              ].map((q) => (
                <div key={q.label} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-sm ${q.color} opacity-70`} />
                  <span className="text-[11px] font-semibold text-slate-200">{q.label}</span>
                  <span className="text-[10px] text-slate-400">({q.desc})</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={440}>
              <ScatterChart margin={{ top: 30, right: 40, bottom: 35, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)" />
                <ReferenceArea x1={0} x2={midX} y1={midY} y2={yMax} fill="#10B981" fillOpacity={0.10} ifOverflow="extendDomain" />
                <ReferenceArea x1={midX} x2={xMax} y1={midY} y2={yMax} fill="#EF4444" fillOpacity={0.10} ifOverflow="extendDomain" />
                <ReferenceArea x1={0} x2={midX} y1={0} y2={midY} fill="#10B981" fillOpacity={0.05} ifOverflow="extendDomain" />
                <ReferenceArea x1={midX} x2={xMax} y1={0} y2={midY} fill="#EF4444" fillOpacity={0.05} ifOverflow="extendDomain" />
                <XAxis type="number" dataKey="avgDuration" domain={[0, xMax]} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} tickFormatter={(v: number) => `${v} dk`} stroke="rgba(255,255,255,0.12)">
                  <Label value="Ortalama Islem Suresi (Dk)" position="bottom" offset={12} style={{ fontSize: 12, fill: "#CBD5E1", fontWeight: 600 }} />
                </XAxis>
                <YAxis type="number" dataKey="volume" domain={[0, yMax]} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} tickFormatter={(v: number) => `₺${formatCompact(v)}`} stroke="rgba(255,255,255,0.12)">
                  <Label value="Toplam Hacim (₺)" angle={-90} position="insideLeft" offset={-10} style={{ fontSize: 12, fill: "#CBD5E1", fontWeight: 600, textAnchor: "middle" }} />
                </YAxis>
                <ZAxis type="number" dataKey="txCount" range={[400, 1600]} domain={[0, maxTxCount]} />
                <Tooltip content={<MatrixTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.15)" }} />
                <Scatter data={scatterData} fill="#38BDF8" fillOpacity={0.9} stroke="#FFFFFF" strokeWidth={2}>
                  <LabelList dataKey="name" position="top" fill="#F1F5F9" fontSize={12} fontWeight={700} offset={16} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            {/* Method detail cards */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-6 md:grid-cols-4">
              {scatterData.map((d) => {
                const sd = d.avgDuration <= midX * 0.8 ? { l: "Hizli", c: "text-emerald-400", b: "bg-emerald-400/15" } : d.avgDuration >= midX * 1.4 ? { l: "Yavas", c: "text-red-400", b: "bg-red-400/15" } : { l: "Normal", c: "text-amber-400", b: "bg-amber-400/15" };
                return (
                  <div key={d.name} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <p className="mb-2 text-xs font-bold text-white">{d.name}</p>
                    <p className="mb-2 font-mono text-lg font-black text-cyan-400">₺{formatCompact(d.volume)} <span className="text-[10px] font-medium text-slate-400">(%{d.yukYuzdesi})</span></p>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between"><span className="text-[11px] text-slate-400">Sure</span><span className="text-[11px] font-bold text-white">{d.avgDuration} dk</span></div>
                      <div className="flex justify-between"><span className="text-[11px] text-slate-400">Islem</span><span className="text-[11px] font-bold text-white">{formatCurrency(d.txCount)}</span></div>
                    </div>
                    <div className="mt-2 flex justify-end"><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${sd.b} ${sd.c}`}>{sd.l}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — PERSONEL KARNESİ (Light)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-neutral-50 py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-1.5">
              <Users className="h-4 w-4 text-violet-500" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-violet-700">Personel Karnesi</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-neutral-900 md:text-2xl">Islem Suresi Performansi</h2>
            <p className="text-sm text-neutral-500">{"<"}5dk = Basarili · 5-8dk = Yeterli · {">"}8dk = Hizlanmali</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {personelSorted.map((p, i) => {
              const perf = PERF_MAP[p.performans];
              const volumePct = (p.totalVolume / personelMaxVolume) * 100;
              const countPct = (p.islemSayisi / personelMaxCount) * 100;
              const isTopVolume = i === 0;
              const isTopSpeed = p.ortKararDk === Math.min(...MOCK_PERSONEL.map((x) => x.ortKararDk));
              const isMostTx = p.islemSayisi === Math.max(...MOCK_PERSONEL.map((x) => x.islemSayisi));

              return (
                <div key={p.name} className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  {/* Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-blue-100 text-sm font-bold text-violet-700">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">{p.name}</p>
                        <div className="flex gap-1">
                          {isTopSpeed && <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-cyan-700">En Atik</span>}
                          {isMostTx && <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-violet-700">En Yogun</span>}
                        </div>
                      </div>
                    </div>
                    <span className="text-lg">{p.emoji}</span>
                  </div>

                  {/* Performans badge */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${perf.bg.replace("/15", "").replace("text-", "bg-").replace("bg-bg-", "bg-")} ${perf.color.replace("text-", "bg-").replace("bg-bg-", "bg-")}`}
                      style={{ backgroundColor: p.performans === "basarili" ? "#D1FAE5" : p.performans === "yeterli" ? "#FEF3C7" : "#FEE2E2", color: p.performans === "basarili" ? "#065F46" : p.performans === "yeterli" ? "#92400E" : "#991B1B" }}>
                      {perf.label}
                    </span>
                  </div>

                  {/* Ort karar suresi - buyuk */}
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Ort. Karar Suresi</p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-2xl font-black text-neutral-900">{p.ortKararDk}</span>
                      <span className="text-sm font-medium text-neutral-400">dk</span>
                    </div>
                    {/* Hiz degisimi */}
                    {p.hizDegisimi && p.oncekiDk !== null && (
                      <div className="mt-1 flex items-center gap-1.5">
                        {p.hizDegisimi === "hizlandi" && <><ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} /><span className="text-[10px] font-semibold text-emerald-600">Hizlandi (onceki: {p.oncekiDk}dk)</span></>}
                        {p.hizDegisimi === "dustu" && <><ArrowUpRight className="h-3.5 w-3.5 text-red-500" strokeWidth={2} /><span className="text-[10px] font-semibold text-red-600">Yavasladi (onceki: {p.oncekiDk}dk)</span></>}
                        {p.hizDegisimi === "ayni" && <><Minus className="h-3.5 w-3.5 text-neutral-400" strokeWidth={2} /><span className="text-[10px] font-semibold text-neutral-500">Ayni (onceki: {p.oncekiDk}dk)</span></>}
                      </div>
                    )}
                    {!p.hizDegisimi && <p className="mt-1 text-[10px] text-neutral-400">Yeni personel — onceki veri yok</p>}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Islem</p>
                      <p className="font-mono text-base font-bold text-neutral-800">{p.islemSayisi}<span className="ml-0.5 text-[10px] text-neutral-400"> adet</span></p>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${countPct}%` }} /></div>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Hacim</p>
                      <p className="font-mono text-base font-bold text-neutral-800">₺{formatCompact(p.totalVolume)}</p>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${volumePct}%` }} /></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <IdilNoteLight text={MOCK_IDIL.personel} />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 5 — DARBOĞAZ (Dark)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-neutral-950 py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-1/3 top-0 h-[400px] w-[400px] rounded-full bg-amber-500/[0.03] blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.05] px-4 py-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-400">Darbogaz</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-white md:text-2xl">Top {MOCK_DARBOGAZ.length} Bekleyen Islem</h2>
            <p className="text-sm text-slate-400">Uzun suredir bekleyen islemler — acil mudahale gerekebilir</p>
          </div>

          <div className="flex flex-col gap-3">
            {MOCK_DARBOGAZ.map((item, i) => {
              const a = ACILIYET_MAP[item.aciliyet];
              return (
                <div key={i} className={`flex items-center gap-4 rounded-2xl border p-4 transition-all md:p-5 ${
                  item.aciliyet === "kirmizi" ? "border-red-500/20 bg-red-500/[0.04]" : item.aciliyet === "sari" ? "border-amber-500/15 bg-amber-500/[0.03]" : "border-white/[0.06] bg-white/[0.02]"
                }`}>
                  {/* Aciliyet dot */}
                  <div className={`h-3 w-3 flex-shrink-0 rounded-full ${a.dot} ${item.aciliyet === "kirmizi" ? "animate-pulse" : ""}`} />

                  {/* Bekleme suresi - buyuk */}
                  <div className="w-16 flex-shrink-0 text-center">
                    <p className={`font-mono text-2xl font-black ${item.aciliyet === "kirmizi" ? "text-red-400" : item.aciliyet === "sari" ? "text-amber-400" : "text-white"}`}>{item.beklemeDk}</p>
                    <p className="text-[9px] font-semibold uppercase text-slate-500">dakika</p>
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">₺{formatCurrency(item.miktar)}</p>
                    <p className="text-xs text-slate-400">{item.odemeSistemi}</p>
                  </div>

                  {/* Durum */}
                  <span className={`flex-shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                    item.durum === "Karar Bekliyor" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"
                  }`}>
                    {item.durum}
                  </span>
                </div>
              );
            })}
          </div>

          <IdilNoteDark text={MOCK_IDIL.darbogaz} />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 6 — RED ANALİZİ (Light)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5">
              <ShieldAlert className="h-4 w-4 text-red-500" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-red-700">Red Analizi</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-neutral-900 md:text-2xl">Red Analizi & Strateji</h2>
            <p className="text-sm text-neutral-500">Reddedilen islemlerin analizi ve onleme stratejisi</p>
          </div>

          {/* Red KPIs */}
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-red-200/60 bg-red-50/50 p-5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">Toplam Red</p>
              <p className="font-mono text-3xl font-black text-red-600">{MOCK_RED.toplamRed}</p>
              <p className="mt-1 text-xs text-red-400">reddedilen islem</p>
            </div>
            <div className="rounded-2xl border border-red-200/60 bg-red-50/50 p-5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">Red Hacmi</p>
              <p className="font-mono text-3xl font-black text-red-600">₺{formatCompact(MOCK_RED.toplamRedHacmi)}</p>
              <p className="mt-1 text-xs text-red-400">{formatCurrency(MOCK_RED.toplamRedHacmi)} TL</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-5 md:col-span-1">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-500">En Sik Neden</p>
              <p className="text-lg font-black text-amber-700">{MOCK_RED.enSikNeden}</p>
              <p className="mt-1 text-xs text-amber-500">{MOCK_RED.enSikNedenAdet} islem (%{((MOCK_RED.enSikNedenAdet / MOCK_RED.toplamRed) * 100).toFixed(0)})</p>
            </div>
          </div>

          {/* Red nedenleri bar chart */}
          <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50 p-5 md:p-6">
            <h3 className="mb-4 text-center text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Red Nedenleri Dagilimi</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={MOCK_RED.nedenler} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 500 }} stroke="#E5E7EB" />
                <YAxis type="category" dataKey="neden" tick={{ fontSize: 11, fill: "#374151", fontWeight: 600 }} width={120} stroke="#E5E7EB" />
                <Tooltip content={<RedTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="adet" radius={[0, 6, 6, 0]} name="Adet">
                  {MOCK_RED.nedenler.map((entry, i) => (
                    <Cell key={i} fill={i === 0 ? "#EF4444" : i === 1 ? "#F97316" : "#94A3B8"} />
                  ))}
                  <LabelList dataKey="adet" position="right" fill="#374151" fontSize={12} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <IdilNoteLight text={MOCK_IDIL.red} title="Idil'in Onerisi" />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 7 — YONTEM OZET KARTLARI (Dark)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-neutral-950 py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.05] px-4 py-1.5">
              <Zap className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-300">Ozet</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-white md:text-2xl">Yontem Bazinda Ozet</h2>
            <p className="text-sm text-slate-400">Her cekim yonteminin performans ozetini bir bakista gorun</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {leagueSorted.map((item, index) => {
              const speed = getSpeedLabel(item.avgDuration, midX);
              const sdDark = item.avgDuration <= midX * 0.8 ? { l: "Hizli", c: "text-emerald-400", b: "bg-emerald-400/15" } : item.avgDuration >= midX * 1.4 ? { l: "Yavas", c: "text-red-400", b: "bg-red-400/15" } : { l: "Normal", c: "text-amber-400", b: "bg-amber-400/15" };
              return (
                <div key={item.name} className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.04]">
                  <div className="absolute right-4 top-4 font-mono text-5xl font-black text-white/[0.04] transition-colors group-hover:text-white/[0.08]">{index + 1}</div>
                  <div className="relative">
                    <p className="mb-4 text-xs font-bold text-white">{item.name}</p>
                    <p className="mb-1 font-mono text-2xl font-black tracking-tight text-white">₺{formatCompact(item.volume)}</p>
                    <p className="mb-3 text-[11px] text-slate-400">{formatCurrency(item.volume)} TL · %{item.yukYuzdesi} yuk</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${sdDark.b} ${sdDark.c}`}>{sdDark.l}</span>
                      <span className="text-[10px] text-slate-400">{item.avgDuration} dk</span>
                    </div>
                    <div className="mt-4 flex items-center gap-1 border-t border-white/[0.06] pt-3">
                      <Hash className="h-3 w-3 text-slate-500" strokeWidth={1.5} />
                      <span className="text-[11px] font-medium text-slate-400">{formatCurrency(item.txCount)} islem</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-8 bg-neutral-950" />
    </div>
  );
}
