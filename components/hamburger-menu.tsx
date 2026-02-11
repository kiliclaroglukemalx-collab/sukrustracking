"use client";

import React from "react"

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MoreVertical,
  Upload,
  RotateCcw,
  Film,
  Settings,
  X,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Check,
  ArrowLeft,
} from "lucide-react";
import type { KasaCardData, PaymentMethod } from "@/lib/excel-processor";
import { ExcelUploader } from "./excel-uploader";

interface HamburgerMenuProps {
  onDataLoaded: (data: KasaCardData[]) => void;
  onReset: () => void;
  onVideoChange: (url: string) => void;
  videoUrl: string;
  methods: PaymentMethod[];
  onMethodsChange: (methods: PaymentMethod[]) => void;
}

type Panel = "main" | "excel" | "video" | "ayarlar" | "yontemler" | "editMethod";

export function HamburgerMenu({
  onDataLoaded,
  onReset,
  onVideoChange,
  videoUrl,
  methods,
  onMethodsChange,
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("main");
  const [videoInput, setVideoInput] = useState(videoUrl);

  // Method editing state
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [editName, setEditName] = useState("");
  const [editKomisyon, setEditKomisyon] = useState("");
  const [editBakiye, setEditBakiye] = useState("");
  const [isNewMethod, setIsNewMethod] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVideoInput(videoUrl);
  }, [videoUrl]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActivePanel("main");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    setActivePanel("main");
  }, []);

  const openEditMethod = useCallback(
    (method: PaymentMethod, isNew: boolean) => {
      setEditingMethod(method);
      setEditName(method.name);
      setEditKomisyon(String(method.komisyonOrani));
      setEditBakiye(String(method.baslangicBakiye));
      setIsNewMethod(isNew);
      setActivePanel("editMethod");
    },
    [],
  );

  const saveMethod = useCallback(() => {
    if (!editingMethod || !editName.trim()) return;
    const updated: PaymentMethod = {
      ...editingMethod,
      name: editName.trim(),
      komisyonOrani: Number.parseFloat(editKomisyon) || 0,
      baslangicBakiye: Number.parseFloat(editBakiye) || 0,
    };
    if (isNewMethod) {
      onMethodsChange([...methods, updated]);
    } else {
      onMethodsChange(
        methods.map((m) => (m.id === updated.id ? updated : m)),
      );
    }
    setActivePanel("yontemler");
  }, [
    editingMethod,
    editName,
    editKomisyon,
    editBakiye,
    isNewMethod,
    methods,
    onMethodsChange,
  ]);

  const deleteMethod = useCallback(
    (id: string) => {
      onMethodsChange(methods.filter((m) => m.id !== id));
    },
    [methods, onMethodsChange],
  );

  const addNewMethod = useCallback(() => {
    const newMethod: PaymentMethod = {
      id: `m-${Date.now()}`,
      name: "",
      komisyonOrani: 0,
      baslangicBakiye: 0,
    };
    openEditMethod(newMethod, true);
  }, [openEditMethod]);

  // --- BACK BUTTON ---
  const BackButton = ({
    to,
    label,
  }: {
    to: Panel;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => setActivePanel(to)}
      className="mb-3 flex items-center gap-1 text-[10px] text-neutral-400 transition-colors hover:text-neutral-600"
    >
      <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
      {label}
    </button>
  );

  // --- MENU ITEM ---
  const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    hasArrow,
    danger,
  }: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
    onClick: () => void;
    hasArrow?: boolean;
    danger?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-neutral-50 ${danger ? "text-red-500" : ""}`}
    >
      <span className="flex items-center gap-2.5">
        <Icon
          className={`h-3.5 w-3.5 ${danger ? "text-red-400" : "text-neutral-400"}`}
          strokeWidth={1.5}
        />
        <span className={`text-[11px] ${danger ? "text-red-500" : "text-neutral-600"}`}>
          {label}
        </span>
      </span>
      {hasArrow && (
        <ChevronRight className="h-3 w-3 text-neutral-300" strokeWidth={1.5} />
      )}
    </button>
  );

  return (
    <div ref={menuRef} className="fixed right-3 top-2.5 z-50">
      {/* Trigger button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setActivePanel("main");
        }}
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-white/80 text-neutral-400 backdrop-blur-sm transition-all hover:border-neutral-300 hover:text-neutral-600"
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        ) : (
          <MoreVertical className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-9 w-72 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl shadow-black/8">
          {/* ─── MAIN MENU ─── */}
          {activePanel === "main" && (
            <div className="flex flex-col py-1">
              <MenuItem
                icon={Upload}
                label="Excel Yukle"
                onClick={() => setActivePanel("excel")}
                hasArrow
              />
              <MenuItem
                icon={Film}
                label="Video Ayarlari"
                onClick={() => setActivePanel("video")}
                hasArrow
              />
              <div className="mx-3.5 h-px bg-neutral-100" />
              <MenuItem
                icon={Settings}
                label="Ayarlar"
                onClick={() => setActivePanel("ayarlar")}
                hasArrow
              />
              <div className="mx-3.5 h-px bg-neutral-100" />
              <MenuItem
                icon={RotateCcw}
                label="Demo Veriye Don"
                onClick={() => {
                  onReset();
                  close();
                }}
              />
            </div>
          )}

          {/* ─── EXCEL UPLOAD ─── */}
          {activePanel === "excel" && (
            <div className="p-3.5">
              <BackButton to="main" label="Menu" />
              <ExcelUploader
                onDataLoaded={(data) => {
                  onDataLoaded(data);
                  close();
                }}
              />
            </div>
          )}

          {/* ─── VIDEO SETTINGS ─── */}
          {activePanel === "video" && (
            <div className="p-3.5">
              <BackButton to="main" label="Menu" />
              <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-neutral-400">
                Video URL (mp4)
              </label>
              <input
                type="text"
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="mb-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-800 placeholder-neutral-300 outline-none transition-colors focus:border-neutral-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onVideoChange(videoInput);
                    close();
                  }}
                  className="flex-1 rounded-lg bg-neutral-900 py-1.5 text-[10px] font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  Uygula
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVideoInput("");
                    onVideoChange("");
                  }}
                  className="rounded-lg px-3 py-1.5 text-[10px] text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
                >
                  Temizle
                </button>
              </div>
            </div>
          )}

          {/* ─── AYARLAR ─── */}
          {activePanel === "ayarlar" && (
            <div className="flex flex-col py-1">
              <div className="px-3.5 pb-1 pt-2">
                <BackButton to="main" label="Menu" />
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                  Ayarlar
                </p>
              </div>
              <MenuItem
                icon={Settings}
                label={`Yontemler (${methods.length})`}
                onClick={() => setActivePanel("yontemler")}
                hasArrow
              />
            </div>
          )}

          {/* ─── YONTEMLER LIST ─── */}
          {activePanel === "yontemler" && (
            <div className="flex flex-col">
              <div className="px-3.5 pb-2 pt-3">
                <BackButton to="ayarlar" label="Ayarlar" />
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                    Odeme Yontemleri
                  </p>
                  <button
                    type="button"
                    onClick={addNewMethod}
                    className="flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-1 text-[9px] font-medium text-white transition-colors hover:bg-neutral-800"
                  >
                    <Plus className="h-2.5 w-2.5" strokeWidth={2} />
                    Ekle
                  </button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto border-t border-neutral-100">
                {methods.map((method) => (
                  <div
                    key={method.id}
                    className="group flex items-center justify-between border-b border-neutral-50 px-3.5 py-2 transition-colors hover:bg-neutral-50"
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-neutral-700">
                        {method.name}
                      </span>
                      <span className="text-[9px] text-neutral-400">
                        %{method.komisyonOrani} komisyon
                        {method.baslangicBakiye > 0
                          ? ` / Baslangic: ${method.baslangicBakiye.toLocaleString("tr-TR")} TL`
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => openEditMethod(method, false)}
                        className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
                        aria-label="Duzenle"
                      >
                        <Pencil className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMethod(method.id)}
                        className="rounded p-1 text-red-300 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label="Sil"
                      >
                        <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── EDIT / ADD METHOD ─── */}
          {activePanel === "editMethod" && (
            <div className="p-3.5">
              <BackButton to="yontemler" label="Yontemler" />
              <p className="mb-3 text-xs font-semibold text-neutral-800">
                {isNewMethod ? "Yeni Yontem Ekle" : "Yontemi Duzenle"}
              </p>

              {/* Name */}
              <label className="mb-1 block text-[9px] font-medium uppercase tracking-widest text-neutral-400">
                Yontem Adi
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ornegin: Papara"
                className="mb-3 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-800 placeholder-neutral-300 outline-none focus:border-neutral-400"
              />

              {/* Commission + Balance side by side */}
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[9px] font-medium uppercase tracking-widest text-neutral-400">
                    Komisyon %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editKomisyon}
                    onChange={(e) => setEditKomisyon(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 font-mono text-[11px] text-neutral-800 placeholder-neutral-300 outline-none focus:border-neutral-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[9px] font-medium uppercase tracking-widest text-neutral-400">
                    Baslangic Bakiye
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={editBakiye}
                    onChange={(e) => setEditBakiye(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 font-mono text-[11px] text-neutral-800 placeholder-neutral-300 outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              {/* Save button */}
              <button
                type="button"
                onClick={saveMethod}
                disabled={!editName.trim()}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-900 py-2 text-[11px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Check className="h-3 w-3" strokeWidth={2} />
                {isNewMethod ? "Yontem Ekle" : "Kaydet"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
