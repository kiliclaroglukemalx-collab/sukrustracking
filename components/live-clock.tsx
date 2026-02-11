"use client";

import { useState, useEffect } from "react";

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return <div className="h-8" />;

  const dayName = now.toLocaleDateString("tr-TR", { weekday: "long" });
  const day = now.getDate();
  const month = now.toLocaleDateString("tr-TR", { month: "long" });
  const year = now.getFullYear();

  const time = now.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
        {dayName}
      </span>
      <span className="text-[13px] font-medium text-neutral-700">
        {day} {month} {year}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-neutral-400">
        {time}
      </span>
    </div>
  );
}
