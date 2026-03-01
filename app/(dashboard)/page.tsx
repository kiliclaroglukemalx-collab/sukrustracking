"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Trophy,
  FileText,
  BarChart2,
  TrendingUp,
  Gift,
  Users,
  ChevronRight,
  Lock,
} from "lucide-react";
import { useStore } from "@/lib/store";

const REPORT_CARDS = [
  {
    href: "/raporlar/yatirim-performans",
    icon: TrendingUp,
    title: "Yatirim Performansi",
    summary: "Gunluk yatirim ozeti, haftalik karsilastirma ve performans degisimi.",
    color: "violet",
  },
  {
    href: "/raporlar/performans",
    icon: Trophy,
    title: "Dis Finans Cekim Performansi",
    summary: "Yontemler cekim miktarina gore lig tablosu. En cok cekim alan yontemler.",
    color: "amber",
  },
  {
    href: "/raporlar/cekim",
    icon: FileText,
    title: "Cekim Performans Raporu",
    summary: "Hiz-hacim matrisi, personel performansi ve dar bogaz analizi.",
    color: "cyan",
  },
  {
    href: "/raporlar/analiz",
    icon: BarChart2,
    title: "Gunun Finansal Analizi",
    summary: "Yatirim/cekim oranlari, komisyon dagilimi ve yonetici ozeti.",
    color: "emerald",
  },
  {
    href: "/raporlar/bonus",
    icon: Gift,
    title: "Bonus Raporu",
    summary: "Personel bonus skorlari ve yontem bazli net kar analizi.",
    color: "orange",
  },
  {
    href: "/raporlar/yeni-oyuncular",
    icon: Users,
    title: "Yeni Oyuncular",
    summary: "Tablo yapistir, BTag kirilimi, cohort analizi ve aksiyon onerileri.",
    color: "rose",
  },
];

const COLOR_STYLES: Record<string, { border: string; borderL: string; gradient: string; shadow: string; glow: string }> = {
  violet: {
    border: "border-violet-500",
    borderL: "border-l-violet-500",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    shadow: "hover:shadow-violet-500/50",
    glow: "shadow-violet-400/30",
  },
  amber: {
    border: "border-amber-500",
    borderL: "border-l-amber-500",
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
    shadow: "hover:shadow-amber-500/50",
    glow: "shadow-amber-400/30",
  },
  cyan: {
    border: "border-cyan-500",
    borderL: "border-l-cyan-500",
    gradient: "from-cyan-500 via-teal-500 to-emerald-500",
    shadow: "hover:shadow-cyan-500/50",
    glow: "shadow-cyan-400/30",
  },
  emerald: {
    border: "border-emerald-500",
    borderL: "border-l-emerald-500",
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    shadow: "hover:shadow-emerald-500/50",
    glow: "shadow-emerald-400/30",
  },
  orange: {
    border: "border-orange-500",
    borderL: "border-l-orange-500",
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    shadow: "hover:shadow-orange-500/50",
    glow: "shadow-orange-400/30",
  },
  rose: {
    border: "border-rose-500",
    borderL: "border-l-rose-500",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    shadow: "hover:shadow-rose-500/50",
    glow: "shadow-rose-400/30",
  },
};

type CekimData = {
  genel?: { toplamBasariliCekim?: number; basariliIslemSayisi?: number };
  yontemler?: unknown[];
  personel?: unknown[];
} | null;

function getCardOzet(href: string, cekim: CekimData): string[] {
  const g = cekim?.genel;
  switch (href) {
    case "/raporlar/yatirim-performans":
      return ["Rapor sayfasindan veri yukleyin"];
    case "/raporlar/performans":
      return ["Rapor sayfasindan veri yukleyin"];
    case "/raporlar/cekim":
      return g?.toplamBasariliCekim != null
        ? [
            `Cekim: ₺${fmtCompact(g.toplamBasariliCekim)}`,
            `${g.basariliIslemSayisi ?? 0} islem`,
            `${cekim?.yontemler?.length ?? 0} yontem, ${cekim?.personel?.length ?? 0} personel`,
          ]
        : ["Bot verisi bekleniyor"];
    case "/raporlar/analiz":
      return ["Rapor sayfasindan veri yukleyin"];
    case "/raporlar/bonus":
      return cekim?.personel?.length
        ? [
            `${cekim.personel.length} personel`,
            `Cekim + Excel analizi`,
          ]
        : ["Cekim + Excel yukleyin"];
    case "/raporlar/yeni-oyuncular":
      return ["Tablo yapistir", "BTag, cohort analizi"];
    default:
      return [];
  }
}

function fmt(v: number): string {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return fmt(v);
}

function ScrollRevealCard({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={visible ? { transitionDelay: `${index * 60}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const { role } = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [cekimData, setCekimData] = useState<CekimData>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    fetch("/api/cekim-raporu")
      .then((r) => r.json())
      .then((j) => { if (j.data) setCekimData(j.data); })
      .catch(() => {});
  }, []);

  if (!hydrated) {
    return <div className="min-h-screen bg-black" />;
  }

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
      {/* Kartlar - beyaz arka plan, scroll ile gorunur */}
      <div className="mx-auto max-w-5xl bg-white px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_CARDS.map((card, idx) => {
            const Icon = card.icon;
            const style = COLOR_STYLES[card.color] || COLOR_STYLES.violet;
            const ozetVeri = getCardOzet(card.href, cekimData);
            return (
              <ScrollRevealCard key={card.href} index={idx}>
                <Link
                  href={card.href}
                  className={`group relative overflow-hidden rounded-xl border-2 ${style.border} bg-white p-4 shadow-lg ${style.glow} transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ${style.shadow}`}
                >
                {/* Gradient accent - canli */}
                <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${style.gradient} opacity-25 blur-2xl transition-all duration-300 group-hover:opacity-40 group-hover:scale-110`} />
                <div className="relative">
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${style.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="h-4 w-4 text-white" strokeWidth={2} />
                    </div>
                    <ChevronRight className="h-4 w-4 text-neutral-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-neutral-600" strokeWidth={2} />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-neutral-900">
                    {card.title}
                  </h3>
                  {/* Kart bazli ozet veri */}
                  <div className="space-y-1 rounded-lg bg-neutral-50 px-2.5 py-2">
                    {ozetVeri.map((line) => (
                      <p key={line} className="text-[10px] font-medium text-neutral-600">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </Link>
            </ScrollRevealCard>
            );
          })}
        </div>
      </div>

      {/* Alt bolum - siyah arka plan, her rapor icin ozet alani */}
      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_CARDS.map((card) => {
            const Icon = card.icon;
            const style = COLOR_STYLES[card.color] || COLOR_STYLES.violet;
            const ozetVeri = getCardOzet(card.href, cekimData);
            return (
              <Link
                key={card.href}
                href={card.href}
                className={`group flex flex-col gap-2 rounded-lg border border-white/10 border-l-4 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10 ${style.borderL}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br ${style.gradient}`}>
                    <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                  </div>
                  <h4 className="text-xs font-semibold text-white">{card.title}</h4>
                </div>
                <div className="space-y-0.5">
                  {ozetVeri.map((line) => (
                    <p key={line} className="text-[11px] text-neutral-300">
                      {line}
                    </p>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
