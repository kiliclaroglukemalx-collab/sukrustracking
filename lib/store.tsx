"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  DEFAULT_METHODS,
  generateDemoData,
  processExcelData,
} from "@/lib/excel-processor";
import type {
  KasaCardData,
  PaymentMethod,
  PaymentRow,
} from "@/lib/excel-processor";

// --- localStorage helpers ---
const LS_METHODS = "kasa-methods";
const LS_VIDEO = "kasa-video";
const LS_ROLE = "kasa-role";

function loadMethods(): PaymentMethod[] {
  if (typeof window === "undefined") return DEFAULT_METHODS;
  try {
    const raw = localStorage.getItem(LS_METHODS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_METHODS;
}

function saveMethods(m: PaymentMethod[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LS_METHODS, JSON.stringify(m));
  }
}

function loadVideo(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LS_VIDEO) || "";
}

function saveVideo(url: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LS_VIDEO, url);
  }
}

function loadRole(): UserRole {
  if (typeof window === "undefined") return "basic";
  return sessionStorage.getItem(LS_ROLE) === "master" ? "master" : "basic";
}

function saveRole(r: UserRole) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(LS_ROLE, r);
  }
}

// --- Types ---
export type UserRole = "basic" | "master";
const MASTER_PASSWORD = "Kk028200";

interface StoreContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  verifyMasterPassword: (password: string) => boolean;

  methods: PaymentMethod[];
  setMethods: (methods: PaymentMethod[]) => void;

  kasaData: KasaCardData[];
  loadExcelData: (data: KasaCardData[]) => void;
  resetToDemo: () => void;

  videoUrl: string;
  setVideoUrl: (url: string) => void;

  rawRows: PaymentRow[];
  setRawRows: (rows: PaymentRow[]) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(loadRole);
  const [methods, setMethodsState] = useState<PaymentMethod[]>(loadMethods);
  const [kasaData, setKasaData] = useState<KasaCardData[]>(() =>
    generateDemoData(loadMethods()),
  );
  const [videoUrl, setVideoUrlState] = useState(loadVideo);
  const [rawRows, setRawRows] = useState<PaymentRow[]>([]);

  // --- Role ---
  const verifyMasterPassword = useCallback(
    (password: string): boolean => password === MASTER_PASSWORD,
    [],
  );

  const setRole = useCallback((r: UserRole) => {
    setRoleState(r);
    saveRole(r);
  }, []);

  // --- Video ---
  const setVideoUrl = useCallback((url: string) => {
    setVideoUrlState(url);
    saveVideo(url);
  }, []);

  // --- Excel ---
  const loadExcelData = useCallback((data: KasaCardData[]) => {
    setKasaData(data);
  }, []);

  const resetToDemo = useCallback(() => {
    setRawRows([]);
    setMethodsState((currentMethods) => {
      setKasaData(generateDemoData(currentMethods));
      return currentMethods;
    });
  }, []);

  // --- Methods (the critical part) ---
  const setMethods = useCallback((newMethods: PaymentMethod[]) => {
    setMethodsState(newMethods);
    saveMethods(newMethods);

    // Recalculate kasa data immediately
    setRawRows((currentRawRows) => {
      if (currentRawRows.length > 0) {
        setKasaData(processExcelData(currentRawRows, newMethods));
      } else {
        setKasaData(generateDemoData(newMethods));
      }
      return currentRawRows;
    });
  }, []);

  // --- Context value ---
  const value = useMemo(
    () => ({
      role,
      setRole,
      verifyMasterPassword,
      methods,
      setMethods,
      kasaData,
      loadExcelData,
      resetToDemo,
      videoUrl,
      setVideoUrl,
      rawRows,
      setRawRows,
    }),
    [
      role,
      setRole,
      verifyMasterPassword,
      methods,
      setMethods,
      kasaData,
      loadExcelData,
      resetToDemo,
      videoUrl,
      setVideoUrl,
      rawRows,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
