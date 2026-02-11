"use client";

import { useState } from "react";
import {
  Menu,
  X,
  Upload,
  RotateCcw,
  Settings,
  BarChart3,
  Film,
} from "lucide-react";
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
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="fixed right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-black/60 backdrop-blur-md transition-colors hover:bg-white/10"
        aria-label="Menu ac"
      >
        <Menu className="h-4 w-4 text-white" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="Menu kapat"
        />
      )}

      {/* Slide-out Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-white/10 bg-black/95 backdrop-blur-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-white/50" />
            <span className="text-sm font-semibold text-white">Ayarlar</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/10"
            aria-label="Menu kapat"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          {/* Video URL Section */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Film className="h-4 w-4 text-white/50" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                Arka Plan Videosu
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="Video URL (mp4)"
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-white/30"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleVideoApply}
                  className="flex-1 rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
                >
                  Uygula
                </button>
                <button
                  type="button"
                  onClick={handleVideoClear}
                  className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/10"
                >
                  Temizle
                </button>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-white/[0.06]" />

          {/* Excel Upload Section */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Upload className="h-4 w-4 text-white/50" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                Veri Yukle
              </span>
            </div>
            <ExcelUploader
              onDataLoaded={(data) => {
                onDataLoaded(data);
                setIsOpen(false);
              }}
            />
          </div>

          {/* Separator */}
          <div className="border-t border-white/[0.06]" />

          {/* Quick Actions */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-white/50" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                Islemler
              </span>
            </div>
            <button
              onClick={() => {
                onReset();
                setIsOpen(false);
              }}
              type="button"
              className="flex w-full items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs text-white transition-colors hover:bg-white/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Demo Veriye Don
            </button>
          </div>

          {/* Info */}
          <div className="mt-auto border-t border-white/[0.06] pt-4">
            <p className="text-[10px] leading-relaxed text-white/40">
              Excel dosyanizda{" "}
              <span className="font-medium text-white/70">
                {"Odeme Turu Adi"}
              </span>
              ,{" "}
              <span className="font-medium text-white/70">{"Borc"}</span> ve{" "}
              <span className="font-medium text-white/70">{"Kredi"}</span>{" "}
              kolonlari bulunmalidir. 21 odeme yontemi desteklenir.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
