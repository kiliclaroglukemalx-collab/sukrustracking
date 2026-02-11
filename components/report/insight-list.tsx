"use client";

import { AlertTriangle, Lightbulb } from "lucide-react";

interface InsightListProps {
  title: string;
  items: string[];
  type: "risk" | "action";
}

export function InsightList({ title, items, type }: InsightListProps) {
  const Icon = type === "risk" ? AlertTriangle : Lightbulb;
  const iconColor = type === "risk" ? "text-amber-500" : "text-[#1E5EFF]";
  const dotColor = type === "risk" ? "bg-amber-400" : "bg-[#1E5EFF]";

  return (
    <div className="flex flex-col rounded-2xl border border-[#E6EAF0] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.5} />
        <h3 className="text-xs font-bold text-neutral-800">{title}</h3>
      </div>
      <ul className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColor}`} />
            <span className="text-[12px] leading-relaxed text-neutral-600">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
