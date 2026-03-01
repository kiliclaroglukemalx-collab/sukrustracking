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
import { DEFAULT_METHODS } from "@/lib/excel-processor";
import type { PaymentMethod } from "@/lib/excel-processor";
import {
  getMethods,
  syncMethods,
  getSetting,
  saveSetting,
  getOdemeler,
  createOdeme,
  deleteOdeme,
} from "@/lib/actions";

// Re-export for components that import from store
export { saveSetting as saveSettingToSupabase, getSetting as loadSettingFromSupabase } from "@/lib/actions";

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

// --- Payment (Odeme) Types ---
export type IslemTipi = "odeme-yap" | "odeme-al" | "transfer";

export interface OdemeKaydi {
  id: string;
  no: string;
  tarih: string;
  islemTipi: IslemTipi;
  yontem: string;
  yontemId?: string;
  hedefYontem?: string;
  hedefYontemId?: string;
  tutar: number;
  dovizCinsi: string;
  kur?: number;
  tutarTL: number;
  gonderen: string;
  alici: string;
  aciklama: string;
  txKodu?: string;
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

  videoUrl: string;
  setVideoUrl: (url: string) => void;

  dbReady: boolean;

  odemeler: OdemeKaydi[];
  odemeEkle: (odeme: Omit<OdemeKaydi, "id" | "no" | "tarih">) => OdemeKaydi;
  odemeSil: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(loadRole);
  const [methods, setMethodsState] = useState<PaymentMethod[]>(loadMethodsFromCache);
  const [videoUrl, setVideoUrlState] = useState(loadVideo);
  const [dbReady, setDbReady] = useState(false);
  const [odemeler, setOdemeler] = useState<OdemeKaydi[]>([]);
  const initDone = useRef(false);

  // --- On mount: fetch from DB (source of truth) ---
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    (async () => {
      const dbMethods = await getMethods();
      if (dbMethods && dbMethods.length > 0) {
        setMethodsState(dbMethods);
        cacheMethodsLocally(dbMethods);
      } else {
        const localMethods = loadMethodsFromCache();
        if (localMethods.length > 0) {
          setMethodsState(localMethods);
          const hasCustomData = localMethods.some(
            (m) => (m.excelKolonAdi && m.excelKolonAdi.length > 0) || m.baslangicBakiye !== 0
          );
          if (hasCustomData) {
            syncMethods(localMethods);
          }
        }
      }

      const sbVideo = await getSetting("video_url");
      if (sbVideo !== null) {
        setVideoUrlState(sbVideo);
        saveVideo(sbVideo);
      }

      const sbOdemeler = await getOdemeler();
      if (sbOdemeler.length > 0) {
        setOdemeler(sbOdemeler);
      }

      setDbReady(true);
    })();
  }, []);

  const verifyMasterPassword = useCallback(
    (password: string): boolean => password === MASTER_PASSWORD,
    [],
  );

  const setRole = useCallback((r: UserRole) => {
    setRoleState(r);
    saveRole(r);
  }, []);

  const setVideoUrl = useCallback((url: string) => {
    setVideoUrlState(url);
    saveVideo(url);
    saveSetting("video_url", url);
  }, []);

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
      createOdeme(yeniOdeme);
      return yeniOdeme;
    },
    [odemeler.length],
  );

  const odemeSil = useCallback((id: string) => {
    deleteOdeme(id);
    setOdemeler((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const setMethods = useCallback((newMethods: PaymentMethod[]) => {
    setMethodsState(newMethods);
    cacheMethodsLocally(newMethods);
    syncMethods(newMethods);
  }, []);

  const value = useMemo(
    () => ({
      role,
      setRole,
      verifyMasterPassword,
      methods,
      setMethods,
      videoUrl,
      setVideoUrl,
      dbReady,
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
      videoUrl,
      setVideoUrl,
      dbReady,
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
