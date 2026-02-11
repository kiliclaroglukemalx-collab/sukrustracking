"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number | null;
  prefix?: string;
  change?: number | null;
  changeLabel?: string;
  color?: "default" | "green" | "red" | "blue";
}

function formatDisplay(value: string | number | null, prefix?: string): string {
  if (value === null || value === undefined) return "\u2014";
  const str = typeof value === "number"
    ? new Intl.NumberFormat("tr-TR").format(value)
    : value;
  return prefix ? `${prefix}${str}` : str;
}

const colorMap = {
  default: "text-neutral-900",
  green: "text-emerald-600",
  red: "text-red-600",
  blue: "text-[#1E5EFF]",
};

export function KpiCard({ label, value, prefix, change, changeLabel, color = "default" }: KpiCardProps) {
  const isPositive = change !== null && change !== undefined && change > 0;
  const isNegative = change !== null && change !== undefined && change < 0;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E6EAF0] bg-white p-5">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
        {label}
      </p>
      <p className={`font-mono text-2xl font-bold tabular-nums ${colorMap[color]}`}>
        {formatDisplay(value, prefix)}
      </p>
      {(change !== null && change !== undefined) && (
        <div className="mt-2 flex items-center gap-1">
          {isPositive && <TrendingUp className="h-3 w-3 text-emerald-500" strokeWidth={2} />}
          {isNegative && <TrendingDown className="h-3 w-3 text-red-500" strokeWidth={2} />}
          {!isPositive && !isNegative && <Minus className="h-3 w-3 text-neutral-400" strokeWidth={2} />}
          <span className={`text-[11px] font-medium ${isPositive ? "text-emerald-600" : isNegative ? "text-red-600" : "text-neutral-400"}`}>
            {isPositive ? "+" : ""}{change}%
          </span>
          {changeLabel && <span className="text-[10px] text-neutral-400">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}
