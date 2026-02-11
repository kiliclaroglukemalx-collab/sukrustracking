"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MoreVertical,
  Upload,
  RotateCcw,
  Film,
  Camera,
  Layers,
  Settings,
  X,
} from "lucide-react";
import type { KasaCardData } from "@/lib/excel-processor";
import { ExcelUploader } from "./excel-uploader";

interface HamburgerMenuProps {
  onDataLoaded: (data: KasaCardData[]) => void;
  onReset: () => void;
  onVideoChange: (url: string) => void;
  videoUrl: string;
  screenshotMode: boolean;
  onScreenshotToggle: () => void;
}

export function HamburgerMenu({
  onDataLoaded,
  onReset,
  onVideoChange,
  videoUrl,
  screenshotMode,
  onScreenshotToggle,
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<
    "main" | "excel" | "video" | "methods"
  >("main");
  const [videoInput, setVideoInput] = useState(videoUrl);
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

  return (
    <div ref={menuRef} className="fixed right-3 top-2.5 z-50">
      {/* Trigger button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setActivePanel("main");
        }}
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/10 bg-foreground/[0.04] text-foreground/40 transition-all hover:border-foreground/20 hover:bg-foreground/[0.08] hover:text-foreground/70"
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
        <div className="absolute right-0 top-9 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl shadow-black/10">
          {activePanel === "main" && (
            <div className="flex flex-col py-1">
              {/* Screenshot Mode toggle */}
              <button
                type="button"
                onClick={onScreenshotToggle}
                className="flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-neutral-50"
              >
                <span className="flex items-center gap-2.5">
                  <Camera
                    className="h-3.5 w-3.5 text-neutral-400"
                    strokeWidth={1.5}
                  />
                  <span className="text-[11px] text-neutral-600">
                    Screenshot Mode
                  </span>
                </span>
                <div
                  className={`h-4 w-7 rounded-full transition-colors ${
                    screenshotMode ? "bg-emerald-500" : "bg-neutral-200"
                  } flex items-center px-0.5`}
                >
                  <div
                    className={`h-3 w-3 rounded-full bg-white shadow transition-transform ${
                      screenshotMode ? "translate-x-3" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>

              <div className="mx-3 h-px bg-neutral-100" />

              {/* Excel Upload */}
              <button
                type="button"
                onClick={() => setActivePanel("excel")}
                className="flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50"
              >
                <Upload
                  className="h-3.5 w-3.5 text-neutral-400"
                  strokeWidth={1.5}
                />
                <span className="text-[11px] text-neutral-600">
                  Excel Yukle
                </span>
              </button>

              {/* Video */}
              <button
                type="button"
                onClick={() => setActivePanel("video")}
                className="flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50"
              >
                <Film
                  className="h-3.5 w-3.5 text-neutral-400"
                  strokeWidth={1.5}
                />
                <span className="text-[11px] text-neutral-600">
                  Video Ayarlari
                </span>
              </button>

              {/* Yontemler */}
              <button
                type="button"
                onClick={() => setActivePanel("methods")}
                className="flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50"
              >
                <Layers
                  className="h-3.5 w-3.5 text-neutral-400"
                  strokeWidth={1.5}
                />
                <span className="text-[11px] text-neutral-600">
                  Yontemler
                </span>
              </button>

              <div className="mx-3 h-px bg-neutral-100" />

              {/* Reset */}
              <button
                type="button"
                onClick={() => {
                  onReset();
                  close();
                }}
                className="flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50"
              >
                <RotateCcw
                  className="h-3.5 w-3.5 text-neutral-400"
                  strokeWidth={1.5}
                />
                <span className="text-[11px] text-neutral-600">
                  Demo Veriye Don
                </span>
              </button>

              {/* Ayarlar info */}
              <button
                type="button"
                className="flex items-center gap-2.5 px-3 py-2.5 text-left opacity-30"
                disabled
              >
                <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="text-[11px]">Ayarlar</span>
              </button>
            </div>
          )}

          {activePanel === "excel" && (
            <div className="p-3">
              <button
                type="button"
                onClick={() => setActivePanel("main")}
                className="mb-3 text-[10px] text-neutral-400 transition-colors hover:text-neutral-600"
              >
                {"< Geri"}
              </button>
              <ExcelUploader
                onDataLoaded={(data) => {
                  onDataLoaded(data);
                  close();
                }}
              />
            </div>
          )}

          {activePanel === "video" && (
            <div className="p-3">
              <button
                type="button"
                onClick={() => setActivePanel("main")}
                className="mb-3 text-[10px] text-neutral-400 transition-colors hover:text-neutral-600"
              >
                {"< Geri"}
              </button>
              <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-neutral-400">
                Video URL (mp4)
              </label>
              <input
                type="text"
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="mb-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-foreground placeholder-neutral-300 outline-none transition-colors focus:border-neutral-400"
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

          {activePanel === "methods" && (
            <div className="max-h-72 overflow-y-auto p-3">
              <button
                type="button"
                onClick={() => setActivePanel("main")}
                className="mb-3 text-[10px] text-neutral-400 transition-colors hover:text-neutral-600"
              >
                {"< Geri"}
              </button>
              <p className="mb-2 text-[9px] uppercase tracking-widest text-neutral-400">
                Komisyon Oranlari
              </p>
              <div className="space-y-1">
                {[
                  ["Nakit", "0%"],
                  ["Kredi Karti", "1.79%"],
                  ["Banka Karti", "0.95%"],
                  ["Havale/EFT", "0%"],
                  ["Yemek Karti", "5%"],
                  ["Online Odeme", "2.5%"],
                  ["Multinet", "5%"],
                  ["Sodexo", "5%"],
                  ["Ticket", "5%"],
                  ["Metropol", "5%"],
                  ["Setcard", "5%"],
                  ["iyzico", "2.99%"],
                  ["PayPal", "3.4%"],
                  ["Param", "2.79%"],
                  ["Paycell", "2.5%"],
                  ["Hopi", "3%"],
                  ["Tosla", "2.5%"],
                  ["Papara", "1.5%"],
                  ["Cuzdan", "0%"],
                  ["Acik Hesap", "0%"],
                  ["Fis/Cek", "0%"],
                  ["Garanti Pay", "2.2%"],
                  ["QR Odeme", "1.8%"],
                  ["Puan", "0%"],
                ].map(([name, rate]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between py-0.5"
                  >
                    <span className="text-[10px] text-neutral-500">{name}</span>
                    <span className="font-mono text-[10px] text-neutral-700">
                      {rate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
