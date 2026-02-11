"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  DEFAULT_METHODS,
  generateDemoData,
  processExcelData,
} from "@/lib/excel-processor";
import type { KasaCardData, PaymentMethod, PaymentRow } from "@/lib/excel-processor";

type UserRole = "basic" | "master";

interface StoreContextValue {
  // User role
  role: UserRole;
  setRole: (role: UserRole) => void;

  // Methods
  methods: PaymentMethod[];
  setMethods: (methods: PaymentMethod[]) => void;

  // Kasa data
  kasaData: KasaCardData[];
  loadExcelData: (data: KasaCardData[]) => void;
  resetToDemo: () => void;
  recalculate: (newMethods: PaymentMethod[]) => void;

  // Video
  videoUrl: string;
  setVideoUrl: (url: string) => void;

  // Raw rows for recalculation
  rawRows: PaymentRow[];
  setRawRows: (rows: PaymentRow[]) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("master");
  const [methods, setMethodsState] = useState<PaymentMethod[]>(DEFAULT_METHODS);
  const [kasaData, setKasaData] = useState<KasaCardData[]>(() =>
    generateDemoData(DEFAULT_METHODS),
  );
  const [videoUrl, setVideoUrl] = useState("");
  const [rawRows, setRawRows] = useState<PaymentRow[]>([]);

  const loadExcelData = useCallback((data: KasaCardData[]) => {
    setKasaData(data);
  }, []);

  const resetToDemo = useCallback(() => {
    setRawRows([]);
    setKasaData(generateDemoData(methods));
  }, [methods]);

  const recalculate = useCallback(
    (newMethods: PaymentMethod[]) => {
      if (rawRows.length > 0) {
        setKasaData(processExcelData(rawRows, newMethods));
      } else {
        // Recalculate from current kasa data
        const rows = kasaData.map((d) => ({
          odemeTuruAdi: d.odemeTuruAdi,
          borc: d.toplamBorc,
          kredi: d.toplamKredi,
        }));
        setKasaData(processExcelData(rows, newMethods));
      }
    },
    [rawRows, kasaData],
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
    [role, methods, setMethods, kasaData, loadExcelData, resetToDemo, recalculate, videoUrl, rawRows],
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
