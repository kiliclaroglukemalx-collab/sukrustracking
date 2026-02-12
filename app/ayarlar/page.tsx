"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Layers,
  Film,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { PaymentMethod } from "@/lib/excel-processor";

export default function AyarlarPage() {
  const { methods, setMethods, videoUrl, setVideoUrl } = useStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editExcelAdi, setEditExcelAdi] = useState("");
  const [editKomisyon, setEditKomisyon] = useState("");
  const [editCekimKomisyon, setEditCekimKomisyon] = useState("");
  const [editBakiye, setEditBakiye] = useState("");
  const [videoInput, setVideoInput] = useState(videoUrl);

  // --- Edit ---
  const startEdit = useCallback((m: PaymentMethod) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditExcelAdi(m.excelKolonAdi ?? "");
    setEditKomisyon(String(m.komisyonOrani));
    setEditCekimKomisyon(String(m.cekimKomisyonOrani ?? 0));
    setEditBakiye(String(m.baslangicBakiye));
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId || !editName.trim()) return;
    const updated = methods.map((m) =>
      m.id === editingId
        ? {
            ...m,
            name: editName.trim(),
            excelKolonAdi: editExcelAdi.trim(),
            komisyonOrani: Number.parseFloat(editKomisyon) || 0,
            cekimKomisyonOrani: Number.parseFloat(editCekimKomisyon) || 0,
            baslangicBakiye: Number.parseFloat(editBakiye) || 0,
          }
        : m,
    );
    setMethods(updated);
    setEditingId(null);
  }, [editingId, editName, editExcelAdi, editKomisyon, editCekimKomisyon, editBakiye, methods, setMethods]);

  // --- Add ---
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
    // Start editing the new method immediately
    setEditingId(newMethod.id);
    setEditName(newMethod.name);
    setEditExcelAdi("");
    setEditKomisyon("0");
    setEditCekimKomisyon("0");
    setEditBakiye("0");
  }, [methods, setMethods]);

  // --- Delete ---
  const deleteMethod = useCallback(
    (id: string) => {
      setMethods(methods.filter((m) => m.id !== id));
      if (editingId === id) setEditingId(null);
    },
    [methods, setMethods, editingId],
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

      <div className="mx-auto max-w-2xl px-5 py-6">
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
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 placeholder-neutral-300 outline-none transition-colors focus:border-neutral-400"
              />
              <button
                type="button"
                onClick={() => setVideoUrl(videoInput)}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Uygula
              </button>
              {videoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setVideoInput("");
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
            <div className="grid grid-cols-[1fr_1fr_80px_90px_110px_64px] gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
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
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Islem
              </span>
            </div>

            {/* Method rows */}
            {methods.map((method) => (
              <div key={method.id}>
                {editingId === method.id ? (
                  <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
                    {/* Row 1: Name + Excel Adi */}
                    <div className="mb-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                          Yontem Adi
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-500"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                          Excel Adi
                        </label>
                        <input
                          type="text"
                          value={editExcelAdi}
                          onChange={(e) => setEditExcelAdi(e.target.value)}
                          placeholder="Excel kolon adi"
                          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-500 outline-none focus:border-neutral-500"
                        />
                      </div>
                    </div>
                    {/* Row 2: Komisyon + Cekim Kom + Bakiye + Buttons */}
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                          Kom. %
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editKomisyon}
                          onChange={(e) => setEditKomisyon(e.target.value)}
                          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 font-mono text-sm text-neutral-900 outline-none focus:border-neutral-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                          Cekim K. %
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editCekimKomisyon}
                          onChange={(e) => setEditCekimKomisyon(e.target.value)}
                          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 font-mono text-sm text-neutral-900 outline-none focus:border-neutral-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                          Bsl. Bakiye
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={editBakiye}
                          onChange={(e) => setEditBakiye(e.target.value)}
                          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 font-mono text-sm text-neutral-900 outline-none focus:border-neutral-500"
                        />
                      </div>
                      <div className="flex items-center gap-1 pb-0.5">
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="rounded-md bg-emerald-600 p-1.5 text-white transition-colors hover:bg-emerald-700"
                          aria-label="Onayla"
                        >
                          <Check className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-md bg-neutral-200 p-1.5 text-neutral-600 transition-colors hover:bg-neutral-300"
                          aria-label="Iptal"
                        >
                          <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                <div
                  className="group grid grid-cols-[1fr_1fr_80px_90px_110px_64px] items-center gap-2 border-b border-neutral-50 px-4 py-2.5 transition-colors last:border-0 hover:bg-neutral-50/50"
                >
                  <>
                    <span className="text-sm font-medium text-neutral-800">
                      {method.name}
                    </span>
                    <span className="truncate text-xs text-neutral-400 italic">
                      {method.excelKolonAdi || "-"}
                    </span>
                    <span className="font-mono text-sm text-neutral-500">
                      %{method.komisyonOrani}
                    </span>
                    <span className="font-mono text-sm text-neutral-500">
                      {(method.cekimKomisyonOrani ?? 0) > 0 ? `%${method.cekimKomisyonOrani}` : "-"}
                    </span>
                    <span className={`font-mono text-sm ${method.baslangicBakiye < 0 ? "text-red-500" : "text-neutral-500"}`}>
                      {method.baslangicBakiye !== 0
                        ? `${method.baslangicBakiye.toLocaleString("tr-TR")} TL`
                        : "-"}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => startEdit(method)}
                        className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                        aria-label="Duzenle"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMethod(method.id)}
                        className="rounded-md p-1.5 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label="Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </>
                </div>
                )}
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
            Degisiklikler aninda kaydedilir
          </p>
        </section>
      </div>
    </div>
  );
}
