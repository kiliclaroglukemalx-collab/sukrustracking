"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  Gift,
  Lock,
  Users,
  BarChart3,
  RefreshCw,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import { BonusDashboard } from "@/components/bonus-dashboard";
import {
  type ProcessedCleanData,
  normalizeData,
  processCleanData,
  validateColumns,
  formatNumber,
} from "@/lib/clean-bonus-analyzer";
import { useStore } from "@/lib/store";
import { DataTable } from "@/components/report/data-table";

/* ─── Types (Cekim API ile uyumlu) ─── */
interface CekimPersonel {
  name: string;
  islemSayisi: number;
  ortKararDk: number;
  performans: "basarili" | "yeterli" | "hizlanmali";
  emoji: string;
  totalVolume: number;
  hizDegisimi: "hizlandi" | "dustu" | "ayni" | null;
  oncekiDk: number | null;
}

interface CekimRaporuData {
  genel?: { toplamBasariliCekim: number; basariliIslemSayisi: number };
  yontemler?: { name: string; volume: number; avgDuration: number; txCount: number }[];
  personel?: CekimPersonel[];
}

/* Bonus skoru: performans + hacim + hız */
function bonusSkoru(p: CekimPersonel, maxVolume: number): number {
  const perfPuan = p.performans === "basarili" ? 40 : p.performans === "yeterli" ? 25 : 10;
  const hacimPuan = maxVolume > 0 ? (p.totalVolume / maxVolume) * 40 : 0;
  const hizPuan = p.hizDegisimi === "hizlandi" ? 20 : p.hizDegisimi === "ayni" ? 10 : 0;
  return Math.round(perfPuan + hacimPuan + hizPuan);
}

export default function BonusRaporuPage() {
  const { role } = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cekimData, setCekimData] = useState<CekimRaporuData | null>(null);
  const [excelData, setExcelData] = useState<ProcessedCleanData[]>([]);
  const [excelFileName, setExcelFileName] = useState<string>("");
  const [excelLoading, setExcelLoading] = useState(false);
  const [excelError, setExcelError] = useState<string>("");

  const parseExcelFile = useCallback(async (file: File) => {
    setExcelLoading(true);
    setExcelError("");
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData =
        XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      if (jsonData.length === 0) {
        setExcelError("Dosya bos veya okunamiyor.");
        setExcelLoading(false);
        return;
      }

      const fileColumns = Object.keys(jsonData[0]);
      const validation = validateColumns(fileColumns);

      if (!validation.valid) {
        setExcelError(
          `Eksik sutunlar: ${validation.missing.join(", ")}. Gerekli: Olusturuldu, Adi, Sonuc, operator, BTag, Hesaplama/Miktar, Toplam Odenen`
        );
        setExcelLoading(false);
        return;
      }

      const normalized = normalizeData(jsonData);
      const processed = processCleanData(normalized);
      setExcelData(processed);
      setExcelFileName(file.name);
    } catch (err) {
      console.error("[Bonus] Excel okuma hatasi:", err);
      setExcelError("Dosya okunurken hata olustu.");
    } finally {
      setExcelLoading(false);
    }
  }, []);

  const clearExcelData = useCallback(() => {
    setExcelData([]);
    setExcelFileName("");
    setExcelError("");
  }, []);

  useEffect(() => {
    setHydrated(true);
    fetchCekimRapor();
  }, []);

  async function fetchCekimRapor() {
    try {
      setLoading(true);
      const res = await fetch("/api/cekim-raporu");
      const json = await res.json();
      if (json.data) {
        setCekimData(json.data);
      }
    } catch (err) {
      console.error("[BonusRaporu] Veri cekme hatasi:", err);
    } finally {
      setLoading(false);
    }
  }

  // Personel bonus tablosu (cekim API'den)
  const personelList = cekimData?.personel ?? [];
  const personelMaxVolume = useMemo(
    () => (personelList.length > 0 ? Math.max(...personelList.map((p) => p.totalVolume)) : 1),
    [personelList]
  );

  const personelBonusRows = useMemo(() => {
    return personelList
      .map((p) => ({
        name: p.name,
        totalVolume: p.totalVolume,
        islemSayisi: p.islemSayisi,
        ortKararDk: p.ortKararDk.toFixed(1),
        performans: p.performans,
        bonusSkoru: bonusSkoru(p, personelMaxVolume),
      }))
      .sort((a, b) => b.bonusSkoru - a.bonusSkoru);
  }, [personelList, personelMaxVolume]);

  if (!hydrated) {
    return <div className="min-h-screen bg-black" />;
  }

  if (role === "basic") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black">
        <Lock className="mb-3 h-8 w-8 text-neutral-500" strokeWidth={1.5} />
        <p className="mb-1 text-sm font-medium text-neutral-300">Erisim Engellendi</p>
        <p className="mb-4 text-xs text-neutral-500">Bu sayfa sadece Master kullanicilar icindir</p>
        <Link href="/raporlar" className="text-xs text-neutral-400 underline hover:text-white">
          Raporlara Don
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Top Nav */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/90 px-5 py-3 backdrop-blur-sm">
        <Link
          href="/raporlar"
          className="flex items-center gap-2 text-xs text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span>Raporlar</span>
        </Link>
        <h1 className="text-sm font-bold tracking-wide text-white">Bonus Raporu</h1>
        <button
          type="button"
          onClick={fetchCekimRapor}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-[10px] font-medium text-neutral-400 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
          Yenile
        </button>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-6">
        {/* Section Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
            <Gift className="h-6 w-6 text-amber-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Bonus Raporu</h2>
            <p className="text-xs text-neutral-500">
              Excel bonus analizi ve personel performansi (cekim raporu)
            </p>
          </div>
        </div>

        {/* Excel Bonus Analizi (v0-greetings) */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
              <h3 className="text-sm font-bold text-neutral-800">
                Excel Bonus Analizi
              </h3>
            </div>
            {excelData.length > 0 && (
              <button
                type="button"
                onClick={clearExcelData}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-[10px] font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                Temizle
              </button>
            )}
          </div>

          {excelData.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white p-6 shadow-lg">
              <p className="mb-4 text-xs text-neutral-600">
                Bonus operasyon verisi icin Excel/CSV yukleyin. Gerekli sutunlar:
                Olusturuldu, Kabul Tarihi, Adi, Sonuc, operator, BTag,
                Hesaplama/Miktar, Toplam Odenen
              </p>
              {excelError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                  {excelError}
                </div>
              )}
              <FileUpload onFileSelect={parseExcelFile} isLoading={excelLoading} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {excelFileName}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatNumber(excelData.length)} satir yuklendi
                  </p>
                </div>
              </div>
              <BonusDashboard data={excelData} />
            </div>
          )}
        </div>

        {/* Personel Bonus Tablosu (Cekim API'den) */}
        {personelList.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
              <h3 className="text-sm font-bold text-neutral-800">Personel Bonus Skoru</h3>
            </div>
            <p className="mb-4 text-xs text-neutral-400">
              Cekim raporundaki performans, hacim ve hiz degisimine gore hesaplanir
            </p>
            <DataTable
              caption="Performans bazli siralama"
              columns={[
                { key: "name", label: "Personel", format: "text" },
                { key: "totalVolume", label: "Hacim (₺)", align: "right", format: "currency" },
                { key: "islemSayisi", label: "Islem", align: "right", format: "number" },
                { key: "ortKararDk", label: "Ort. Sure (dk)", align: "right", format: "text" },
                { key: "performans", label: "Performans", align: "center", format: "text" },
                { key: "bonusSkoru", label: "Bonus Skoru", align: "right", format: "number" },
              ]}
              rows={personelBonusRows}
            />
          </div>
        )}

        {/* Personel yoksa bilgi */}
        {!loading && personelList.length === 0 && (
          <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50/50 p-6">
            <div className="flex items-start gap-3">
              <BarChart3 className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" strokeWidth={1.5} />
              <div>
                <h4 className="text-sm font-semibold text-amber-800">Personel Verisi Yok</h4>
                <p className="mt-1 text-xs text-amber-700/80">
                  Telegram botu cekim raporu gonderdiginde personel bonus skorlari burada gorunecektir.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
