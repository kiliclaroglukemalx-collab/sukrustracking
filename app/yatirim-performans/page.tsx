"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  Check,
  Calendar,
  Wallet,
  BarChart3,
  Lock,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import { useStore, saveSettingToSupabase, loadSettingFromSupabase } from "@/lib/store";
import type { KasaCardData } from "@/lib/excel-processor";
import { parseExcelFile, processExcelData } from "@/lib/excel-processor";
import { createClient } from "@/lib/supabase/client";

/* ─── Types ─── */
interface SnapshotDetail {
  name: string;
  yatirim: number;
  komisyon: number;
  komisyonOrani: number;
  netYatirim: number;
  cekim: number;
  cekimKomisyon: number;
  cekimKomisyonOrani: number;
  kalan: number;
}

interface KasaSnapshot {
  snapshot_hour: string;
  snapshot_date: string;
  total_kasa: number;
  total_yatirim: number;
  total_komisyon: number;
  total_cekim: number;
  details: SnapshotDetail[];
}

interface ManuelSatir {
  id: number;
  ad: string;
  yatirim: string;
  cekim: string;
  onaylandi: boolean;
}

/** snapshot_hour "range:2026-02-08" ise baslangic tarihini dondurur, degilse null */
function parseRangeStart(sn: KasaSnapshot): string | null {
  if (sn.snapshot_hour.startsWith("range:")) return sn.snapshot_hour.slice(6);
  return null;
}

/** Snapshot'un gorunum etiketi: "Per 12/02" veya "08/02 — 14/02" */
function snapshotLabel(sn: KasaSnapshot): string {
  const rangeStart = parseRangeStart(sn);
  if (rangeStart) {
    return `${fmtDate(rangeStart)} — ${fmtDate(sn.snapshot_date)}`;
  }
  return `${gunKisa(sn.snapshot_date)} ${fmtDate(sn.snapshot_date)}`;
}

/* ─── Helpers ─── */
const GUN_ISIMLERI: Record<number, string> = {
  0: "Pazar",
  1: "Pazartesi",
  2: "Sali",
  3: "Carsamba",
  4: "Persembe",
  5: "Cuma",
  6: "Cumartesi",
};

function fmt(v: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return fmt(v);
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}

function gunIsmi(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return GUN_ISIMLERI[d.getDay()] || "";
}

function gunKisa(iso: string): string {
  return gunIsmi(iso).slice(0, 3);
}

/* ─── Telegram text generators ─── */
function generateGunlukMetni(kasaData: KasaCardData[]): string {
  const aktif = kasaData.filter((k) => k.toplamBorc > 0 || k.toplamKredi > 0);
  if (aktif.length === 0) return "";
  const now = new Date();
  const tarih = now.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const saat = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const tY = aktif.reduce((s, k) => s + k.toplamBorc, 0);
  const tK = aktif.reduce((s, k) => s + k.komisyon, 0);
  const tC = aktif.reduce((s, k) => s + k.toplamKredi, 0);
  const tN = aktif.reduce((s, k) => s + k.netBorc, 0);
  const tR = aktif.reduce((s, k) => s + k.kalanKasa, 0);
  const lines: string[] = [];
  lines.push("📊 GUN ICI YATIRIM PERFORMANSI");
  lines.push(`📅 ${tarih} | ⏰ ${saat}`);
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");
  for (const k of aktif) {
    lines.push(`📋 ${k.odemeTuruAdi}`);
    lines.push(`   💰 Yatirim: ₺${fmt(k.toplamBorc)}`);
    if (k.komisyonOrani > 0) lines.push(`   📉 Komisyon: -₺${fmt(k.komisyon)} (%${k.komisyonOrani})`);
    if (k.toplamKredi > 0) lines.push(`   📤 Cekim: ₺${fmt(k.toplamKredi)}`);
    lines.push(`   🏦 Kalan: ₺${fmt(k.kalanKasa)}`);
    lines.push("");
  }
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(`💰 Toplam Yatirim: ₺${fmt(tY)}`);
  if (tK > 0) lines.push(`📉 Toplam Komisyon: -₺${fmt(tK)}`);
  lines.push(`💵 Net Yatirim: ₺${fmt(tN)}`);
  if (tC > 0) lines.push(`📤 Toplam Cekim: ₺${fmt(tC)}`);
  lines.push(`🏦 Toplam Kalan: ₺${fmt(tR)}`);
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  return lines.join("\n");
}

function generateHaftalikMetni(
  snapshots: KasaSnapshot[],
  weeklyMethods: { name: string; yatirim: number; komisyon: number; cekim: number }[],
): string {
  if (snapshots.length === 0) return "";
  const first = fmtDate(snapshots[0].snapshot_date);
  const last = fmtDate(snapshots[snapshots.length - 1].snapshot_date);
  const tY = snapshots.reduce((s, sn) => s + sn.total_yatirim, 0);
  const tK = snapshots.reduce((s, sn) => s + sn.total_komisyon, 0);
  const tC = snapshots.reduce((s, sn) => s + sn.total_cekim, 0);
  const lines: string[] = [];
  const monthName = new Date().toLocaleString("tr-TR", { month: "long", year: "numeric" });
  lines.push(`📊 AYLIK KUMULATIF OZET — ${monthName.toUpperCase()}`);
  lines.push(`📅 ${first} - ${last}`);
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");
  for (const sn of snapshots) {
    const isRange = sn.snapshot_hour.startsWith("range:");
    const tag = isRange ? " (haftalik)" : "";
    lines.push(`📅 ${snapshotLabel(sn)}${tag}: ₺${fmt(sn.total_yatirim)}`);
  }
  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  if (tK > 0) lines.push(`📉 Toplam Komisyon: -₺${fmt(tK)}`);
  if (tC > 0) lines.push(`📤 Toplam Cekim: ₺${fmt(tC)}`);
  lines.push("");
  if (weeklyMethods.length > 0) {
    lines.push("📋 YONTEM BAZLI:");
    for (const m of weeklyMethods) {
      lines.push(`  ${m.name}: ₺${fmt(m.yatirim)} yat. | -₺${fmt(m.komisyon)} kom. | ₺${fmt(m.cekim)} cek.`);
    }
  }
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  return lines.join("\n");
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

/* ─────────────────────────── PAGE ─────────────────────────── */
export default function YatirimPerformansPage() {
  const { role, kasaData, methods, loadExcelData } = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [snapshots, setSnapshots] = useState<KasaSnapshot[]>([]);
  const [gunlukCopied, setGunlukCopied] = useState(false);
  const [haftalikCopied, setHaftalikCopied] = useState(false);

  // Manuel giris — Supabase kalici
  const [manuelSatirlar, setManuelSatirlar] = useState<ManuelSatir[]>([]);
  const manuelIdRef = useRef(0);
  const manuelLoadedRef = useRef(false);

  // Supabase'den yukle (sayfa acilisinda)
  useEffect(() => {
    loadSettingFromSupabase("manuel_girisler").then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val) as ManuelSatir[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setManuelSatirlar(parsed);
            const maxId = parsed.reduce((mx, s) => Math.max(mx, s.id), 0);
            manuelIdRef.current = maxId;
          }
        } catch { /* ignore */ }
      }
      manuelLoadedRef.current = true;
    });
  }, []);

  // Her degisiklikte Supabase'e kaydet
  useEffect(() => {
    if (!manuelLoadedRef.current) return; // ilk yukleme tamamlanmadan kaydetme
    saveSettingToSupabase("manuel_girisler", JSON.stringify(manuelSatirlar));
  }, [manuelSatirlar]);

  const manuelEkle = useCallback(() => {
    manuelIdRef.current += 1;
    setManuelSatirlar((prev) => [...prev, { id: manuelIdRef.current, ad: "", yatirim: "", cekim: "", onaylandi: false }]);
  }, []);

  const manuelGuncelle = useCallback((id: number, field: keyof ManuelSatir, val: string) => {
    setManuelSatirlar((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: val, onaylandi: false } : s)));
  }, []);

  const manuelOnayla = useCallback((id: number) => {
    setManuelSatirlar((prev) => prev.map((s) => (s.id === id ? { ...s, onaylandi: true } : s)));
  }, []);

  const manuelSil = useCallback((id: number) => {
    setManuelSatirlar((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Excel upload state
  const [uploadTab, setUploadTab] = useState<"gunluk" | "gecmis">("gunluk");
  const [gecmisStart, setGecmisStart] = useState("");
  const [gecmisEnd, setGecmisEnd] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [uploadMsg, setUploadMsg] = useState("");
  const gunlukInputRef = useRef<HTMLInputElement>(null);
  const gecmisInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHydrated(true);
    fetchSnapshots();
  }, []);

  function fetchSnapshots() {
    fetch("/api/haftalik-kasa")
      .then((r) => r.json())
      .then((j) => { if (j.snapshots) setSnapshots(j.snapshots); })
      .catch(() => {});
  }

  /* ─── Excel upload handlers ─── */
  const handleGunlukUpload = useCallback(async (file: File) => {
    try {
      setUploadStatus("loading");
      const buffer = await file.arrayBuffer();
      const rows = parseExcelFile(buffer);
      const processed = processExcelData(rows, methods);
      loadExcelData(processed, rows);
      setUploadStatus("done");
      setUploadMsg(`Gunluk veri yuklendi: ${processed.length} yontem`);
      fetchSnapshots();
      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch {
      setUploadStatus("error");
      setUploadMsg("Dosya islenirken hata olustu");
      setTimeout(() => setUploadStatus("idle"), 3000);
    }
  }, [methods, loadExcelData]);

  const handleGecmisUpload = useCallback(async (file: File) => {
    if (!gecmisStart || !gecmisEnd) {
      setUploadStatus("error");
      setUploadMsg("Lutfen baslangic ve bitis tarihlerini secin");
      setTimeout(() => setUploadStatus("idle"), 3000);
      return;
    }
    if (gecmisStart > gecmisEnd) {
      setUploadStatus("error");
      setUploadMsg("Baslangic tarihi bitis tarihinden sonra olamaz");
      setTimeout(() => setUploadStatus("idle"), 3000);
      return;
    }
    try {
      setUploadStatus("loading");
      const buffer = await file.arrayBuffer();
      const rows = parseExcelFile(buffer);
      const processed = processExcelData(rows, methods);

      const totalKasa = processed.reduce((s, k) => s + k.kalanKasa, 0);
      const totalYatirim = processed.reduce((s, k) => s + k.toplamBorc, 0);
      const totalKomisyon = processed.reduce((s, k) => s + k.komisyon, 0);
      const totalCekim = processed.reduce((s, k) => s + k.toplamKredi, 0);
      const details = processed.map((k) => ({
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

      // Aralik icin TEK kumulatif snapshot kaydet
      const supabase = createClient();
      const isSingleDay = gecmisStart === gecmisEnd;
      const snapshotHour = isSingleDay ? "daily" : `range:${gecmisStart}`;
      const snapshotDate = gecmisEnd;

      // Eski ayni range kaydini sil
      await supabase
        .from("kasa_snapshots")
        .delete()
        .eq("snapshot_hour", snapshotHour)
        .eq("snapshot_date", snapshotDate);

      if (!isSingleDay) {
        // Aralik icerisindeki tum gunluk (daily) kayitlari sil
        // cunku range zaten o gunlerin kumulatifini iceriyor
        await supabase
          .from("kasa_snapshots")
          .delete()
          .eq("snapshot_hour", "daily")
          .gte("snapshot_date", gecmisStart)
          .lte("snapshot_date", gecmisEnd);

        // Aralik icinde eski range kayitlarini da sil (cakisma onlemi)
        const { data: oldRanges } = await supabase
          .from("kasa_snapshots")
          .select("snapshot_hour, snapshot_date")
          .like("snapshot_hour", "range:%")
          .gte("snapshot_date", gecmisStart)
          .lte("snapshot_date", gecmisEnd);

        if (oldRanges && oldRanges.length > 0) {
          for (const old of oldRanges) {
            await supabase
              .from("kasa_snapshots")
              .delete()
              .eq("snapshot_hour", old.snapshot_hour)
              .eq("snapshot_date", old.snapshot_date);
          }
        }
      } else {
        // Tek gunluk ise daily'yi de temizle
        await supabase
          .from("kasa_snapshots")
          .delete()
          .eq("snapshot_hour", "daily")
          .eq("snapshot_date", snapshotDate);
      }

      const { error } = await supabase
        .from("kasa_snapshots")
        .insert({
          snapshot_hour: snapshotHour,
          snapshot_date: snapshotDate,
          total_kasa: totalKasa,
          total_yatirim: totalYatirim,
          total_komisyon: totalKomisyon,
          total_cekim: totalCekim,
          details,
        });

      if (error) throw error;

      const label = isSingleDay
        ? `${snapshotDate} tarihli veri kaydedildi`
        : `${fmtDate(gecmisStart)} - ${fmtDate(gecmisEnd)} araligi kaydedildi`;

      setUploadStatus("done");
      setUploadMsg(`${label}: ${processed.length} yontem`);
      fetchSnapshots();
      setTimeout(() => setUploadStatus("idle"), 4000);
    } catch {
      setUploadStatus("error");
      setUploadMsg("Dosya islenirken hata olustu");
      setTimeout(() => setUploadStatus("idle"), 3000);
    }
  }, [methods, gecmisStart, gecmisEnd]);

  /* ─── Derived data ─── */
  const aktifKasa = useMemo(() => kasaData.filter((k) => k.toplamBorc > 0 || k.toplamKredi > 0), [kasaData]);
  const hasKasa = aktifKasa.length > 0;
  const hasSn = snapshots.length > 0;

  // Manuel satirlarin sayisal degerleri (%4.5 komisyon otomatik) — sadece onaylanmis satirlar
  const MANUEL_KOM_ORAN = 0.045;
  const parseNum = (v: string) => parseFloat(v.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
  const manuelTotals = useMemo(() => {
    let yatirim = 0;
    let cekim = 0;
    for (const s of manuelSatirlar) {
      if (!s.onaylandi) continue; // sadece onaylanmis satirlar toplama dahil
      yatirim += parseNum(s.yatirim);
      cekim += parseNum(s.cekim);
    }
    const komisyon = yatirim * MANUEL_KOM_ORAN;
    return { yatirim, cekim, komisyon };
  }, [manuelSatirlar]);

  const totals = useMemo(() => {
    const yatirim = aktifKasa.reduce((s, k) => s + k.toplamBorc, 0) + manuelTotals.yatirim;
    const komisyon = aktifKasa.reduce((s, k) => s + k.komisyon, 0) + manuelTotals.komisyon;
    const cekim = aktifKasa.reduce((s, k) => s + k.toplamKredi, 0) + manuelTotals.cekim;
    const cekimKom = aktifKasa.reduce((s, k) => s + k.cekimKomisyon, 0);
    // Net Kar = Toplam Yatirim - Komisyon - Cekim
    const netKar = yatirim - komisyon - cekim;
    return { yatirim, komisyon, cekim, cekimKom, netKar };
  }, [aktifKasa, manuelTotals]);

  const aylikTopYatirim = useMemo(() => snapshots.reduce((s, sn) => s + sn.total_yatirim, 0), [snapshots]);

  // Performans degisimi icin sadece gunluk (daily) snapshot'lari kullan
  const dailySnapshots = useMemo(() => snapshots.filter((sn) => sn.snapshot_hour === "daily"), [snapshots]);

  const yediGunOrt = useMemo(() => {
    if (dailySnapshots.length === 0) return new Map<string, number>();
    const acc = new Map<string, { total: number; count: number }>();
    for (const sn of dailySnapshots) {
      for (const d of sn.details) {
        const p = acc.get(d.name) || { total: 0, count: 0 };
        acc.set(d.name, { total: p.total + d.yatirim, count: p.count + 1 });
      }
    }
    const result = new Map<string, number>();
    acc.forEach((v, k) => result.set(k, v.count > 0 ? v.total / v.count : 0));
    return result;
  }, [dailySnapshots]);

  const weeklyMethods = useMemo(() => {
    if (snapshots.length === 0) return [];
    const acc = new Map<string, { yatirim: number; komisyon: number; cekim: number; kalan: number }>();
    for (const sn of snapshots) {
      for (const d of sn.details) {
        const p = acc.get(d.name) || { yatirim: 0, komisyon: 0, cekim: 0, kalan: 0 };
        acc.set(d.name, {
          yatirim: p.yatirim + d.yatirim,
          komisyon: p.komisyon + d.komisyon,
          cekim: p.cekim + d.cekim,
          kalan: p.kalan + d.kalan,
        });
      }
    }
    return Array.from(acc.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.yatirim - a.yatirim);
  }, [snapshots]);

  /* ─── Copy handlers ─── */
  const handleGunlukCopy = useCallback(async () => {
    const t = generateGunlukMetni(kasaData);
    if (!t) return;
    await copyText(t);
    setGunlukCopied(true);
    setTimeout(() => setGunlukCopied(false), 2500);
  }, [kasaData]);

  const handleHaftalikCopy = useCallback(async () => {
    const t = generateHaftalikMetni(snapshots, weeklyMethods);
    if (!t) return;
    await copyText(t);
    setHaftalikCopied(true);
    setTimeout(() => setHaftalikCopied(false), 2500);
  }, [snapshots, weeklyMethods]);

  /* ─── Guards ─── */
  if (!hydrated) return <div className="min-h-screen bg-black" />;

  if (role === "basic") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black">
        <Lock className="mb-4 h-8 w-8 text-neutral-600" strokeWidth={1.5} />
        <p className="mb-1 text-sm font-medium text-neutral-300">Erisim Engellendi</p>
        <p className="mb-6 text-xs text-neutral-500">Bu sayfa sadece Master kullanicilar icindir</p>
        <Link href="/" className="text-xs text-neutral-500 underline hover:text-white">Kasaya Don</Link>
      </div>
    );
  }

  const noData = !hasKasa && !hasSn;

  return (
    <div className="min-h-screen bg-black">

      {/* ━━━ HERO: Dark Section ━━━ */}
      <section className="relative overflow-hidden bg-black pb-12 pt-4">
        {/* Subtle gradient orb */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#1E5EFF]/8 blur-[120px]" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-emerald-500/6 blur-[100px]" />

        {/* Nav */}
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            <span>Kasa</span>
          </Link>
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-600">Performans</p>
        </div>

        {/* Title */}
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Yatirim Performansi
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Canli yontem bazli finansal gorunum ve haftalik karsilastirma
          </p>
        </div>

        {/* KPI Cards */}
        {hasKasa && (
          <div className="mx-auto mt-10 grid max-w-6xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Yatirim */}
            <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.05]">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E5EFF]/15">
                  <TrendingUp className="h-4 w-4 text-[#1E5EFF]" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total Yatirim</span>
              </div>
              <p className="font-mono text-2xl font-bold text-white">₺{fmt(totals.yatirim)}</p>
            </div>

            {/* Total Cekim */}
            <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.05]">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
                  <TrendingDown className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total Cekim</span>
              </div>
              <p className="font-mono text-2xl font-bold text-amber-400">₺{fmt(totals.cekim)}</p>
            </div>

            {/* Total Komisyon */}
            <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.05]">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
                  <BarChart3 className="h-4 w-4 text-red-400" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total Komisyon</span>
              </div>
              <p className="font-mono text-2xl font-bold text-red-400">-₺{fmt(totals.komisyon)}</p>
              {totals.cekimKom > 0 && (
                <p className="mt-1 text-[10px] text-neutral-600">
                  Cekim Kom.: -₺{fmt(totals.cekimKom)}
                </p>
              )}
            </div>

            {/* Total Net Kar */}
            <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.05]">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                  <Wallet className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total Net Kar</span>
              </div>
              <p className={`font-mono text-2xl font-bold ${totals.netKar >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {totals.netKar >= 0 ? "₺" : "-₺"}{fmt(Math.abs(totals.netKar))}
              </p>
              <p className="mt-1 text-[10px] text-neutral-600">
                Yatirim − Komisyon − Cekim
              </p>
            </div>
          </div>
        )}

        {/* ── Excel Yukleme Alani ── */}
        <div className="mx-auto mt-10 max-w-6xl px-6">
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
            {/* Tab Header */}
            <div className="flex items-center gap-0 border-b border-white/[0.06]">
              <button
                type="button"
                onClick={() => setUploadTab("gunluk")}
                className={`flex items-center gap-2 px-6 py-3 text-[11px] font-semibold transition-all ${
                  uploadTab === "gunluk"
                    ? "border-b-2 border-[#1E5EFF] text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                Gunluk Excel
              </button>
              <button
                type="button"
                onClick={() => setUploadTab("gecmis")}
                className={`flex items-center gap-2 px-6 py-3 text-[11px] font-semibold transition-all ${
                  uploadTab === "gecmis"
                    ? "border-b-2 border-violet-400 text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                Gecmis Gun Yukle
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {uploadTab === "gunluk" && (
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-white">Bugunun Verisini Yukle</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                      Bugunun Excel dosyasini yukleyin. Kasa verileri anlik olarak guncellenir ve gunluk snapshot kaydedilir.
                    </p>
                  </div>
                  <div
                    onClick={() => gunlukInputRef.current?.click()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleGunlukUpload(f); }}
                    onDragOver={(e) => e.preventDefault()}
                    onKeyDown={(e) => { if (e.key === "Enter") gunlukInputRef.current?.click(); }}
                    role="button"
                    tabIndex={0}
                    className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-8 py-5 transition-all hover:border-[#1E5EFF]/40 hover:bg-white/[0.04] sm:w-auto"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-500/60" strokeWidth={1.5} />
                      <Upload className="h-4 w-4 text-neutral-500" strokeWidth={1.5} />
                    </div>
                    <p className="text-[11px] font-medium text-neutral-400">Surukle veya tikla</p>
                    <p className="text-[9px] text-neutral-600">.xlsx, .xls, .csv</p>
                    <input
                      ref={gunlukInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGunlukUpload(f); e.target.value = ""; }}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {uploadTab === "gecmis" && (
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-white">Gecmis Gune Veri Yukle</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                      Tarih araligi secin ve Excel yukleyin. Aralik icindeki her gun icin ayni veri snapshot olarak kaydedilir.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Baslangic</label>
                        <input
                          type="date"
                          value={gecmisStart}
                          onChange={(e) => { setGecmisStart(e.target.value); if (!gecmisEnd || e.target.value > gecmisEnd) setGecmisEnd(e.target.value); }}
                          max={new Date().toISOString().split("T")[0]}
                          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-white outline-none transition-colors focus:border-violet-400/50 [color-scheme:dark]"
                        />
                      </div>
                      <span className="text-neutral-600">—</span>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Bitis</label>
                        <input
                          type="date"
                          value={gecmisEnd}
                          onChange={(e) => setGecmisEnd(e.target.value)}
                          min={gecmisStart || undefined}
                          max={new Date().toISOString().split("T")[0]}
                          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-white outline-none transition-colors focus:border-violet-400/50 [color-scheme:dark]"
                        />
                      </div>
                      {gecmisStart && gecmisEnd && gecmisStart <= gecmisEnd && (
                        <span className="rounded-md bg-violet-500/15 px-2 py-1 text-[10px] font-bold text-violet-400">
                          {Math.round((new Date(gecmisEnd + "T00:00:00").getTime() - new Date(gecmisStart + "T00:00:00").getTime()) / 86400000) + 1} gun
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    onClick={() => { if (!gecmisStart || !gecmisEnd) { setUploadStatus("error"); setUploadMsg("Lutfen tarih araligini secin"); setTimeout(() => setUploadStatus("idle"), 3000); return; } gecmisInputRef.current?.click(); }}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleGecmisUpload(f); }}
                    onDragOver={(e) => e.preventDefault()}
                    onKeyDown={(e) => { if (e.key === "Enter") gecmisInputRef.current?.click(); }}
                    role="button"
                    tabIndex={0}
                    className={`flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-8 py-5 transition-all sm:w-auto ${
                      gecmisStart && gecmisEnd
                        ? "border-violet-400/20 bg-white/[0.02] hover:border-violet-400/40 hover:bg-white/[0.04]"
                        : "border-white/5 bg-white/[0.01] opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-violet-400/60" strokeWidth={1.5} />
                      <Calendar className="h-4 w-4 text-neutral-500" strokeWidth={1.5} />
                    </div>
                    <p className="text-[11px] font-medium text-neutral-400">{gecmisStart && gecmisEnd ? "Surukle veya tikla" : "Once tarih sec"}</p>
                    <p className="text-[9px] text-neutral-600">.xlsx, .xls, .csv</p>
                    <input
                      ref={gecmisInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGecmisUpload(f); e.target.value = ""; }}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* Upload status */}
              {uploadStatus !== "idle" && (
                <div className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-2.5 ${
                  uploadStatus === "loading" ? "bg-white/[0.04]" :
                  uploadStatus === "done" ? "bg-emerald-500/10" :
                  "bg-red-500/10"
                }`}>
                  {uploadStatus === "loading" && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-600 border-t-white" />
                  )}
                  {uploadStatus === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  {uploadStatus === "error" && <span className="text-sm text-red-400">!</span>}
                  <p className={`text-[11px] font-medium ${
                    uploadStatus === "loading" ? "text-neutral-400" :
                    uploadStatus === "done" ? "text-emerald-400" :
                    "text-red-400"
                  }`}>
                    {uploadStatus === "loading" ? "Isleniyor..." : uploadMsg}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {noData && (
          <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-center px-6 pb-8 text-center">
            <p className="text-xs text-neutral-600">
              Yukaridaki alandan Excel yukleyerek baslayabilirsiniz.
            </p>
          </div>
        )}
      </section>

      {/* ━━━ MAIN CONTENT: Light Section — Her zaman yan yana ━━━ */}
      <section className="bg-[#F5F5F7] py-12">
        <div className="mx-auto max-w-6xl px-6">

          {/* Her zaman 2 kolonlu grid */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* ── SOL: GUNLUK ── */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E5EFF]/10">
                    <Wallet className="h-4 w-4 text-[#1E5EFF]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-neutral-900">Gunluk Rapor</h2>
                    <p className="text-[10px] text-neutral-400">Bugunun canli kasa verisi</p>
                  </div>
                </div>
                {hasKasa && (
                  <button
                    type="button"
                    onClick={handleGunlukCopy}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-semibold transition-all ${
                      gunlukCopied
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
                    }`}
                  >
                    {gunlukCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {gunlukCopied ? "Kopyalandi" : "Telegram"}
                  </button>
                )}
              </div>

              {hasKasa ? (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50/70">
                          <th className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">Yontem</th>
                          <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400" colSpan={2}>Yatirim</th>
                          <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400">Komisyon</th>
                          <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400">Cekim</th>
                          <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400">Net Kar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aktifKasa.map((k, i) => {
                          const avg = yediGunOrt.get(k.odemeTuruAdi);
                          const bugun = k.toplamBorc;
                          let pct: number | null = null;
                          let dir: "up" | "down" | "same" | null = null;
                          if (avg != null && avg > 0) {
                            pct = ((bugun - avg) / avg) * 100;
                            if (pct > 2) dir = "up";
                            else if (pct < -2) dir = "down";
                            else dir = "same";
                          }
                          return (
                            <tr key={k.id} className={`border-b border-neutral-50 transition-colors hover:bg-neutral-50/60 ${i % 2 !== 0 ? "bg-neutral-50/30" : ""}`}>
                              <td className="px-5 py-3">
                                <span className="text-[12px] font-semibold text-neutral-800">{k.odemeTuruAdi}</span>
                              </td>
                              <td className="py-3 pl-3 pr-0 text-right">
                                <span className="font-mono text-[12px] font-semibold text-neutral-700">₺{fmt(bugun)}</span>
                              </td>
                              <td className="py-3 pl-1 pr-3">
                                {dir && pct !== null ? (
                                  <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                                    dir === "up"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : dir === "down"
                                        ? "bg-red-50 text-red-500"
                                        : "bg-neutral-100 text-neutral-400"
                                  }`}>
                                    {dir === "up" && <TrendingUp className="h-2.5 w-2.5" />}
                                    {dir === "down" && <TrendingDown className="h-2.5 w-2.5" />}
                                    {dir === "same" && <Minus className="h-2.5 w-2.5" />}
                                    {pct > 0 ? "+" : ""}{pct.toFixed(0)}%
                                  </span>
                                ) : null}
                              </td>
                              <td className="px-3 py-3 text-right">
                                {k.komisyonOrani > 0 ? (
                                  <div className="flex flex-col items-end">
                                    <span className="font-mono text-[11px] font-semibold text-red-500">-₺{fmt(k.komisyon)}</span>
                                    <span className="text-[8px] text-neutral-400">%{k.komisyonOrani}</span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-neutral-300">—</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right">
                                {k.toplamKredi > 0 ? (
                                  <span className="font-mono text-[11px] font-semibold text-amber-600">₺{fmt(k.toplamKredi)}</span>
                                ) : (
                                  <span className="text-[11px] text-neutral-300">—</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right">
                                {(() => {
                                  const rowNet = k.toplamBorc - k.komisyon - k.toplamKredi;
                                  return (
                                    <span className={`font-mono text-[12px] font-bold ${rowNet >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                      {rowNet >= 0 ? "₺" : "-₺"}{fmt(Math.abs(rowNet))}
                                    </span>
                                  );
                                })()}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Manuel satirlar */}
                        {manuelSatirlar.length > 0 && (
                          <tr className="border-t-2 border-dashed border-blue-200">
                            <td colSpan={6} className="bg-blue-50/50 px-5 py-1.5">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400">Manuel Girisler</span>
                            </td>
                          </tr>
                        )}
                        {manuelSatirlar.map((s) => {
                          const mYatirim = parseFloat(s.yatirim.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
                          const mKom = mYatirim * MANUEL_KOM_ORAN;
                          const mCekim = parseFloat(s.cekim.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
                          const mNet = mYatirim - mKom - mCekim;
                          const confirmed = s.onaylandi;
                          return (
                          <tr key={s.id} className={`border-b border-dashed ${confirmed ? "border-emerald-200 bg-emerald-50/30" : "border-blue-100 bg-blue-50/20"}`}>
                            <td className="px-5 py-2">
                              {confirmed ? (
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2} />
                                  <span className="text-[12px] font-bold text-neutral-800">{s.ad || "Manuel"}</span>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={s.ad}
                                  onChange={(e) => manuelGuncelle(s.id, "ad", e.target.value)}
                                  placeholder="Yontem adi yaz..."
                                  className="w-full rounded border border-blue-200 bg-white px-2 py-1 text-[12px] font-semibold text-neutral-700 outline-none focus:border-blue-400 placeholder:text-neutral-300"
                                />
                              )}
                            </td>
                            <td className="py-2 pl-3 pr-0" colSpan={2}>
                              {confirmed ? (
                                <span className="block text-right font-mono text-[12px] font-bold text-neutral-800">₺{fmt(mYatirim)}</span>
                              ) : (
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={s.yatirim}
                                  onChange={(e) => manuelGuncelle(s.id, "yatirim", e.target.value.replace(/[^0-9.,]/g, ""))}
                                  onKeyDown={(e) => { if (e.key === "Enter" && mYatirim > 0) manuelOnayla(s.id); }}
                                  placeholder="Yatirim tutari"
                                  className="w-full rounded border border-blue-200 bg-white px-2 py-1 text-right font-mono text-[12px] font-semibold text-neutral-700 outline-none focus:border-blue-400 placeholder:text-neutral-300"
                                />
                              )}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-[10px] text-red-400">
                              {mKom > 0 ? `-₺${fmt(mKom)}` : "—"}
                              {mKom > 0 && <span className="ml-0.5 text-[8px] text-neutral-300">%4.5</span>}
                            </td>
                            <td className="px-3 py-2">
                              {confirmed ? (
                                <span className="block text-right font-mono text-[12px] font-semibold text-amber-600">
                                  {mCekim > 0 ? `₺${fmt(mCekim)}` : "—"}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={s.cekim}
                                  onChange={(e) => manuelGuncelle(s.id, "cekim", e.target.value.replace(/[^0-9.,]/g, ""))}
                                  onKeyDown={(e) => { if (e.key === "Enter" && mYatirim > 0) manuelOnayla(s.id); }}
                                  placeholder="Cekim tutari"
                                  className="w-full rounded border border-blue-200 bg-white px-2 py-1 text-right font-mono text-[12px] font-semibold text-amber-600 outline-none focus:border-blue-400 placeholder:text-neutral-300"
                                />
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-end gap-2">
                                {confirmed ? (
                                  <span className={`font-mono text-[10px] font-semibold ${mNet >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                                    {mNet >= 0 ? "₺" : "-₺"}{fmt(Math.abs(mNet))}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => manuelOnayla(s.id)}
                                    disabled={mYatirim === 0}
                                    className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Check className="h-3 w-3" strokeWidth={2.5} />
                                    Onayla
                                  </button>
                                )}
                                <button type="button" onClick={() => manuelSil(s.id)} className="rounded p-0.5 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-400">
                                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        {/* Manuel ekle butonu */}
                        <tr className="border-b border-neutral-100">
                          <td colSpan={6} className="px-5 py-2.5">
                            <button
                              type="button"
                              onClick={manuelEkle}
                              className="flex items-center gap-1.5 rounded-lg border border-dashed border-blue-300 px-3 py-1.5 text-[10px] font-semibold text-[#1E5EFF]/70 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-[#1E5EFF]"
                            >
                              <Plus className="h-3 w-3" strokeWidth={2} />
                              Manuel Yontem Ekle
                            </button>
                          </td>
                        </tr>
                        <tr className="border-t-2 border-neutral-200 bg-neutral-50">
                          <td className="px-5 py-3"><span className="text-[11px] font-black uppercase tracking-wider text-neutral-600">Toplam</span></td>
                          <td className="py-3 pl-3 pr-0 text-right font-mono text-[12px] font-black text-neutral-800" colSpan={2}>₺{fmt(totals.yatirim)}</td>
                          <td className="px-3 py-3 text-right font-mono text-[11px] font-black text-red-500">{totals.komisyon > 0 ? `-₺${fmt(totals.komisyon)}` : "—"}</td>
                          <td className="px-3 py-3 text-right font-mono text-[11px] font-black text-amber-600">{totals.cekim > 0 ? `₺${fmt(totals.cekim)}` : "—"}</td>
                          <td className={`px-3 py-3 text-right font-mono text-[12px] font-black ${totals.netKar >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {totals.netKar >= 0 ? "₺" : "-₺"}{fmt(Math.abs(totals.netKar))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {yediGunOrt.size > 0 && (
                    <div className="border-t border-neutral-100 px-5 py-2.5">
                      <p className="flex items-center gap-1.5 text-[9px] text-neutral-400">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        Degisim: bugun vs {dailySnapshots.length} gun ortalamasi
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <Wallet className="mb-3 h-8 w-8 text-neutral-200" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-neutral-400">Gunluk Veri Yok</p>
                  <p className="mt-1 text-[11px] text-neutral-400">Yukaridaki &quot;Gunluk Excel&quot; sekmesinden bugunun verisini yukleyin.</p>
                </div>
              )}
            </div>

            {/* ── SAG: HAFTALIK ── */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                    <Calendar className="h-4 w-4 text-violet-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-neutral-900">Aylik Rapor</h2>
                    <p className="text-[10px] text-neutral-400">
                      {hasSn
                        ? `${new Date().toLocaleString("tr-TR", { month: "long", year: "numeric" })} — ${snapshots.length} kayit`
                        : "Henuz snapshot yok"}
                    </p>
                  </div>
                </div>
                {hasSn && (
                  <button
                    type="button"
                    onClick={handleHaftalikCopy}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-semibold transition-all ${
                      haftalikCopied
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
                    }`}
                  >
                    {haftalikCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {haftalikCopied ? "Kopyalandi" : "Telegram"}
                  </button>
                )}
              </div>

              {hasSn ? (
                <>
                  {/* Day-by-day bars */}
                  <div className="border-b border-neutral-100 px-6 py-5">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Yatirim Kayitlari</p>
                    <div className="space-y-2">
                      {snapshots.map((sn) => {
                        const maxY = Math.max(...snapshots.map((s) => s.total_yatirim), 1);
                        const pct = (sn.total_yatirim / maxY) * 100;
                        const isRange = sn.snapshot_hour.startsWith("range:");
                        return (
                          <div key={`${sn.snapshot_hour}-${sn.snapshot_date}`} className="flex items-center gap-3">
                            <div className="w-28 shrink-0 text-right">
                              <span className={`text-[11px] font-semibold ${isRange ? "text-violet-600" : "text-neutral-500"}`}>
                                {snapshotLabel(sn)}
                              </span>
                              {isRange && (
                                <span className="ml-1 inline-block rounded-full bg-violet-100 px-1.5 py-0.5 text-[7px] font-bold uppercase text-violet-500">
                                  haftalik
                                </span>
                              )}
                            </div>
                            <div className={`relative h-7 flex-1 overflow-hidden rounded-lg ${isRange ? "bg-violet-50" : "bg-neutral-100"}`}>
                              <div
                                className={`absolute inset-y-0 left-0 rounded-lg ${
                                  isRange
                                    ? "bg-gradient-to-r from-violet-500/30 to-violet-500/15"
                                    : "bg-gradient-to-r from-violet-500/20 to-violet-500/10"
                                }`}
                                style={{ width: `${Math.max(pct, 3)}%` }}
                              />
                              <span className={`relative z-10 flex h-full items-center pl-3 font-mono text-[11px] font-bold ${isRange ? "text-violet-700" : "text-neutral-700"}`}>
                                ₺{fmtCompact(sn.total_yatirim)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Kayit sayisi */}
                    <p className="mt-3 text-right text-[10px] text-neutral-400">
                      {snapshots.length} kayit yuklendi
                    </p>
                  </div>

                  {/* Method-level weekly cumulative */}
                  {weeklyMethods.length > 0 && (
                    <div className="px-6 py-5">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Yontem Bazli Aylik</p>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neutral-100">
                            <th className="pb-2 text-left text-[9px] font-bold uppercase tracking-wider text-neutral-400">Yontem</th>
                            <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-wider text-neutral-400">Yatirim</th>
                            <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-wider text-neutral-400">Komisyon</th>
                            <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-wider text-neutral-400">Cekim</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weeklyMethods.map((m, i) => (
                            <tr key={m.name} className={`border-b border-neutral-50 ${i % 2 !== 0 ? "bg-neutral-50/40" : ""}`}>
                              <td className="py-2.5 text-[12px] font-semibold text-neutral-700">{m.name}</td>
                              <td className="py-2.5 text-right font-mono text-[12px] font-semibold text-neutral-700">₺{fmtCompact(m.yatirim)}</td>
                              <td className="py-2.5 text-right font-mono text-[12px] font-semibold text-red-500">{m.komisyon > 0 ? `-₺${fmtCompact(m.komisyon)}` : "—"}</td>
                              <td className="py-2.5 text-right font-mono text-[12px] font-semibold text-amber-600">{m.cekim > 0 ? `₺${fmtCompact(m.cekim)}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <Calendar className="mb-3 h-8 w-8 text-neutral-200" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-neutral-400">Aylik Veri Yok</p>
                  <p className="mt-1 text-[11px] text-neutral-400">Yukaridaki &quot;Gecmis Gun Yukle&quot; sekmesinden gunluk veya haftalik verilerinizi yukleyin.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ━━━ FOOTER: Dark Section ━━━ */}
      {(hasKasa || hasSn) && (
        <section className="bg-black py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600">Telegram Paylasim</p>
            <div className="flex gap-3">
              {hasKasa && (
                <button
                  type="button"
                  onClick={handleGunlukCopy}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
                    gunlukCopied
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-white/[0.06] text-neutral-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {gunlukCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {gunlukCopied ? "Kopyalandi!" : "Gunluk Ozet"}
                </button>
              )}
              {hasSn && (
                <button
                  type="button"
                  onClick={handleHaftalikCopy}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
                    haftalikCopied
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-white/[0.06] text-neutral-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {haftalikCopied ? <Check className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                  {haftalikCopied ? "Kopyalandi!" : "Haftalik Ozet"}
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
