"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import { createClient } from "@/lib/supabase/client";

// --- localStorage helpers (fast cache / offline fallback) ---
const LS_METHODS = "kasa-methods";
const LS_VIDEO = "kasa-video";
const LS_ROLE = "kasa-role";

function loadMethodsFromCache(): PaymentMethod[] {
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

function cacheMethodsLocally(m: PaymentMethod[]) {
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

// --- Supabase helpers ---
async function fetchMethodsFromSupabase(): Promise<PaymentMethod[] | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) return null;

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      komisyonOrani: (row.komisyon_orani as number) || 0,
      cekimKomisyonOrani: (row.cekim_komisyon_orani as number) || 0,
      baslangicBakiye: (row.baslangic_bakiye as number) || 0,
    }));
  } catch {
    return null;
  }
}

async function syncMethodsToSupabase(methods: PaymentMethod[]) {
  try {
    const supabase = createClient();

    // Delete all existing methods and re-insert (simple full sync)
    await supabase.from("payment_methods").delete().neq("id", "__never__");

    const rows = methods.map((m, i) => ({
      id: m.id,
      name: m.name,
      komisyon_orani: m.komisyonOrani,
      cekim_komisyon_orani: m.cekimKomisyonOrani ?? 0,
      baslangic_bakiye: m.baslangicBakiye,
      sort_order: i,
    }));

    if (rows.length > 0) {
      await supabase.from("payment_methods").insert(rows);
    }
  } catch {
    // Silently fail - localStorage still works as fallback
  }
}

async function saveSettingToSupabase(key: string, value: string) {
  try {
    const supabase = createClient();
    await supabase
      .from("app_settings")
      .upsert({ key, value }, { onConflict: "key" });
  } catch {
    /* silent */
  }
}

async function loadSettingFromSupabase(
  key: string,
): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .single();
    return data?.value ?? null;
  } catch {
    return null;
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

  supabaseReady: boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(loadRole);
  const [methods, setMethodsState] = useState<PaymentMethod[]>(loadMethodsFromCache);
  const [kasaData, setKasaData] = useState<KasaCardData[]>(() =>
    generateDemoData(loadMethodsFromCache()),
  );
  const [videoUrl, setVideoUrlState] = useState(loadVideo);
  const [rawRows, setRawRows] = useState<PaymentRow[]>([]);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const initDone = useRef(false);

  // --- On mount: fetch from Supabase (source of truth) ---
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    (async () => {
      // Load methods from Supabase
      const sbMethods = await fetchMethodsFromSupabase();
      if (sbMethods && sbMethods.length > 0) {
        setMethodsState(sbMethods);
        cacheMethodsLocally(sbMethods);
        setKasaData(generateDemoData(sbMethods));
      }

      // Load video URL from Supabase
      const sbVideo = await loadSettingFromSupabase("video_url");
      if (sbVideo !== null) {
        setVideoUrlState(sbVideo);
        saveVideo(sbVideo);
      }

      setSupabaseReady(true);
    })();
  }, []);

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
    saveSettingToSupabase("video_url", url);
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

  // --- Methods (sync to both localStorage and Supabase) ---
  const setMethods = useCallback((newMethods: PaymentMethod[]) => {
    setMethodsState(newMethods);
    cacheMethodsLocally(newMethods);
    syncMethodsToSupabase(newMethods);

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
      supabaseReady,
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
      supabaseReady,
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
