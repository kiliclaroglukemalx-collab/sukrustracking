"use client";

import React, { useState, useCallback, useEffect } from "react";
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
  Save,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { PaymentMethod } from "@/lib/excel-processor";

export default function AyarlarPage() {
  const { methods, setMethods, videoUrl, setVideoUrl } = useStore();

  // Local copy of methods so user can make multiple changes before saving
  const [localMethods, setLocalMethods] = useState<PaymentMethod[]>(methods);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editKomisyon, setEditKomisyon] = useState("");
  const [editBakiye, setEditBakiye] = useState("");
  const [videoInput, setVideoInput] = useState(videoUrl);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Sync when store methods change externally
  useEffect(() => {
    setLocalMethods(methods);
  }, [methods]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(localMethods) !== JSON.stringify(methods);
    setHasChanges(changed);
  }, [localMethods, methods]);

  const startEdit = useCallback((m: PaymentMethod) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditKomisyon(String(m.komisyonOrani));
    setEditBakiye(String(m.baslangicBakiye));
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId || !editName.trim()) return;
    setLocalMethods((prev) =>
      prev.map((m) =>
        m.id === editingId
          ? {
              ...m,
              name: editName.trim(),
              komisyonOrani: Number.parseFloat(editKomisyon) || 0,
              baslangicBakiye: Number.parseFloat(editBakiye) || 0,
            }
          : m,
      ),
    );
    setEditingId(null);
  }, [editingId, editName, editKomisyon, editBakiye]);

  const addMethod = useCallback(() => {
    const newMethod: PaymentMethod = {
      id: `m-${Date.now()}`,
      name: "Yeni Yontem",
      komisyonOrani: 0,
      baslangicBakiye: 0,
    };
    setLocalMethods((prev) => [...prev, newMethod]);
    startEdit(newMethod);
  }, [startEdit]);

  const deleteMethod = useCallback(
    (id: string) => {
      setLocalMethods((prev) => prev.filter((m) => m.id !== id));
      if (editingId === id) setEditingId(null);
    },
    [editingId],
  );

  const handleSaveAll = useCallback(() => {
    setMethods(localMethods);
    setHasChanges(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2500);
  }, [localMethods, setMethods]);

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
                Odeme Yontemleri ({localMethods.length})
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
            <div className="grid grid-cols-[1fr_100px_120px_72px] gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Yontem Adi
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Komisyon %
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Baslangic Bakiye
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Islem
              </span>
            </div>

            {/* Method rows */}
            {localMethods.map((method) => (
              <div
                key={method.id}
                className="group grid grid-cols-[1fr_100px_120px_72px] items-center gap-3 border-b border-neutral-50 px-4 py-2.5 transition-colors last:border-0 hover:bg-neutral-50/50"
              >
                {editingId === method.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus:border-neutral-500"
                      autoFocus
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editKomisyon}
                      onChange={(e) => setEditKomisyon(e.target.value)}
                      className="rounded-md border border-neutral-300 bg-white px-2 py-1 font-mono text-sm text-neutral-900 outline-none focus:border-neutral-500"
                    />
                    <input
                      type="number"
                      step="1"
                      value={editBakiye}
                      onChange={(e) => setEditBakiye(e.target.value)}
                      className="rounded-md border border-neutral-300 bg-white px-2 py-1 font-mono text-sm text-neutral-900 outline-none focus:border-neutral-500"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="rounded-md p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
                        aria-label="Onayla"
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100"
                        aria-label="Iptal"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-neutral-800">
                      {method.name}
                    </span>
                    <span className="font-mono text-sm text-neutral-500">
                      %{method.komisyonOrani}
                    </span>
                    <span className="font-mono text-sm text-neutral-500">
                      {method.baslangicBakiye > 0
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
                )}
              </div>
            ))}

            {localMethods.length === 0 && (
              <div className="flex flex-col items-center py-10 text-neutral-400">
                <Layers className="mb-2 h-6 w-6" strokeWidth={1} />
                <p className="text-sm">Henuz yontem eklenmedi</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 px-5 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <p className="text-xs text-neutral-500">
              Kaydedilmemis degisiklikler var
            </p>
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              <Save className="h-4 w-4" strokeWidth={1.5} />
              Degisiklikleri Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Saved Toast */}
      {showSaved && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-xl">
            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            Degisiklikler kaydedildi
          </div>
        </div>
      )}
    </div>
  );
}
