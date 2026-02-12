"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Upload,
  RotateCcw,
  Settings,
  BarChart3,
  FileCheck,
  X,
  ChevronRight,
  Shield,
  User,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { UserRole } from "@/lib/store";
import { ExcelUploader } from "./excel-uploader";

type Panel = "main" | "excel" | "password";

export function HamburgerMenu() {
  const { role, setRole, verifyMasterPassword, loadExcelData, resetToDemo } =
    useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("main");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActivePanel("main");
        setPassword("");
        setPasswordError(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (activePanel === "password" && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [activePanel]);

  const close = useCallback(() => {
    setIsOpen(false);
    setActivePanel("main");
    setPassword("");
    setPasswordError(false);
  }, []);

  const handleRoleSwitch = useCallback(
    (targetRole: UserRole) => {
      if (targetRole === "basic") {
        setRole("basic");
        return;
      }
      // Switching to master requires password
      if (role === "basic" && targetRole === "master") {
        setActivePanel("password");
        setPassword("");
        setPasswordError(false);
        return;
      }
    },
    [role, setRole],
  );

  const handlePasswordSubmit = useCallback(() => {
    if (verifyMasterPassword(password)) {
      setRole("master");
      setActivePanel("main");
      setPassword("");
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPassword("");
    }
  }, [password, verifyMasterPassword, setRole]);

  return (
    <div ref={menuRef} className="fixed right-3 top-2.5 z-50">
      {/* Trigger */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setActivePanel("main");
          setPassword("");
          setPasswordError(false);
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
          {/* MAIN MENU */}
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
                    onClick={() => handleRoleSwitch("basic")}
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
                    onClick={() => handleRoleSwitch("master")}
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
                {/* Excel Yukle - Master only */}
                {role === "master" && (
                  <button
                    type="button"
                    onClick={() => setActivePanel("excel")}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                  >
                    <span className="flex items-center gap-2.5">
                      <Upload
                        className="h-3.5 w-3.5 text-neutral-400"
                        strokeWidth={1.5}
                      />
                      <span className="text-[11px] text-neutral-600">
                        Excel Yukle
                      </span>
                    </span>
                    <ChevronRight
                      className="h-3 w-3 text-neutral-300"
                      strokeWidth={1.5}
                    />
                  </button>
                )}

                {/* Raporlar - Master only */}
                {role === "master" && (
                  <Link
                    href="/raporlar"
                    onClick={close}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                  >
                    <span className="flex items-center gap-2.5">
                      <BarChart3
                        className="h-3.5 w-3.5 text-neutral-400"
                        strokeWidth={1.5}
                      />
                      <span className="text-[11px] text-neutral-600">
                        Raporlar
                      </span>
                    </span>
                    <ChevronRight
                      className="h-3 w-3 text-neutral-300"
                      strokeWidth={1.5}
                    />
                  </Link>
                )}

                {/* Mutabakat - Master only */}
                {role === "master" && (
                  <Link
                    href="/mutabakat"
                    onClick={close}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                  >
                    <span className="flex items-center gap-2.5">
                      <FileCheck
                        className="h-3.5 w-3.5 text-neutral-400"
                        strokeWidth={1.5}
                      />
                      <span className="text-[11px] text-neutral-600">
                        Mutabakat
                      </span>
                    </span>
                    <ChevronRight
                      className="h-3 w-3 text-neutral-300"
                      strokeWidth={1.5}
                    />
                  </Link>
                )}

                {/* Ayarlar - Always visible */}
                <Link
                  href="/ayarlar"
                  onClick={close}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                >
                  <span className="flex items-center gap-2.5">
                    <Settings
                      className="h-3.5 w-3.5 text-neutral-400"
                      strokeWidth={1.5}
                    />
                    <span className="text-[11px] text-neutral-600">
                      Ayarlar
                    </span>
                  </span>
                  <ChevronRight
                    className="h-3 w-3 text-neutral-300"
                    strokeWidth={1.5}
                  />
                </Link>

                {/* Demo reset - Master only */}
                {role === "master" && (
                  <>
                    <div className="mx-4 h-px bg-neutral-100" />
                    <button
                      type="button"
                      onClick={() => {
                        resetToDemo();
                        close();
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                    >
                      <RotateCcw
                        className="h-3.5 w-3.5 text-neutral-400"
                        strokeWidth={1.5}
                      />
                      <span className="text-[11px] text-neutral-600">
                        Demo Veriye Don
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* PASSWORD PANEL */}
          {activePanel === "password" && (
            <div className="p-4">
              <button
                type="button"
                onClick={() => {
                  setActivePanel("main");
                  setPassword("");
                  setPasswordError(false);
                }}
                className="mb-3 flex items-center gap-1 text-[10px] text-neutral-400 transition-colors hover:text-neutral-600"
              >
                <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
                Menu
              </button>

              <div className="mb-3 flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                  <Lock
                    className="h-4 w-4 text-neutral-500"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-center text-[11px] font-medium text-neutral-600">
                  Master moduna gecis icin sifre girin
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePasswordSubmit();
                }}
              >
                <input
                  ref={passwordInputRef}
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="Sifre"
                  className={`mb-2 w-full rounded-lg border px-3 py-2.5 text-center text-sm text-neutral-800 outline-none transition-colors ${
                    passwordError
                      ? "border-red-300 bg-red-50 placeholder-red-300"
                      : "border-neutral-200 bg-neutral-50 placeholder-neutral-300 focus:border-neutral-400"
                  }`}
                />
                {passwordError && (
                  <p className="mb-2 text-center text-[10px] text-red-500">
                    Yanlis sifre
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full rounded-lg bg-neutral-900 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  Giris Yap
                </button>
              </form>
            </div>
          )}

          {/* EXCEL UPLOAD PANEL */}
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
                onDataLoaded={(data, rows) => {
                  loadExcelData(data, rows);
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
