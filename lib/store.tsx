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
// Local storage keys for offline cache
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
// Store methods as JSON in app_settings to avoid column mismatch issues
async function fetchMethodsFromSupabase(): Promise<PaymentMethod[] | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "methods_json")
      .single();

    if (error || !data?.value) return null;

    const parsed = JSON.parse(data.value);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

async function syncMethodsToSupabase(methods: PaymentMethod[]) {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        { key: "methods_json", value: JSON.stringify(methods) },
        { onConflict: "key" },
      );
    if (error) {
      console.log("[v0] Supabase methods sync failed:", error.message);
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

// --- Payment (Odeme) Types ---
export type IslemTipi = "odeme-yap" | "odeme-al" | "transfer";

export interface OdemeKaydi {
  id: string;
  no: string; // #001, #002, ...
  tarih: string; // ISO string
  islemTipi: IslemTipi;
  yontem: string; // kasa adi veya "Dis Kasa"
  hedefYontem?: string; // sadece transfer icin
  tutar: number;
  dovizCinsi: string; // "TRY", "USDT", vs.
  kur?: number; // doviz kuru (opsiyonel)
  tutarTL: number; // TL karsiligi
  gonderen: string;
  alici: string;
  aciklama: string;
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

  // Odeme sistemi
  odemeler: OdemeKaydi[];
  odemeEkle: (odeme: Omit<OdemeKaydi, "id" | "no" | "tarih">) => OdemeKaydi;
  odemeSil: (id: string) => void;
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
  const [odemeler, setOdemeler] = useState<OdemeKaydi[]>([]);
  const initDone = useRef(false);

  // --- On mount: fetch from Supabase (source of truth) ---
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    (async () => {
      // Load methods from Supabase (source of truth)
      const sbMethods = await fetchMethodsFromSupabase();
      if (sbMethods && sbMethods.length > 0) {
        setMethodsState(sbMethods);
        cacheMethodsLocally(sbMethods);
        // Only reset to demo if no Excel data has been loaded yet
        setRawRows((currentRawRows) => {
          if (currentRawRows.length === 0) {
            setKasaData(generateDemoData(sbMethods));
          } else {
            setKasaData(processExcelData(currentRawRows, sbMethods));
          }
          return currentRawRows;
        });
      } else {
        // Supabase has no methods yet -- push current localStorage methods to Supabase
        const localMethods = loadMethodsFromCache();
        if (localMethods.length > 0 && localMethods[0].id !== DEFAULT_METHODS[0].id) {
          syncMethodsToSupabase(localMethods);
        }
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

  // --- Odeme sistemi ---
  const odemeEkle = useCallback(
    (input: Omit<OdemeKaydi, "id" | "no" | "tarih">): OdemeKaydi => {
      const now = new Date();
      const yeniOdeme: OdemeKaydi = {
        ...input,
        id: `odeme-${Date.now()}`,
        no: `#${String((odemeler.length + 1)).padStart(3, "0")}`,
        tarih: now.toISOString(),
      };

      setOdemeler((prev) => [yeniOdeme, ...prev]);

      // Kasa bakiyesini guncelle
      setKasaData((prev) =>
        prev.map((kasa) => {
          let delta = 0;
          if (input.islemTipi === "odeme-yap" && kasa.odemeTuruAdi === input.yontem) {
            delta = -input.tutarTL; // kasadan cikis
          } else if (input.islemTipi === "odeme-al" && kasa.odemeTuruAdi === input.yontem) {
            delta = input.tutarTL; // kasaya giris
          } else if (input.islemTipi === "transfer") {
            if (kasa.odemeTuruAdi === input.yontem) delta = -input.tutarTL;
            if (kasa.odemeTuruAdi === input.hedefYontem) delta = input.tutarTL;
          }
          if (delta === 0) return kasa;
          return { ...kasa, kalanKasa: kasa.kalanKasa + delta };
        }),
      );

      return yeniOdeme;
    },
    [odemeler.length],
  );

  const odemeSil = useCallback(
    (id: string) => {
      setOdemeler((prev) => {
        const silinecek = prev.find((o) => o.id === id);
        if (!silinecek) return prev;

        // Kasa bakiyesini geri al (ters islem)
        setKasaData((prevKasa) =>
          prevKasa.map((kasa) => {
            let delta = 0;
            if (silinecek.islemTipi === "odeme-yap" && kasa.odemeTuruAdi === silinecek.yontem) {
              delta = silinecek.tutarTL; // geri ekle
            } else if (silinecek.islemTipi === "odeme-al" && kasa.odemeTuruAdi === silinecek.yontem) {
              delta = -silinecek.tutarTL; // geri cikar
            } else if (silinecek.islemTipi === "transfer") {
              if (kasa.odemeTuruAdi === silinecek.yontem) delta = silinecek.tutarTL;
              if (kasa.odemeTuruAdi === silinecek.hedefYontem) delta = -silinecek.tutarTL;
            }
            if (delta === 0) return kasa;
            return { ...kasa, kalanKasa: kasa.kalanKasa + delta };
          }),
        );

        return prev.filter((o) => o.id !== id);
      });
    },
    [],
  );

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
      odemeler,
      odemeEkle,
      odemeSil,
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
      odemeler,
      odemeEkle,
      odemeSil,
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
