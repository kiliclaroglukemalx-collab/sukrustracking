"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calculator,
  ClipboardCheck,
  Lock,
  Moon,
  Scale,
} from "lucide-react";
import { useStore } from "@/lib/store";

export default function MutabakatPage() {
  const { role } = useStore();

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
          href="/"
          className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span>Kasaya Don</span>
        </Link>
        <h1 className="text-sm font-bold tracking-wide text-neutral-900">
          Mutabakat
        </h1>
        <div className="w-20" />
      </div>

      <div className="mx-auto max-w-3xl px-5 py-6">
        {/* Section Header */}
        <div className="mb-6 flex items-center gap-2">
          <ClipboardCheck
            className="h-5 w-5 text-neutral-400"
            strokeWidth={1.5}
          />
          <p className="text-xs text-neutral-400">
            Mutabakat islemleri icin asagidaki modulleri kullanin
          </p>
        </div>

        {/* SECTION 1: Gunsonu Hesaplama */}
        <section className="mb-6">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="flex items-start gap-4 p-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                <Moon
                  className="h-5 w-5 text-indigo-500"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-bold text-neutral-800">
                  Gunsonu Hesaplama
                </h3>
                <p className="mb-4 text-xs leading-relaxed text-neutral-400">
                  Gun sonunda tum yontemlerin kapanisini hesaplar. Baslangic
                  bakiyesi, yatirimlar, cekimler ve komisyonlar dahil edilerek
                  gun sonu bakiye raporlanir.
                </p>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-medium text-indigo-500">
                    Yakinda
                  </span>
                  <span className="text-[10px] text-neutral-300">
                    Kasa verisi islendikten sonra aktif olacak
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Mutabakat Hesaplama Modulu */}
        <section className="mb-6">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="flex items-start gap-4 p-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <Scale
                  className="h-5 w-5 text-emerald-500"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-bold text-neutral-800">
                  Mutabakat Hesaplama Modulu
                </h3>
                <p className="mb-4 text-xs leading-relaxed text-neutral-400">
                  Farkli kaynaklardan gelen verilerin karsilastirilmasi ve
                  uyumsuzluklarin tespit edilmesi icin kullanilir. Excel
                  dosyalari veya manuel girislerle mutabakat kontrolu yapilir.
                </p>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-medium text-emerald-500">
                    Yakinda
                  </span>
                  <span className="text-[10px] text-neutral-300">
                    Kasa verisi islendikten sonra aktif olacak
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Summary callout */}
        <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 px-5 py-4">
          <Calculator
            className="h-4 w-4 flex-shrink-0 text-neutral-300"
            strokeWidth={1.5}
          />
          <p className="text-[11px] leading-relaxed text-neutral-400">
            Her iki modul de kasa verisi yuklendikten sonra tam olarak aktif
            hale gelecektir. Cursor uzerinden gelistirmeye devam edilecektir.
          </p>
        </div>
      </div>
    </div>
  );
}
