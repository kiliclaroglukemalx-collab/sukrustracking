"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calculator,
  ClipboardCheck,
  Lock,
  Moon,
  Scale,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { parseExcelFile, groupPaymentRowsByYontem, normalizeYontemAdi } from "@/lib/excel-processor";
import { GunsonuTablo, type GunsonuSatir } from "@/components/gunsonu-tablo";
import { cn } from "@/lib/utils";

export default function MutabakatPage() {
  const { role } = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [kasaRows, setKasaRows] = useState<{ yontemAdi: string; borc: number; kredi: number }[]>([]);
  const [cekimlerRows, setCekimlerRows] = useState<{ yontemAdi: string; borc: number; kredi: number }[]>([]);
  const [kasaFileName, setKasaFileName] = useState<string | null>(null);
  const [cekimlerFileName, setCekimlerFileName] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleKasaFile = useCallback(async (file: File) => {
    const buf = await file.arrayBuffer();
    const rows = parseExcelFile(buf);
    const grouped = groupPaymentRowsByYontem(rows);
    setKasaRows(grouped);
    setKasaFileName(file.name);
  }, []);

  const handleCekimlerFile = useCallback(async (file: File) => {
    const buf = await file.arrayBuffer();
    const rows = parseExcelFile(buf);
    const grouped = groupPaymentRowsByYontem(rows);
    setCekimlerRows(grouped);
    setCekimlerFileName(file.name);
  }, []);

  const mergedSatirlar = useMemo((): GunsonuSatir[] => {
    const cekimlerByNorm = new Map<string, number>();
    for (const r of cekimlerRows) {
      const norm = normalizeYontemAdi(r.yontemAdi);
      const existing = cekimlerByNorm.get(norm) ?? 0;
      cekimlerByNorm.set(norm, existing + r.kredi);
    }

    return kasaRows.map((k) => {
      const norm = normalizeYontemAdi(k.yontemAdi);
      const cekimler = cekimlerByNorm.get(norm) ?? 0;
      const fark = k.kredi - cekimler;
      return {
        yontemAdi: k.yontemAdi,
        borc: k.borc,
        kredi: k.kredi,
        cekimler,
        fark,
      };
    });
  }, [kasaRows, cekimlerRows]);

  if (!hydrated) {
    return <div className="min-h-screen bg-rose-50/80" />;
  }

  if (role === "basic") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-rose-50/80">
        <Lock className="mb-3 h-8 w-8 text-rose-300" strokeWidth={1.5} />
        <p className="mb-1 text-sm font-medium text-rose-800">Erisim Engellendi</p>
        <p className="mb-4 text-xs text-rose-600">Bu sayfa sadece Master kullanicilar icindir</p>
        <Link
          href="/"
          className="text-xs text-rose-500 underline hover:text-rose-900"
        >
          Ana Sayfaya Don
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50/80">
      {/* Top Nav */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-rose-200/60 bg-white/90 px-5 py-3 backdrop-blur-sm">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-rose-600 transition-colors hover:text-rose-900"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span>Ana Sayfaya Don</span>
        </Link>
        <h1 className="text-sm font-bold tracking-wide text-rose-900">Mutabakat</h1>
        <div className="w-20" />
      </div>

      <div className="mx-auto max-w-4xl px-5 py-6">
        {/* Section Header */}
        <div className="mb-6 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-rose-500" strokeWidth={1.5} />
          <p className="text-xs text-rose-600">Mutabakat islemleri icin asagidaki modulleri kullanin</p>
        </div>

        {/* SECTION 1: Gunsonu Hesaplama */}
        <section className="mb-6">
          <div className="overflow-hidden rounded-xl border border-rose-200/60 bg-white/90 shadow-sm">
            <div className="flex items-start gap-4 p-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <Moon className="h-5 w-5 text-rose-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-bold text-rose-900">Gunsonu Hesaplama</h3>
                <p className="mb-4 text-xs leading-relaxed text-rose-700/80">
                  Kasa dosyasini (odeme turu, borc, kredi) ve cekimler dosyasini (odeme sistemi adi, cekim)
                  yukleyin. Yontem bazli karsilastirma ve kopyalanabilir tablo sunulur.
                </p>

                {/* Excel 1: Kasa */}
                <div className="mb-4">
                  <p className="mb-2 text-[11px] font-medium text-rose-700">1. Kasa Dosyasi (Excel)</p>
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f && /\.(xlsx|xls|csv)$/i.test(f.name)) handleKasaFile(f);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className={cn(
                      "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-all duration-200",
                      kasaFileName
                        ? "border-rose-300 bg-rose-50/50"
                        : "border-rose-200 bg-white hover:border-rose-300 hover:bg-rose-50/30"
                    )}
                  >
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleKasaFile(f);
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    {kasaFileName ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-rose-500" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-rose-800">{kasaFileName}</p>
                        <p className="text-[10px] text-rose-600">Tiklayarak degistir</p>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100">
                          <Upload className="h-6 w-6 text-rose-600" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-medium text-rose-800">Kasa dosyasi yukleyin</p>
                        <p className="flex items-center gap-1 text-[10px] text-rose-600">
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          XLS, XLSX, CSV — Odeme Turu, Borc, Kredi kolonlari
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Excel 2: Cekimler */}
                <div className="mb-4">
                  <p className="mb-2 text-[11px] font-medium text-rose-700">2. Cekimler Dosyasi (Excel)</p>
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f && /\.(xlsx|xls|csv)$/i.test(f.name)) handleCekimlerFile(f);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className={cn(
                      "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-all duration-200",
                      cekimlerFileName
                        ? "border-rose-300 bg-rose-50/50"
                        : "border-rose-200 bg-white hover:border-rose-300 hover:bg-rose-50/30",
                      !kasaRows.length && "pointer-events-none opacity-60"
                    )}
                  >
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleCekimlerFile(f);
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      disabled={!kasaRows.length}
                    />
                    {cekimlerFileName ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-rose-500" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-rose-800">{cekimlerFileName}</p>
                        <p className="text-[10px] text-rose-600">Tiklayarak degistir</p>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100">
                          <Upload className="h-6 w-6 text-rose-600" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-medium text-rose-800">Cekimler dosyasi yukleyin</p>
                        <p className="flex items-center gap-1 text-[10px] text-rose-600">
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          Odeme Sistemi Adi, Cekim/Hacim kolonlari
                        </p>
                        {!kasaRows.length && (
                          <p className="text-[10px] text-amber-600">Once kasa dosyasi yukleyin</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Tablo */}
                {mergedSatirlar.length > 0 && (
                  <div className="mt-4">
                    <GunsonuTablo satirlar={mergedSatirlar} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Mutabakat Hesaplama Modulu */}
        <section className="mb-6">
          <div className="overflow-hidden rounded-xl border border-rose-200/60 bg-white/90 shadow-sm">
            <div className="flex items-start gap-4 p-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <Scale className="h-5 w-5 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-bold text-neutral-800">Mutabakat Hesaplama Modulu</h3>
                <p className="mb-4 text-xs leading-relaxed text-neutral-400">
                  Farkli kaynaklardan gelen verilerin karsilastirilmasi ve uyumsuzluklarin tespit edilmesi
                  icin kullanilir. Excel dosyalari veya manuel girislerle mutabakat kontrolu yapilir.
                </p>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-medium text-emerald-500">
                    Yakinda
                  </span>
                  <span className="text-[10px] text-neutral-300">Kasa verisi islendikten sonra aktif olacak</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Summary callout */}
        <div className="flex items-center gap-3 rounded-xl border border-rose-200/40 bg-rose-100/30 px-5 py-4">
          <Calculator className="h-4 w-4 flex-shrink-0 text-rose-500" strokeWidth={1.5} />
          <p className="text-[11px] leading-relaxed text-rose-700">
            Gunsonu modulu kasa + cekimler dosyalari ile calisir. Mutabakat modulu ileride farkli
            kaynaklarla genisletilecektir.
          </p>
        </div>
      </div>
    </div>
  );
}
