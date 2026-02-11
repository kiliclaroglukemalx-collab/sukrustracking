"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  Download,
  FileDown,
  BarChart2,
  Calendar,
  Clock,
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
import { StatusBadge } from "@/components/report/status-badge";
import { KpiCard } from "@/components/report/kpi-card";
import { ChartCard } from "@/components/report/chart-card";
import { DataTable } from "@/components/report/data-table";
import { InsightList } from "@/components/report/insight-list";

/* ───────────────────────────── MOCK JSON ───────────────────────────── */
const MOCK_REPORT = {
  id: "rpt_20260212_001",
  title: "Gunluk Finansal Analiz Raporu",
  type: "daily_financial",
  status: "done" as const,
  created_at: "2026-02-12T14:30:00Z",

  ai_content: {
    executive_summary: {
      bullets: [
        "Gun genelinde toplam yatirim hacmi bir onceki gune gore %12 artis gosterdi.",
        "Net nakit akisi pozitif seyretti, cekim/yatirim orani %38 seviyesinde kaldi.",
        "Kripto ve Papara kanallari yatirim hacminde baskin konumda.",
        "Bonus dagitimi toplam yatirimin %4.2'si oraninda gerceklesti.",
        "En yuksek ROI gosteren oyuncu segmenti 5.000-20.000 TL yatirim araliginda.",
      ],
      paragraph:
        "12 Subat 2026 tarihli finansal performans genel olarak olumlu bir tablo ciziyor. Yatirim hacimleri mevsimsel ortalamarin uzerinde seyrederken, cekim talepleri kontrol altinda kalmaya devam ediyor. Kripto kanalindaki yuksek hacim, dijital odeme yontemlerinin artan populeritesini yansitmakta. Risk tarafinda, ust segmentteki 3 oyuncunun cekim yogunlugu izlenmeli.",
    },

    dashboard_metrics: {
      toplam_yatirim: 2_845_000,
      toplam_cekim: 1_082_100,
      net_nakit_akisi: 1_762_900,
      toplam_bahis: 4_120_000,
      net_kar: 1_480_500,
      bonus_etkisi: 119_490,
    },

    kpi_changes: {
      toplam_yatirim: 12.3,
      toplam_cekim: -4.7,
      net_nakit_akisi: 22.1,
      toplam_bahis: 8.5,
      net_kar: 15.8,
      bonus_etkisi: -2.1,
    },

    trends_timeline: [
      { saat: "00:00", yatirim: 85000, cekim: 42000 },
      { saat: "02:00", yatirim: 45000, cekim: 28000 },
      { saat: "04:00", yatirim: 32000, cekim: 18000 },
      { saat: "06:00", yatirim: 55000, cekim: 22000 },
      { saat: "08:00", yatirim: 120000, cekim: 45000 },
      { saat: "10:00", yatirim: 210000, cekim: 85000 },
      { saat: "12:00", yatirim: 345000, cekim: 120000 },
      { saat: "14:00", yatirim: 380000, cekim: 145000 },
      { saat: "16:00", yatirim: 420000, cekim: 160000 },
      { saat: "18:00", yatirim: 390000, cekim: 135000 },
      { saat: "20:00", yatirim: 450000, cekim: 170000 },
      { saat: "22:00", yatirim: 313000, cekim: 112100 },
    ],

    trends_segments: [
      { segment: "Kripto", netKar: 520000 },
      { segment: "Papara", netKar: 380000 },
      { segment: "Havale", netKar: 245000 },
      { segment: "Kredi Karti", netKar: 185000 },
      { segment: "Banka", netKar: 95000 },
      { segment: "Diger", netKar: 55500 },
    ],

    distribution_histogram: [
      { aralik: "0-1K", count: 320 },
      { aralik: "1K-5K", count: 185 },
      { aralik: "5K-20K", count: 92 },
      { aralik: "20K-50K", count: 38 },
      { aralik: "50K-100K", count: 12 },
      { aralik: "100K+", count: 4 },
    ],

    distribution_pie: [
      { name: "Kripto", value: 35 },
      { name: "Papara", value: 28 },
      { name: "Havale", value: 18 },
      { name: "Kredi Karti", value: 12 },
      { name: "Diger", value: 7 },
    ],

    distribution_comment:
      "Yatirim dagilimi kripto agirllikli bir profil ciziyor. Papara ikinci buyuk kanal olarak %28 pay aliyor. Havale kanali istikrarli seyretmeye devam ederken, kredi karti kullanimi dusuk kalmakta.",

    top20_profit: [
      { oyuncu: "USR-4821", yatirim: 185000, cekim: 42000, netKar: 143000, roi: 77.3 },
      { oyuncu: "USR-1093", yatirim: 142000, cekim: 38000, netKar: 104000, roi: 73.2 },
      { oyuncu: "USR-7744", yatirim: 128000, cekim: 45000, netKar: 83000, roi: 64.8 },
      { oyuncu: "USR-3019", yatirim: 95000, cekim: 22000, netKar: 73000, roi: 76.8 },
      { oyuncu: "USR-5562", yatirim: 88000, cekim: 28000, netKar: 60000, roi: 68.2 },
      { oyuncu: "USR-8830", yatirim: 76000, cekim: 31000, netKar: 45000, roi: 59.2 },
      { oyuncu: "USR-2215", yatirim: 72000, cekim: 30000, netKar: 42000, roi: 58.3 },
      { oyuncu: "USR-6601", yatirim: 65000, cekim: 25000, netKar: 40000, roi: 61.5 },
      { oyuncu: "USR-9107", yatirim: 58000, cekim: 20000, netKar: 38000, roi: 65.5 },
      { oyuncu: "USR-4450", yatirim: 52000, cekim: 18000, netKar: 34000, roi: 65.4 },
    ],

    bottom20_profit: [
      { oyuncu: "USR-1188", yatirim: 12000, cekim: 85000, netKar: -73000, roi: -608.3 },
      { oyuncu: "USR-3340", yatirim: 8000, cekim: 62000, netKar: -54000, roi: -675.0 },
      { oyuncu: "USR-7721", yatirim: 15000, cekim: 58000, netKar: -43000, roi: -286.7 },
      { oyuncu: "USR-5509", yatirim: 5000, cekim: 42000, netKar: -37000, roi: -740.0 },
      { oyuncu: "USR-2283", yatirim: 10000, cekim: 45000, netKar: -35000, roi: -350.0 },
      { oyuncu: "USR-8894", yatirim: 18000, cekim: 48000, netKar: -30000, roi: -166.7 },
      { oyuncu: "USR-6612", yatirim: 7000, cekim: 35000, netKar: -28000, roi: -400.0 },
      { oyuncu: "USR-4477", yatirim: 22000, cekim: 48000, netKar: -26000, roi: -118.2 },
      { oyuncu: "USR-9935", yatirim: 9000, cekim: 32000, netKar: -23000, roi: -255.6 },
      { oyuncu: "USR-1100", yatirim: 14000, cekim: 35000, netKar: -21000, roi: -150.0 },
    ],

    top20_withdrawal: [
      { oyuncu: "USR-1188", cekim: 85000, yontem: "Kripto", islemSayisi: 12 },
      { oyuncu: "USR-3340", cekim: 62000, yontem: "Papara", islemSayisi: 8 },
      { oyuncu: "USR-7721", cekim: 58000, yontem: "Havale", islemSayisi: 15 },
      { oyuncu: "USR-8894", cekim: 48000, yontem: "Kripto", islemSayisi: 6 },
      { oyuncu: "USR-4477", cekim: 48000, yontem: "Papara", islemSayisi: 9 },
      { oyuncu: "USR-2283", cekim: 45000, yontem: "Kripto", islemSayisi: 5 },
      { oyuncu: "USR-7744", cekim: 45000, yontem: "Havale", islemSayisi: 7 },
      { oyuncu: "USR-5562", cekim: 42000, yontem: "Papara", islemSayisi: 4 },
      { oyuncu: "USR-5509", cekim: 42000, yontem: "Kripto", islemSayisi: 3 },
      { oyuncu: "USR-4821", cekim: 42000, yontem: "Havale", islemSayisi: 11 },
    ],

    insights: {
      risks: [
        "USR-1188 ve USR-3340 negatif ROI ile yuksek cekim gerceklestiriyor -- olasi bonus suistimali.",
        "Kripto kanalindaki cekim yogunlugu artiyor, likidite yonetimi icin ek onlem alinmali.",
        "Gece 00:00-04:00 saatlerinde cekim/yatirim orani %55'e cikiyor.",
        "Tek seferlik yuksek cekimler (50K+) son 7 gunde %18 artti.",
      ],
      actions: [
        "USR-1188, USR-3340, USR-5509 icin cekim limitlerini gecici olarak dusurmeyi degerlendirin.",
        "Kripto cekim islemlerine ek dogrulama adimi eklenebilir.",
        "Gece vardiyasinda manual onay esigini 30K'dan 20K'ya indirmeyi degerlendirin.",
        "Haftalik bonus dagitim politikasini gozden gecirin: mevcut oran %4.2 -- hedef %3.5 altinda olmali.",
        "Yuksek ROI segmenti (5K-20K) icin ozel kampanya planlayarak yatirim hacmini artirin.",
      ],
    },

    methodology:
      "Bu rapor, 12 Subat 2026 tarihine ait tum finansal islem verilerinin analiz edilmesiyle olusturulmustur. Yatirim ve cekim verileri odeme yontemi bazinda gruplandrilmis, oyuncu bazli net kar hesaplamasi yatirim - cekim formulu ile yapilmistir. ROI hesaplamasinda (cekim - yatirim) / yatirim * 100 formulu kullanilmistir. Bonus etkisi, dagitilan toplam bonus tutarinin toplam yatirim hacmine orani olarak hesaplanmistir. Tum tutarlar TRY cinsindendir.",
  },
};

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
  const [activeTab, setActiveTab] = useState<"top" | "bottom" | "withdrawal">("top");

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return <div className="min-h-screen" style={{ background: "#F6F8FB" }} />;

  if (role === "basic") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ background: "#F6F8FB" }}>
        <Lock className="mb-3 h-8 w-8 text-neutral-300" strokeWidth={1.5} />
        <p className="mb-1 text-sm font-medium text-neutral-600">Erisim Engellendi</p>
        <p className="mb-4 text-xs text-neutral-400">Bu sayfa sadece Master kullanicilar icindir</p>
        <Link href="/" className="text-xs text-neutral-500 underline hover:text-neutral-800">Kasaya Don</Link>
      </div>
    );
  }

  const r = MOCK_REPORT;
  const m = r.ai_content.dashboard_metrics;
  const c = r.ai_content.kpi_changes;
  const createdDate = new Date(r.created_at).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const createdTime = new Date(r.created_at).toLocaleTimeString("tr-TR", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="min-h-screen" style={{ background: "#F6F8FB" }}>
      {/* Sticky nav */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E6EAF0] bg-white/90 px-5 py-3 backdrop-blur-sm">
        <Link href="/raporlar" className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span>Raporlar</span>
        </Link>
        <h1 className="text-sm font-bold tracking-wide text-neutral-900">Finansal Analiz</h1>
        <div className="w-20" />
      </div>

      <div className="mx-auto max-w-[1120px] px-6 py-6">

        {/* ── 1. HEADER ── */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#E6EAF0] bg-white p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-neutral-900">{r.title}</h2>
              <span className="rounded-md bg-[#1E5EFF]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1E5EFF]">
                {r.type === "daily_financial" ? "Gunluk" : r.type}
              </span>
              <StatusBadge status={r.status} />
            </div>
            <div className="flex items-center gap-4 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" strokeWidth={1.5} />{createdDate}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" strokeWidth={1.5} />{createdTime}</span>
              <span className="font-mono text-[10px] text-neutral-300">{r.id}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled className="flex items-center gap-1.5 rounded-lg border border-[#E6EAF0] bg-white px-3 py-2 text-[11px] font-medium text-neutral-400 opacity-50">
              <FileDown className="h-3.5 w-3.5" strokeWidth={1.5} />
              Export PDF
            </button>
            <button type="button" disabled className="flex items-center gap-1.5 rounded-lg border border-[#E6EAF0] bg-white px-3 py-2 text-[11px] font-medium text-neutral-400 opacity-50">
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              JSON
            </button>
          </div>
        </div>

        {/* ── 2. EXECUTIVE SUMMARY ── */}
        <div className="mb-6 rounded-2xl border border-[#E6EAF0] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-[#1E5EFF]" strokeWidth={1.5} />
            <h3 className="text-sm font-bold text-neutral-900">Yonetici Ozeti</h3>
          </div>
          <ul className="mb-4 flex flex-col gap-2">
            {r.ai_content.executive_summary.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1E5EFF]" />
                <span className="text-[13px] leading-relaxed text-neutral-700">{b}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-[#F6F8FB] p-4">
            <p className="text-[12px] italic leading-relaxed text-neutral-500">
              {r.ai_content.executive_summary.paragraph}
            </p>
          </div>
        </div>

        {/* ── 3. KPI GRID ── */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Toplam Yatirim" value={m.toplam_yatirim} prefix="₺" change={c.toplam_yatirim} changeLabel="onceki gun" color="blue" />
          <KpiCard label="Toplam Cekim" value={m.toplam_cekim} prefix="₺" change={c.toplam_cekim} changeLabel="onceki gun" color="red" />
          <KpiCard label="Net Nakit Akisi" value={m.net_nakit_akisi} prefix="₺" change={c.net_nakit_akisi} changeLabel="onceki gun" color="green" />
          <KpiCard label="Toplam Bahis" value={m.toplam_bahis} prefix="₺" change={c.toplam_bahis} changeLabel="onceki gun" />
          <KpiCard label="Net Kar" value={m.net_kar} prefix="₺" change={c.net_kar} changeLabel="onceki gun" color="green" />
          <KpiCard label="Bonus Etkisi" value={m.bonus_etkisi} prefix="₺" change={c.bonus_etkisi} changeLabel="onceki gun" color="red" />
        </div>

        {/* ── 4. TRENDS ── */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Yatirim / Cekim Zaman Serisi" subtitle="Saat bazinda hacim (TRY)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={r.ai_content.trends_timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6EAF0" />
                <XAxis dataKey="saat" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`₺${new Intl.NumberFormat("tr-TR").format(v)}`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E6EAF0" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="yatirim" stroke="#1E5EFF" strokeWidth={2} dot={false} name="Yatirim" />
                <Line type="monotone" dataKey="cekim" stroke="#EF4444" strokeWidth={2} dot={false} name="Cekim" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Segment Bazinda Net Kar" subtitle="Odeme yontemi gruplarina gore">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={r.ai_content.trends_segments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6EAF0" />
                <XAxis dataKey="segment" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`₺${new Intl.NumberFormat("tr-TR").format(v)}`, "Net Kar"]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E6EAF0" }} />
                <Bar dataKey="netKar" fill="#1E5EFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── 5. DISTRIBUTION & CONCENTRATION ── */}
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <ChartCard title="Yatirim Dagilimi (Histogram)" subtitle="Oyuncu yatirim araliklari">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={r.ai_content.distribution_histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6EAF0" />
                <XAxis dataKey="aralik" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E6EAF0" }} />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} name="Oyuncu Sayisi" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Kanal Dagilimi" subtitle="Yatirim hacmi payi (%)">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={r.ai_content.distribution_pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} strokeWidth={0}>
                  {r.ai_content.distribution_pie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`%${v}`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E6EAF0" }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="flex flex-col justify-center rounded-2xl border border-[#E6EAF0] bg-white p-5">
            <h3 className="mb-3 text-xs font-bold text-neutral-800">Dagilim Yorumu</h3>
            <p className="text-[12px] leading-relaxed text-neutral-500">
              {r.ai_content.distribution_comment}
            </p>
          </div>
        </div>

        {/* ── 6. TABLES TABS ── */}
        <div className="mb-6">
          <div className="mb-4 flex gap-1 rounded-xl border border-[#E6EAF0] bg-white p-1">
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

          {activeTab === "top" && (
            <DataTable columns={playerColumns} rows={r.ai_content.top20_profit} caption="En Yuksek Net Kar - Oyuncu Bazli" />
          )}
          {activeTab === "bottom" && (
            <DataTable columns={playerColumns} rows={r.ai_content.bottom20_profit} caption="En Dusuk Net Kar - Oyuncu Bazli" />
          )}
          {activeTab === "withdrawal" && (
            <DataTable columns={withdrawalColumns} rows={r.ai_content.top20_withdrawal} caption="En Yuksek Cekim - Oyuncu Bazli" />
          )}
        </div>

        {/* ── 7. INSIGHTS & ACTIONS ── */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <InsightList title="Riskler" items={r.ai_content.insights.risks} type="risk" />
          <InsightList title="Onerilen Aksiyonlar" items={r.ai_content.insights.actions} type="action" />
        </div>

        {/* ── 8. METHODOLOGY ── */}
        <div className="mb-10 rounded-2xl border border-[#E6EAF0] bg-white p-5">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">Metodoloji / Veri Notlari</h3>
          <p className="text-[11px] leading-relaxed text-neutral-400">
            {r.ai_content.methodology}
          </p>
        </div>

      </div>
    </div>
  );
}
