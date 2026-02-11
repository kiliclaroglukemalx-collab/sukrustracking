"use client";

import { useState } from "react";
import { Menu, X, Upload, RotateCcw, Film } from "lucide-react";
import type { KasaCardData } from "@/lib/excel-processor";
import { ExcelUploader } from "./excel-uploader";

interface HamburgerMenuProps {
  onDataLoaded: (data: KasaCardData[]) => void;
  onReset: () => void;
  onVideoChange: (url: string) => void;
  videoUrl: string;
}

export function HamburgerMenu({
  onDataLoaded,
  onReset,
  onVideoChange,
  videoUrl,
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [videoInput, setVideoInput] = useState(videoUrl);

  const handleVideoApply = () => {
    onVideoChange(videoInput);
  };

  const handleVideoClear = () => {
    setVideoInput("");
    onVideoChange("");
  };

  return (
    <>
      {/* Thin hamburger icon - fixed top right */}
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="fixed right-3 top-2 z-50 flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-white/10"
        aria-label="Menu"
      >
        <Menu className="h-4 w-4 text-white/60" strokeWidth={1.5} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="Kapat"
        />
      )}

      {/* Side panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-white/10 bg-black/95 backdrop-blur-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
            Ayarlar
          </span>
          <button
            onClick={() => setIsOpen(false)}
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-white/10"
            aria-label="Kapat"
          >
            <X className="h-3.5 w-3.5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          {/* Video section */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Film className="h-3.5 w-3.5 text-white/40" />
              <span className="text-[9px] font-medium uppercase tracking-widest text-white/40">
                Arka Plan Videosu
              </span>
            </div>
            <input
              type="text"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="Video URL (mp4)"
              className="mb-2 w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white placeholder-white/25 outline-none focus:border-white/25"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleVideoApply}
                className="flex-1 rounded border border-white/10 bg-white/10 py-1 text-[10px] font-medium text-white transition-colors hover:bg-white/20"
              >
                Uygula
              </button>
              <button
                type="button"
                onClick={handleVideoClear}
                className="rounded border border-white/10 px-3 py-1 text-[10px] text-white/40 transition-colors hover:bg-white/10"
              >
                Sil
              </button>
            </div>
          </section>

          <div className="h-px bg-white/[0.06]" />

          {/* Excel upload */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Upload className="h-3.5 w-3.5 text-white/40" />
              <span className="text-[9px] font-medium uppercase tracking-widest text-white/40">
                Excel Yukle
              </span>
            </div>
            <ExcelUploader
              onDataLoaded={(data) => {
                onDataLoaded(data);
                setIsOpen(false);
              }}
            />
          </section>

          <div className="h-px bg-white/[0.06]" />

          {/* Reset */}
          <button
            onClick={() => {
              onReset();
              setIsOpen(false);
            }}
            type="button"
            className="flex items-center gap-2 rounded border border-white/10 px-3 py-2 text-[11px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            Demo Veriye Don
          </button>

          {/* Info */}
          <p className="mt-auto text-[9px] leading-relaxed text-white/25">
            Excel: Odeme Turu Adi, Borc, Kredi kolonlari. Komisyon otomatik
            hesaplanir.
          </p>
        </div>
      </div>
    </>
  );
}
