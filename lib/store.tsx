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
  generateInitialData,
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
      // Supabase sync failed - localStorage still works
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

// --- Supabase Odeme helpers ---
async function fetchOdemelerFromSupabase(): Promise<OdemeKaydi[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("odeme_kayitlari")
      .select("*")
      .order("tarih", { ascending: false });
    if (error || !data) return [];
    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      no: row.no as string,
      tarih: row.tarih as string,
      islemTipi: row.islem_tipi as IslemTipi,
      yontem: row.yontem as string,
      yontemId: (row.yontem_id as string) || undefined,
      hedefYontem: (row.hedef_yontem as string) || undefined,
      hedefYontemId: (row.hedef_yontem_id as string) || undefined,
      tutar: Number(row.tutar),
      dovizCinsi: row.doviz_cinsi as string,
      kur: row.kur ? Number(row.kur) : undefined,
      tutarTL: Number(row.tutar_tl),
      gonderen: (row.gonderen as string) || "",
      alici: (row.alici as string) || "",
      aciklama: (row.aciklama as string) || "",
      txKodu: (row.tx_kodu as string) || undefined,
    }));
  } catch {
    return [];
  }
}

async function insertOdemeToSupabase(odeme: OdemeKaydi) {
  try {
    const supabase = createClient();
    await supabase.from("odeme_kayitlari").insert({
      id: odeme.id,
      no: odeme.no,
      tarih: odeme.tarih,
      islem_tipi: odeme.islemTipi,
      yontem: odeme.yontem,
      yontem_id: odeme.yontemId || null,
      hedef_yontem: odeme.hedefYontem || null,
      hedef_yontem_id: odeme.hedefYontemId || null,
      tutar: odeme.tutar,
      doviz_cinsi: odeme.dovizCinsi,
      kur: odeme.kur || null,
      tutar_tl: odeme.tutarTL,
      gonderen: odeme.gonderen,
      alici: odeme.alici,
      aciklama: odeme.aciklama,
      tx_kodu: odeme.txKodu || null,
    });
  } catch {
    /* silent */
  }
}

async function deleteOdemeFromSupabase(id: string) {
  try {
    const supabase = createClient();
    await supabase.from("odeme_kayitlari").delete().eq("id", id);
  } catch {
    /* silent */
  }
}

// --- Payment (Odeme) Types ---
export type IslemTipi = "odeme-yap" | "odeme-al" | "transfer";

export interface OdemeKaydi {
  id: string;
  no: string; // #001, #002, ...
  tarih: string; // ISO string
  islemTipi: IslemTipi;
  yontem: string; // kasa adi veya "Dis Kasa" (gorsel isim)
  yontemId?: string; // method.id — isim degisse bile eslestirme bozulmaz
  hedefYontem?: string; // sadece transfer icin
  hedefYontemId?: string; // hedef method.id
  tutar: number;
  dovizCinsi: string; // "TRY", "USDT", vs.
  kur?: number; // doviz kuru (opsiyonel)
  tutarTL: number; // TL karsiligi
  gonderen: string;
  alici: string;
  aciklama: string;
  txKodu?: string; // kripto islemler icin transaction hash/kodu
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
    generateInitialData(loadMethodsFromCache()),
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
      let activeMethods = sbMethods && sbMethods.length > 0 ? sbMethods : loadMethodsFromCache();

      if (sbMethods && sbMethods.length > 0) {
        setMethodsState(sbMethods);
        cacheMethodsLocally(sbMethods);
      } else {
        const localMethods = loadMethodsFromCache();
        if (localMethods.length > 0) {
          setMethodsState(localMethods);
          activeMethods = localMethods;
          // Supabase'e kaydet (arka planda)
          const hasCustomData = localMethods.some(
            (m) => (m.excelKolonAdi && m.excelKolonAdi.length > 0) || m.baslangicBakiye !== 0
          );
          if (hasCustomData) {
            syncMethodsToSupabase(localMethods);
          }
        }
      }

      // Bot tarafindan yuklenen kasa verisini kontrol et
      let botRowsLoaded = false;
      try {
        const botRowsJson = await loadSettingFromSupabase("bot_raw_rows");
        
        if (botRowsJson) {
          const botRows = JSON.parse(botRowsJson);
          if (Array.isArray(botRows) && botRows.length > 0) {
            setRawRows(botRows);
            // Bot raw rows'u guncel methods ile yeniden hesapla
            // (kullanicinin komisyon/bakiye degisiklikleri korunur)
            setKasaData(processExcelData(botRows, activeMethods));
            botRowsLoaded = true;
          }
        }
      } catch {
        /* bot data parse failed, continue with normal flow */
      }

      // Bot verisi yoksa normal akis
      if (!botRowsLoaded) {
        setRawRows((currentRawRows) => {
          if (currentRawRows.length === 0) {
            setKasaData(generateInitialData(activeMethods));
          } else {
            setKasaData(processExcelData(currentRawRows, activeMethods));
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

      // Load odemeler from Supabase (persistent records)
      const sbOdemeler = await fetchOdemelerFromSupabase();
      if (sbOdemeler.length > 0) {
        setOdemeler(sbOdemeler);
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
    // Gunluk snapshot kaydet (haftalik kumulatif icin)
    saveKasaSnapshot(data);
  }, []);

  function saveKasaSnapshot(data: KasaCardData[]) {
    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const totalKasa = data.reduce((s, k) => s + k.kalanKasa, 0);
      const totalYatirim = data.reduce((s, k) => s + k.toplamBorc, 0);
      const totalKomisyon = data.reduce((s, k) => s + k.komisyon, 0);
      const totalCekim = data.reduce((s, k) => s + k.toplamKredi, 0);
      const details = data.map((k) => ({
        name: k.odemeTuruAdi,
        yatirim: k.toplamBorc,
        komisyon: k.komisyon,
        komisyonOrani: k.komisyonOrani,
        netYatirim: k.netBorc,
        cekim: k.toplamKredi,
        cekimKomisyon: k.cekimKomisyon,
        cekimKomisyonOrani: k.cekimKomisyonOrani,
        kalan: k.kalanKasa,
        baslangicBakiye: k.baslangicBakiye,
      }));

      // Oncekileri sil, sonra ekle (unique index olmadan guvenli)
      supabase
        .from("kasa_snapshots")
        .delete()
        .eq("snapshot_hour", "daily")
        .eq("snapshot_date", today)
        .then(() =>
          supabase
            .from("kasa_snapshots")
            .insert({
              snapshot_hour: "daily",
              snapshot_date: today,
              total_kasa: totalKasa,
              total_yatirim: totalYatirim,
              total_komisyon: totalKomisyon,
              total_cekim: totalCekim,
              details,
            }),
        )
        .then(() => { /* silent */ })
        .catch(() => { /* silent */ });
    } catch {
      /* silent */
    }
  }

  // --- Odeme sistemi ---
  // Kasa eslestirme: yontemId varsa method.id ile, yoksa isimle esle
  function kasaMatch(kasa: KasaCardData, yontemIsmi: string, yontemId?: string): boolean {
    if (yontemId) {
      // Method id ile esledirmeye calis — methods'tan ismi bul
      const m = methods.find((me) => me.id === yontemId);
      if (m) return kasa.odemeTuruAdi === m.name;
    }
    // Fallback: isim ile esle (eski kayitlar icin)
    return kasa.odemeTuruAdi === yontemIsmi;
  }

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

      // Supabase'e kaydet (arka planda, kalici)
      insertOdemeToSupabase(yeniOdeme);

      // Kasa bakiyesini guncelle
      setKasaData((prev) =>
        prev.map((kasa) => {
          let delta = 0;
          if (input.islemTipi === "odeme-yap" && kasaMatch(kasa, input.yontem, input.yontemId)) {
            delta = -input.tutarTL;
          } else if (input.islemTipi === "odeme-al" && kasaMatch(kasa, input.yontem, input.yontemId)) {
            delta = input.tutarTL;
          } else if (input.islemTipi === "transfer") {
            if (kasaMatch(kasa, input.yontem, input.yontemId)) delta = -input.tutarTL;
            if (kasaMatch(kasa, input.hedefYontem || "", input.hedefYontemId)) delta = input.tutarTL;
          }
          if (delta === 0) return kasa;
          return { ...kasa, kalanKasa: kasa.kalanKasa + delta };
        }),
      );

      return yeniOdeme;
    },
    [odemeler.length, methods],
  );

  const odemeSil = useCallback(
    (id: string) => {
      // Supabase'den sil (arka planda)
      deleteOdemeFromSupabase(id);

      setOdemeler((prev) => {
        const silinecek = prev.find((o) => o.id === id);
        if (!silinecek) return prev;

        // Kasa bakiyesini geri al (ters islem)
        setKasaData((prevKasa) =>
          prevKasa.map((kasa) => {
            let delta = 0;
            if (silinecek.islemTipi === "odeme-yap" && kasaMatch(kasa, silinecek.yontem, silinecek.yontemId)) {
              delta = silinecek.tutarTL;
            } else if (silinecek.islemTipi === "odeme-al" && kasaMatch(kasa, silinecek.yontem, silinecek.yontemId)) {
              delta = -silinecek.tutarTL;
            } else if (silinecek.islemTipi === "transfer") {
              if (kasaMatch(kasa, silinecek.yontem, silinecek.yontemId)) delta = silinecek.tutarTL;
              if (kasaMatch(kasa, silinecek.hedefYontem || "", silinecek.hedefYontemId)) delta = -silinecek.tutarTL;
            }
            if (delta === 0) return kasa;
            return { ...kasa, kalanKasa: kasa.kalanKasa + delta };
          }),
        );

        return prev.filter((o) => o.id !== id);
      });
    },
    [methods],
  );

  // --- Methods (sync to both localStorage and Supabase) ---
  const setMethods = useCallback((newMethods: PaymentMethod[]) => {
    // Instant: update React state + localStorage (non-blocking)
    setMethodsState(newMethods);
    cacheMethodsLocally(newMethods);

    // Immediate sync to Supabase (caller already debounces if needed)
    syncMethodsToSupabase(newMethods);

    // Recalculate kasa data immediately
    setRawRows((currentRawRows) => {
      if (currentRawRows.length > 0) {
        setKasaData(processExcelData(currentRawRows, newMethods));
      } else {
        setKasaData(generateInitialData(newMethods));
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
