"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  FileText,
  BarChart2,
  TrendingUp,
  Lock,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/lib/store";

export default function RaporlarPage() {
  const { role } = useStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

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

  const sections = [
    {
      href: "/yatirim-performans",
      icon: TrendingUp,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
      badgeBg: "bg-violet-50",
      badgeColor: "text-violet-600",
      badgeText: "Yeni",
      title: "Yatirim Performansi",
      description:
        "Yontem bazli gunluk yatirim ozeti ve haftalik kumulatif karsilastirma. Performans degisimini ok ve yuzde ile takip edin.",
      footnote: "Gunluk + Haftalik gorunum",
    },
    {
      href: "/raporlar/performans",
      icon: Trophy,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      badgeBg: "bg-amber-50",
      badgeColor: "text-amber-600",
      badgeText: "Aktif",
      title: "Dis Finans Cekim Performansi",
      description:
        "Yontemler aldiklari cekim miktarina gore siralanir. En cok cekim alan yontemler lig tablosu formatinda listelenir.",
      footnote: "Veriler anlik kasa durumunu yansitir",
    },
    {
      href: "/raporlar/cekim",
      icon: FileText,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      badgeBg: "bg-blue-50",
      badgeColor: "text-blue-600",
      badgeText: "Aktif",
      title: "Cekim Performans Raporu",
      description:
        "Yontem bazinda cekim performansini detayli analiz eder. Hiz-hacim matrisi ile yontemlerin verimliligi gorsellestirilir.",
      footnote: "Lig tablosu + Scatter plot matrisi",
    },
    {
      href: "/raporlar/analiz",
      icon: BarChart2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      badgeBg: "bg-emerald-50",
      badgeColor: "text-emerald-600",
      badgeText: "Aktif",
      title: "Gunun Finansal Analizi",
      description:
        "Gunluk finansal performansin kapsamli analizini uretir. Yatirim/cekim oranlari, komisyon dagilimi ve genel degerlendirme iceriri.",
      footnote: "",
    },
  ];

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
        {/* Section Header */}
        <div className="mb-6 flex items-center gap-2">
          <BarChart2
            className="h-5 w-5 text-neutral-400"
            strokeWidth={1.5}
          />
          <p className="text-xs text-neutral-400">
            Rapor modulleri icin asagidaki bolumleri kullanin
          </p>
        </div>

        {/* Cards */}
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <section className="mb-4 cursor-pointer">
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all hover:border-neutral-300 hover:shadow-md">
                  <div className="flex items-start gap-4 p-6">
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${section.iconBg}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${section.iconColor}`}
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 text-sm font-bold text-neutral-800">
                        {section.title}
                      </h3>
                      <p className="mb-4 text-xs leading-relaxed text-neutral-400">
                        {section.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-medium ${section.badgeBg} ${section.badgeColor}`}
                        >
                          {section.badgeText}
                        </span>
                        <span className="text-[10px] text-neutral-300">
                          {section.footnote}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className="mt-2 h-4 w-4 flex-shrink-0 text-neutral-300"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </section>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
