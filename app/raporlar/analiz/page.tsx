"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart2, Lock } from "lucide-react";
import { useStore } from "@/lib/store";

export default function AnalizPage() {
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

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Nav */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200 bg-white/90 px-5 py-3 backdrop-blur-sm">
        <Link
          href="/raporlar"
          className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span>Raporlar</span>
        </Link>
        <h1 className="text-sm font-bold tracking-wide text-neutral-900">
          Finansal Analiz
        </h1>
        <div className="w-20" />
      </div>

      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
          <BarChart2
            className="h-7 w-7 text-emerald-400"
            strokeWidth={1.5}
          />
        </div>
        <h2 className="mb-2 text-base font-bold text-neutral-800">
          Gunun Finansal Analizi
        </h2>
        <p className="mb-6 max-w-sm text-center text-xs leading-relaxed text-neutral-400">
          Bu modul ileri asamada aktif edilecektir. Gunluk finansal performansin
          kapsamli analizini uretecektir. Yatirim/cekim oranlari, komisyon
          dagilimi ve genel degerlendirme icerir.
        </p>
        <span className="rounded-full bg-neutral-100 px-4 py-1.5 text-[11px] font-medium text-neutral-400">
          Yakinda
        </span>
      </div>
    </div>
  );
}
