"use client";

import { Wallet, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import type { KasaCardData } from "@/lib/excel-processor";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface SummaryBarProps {
  data: KasaCardData[];
}

export function SummaryBar({ data }: SummaryBarProps) {
  const toplamBorc = data.reduce((sum, d) => sum + d.toplamBorc, 0);
  const toplamKredi = data.reduce((sum, d) => sum + d.toplamKredi, 0);
  const toplamKomisyon = data.reduce((sum, d) => sum + d.komisyon, 0);
  const toplamKalanKasa = data.reduce((sum, d) => sum + d.kalanKasa, 0);

  const items = [
    {
      label: "Borc",
      value: formatCurrency(toplamBorc),
      icon: TrendingUp,
      color: "text-white",
    },
    {
      label: "Kredi",
      value: formatCurrency(toplamKredi),
      icon: TrendingDown,
      color: "text-red-400",
    },
    {
      label: "Komisyon",
      value: formatCurrency(toplamKomisyon),
      icon: Receipt,
      color: "text-white/50",
    },
    {
      label: "Net Kasa",
      value: formatCurrency(toplamKalanKasa),
      icon: Wallet,
      color: toplamKalanKasa >= 0 ? "text-emerald-400" : "text-red-400",
    },
  ];

  return (
    <div className="flex items-center justify-center gap-6 md:gap-10">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-1.5"
        >
          <item.icon className={`h-3 w-3 shrink-0 ${item.color}`} />
          <div className="flex items-baseline gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-white/40">
              {item.label}
            </span>
            <span className={`font-mono text-xs font-bold ${item.color}`}>
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
