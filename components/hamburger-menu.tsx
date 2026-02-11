"use client";

import { useState } from "react";
import {
  Menu,
  X,
  Upload,
  RotateCcw,
  Settings,
  BarChart3,
} from "lucide-react";
import type { KasaCardData } from "@/lib/excel-processor";
import { ExcelUploader } from "./excel-uploader";

interface HamburgerMenuProps {
  onDataLoaded: (data: KasaCardData[]) => void;
  onReset: () => void;
}

export function HamburgerMenu({ onDataLoaded, onReset }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-secondary"
        aria-label="Menu ac"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
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
        className={`fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-border bg-card transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Ayarlar
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-secondary"
            aria-label="Menu kapat"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          {/* Excel Upload Section */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
          <div className="border-t border-border" />

          {/* Quick Actions */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Islemler
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
                type="button"
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                <RotateCcw className="h-4 w-4" />
                Demo Veriye Don
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-auto border-t border-border pt-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Excel dosyanizda{" "}
              <span className="font-medium text-foreground">
                {"Odeme Turu Adi"}
              </span>
              ,{" "}
              <span className="font-medium text-foreground">{"Borc"}</span>{" "}
              ve{" "}
              <span className="font-medium text-foreground">{"Kredi"}</span>{" "}
              kolonlari bulunmalidir.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
