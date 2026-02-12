"use client";

import { useState, useEffect } from "react";
import type { KasaCardData } from "@/lib/excel-processor";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getRoundedHour(): string {
  const now = new Date();
  const mins = now.getMinutes();
  const h = mins >= 30 ? now.getHours() + 1 : now.getHours();
  const hour = h % 24;
  return `${hour.toString().padStart(2, "0")}:00`;
}

function getFormattedDate(): string {
  const now = new Date();
  return now.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface TopBarProps {
  data: KasaCardData[];
}

export function TopBar({ data }: TopBarProps) {
  const [roundedHour, setRoundedHour] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setRoundedHour(getRoundedHour());
    setDateStr(getFormattedDate());
    const timer = setInterval(() => {
      setRoundedHour(getRoundedHour());
      setDateStr(getFormattedDate());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const toplamYatirim = data.reduce((sum, d) => sum + d.toplamBorc, 0);
  const toplamCekim = data.reduce((sum, d) => sum + d.toplamKredi, 0);
  const toplamKomisyon = data.reduce((sum, d) => sum + d.komisyon, 0);
  const totalKasa = data.reduce((sum, d) => sum + d.kalanKasa, 0);

  console.log("[v0] TopBar data count:", data.length, "yatirim:", toplamYatirim, "komisyon:", toplamKomisyon, "cekim:", toplamCekim, "kasa:", totalKasa);
  if (data.length > 0 && toplamYatirim === 0) {
    console.log("[v0] TopBar first 3 cards detail:", data.slice(0, 3).map(d => ({ name: d.odemeTuruAdi, borc: d.toplamBorc, kredi: d.toplamKredi, komisyon: d.komisyon, bakiye: d.baslangicBakiye, kalan: d.kalanKasa })));
  }

  return (
    <div className="flex h-[72px] items-center justify-between">
      {/* LEFT: Hour + Kasasi + date */}
      <div className="flex flex-shrink-0 flex-col">
        <div className="flex items-baseline gap-2">
          <span
            className="font-mono text-xl font-black tracking-wide lg:text-2xl"
            style={{ color: "#d946a8" }}
            suppressHydrationWarning
          >
            {roundedHour}
          </span>
          <span
            className="text-sm font-bold tracking-[0.15em] uppercase lg:text-base"
            style={{ color: "#d946a8" }}
          >
            Kasasi
          </span>
        </div>
        {dateStr && (
          <span
            className="text-[9px] font-semibold tracking-wider uppercase lg:text-[10px]"
            style={{
              background: "linear-gradient(90deg, #f43f5e, #f97316, #eab308, #22c55e, #3b82f6, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {dateStr}
          </span>
        )}
      </div>

      {/* CENTER: Total Kasa - black bg, white label, green amount */}
      <div className="flex min-w-[200px] flex-col items-center justify-center rounded-lg bg-neutral-950 px-10 py-1.5 lg:min-w-[260px] lg:px-14">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white lg:text-[11px]">
          Total Kasa
        </span>
        <span
          className="font-mono text-xl font-black tabular-nums lg:text-2xl"
          style={{
            color: "#00FF00",
            textShadow:
              "0 0 14px rgba(0,255,0,0.4), 0 0 5px rgba(0,255,0,0.25)",
          }}
        >
          {"₺"}
          {formatCurrency(totalKasa)}
        </span>
      </div>

      {/* RIGHT: Yatirim / Komisyon / Cekim + menu spacer */}
      <div className="flex flex-shrink-0 items-center gap-5 pr-10 lg:gap-8">
        <Metric
          label="Toplam Yatirim"
          value={toplamYatirim}
          color="text-neutral-900"
        />
        <div className="h-6 w-px bg-neutral-200" />
        <Metric
          label="Toplam Komisyon"
          value={toplamKomisyon}
          color="text-amber-600"
        />
        <div className="h-6 w-px bg-neutral-200" />
        <Metric
          label="Toplam Cekim"
          value={toplamCekim}
          color="text-red-600"
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400 lg:text-[10px]">
        {label}
      </span>
      <span
        className={`font-mono text-sm font-extrabold tabular-nums lg:text-base ${color}`}
      >
        {"₺"}
        {formatCurrency(value)}
      </span>
    </div>
  );
}
