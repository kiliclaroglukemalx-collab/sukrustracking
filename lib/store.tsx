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

    if (error) {
      console.log("[v0] Supabase fetch error:", error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    // Cache detected columns
    detectedColumns = Object.keys(data[0]);

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      excelKolonAdi: typeof row.excel_kolon_adi === "string" ? row.excel_kolon_adi : "",
      komisyonOrani: typeof row.komisyon_orani === "number" ? row.komisyon_orani : 0,
      cekimKomisyonOrani: typeof row.cekim_komisyon_orani === "number" ? row.cekim_komisyon_orani : 0,
      baslangicBakiye: typeof row.baslangic_bakiye === "number" ? row.baslangic_bakiye : 0,
    }));
  } catch {
    return null;
  }
}

// Detect which columns the table has (cached per session)
let detectedColumns: string[] | null = null;

async function detectTableColumns(): Promise<string[]> {
  if (detectedColumns) return detectedColumns;
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .limit(1);
    if (data && data.length > 0) {
      detectedColumns = Object.keys(data[0]);
    } else {
      // Table is empty -- try inserting a test row to see what columns exist
      // Use the minimal set first
      detectedColumns = ["id", "name", "komisyon_orani", "baslangic_bakiye", "sort_order"];
    }
  } catch {
    detectedColumns = ["id", "name", "komisyon_orani", "baslangic_bakiye", "sort_order"];
  }
  return detectedColumns;
}

async function syncMethodsToSupabase(methods: PaymentMethod[]) {
  try {
    const supabase = createClient();
    const cols = await detectTableColumns();

    const hasExcelKolonAdi = cols.includes("excel_kolon_adi");
    const hasCekimKomisyon = cols.includes("cekim_komisyon_orani");

    const rows = methods.map((m, i) => {
      const row: Record<string, unknown> = {
        id: m.id,
        name: m.name,
        komisyon_orani: m.komisyonOrani,
        baslangic_bakiye: m.baslangicBakiye,
        sort_order: i,
      };
      if (hasExcelKolonAdi) row.excel_kolon_adi = m.excelKolonAdi ?? "";
      if (hasCekimKomisyon) row.cekim_komisyon_orani = m.cekimKomisyonOrani ?? 0;
      return row;
    });

    if (rows.length > 0) {
      // Use upsert instead of delete+insert to avoid data loss on partial failure
      const { error } = await supabase
        .from("payment_methods")
        .upsert(rows, { onConflict: "id" });

      if (error) {
        console.log("[v0] Supabase upsert failed:", error.message);
      } else {
        // Clean up rows that no longer exist
        const currentIds = methods.map((m) => m.id);
        await supabase
          .from("payment_methods")
          .delete()
          .not("id", "in", `(${currentIds.join(",")})`);
      }
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
  loadExcelData: (data: KasaCardData[], rows?: PaymentRow[]) => void;
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
        // Only reset to demo if no Excel data has been loaded yet
        setRawRows((currentRawRows) => {
          if (currentRawRows.length === 0) {
            setKasaData(generateDemoData(sbMethods));
          } else {
            // Re-process with updated methods from Supabase
            setKasaData(processExcelData(currentRawRows, sbMethods));
          }
          return currentRawRows;
        });
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
  const loadExcelData = useCallback((data: KasaCardData[], rows?: PaymentRow[]) => {
    setKasaData(data);
    if (rows) {
      setRawRows(rows);
    }
  }, []);

  const resetToDemo = useCallback(() => {
    setRawRows([]);
    setMethodsState((currentMethods) => {
      setKasaData(generateDemoData(currentMethods));
      return currentMethods;
    });
  }, []);

  // --- Methods (sync to both localStorage and Supabase) ---
  const supabaseSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setMethods = useCallback((newMethods: PaymentMethod[]) => {
    // Instant: update React state + localStorage (non-blocking)
    setMethodsState(newMethods);
    cacheMethodsLocally(newMethods);

    // Debounced: sync to Supabase after 500ms of inactivity
    if (supabaseSyncTimer.current) clearTimeout(supabaseSyncTimer.current);
    supabaseSyncTimer.current = setTimeout(() => {
      syncMethodsToSupabase(newMethods);
    }, 500);

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
