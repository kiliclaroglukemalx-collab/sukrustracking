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

interface TopBarProps {
  data: KasaCardData[];
}

export function TopBar({ data }: TopBarProps) {
  const [roundedHour, setRoundedHour] = useState(getRoundedHour);

  useEffect(() => {
    const timer = setInterval(() => setRoundedHour(getRoundedHour()), 30000);
    return () => clearInterval(timer);
  }, []);

  const toplamYatirim = data.reduce((sum, d) => sum + d.toplamBorc, 0);
  const toplamCekim = data.reduce((sum, d) => sum + d.toplamKredi, 0);
  const toplamKomisyon = data.reduce((sum, d) => sum + d.komisyon, 0);
  const genelToplam = toplamYatirim - toplamKomisyon - toplamCekim;

  return (
    <div className="flex h-[72px] items-center justify-between">
      {/* LEFT: Hour + Kasasi */}
      <div className="flex flex-shrink-0 items-baseline gap-2">
        <span className="font-mono text-xl font-black tracking-wide text-neutral-900 lg:text-2xl">
          {roundedHour}
        </span>
        <span className="text-sm font-bold tracking-[0.15em] uppercase text-neutral-900 lg:text-base">
          Kasasi
        </span>
      </div>

      {/* CENTER: Total Kasa - black bg, white label, green amount */}
      <div className="flex flex-col items-center justify-center rounded-lg bg-neutral-950 px-8 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white lg:text-[11px]">
          Total Kasa
        </span>
        <span
          className="font-mono text-2xl font-black tabular-nums lg:text-3xl"
          style={{
            color: "#00FF00",
            textShadow:
              "0 0 14px rgba(0,255,0,0.4), 0 0 5px rgba(0,255,0,0.25)",
          }}
        >
          {"₺"}
          {formatCurrency(genelToplam)}
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
