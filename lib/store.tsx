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
import type { KasaCardData, PaymentMethod, PaymentRow } from "@/lib/excel-processor";

function getInitialRole(): UserRole {
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem("kasa-role");
    if (stored === "master") return "master";
  }
  return "basic";
}

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
  recalculate: (newMethods: PaymentMethod[]) => void;

  videoUrl: string;
  setVideoUrl: (url: string) => void;

  rawRows: PaymentRow[];
  setRawRows: (rows: PaymentRow[]) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(getInitialRole);
  const [methods, setMethodsState] = useState<PaymentMethod[]>(DEFAULT_METHODS);
  const [kasaData, setKasaData] = useState<KasaCardData[]>(() =>
    generateDemoData(DEFAULT_METHODS),
  );
  const [videoUrl, setVideoUrl] = useState("");
  const [rawRows, setRawRows] = useState<PaymentRow[]>([]);

  const verifyMasterPassword = useCallback((password: string): boolean => {
    return password === MASTER_PASSWORD;
  }, []);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("kasa-role", newRole);
    }
  }, []);

  const loadExcelData = useCallback((data: KasaCardData[]) => {
    setKasaData(data);
  }, []);

  const resetToDemo = useCallback(() => {
    setRawRows([]);
    setKasaData(generateDemoData(methods));
  }, [methods]);

  const recalculate = useCallback(
    (newMethods: PaymentMethod[]) => {
      setRawRows((currentRawRows) => {
        if (currentRawRows.length > 0) {
          setKasaData(processExcelData(currentRawRows, newMethods));
        } else {
          setKasaData((currentKasaData) => {
            const rows = currentKasaData.map((d) => ({
              odemeTuruAdi: d.odemeTuruAdi,
              borc: d.toplamBorc,
              kredi: d.toplamKredi,
            }));
            return processExcelData(rows, newMethods);
          });
        }
        return currentRawRows;
      });
    },
    [],
  );

  const setMethods = useCallback(
    (newMethods: PaymentMethod[]) => {
      setMethodsState(newMethods);
      recalculate(newMethods);
    },
    [recalculate],
  );

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
      recalculate,
      videoUrl,
      setVideoUrl,
      rawRows,
      setRawRows,
    }),
    [role, setRole, verifyMasterPassword, methods, setMethods, kasaData, loadExcelData, resetToDemo, recalculate, videoUrl, rawRows],
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
