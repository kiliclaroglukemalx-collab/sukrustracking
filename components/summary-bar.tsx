"use client";

import { Wallet, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import type { KasaCardData } from "@/lib/excel-processor";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
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
      label: "Toplam Borc",
      value: formatCurrency(toplamBorc),
      icon: TrendingUp,
      color: "text-foreground",
    },
    {
      label: "Toplam Kredi",
      value: formatCurrency(toplamKredi),
      icon: TrendingDown,
      color: "text-destructive",
    },
    {
      label: "Toplam Komisyon",
      value: formatCurrency(toplamKomisyon),
      icon: Receipt,
      color: "text-muted-foreground",
    },
    {
      label: "Toplam Kalan Kasa",
      value: formatCurrency(toplamKalanKasa),
      icon: Wallet,
      color: toplamKalanKasa >= 0 ? "text-accent" : "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
        >
          <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
          <div className="min-w-0">
            <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
              {item.label}
            </p>
            <p className={`font-mono text-sm font-bold ${item.color}`}>
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
