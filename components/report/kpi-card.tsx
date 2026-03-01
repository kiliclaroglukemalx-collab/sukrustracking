"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number | null;
  prefix?: string;
  change?: number | null;
  changeLabel?: string;
  color?: "default" | "green" | "red" | "blue";
  description?: string;
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

export function KpiCard({ label, value, prefix, change, changeLabel, color = "default", description }: KpiCardProps) {
  const isPositive = change !== null && change !== undefined && change > 0;
  const isNegative = change !== null && change !== undefined && change < 0;

  return (
    <div className="flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-[#E6EAF0] bg-white p-5">
      <p className="mb-1 truncate text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
        {label}
      </p>
      <p
        className={`min-w-0 font-mono font-bold tabular-nums ${colorMap[color]}`}
        style={{ fontSize: "clamp(0.75rem, 1.5vw + 0.5rem, 1.5rem)" }}
        title={typeof value === "string" || typeof value === "number" ? String(formatDisplay(value, prefix)) : undefined}
      >
        {formatDisplay(value, prefix)}
      </p>
      {description && (
        <p className="mt-1.5 text-[10px] leading-tight text-neutral-500">
          {description}
        </p>
      )}
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
