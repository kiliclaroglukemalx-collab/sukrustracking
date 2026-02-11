"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Upload,
  RotateCcw,
  Settings,
  BarChart3,
  X,
  ChevronRight,
  Shield,
  User,
  ArrowLeft,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { ExcelUploader } from "./excel-uploader";

type Panel = "main" | "excel";

export function HamburgerMenu() {
  const { role, setRole, loadExcelData, resetToDemo } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("main");
  const menuRef = useRef<HTMLDivElement>(null);

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
      {/* Trigger */}
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
        <div className="absolute right-0 top-9 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl shadow-black/8">
          {/* ── MAIN MENU ── */}
          {activePanel === "main" && (
            <div className="flex flex-col">
              {/* User role toggle */}
              <div className="border-b border-neutral-100 px-4 py-3">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  Kullanici
                </p>
                <div className="flex overflow-hidden rounded-lg border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setRole("basic")}
                    className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition-colors ${
                      role === "basic"
                        ? "bg-neutral-900 text-white"
                        : "bg-white text-neutral-400 hover:text-neutral-600"
                    }`}
                  >
                    <User className="h-3 w-3" strokeWidth={1.5} />
                    Basic
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("master")}
                    className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition-colors ${
                      role === "master"
                        ? "bg-neutral-900 text-white"
                        : "bg-white text-neutral-400 hover:text-neutral-600"
                    }`}
                  >
                    <Shield className="h-3 w-3" strokeWidth={1.5} />
                    Master
                  </button>
                </div>
              </div>

              {/* Menu items */}
              <div className="flex flex-col py-1">
                <button
                  type="button"
                  onClick={() => setActivePanel("excel")}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                >
                  <span className="flex items-center gap-2.5">
                    <Upload className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
                    <span className="text-[11px] text-neutral-600">Excel Yukle</span>
                  </span>
                  <ChevronRight className="h-3 w-3 text-neutral-300" strokeWidth={1.5} />
                </button>

                <Link
                  href="/raporlar"
                  onClick={close}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                >
                  <span className="flex items-center gap-2.5">
                    <BarChart3 className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
                    <span className="text-[11px] text-neutral-600">Raporlar</span>
                  </span>
                  <ChevronRight className="h-3 w-3 text-neutral-300" strokeWidth={1.5} />
                </Link>

                <Link
                  href="/ayarlar"
                  onClick={close}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                >
                  <span className="flex items-center gap-2.5">
                    <Settings className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
                    <span className="text-[11px] text-neutral-600">Ayarlar</span>
                  </span>
                  <ChevronRight className="h-3 w-3 text-neutral-300" strokeWidth={1.5} />
                </Link>

                <div className="mx-4 h-px bg-neutral-100" />

                <button
                  type="button"
                  onClick={() => {
                    resetToDemo();
                    close();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
                  <span className="text-[11px] text-neutral-600">Demo Veriye Don</span>
                </button>
              </div>
            </div>
          )}

          {/* ── EXCEL UPLOAD ── */}
          {activePanel === "excel" && (
            <div className="p-4">
              <button
                type="button"
                onClick={() => setActivePanel("main")}
                className="mb-3 flex items-center gap-1 text-[10px] text-neutral-400 transition-colors hover:text-neutral-600"
              >
                <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
                Menu
              </button>
              <ExcelUploader
                onDataLoaded={(data) => {
                  loadExcelData(data);
                  close();
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
