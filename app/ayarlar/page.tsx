"use client";

import React, { useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Layers, Film } from "lucide-react";
import { useStore } from "@/lib/store";
import type { PaymentMethod } from "@/lib/excel-processor";

export default function AyarlarPage() {
  const { methods, setMethods, videoUrl, setVideoUrl } = useStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- Otomatik kaydet: her degisiklikte 400ms debounce ile setMethods ---- */
  const autoSave = useCallback(
    (updated: PaymentMethod[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setMethods(updated);
      }, 400);
    },
    [setMethods],
  );

  const updateField = useCallback(
    (id: string, field: keyof PaymentMethod, value: string | number) => {
      const updated = methods.map((m) =>
        m.id === id ? { ...m, [field]: value } : m,
      );
      autoSave(updated);
    },
    [methods, autoSave],
  );

  /* ---- Yeni yontem ekle ---- */
  const addMethod = useCallback(() => {
    const newMethod: PaymentMethod = {
      id: `m-${Date.now()}`,
      name: "Yeni Yontem",
      excelKolonAdi: "",
      komisyonOrani: 0,
      cekimKomisyonOrani: 0,
      baslangicBakiye: 0,
    };
    setMethods([...methods, newMethod]);
  }, [methods, setMethods]);

  /* ---- Sil ---- */
  const deleteMethod = useCallback(
    (id: string) => {
      setMethods(methods.filter((m) => m.id !== id));
    },
    [methods, setMethods],
  );

  /* ---- Video URL ---- */
  const handleVideoSave = useCallback(
    (val: string) => {
      setVideoUrl(val);
    },
    [setVideoUrl],
  );

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
          Ayarlar
        </h1>
        <div className="w-20" />
      </div>

      <div className="mx-auto max-w-3xl px-5 py-6">
        {/* Video Settings */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Film className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">
              Video Arka Plan
            </h2>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-neutral-400">
              Video URL (mp4)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                defaultValue={videoUrl}
                onBlur={(e) => handleVideoSave(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 placeholder-neutral-300 outline-none transition-colors focus:border-neutral-400"
              />
              {videoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setVideoUrl("");
                  }}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-400 transition-colors hover:text-neutral-700"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">
                Odeme Yontemleri ({methods.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={addMethod}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-neutral-800"
            >
              <Plus className="h-3 w-3" strokeWidth={2} />
              Yeni Yontem
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {/* Table header */}
            <div className="grid grid-cols-[1.2fr_1fr_70px_80px_110px_40px] gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Yontem Adi
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Excel Adi
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Kom. %
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Cekim K. %
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Bsl. Bakiye
              </span>
              <span />
            </div>

            {/* Method rows -- all fields inline editable */}
            {methods.map((method) => (
              <div
                key={method.id}
                className="group grid grid-cols-[1.2fr_1fr_70px_80px_110px_40px] items-center gap-2 border-b border-neutral-50 px-4 py-1.5 transition-colors last:border-0 hover:bg-neutral-50/50"
              >
                {/* Yontem Adi */}
                <input
                  type="text"
                  defaultValue={method.name}
                  onBlur={(e) => updateField(method.id, "name", e.target.value.trim())}
                  className="rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-medium text-neutral-800 outline-none transition-colors focus:border-neutral-300 focus:bg-white"
                />
                {/* Excel Adi */}
                <input
                  type="text"
                  defaultValue={method.excelKolonAdi || ""}
                  onBlur={(e) => updateField(method.id, "excelKolonAdi", e.target.value.trim())}
                  placeholder="-"
                  className="rounded-md border border-transparent bg-transparent px-1.5 py-1 text-xs text-neutral-500 italic outline-none transition-colors placeholder:text-neutral-300 focus:border-neutral-300 focus:bg-white focus:not-italic"
                />
                {/* Komisyon % */}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={method.komisyonOrani}
                  onBlur={(e) => updateField(method.id, "komisyonOrani", Number.parseFloat(e.target.value) || 0)}
                  className="rounded-md border border-transparent bg-transparent px-1.5 py-1 font-mono text-sm text-neutral-600 outline-none transition-colors focus:border-neutral-300 focus:bg-white"
                />
                {/* Cekim Komisyon % */}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={method.cekimKomisyonOrani ?? 0}
                  onBlur={(e) => updateField(method.id, "cekimKomisyonOrani", Number.parseFloat(e.target.value) || 0)}
                  className="rounded-md border border-transparent bg-transparent px-1.5 py-1 font-mono text-sm text-neutral-600 outline-none transition-colors focus:border-neutral-300 focus:bg-white"
                />
                {/* Baslangic Bakiye */}
                <input
                  type="number"
                  step="1"
                  defaultValue={method.baslangicBakiye}
                  onBlur={(e) => updateField(method.id, "baslangicBakiye", Number.parseFloat(e.target.value) || 0)}
                  className="rounded-md border border-transparent bg-transparent px-1.5 py-1 font-mono text-sm text-neutral-600 outline-none transition-colors focus:border-neutral-300 focus:bg-white"
                />
                {/* Sil */}
                <button
                  type="button"
                  onClick={() => deleteMethod(method.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                  aria-label="Sil"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            ))}

            {methods.length === 0 && (
              <div className="flex flex-col items-center py-10 text-neutral-400">
                <Layers className="mb-2 h-6 w-6" strokeWidth={1} />
                <p className="text-sm">Henuz yontem eklenmedi</p>
              </div>
            )}
          </div>

          <p className="mt-2 text-center text-[10px] text-neutral-400">
            Alandan ciktiginizda otomatik kaydedilir
          </p>
        </section>
      </div>
    </div>
  );
}
