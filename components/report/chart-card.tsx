"use client";

import React from "react"

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#E6EAF0] bg-white p-5">
      <div className="mb-4">
        <h3 className="text-xs font-bold text-neutral-800">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11px] text-neutral-400">{subtitle}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
