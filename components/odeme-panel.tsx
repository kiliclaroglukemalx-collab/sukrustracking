"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Check,
  Copy,
  X,
  ChevronDown,
  Trash2,
  CalendarDays,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { IslemTipi, OdemeKaydi } from "@/lib/store";

const DOVIZ_SECENEKLERI = ["TRY", "USDT", "USD", "EUR"];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(iso: string): { tarih: string; saat: string } {
  const d = new Date(iso);
  return {
    tarih: d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    saat: d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function islemLabel(tip: IslemTipi): string {
  switch (tip) {
    case "odeme-yap":
      return "Odeme Yapildi";
    case "odeme-al":
      return "Odeme Alindi";
    case "transfer":
      return "Kasalar Arasi Transfer";
  }
}

// ---- Kurumsal metin olusturucu ----
function generateOdemeMetni(odeme: OdemeKaydi): string {
  const { tarih, saat } = formatDateTime(odeme.tarih);
  const isCredit = odeme.islemTipi === "odeme-al";
  const isTransfer = odeme.islemTipi === "transfer";

  const tipLabel = isCredit ? "ODEME ALINDI" : isTransfer ? "KASALAR ARASI TRANSFER" : "ODEME YAPILDI";
  const yonEmoji = isCredit ? "📥" : isTransfer ? "🔄" : "📤";

  let lines: string[] = [];

  lines.push(`${yonEmoji} ${tipLabel}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(``);

  // Tutar
  const sign = isCredit ? "+" : "-";
  if (odeme.dovizCinsi !== "TRY" && odeme.kur) {
    lines.push(`💰 Tutar: ${formatCurrency(odeme.tutar)} ${odeme.dovizCinsi}`);
    lines.push(`📊 Kur: ${odeme.kur.toLocaleString("tr-TR")} TL`);
    lines.push(`💵 TL Karsiligi: ${sign}₺${formatCurrency(odeme.tutarTL)}`);
  } else {
    lines.push(`💰 Tutar: ${sign}₺${formatCurrency(odeme.tutarTL)}`);
  }
  lines.push(``);

  // Akis
  if (isTransfer) {
    lines.push(`📋 Kaynak: ${odeme.yontem}`);
    lines.push(`📋 Hedef: ${odeme.hedefYontem}`);
  } else {
    lines.push(`📋 Yontem: ${odeme.yontem}`);
  }

  if (odeme.gonderen) lines.push(`👤 Gonderen: ${odeme.gonderen}`);
  if (odeme.alici) lines.push(`👤 Alici: ${odeme.alici}`);
  lines.push(``);

  // TX Kodu
  if (odeme.txKodu) {
    lines.push(`🔗 TX: ${odeme.txKodu}`);
    lines.push(``);
  }

  // Tarih ve referans
  lines.push(`📅 ${tarih} | ⏰ ${saat}`);
  lines.push(`🔖 Ref: ${odeme.no}`);

  // Aciklama
  if (odeme.aciklama) {
    lines.push(``);
    lines.push(`📝 Not: ${odeme.aciklama}`);
  }

  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);

  return lines.join("\n");
}

// ---- Odeme Ozet Karti (kurumsal metin + telegram kopyalama) ----
function OdemeOzetKarti({
  odeme,
  onClose,
}: {
  odeme: OdemeKaydi;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const metin = generateOdemeMetni(odeme);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(metin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: eski yontem
      const ta = document.createElement("textarea");
      ta.value = metin;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [metin]);

  const isCredit = odeme.islemTipi === "odeme-al";
  const { tarih, saat } = formatDateTime(odeme.tarih);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex w-full max-w-md flex-col gap-4">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-2 right-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* Basari basligi */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "rgba(0,255,0,0.1)",
              boxShadow: "0 0 16px rgba(0,255,0,0.2)",
            }}
          >
            <Check className="h-5 w-5" style={{ color: "#00ff00" }} />
          </div>
          <span
            className="text-base font-black uppercase tracking-[0.2em]"
            style={{
              color: "#00ff00",
              textShadow: "0 0 12px rgba(0,255,0,0.4)",
            }}
          >
            {islemLabel(odeme.islemTipi)}
          </span>
        </div>

        {/* Tutar vurgusu */}
        <div className="text-center">
          <span
            className="font-mono text-4xl font-black tabular-nums"
            style={{
              color: "#00ff00",
              textShadow:
                "0 0 24px rgba(0,255,0,0.4), 0 0 48px rgba(0,255,0,0.2)",
            }}
          >
            {isCredit ? "+" : "-"}₺{formatCurrency(odeme.tutarTL)}
          </span>
          {odeme.dovizCinsi !== "TRY" && odeme.kur && (
            <p className="mt-1 text-sm text-neutral-400">
              {formatCurrency(odeme.tutar)} {odeme.dovizCinsi} × {odeme.kur.toLocaleString("tr-TR")} TL
            </p>
          )}
        </div>

        {/* Kurumsal metin onizleme */}
        <div
          className="overflow-hidden rounded-2xl border border-neutral-700/50"
          style={{
            background: "linear-gradient(145deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)",
          }}
        >
          {/* Detay ozet */}
          <div className="space-y-2.5 px-5 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Yontem</span>
              <span className="text-xs font-semibold text-white">{odeme.yontem}</span>
            </div>
            {odeme.hedefYontem && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Hedef</span>
                <span className="text-xs font-semibold text-white">{odeme.hedefYontem}</span>
              </div>
            )}
            {odeme.gonderen && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Gonderen</span>
                <span className="text-xs font-semibold text-white">{odeme.gonderen}</span>
              </div>
            )}
            {odeme.alici && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Alici</span>
                <span className="text-xs font-semibold text-white">{odeme.alici}</span>
              </div>
            )}
            {odeme.txKodu && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 shrink-0">TX Kodu</span>
                <span className="truncate font-mono text-[11px] font-semibold text-cyan-400">{odeme.txKodu}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Tarih</span>
              <span className="text-xs font-semibold text-white">{tarih} · {saat}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Referans</span>
              <span className="font-mono text-xs font-semibold text-neutral-400">{odeme.no}</span>
            </div>
            {odeme.aciklama && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Not</p>
                <p className="mt-1 text-xs text-neutral-300">{odeme.aciklama}</p>
              </div>
            )}
          </div>

          {/* Telegram metin onizleme */}
          <div className="border-t border-neutral-800 bg-neutral-900/30 px-5 py-4">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">
              Telegram Metni Onizleme
            </p>
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-neutral-400">
              {metin}
            </pre>
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-[0.12em] text-black transition-all"
            style={{
              background: copied
                ? "linear-gradient(135deg, #00cc00 0%, #009900 100%)"
                : "linear-gradient(135deg, #00ff00 0%, #00cc00 100%)",
              boxShadow: "0 0 20px rgba(0,255,0,0.25), 0 0 40px rgba(0,255,0,0.1)",
            }}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Kopyalandi!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Metni Kopyala
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-3 text-xs font-bold uppercase tracking-wider text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Custom Select ----
function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-left text-xs text-neutral-200 transition-colors hover:border-neutral-600"
      >
        <span className={value ? "" : "text-neutral-500"}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 py-1 shadow-xl">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-neutral-800 ${
                value === opt ? "text-green-400 font-semibold" : "text-neutral-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Ana Odeme Paneli ----
export function OdemePanel({ onClose }: { onClose: () => void }) {
  const { kasaData, odemeEkle, odemeler, odemeSil, methods } = useStore();
  const [silOnay, setSilOnay] = useState<string | null>(null);
  const [islemTipi, setIslemTipi] = useState<IslemTipi>("odeme-yap");
  const [yontem, setYontem] = useState("");
  const [hedefYontem, setHedefYontem] = useState("");
  const [tutar, setTutar] = useState("");
  const [dovizCinsi, setDovizCinsi] = useState("TRY");
  const [kur, setKur] = useState("");
  const [gonderen, setGonderen] = useState("");
  const [alici, setAlici] = useState("");
  const [txKodu, setTxKodu] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [ozetOdeme, setOzetOdeme] = useState<OdemeKaydi | null>(null);
  const [tab, setTab] = useState<"form" | "gecmis">("form");

  // Kasa isimleri + Dis Kasa
  const kasaIsimleri = [
    ...kasaData.map((k) => k.odemeTuruAdi),
    "Dis Kasa",
  ];

  const tutarNum = parseFloat(tutar.replace(/\./g, "").replace(",", ".")) || 0;
  const kurNum = parseFloat(kur.replace(/\./g, "").replace(",", ".")) || 1;
  const tutarTL = dovizCinsi === "TRY" ? tutarNum : tutarNum * kurNum;

  const canSubmit =
    yontem !== "" &&
    tutarNum > 0 &&
    (islemTipi !== "transfer" || hedefYontem !== "");

  const handleSubmit = () => {
    if (!canSubmit) return;
    // Method ID'yi bul (isim degisse bile eslestirme bozulmasin)
    const yontemMethod = methods.find((m) => m.name === yontem);
    const hedefMethod = islemTipi === "transfer" ? methods.find((m) => m.name === hedefYontem) : undefined;
    const yeni = odemeEkle({
      islemTipi,
      yontem,
      yontemId: yontemMethod?.id,
      hedefYontem: islemTipi === "transfer" ? hedefYontem : undefined,
      hedefYontemId: hedefMethod?.id,
      tutar: tutarNum,
      dovizCinsi,
      kur: dovizCinsi !== "TRY" ? kurNum : undefined,
      tutarTL,
      gonderen,
      alici,
      aciklama,
      txKodu: txKodu.trim() || undefined,
    });
    setOzetOdeme(yeni);
    // Reset
    setTutar("");
    setKur("");
    setGonderen("");
    setAlici("");
    setTxKodu("");
    setAciklama("");
  };

  const islemTipleri: { key: IslemTipi; label: string; icon: React.ReactNode }[] = [
    {
      key: "odeme-yap",
      label: "Odeme Yap",
      icon: <ArrowUpRight className="h-3.5 w-3.5" />,
    },
    {
      key: "odeme-al",
      label: "Odeme Al",
      icon: <ArrowDownLeft className="h-3.5 w-3.5" />,
    },
    {
      key: "transfer",
      label: "Transfer",
      icon: <ArrowLeftRight className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <>
      <div className="flex h-full flex-col bg-neutral-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <h2
            className="text-sm font-bold uppercase tracking-[0.2em]"
            style={{
              color: "#00ff00",
              textShadow: "0 0 10px rgba(0,255,0,0.3)",
            }}
          >
            Odemeler
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800">
          <button
            type="button"
            onClick={() => setTab("form")}
            className={`flex-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
              tab === "form"
                ? "border-b-2 border-green-500 text-green-400"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Yeni Islem
          </button>
          <button
            type="button"
            onClick={() => setTab("gecmis")}
            className={`flex-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
              tab === "gecmis"
                ? "border-b-2 border-green-500 text-green-400"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Gecmis ({odemeler.length})
          </button>
        </div>

        {tab === "form" ? (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* Islem Tipi */}
            <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">
              Islem Tipi
            </label>
            <div className="mb-4 flex gap-1.5">
              {islemTipleri.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setIslemTipi(t.key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    islemTipi === t.key
                      ? "border-green-500/50 bg-green-500/10 text-green-400"
                      : "border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Yontem */}
            <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">
              {islemTipi === "transfer" ? "Kaynak Kasa" : "Yontem"}
            </label>
            <div className="mb-4">
              <CustomSelect
                value={yontem}
                onChange={setYontem}
                options={kasaIsimleri}
                placeholder="Kasa secin..."
              />
            </div>

            {/* Hedef Kasa (transfer icin) */}
            {islemTipi === "transfer" && (
              <>
                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Hedef Kasa
                </label>
                <div className="mb-4">
                  <CustomSelect
                    value={hedefYontem}
                    onChange={setHedefYontem}
                    options={kasaIsimleri.filter((k) => k !== yontem)}
                    placeholder="Hedef kasa secin..."
                  />
                </div>
              </>
            )}

            {/* Tutar + Doviz */}
            <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">
              Tutar
            </label>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={tutar}
                onChange={(e) => setTutar(e.target.value)}
                placeholder="0"
                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 font-mono text-xs text-white placeholder-neutral-600 outline-none transition-colors focus:border-green-500/50"
              />
              <div className="w-24">
                <CustomSelect
                  value={dovizCinsi}
                  onChange={setDovizCinsi}
                  options={DOVIZ_SECENEKLERI}
                  placeholder="TRY"
                />
              </div>
            </div>

            {/* Kur (doviz ise) */}
            {dovizCinsi !== "TRY" && (
              <>
                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Kur (1 {dovizCinsi} = ? TL)
                </label>
                <input
                  type="text"
                  value={kur}
                  onChange={(e) => setKur(e.target.value)}
                  placeholder="Ornek: 34.5"
                  className="mb-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 font-mono text-xs text-white placeholder-neutral-600 outline-none transition-colors focus:border-green-500/50"
                />
                {tutarTL > 0 && (
                  <p className="mb-4 text-[10px] text-neutral-500">
                    = <span className="font-mono font-bold text-green-400">{"₺"}{formatCurrency(tutarTL)}</span>
                  </p>
                )}
              </>
            )}

            {/* Gonderen / Alici */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Gonderen
                </label>
                <input
                  type="text"
                  value={gonderen}
                  onChange={(e) => setGonderen(e.target.value)}
                  placeholder="Ornek: Sirket Kasasi"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-colors focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Alici
                </label>
                <input
                  type="text"
                  value={alici}
                  onChange={(e) => setAlici(e.target.value)}
                  placeholder="Ornek: Mehdi"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-colors focus:border-green-500/50"
                />
              </div>
            </div>

            {/* TX Kodu (kripto islemler icin) */}
            <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">
              TX Kodu <span className="normal-case tracking-normal text-neutral-600">(opsiyonel)</span>
            </label>
            <input
              type="text"
              value={txKodu}
              onChange={(e) => setTxKodu(e.target.value)}
              placeholder="Ornek: 0x3a7f...b2c1"
              className="mb-4 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 font-mono text-xs text-white placeholder-neutral-600 outline-none transition-colors focus:border-green-500/50"
            />

            {/* Aciklama */}
            <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">
              Aciklama
            </label>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Islem hakkinda not..."
              rows={2}
              className="mb-5 w-full resize-none rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-colors focus:border-green-500/50"
            />

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full rounded-xl py-3 text-xs font-bold uppercase tracking-[0.15em] text-black transition-all disabled:cursor-not-allowed disabled:opacity-30"
              style={{
                background: canSubmit
                  ? "linear-gradient(135deg, #00ff00 0%, #00cc00 100%)"
                  : "#333",
                boxShadow: canSubmit
                  ? "0 0 20px rgba(0,255,0,0.25), 0 0 40px rgba(0,255,0,0.1)"
                  : "none",
              }}
            >
              {islemTipi === "odeme-yap"
                ? "Odemeyi Onayla"
                : islemTipi === "odeme-al"
                  ? "Odemeyi Kaydet"
                  : "Transferi Gerceklestir"}
            </button>
          </div>
        ) : (
          /* Gecmis Tab */
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {/* Takvim sayfasina link */}
            <Link
              href="/odemeler/gecmis"
              onClick={onClose}
              className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 py-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
            >
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
              Takvimde Goruntule
            </Link>

            {odemeler.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-xs text-neutral-500">
                  Henuz islem yapilmadi
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {odemeler.map((o) => {
                  const { tarih: t, saat: s } = formatDateTime(o.tarih);
                  const isSilOnay = silOnay === o.id;
                  return (
                    <div
                      key={o.id}
                      className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 transition-colors hover:border-neutral-700"
                    >
                      {/* Tiklanabilir alan -- ozet karti acar */}
                      <button
                        type="button"
                        onClick={() => setOzetOdeme(o)}
                        className="flex flex-1 items-center justify-between px-3 py-2.5 text-left"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-neutral-500">
                              {o.no}
                            </span>
                            <span className="text-[10px] font-semibold uppercase text-neutral-400">
                              {islemLabel(o.islemTipi)}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-600">
                            {o.yontem}
                            {o.hedefYontem ? ` → ${o.hedefYontem}` : ""} | {t}{" "}
                            {s}
                          </span>
                        </div>
                        <span
                          className={`font-mono text-xs font-bold ${
                            o.islemTipi === "odeme-al"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {o.islemTipi === "odeme-al" ? "+" : "-"}{"₺"}
                          {formatCurrency(o.tutarTL)}
                        </span>
                      </button>

                      {/* Sil butonu */}
                      {isSilOnay ? (
                        <div className="flex items-center gap-1 pr-2">
                          <button
                            type="button"
                            onClick={() => {
                              odemeSil(o.id);
                              setSilOnay(null);
                            }}
                            className="rounded-md bg-red-500/20 px-2 py-1 text-[9px] font-bold uppercase text-red-400 transition-colors hover:bg-red-500/30"
                          >
                            Evet
                          </button>
                          <button
                            type="button"
                            onClick={() => setSilOnay(null)}
                            className="rounded-md bg-neutral-800 px-2 py-1 text-[9px] font-bold uppercase text-neutral-400 transition-colors hover:bg-neutral-700"
                          >
                            Iptal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSilOnay(o.id)}
                          className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          title="Islemi sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ozet Karti Modal */}
      {ozetOdeme && (
        <OdemeOzetKarti
          odeme={ozetOdeme}
          onClose={() => setOzetOdeme(null)}
        />
      )}
    </>
  );
}
